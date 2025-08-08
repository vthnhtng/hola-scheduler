import { PrismaClient, Program, Category, Lecturer, Location } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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
type ClassSchedule = { classId: number; schedule: Record<string, DaySchedule> };

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
            console.error('firstWeekDays:', firstWeekDays, 'day:', day);
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
 * Main function to generate schedules for a list of teams
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
export async function generateSchedulesForTeams(teams: Team[], startDate: Date): Promise<ClassSchedule[]> {
    if (teams.length === 0) return [];

    const subjectMap = await buildSubjectMap();
    const holidays = await getHolidayDates(startDate, new Date(startDate.getFullYear(), 11, 31));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 20);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    let breakDays = holidays.size;
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        if (currentDate.getDay() === 0) breakDays++;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    const teamQueues: {
        team: Team;
        subjectQueue: Subject[];
        schedule: Record<string, DaySchedule>;
        breakCount: number;
        totalBreaks: number;
    }[] = [];
    for (const team of teams) {
        const curriculum = await prisma.curriculum.findFirst({
            where: { program: team.program },
            include: { subjects: true },
        });
        if (!curriculum) throw new Error(`No curriculum found for program ${team.program}`);
        const subjectRefs = curriculum.subjects
            .map(cs => subjectMap.get(cs.subjectId))
            .filter((s): s is Subject => !!s);
        const totalSlots = (totalDays - breakDays) * 3;
        const requiredBreaks = Math.max(0, totalSlots - subjectRefs.length);
        const shuffledSubjects = shuffleSubjects(subjectRefs);
        const sortedSubjects = await topologicalSort(shuffledSubjects, subjectMap);
        const schedule: Record<string, DaySchedule> = {};
        let subjectQueue = [...sortedSubjects];
        let breakCount = 0;
        let previousSubject: Subject | null = null;
        let currentDate = new Date(startDate);
        if (currentDate.getDay() === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        while ((subjectQueue.length > 0 || breakCount < requiredBreaks) && currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'short' }) as DayOfWeek;
            const dayMap: Record<string, DayOfWeek> = {
                Sun: 'Sun', Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat'
            };
            const day = dayMap[dayOfWeek];
            if (day === 'Sun') {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }
            if (holidays.has(dateKey)) {
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
                    continue;
                }
                let idx = subjectQueue.findIndex(s => !previousSubject || s.category !== previousSubject.category);
                if (idx === -1) idx = 0;
                if (subjectQueue.length > 0) {
                    const subject = subjectQueue.splice(idx, 1)[0];
                    schedule[dateKey][slot] = subject;
                    previousSubject = subject;
                } else if (breakCount < requiredBreaks) {
                    schedule[dateKey][slot] = 'BREAK';
                    breakCount++;
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
        // Generate schedules
        const schedules = await generateSchedulesForTeams(teams, startDate);
        
        // Calculate end date from actual schedule data
        let endDate = startDate;
        if (schedules.length > 0) {
            const allDates = schedules.flatMap(s => Object.keys(s.schedule));
            if (allDates.length > 0) {
                const latestDate = allDates.sort().pop();
                endDate = latestDate ? new Date(latestDate) : startDate;
            }
        }
        
        await writeSchedulesToFile(startDate, endDate, schedules);
        // Get all generated files from team directories
        for (const team of teams) {
            const teamScheduleDir = path.join(process.cwd(), 'resource', 'schedules', `team${team.id}`, 'scheduled');
            if (fs.existsSync(teamScheduleDir)) {
                const files = fs.readdirSync(teamScheduleDir)
                    .filter(f => f.startsWith('week_') && f.endsWith('.json'));
                processedFiles.push(...files.map(f => `team${team.id}_${f}`));
            }
        }
        return { processedFiles, errors };
    } catch (error) {
        console.error('Error generating schedules:', error);
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        return { processedFiles, errors };
    }
}

async function writeSchedulesToFile(startDate: Date, endDate: Date, schedules: ClassSchedule[]) {
    // Group by team and week
    const teamWeekMap: { [teamId: number]: { [week: number]: any[] } } = {};

    for (const { classId, schedule } of schedules) {
        if (!teamWeekMap[classId]) {
            teamWeekMap[classId] = {};
        }

        for (const [dateString, daySchedule] of Object.entries(schedule)) {
            const currentDate = new Date(dateString);
            
            // Calculate week number based on the logic:
            // Week 1: From startDate to end of that week (Saturday)
            // Week 2+: Full weeks from Monday to Saturday
            let week: number;
            
            // Get the Saturday of the first week (Saturday = 6 in JS)
            const firstSaturday = new Date(startDate);
            const startDay = startDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            let daysToSaturday: number;
            if (startDay === 0) { // Sunday
                daysToSaturday = 6; // 6 days to Saturday
            } else if (startDay === 6) { // Already Saturday
                daysToSaturday = 0;
            } else {
                daysToSaturday = 6 - startDay; // Days until Saturday
            }
            firstSaturday.setDate(startDate.getDate() + daysToSaturday);
            
            if (currentDate <= firstSaturday) {
                week = 1;
            } else {
                // Calculate weeks from the Monday after first Saturday
                const firstMondayAfter = new Date(firstSaturday);
                firstMondayAfter.setDate(firstSaturday.getDate() + 2); // Saturday + 2 = Monday (skip Sunday)
                
                const daysDiff = Math.floor((currentDate.getTime() - firstMondayAfter.getTime()) / (24 * 60 * 60 * 1000));
                week = Math.floor(daysDiff / 7) + 2; // +2 because we start from week 2
            }
            
            if (!teamWeekMap[classId][week]) teamWeekMap[classId][week] = [];
            const seen = new Set<string>();

            const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'short' }) as DayOfWeek;
            const dayMap: Record<string, DayOfWeek> = {
                Sun: 'Sun', Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat'
            };
            const day = dayMap[dayOfWeek];

            for (const slot of daySlotOrder) {
                if (shouldSkipSlot(day, slot)) continue;
                const sessionValue = daySchedule[slot];
                const key = `${classId}-${dateString}-${slot}`;
                if (seen.has(key)) continue;
                seen.add(key);

                teamWeekMap[classId][week].push({
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

    // Write files for each team
    for (const [teamIdStr, weekData] of Object.entries(teamWeekMap)) {
        const teamId = Number(teamIdStr);
        const teamDir = path.join(process.cwd(), 'resource', 'schedules', `team${teamId}`, 'scheduled');
        fs.mkdirSync(teamDir, { recursive: true });

        for (const [weekStr, data] of Object.entries(weekData)) {
            if (!data.length) continue;
            const week = Number(weekStr);
            
            // Calculate proper week start and end dates based on week number
            let weekStart: Date, weekEnd: Date;
            
            if (week === 1) {
                // Week 1: from startDate to first Saturday
                weekStart = new Date(startDate);
                weekEnd = new Date(startDate);
                const startDay = startDate.getDay();
                const daysToSaturday = startDay === 0 ? 6 : (startDay === 6 ? 0 : 6 - startDay);
                weekEnd.setDate(startDate.getDate() + daysToSaturday);
            } else {
                // Week 2+: full weeks from Monday to Saturday
                const firstSaturday = new Date(startDate);
                const startDay = startDate.getDay();
                const daysToSaturday = startDay === 0 ? 6 : (startDay === 6 ? 0 : 6 - startDay);
                firstSaturday.setDate(startDate.getDate() + daysToSaturday);
                
                const firstMondayAfter = new Date(firstSaturday);
                firstMondayAfter.setDate(firstSaturday.getDate() + 2);
                
                weekStart = new Date(firstMondayAfter);
                weekStart.setDate(firstMondayAfter.getDate() + (week - 2) * 7);
                
                weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 5); 
            }
            
            const fileName = `week_${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}.json`;
            const filePath = path.join(teamDir, fileName);
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        }
    }
}