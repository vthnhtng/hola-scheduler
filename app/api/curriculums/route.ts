import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of curriculums from the database. 
 */
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

		const curriculums = await prisma.curriculum.findMany({
			skip,
			take,
		});

		const totalCount = await prisma.curriculum.count();
		const totalPages = Math.ceil(totalCount / recordsPerPage);

		return NextResponse.json({
			data: curriculums,
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
 * @param request - Request object containing the curriculum data.
 * @returns - Create new curriculum in the database.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { program } = body;

        const newCurriculum = await prisma.curriculum.create({
            data: {
                program,
            },
        });

        return NextResponse.json(
            { success: true, curriculum: newCurriculum },
            { status: 201 }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to create curriculum' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing the curriculum ID to delete.
 * @returns - Delete curriculum from the database.
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

        const deletedCurriculum = await prisma.curriculum.delete({
            where: { id },
        });

        return NextResponse.json(
            { success: true, curriculum: deletedCurriculum },
            { status: 200 }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to delete curriculum' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * @param request - Request object containing the curriculum data to update.
 * @returns - Change curriculum information in the database.
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, program } = body;

        if (typeof id !== 'number') {
            return NextResponse.json(
                { error: 'Invalid or missing curriculum_id' },
                { status: 400 }
            );
        }

        const updatedCurriculum = await prisma.curriculum.update({
            where: { id },
            data: {
                program,
            },
        });

        return NextResponse.json(
            { success: true, curriculum: updatedCurriculum },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update curriculum' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
