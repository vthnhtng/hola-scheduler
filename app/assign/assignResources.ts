import { PrismaClient, Lecturer, Location, Subject } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
type SessionType = "morning" | "afternoon" | "evening";

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

interface TimeSlotGroup {
    timeSlot: {
        date: string;
        session: SessionType;
    };
    sessions: ScheduleSession[];
}

const shuffleArray = <T,>(array: T[]): T[] => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

async function getAvailableResources(
    week: number,
    date: string,
    sessionType: SessionType,
    dailyUsedLecturers: Set<number>,
    dailyUsedLocations: Map<number, number>,
): Promise<ResourceQueues> {
    const allLecturers = await prisma.lecturer.findMany({
        include: { specializations: { select: { subjectId: true } } },
        where: { maxSessionsPerWeek: { gt: 0 } },
    });

    const allLocations = await prisma.location.findMany({
        include: { subjects: { select: { subjectId: true } } },
    });

    const existingUnavailable = await prisma.sessionUnavailable.findMany({
        where: {
            sessionId: {
                contains: `_${date.replace(/-/g, "")}`,
            },
        },
    });

    const unavailableLecturerIds = new Set<number>();
    const unavailableLocationIds = new Map<number, number>();

    for (const session of existingUnavailable) {
        const lecturers = session.unavailableLecturers as number[];
        const locations = session.unavailableLocations as number[];

        lecturers.forEach((id) => unavailableLecturerIds.add(id));
        locations.forEach((id) => {
            const currentCount = unavailableLocationIds.get(id) || 0;
            unavailableLocationIds.set(id, currentCount + 1);
        });
    }

    const availableLecturers = allLecturers.filter(
        (lecturer) =>
            !unavailableLecturerIds.has(lecturer.id) &&
            !dailyUsedLecturers.has(lecturer.id),
    );

    const availableLocations = allLocations.filter((location) => {
        const dbUsedSlots = unavailableLocationIds.get(location.id) || 0;
        const dailyUsedSlots = dailyUsedLocations.get(location.id) || 0;
        const totalUsedSlots = dbUsedSlots + dailyUsedSlots;
        return totalUsedSlots < location.capacity;
    });

    return {
        lecturers: shuffleArray(availableLecturers),
        locations: shuffleArray(availableLocations),
    };
}

function groupSessionsByTimeSlot(sessions: ScheduleSession[]): TimeSlotGroup[] {
    const groups = new Map<string, TimeSlotGroup>();
    
    for (const session of sessions) {
        const key = `${session.date}-${session.session}`;
        if (!groups.has(key)) {
            groups.set(key, {
                timeSlot: { date: session.date, session: session.session },
                sessions: [],
            });
        }
        groups.get(key)!.sessions.push(session);
    }
    
    return Array.from(groups.values());
}

function isValidSession(session: unknown): session is ScheduleSession {
    const validDays: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const validSessions: SessionType[] = ["morning", "afternoon", "evening"];
    
    if (typeof session !== "object" || session === null) return false;
    
    const s = session as ScheduleSession;
    
    return (
        typeof s.week === "number" &&
        typeof s.teamId === "number" &&
        (typeof s.subjectId === "number" || s.subjectId === null) &&
        validDays.includes(s.dayOfWeek) &&
        validSessions.includes(s.session) &&
        typeof s.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(s.date)
    );
}

async function processScheduleFile(filePath: string): Promise<string> {
    try {
        const rawData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const data = rawData.filter(isValidSession) as ScheduleSession[];
        const firstSession = data[0];
        
        const team = await prisma.team.findUnique({
            where: { id: firstSession.teamId },
            select: { id: true, program: true },
        });

        if (!team) throw new Error(`Team ${firstSession.teamId} not found`);

        const weeks = Array.from(new Set(data.map((s) => s.week))).sort((a, b) => a - b);
        
        for (const week of weeks) {
            const weekSessions = data.filter((s) => s.week === week);
            const dates = Array.from(new Set(weekSessions.map((s) => s.date))).sort();
            
            for (const date of dates) {
                const dateSessions = weekSessions.filter((s) => s.date === date);
                const sessionTypes: SessionType[] = ["morning", "afternoon", "evening"];

                for (const sessionType of sessionTypes) {
                    const timeSlotSessions = dateSessions.filter((s) => s.session === sessionType);
                    
                    if (timeSlotSessions.length === 0) continue;

                    const { lecturers: availableLecturers, locations: availableLocations } = 
                        await getAvailableResources(week, date, sessionType, new Set(), new Map());

                    let globalLecturerQueue = availableLecturers.map((l) => ({
                        ...l,
                        assignedSessionsCount: 0,
                    }));
                    let globalLocationQueue = [...availableLocations];

                    for (const session of timeSlotSessions) {
                        try {
                            if (!session.subjectId) continue;

                            const subject = await prisma.subject.findUnique({
                                where: { id: session.subjectId },
                                select: { id: true, name: true, category: true },
                            });
                            if (!subject) continue;

                            if (!session.lecturerId) {

                                let lecturerIndex = globalLecturerQueue.findIndex(l => 
                                    l.specializations.some(s => s.subjectId === session.subjectId) &&
                                    l.assignedSessionsCount < l.maxSessionsPerWeek &&
                                    l.faculty === subject.category
                                );

                                if (lecturerIndex === -1) {
                                    lecturerIndex = globalLecturerQueue.findIndex(l => 
                                        l.faculty === subject.category &&
                                        l.assignedSessionsCount < l.maxSessionsPerWeek
                                    );
                                }

                                if (lecturerIndex !== -1) {
                                    const lecturer = globalLecturerQueue[lecturerIndex];
                                    session.lecturerId = lecturer.id;
                                    lecturer.assignedSessionsCount++;

                                    if (lecturer.assignedSessionsCount >= lecturer.maxSessionsPerWeek) {
                                        globalLecturerQueue.splice(lecturerIndex, 1);
                                    }
                                }
                            }

                            if (!session.locationId) {
                                let locationIndex = globalLocationQueue.findIndex(l => 
                                    l.subjects.some(s => s.subjectId === session.subjectId)
                                );
                                
                                if (locationIndex === -1 && globalLocationQueue.length > 0) {
                                    locationIndex = 0;
                                }

                                if (locationIndex !== -1) {
                                    const location = globalLocationQueue[locationIndex];
                                    session.locationId = location.id;
                                    globalLocationQueue.splice(locationIndex, 1);
                                }
                            }
                        } catch (error) {
                            console.error("Session processing error:", error);
                        }
                    }

                    try {
                        const allUsedLecturers: number[] = [];
                        const allUsedLocations: number[] = [];

                        for (const session of timeSlotSessions) {
                            if (session.lecturerId) allUsedLecturers.push(session.lecturerId);
                            if (session.locationId) allUsedLocations.push(session.locationId);
                        }

                        const sessionId = `${sessionType}_${date.replace(/-/g, "")}`;

                        if (allUsedLecturers.length > 0 || allUsedLocations.length > 0) {
                            const existingRecord = await prisma.sessionUnavailable.findUnique({
                                where: { sessionId },
                            });

                            let finalLecturers: number[] = [];
                            let finalLocations: number[] = [];

                            if (existingRecord) {
                                const existingLecturers = (existingRecord.unavailableLecturers as number[]) || [];
                                const existingLocations = (existingRecord.unavailableLocations as number[]) || [];

                                finalLecturers = [...new Set([...existingLecturers, ...allUsedLecturers])];
                                finalLocations = [...new Set([...existingLocations, ...allUsedLocations])];
                            } else {
                                finalLecturers = allUsedLecturers;
                                finalLocations = allUsedLocations;
                            }
                            
                            await prisma.sessionUnavailable.upsert({
                                where: { sessionId },
                                update: {
                                    unavailableLecturers: finalLecturers,
                                    unavailableLocations: finalLocations,
                                },
                                create: {
                                    sessionId,
                                    unavailableLecturers: finalLecturers,
                                    unavailableLocations: finalLocations,
                                },
                            });
                            await verifyDatabaseWrite(sessionId);
                        }
                    } catch (dbError) {
                        console.error("DB update error:", dbError);
                    }
                }
            }
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return filePath;
    } catch (error) {
        console.error(`File processing failed: ${error}`);
        throw error;
    }
}

async function verifyDatabaseWrite(sessionId: string): Promise<boolean> {
    try {
        const result = await prisma.sessionUnavailable.findUnique({
            where: { sessionId },
        });

        if (result) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

export async function runAssignmentJob(): Promise<{
    processedFiles: string[];
    errors: string[];
}> {
    const processedFiles: string[] = [];
    const errors: string[] = [];

    try {
        const scheduledDir = path.join(process.cwd(), "resource/schedules");
        const doneDir = path.join(process.cwd(), "resource/schedules");
        
        if (!fs.existsSync(scheduledDir))
            fs.mkdirSync(scheduledDir, { recursive: true });
        if (!fs.existsSync(doneDir)) fs.mkdirSync(doneDir, { recursive: true });

        const teamDirs = fs.readdirSync(scheduledDir).filter(d => 
            fs.statSync(path.join(scheduledDir, d)).isDirectory() && d.startsWith("team")
        );

        if (teamDirs.length === 0) return { processedFiles, errors };

        for (const teamDir of teamDirs) {
            const teamScheduledDir = path.join(scheduledDir, teamDir, "scheduled");
            const teamDoneDir = path.join(scheduledDir, teamDir, "done");

            if (!fs.existsSync(teamScheduledDir)) continue;

            if (!fs.existsSync(teamDoneDir)) {
                fs.mkdirSync(teamDoneDir, { recursive: true });
            }

            const files = fs.readdirSync(teamScheduledDir).filter(f => f.endsWith(".json"));

            for (const file of files) {
                try {
                    const filePath = path.join(teamScheduledDir, file);
                    const newFilePath = await processScheduleFile(filePath);
                    const doneFilePath = path.join(teamDoneDir, path.basename(newFilePath));
                    
                    fs.renameSync(newFilePath, doneFilePath);
                    processedFiles.push(`${teamDir}/${path.basename(doneFilePath)}`);
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Unknown error";
                    console.error(`Failed to process ${teamDir}/${file}: ${message}`);
                    errors.push(`Failed to process ${teamDir}/${file}: ${message}`);
                }
            }
        }
    } catch (error) {
        console.error("Job runner error:", error);
    } finally {
        await prisma.$disconnect();
    }
    return { processedFiles, errors };
}