import { PrismaClient, Lecturer, Location, Category, Subject, Program } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
type SessionType = 'sáng' | 'chiều' | 'tối';

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

interface TeamQueue {
    teamId: number;
    sessions: ScheduleSession[];
    resources: ResourceQueues;
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

// Core logic
async function getTeamCurriculum(teamId: number): Promise<number[]> {
    const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { program: true }
    });

    if (!team) throw new Error(`Team ${teamId} not found`);

    const curriculum = await prisma.curriculum.findFirst({
        where: { program: team.program },
        include: { subjects: true }
    });

    return curriculum?.subjects.map(cs => cs.subjectId) || [];
}

async function initializeQueues(teamId: number): Promise<ResourceQueues> {
    const curriculumSubjects = await getTeamCurriculum(teamId);
    console.log(`Curriculum subjects for team ${teamId}:`, curriculumSubjects);

    // Get all subjects with categories
    const subjects = await prisma.subject.findMany({
        where: { id: { in: curriculumSubjects } },
        select: { id: true, category: true, name: true }
    });

    // Get all lecturers with their specializations
    const lecturers = await prisma.lecturer.findMany({
        include: {
            specializations: { 
                select: { subjectId: true },
                where: { subjectId: { in: curriculumSubjects } }
            }
        },
        where: {
            maxSessionsPerWeek: { gt: 0 }
        }
    });

    // Get all locations with subject associations
    const locations = await prisma.location.findMany({
        include: {
            subjects: {
                select: { subjectId: true },
                where: { subjectId: { in: curriculumSubjects } }
            }
        }
    });

    // Filter and sort lecturers by priority
    const sortedLecturers = lecturers
        .filter(l => l.maxSessionsPerWeek > 0)
        .sort((a, b) => {
            // Prioritize lecturers with specializations
            const aHasSpecialization = a.specializations.length > 0;
            const bHasSpecialization = b.specializations.length > 0;
            if (aHasSpecialization !== bHasSpecialization) {
                return bHasSpecialization ? 1 : -1;
            }
            // Then sort by maxSessionsPerWeek
            return b.maxSessionsPerWeek - a.maxSessionsPerWeek;
        });

    // Filter locations to only those that can be used
    const validLocations = locations.filter(l => l.subjects.length > 0);

    return {
        lecturers: sortedLecturers,
        locations: shuffleArray(validLocations)
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

async function assignLecturersForTimeSlot(
    timeSlotGroup: TimeSlotGroup,
    lecturers: (Lecturer & { specializations: { subjectId: number }[] })[]
): Promise<void> {
    // Create a queue of lecturers
    let lecturerQueue = [...lecturers];
    
    for (const session of timeSlotGroup.sessions) {
        if (!session.subjectId) continue;
        
        // Get subject information
        const subject = await prisma.subject.findUnique({
            where: { id: session.subjectId },
            select: { id: true, name: true, category: true }
        });
        
        if (!subject) continue;
        
        // Step 1: Try to find lecturer with specialization
        let lecturerIndex = lecturerQueue.findIndex(l => 
            l.specializations.some(s => s.subjectId === session.subjectId) &&
            l.maxSessionsPerWeek > 0
        );
        
        // Step 2: If no specialization, find lecturer with same category
        if (lecturerIndex === -1) {
            lecturerIndex = lecturerQueue.findIndex(l => 
                l.faculty === subject.category && 
                l.maxSessionsPerWeek > 0
            );
        }
        
        // If found suitable lecturer
        if (lecturerIndex !== -1) {
            const lecturer = lecturerQueue[lecturerIndex];
            session.lecturerId = lecturer.id;
            
            // Update lecturer's maxSessionsPerWeek
            await prisma.lecturer.update({
                where: { id: lecturer.id },
                data: { maxSessionsPerWeek: { decrement: 1 } }
            });
            
            // Remove lecturer from queue
            lecturerQueue.splice(lecturerIndex, 1);
        }
    }
}

async function assignLocationsForTimeSlot(
    timeSlotGroup: TimeSlotGroup,
    locations: (Location & { subjects: { subjectId: number }[] })[]
): Promise<void> {
    // Create a queue of locations with capacity
    let locationQueue: { location: Location & { subjects: { subjectId: number }[] }, remainingCapacity: number }[] = [];
    
    for (const location of locations) {
        for (let i = 0; i < location.capacity; i++) {
            locationQueue.push({ location, remainingCapacity: 1 });
        }
    }
    
    // Shuffle the queue
    locationQueue = shuffleArray(locationQueue);
    
    for (const session of timeSlotGroup.sessions) {
        if (!session.subjectId) continue;
        
        // Find suitable location
        const locationIndex = locationQueue.findIndex(l => 
            l.location.subjects.some(s => s.subjectId === session.subjectId) &&
            l.remainingCapacity > 0
        );
        
        if (locationIndex !== -1) {
            const locationEntry = locationQueue[locationIndex];
            session.locationId = locationEntry.location.id;
            locationEntry.remainingCapacity--;
            
            // Remove location if capacity is exhausted
            if (locationEntry.remainingCapacity === 0) {
                locationQueue.splice(locationIndex, 1);
            }
        }
    }
}

// Validation and processing
function isValidSession(session: unknown): session is ScheduleSession {
    const validDays: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const validSessions: SessionType[] = ['sáng', 'chiều', 'tối'];
    
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

async function processScheduleFile(filePath: string): Promise<string> {
    locationUsage.clear();

    try {
        const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const data = rawData.filter(isValidSession) as ScheduleSession[];

        if (rawData.length !== data.length) {
            console.warn(`Filtered ${rawData.length - data.length} invalid records`);
        }

        // Get all unique weeks sorted
        const weeks = Array.from(new Set(data.map(s => s.week))).sort((a, b) => a - b);
        
        // Process each week sequentially
        for (const week of weeks) {
            console.log(`\nProcessing week ${week}`);
            
            // Get all sessions for this week
            const weekSessions = data.filter(s => s.week === week);
            
            // Get all lecturers and locations for this week
            const { lecturers, locations } = await initializeQueues(weekSessions[0].teamId);
            
            // Group sessions by time slot
            const timeSlotGroups = groupSessionsByTimeSlot(weekSessions);
            
            // Process each time slot group
            for (const timeSlotGroup of timeSlotGroups) {
                console.log(`Processing time slot: ${timeSlotGroup.timeSlot.date} ${timeSlotGroup.timeSlot.session}`);
                
                // Phase 1: Assign lecturers
                await assignLecturersForTimeSlot(timeSlotGroup, lecturers);
                
                // Phase 2: Assign locations
                await assignLocationsForTimeSlot(timeSlotGroup, locations);
            }
            
            // Log unassigned sessions for this week
            const unassigned = weekSessions.filter(s => !s.lecturerId || !s.locationId);
            if (unassigned.length > 0) {
                console.warn(`Could not assign resources for ${unassigned.length} sessions in week ${week}`);
            }
            
            // Reset lecturer maxSessionsPerWeek for next week
            await prisma.lecturer.updateMany({
                data: {
                    maxSessionsPerWeek: {
                        set: 5 // Reset to default value or get from config
                    }
                }
            });
        }

        const newFilePath = filePath.replace('_incomplete', '_complete');
        fs.writeFileSync(newFilePath, JSON.stringify(data, null, 2));
        fs.unlinkSync(filePath);

        return newFilePath;
    } catch (error) {
        console.error(`File processing failed: ${error}`);
        throw error;
    }
}

// Main job runner
export async function runAssignmentJob(): Promise<{ processedFiles: string[]; errors: string[] }> {
    const processedFiles: string[] = [];
    const errors: string[] = [];

    try {
        const scheduleDir = path.join(process.cwd(), 'schedules');
        const files = fs.readdirSync(scheduleDir)
            .filter(f => f.endsWith('_incomplete.json'));

        for (const file of files) {
            try {
                const filePath = path.join(scheduleDir, file);
                const newFilePath = await processScheduleFile(filePath);
                processedFiles.push(path.basename(newFilePath));
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Failed to process ${file}: ${message}`);
            }
        }
    } finally {
        await prisma.$disconnect();
    }

    return { processedFiles, errors };
}