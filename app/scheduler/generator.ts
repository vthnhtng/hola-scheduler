import { PrismaClient, Program, Category, Lecturer, Location } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

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
    universityId: number;
}

type DaySlot = 'morning' | 'afternoon' | 'evening';
type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

interface Holiday {
    date: string;
}

type DaySchedule = Partial<Record<DaySlot, Subject | 'BREAK'>>;
type WeekSchedule = Record<number, Record<DayOfWeek, DaySchedule>>;
type ClassSchedule = { classId: number; schedule: WeekSchedule };

interface JobResult {
    processedFiles: string[];
    errors: string[];
}

const daySlotOrder: DaySlot[] = ['morning', 'afternoon', 'evening'];

const lecturerUsage = new Map<string, Set<number>>();

const getSlotKey = (date: string, session: string): string => 
    `${date}-${session}`;

const isLecturerAvailable = (date: string, session: string, lecturerId: number): boolean => {
    const slotKey = getSlotKey(date, session);
    return !lecturerUsage.get(slotKey)?.has(lecturerId);
};

const markLecturerUsed = (date: string, session: string, lecturerId: number): void => {
    const slotKey = getSlotKey(date, session);
    if (!lecturerUsage.has(slotKey)) {
        lecturerUsage.set(slotKey, new Set());
    }
    lecturerUsage.get(slotKey)!.add(lecturerId);
};

/* --- Utils --- */

/**
 * Gets holiday dates from the database for a given date range
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @returns Set of holiday dates in YYYY-MM-DD format
 */
async function getHolidayDates(startDate: Date, endDate: Date): Promise<Set<string>> {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const holidays = await prisma.holiday.findMany({
        where: {
            date: {
                gte: startStr,
                lte: endStr
            }
        },
        select: {
            date: true
        }
    });

    return new Set(holidays.map(h => h.date));
}

function initEmptySchedule(weekCount: number, startDate: Date): WeekSchedule {
    const schedule: WeekSchedule = {};
    for (let week = 1; week <= weekCount; week++) {
        schedule[week] = {} as Record<DayOfWeek, DaySchedule>;
        const orderedDays = week === 1
            ? getFirstWeekDays(startDate)
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (const day of orderedDays) {
            schedule[week][day as DayOfWeek] = {};
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
    if (week === 1) {
        const firstWeekDays = getFirstWeekDays(startDate);
        if (!firstWeekDays.includes(day)) {
            throw new Error(`Invalid day for week 1: ${day}`);
        }
        const dayIndex = firstWeekDays.indexOf(day);
        const result = new Date(startDate);
        result.setDate(startDate.getDate() + dayIndex);
        return result;
    } else {
        const firstMonday = new Date(startDate);
        const startDay = firstMonday.getDay();
        const diff = startDay === 0 ? 6 : startDay - 1;
        firstMonday.setDate(startDate.getDate() - diff + 7 * (week - 1));

        const dayOffset: Record<DayOfWeek, number> = {
            Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6
        };
        const result = new Date(firstMonday);
        result.setDate(firstMonday.getDate() + dayOffset[day]);
        return result;
    }
}

/**
 * Generates schedules for a list of teams
 * @param teams - Array of teams to generate schedules for
 * @param startDate - The start date for the schedule generation
 * @returns Array of class schedules with week schedules for each team
 * 
 * Process:
 * 1. Get curriculum and subjects for the program
 * 2. Sort subjects based on prerequisites
 * 3. Calculate total slots needed and weeks required
 * 4. For each team:
 *    - Create empty schedule
 *    - Add breaks based on priority
 *    - Fill in subjects while respecting constraints
 */
async function generateSchedulesForTeams(teams: Team[], startDate: Date): Promise<ClassSchedule[]> {
    console.log('Starting generateSchedulesForTeams with teams:', teams);
    if (teams.length === 0) return [];

    const program = teams[0].program;
    console.log('Program:', program);
    const subjectMap = await buildSubjectMap();
    console.log('Subject map size:', subjectMap.size);

    // Get curriculum and subjects for the program
    const curriculum = await prisma.curriculum.findFirst({
        where: { program },
        include: { subjects: true },
    });
    console.log('Found curriculum:', curriculum);
    if (!curriculum) throw new Error('No curriculum found for this program.');

    // Map and filter valid subjects
    const subjectRefs = curriculum.subjects
        .map(cs => subjectMap.get(cs.subjectId))
        .filter((s): s is Subject => !!s);
    console.log('Valid subjects:', subjectRefs.length);

    // Sort subjects based on prerequisites
    const sortedSubjects = await topologicalSort(shuffleSubjects(subjectRefs), subjectMap);
    console.log('Sorted subjects:', sortedSubjects.length);

    // Calculate schedule parameters
    const totalSubjects = sortedSubjects.length;
    const slotsPerSubject = 2;
    const totalSlots = totalSubjects * slotsPerSubject;
    const slotsPerWeek = 15;
    const weekCount = Math.ceil(totalSlots / slotsPerWeek);
    console.log('Schedule parameters:', { totalSubjects, slotsPerSubject, totalSlots, slotsPerWeek, weekCount });

    const holidays = await getHolidayDates(startDate, new Date(startDate.getFullYear(), 11, 31));
    console.log('Holidays:', holidays.size);
    const schedules: ClassSchedule[] = [];
    const breaksPerWeekOptions = [3, 4];

    function getBreakPriority(day: DayOfWeek, slot: DaySlot): number {
        if (day === 'Wed' && slot === 'evening') return 4;
        if (day === 'Sat' && slot === 'afternoon') return 3;
        if (day === 'Sat' && slot === 'morning') return 2;
        if (slot === 'evening') return 1;
        return 0;
    }

    for (const team of teams) {
        // Reset queue môn học cho từng lớp
        const teamSubjectQueue = await topologicalSort(
            shuffleSubjects(subjectRefs), subjectMap
        );
        const schedule = initEmptySchedule(weekCount, startDate);
        const globalSchedule = new Map<string, Subject>();

        for (let week = 1; week <= weekCount; week++) {
            let breakCount = 0;
            const totalBreaks = breaksPerWeekOptions[Math.floor(Math.random() * breaksPerWeekOptions.length)];

            const orderedDays = week === 1
                ? getFirstWeekDays(startDate)
                : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as DayOfWeek[];

            const allSlots: Array<{ day: DayOfWeek, slot: DaySlot }> = [];
            for (const day of orderedDays) {
                for (const slot of daySlotOrder) {
                    if (shouldSkipSlot(day, slot)) continue;
                    allSlots.push({ day, slot });
                }
            }

            allSlots.sort((a, b) => {
                return getBreakPriority(b.day, b.slot) - getBreakPriority(a.day, a.slot);
            });

            for (const { day, slot } of allSlots) {
                if (breakCount >= totalBreaks) break;

                const currentDate = getDateOfWeekAndDay(startDate, week, day);
                const dateString = currentDate.toISOString().split('T')[0];

                if (holidays.has(dateString) || schedule[week][day][slot]) continue;

                schedule[week][day][slot] = 'BREAK';
                breakCount++;
            }

            let previousSubject: Subject | null = null;
            for (const day of orderedDays) {
                for (const slot of daySlotOrder) {
                    if (shouldSkipSlot(day, slot)) continue;
                    if (schedule[week][day][slot]) continue;

                    const currentDate = getDateOfWeekAndDay(startDate, week, day);
                    const dateString = currentDate.toISOString().split('T')[0];
                    const key = `${team.id}-${dateString}-${slot}`;

                    if (holidays.has(dateString) || schedule[week][day][slot] === 'BREAK') continue;

                    let inserted = false;
                    for (let i = 0; i < teamSubjectQueue.length; i++) {
                        const candidate = teamSubjectQueue[i];
                        if (isValidSubjectForSlot(candidate, previousSubject, globalSchedule)) {
                            schedule[week][day][slot] = candidate;
                            previousSubject = candidate;
                            globalSchedule.set(key, candidate);
                            teamSubjectQueue.splice(i, 1); // pop ra khỏi queue
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

/**
 * Main job function to generate schedules
 * @param startDate - The start date for schedule generation
 * @param teams - Array of teams to generate schedules for
 * @returns JobResult containing processed files and any errors
 */
export async function generateSchedulesForTeamsJob(startDate: Date, teams: Team[]): Promise<JobResult> {
    const processedFiles: string[] = [];
    const errors: string[] = [];

    try {
        if (teams.length === 0) {
            return {
                processedFiles,
                errors: ['No teams provided for schedule generation']
            };
        }

        // Set specific date range
        const endDate = new Date('2025-05-24');
        startDate = new Date('2025-05-19');

        // Get unique university IDs from teams
        const universityIds = [...new Set(teams.map(team => team.universityId))];

        // Update university status to Processing
        await prisma.$executeRaw`
            UPDATE universities 
            SET status = 'Done' 
            WHERE id IN (${Prisma.join(universityIds)})
        `;

        // Generate schedules
        const schedules = await generateSchedulesForTeams(teams, startDate);
        await writeSchedulesToFile(startDate, endDate, schedules);

        // Get all generated files
        const scheduleDir = path.join(process.cwd(), 'schedules');
        const files = fs.readdirSync(scheduleDir)
            .filter(f => f.startsWith('week_') && f.endsWith('.json'));

        processedFiles.push(...files);

        return { processedFiles, errors };
    } catch (error) {
        console.error('Error generating schedules:', error);
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        return { processedFiles, errors };
    }
}

async function writeSchedulesToFile(startDate: Date, endDate: Date, schedules: ClassSchedule[]) {
    const baseDir = path.join(process.cwd(), 'schedules', 'scheduled');
    fs.mkdirSync(baseDir, { recursive: true });

    // Group by week
    const weekMap: { [week: number]: any[] } = {};

    for (const { classId, schedule } of schedules) {
        for (const [weekStr, weekSchedule] of Object.entries(schedule)) {
            const week = Number(weekStr);
            if (!weekMap[week]) weekMap[week] = [];
            const seen = new Set<string>();

            for (const [day, daySchedule] of Object.entries(weekSchedule)) {
                for (const slot of daySlotOrder) {
                    if (shouldSkipSlot(day as DayOfWeek, slot)) continue;
                    const currentDate = getDateOfWeekAndDay(startDate, week, day as DayOfWeek);
                    const dateString = currentDate.toISOString().split('T')[0];
                    const sessionValue = daySchedule[slot];
                    const key = `${classId}-${dateString}-${slot}`;
                    if (seen.has(key)) continue;
                    seen.add(key);

                    weekMap[week].push({
                        week,
                        teamId: classId,
                        subjectId: sessionValue === 'BREAK' || !sessionValue ? null : (sessionValue as Subject).id,
                        date: dateString,
                        dayOfWeek: day,
                        session: slot,
                        lecturerId: null,
                        locationId: null
                    });
                }
            }
        }
    }

    // Write each week to a separate file
    for (const [weekStr, data] of Object.entries(weekMap)) {
        if (!data.length) continue;
        const week = Number(weekStr);
        const weekStart = getDateOfWeekAndDay(startDate, week, 'Mon');
        const weekEnd = getDateOfWeekAndDay(startDate, week, 'Sat');
        const fileName = `week_${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}.json`;
        const filePath = path.join(baseDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
}