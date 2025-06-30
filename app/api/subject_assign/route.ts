import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Types from Prisma schema
type Category = 'CT' | 'QS';
type Program = 'DH' | 'CD';

type DaySlot = 'morning' | 'afternoon' | 'evening';
type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

interface SubjectDto {
    id: number;
    name: string;
    category: Category;
    prerequisiteId: number | null;
}

interface Team {
    id: number;
    name: string;
    program: Program;
    universityId: number;
    teamLeaderId: number;
}

interface Holiday {
    id: number;
    date: string;
}

type DaySchedule = Partial<Record<DaySlot, SubjectDto | 'BREAK'>>;
type ClassSchedule = { classId: number; schedule: Record<string, DaySchedule> };

function shouldSkipSlot(day: DayOfWeek, slot: DaySlot): boolean {
    return day === 'Sun';
}

function shuffleSubjects(subjects: SubjectDto[]): SubjectDto[] {
    return subjects.sort(() => Math.random() - 0.5);
}

async function topologicalSort(subjects: SubjectDto[], subjectMap: Map<number, SubjectDto>): Promise<SubjectDto[]> {
    const visited = new Set<number>();
    const result: SubjectDto[] = [];
    function visit(subject: SubjectDto) {
        if (visited.has(subject.id)) return;
        if (subject.prerequisiteId) {
            const prereq = subjectMap.get(subject.prerequisiteId);
            if (prereq) visit(prereq);
        }
        visited.add(subject.id);
        result.push(subject);
    }
    subjects.forEach(visit);
    return result;
}

async function buildSubjectMap(subjects: SubjectDto[]): Promise<Map<number, SubjectDto>> {
    const map = new Map<number, SubjectDto>();
    subjects.forEach(subject => {
        map.set(subject.id, subject);
    });
    return map;
}

async function getHolidayDates(startDate: Date, endDate: Date, holidays: Holiday[]): Promise<Set<string>> {
    const startStr = toLocalISO(startDate);
    const endStr = toLocalISO(endDate);
    return new Set(
        holidays
            .filter(h => h.date >= startStr && h.date <= endStr)
            .map(h => h.date)
    );
}

function toLocalISO(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export async function generateSchedulesForTeams(
    teams: Team[],
    subjects: SubjectDto[],
    startDate: Date,
    endDate: Date,
    holidays: Holiday[]
): Promise<ClassSchedule[]> {
    const daySlotOrder: DaySlot[] = ['morning', 'afternoon', 'evening'];

    if (teams.length === 0) return [];
    const subjectMap = await buildSubjectMap(subjects);

    let holidaysSet = new Set<string>();
    if (holidays.length > 0) {
        holidaysSet = await getHolidayDates(startDate, endDate, holidays);
    }
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    let breakDays = holidaysSet.size;
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        if (currentDate.getDay() === 0) breakDays++;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    const teamQueues: {
        team: Team;
        subjectQueue: SubjectDto[];
        schedule: Record<string, DaySchedule>;
        breakCount: number;
        totalBreaks: number;
    }[] = [];
    for (const team of teams) {
        const subjectRefs = [...subjects];
        const totalSlots = (totalDays - breakDays) * 3;
        const requiredBreaks = Math.max(0, totalSlots - subjectRefs.length);
        const shuffledSubjects = shuffleSubjects(subjectRefs);
        const sortedSubjects = await topologicalSort(shuffledSubjects, subjectMap);
        const schedule: Record<string, DaySchedule> = {};
        let subjectQueue = [...sortedSubjects];
        let breakCount = 0;
        let previousSubject: SubjectDto | null = null;
        let currentDate = new Date(startDate);

        console.log(currentDate);
        if (currentDate.getDay() === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        while ((subjectQueue.length > 0 || breakCount < requiredBreaks) && currentDate <= endDate) {
            const dateKey = toLocalISO(currentDate);
            const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'short' }) as DayOfWeek;
            const dayMap: Record<string, DayOfWeek> = {
                Sun: 'Sun', Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat'
            };
            const day = dayMap[dayOfWeek];
            if (day === 'Sun') {
                console.log(`[TRACE] Skip Sunday: ${dateKey}`);
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }
            if (holidaysSet.has(dateKey)) {
                console.log(`[TRACE] Skip holiday: ${dateKey}`);
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }
            if (!schedule[dateKey]) schedule[dateKey] = {};
            for (const slot of daySlotOrder) {
                if (shouldSkipSlot(day, slot)) continue;
                if (schedule[dateKey][slot]) continue;
                if ((day === 'Sat' || (slot === 'evening' && breakCount < requiredBreaks)) && breakCount < requiredBreaks) {
                    schedule[dateKey][slot] = 'BREAK';
                    breakCount++;
                    console.log(`[TRACE] Team ${team.id} ${dateKey} ${slot}: BREAK (${breakCount}/${requiredBreaks})`);
                    continue;
                }
                let idx = subjectQueue.findIndex(s => !previousSubject || s.category !== previousSubject.category);
                if (idx === -1) idx = 0;
                if (subjectQueue.length > 0) {
                    const subject = subjectQueue.splice(idx, 1)[0];
                    schedule[dateKey][slot] = subject;
                    console.log(`[TRACE] Team ${team.id} ${dateKey} ${slot}: ${subject.name} (category: ${subject.category})`);
                    previousSubject = subject;
                } else if (breakCount < requiredBreaks) {
                    schedule[dateKey][slot] = 'BREAK';
                    breakCount++;
                    console.log(`[TRACE] Team ${team.id} ${dateKey} ${slot}: BREAK (${breakCount}/${requiredBreaks})`);
                } else {
                    console.log(`[TRACE] Team ${team.id} ${dateKey} ${slot}: EMPTY (no subject, no break left)`);
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        teamQueues.push({
            team,
            subjectQueue: [],
            schedule,
            breakCount,
            totalBreaks: requiredBreaks,
        });
    }
    return teamQueues.map(tq => ({ classId: tq.team.id, schedule: tq.schedule }));
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { startDate, endDate } = body;

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            );
        }

        const curriculum = await prisma.curriculum.findFirst({where: {program: 'DH'}});
        const curriculumSubjects = await prisma.curriculumSubject.findMany({
            where: {
                curriculumId: curriculum?.id
            }
        });

        const subjects = await prisma.subject.findMany({
            where: {
                id: { in: curriculumSubjects.map(subject => subject.subjectId) }
            }
        });

        const mappedSubjects: SubjectDto[] = subjects.map(subject => ({
            id: subject.id,
            name: subject.name,
            category: subject.category,
            prerequisiteId: subject.prerequisiteId ?? null
        }));

        const holidays = await prisma.holiday.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        console.log(holidays);

        const teams = await prisma.team.findMany({
            where: {
                universityId: 1
            }
        });

        const startDataStandardlized = new Date(startDate);
        const endDataStandardlized = new Date(endDate);

        const schedules = await generateSchedulesForTeams(teams, mappedSubjects, startDataStandardlized, endDataStandardlized, holidays);

        return NextResponse.json({
            success: true,
            schedules
        });
    } catch (error) {
        console.error('Failed to generate schedules:', error);
        return NextResponse.json(
            { error: 'Failed to generate schedules' },
            { status: 500 }
        );
    }
}