import XLSX from 'xlsx';

// Types from Prisma schema
type Category = 'CT' | 'QS';
type Program = 'DH' | 'CD';

type DaySlot = 'morning' | 'afternoon' | 'evening';
type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

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
    teamLeaderId: number;
}

interface Holiday {
    id: number;
    date: string;
}

type DaySchedule = Partial<Record<DaySlot, Subject | 'BREAK'>>;
type ClassSchedule = { classId: number; schedule: Record<string, DaySchedule> };

// Test data
const testSubjects: Subject[] = [
    { id: 1, name: 'Hoc phan CT1', category: 'CT' },
    { id: 2, name: 'Hoc phan CT2', category: 'CT' },
    { id: 3, name: 'Hoc phan CT3', category: 'CT', prerequisiteId: 2 },
    { id: 4, name: 'Hoc phan CT4', category: 'CT', prerequisiteId: 3 },
    { id: 5, name: 'Hoc phan CT5', category: 'CT' },
    { id: 6, name: 'Hoc phan CT6', category: 'CT' },
    { id: 7, name: 'Hoc phan CT7', category: 'CT', prerequisiteId: 6 },
    { id: 8, name: 'Hoc phan CT8', category: 'CT', prerequisiteId: 7 },
    { id: 9, name: 'Hoc phan CT9', category: 'CT' },
    { id: 10, name: 'Hoc phan CT10', category: 'CT', prerequisiteId: 9 },
    { id: 11, name: 'Hoc phan QS1', category: 'QS' },
    { id: 12, name: 'Hoc phan QS2', category: 'QS' },
    { id: 13, name: 'Hoc phan QS3', category: 'QS', prerequisiteId: 12 },
    { id: 14, name: 'Hoc phan QS4', category: 'QS', prerequisiteId: 13 },
    { id: 15, name: 'Hoc phan QS5', category: 'QS' },
    { id: 16, name: 'Hoc phan QS6', category: 'QS' },
    { id: 17, name: 'Hoc phan QS7', category: 'QS', prerequisiteId: 16 },
    { id: 18, name: 'Hoc phan QS8', category: 'QS' },
    { id: 19, name: 'Hoc phan QS9', category: 'QS', prerequisiteId: 17 },
    { id: 20, name: 'Hoc phan QS10', category: 'QS', prerequisiteId: 19 }
];

// Hardcoded dates for testing
const TEST_START_DATE = new Date(2025, 4, 1); // May 1, 2025
const TEST_END_DATE = new Date(2025, 4, 13);  // May 13, 2025

const testTeams: Team[] = [
    { id: 1, name: 'Team1', program: 'DH', universityId: 1, teamLeaderId: 1 },
    { id: 2, name: 'Team2', program: 'DH', universityId: 1, teamLeaderId: 2 },
    { id: 3, name: 'Team3', program: 'DH', universityId: 2, teamLeaderId: 3 },
    { id: 4, name: 'Team4', program: 'DH', universityId: 2, teamLeaderId: 4 },
    { id: 5, name: 'Team5', program: 'DH', universityId: 3, teamLeaderId: 5 }
];

const testHolidays: Holiday[] = [
    { id: 1, date: '2025-01-01' },
    { id: 2, date: '2025-02-10' },
    { id: 3, date: '2025-04-18' },
    { id: 4, date: '2025-04-30' },
    { id: 5, date: '2025-05-01' },
    { id: 6, date: '2025-09-02' }
];

const daySlotOrder: DaySlot[] = ['morning', 'afternoon', 'evening'];

function shouldSkipSlot(day: DayOfWeek, slot: DaySlot): boolean {
    return day === 'Sun';
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
    const map = new Map<number, Subject>();
    testSubjects.forEach(subject => {
        map.set(subject.id, subject);
    });
    return map;
}

async function getHolidayDates(startDate: Date, endDate: Date): Promise<Set<string>> {
    const startStr = toLocalISO(startDate);
    const endStr = toLocalISO(endDate);
    return new Set(
        testHolidays
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

export async function generateSchedulesForTeams(teams: Team[], startDate: Date, endDate: Date): Promise<ClassSchedule[]> {
    if (teams.length === 0) return [];
    const subjectMap = await buildSubjectMap();
    const holidays = await getHolidayDates(startDate, endDate);
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
        const subjectRefs = [...testSubjects];
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
            if (holidays.has(dateKey)) {
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

function exportScheduleToExcel(schedules: ClassSchedule[], startDate: Date, endDate: Date) {
    const wb = XLSX.utils.book_new();
    const excelData: any[] = [];
    const headerRow = ['Date', 'Day', 'Session'];
    schedules.forEach(schedule => {
        headerRow.push(`Team ${schedule.classId}`);
    });
    excelData.push(headerRow);
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateKey = toLocalISO(currentDate);
        const displayDate = currentDate.toLocaleDateString('vi-VN');
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
        for (const slot of daySlotOrder) {
            let hasSubjectOrBreak = false;
            const row = [displayDate, dayOfWeek, slot.charAt(0).toUpperCase() + slot.slice(1)];
            schedules.forEach(schedule => {
                const subject = schedule.schedule[dateKey]?.[slot];
                if (subject === 'BREAK') {
                    row.push('BREAK');
                    hasSubjectOrBreak = true;
                } else if (subject) {
                    row.push((subject as Subject).name);
                    hasSubjectOrBreak = true;
                } else {
                    row.push('');
                }
            });
            if (dayOfWeek === 'Sun' || !hasSubjectOrBreak) {
                for (let i = 3; i < row.length; i++) row[i] = '';
            }
            excelData.push(row);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const colWidths = [
        { wch: 12 },
        { wch: 8 },
        { wch: 10 },
        ...schedules.map(() => ({ wch: 25 }))
    ];
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
    const filePath = 'schedule.xlsx';
    XLSX.writeFile(wb, filePath);
    console.log(`Successfully created Excel file at: ${filePath}`);
}

// Main execution
async function main() {
    try {
        const startDate = TEST_START_DATE;
        const endDate = TEST_END_DATE;
        const schedules = await generateSchedulesForTeams(testTeams, startDate, endDate);
        await exportScheduleToExcel(schedules, startDate, endDate);
        console.log('Export completed successfully');
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error); 