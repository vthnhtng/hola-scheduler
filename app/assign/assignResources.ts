import { PrismaClient, Lecturer, Location, Category } from '@prisma/client';
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
    lecturers: (Lecturer & { specializations: { subjectId: number }[] })[];
    locations: (Location & { subjects: { subjectId: number }[] })[];
}

const usedLocations: Map<string, Set<number>> = new Map();

function shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function getSlotKey(session: ScheduleSession): string {
    return `${session.date}-${session.session}`;
}

function canAssignLocation(slotKey: string, locationId: number, capacity: number): boolean {
    const used = usedLocations.get(slotKey) || new Set<number>();
    return used.size < capacity && !used.has(locationId);
}

function markLocationUsed(slotKey: string, locationId: number): void {
    if (!usedLocations.has(slotKey)) {
        usedLocations.set(slotKey, new Set());
    }
    usedLocations.get(slotKey)?.add(locationId);
}

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
    console.log(`Curriculum subjects for team ${teamId}: ${curriculumSubjects}`);

    // Lấy tất cả giảng viên có thể dạy
    const allLecturers = await prisma.lecturer.findMany({
        include: { 
            specializations: { select: { subjectId: true } }
        },
        where: { 
            maxSessionsPerWeek: { gt: 0 },
            OR: [
                { specializations: { some: { subjectId: { in: curriculumSubjects } } }},
                { faculty: Category.CT } // Fallback cho giảng viên CT
            ]
        }
    });

    // Lấy location và nhân bản theo capacity
    const locations = await prisma.location.findMany({
        include: { 
            subjects: { select: { subjectId: true } }
        },
        where: { 
            subjects: { some: { subjectId: { in: curriculumSubjects } } }
        }
    });

    console.log(`Found ${locations.length} locations for curriculum`);

    const locationQueue = locations.flatMap(loc => 
        Array.from({ length: loc.capacity }, (_, index) => ({
            ...loc,
            id: loc.id * 1000 + index // Unique ID cho mỗi slot
        }))
    );

    return {
        lecturers: shuffleArray(allLecturers),
        locations: shuffleArray(locationQueue)
    };
}

async function assignSessionResources(
    session: ScheduleSession,
    queues: ResourceQueues,
    week: number
): Promise<void> {
    if (!session.subjectId) return;

    try {
        // Tìm giảng viên có chuyên môn trước
        let lecturer = queues.lecturers.find(l => 
            l.specializations.some(s => s.subjectId === session.subjectId) &&
            l.maxSessionsPerWeek > 0
        );

        // Nếu không có, chọn giảng viên bất kỳ
        if (!lecturer) {
            lecturer = queues.lecturers.find(l => l.maxSessionsPerWeek > 0);
        }

        const location = queues.locations.find(l => 
            l.subjects.some(s => s.subjectId === session.subjectId)
        );

        if (!lecturer || !location) {
            console.warn(`Resources not found for subject ${session.subjectId}`);
            return;
        }

        const slotKey = getSlotKey(session);
        if (!canAssignLocation(slotKey, location.id, location.capacity)) {
            console.warn(`Location ${location.id} at ${slotKey} is full`);
            return;
        }

        const updatedLecturer = await prisma.$transaction(async (tx) => {
            const current = await tx.lecturer.findUnique({
                where: { id: lecturer!.id },
                select: { maxSessionsPerWeek: true }
            });

            if (!current || current.maxSessionsPerWeek <= 0) return null;
            
            return tx.lecturer.update({
                where: { id: lecturer!.id },
                data: { maxSessionsPerWeek: { decrement: 1 } }
            });
        });

        if (!updatedLecturer) {
            console.warn(`Lecturer ${lecturer.id} has no available sessions`);
            return;
        }

        session.lecturerId = updatedLecturer.id;
        session.locationId = location.id;
        markLocationUsed(slotKey, location.id);

        // Cập nhật queue
        queues.lecturers = queues.lecturers.filter(l => l.id !== lecturer!.id);
        queues.locations = queues.locations.filter(l => l.id !== location.id);

    } catch (error) {
        console.error(`Assignment failed for session:`, session);
        throw error;
    }
}

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
    usedLocations.clear();

    try {
        const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const data = rawData.filter(isValidSession);

        if (rawData.length !== data.length) {
            console.warn(`Filtered ${rawData.length - data.length} invalid records in ${path.basename(filePath)}`);
        }

        // Sửa ở đây: Thêm kiểu cho callback
        const weeks = Array.from(new Set<number>(data.map((s: ScheduleSession) => s.week)));

        for (const week of weeks) {
            const teamId = data[0]?.teamId;
            if (!teamId) throw new Error('Missing teamId in schedule data');

            const queues = await initializeQueues(teamId);
            // Sửa ở đây: Thêm kiểu cho callback
            const weekSessions = data.filter((s: ScheduleSession) => s.week === week);

            for (const session of weekSessions) {
                await assignSessionResources(session, queues, week);
            }
        }

        const newFilePath = filePath.replace('_incomplete', '_complete');
        fs.writeFileSync(newFilePath, JSON.stringify(data, null, 2));
        fs.unlinkSync(filePath);

        return newFilePath;
    } catch (error) {
        console.error(`File processing failed: ${path.basename(filePath)}`, error);
        throw error;
    }
}

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
                let errorMessage = 'Unknown error';
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                errors.push(`Failed to process ${file}: ${errorMessage}`);
            }
        }
    } finally {
        await prisma.$disconnect();
    }

    return { processedFiles, errors };
}