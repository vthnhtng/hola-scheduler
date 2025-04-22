import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of lecturers from the database. 
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const recordsPerPage = parseInt(url.searchParams.get('recordsPerPage') || '10', 10);
		const skip = (page - 1) * recordsPerPage;
		const take = recordsPerPage;

		const lecturers = await prisma.lecturer.findMany({
			skip,
			take,
		});

		const totalCount = await prisma.lecturer.count();
		const totalPages = Math.ceil(totalCount / recordsPerPage);

		return NextResponse.json({
			data: lecturers,
			pagination: {
				currentPage: page,
				totalPages: totalPages,
				totalCount: totalCount,
			},
		});
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}

/**
 * @param request - Request object containing the lecturer data.
 * @returns - Create new lecturer in the database.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fullName, faculty, maxSessionsPerWeek } = body;

        const newLecturer = await prisma.lecturer.create({
            data: {
                fullName,
                faculty,
                maxSessionsPerWeek,
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

        const deletedLecturer = await prisma.lecturer.delete({
            where: { id },
        });

        return NextResponse.json(
            { success: true, lecturer: deletedLecturer },
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
 * @param request - Request object containing the lecturer data to update.
 * @returns - Change lecturer information in the database.
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, fullName, faculty, maxSessionsPerWeek } = body;

        if (typeof id !== 'number') {
            return NextResponse.json(
                { error: 'Invalid or missing lecturer_id' },
                { status: 400 }
            );
        }

        const updatedLecturer = await prisma.lecturer.update({
            where: { id },
            data: {
                fullName,
                faculty,
                maxSessionsPerWeek,
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