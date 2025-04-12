import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

/**
 * Task: Change DB Schema
 * Date: 12/04/2025
 * Assignee: khoiphamhuy25
 * @returns - Returns a list of lecturers from the database. 
 */
export async function GET() {
    try {
        const lecturers = await prisma.lecturer.findMany();  // Correct model name 'lecturer' - khoiphamhuy25
        return NextResponse.json(lecturers);
    } catch (error) {
        return NextResponse.json({ error: error }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Task: Change DB Schema
 * Date: 12/04/2025
 * Assignee: khoiphamhuy25
 * @param request - Request object containing the lecturer data.
 * @returns - Create new lecturer in the database.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fullName, faculty, maxSessionsPerWeek } = body;  // Updated to match field names in the schema - khoiphamhuy25

        const newLecturer = await prisma.lecturer.create({  // Updated to 'lecturer' - khoiphamhuy25
            data: {
                fullName,  // Updated field name
                faculty,  // Updated field name
                maxSessionsPerWeek,  // Updated field name
            },
        });

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

/**
 * Task: Change DB Schema
 * Date: 12/04/2025
 * Assignee: khoiphamhuy25
 * @param request - Request object containing the lecturer ID to delete.
 * @returns - Delete lecturer from the database.
 */
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (typeof id !== 'number') {
            return NextResponse.json(
                { error: 'Invalid or missing id' },
                { status: 400 }
            );
        }

        const deleted = await prisma.lecturer.delete({  // Updated to 'lecturer' - khoiphamhuy25
            where: { id },  // Corrected field name 'id' - khoiphamhuy25
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

/**
 * Task: Change DB Schema
 * Date: 12/04/2025
 * Assignee: khoiphamhuy25
 * @param request - Request object containing the lecturer data to update.
 * @returns - Change lecturer information in the database.
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, fullName, faculty, maxSessionsPerWeek } = body;  // Updated to match field names in the schema - khoiphamhuy25

        if (typeof id !== 'number') {
            return NextResponse.json(
                { error: 'Invalid or missing lecturer_id' },
                { status: 400 }
            );
        }

        const updatedLecturer = await prisma.lecturer.update({  // Updated to 'lecturer' - khoiphamhuy25
            where: { id },  // Corrected field name 'id'- khoiphamhuy25
            data: {
                fullName,  // Updated field name - khoiphamhuy25
                faculty,  // Updated field name - khoiphamhuy25
                maxSessionsPerWeek,  // Updated field name - khoiphamhuy25
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