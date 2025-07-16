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

async function getAvailableResources(week: number, date: string, session: SessionType): Promise<ResourceQueues> {
    const doneDir = path.join(process.cwd(), 'schedules/done');
    const existingFiles = fs.readdirSync(doneDir)
        .filter(f => f.endsWith('.json'));

    // Get all lecturers and locations
    const allLecturers = await prisma.lecturer.findMany({
        include: {
            specializations: { 
                select: { subjectId: true }
            }
        },
        where: {
            maxSessionsPerWeek: { gt: 0 }
        }
    });

    const allLocations = await prisma.location.findMany({
        include: {
            subjects: {
                select: { subjectId: true }
            }
        }
    });

    // If no existing files, return all resources
    if (existingFiles.length === 0) {
        return {
            lecturers: allLecturers.sort((a, b) => {
                const aHasSpecialization = a.specializations.length > 0;
                const bHasSpecialization = b.specializations.length > 0;
                if (aHasSpecialization !== bHasSpecialization) {
                    return bHasSpecialization ? 1 : -1;
                }
                return b.maxSessionsPerWeek - a.maxSessionsPerWeek;
            }),
            locations: shuffleArray(allLocations.filter(l => l.subjects.length > 0))
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

        for (const session of conflictingSessions) {
            if (session.lecturerId) usedLecturerIds.add(session.lecturerId);
            if (session.locationId) usedLocationIds.add(session.locationId);
        }
    }

    // Filter out used resources
    const availableLecturers = allLecturers
        .filter(l => !usedLecturerIds.has(l.id))
        .sort((a, b) => {
            const aHasSpecialization = a.specializations.length > 0;
            const bHasSpecialization = b.specializations.length > 0;
            if (aHasSpecialization !== bHasSpecialization) {
                return bHasSpecialization ? 1 : -1;
            }
            return b.maxSessionsPerWeek - a.maxSessionsPerWeek;
        });

    const availableLocations = shuffleArray(
        allLocations.filter(l => 
            !usedLocationIds.has(l.id) && 
            l.subjects.length > 0
        )
    );

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
        
        // Track usage
        const lecturerUsageThisSlot = new Map<number, number>();

        // Assign lecturer first
        if (!session.lecturerId) {
            // 1. Iterate through entire queue, find lecturer with matching specialization and not exceeding limit
            let lecturerIndex = lecturerQueue.findIndex(l => {
                const currentUsage = lecturerUsageThisSlot.get(l.id) || 0;
                return l.specializations.some(s => s.subjectId === session.subjectId) &&
                       currentUsage < l.maxSessionsPerWeek;
            });
            
            // 2. If not found, iterate through queue again, find lecturer with CT or QS category matching subject.category
            if (lecturerIndex === -1 && (subject.category === 'CT' || subject.category === 'QS')) {
                lecturerIndex = lecturerQueue.findIndex(l => {
                    const currentUsage = lecturerUsageThisSlot.get(l.id) || 0;
                    return l.faculty === subject.category && currentUsage < l.maxSessionsPerWeek;
                });
            }
            
            // 3. If still not found, assign first available lecturer
            if (lecturerIndex === -1) {
                lecturerIndex = lecturerQueue.findIndex(l => {
                    const currentUsage = lecturerUsageThisSlot.get(l.id) || 0;
                    return currentUsage < l.maxSessionsPerWeek;
                });
            }

            if (lecturerIndex !== -1) {
                const lecturer = lecturerQueue[lecturerIndex];
                session.lecturerId = lecturer.id;
                
                // Track usage
                const currentUsage = lecturerUsageThisSlot.get(lecturer.id) || 0;
                lecturerUsageThisSlot.set(lecturer.id, currentUsage + 1);
                
                // Remove lecturer if at capacity
                if (lecturerUsageThisSlot.get(lecturer.id)! >= lecturer.maxSessionsPerWeek) {
                    lecturerQueue.splice(lecturerIndex, 1);
                }
                
                console.log(`Assigned lecturer ${lecturer.id} to subject ${session.subjectId}`);
            }
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

async function processScheduleFile(filePath: string): Promise<string> {
    locationUsage.clear();
    const scheduledDir = path.join(process.cwd(), 'schedules/scheduled');

    try {
        console.log(`\nProcessing file: ${filePath}`);
        const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        console.log(`Total records in file: ${rawData.length}`);
        
        const data = rawData.filter(isValidSession) as ScheduleSession[];
        console.log(`Valid records after filtering: ${data.length}`);

        if (rawData.length !== data.length) {
            console.warn(`Filtered ${rawData.length - data.length} invalid records`);
            const invalidRecords = rawData.filter((record: unknown) => !isValidSession(record));
            console.log('Sample of invalid records:', JSON.stringify(invalidRecords.slice(0, 3), null, 2));
        }

        // Get team and university info from first session
        const firstSession = data[0];
        console.log(`\nFirst session info:`, firstSession);
        
        const team = await prisma.team.findUnique({
            where: { id: firstSession.teamId },
            select: { id: true, program: true }
        });

        if (!team) {
            throw new Error(`Team ${firstSession.teamId} not found`);
        }

        const universityId = team.program;
        console.log(`\nTeam program: ${universityId}`);

        // Get all unique weeks sorted
        const weeks = Array.from(new Set(data.map(s => s.week))).sort((a, b) => a - b);
        console.log(`\nProcessing ${weeks.length} weeks:`, weeks);
        
        // Process each week sequentially
        for (const week of weeks) {
            console.log(`\nProcessing week ${week}`);
            
            // Get all sessions for this week
            const weekSessions = data.filter(s => s.week === week);
            console.log(`Found ${weekSessions.length} sessions for week ${week}`);

            // Get all unique dates in this week
            const dates = Array.from(new Set(weekSessions.map(s => s.date))).sort();
            console.log(`\nProcessing ${dates.length} dates:`, dates);

            // Process each date
            for (const date of dates) {
                console.log(`\nProcessing date: ${date}`);

                // Get all sessions for this date
                const dateSessions = weekSessions.filter(s => s.date === date);
                console.log(`Found ${dateSessions.length} sessions for date ${date}`);

                // Get all unique session types (morning, afternoon, evening)
                const sessionTypes: SessionType[] = ['morning', 'afternoon', 'evening'];

                // Process each session type
                for (const sessionType of sessionTypes) {
                    console.log(`\nProcessing ${sessionType} session`);
                    
                    // Get sessions for this time slot
                    const timeSlotSessions = dateSessions.filter(s => s.session === sessionType);
                    console.log(`Found ${timeSlotSessions.length} sessions for ${sessionType}`);

                    if (timeSlotSessions.length === 0) {
                        console.log(`No sessions to process for ${sessionType}`);
                        continue;
                    }

                    // Get available resources for this time slot
                    const { lecturers, locations } = await getAvailableResources(
                        week,
                        date,
                        sessionType
                    );

                    console.log(`Available resources for ${sessionType}:`);
                    console.log(`- Lecturers: ${lecturers.length}`);
                    console.log(`- Locations: ${locations.length}`);

                    // Create queues for this time slot
                    let lecturerQueue = [...lecturers];
                    let locationQueue = [...locations];

                    // Shuffle both queues
                    lecturerQueue = shuffleArray(lecturerQueue);
                    locationQueue = shuffleArray(locationQueue);
                    
                    // Track lecturer usage for this time slot
                    const lecturerUsageThisSlot = new Map<number, number>();

                    // Process each session in this time slot
                    for (const session of timeSlotSessions) {
                        try {
                            if (!session.subjectId) {
                                console.log('Session missing subjectId, skipping...');
                                continue;
                            }

                            // Get subject information
                            const subject = await prisma.subject.findUnique({
                                where: { id: session.subjectId },
                                select: { id: true, name: true, category: true }
                            });
                            
                            if (!subject) {
                                console.log(`Subject with id ${session.subjectId} not found, skipping...`);
                                continue;
                            }

                            // Assign lecturer first
                            if (!session.lecturerId) {
                                // 1. Iterate through entire queue, find lecturer with matching specialization and not exceeding limit
                                let lecturerIndex = lecturerQueue.findIndex(l => {
                                    const currentUsage = lecturerUsageThisSlot.get(l.id) || 0;
                                    return l.specializations.some(s => s.subjectId === session.subjectId) &&
                                           currentUsage < l.maxSessionsPerWeek;
                                });
                                
                                // 2. If not found, iterate through queue again, find lecturer with CT or QS category matching subject.category
                                if (lecturerIndex === -1 && (subject.category === 'CT' || subject.category === 'QS')) {
                                    lecturerIndex = lecturerQueue.findIndex(l => {
                                        const currentUsage = lecturerUsageThisSlot.get(l.id) || 0;
                                        return l.faculty === subject.category && currentUsage < l.maxSessionsPerWeek;
                                    });
                                }
                                
                                // 3. If still not found, assign first available lecturer
                                if (lecturerIndex === -1) {
                                    lecturerIndex = lecturerQueue.findIndex(l => {
                                        const currentUsage = lecturerUsageThisSlot.get(l.id) || 0;
                                        return currentUsage < l.maxSessionsPerWeek;
                                    });
                                }

                                if (lecturerIndex !== -1) {
                                    const lecturer = lecturerQueue[lecturerIndex];
                                    session.lecturerId = lecturer.id;
                                    
                                    // Track usage
                                    const currentUsage = lecturerUsageThisSlot.get(lecturer.id) || 0;
                                    lecturerUsageThisSlot.set(lecturer.id, currentUsage + 1);
                                    
                                    // Remove lecturer if at capacity
                                    if (lecturerUsageThisSlot.get(lecturer.id)! >= lecturer.maxSessionsPerWeek) {
                                        lecturerQueue.splice(lecturerIndex, 1);
                                    }
                                    
                                    console.log(`Assigned lecturer ${lecturer.id} to subject ${session.subjectId}`);
                                }
                            }

                            // Assign location separately
                            if (!session.locationId) {
                                // Find suitable location
                                let locationIndex = locationQueue.findIndex(l => 
                                    l.subjects.some(s => s.subjectId === session.subjectId) &&
                                    canAssignLocation(session, l.id, l.capacity)
                                );
                                
                                // If no specific location found, use any available location
                                if (locationIndex === -1 && locationQueue.length > 0) {
                                    locationIndex = locationQueue.findIndex(l =>
                                        canAssignLocation(session, l.id, l.capacity)
                                    );
                                }

                                if (locationIndex !== -1) {
                                    const location = locationQueue[locationIndex];
                                    session.locationId = location.id;
                                    markLocationUsed(session, location.id);
                                    
                                    // Check if location is at capacity for this time slot
                                    if (!canAssignLocation(session, location.id, location.capacity)) {
                                        locationQueue.splice(locationIndex, 1);
                                    }
                                    console.log(`Assigned location ${location.id} to subject ${session.subjectId}`);
                                }
                            }

                        } catch (error) {
                            console.error('Error processing session:', error);
                            continue;
                        }
                    }

                    // Log assignment results for this time slot
                    const assigned = timeSlotSessions.filter(s => s.lecturerId && s.locationId);
                    const unassigned = timeSlotSessions.filter(s => !s.lecturerId || !s.locationId);
                    console.log(`Assigned: ${assigned.length}, Unassigned: ${unassigned.length}`);
                    
                    if (unassigned.length > 0) {
                        console.log('Unassigned sessions:', unassigned.map(s => ({
                            subjectId: s.subjectId,
                            date: s.date,
                            session: s.session
                        })));
                    }
                }
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

        // Write processed data back to the same file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`\nSuccessfully processed file: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error(`\nFile processing failed: ${error}`);
        throw error;
    }
}

// Main job runner
export async function runAssignmentJob(): Promise<{ processedFiles: string[]; errors: string[] }> {
    const processedFiles: string[] = [];
    const errors: string[] = [];

    try {
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

        for (const file of files) {
            try {
                console.log(`\nProcessing file: ${file}`);
                const filePath = path.join(scheduledDir, file);
                const newFilePath = await processScheduleFile(filePath);
                
                // Move file to done directory
                const doneFilePath = path.join(doneDir, path.basename(newFilePath));
                fs.renameSync(newFilePath, doneFilePath);
                
                processedFiles.push(path.basename(doneFilePath));
                console.log(`Successfully processed and moved ${file} to done directory`);
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