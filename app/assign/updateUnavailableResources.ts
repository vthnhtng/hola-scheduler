import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type SessionType = "morning" | "afternoon" | "evening";

interface ScheduleSession {
    week: number;
    teamId: number;
    subjectId: number | null;
    date: string;
    session: SessionType;
    lecturerId: number | null;
    locationId: number | null;
}

export async function updateUnavailableAfterDelete(
    deletedSessions?: ScheduleSession[],
    affectedDates?: string[],
    teamIds?: number[],
): Promise<void> {
    try {
        if (!affectedDates || affectedDates.length === 0) {
            await rebuildAllUnavailableResources();
            return;
        }

        for (const date of affectedDates) {
            await rebuildUnavailableForDate(date);
        }
    } catch (error) {
        throw error;
    }
}

async function rebuildAllUnavailableResources(): Promise<void> {
    await prisma.sessionUnavailable.deleteMany({});
    const baseDir = path.join(process.cwd(), "resource/schedules");

    if (!fs.existsSync(baseDir)) {
        return;
    }

    const teamDirs = fs
        .readdirSync(baseDir)
        .filter(
            (d) =>
                fs.statSync(path.join(baseDir, d)).isDirectory() &&
                d.startsWith("team"),
        );

    const allSessions: ScheduleSession[] = [];

    for (const teamDir of teamDirs) {
        const doneDir = path.join(baseDir, teamDir, "done");

        if (fs.existsSync(doneDir)) {
            const files = fs
                .readdirSync(doneDir)
                .filter((f) => f.endsWith(".json"));

            for (const file of files) {
                const filePath = path.join(doneDir, file);
                const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
                allSessions.push(...content);
            }
        }
    }

    const sessionsByDateAndType = new Map<string, ScheduleSession[]>();

    for (const session of allSessions) {
        if (session.lecturerId || session.locationId) {
            const key = `${session.date}_${session.session}`;
            if (!sessionsByDateAndType.has(key)) {
                sessionsByDateAndType.set(key, []);
            }
            sessionsByDateAndType.get(key)!.push(session);
        }
    }

    for (const [key, sessions] of sessionsByDateAndType) {
        const [date, sessionType] = key.split("_");
        const sessionId = `${sessionType}_${date.replace(/-/g, "")}`;

        const usedLecturers = [
            ...new Set(
                sessions.map((s) => s.lecturerId).filter(Boolean) as number[],
            ),
        ];
        const usedLocations = [
            ...new Set(
                sessions.map((s) => s.locationId).filter(Boolean) as number[],
            ),
        ];

        if (usedLecturers.length > 0 || usedLocations.length > 0) {
            await prisma.sessionUnavailable.create({
                data: {
                    sessionId,
                    unavailableLecturers: usedLecturers,
                    unavailableLocations: usedLocations,
                },
            });
        }
    }
}

async function rebuildUnavailableForDate(date: string): Promise<void> {
    const sessionTypes: SessionType[] = ["morning", "afternoon", "evening"];

    for (const sessionType of sessionTypes) {
        const sessionId = `${sessionType}_${date.replace(/-/g, "")}`;

        await prisma.sessionUnavailable.deleteMany({
            where: { sessionId },
        });

        const sessions = await getAllSessionsForDateAndType(date, sessionType);

        const usedLecturers = [
            ...new Set(
                sessions.map((s) => s.lecturerId).filter(Boolean) as number[],
            ),
        ];
        const usedLocations = [
            ...new Set(
                sessions.map((s) => s.locationId).filter(Boolean) as number[],
            ),
        ];

        if (usedLecturers.length > 0 || usedLocations.length > 0) {
            await prisma.sessionUnavailable.create({
                data: {
                    sessionId,
                    unavailableLecturers: usedLecturers,
                    unavailableLocations: usedLocations,
                },
            });
        }
    }
}

async function getAllSessionsForDateAndType(
    date: string,
    sessionType: SessionType,
): Promise<ScheduleSession[]> {
    const baseDir = path.join(process.cwd(), "resource/schedules");
    const allSessions: ScheduleSession[] = [];

    if (!fs.existsSync(baseDir)) {
        return allSessions;
    }

    const teamDirs = fs
        .readdirSync(baseDir)
        .filter(
            (d) =>
                fs.statSync(path.join(baseDir, d)).isDirectory() &&
                d.startsWith("team"),
        );

    for (const teamDir of teamDirs) {
        const doneDir = path.join(baseDir, teamDir, "done");

        if (fs.existsSync(doneDir)) {
            const files = fs
                .readdirSync(doneDir)
                .filter((f) => f.endsWith(".json"));

            for (const file of files) {
                const filePath = path.join(doneDir, file);
                const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

                const matchingSessions = content.filter(
                    (session: ScheduleSession) =>
                        session.date === date &&
                        session.session === sessionType &&
                        (session.lecturerId || session.locationId),
                );

                allSessions.push(...matchingSessions);
            }
        }
    }

    return allSessions;
}
