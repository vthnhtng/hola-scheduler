// import prisma from '@/lib/prisma.ts';
// import { Program, Category } from '@prisma/client';

// // Subject model
// interface Subject {
//     id: number;
//     name: string;
//     category: Category;
//     prerequisiteId?: number;
// }

// // Team (Class) model
// interface Team {
//     id: number;
//     name: string;
//     program: Program;
// }

// // Define available day slots and days of the week
// type DaySlot = 'morning' | 'afternoon' | 'evening';
// type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

// // Schedule types
// type DaySchedule = Partial<Record<DaySlot, Subject | 'BREAK'>>;
// type WeekSchedule = Record<number, Record<DayOfWeek, DaySchedule>>;
// type ClassSchedule = { classId: number; schedule: WeekSchedule };

// // Utility: check if a given slot should be skipped
// function shouldSkipSlot(day: DayOfWeek, slot: DaySlot): boolean {
//     return day === 'Sat' || (day === 'Wed' && slot === 'evening');
// }

// // Utility: validate if a subject can be placed in a slot
// function isValidSubjectForSlot(
//     subject: Subject,
//     previous: Subject | null,
//     day: DayOfWeek,
//     slot: DaySlot,
//     globalSchedule: Map<string, Subject>
// ): boolean {
//     for (const sub of globalSchedule.values()) {
//         if (sub.id === subject.id) return false;
//     }
//     if (previous && previous.category === subject.category && subject.category !== null) {
//         return false;
//     }
//     return true;
// }

// // Utility: shuffle subjects while roughly preserving their order
// function shufflePreserveOrder(subjects: Subject[]): Subject[] {
//     return [...subjects].sort(() => Math.random() - 0.5);
// }

// // Create an empty schedule with dynamic weeks
// function initEmptySchedule(weeks: number): WeekSchedule {
//     const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//     const schedule: WeekSchedule = {};
//     for (let week = 1; week <= weeks; week++) {
//         schedule[week] = {} as Record<DayOfWeek, DaySchedule>;
//         for (const day of days) {
//             schedule[week][day] = {};
//         }
//     }
//     return schedule;
// }

// // Build a map of subjects for faster lookup
// async function buildSubjectMap(): Promise<Map<number, Subject>> {
//     const subjects = await prisma.subject.findMany();
//     const map = new Map<number, Subject>();
//     for (const s of subjects) {
//         map.set(s.id, {
//             id: s.id,
//             name: s.name,
//             category: s.category,
//             prerequisiteId: s.prerequisiteId ?? undefined,
//         });
//     }
//     return map;
// }

// // Topological sort to respect prerequisite chains
// async function topologicalSort(subjects: Subject[], subjectMap: Map<number, Subject>): Promise<Subject[]> {
//     const visited = new Set<number>();
//     const result: Subject[] = [];

//     function visit(subject: Subject) {
//         if (visited.has(subject.id)) return;
//         if (subject.prerequisiteId) {
//             const prereq = subjectMap.get(subject.prerequisiteId);
//             if (prereq) visit(prereq);
//         }
//         visited.add(subject.id);
//         result.push(subject);
//     }

//     subjects.forEach(visit);
//     return result;
// }

// // Main function to generate schedules for multiple teams (classes)
// export async function generateSchedulesForTeams(teams: Team[]): Promise<ClassSchedule[]> {
//     if (teams.length === 0) return [];

//     const program = teams[0].program;
//     const subjectMap = await buildSubjectMap();

//     const curriculum = await prisma.curriculum.findFirst({
//         where: { program },
//         include: { subjects: true },
//     });

//     if (!curriculum) throw new Error('No curriculum found for this program.');

//     const subjectRefs = curriculum.subjects.map(cs => subjectMap.get(cs.subjectId)).filter(Boolean) as Subject[];
//     const sortedSubjects = await topologicalSort(subjectRefs, subjectMap);

//     // Dynamic week calculation: assuming 15 sessions (slots) per subject and 12 sessions per week (2/day × 6 days)
//     const estimatedTotalSlots = subjectRefs.length * 6; // You can customize this based on your subject/session model
//     const estimatedWeeks = Math.ceil(estimatedTotalSlots / (5 * 3)); // 5 days (Mon-Fri), 3 slots/day
//     const maxWeeks = estimatedWeeks > 0 ? estimatedWeeks : 10;

//     const schedules: ClassSchedule[] = [];

//     // Determine a random number of breaks per week (same for all classes)
//     const breaksPerWeek = Math.floor(Math.random() * 3) + 1; // 1 ~ 3 breaks/week

//     for (const team of teams) {
//         const subjectQueue = [...sortedSubjects];
//         const schedule = initEmptySchedule(maxWeeks);
//         const globalSchedule = new Map<string, Subject>();

//         for (let week = 1; week <= maxWeeks; week++) {
//             let breakSlots = breaksPerWeek;
//             let previous: Subject | null = null;
//             const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

//             for (const day of days) {
//                 for (const slot of ['morning', 'afternoon', 'evening'] as DaySlot[]) {
//                     if (shouldSkipSlot(day, slot)) continue;

//                     const key = `${team.id}-${week}-${day}-${slot}`;
//                     let inserted = false;

//                     // Randomly insert break
//                     if (breakSlots > 0 && Math.random() < 0.1) {
//                         (schedule[week][day] as DaySchedule)[slot] = 'BREAK';
//                         breakSlots--;
//                         continue;
//                     }

//                     for (let i = 0; i < subjectQueue.length; i++) {
//                         const candidate = subjectQueue[i];
//                         if (isValidSubjectForSlot(candidate, previous, day, slot, globalSchedule)) {
//                             (schedule[week][day] as DaySchedule)[slot] = candidate;
//                             previous = candidate;
//                             globalSchedule.set(key, candidate);
//                             subjectQueue.splice(i, 1);
//                             inserted = true;
//                             break;
//                         }
//                     }

//                     // If cannot insert subject, force BREAK
//                     if (!inserted && breakSlots > 0) {
//                         (schedule[week][day] as DaySchedule)[slot] = 'BREAK';
//                         breakSlots--;
//                     }
//                 }
//             }

//             // Refill subject queue if depleted
//             if (subjectQueue.length === 0) {
//                 subjectQueue.push(...shufflePreserveOrder(sortedSubjects));
//             }
//         }

//         schedules.push({ classId: team.id, schedule });
//     }

//     return schedules;
// }
import prisma from '@/lib/prisma';
import { Program, Category } from '@prisma/client';

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
type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

interface Holiday {
    date: string; // Format: yyyy-MM-dd
}

type DaySchedule = Partial<Record<DaySlot, Subject | 'BREAK'>>;
type WeekSchedule = Record<number, Record<DayOfWeek, DaySchedule>>;
type ClassSchedule = { classId: number; schedule: WeekSchedule };

const daysOfWeek: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const daySlotOrder: DaySlot[] = ['morning', 'afternoon', 'evening'];

/**
 * Utility function to get all holidays between two dates
 */
async function getHolidayDates(startDate: Date, endDate: Date): Promise<Set<string>> {
    const holidays: Set<string> = new Set();
    const year = startDate.getFullYear();

    // Example: Fetch from public holiday API (Replace if needed)
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/VN`);
    const data: Holiday[] = await res.json();

    for (const holiday of data) {
        holidays.add(holiday.date);
    }
    return holidays;
}

/**
 * Initialize empty week schedule
 */
function initEmptySchedule(weekCount: number): WeekSchedule {
    const schedule: WeekSchedule = {};
    for (let week = 1; week <= weekCount; week++) {
        const dayMap: Record<DayOfWeek, DaySchedule> = {
            Mon: {}, Tue: {}, Wed: {}, Thu: {}, Fri: {}, Sat: {},
        };
        schedule[week] = dayMap;
    }
    return schedule;
}

/**
 * Check if a slot should be skipped
 */
function shouldSkipSlot(day: DayOfWeek, slot: DaySlot): boolean {
    return (day === 'Sat' && slot === 'evening') || (day === 'Wed' && slot === 'evening');
}

/**
 * Check if subject is valid to insert into a slot
 */
function isValidSubjectForSlot(
    subject: Subject,
    previous: Subject | null,
    globalSchedule: Map<string, Subject>
): boolean {
    if ([...globalSchedule.values()].some(sub => sub.id === subject.id)) return false;
    if (previous && previous.category === subject.category && subject.category !== null) return false;
    return true;
}

/**
 * Shuffle subjects randomly
 */
function shuffleSubjects(subjects: Subject[]): Subject[] {
    return [...subjects].sort(() => Math.random() - 0.5);
}

/**
 * Topological sort subjects based on prerequisite
 */
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

/**
 * Main generate function
 */
export async function generateSchedulesForTeams(
    teams: Team[],
    startDate: Date
): Promise<ClassSchedule[]> {
    if (teams.length === 0) return [];

    const program = teams[0].program;
    const subjectMap = await buildSubjectMap();
    const curriculum = await prisma.curriculum.findFirst({
        where: { program },
        include: { subjects: true },
    });
    if (!curriculum) throw new Error('No curriculum found for this program.');

    const subjectRefs = curriculum.subjects.map(cs => subjectMap.get(cs.subjectId)).filter(Boolean) as Subject[];
    const sortedSubjects = await topologicalSort(shuffleSubjects(subjectRefs), subjectMap);

    const totalSubjects = sortedSubjects.length;
    const totalSlots = totalSubjects * 2; // Each subject needs ~2 slots to finish
    const slotsPerWeek = 15; // 5 days * 3 slots
    const weekCount = Math.ceil(totalSlots / slotsPerWeek);

    const holidays = await getHolidayDates(startDate, new Date(startDate.getFullYear(), 11, 31)); // till end of year

    const schedules: ClassSchedule[] = [];

    // Calculate total breaks needed per team
    const breaksPerWeek = [3, 4];
    const totalBreaks = teams.length > 0 ? breaksPerWeek[Math.floor(Math.random() * breaksPerWeek.length)] : 3;

    for (const team of teams) {
        const subjectQueue = [...sortedSubjects];
        const schedule = initEmptySchedule(weekCount);
        const globalSchedule = new Map<string, Subject>();

        let datePointer = new Date(startDate);

        for (let week = 1; week <= weekCount; week++) {
            let breakCount = 0;
            let previousSubject: Subject | null = null;

            for (const day of daysOfWeek) {
                for (const slot of daySlotOrder) {
                    if (shouldSkipSlot(day, slot)) continue;

                    const currentDate = getDateOfWeekAndDay(startDate, week, day);
                    const dateString = currentDate.toISOString().split('T')[0];

                    if (currentDate.getDay() === 0 || holidays.has(dateString)) continue; // Skip Sunday or holiday

                    const key = `${team.id}-${week}-${day}-${slot}`;
                    let inserted = false;

                    // Prefer insert break if we haven't reached total breaks for this week
                    if (breakCount < totalBreaks && Math.random() < 0.15) {
                        schedule[week][day][slot] = 'BREAK';
                        breakCount++;
                        continue;
                    }

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

    return schedules;
}

/**
 * Build subject map
 */
async function buildSubjectMap(): Promise<Map<number, Subject>> {
    const subjects = await prisma.subject.findMany();
    const map = new Map<number, Subject>();
    for (const s of subjects) {
        map.set(s.id, {
            id: s.id,
            name: s.name,
            category: s.category,
            prerequisiteId: s.prerequisiteId ?? undefined,
        });
    }
    return map;
}

/**
 * Get date of given week and day
 */
function getDateOfWeekAndDay(startDate: Date, week: number, day: DayOfWeek): Date {
    const dayOffsets: Record<DayOfWeek, number> = {
        Mon: 0,
        Tue: 1,
        Wed: 2,
        Thu: 3,
        Fri: 4,
        Sat: 5,
    };
    const baseDate = new Date(startDate);
    const daysToAdd = (week - 1) * 7 + dayOffsets[day];
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    return baseDate;
}
