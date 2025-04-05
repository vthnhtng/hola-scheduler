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
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to create lecturer' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (typeof id !== 'number') {
            return NextResponse.json(
                { error: 'Invalid or missing id' },
                { status: 400 }
            );
        }

        const deleted = await prisma.lecturers.delete({
            where: { lecturer_id: id },
        });

        return NextResponse.json(
            { success: true, lecturer: deleted },
            { status: 200 }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to delete lecturer' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { lecturer_id, full_name, faculty, max_sessions_per_week } = body;

        if (typeof lecturer_id !== 'number') {
            return NextResponse.json(
                { error: 'Invalid or missing lecturer_id' },
                { status: 400 }
            );
        }

        const updatedLecturer = await prisma.lecturers.update({
            where: { lecturer_id },
            data: {
                full_name,
                faculty,
                max_sessions_per_week,
            },
        });

        return NextResponse.json(
            { success: true, lecturer: updatedLecturer },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update lecturer' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
