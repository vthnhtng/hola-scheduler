import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of lecturers from the database. 
 */
export async function GET() {
    try {
        const lecturerSpecializations = await prisma.lecturerSpecialization.findMany();
        return NextResponse.json(lecturerSpecializations);
    } catch (error) {
        return NextResponse.json({ error: error }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing the subject data.
 * @returns - Create new subject in the database.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const newLecturerSpecialization = await prisma.lecturerSpecialization.create({
            data: {
                lecturerId: body.lecturerId,
                subjectId: body.subjectId,
            },
        });

        return NextResponse.json(
            { success: true, lecturerSpecialization: newLecturerSpecialization },
            { status: 201 }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to create lecturer specialization' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing the subject ID to delete.
 * @returns - Delete subject from the database.
 */
export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const lecturerId = parseInt(body.id);

        const deletedLecturerSpecialization = await prisma.lecturerSpecialization.delete({
            where: { lecturerId_subjectId: { lecturerId: lecturerId, subjectId: parseInt(body.subjectId) } }
        });

        return NextResponse.json(
            { success: true, lecturerSpecialization: deletedLecturerSpecialization },
            { status: 200 }
        );
    } catch (e) {
        console.log(e);
        return NextResponse.json(
            { error: 'Failed to delete lecturer specialization' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing the subject data to update.
 * @returns - Change subject information in the database.
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();

        const updatedLecturer = await prisma.lecturer.update({
            where: { id: parseInt(body.id) },
            data: {
                fullName: body.fullName,
                faculty: body.faculty,
                maxSessionsPerWeek: parseInt(body.maxSessionsPerWeek),
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
