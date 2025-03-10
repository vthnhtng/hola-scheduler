import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const lecturers = await prisma.lecturers.findMany();
        return NextResponse.json(lecturers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch lecturers' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { full_name, faculty, max_sessions_per_week } = body;

        const newLecturer = await prisma.lecturers.create({
            data: {
                full_name,
                faculty,
                max_sessions_per_week,
            },
        });

        // Return success message with the created lecturer data
        return NextResponse.json(
            { success: true, lecturer: newLecturer },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create lecturer' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
