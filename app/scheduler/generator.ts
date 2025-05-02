import prisma from '@/lib/prisma';
import { Program, Category } from '@prisma/client';
import fs from 'fs';
import path from 'path';

interface Subject {
    id: number;
    name: string;
    category: Category;
    prerequisiteId?: number;
}

interface Team {
    id: number;
    name: string;
    program: Program;
}

type DaySlot = 'morning' | 'afternoon' | 'evening';
type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

interface Holiday {
    date: string;
}

type DaySchedule = Partial<Record<DaySlot, Subject | 'BREAK'>>;
type WeekSchedule = Record<number, Record<DayOfWeek, DaySchedule>>;
type ClassSchedule = { classId: number; schedule: WeekSchedule };

const daySlotOrder: DaySlot[] = ['morning', 'afternoon', 'evening'];

/* --- Utils --- */

async function getHolidayDates(startDate: Date, endDate: Date): Promise<Set<string>> {
    const year = startDate.getFullYear();
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/VN`);
    if (!res.ok) throw new Error('Failed to fetch holidays');
    const data: Holiday[] = await res.json();
    return new Set(data.map(h => h.date));
}

function initEmptySchedule(weekCount: number, startDate: Date): WeekSchedule {
    const schedule: WeekSchedule = {};
    for (let week = 1; week <= weekCount; week++) {
        schedule[week] = {} as Record<DayOfWeek, DaySchedule>;
        const orderedDays = week === 1 
            ? getFirstWeekDays(startDate) 
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (const day of orderedDays) {
            schedule[week][day] = {};
        }
    }
    return schedule;
}

function shouldSkipSlot(day: DayOfWeek, slot: DaySlot): boolean {
    return (day === 'Sat' && slot === 'evening') || day === 'Sun';
}

function isValidSubjectForSlot(subject: Subject, previous: Subject | null, globalSchedule: Map<string, Subject>): boolean {
    if ([...globalSchedule.values()].some(s => s.id === subject.id)) return false;
    if (previous && previous.category === subject.category) return false;
    return true;
}

function shuffleSubjects(subjects: Subject[]): Subject[] {
    return subjects.sort(() => Math.random() - 0.5);
}

async function topologicalSort(subjects: Subject[], subjectMap: Map<number, Subject>): Promise<Subject[]> {
    const visited = new Set<number>();
    const result: Subject[] = [];

    function visit(subject: Subject) {
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

async function buildSubjectMap(): Promise<Map<number, Subject>> {
    const subjects = await prisma.subject.findMany();
    const map = new Map<number, Subject>();
    subjects.forEach(subject => {
        map.set(subject.id, {
            id: subject.id,
            name: subject.name,
            category: subject.category,
            prerequisiteId: subject.prerequisiteId ?? undefined,
        });
    });
    return map;
}

function getFirstWeekDays(startDate: Date): DayOfWeek[] {
    const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startDayIndex = startDate.getDay();
    const firstWeekDays: DayOfWeek[] = [];
    
    for (let i = startDayIndex; i < 7; i++) {
        const day = days[i];
        if (day !== 'Sun') firstWeekDays.push(day);
    }
    return firstWeekDays;
}

function getDateOfWeekAndDay(startDate: Date, week: number, day: DayOfWeek): Date {
    // Tuần đầu tiên: Bắt đầu từ startDate
    if (week === 1) {
        const firstWeekDays = getFirstWeekDays(startDate);
        if (!firstWeekDays.includes(day)) {
            throw new Error(`Invalid day for week 1: ${day}`);
        }
        const dayIndex = firstWeekDays.indexOf(day);
        const result = new Date(startDate);
        result.setDate(startDate.getDate() + dayIndex);
        return result;
    }
    // Các tuần sau: Bắt đầu từ thứ Hai tiếp theo
    else {
        const firstMonday = new Date(startDate);
        const startDay = firstMonday.getDay();
        const diff = startDay === 0 ? 6 : startDay - 1;
        firstMonday.setDate(startDate.getDate() - diff + 7 * (week - 1));

        const dayOffset: Record<DayOfWeek, number> = {
            Mon: 0,
            Tue: 1,
            Wed: 2,
            Thu: 3,
            Fri: 4,
            Sat: 5,
            Sun: 6
        };
        const result = new Date(firstMonday);
        result.setDate(firstMonday.getDate() + dayOffset[day]);
        return result;
    }
}

async function writeSchedulesToFile(startDate: Date, endDate: Date, schedules: ClassSchedule[]) {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const fileName = `scheduler_${startStr}_${endStr}.txt`;
    const filePath = path.join(process.cwd(), 'schedules', fileName);

    let content = '';

    for (const { classId, schedule } of schedules) {
        content += `Class ID: ${classId}\n`;
        for (const [weekStr, days] of Object.entries(schedule)) {
            const week = Number(weekStr);
            content += `  Week ${week}:\n`;

            const orderedDays = week === 1 
                ? getFirstWeekDays(startDate) 
                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            for (const day of orderedDays) {
                content += `    ${day}:\n`;
                const daySchedule = days[day] || {};

                for (const slot of daySlotOrder) {
                    const currentDate = getDateOfWeekAndDay(startDate, week, day);
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const subject = daySchedule[slot];
                    
                    const displayText = subject 
                        ? (subject === 'BREAK' ? 'BREAK' : subject.name)
                        : 'FREE';

                    content += `      ${slot} (${dateStr}): ${displayText}\n`;
                }
            }
        }
        content += '\n';
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
}

export async function generateSchedulesForTeams(teams: Team[], startDate: Date): Promise<ClassSchedule[]> {
    if (teams.length === 0) return [];

    const program = teams[0].program;
    const subjectMap = await buildSubjectMap();

    const curriculum = await prisma.curriculum.findFirst({
        where: { program },
        include: { subjects: true },
    });
    if (!curriculum) throw new Error('No curriculum found for this program.');

    const subjectRefs = curriculum.subjects
        .map(cs => subjectMap.get(cs.subjectId))
        .filter((s): s is Subject => !!s);

    const sortedSubjects = await topologicalSort(shuffleSubjects(subjectRefs), subjectMap);

    const totalSubjects = sortedSubjects.length;
    const slotsPerSubject = 2;
    const totalSlots = totalSubjects * slotsPerSubject;
    const slotsPerWeek = 15;
    const weekCount = Math.ceil(totalSlots / slotsPerWeek);

    const holidays = await getHolidayDates(startDate, new Date(startDate.getFullYear(), 11, 31));
    const schedules: ClassSchedule[] = [];
    const breaksPerWeekOptions = [3, 4];

    for (const team of teams) {
        const subjectQueue = [...sortedSubjects];
        const schedule = initEmptySchedule(weekCount, startDate);
        const globalSchedule = new Map<string, Subject>();

        for (let week = 1; week <= weekCount; week++) {
            let breakCount = 0;
            let previousSubject: Subject | null = null;
            const totalBreaks = breaksPerWeekOptions[Math.floor(Math.random() * breaksPerWeekOptions.length)];

            const orderedDays = week === 1 
                ? getFirstWeekDays(startDate) 
                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            for (const day of orderedDays) {
                for (const slot of daySlotOrder) {
                    if (shouldSkipSlot(day, slot)) continue;

                    const currentDate = getDateOfWeekAndDay(startDate, week, day);
                    const dateString = currentDate.toISOString().split('T')[0];

                    if (holidays.has(dateString)) {
                        schedule[week][day][slot] = 'BREAK';
                        continue;
                    }

                    const key = `${team.id}-${week}-${day}-${slot}`;

                    if (breakCount < totalBreaks && (day === 'Wed' && slot === 'evening' || Math.random() < 0.15)) {
                        schedule[week][day][slot] = 'BREAK';
                        breakCount++;
                        continue;
                    }

                    let inserted = false;
                    for (let i = 0; i < subjectQueue.length; i++) {
                        const candidate = subjectQueue[i];
                        if (isValidSubjectForSlot(candidate, previousSubject, globalSchedule)) {
                            schedule[week][day][slot] = candidate;
                            previousSubject = candidate;
                            globalSchedule.set(key, candidate);
                            subjectQueue.splice(i, 1);
                            inserted = true;
                            break;
                        }
                    }

                    if (!inserted && breakCount < totalBreaks) {
                        schedule[week][day][slot] = 'BREAK';
                        breakCount++;
                    }
                }
            }
        }
        schedules.push({ classId: team.id, schedule });
    }

    const endDate = getDateOfWeekAndDay(startDate, weekCount, 'Sat');
    await writeSchedulesToFile(startDate, endDate, schedules);

    return schedules;
}