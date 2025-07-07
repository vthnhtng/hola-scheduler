import { PrismaClient, Lecturer, Location, Category, Subject, Program } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
type SessionType = 'morning' | 'afternoon' | 'evening';

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

interface LecturerWithSpecializations extends Lecturer {
    specializations: { subjectId: number }[];
}

interface LocationWithSubjects extends Location {
    subjects: { subjectId: number }[];
}

interface TeamWithLeader {
    id: number;
    name: string;
    program: Program;
    courseId: number;
    teamLeaderId: number;
}

interface SubjectWithCategory {
    id: number;
    name: string;
    category: Category;
    prerequisiteId?: number | null;
}

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

// Validation function
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

// Get all data from database
async function getAllDataFromDB() {
    console.log('\n=== Fetching data from database ===');
    
    const lecturers = await prisma.lecturer.findMany({
        include: {
            specializations: {
                select: { subjectId: true }
            }
        },
        where: {
            maxSessionsPerWeek: { gt: 0 }
        }
    });
    console.log(`Fetched ${lecturers.length} lecturers`);

    const locations = await prisma.location.findMany({
        include: {
            subjects: {
                select: { subjectId: true }
            }
        }
    });
    console.log(`Fetched ${locations.length} locations`);

    const teams = await prisma.team.findMany({
        select: {
            id: true,
            name: true,
            program: true,
            courseId: true,
            teamLeaderId: true
        }
    });
    console.log(`Fetched ${teams.length} teams`);

    const subjects = await prisma.subject.findMany({
        select: {
            id: true,
            name: true,
            category: true,
            prerequisiteId: true
        }
    });
    console.log(`Fetched ${subjects.length} subjects`);

    return { lecturers, locations, teams, subjects };
}

// Main assignment algorithm
function assignLecturerAndLocationForSessions(
    sessions: ScheduleSession[],
    lecturers: LecturerWithSpecializations[],
    locations: LocationWithSubjects[],
    teams: TeamWithLeader[],
    subjects: SubjectWithCategory[]
): ScheduleSession[] {
    console.log('\n=== Starting assignment algorithm ===');
    console.log(`Processing ${sessions.length} sessions`);
    
    // Copy sessions to avoid modifying original data
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
    
    console.log(`Grouped into ${sessionsBySlot.size} time slots`);
    
    // Process each time slot
    for (const [slotKey, slotSessions] of sessionsBySlot) {
        console.log(`\n=== Processing time slot: ${slotKey} (${slotSessions.length} sessions) ===`);
        
        // Create fresh lecturer queue for this slot (for global tracking)
        let globalLecturerQueue = lecturers.map(l => ({
            ...l,
            assignedSessionsCount: 0
        }));
        console.log(`Initial global lecturer queue size: ${globalLecturerQueue.length}`);
        
        // --- PHÂN GIẢNG VIÊN THEO PRIORITY VÀ TEAM LEADER ---
        for (const session of slotSessions) {
            if (session.subjectId == null) continue;
            
            const subject = subjects.find(s => s.id === session.subjectId);
            if (!subject) continue;
            
            // Tạo queue ưu tiên team leader cho session này
            const team = teams.find(t => t.id === session.teamId);
            const teamLeaderName = lecturers.find(l => l.id === team?.teamLeaderId)?.fullName || 'Unknown';
            
            console.log(`\nAssigning lecturer for Team ${session.teamId} (Leader: ${teamLeaderName}) - Subject ${subject.name} (${subject.category})`);
            let assignedLecturerId: number | null = null;
            let globalLecturerToRemoveIndex = -1;
            
            // PRIORITY 1: Team leader có chuyên môn trùng với môn học
            console.log('Priority 1: Checking if team leader has specialization...');
            for (let i = 0; i < globalLecturerQueue.length; i++) {
                const lecturer = globalLecturerQueue[i];
                const hasSpecialization = lecturer.specializations?.some(s => s.subjectId === session.subjectId);
                const withinMaxSessions = lecturer.assignedSessionsCount < lecturer.maxSessionsPerWeek;
                const isTeamLeader = lecturer.id === team?.teamLeaderId;
                
                if (isTeamLeader && hasSpecialization && withinMaxSessions && lecturer.faculty === subject.category) {
                    assignedLecturerId = lecturer.id;
                    globalLecturerToRemoveIndex = i;
                    console.log(`✓ Found specialized TEAM LEADER: ${lecturer.fullName} (${lecturer.faculty})`);
                    break;
                }
            }
            
            // PRIORITY 2: Team leader cùng category (nếu chưa tìm được)
            if (!assignedLecturerId) {
                console.log('Priority 2: Checking if team leader matches category...');
                for (let i = 0; i < globalLecturerQueue.length; i++) {
                    const lecturer = globalLecturerQueue[i];
                    const withinMaxSessions = lecturer.assignedSessionsCount < lecturer.maxSessionsPerWeek;
                    const isTeamLeader = lecturer.id === team?.teamLeaderId;
                    
                    if (isTeamLeader && lecturer.faculty === subject.category && withinMaxSessions) {
                        assignedLecturerId = lecturer.id;
                        globalLecturerToRemoveIndex = i;
                        console.log(`✓ Found same category TEAM LEADER: ${lecturer.fullName} (${lecturer.faculty})`);
                        break;
                    }
                }
            }
            
            // PRIORITY 3: Lecturer khác có chuyên môn trùng với môn học
            if (!assignedLecturerId) {
                console.log('Priority 3: Searching for specialized lecturer...');
                for (let i = 0; i < globalLecturerQueue.length; i++) {
                    const lecturer = globalLecturerQueue[i];
                    const hasSpecialization = lecturer.specializations?.some(s => s.subjectId === session.subjectId);
                    const withinMaxSessions = lecturer.assignedSessionsCount < lecturer.maxSessionsPerWeek;
                    
                    if (hasSpecialization && withinMaxSessions && lecturer.faculty === subject.category) {
                        assignedLecturerId = lecturer.id;
                        globalLecturerToRemoveIndex = i;
                        console.log(`✓ Found specialized lecturer: ${lecturer.fullName} (${lecturer.faculty})`);
                        break;
                    }
                }
            }
            
            // PRIORITY 4: Lecturer khác cùng category
            if (!assignedLecturerId) {
                console.log('Priority 4: Searching for same category lecturer...');
                for (let i = 0; i < globalLecturerQueue.length; i++) {
                    const lecturer = globalLecturerQueue[i];
                    const withinMaxSessions = lecturer.assignedSessionsCount < lecturer.maxSessionsPerWeek;
                    
                    if (lecturer.faculty === subject.category && withinMaxSessions) {
                        assignedLecturerId = lecturer.id;
                        globalLecturerToRemoveIndex = i;
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
            let availableLocationQueue: { location: LocationWithSubjects, slotCapacity: number }[] = [];
            for (const location of locations) {
                // Thêm n phần tử cho location có capacity = n
                for (let i = 0; i < location.capacity; i++) {
                    availableLocationQueue.push({ location, slotCapacity: 1 });
                }
            }
            
            // Filter out locations that are already at capacity for this slot
            availableLocationQueue = availableLocationQueue.filter(item => {
                const currentUsageInSlot = locationUsageInSlot.get(item.location.id) || 0;
                return currentUsageInSlot < item.location.capacity;
            });
            
            // Try to find a suitable location with subject compatibility first
            for (const item of availableLocationQueue) {
                const hasSubject = item.location.subjects.find(ls => ls.subjectId === session.subjectId);
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
                console.log(`Assigned location ${locationId} to subject ${session.subjectId}`);
            } else {
                console.log(`No suitable location found for subject ${session.subjectId}`);
            }
        }
    }
    
    return result;
}

// Main job runner
export async function runAssignmentJob(): Promise<{ processedFiles: string[]; errors: string[] }> {
    console.log('\n=== STARTING ASSIGNMENT JOB ===');
    const processedFiles: string[] = [];
    const errors: string[] = [];

    try {
        // Get all data from database
        const { lecturers, locations, teams, subjects } = await getAllDataFromDB();
        
        const scheduledDir = path.join(process.cwd(), 'schedules/scheduled');
        const doneDir = path.join(process.cwd(), 'schedules/done');
        
        console.log('\nChecking directories:', { scheduledDir, doneDir });
        
        // Create directories if they don't exist
        if (!fs.existsSync(scheduledDir)) {
            console.log('Scheduled directory does not exist, creating...');
            fs.mkdirSync(scheduledDir, { recursive: true });
        }
        if (!fs.existsSync(doneDir)) {
            console.log('Done directory does not exist, creating...');
            fs.mkdirSync(doneDir, { recursive: true });
        }

        const files = fs.readdirSync(scheduledDir)
            .filter(f => f.endsWith('.json'));
        
        console.log('\nFound files in scheduled:', files);

        if (files.length === 0) {
            console.log('No files found to process');
            return { processedFiles, errors };
        }

        // Process each file
        for (const file of files) {
            try {
                console.log(`\nProcessing file: ${file}`);
                const filePath = path.join(scheduledDir, file);
                
                // Read and validate sessions
                const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const sessions = rawData.filter(isValidSession) as ScheduleSession[];
                
                console.log(`Total records in file: ${rawData.length}`);
                console.log(`Valid records after filtering: ${sessions.length}`);

                if (rawData.length !== sessions.length) {
                    console.warn(`Filtered ${rawData.length - sessions.length} invalid records`);
                }

                // Assign lecturers and locations
                const assignedSessions = assignLecturerAndLocationForSessions(
                    sessions, 
                    lecturers, 
                    locations, 
                    teams, 
                    subjects
                );
                
                // Write to done directory
                const doneFilePath = path.join(doneDir, file);
                fs.writeFileSync(doneFilePath, JSON.stringify(assignedSessions, null, 2));
                
                processedFiles.push(file);
                console.log(`Successfully processed and wrote: ${doneFilePath}`);
                
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Failed to process ${file}:`, message);
                errors.push(`Failed to process ${file}: ${message}`);
            }
        }
        
    } catch (error) {
        console.error('Error in runAssignmentJob:', error);
        errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
        await prisma.$disconnect();
    }

    console.log('\nJob completed:');
    console.log('Processed files:', processedFiles);
    console.log('Errors:', errors);

    return { processedFiles, errors };
}

// Hàm tạo lịch cho 1 team trong khoảng ngày
function generateTeamSchedule(teamId: number, startDate: string, endDate: string, subjects: SubjectWithCategory[]): ScheduleSession[] {
    // Hàm này chỉ là placeholder, bạn cần thay bằng logic sinh lịch thực tế
    // Ở đây sẽ tạo 1 session mỗi ngày, mỗi buổi sáng, cho subject đầu tiên
    const result: ScheduleSession[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let week = 1;
    let current = new Date(start);
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        result.push({
            week,
            teamId,
            subjectId: subjects[0]?.id || null,
            date: dateStr,
            dayOfWeek: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][current.getDay()] as DayOfWeek,
            session: 'morning',
            lecturerId: null,
            locationId: null
        });
        // sang ngày tiếp theo
        current.setDate(current.getDate() + 1);
        if (current.getDay() === 1) week++; // sang tuần mới nếu là thứ 2
    }
    return result;
}

// Hàm chính: nhận vào startDate, endDate, courseId, sinh lịch cho tất cả team thuộc course
export async function scheduleForCourse({ startDate, endDate, courseId }:{ startDate: string, endDate: string, courseId: number }) {
    const { lecturers, locations, teams, subjects } = await getAllDataFromDB();
    // Lọc các team thuộc courseId
    const courseTeams = teams.filter(t => t.courseId === courseId);
    const schedules: { teamId: number, schedule: ScheduleSession[] }[] = [];
    for (const team of courseTeams) {
        // Sinh lịch cho team
        let teamSchedule = generateTeamSchedule(team.id, startDate, endDate, subjects);
        // Phân công GV, phòng
        teamSchedule = assignLecturerAndLocationForSessions(teamSchedule, lecturers, locations, teams, subjects);
        schedules.push({ teamId: team.id, schedule: teamSchedule });
        // Ghi file
        const dir = path.join(process.cwd(), `Resource/Schedules/Team_${team.id}/Done`);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const filePath = path.join(dir, `week_${startDate}_${endDate}.json`);
        fs.writeFileSync(filePath, JSON.stringify(teamSchedule, null, 2), 'utf-8');
    }
    return { teams: schedules };
} 