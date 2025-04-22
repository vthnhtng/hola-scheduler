import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of subjects from the database. 
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const recordsPerPage = parseInt(url.searchParams.get('recordsPerPage') || '10', 10);
		const skip = (page - 1) * recordsPerPage;
		const take = recordsPerPage;

		const courses = await prisma.subject.findMany({
			skip,
			take,
		});

		const totalCount = await prisma.subject.count();
		const totalPages = Math.ceil(totalCount / recordsPerPage);

		return NextResponse.json({
			data: courses,
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
 * @param request - Request object containing the subject data.
 * @returns - Create new subject in the database.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, category, prerequisiteId } = body;

        const newSubject = await prisma.subject.create({
            data: {
                name,
                category,
                prerequisiteId,
            },
        });

        return NextResponse.json(
            { success: true, subject: newSubject },
            { status: 201 }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to create subject' },
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
        const { id } = await request.json();
        if (typeof id !== 'number') {
            return NextResponse.json(
                { error: 'Invalid or missing id' },
                { status: 400 }
            );
        }

        const deletedSubject = await prisma.subject.delete({
            where: { id },
        });

        return NextResponse.json(
            { success: true, subject: deletedSubject },
            { status: 200 }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to delete subject' },
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
        const { id, name, category, prerequisiteId } = body;

        if (typeof id !== 'number') {
            return NextResponse.json(
                { error: 'Invalid or missing subject_id' },
                { status: 400 }
            );
        }

        const updatedSubject = await prisma.subject.update({
            where: { id },
            data: {
                name,
                category,
                prerequisiteId,
            },
        });

        return NextResponse.json(
            { success: true, subject: updatedSubject },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update subject' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}