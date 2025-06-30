import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

// ========================
// ENUMS AND TYPES
// ========================

// Enums
const Category = { CT: 'CT', QS: 'QS' } as const;
type Category = typeof Category[keyof typeof Category];
const Program = { DH: 'DH', CD: 'CD' } as const;
type Program = typeof Program[keyof typeof Program];
const Role = { scheduler: 'scheduler', viewer: 'viewer' } as const;
type Role = typeof Role[keyof typeof Role];

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
type SessionType = 'morning' | 'afternoon' | 'evening';

// ========================
// HARDCODED DATA
// ========================

// Users
const users = [
  { id: 1, username: 'admin', password: 'admin123', fullName: 'Nguyen Van A', role: Role.scheduler, email: 'admin@example.com' },
  { id: 2, username: 'viewer1', password: 'pass123', fullName: 'Tran Thi B', role: Role.viewer, email: 'viewer1@example.com' },
];

// Universities
const universities = [
  { id: 1, name: 'Đại học Bách Khoa', status: 'Undone' },
  { id: 3, name: 'Đại học Sư phạm', status: 'Undone' },
];

// Curriculums
const curriculums = [
  { id: 1, program: Program.DH },
  { id: 2, program: Program.CD },
];

// Subjects
const subjects = [
  { id: 1, name: 'Hoc phan CT1', category: Category.CT },
  { id: 2, name: 'Hoc phan CT2', category: Category.CT },
  { id: 3, name: 'Hoc phan CT3', category: Category.CT, prerequisiteId: 2 },
  { id: 4, name: 'Hoc phan CT4', category: Category.CT, prerequisiteId: 3 },
  { id: 5, name: 'Hoc phan CT5', category: Category.CT },
  { id: 6, name: 'Hoc phan CT6', category: Category.CT },
  { id: 7, name: 'Hoc phan CT7', category: Category.CT, prerequisiteId: 6 },
  { id: 8, name: 'Hoc phan CT8', category: Category.CT, prerequisiteId: 7 },
  { id: 9, name: 'Hoc phan CT9', category: Category.CT },
  { id: 10, name: 'Hoc phan CT10', category: Category.CT, prerequisiteId: 9 },
  { id: 11, name: 'Hoc phan QS1', category: Category.QS },
  { id: 12, name: 'Hoc phan QS2', category: Category.QS },
  { id: 13, name: 'Hoc phan QS3', category: Category.QS, prerequisiteId: 12 },
  { id: 14, name: 'Hoc phan QS4', category: Category.QS, prerequisiteId: 13 },
  { id: 15, name: 'Hoc phan QS5', category: Category.QS },
  { id: 16, name: 'Hoc phan QS6', category: Category.QS },
  { id: 17, name: 'Hoc phan QS7', category: Category.QS, prerequisiteId: 16 },
  { id: 18, name: 'Hoc phan QS8', category: Category.QS },
  { id: 19, name: 'Hoc phan QS9', category: Category.QS, prerequisiteId: 17 },
  { id: 20, name: 'Hoc phan QS10', category: Category.QS, prerequisiteId: 19 },
];

// Lecturers
const lecturers = [
  { id: 1, fullName: 'Le Van C', faculty: Category.CT, maxSessionsPerWeek: 10 },
  { id: 2, fullName: 'Pham Thi D', faculty: Category.CT, maxSessionsPerWeek: 8 },
  { id: 3, fullName: 'Nguyen Van E', faculty: Category.CT, maxSessionsPerWeek: 12 },
  { id: 4, fullName: 'Le Thi F', faculty: Category.CT, maxSessionsPerWeek: 10 },
  { id: 5, fullName: 'Tran Thi G', faculty: Category.CT, maxSessionsPerWeek: 8 },
  { id: 6, fullName: 'Nguyen Thi H', faculty: Category.QS, maxSessionsPerWeek: 12 },
  { id: 7, fullName: 'Phan Van I', faculty: Category.QS, maxSessionsPerWeek: 12 },
  { id: 8, fullName: 'Do Van J', faculty: Category.QS, maxSessionsPerWeek: 10 },
  { id: 9, fullName: 'Dang Thi K', faculty: Category.QS, maxSessionsPerWeek: 8 },
  { id: 10, fullName: 'Ta Van L', faculty: Category.QS, maxSessionsPerWeek: 12 },
];

// Locations
const locations = [
  { id: 1, name: 'Phong A101', capacity: 1 },
  { id: 2, name: 'Phong A102', capacity: 1 },
  { id: 3, name: 'Phong A103', capacity: 1 },
  { id: 4, name: 'Phong B101', capacity: 1 },
  { id: 5, name: 'Phong B102', capacity: 1 },
  { id: 6, name: 'Phong B103', capacity: 1 },
  { id: 7, name: 'Phong C301', capacity: 1 },
  { id: 8, name: 'Phong C302', capacity: 1 },
  { id: 9, name: 'Phong C303', capacity: 1 },
  { id: 10, name: 'Doi sau truong', capacity: 10 },
  { id: 11, name: 'Doi truoc truong', capacity: 10 },
  { id: 12, name: 'San the duc', capacity: 15 },
  { id: 13, name: 'Thao truong', capacity: 20 },
  { id: 14, name: 'Phong A104', capacity: 1 },
  { id: 15, name: 'Phong A105', capacity: 1 },
  { id: 16, name: 'Phong A106', capacity: 1 },
  { id: 17, name: 'Phong B104', capacity: 1 },
  { id: 18, name: 'Phong B105', capacity: 1 },
  { id: 19, name: 'Phong B106', capacity: 1 },
  { id: 20, name: 'Phong C104', capacity: 1 },
  { id: 21, name: 'Phong C105', capacity: 1 },
  { id: 22, name: 'Phong C106', capacity: 1 },
];

// Teams
const teams = [
  { id: 1, name: 'Team1', program: Program.DH, universityId: 1, teamLeaderId: 1 },
  { id: 2, name: 'Team2', program: Program.DH, universityId: 1, teamLeaderId: 2 },
  { id: 3, name: 'Team3', program: Program.DH, universityId: 2, teamLeaderId: 3 },
  { id: 4, name: 'Team4', program: Program.DH, universityId: 2, teamLeaderId: 4 },
  { id: 5, name: 'Team5', program: Program.DH, universityId: 3, teamLeaderId: 5 },
  { id: 6, name: 'Team6', program: Program.DH, universityId: 3, teamLeaderId: 6 },
  { id: 7, name: 'Team7', program: Program.DH, universityId: 1, teamLeaderId: 7 },
  { id: 8, name: 'Team8', program: Program.DH, universityId: 2, teamLeaderId: 8 },
  { id: 9, name: 'Team9', program: Program.DH, universityId: 3, teamLeaderId: 9 },
  { id: 10, name: 'Team10', program: Program.DH, universityId: 1, teamLeaderId: 10 },
];

// Holidays
const holidays = [
  { id: 1, date: '2025-01-01' },
  { id: 2, date: '2025-02-10' },
  { id: 3, date: '2025-04-18' },
  { id: 4, date: '2025-04-30' },
  { id: 5, date: '2025-05-01' },
  { id: 6, date: '2025-09-02' },
];

// Lecturer Statistics
const lecturerStatistics = [
  { id: 1, lecturerId: 1, fromDate: '2025-01-01', toDate: '2025-01-31', numberOfSessions: 8 },
  { id: 2, lecturerId: 2, fromDate: '2025-01-01', toDate: '2025-01-31', numberOfSessions: 6 },
  { id: 3, lecturerId: 3, fromDate: '2025-01-01', toDate: '2025-01-31', numberOfSessions: 10 },
  { id: 4, lecturerId: 1, fromDate: '2025-02-01', toDate: '2025-02-28', numberOfSessions: 7 },
  { id: 5, lecturerId: 6, fromDate: '2025-01-01', toDate: '2025-01-31', numberOfSessions: 9 },
];

// Location Subjects - Extended data
const locationSubjects = [
  // CT subjects (1-10) can use rooms A101-C303
  { locationId: 1, subjectId: 1 }, { locationId: 2, subjectId: 1 }, { locationId: 3, subjectId: 1 }, 
  { locationId: 4, subjectId: 1 }, { locationId: 5, subjectId: 1 }, { locationId: 6, subjectId: 1 }, 
  { locationId: 7, subjectId: 1 }, { locationId: 8, subjectId: 1 }, { locationId: 9, subjectId: 1 },
  { locationId: 1, subjectId: 2 }, { locationId: 2, subjectId: 2 }, { locationId: 3, subjectId: 2 }, 
  { locationId: 4, subjectId: 2 }, { locationId: 5, subjectId: 2 }, { locationId: 6, subjectId: 2 }, 
  { locationId: 7, subjectId: 2 }, { locationId: 8, subjectId: 2 }, { locationId: 9, subjectId: 2 },
  { locationId: 1, subjectId: 3 }, { locationId: 2, subjectId: 3 }, { locationId: 3, subjectId: 3 }, 
  { locationId: 4, subjectId: 3 }, { locationId: 5, subjectId: 3 }, { locationId: 6, subjectId: 3 }, 
  { locationId: 7, subjectId: 3 }, { locationId: 8, subjectId: 3 }, { locationId: 9, subjectId: 3 },
  { locationId: 1, subjectId: 4 }, { locationId: 2, subjectId: 4 }, { locationId: 3, subjectId: 4 }, 
  { locationId: 4, subjectId: 4 }, { locationId: 5, subjectId: 4 }, { locationId: 6, subjectId: 4 }, 
  { locationId: 7, subjectId: 4 }, { locationId: 8, subjectId: 4 }, { locationId: 9, subjectId: 4 },
  { locationId: 1, subjectId: 5 }, { locationId: 2, subjectId: 5 }, { locationId: 3, subjectId: 5 }, 
  { locationId: 4, subjectId: 5 }, { locationId: 5, subjectId: 5 }, { locationId: 6, subjectId: 5 }, 
  { locationId: 7, subjectId: 5 }, { locationId: 8, subjectId: 5 }, { locationId: 9, subjectId: 5 },
  { locationId: 1, subjectId: 6 }, { locationId: 2, subjectId: 6 }, { locationId: 3, subjectId: 6 }, 
  { locationId: 4, subjectId: 6 }, { locationId: 5, subjectId: 6 }, { locationId: 6, subjectId: 6 }, 
  { locationId: 7, subjectId: 6 }, { locationId: 8, subjectId: 6 }, { locationId: 9, subjectId: 6 },
  { locationId: 1, subjectId: 7 }, { locationId: 2, subjectId: 7 }, { locationId: 3, subjectId: 7 }, 
  { locationId: 4, subjectId: 7 }, { locationId: 5, subjectId: 7 }, { locationId: 6, subjectId: 7 }, 
  { locationId: 7, subjectId: 7 }, { locationId: 8, subjectId: 7 }, { locationId: 9, subjectId: 7 },
  { locationId: 1, subjectId: 8 }, { locationId: 2, subjectId: 8 }, { locationId: 3, subjectId: 8 }, 
  { locationId: 4, subjectId: 8 }, { locationId: 5, subjectId: 8 }, { locationId: 6, subjectId: 8 }, 
  { locationId: 7, subjectId: 8 }, { locationId: 8, subjectId: 8 }, { locationId: 9, subjectId: 8 },
  { locationId: 1, subjectId: 9 }, { locationId: 2, subjectId: 9 }, { locationId: 3, subjectId: 9 }, 
  { locationId: 4, subjectId: 9 }, { locationId: 5, subjectId: 9 }, { locationId: 6, subjectId: 9 }, 
  { locationId: 7, subjectId: 9 }, { locationId: 8, subjectId: 9 }, { locationId: 9, subjectId: 9 },
  { locationId: 1, subjectId: 10 }, { locationId: 2, subjectId: 10 }, { locationId: 3, subjectId: 10 }, 
  { locationId: 4, subjectId: 10 }, { locationId: 5, subjectId: 10 }, { locationId: 6, subjectId: 10 }, 
  { locationId: 7, subjectId: 10 }, { locationId: 8, subjectId: 10 }, { locationId: 9, subjectId: 10 },
  // QS subjects (11-20) can use outdoor/sports facilities
  { locationId: 10, subjectId: 11 }, { locationId: 11, subjectId: 11 }, { locationId: 12, subjectId: 11 }, { locationId: 13, subjectId: 11 },
  { locationId: 10, subjectId: 12 }, { locationId: 11, subjectId: 12 }, { locationId: 12, subjectId: 12 }, { locationId: 13, subjectId: 12 },
  { locationId: 10, subjectId: 13 }, { locationId: 11, subjectId: 13 }, { locationId: 12, subjectId: 13 }, { locationId: 13, subjectId: 13 },
  { locationId: 10, subjectId: 14 }, { locationId: 11, subjectId: 14 }, { locationId: 12, subjectId: 14 }, { locationId: 13, subjectId: 14 },
  { locationId: 10, subjectId: 15 }, { locationId: 11, subjectId: 15 }, { locationId: 12, subjectId: 15 }, { locationId: 13, subjectId: 15 },
  { locationId: 10, subjectId: 16 }, { locationId: 11, subjectId: 16 }, { locationId: 12, subjectId: 16 }, { locationId: 13, subjectId: 16 },
  { locationId: 10, subjectId: 17 }, { locationId: 11, subjectId: 17 }, { locationId: 12, subjectId: 17 }, { locationId: 13, subjectId: 17 },
  { locationId: 10, subjectId: 18 }, { locationId: 11, subjectId: 18 }, { locationId: 12, subjectId: 18 }, { locationId: 13, subjectId: 18 },
  { locationId: 10, subjectId: 19 }, { locationId: 11, subjectId: 19 }, { locationId: 12, subjectId: 19 }, { locationId: 13, subjectId: 19 },
  { locationId: 10, subjectId: 20 }, { locationId: 11, subjectId: 20 }, { locationId: 12, subjectId: 20 }, { locationId: 13, subjectId: 20 },
];

// Lecturer Specializations - Extended data
const lecturerSpecializations = [
  // CT lecturers (1-5) specializations
  { lecturerId: 1, subjectId: 1 }, { lecturerId: 3, subjectId: 1 }, { lecturerId: 4, subjectId: 1 }, { lecturerId: 5, subjectId: 1 },
  { lecturerId: 1, subjectId: 2 }, { lecturerId: 3, subjectId: 2 }, { lecturerId: 4, subjectId: 2 }, { lecturerId: 5, subjectId: 2 },
  { lecturerId: 1, subjectId: 3 }, { lecturerId: 4, subjectId: 3 }, 
  { lecturerId: 1, subjectId: 4 }, { lecturerId: 3, subjectId: 4 }, { lecturerId: 4, subjectId: 4 }, { lecturerId: 5, subjectId: 4 },
  { lecturerId: 1, subjectId: 5 }, { lecturerId: 2, subjectId: 5 }, 
  { lecturerId: 2, subjectId: 6 }, { lecturerId: 4, subjectId: 6 }, { lecturerId: 5, subjectId: 6 },
  { lecturerId: 1, subjectId: 7 }, { lecturerId: 2, subjectId: 7 }, { lecturerId: 5, subjectId: 7 }, 
  { lecturerId: 1, subjectId: 8 }, { lecturerId: 4, subjectId: 8 }, { lecturerId: 5, subjectId: 8 },
  { lecturerId: 1, subjectId: 9 }, { lecturerId: 3, subjectId: 9 }, { lecturerId: 4, subjectId: 9 }, 
  { lecturerId: 1, subjectId: 10 }, { lecturerId: 3, subjectId: 10 }, { lecturerId: 5, subjectId: 10 },
  // QS lecturers (6-10) specializations
  { lecturerId: 6, subjectId: 11 }, { lecturerId: 8, subjectId: 11 }, { lecturerId: 9, subjectId: 11 }, 
  { lecturerId: 6, subjectId: 12 }, { lecturerId: 8, subjectId: 12 }, { lecturerId: 10, subjectId: 12 },
  { lecturerId: 7, subjectId: 13 }, { lecturerId: 9, subjectId: 13 }, { lecturerId: 10, subjectId: 13 }, 
  { lecturerId: 6, subjectId: 14 }, { lecturerId: 7, subjectId: 14 }, { lecturerId: 10, subjectId: 14 },
  { lecturerId: 6, subjectId: 15 }, { lecturerId: 9, subjectId: 15 }, { lecturerId: 10, subjectId: 15 }, 
  { lecturerId: 6, subjectId: 16 }, { lecturerId: 7, subjectId: 16 }, { lecturerId: 9, subjectId: 16 }, { lecturerId: 10, subjectId: 16 },
  { lecturerId: 6, subjectId: 17 }, { lecturerId: 9, subjectId: 17 }, { lecturerId: 10, subjectId: 17 }, 
  { lecturerId: 6, subjectId: 18 }, { lecturerId: 8, subjectId: 18 }, { lecturerId: 9, subjectId: 18 }, { lecturerId: 10, subjectId: 18 },
  { lecturerId: 6, subjectId: 19 }, { lecturerId: 9, subjectId: 19 }, { lecturerId: 10, subjectId: 19 }, 
  { lecturerId: 7, subjectId: 20 }, { lecturerId: 9, subjectId: 20 }, { lecturerId: 10, subjectId: 20 },
];

// Curriculum Subjects
const curriculumSubjects = [
  // DH program (all subjects)
  { curriculumId: 1, subjectId: 1 }, { curriculumId: 1, subjectId: 2 }, { curriculumId: 1, subjectId: 3 }, { curriculumId: 1, subjectId: 4 }, { curriculumId: 1, subjectId: 5 },
  { curriculumId: 1, subjectId: 6 }, { curriculumId: 1, subjectId: 7 }, { curriculumId: 1, subjectId: 8 }, { curriculumId: 1, subjectId: 9 }, { curriculumId: 1, subjectId: 10 },
  { curriculumId: 1, subjectId: 11 }, { curriculumId: 1, subjectId: 12 }, { curriculumId: 1, subjectId: 13 }, { curriculumId: 1, subjectId: 14 }, { curriculumId: 1, subjectId: 15 },
  { curriculumId: 1, subjectId: 16 }, { curriculumId: 1, subjectId: 17 }, { curriculumId: 1, subjectId: 18 }, { curriculumId: 1, subjectId: 19 }, { curriculumId: 1, subjectId: 20 },
  // CD program (subset of subjects)
  { curriculumId: 2, subjectId: 1 }, { curriculumId: 2, subjectId: 2 }, { curriculumId: 2, subjectId: 3 }, { curriculumId: 2, subjectId: 4 }, { curriculumId: 2, subjectId: 6 },
  { curriculumId: 2, subjectId: 8 }, { curriculumId: 2, subjectId: 9 }, { curriculumId: 2, subjectId: 10 }, { curriculumId: 2, subjectId: 11 }, { curriculumId: 2, subjectId: 12 },
  { curriculumId: 2, subjectId: 13 }, { curriculumId: 2, subjectId: 14 }, { curriculumId: 2, subjectId: 16 }, { curriculumId: 2, subjectId: 18 }, { curriculumId: 2, subjectId: 19 }, { curriculumId: 2, subjectId: 20 },
];

// ========================
// INTERFACES AND TYPES
// ========================

interface ScheduleSession {
    week: number;
    teamId: number;
    subjectId: number | null;
    date: string;
    dayOfWeek: DayOfWeek;
    session: SessionType;
    lecturerId: number | null;
    locationId: number | null;
}

interface ResourceQueues {
    lecturers: (Lecturer & {
        specializations: { subjectId: number }[];
    })[];
    locations: (Location & {
        subjects: { subjectId: number }[];
    })[];
}

interface TimeSlot {
    date: string;
    session: SessionType;
}

interface TimeSlotGroup {
    timeSlot: TimeSlot;
    sessions: ScheduleSession[];
}

const locationUsage = new Map<string, Map<number, number>>();

// Helper functions
const shuffleArray = <T>(array: T[]): T[] => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const getSlotKey = (session: ScheduleSession): string => 
    `${session.date}-${session.session}`;

const canAssignLocation = (session: ScheduleSession, locationId: number, capacity: number): boolean => {
    const slotKey = getSlotKey(session);
    return (locationUsage.get(slotKey)?.get(locationId) || 0) < capacity;
};

const markLocationUsed = (session: ScheduleSession, locationId: number): void => {
    const slotKey = getSlotKey(session);
    if (!locationUsage.has(slotKey)) {
        locationUsage.set(slotKey, new Map());
    }
    const current = locationUsage.get(slotKey)!.get(locationId) || 0;
    locationUsage.get(slotKey)!.set(locationId, current + 1);
};

// Interfaces
interface Lecturer {
    id: number;
    fullName: string;
    faculty: Category;
    maxSessionsPerWeek: number;
    specializations?: { subjectId: number }[];
}

interface Location {
    id: number;
    name: string;
    capacity: number;
    subjects?: { subjectId: number }[];
}

// Sửa hàm getAvailableResources để dùng dữ liệu hardcode
async function getAvailableResources(week: number, date: string, session: SessionType): Promise<ResourceQueues> {
    console.log(`\n=== Getting available resources for week ${week}, date ${date}, session ${session} ===`);
    const doneDir = path.join(process.cwd(), 'schedules/done');
    const existingFiles = fs.readdirSync(doneDir)
        .filter(f => f.endsWith('.json'));
    console.log(`Found ${existingFiles.length} existing files in done directory`);

    // Get all lecturers and locations from hardcoded data
    const allLecturers = lecturers.map(l => ({
        ...l,
        specializations: lecturerSpecializations
            .filter(ls => ls.lecturerId === l.id)
            .map(ls => ({ subjectId: ls.subjectId }))
    }));
    console.log(`Total lecturers: ${allLecturers.length}`);

    const allLocations = locations.map(l => ({
        ...l,
        subjects: locationSubjects
            .filter(ls => ls.locationId === l.id)
            .map(ls => ({ subjectId: ls.subjectId }))
    }));
    console.log(`Total locations: ${allLocations.length}`);

    // If no existing files, return all resources
    if (existingFiles.length === 0) {
        console.log('No existing files, returning all resources');
        return {
            lecturers: allLecturers.sort((a, b) => {
                const aHasSpecialization = a.specializations?.length ?? 0;
                const bHasSpecialization = b.specializations?.length ?? 0;
                if (aHasSpecialization !== bHasSpecialization) {
                    return bHasSpecialization ? 1 : -1;
                }
                return b.maxSessionsPerWeek - a.maxSessionsPerWeek;
            }),
            locations: shuffleArray(allLocations.filter(l => l.subjects?.length ?? 0 > 0))
        };
    }

    // Check existing schedules for conflicts
    const usedLecturerIds = new Set<number>();
    const usedLocationIds = new Set<number>();

    for (const file of existingFiles) {
        const fileData = JSON.parse(fs.readFileSync(path.join(doneDir, file), 'utf-8'));
        const conflictingSessions = fileData.filter((s: ScheduleSession) => 
            s.week === week && 
            s.date === date && 
            s.session === session
        );
        console.log(`Found ${conflictingSessions.length} conflicting sessions in ${file}`);

        for (const session of conflictingSessions) {
            if (session.lecturerId) usedLecturerIds.add(session.lecturerId);
            if (session.locationId) usedLocationIds.add(session.locationId);
        }
    }

    console.log(`Used lecturer IDs: ${Array.from(usedLecturerIds).join(', ')}`);
    console.log(`Used location IDs: ${Array.from(usedLocationIds).join(', ')}`);

    // Filter out used resources
    const availableLecturers = allLecturers
        .filter(l => !usedLecturerIds.has(l.id))
        .sort((a, b) => {
            const aHasSpecialization = a.specializations?.length ?? 0;
            const bHasSpecialization = b.specializations?.length ?? 0;
            if (aHasSpecialization !== bHasSpecialization) {
                return bHasSpecialization ? 1 : -1;
            }
            return b.maxSessionsPerWeek - a.maxSessionsPerWeek;
        });
    console.log(`Available lecturers: ${availableLecturers.length}`);

    const availableLocations = shuffleArray(
        allLocations.filter(l => 
            !usedLocationIds.has(l.id) && 
            (l.subjects?.length ?? 0) > 0
        )
    );
    console.log(`Available locations: ${availableLocations.length}`);

    return {
        lecturers: availableLecturers,
        locations: availableLocations
    };
}

// Helper function to group sessions by time slot
function groupSessionsByTimeSlot(sessions: ScheduleSession[]): TimeSlotGroup[] {
    const groups = new Map<string, TimeSlotGroup>();
    
    for (const session of sessions) {
        const key = `${session.date}-${session.session}`;
        if (!groups.has(key)) {
            groups.set(key, {
                timeSlot: {
                    date: session.date,
                    session: session.session
                },
                sessions: []
            });
        }
        groups.get(key)!.sessions.push(session);
    }
    
    return Array.from(groups.values());
}

// Sửa hàm assignLecturersForTimeSlot để dùng dữ liệu hardcode
async function assignLecturersForTimeSlot(
    timeSlotGroup: TimeSlotGroup,
    lecturers: Lecturer[]
): Promise<void> {
    console.log(`\n=== Assigning lecturers for time slot ${timeSlotGroup.timeSlot.date} ${timeSlotGroup.timeSlot.session} ===`);
    console.log(`Total sessions to process: ${timeSlotGroup.sessions.length}`);
    let lecturerQueue = [...lecturers];
    console.log(`Initial lecturer queue size: ${lecturerQueue.length}`);
    
    for (const session of timeSlotGroup.sessions) {
        if (!session.subjectId) {
            console.log('Session missing subjectId, skipping...');
            continue;
        }
        
        const subject = subjects.find(s => s.id === session.subjectId);
        if (!subject) {
            console.log(`Subject with id ${session.subjectId} not found, skipping...`);
            continue;
        }
        console.log(`\nProcessing session for subject: ${subject.name} (${subject.category})`);
        
        const lecturerUsageThisSlot = new Map<number, number>();

        if (!session.lecturerId) {
            console.log('Finding suitable lecturer...');
            let lecturerIndex = lecturerQueue.findIndex(l => {
                const currentUsage = lecturerUsageThisSlot.get(l.id) || 0;
                return l.specializations?.some(s => s.subjectId === session.subjectId) &&
                       currentUsage < l.maxSessionsPerWeek;
            });
            
            if (lecturerIndex === -1 && (subject.category === 'CT' || subject.category === 'QS')) {
                console.log('No lecturer with matching specialization, trying faculty match...');
                lecturerIndex = lecturerQueue.findIndex(l => {
                    const currentUsage = lecturerUsageThisSlot.get(l.id) || 0;
                    return l.faculty === subject.category && currentUsage < l.maxSessionsPerWeek;
                });
            }
            
            if (lecturerIndex === -1) {
                console.log('No lecturer with matching faculty, trying any available lecturer...');
                lecturerIndex = lecturerQueue.findIndex(l => {
                    const currentUsage = lecturerUsageThisSlot.get(l.id) || 0;
                    return currentUsage < l.maxSessionsPerWeek;
                });
            }

            if (lecturerIndex !== -1) {
                const lecturer = lecturerQueue[lecturerIndex];
                session.lecturerId = lecturer.id;
                console.log(`Assigned lecturer: ${lecturer.fullName} (${lecturer.faculty})`);
                
                const currentUsage = lecturerUsageThisSlot.get(lecturer.id) || 0;
                lecturerUsageThisSlot.set(lecturer.id, currentUsage + 1);
                
                if (lecturerUsageThisSlot.get(lecturer.id)! >= lecturer.maxSessionsPerWeek) {
                    lecturerQueue.splice(lecturerIndex, 1);
                    console.log(`Removed lecturer ${lecturer.fullName} from queue (reached max sessions)`);
                }
            } else {
                console.log('No suitable lecturer found for this session');
            }
        } else {
            console.log(`Session already has lecturer assigned: ${session.lecturerId}`);
        }
    }
    console.log(`Remaining lecturers in queue: ${lecturerQueue.length}`);
}

// Sửa hàm assignLocationsForTimeSlot để dùng dữ liệu hardcode
async function assignLocationsForTimeSlot(
    timeSlotGroup: TimeSlotGroup,
    locations: Location[]
): Promise<void> {
    console.log(`\n=== Assigning locations for time slot ${timeSlotGroup.timeSlot.date} ${timeSlotGroup.timeSlot.session} ===`);
    console.log(`Total sessions to process: ${timeSlotGroup.sessions.length}`);
    let locationQueue: { location: Location, remainingCapacity: number }[] = [];
    
    for (const location of locations) {
        for (let i = 0; i < location.capacity; i++) {
            locationQueue.push({ location, remainingCapacity: 1 });
        }
    }
    console.log(`Initial location queue size: ${locationQueue.length}`);
    
    locationQueue = shuffleArray(locationQueue);
    
    for (const session of timeSlotGroup.sessions) {
        if (!session.subjectId) {
            console.log('Session missing subjectId, skipping...');
            continue;
        }
        
        console.log(`\nProcessing session for subject ID: ${session.subjectId}`);
        const locationIndex = locationQueue.findIndex(l => 
            l.location.subjects?.some(s => s.subjectId === session.subjectId) &&
            l.remainingCapacity > 0
        );
        
        if (locationIndex !== -1) {
            const locationEntry = locationQueue[locationIndex];
            session.locationId = locationEntry.location.id;
            console.log(`Assigned location: ${locationEntry.location.name}`);
            locationEntry.remainingCapacity--;
            
            if (locationEntry.remainingCapacity === 0) {
                locationQueue.splice(locationIndex, 1);
                console.log(`Removed location ${locationEntry.location.name} from queue (capacity exhausted)`);
            }
        } else {
            console.log('No suitable location found for this session');
        }
    }
    console.log(`Remaining locations in queue: ${locationQueue.length}`);
}

// Validation and processing
function isValidSession(session: unknown): session is ScheduleSession {
    const validDays: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const validSessions: SessionType[] = ['morning', 'afternoon', 'evening'];
    
    if (typeof session !== 'object' || session === null) return false;
    
    const s = session as ScheduleSession;
    
    return (
        typeof s.week === 'number' &&
        typeof s.teamId === 'number' &&
        (typeof s.subjectId === 'number' || s.subjectId === null) &&
        validDays.includes(s.dayOfWeek) &&
        validSessions.includes(s.session) &&
        typeof s.date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(s.date)
    );
}

// Thêm hàm tạo file Excel
function exportScheduleToExcel(schedules: ScheduleSession[], outputPath: string) {
    console.log('\n=== Creating Excel file ===');
    const wb = XLSX.utils.book_new();
    const excelData: any[] = [];
    
    // Group schedules by team
    const teamSchedules = new Map<number, ScheduleSession[]>();
    schedules.forEach(schedule => {
        if (!teamSchedules.has(schedule.teamId)) {
            teamSchedules.set(schedule.teamId, []);
        }
        teamSchedules.get(schedule.teamId)!.push(schedule);
    });

    // Create header row
    const headerRow = ['Date', 'Day', 'Session'];
    teamSchedules.forEach((_, teamId) => {
        headerRow.push(`Team ${teamId}`);
    });
    excelData.push(headerRow);

    // Get unique dates and sort them
    const uniqueDates = Array.from(new Set(schedules.map(s => s.date))).sort();
    const sessionTypes: SessionType[] = ['morning', 'afternoon', 'evening'];

    // Create data rows
    for (const date of uniqueDates) {
        const currentDate = new Date(date);
        const displayDate = currentDate.toLocaleDateString('vi-VN');
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'short' });

        for (const slot of sessionTypes) {
            let hasSubjectOrBreak = false;
            const row = [displayDate, dayOfWeek, slot.charAt(0).toUpperCase() + slot.slice(1)];

            teamSchedules.forEach((teamSchedule, teamId) => {
                const session = teamSchedule.find(s => s.date === date && s.session === slot);
                if (session) {
                    const subject = subjects.find(s => s.id === session.subjectId);
                    const lecturer = lecturers.find(l => l.id === session.lecturerId);
                    const location = locations.find(l => l.id === session.locationId);
                    
                    if (subject && lecturer && location) {
                        // Format cell content with line breaks
                        const cellValue = `${subject.name}\n${lecturer.fullName}\n${location.name}`;
                        row.push(cellValue);
                        hasSubjectOrBreak = true;
                    } else if (subject) {
                        // If only subject is assigned
                        const cellValue = `${subject.name}\n${lecturer?.fullName || 'Unknown'}\n${location?.name || 'Unknown'}`;
                        row.push(cellValue);
                        hasSubjectOrBreak = true;
                    } else {
                        row.push('BREAK');
                        hasSubjectOrBreak = true;
                    }
                } else {
                    row.push('');
                }
            });

            if (dayOfWeek === 'Sun' || !hasSubjectOrBreak) {
                for (let i = 3; i < row.length; i++) row[i] = '';
            }
            excelData.push(row);
        }
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
        { wch: 12 }, // Date
        { wch: 8 },  // Day
        { wch: 10 }, // Session
        ...Array(teamSchedules.size).fill({ wch: 40 }) // Team columns
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');

    // Write file
    XLSX.writeFile(wb, outputPath);
    console.log(`Successfully created Excel file at: ${outputPath}`);
}

// Hàm phân công lecturer/location cho 1 mảng session
function assignLecturerAndLocationForSessions(sessions: ScheduleSession[]): ScheduleSession[] {
    // Copy lại để không ảnh hưởng dữ liệu gốc
    const result: ScheduleSession[] = JSON.parse(JSON.stringify(sessions));
    
    // Group sessions by time slot
    const sessionsBySlot = new Map<string, ScheduleSession[]>();
    for (const session of result) {
        const slotKey = `${session.date}-${session.session}`;
        if (!sessionsBySlot.has(slotKey)) {
            sessionsBySlot.set(slotKey, []);
        }
        sessionsBySlot.get(slotKey)!.push(session);
    }
    
    // Tạo expanded location queue - mỗi location có capacity=n sẽ có n phần tử
    const createLocationQueue = () => {
        const queue: { location: Location, slotCapacity: number }[] = [];
        for (const location of locations) {
            // Thêm n phần tử cho location có capacity = n
            for (let i = 0; i < location.capacity; i++) {
                queue.push({ location, slotCapacity: 1 });
            }
        }
        return queue;
    };
    
    // Tạo lecturer queue với track sessions count
    const createLecturerQueue = () => {
        return lecturers.map(l => ({
            ...l,
            specializations: lecturerSpecializations
                .filter(ls => ls.lecturerId === l.id)
                .map(ls => ({ subjectId: ls.subjectId })),
            assignedSessionsCount: 0
        }));
    };
    
    // Tạo lecturer queue ưu tiên team leader cho team cụ thể
    const createLecturerQueueForTeam = (teamId: number) => {
        const team = teams.find(t => t.id === teamId);
        const teamLeaderId = team?.teamLeaderId;
        
        const allLecturers = lecturers.map(l => ({
            ...l,
            specializations: lecturerSpecializations
                .filter(ls => ls.lecturerId === l.id)
                .map(ls => ({ subjectId: ls.subjectId })),
            assignedSessionsCount: 0
        }));
        
        // Sắp xếp: Team leader lên đầu, sau đó theo ID tăng dần
        return allLecturers.sort((a, b) => {
            if (a.id === teamLeaderId) return -1;
            if (b.id === teamLeaderId) return 1;
            return a.id - b.id;
        });
    };
    
    // Process each time slot
    for (const [slotKey, slotSessions] of sessionsBySlot) {
        console.log(`\n=== Processing time slot: ${slotKey} (${slotSessions.length} sessions) ===`);
        
        // Create fresh lecturer queue for this slot (for global tracking)
        let globalLecturerQueue = createLecturerQueue();
        console.log(`Initial global lecturer queue size: ${globalLecturerQueue.length}`);
        
        // --- PHÂN GIẢNG VIÊN THEO PRIORITY VÀ TEAM LEADER ---
        for (const session of slotSessions) {
            if (session.subjectId == null) continue;
            
            const subject = subjects.find(s => s.id === session.subjectId);
            if (!subject) continue;
            
            // Tạo queue ưu tiên team leader cho session này
            const teamSpecificQueue = createLecturerQueueForTeam(session.teamId);
            const team = teams.find(t => t.id === session.teamId);
            const teamLeaderName = lecturers.find(l => l.id === team?.teamLeaderId)?.fullName || 'Unknown';
            
            console.log(`\nAssigning lecturer for Team ${session.teamId} (Leader: ${teamLeaderName}) - Subject ${subject.name} (${subject.category})`);
            let assignedLecturerId: number | null = null;
            let globalLecturerToRemoveIndex = -1;
            
            // PRIORITY 1: Team leader có chuyên môn trùng với môn học
            console.log('Priority 1: Checking if team leader has specialization...');
            for (let i = 0; i < teamSpecificQueue.length; i++) {
                const lecturer = teamSpecificQueue[i];
                const globalLecturer = globalLecturerQueue.find(gl => gl.id === lecturer.id);
                if (!globalLecturer) continue; // Lecturer đã bị remove khỏi global queue
                
                const hasSpecialization = lecturer.specializations?.some(s => s.subjectId === session.subjectId);
                const withinMaxSessions = globalLecturer.assignedSessionsCount < lecturer.maxSessionsPerWeek;
                const isTeamLeader = lecturer.id === team?.teamLeaderId;
                
                if (isTeamLeader && hasSpecialization && withinMaxSessions && lecturer.faculty === subject.category) {
                    assignedLecturerId = lecturer.id;
                    globalLecturerToRemoveIndex = globalLecturerQueue.findIndex(gl => gl.id === lecturer.id);
                    console.log(`✓ Found specialized TEAM LEADER: ${lecturer.fullName} (${lecturer.faculty})`);
                    break;
                }
            }
            
            // PRIORITY 2: Team leader cùng category (nếu chưa tìm được)
            if (!assignedLecturerId) {
                console.log('Priority 2: Checking if team leader matches category...');
                for (let i = 0; i < teamSpecificQueue.length; i++) {
                    const lecturer = teamSpecificQueue[i];
                    const globalLecturer = globalLecturerQueue.find(gl => gl.id === lecturer.id);
                    if (!globalLecturer) continue;
                    
                    const withinMaxSessions = globalLecturer.assignedSessionsCount < lecturer.maxSessionsPerWeek;
                    const isTeamLeader = lecturer.id === team?.teamLeaderId;
                    
                    if (isTeamLeader && lecturer.faculty === subject.category && withinMaxSessions) {
                        assignedLecturerId = lecturer.id;
                        globalLecturerToRemoveIndex = globalLecturerQueue.findIndex(gl => gl.id === lecturer.id);
                        console.log(`✓ Found same category TEAM LEADER: ${lecturer.fullName} (${lecturer.faculty})`);
                        break;
                    }
                }
            }
            
            // PRIORITY 3: Lecturer khác có chuyên môn trùng với môn học
            if (!assignedLecturerId) {
                console.log('Priority 3: Searching for specialized lecturer...');
                for (let i = 0; i < teamSpecificQueue.length; i++) {
                    const lecturer = teamSpecificQueue[i];
                    const globalLecturer = globalLecturerQueue.find(gl => gl.id === lecturer.id);
                    if (!globalLecturer) continue;
                    
                    const hasSpecialization = lecturer.specializations?.some(s => s.subjectId === session.subjectId);
                    const withinMaxSessions = globalLecturer.assignedSessionsCount < lecturer.maxSessionsPerWeek;
                    
                    if (hasSpecialization && withinMaxSessions && lecturer.faculty === subject.category) {
                        assignedLecturerId = lecturer.id;
                        globalLecturerToRemoveIndex = globalLecturerQueue.findIndex(gl => gl.id === lecturer.id);
                        console.log(`✓ Found specialized lecturer: ${lecturer.fullName} (${lecturer.faculty})`);
                        break;
                    }
                }
            }
            
            // PRIORITY 4: Lecturer khác cùng category
            if (!assignedLecturerId) {
                console.log('Priority 4: Searching for same category lecturer...');
                for (let i = 0; i < teamSpecificQueue.length; i++) {
                    const lecturer = teamSpecificQueue[i];
                    const globalLecturer = globalLecturerQueue.find(gl => gl.id === lecturer.id);
                    if (!globalLecturer) continue;
                    
                    const withinMaxSessions = globalLecturer.assignedSessionsCount < lecturer.maxSessionsPerWeek;
                    
                    if (lecturer.faculty === subject.category && withinMaxSessions) {
                        assignedLecturerId = lecturer.id;
                        globalLecturerToRemoveIndex = globalLecturerQueue.findIndex(gl => gl.id === lecturer.id);
                        console.log(`✓ Found same category lecturer: ${lecturer.fullName} (${lecturer.faculty})`);
                        break;
                    }
                }
            }
            
            // KHÔNG SẮP XẾP nếu khác category
            if (!assignedLecturerId) {
                console.log(`✗ No suitable lecturer found for ${subject.category} subject`);
            }
            
            // Assign lecturer và update global queue
            if (assignedLecturerId && globalLecturerToRemoveIndex >= 0) {
                session.lecturerId = assignedLecturerId;
                const globalLecturer = globalLecturerQueue[globalLecturerToRemoveIndex];
                globalLecturer.assignedSessionsCount++;
                
                // Xóa lecturer khỏi global queue nếu đã đạt max sessions
                if (globalLecturer.assignedSessionsCount >= globalLecturer.maxSessionsPerWeek) {
                    globalLecturerQueue.splice(globalLecturerToRemoveIndex, 1);
                    console.log(`Removed lecturer ${globalLecturer.fullName} from global queue (reached max: ${globalLecturer.maxSessionsPerWeek})`);
                }
            }
        }
        
        console.log(`Remaining lecturers in global queue: ${globalLecturerQueue.length}`);
        
        // --- PHÂN PHÒNG (USING EXPANDED QUEUE) ---
        const locationUsageInSlot = new Map<number, number>();
        
        for (const session of slotSessions) {
            if (session.subjectId == null) continue;
            
            let locationId: number | null = null;
            
            // Create expanded location queue for this slot
            let availableLocationQueue = createLocationQueue();
            
            // Filter out locations that are already at capacity for this slot
            availableLocationQueue = availableLocationQueue.filter(item => {
                const currentUsageInSlot = locationUsageInSlot.get(item.location.id) || 0;
                return currentUsageInSlot < item.location.capacity;
            });
            
            // Try to find a suitable location with subject compatibility first
            for (const item of availableLocationQueue) {
                const hasSubject = locationSubjects.find(ls => ls.locationId === item.location.id && ls.subjectId === session.subjectId);
                if (!hasSubject) continue;
                
                locationId = item.location.id;
                break;
            }
            
            // If no subject-specific location, try any available location
            if (!locationId && availableLocationQueue.length > 0) {
                locationId = availableLocationQueue[0].location.id;
            }
            
            if (locationId) {
                session.locationId = locationId;
                locationUsageInSlot.set(locationId, (locationUsageInSlot.get(locationId) || 0) + 1);
            }
        }
    }
    
    return result;
}

// Hàm xuất excel tổng hợp từ /schedules/done/
function exportAllDoneToExcel() {
    const doneDir = path.join(process.cwd(), 'schedules/done');
    const files = fs.readdirSync(doneDir).filter(f => f.endsWith('.json'));
    let allSessions: ScheduleSession[] = [];
    for (const file of files) {
        const data = JSON.parse(fs.readFileSync(path.join(doneDir, file), 'utf-8'));
        allSessions = allSessions.concat(data);
    }
    const excelPath = path.join(process.cwd(), 'done.xlsx');
    exportScheduleToExcel(allSessions, excelPath);
    console.log('Excel file created from all done JSON at:', excelPath);
}

// Sửa lại runAssignmentJob
export async function runAssignmentJob(): Promise<{ processedFiles: string[]; errors: string[] }> {
    console.log('\n=== STARTING ASSIGNMENT JOB ===');
    const processedFiles: string[] = [];
    const errors: string[] = [];
    const scheduledDir = path.join(process.cwd(), 'schedules/scheduled');
    const doneDir = path.join(process.cwd(), 'schedules/done');
    if (!fs.existsSync(doneDir)) fs.mkdirSync(doneDir, { recursive: true });
    const files = fs.readdirSync(scheduledDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
        try {
            const inputPath = path.join(scheduledDir, file);
            const outputPath = path.join(doneDir, file);
            const sessions: ScheduleSession[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
            const assigned = assignLecturerAndLocationForSessions(sessions);
            fs.writeFileSync(outputPath, JSON.stringify(assigned, null, 2), 'utf-8');
            processedFiles.push(file);
            console.log('Processed and wrote:', outputPath);
        } catch (e) {
            errors.push(`Error processing ${file}: ${e}`);
        }
    }
    exportAllDoneToExcel();
    return { processedFiles, errors };
}

// Thêm đoạn code để chạy job
console.log('\n=== STARTING SCHEDULE ASSIGNMENT ===');
runAssignmentJob()
    .then(result => {
        console.log('\n=== JOB COMPLETED ===');
        console.log('Processed files:', result.processedFiles);
        console.log('Errors:', result.errors);
    })
    .catch(error => {
        console.error('\n=== JOB FAILED ===');
        console.error('Error:', error);
    });