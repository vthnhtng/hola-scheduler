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

        const subjects = await prisma.subject.findMany({
            skip: (page - 1) * recordsPerPage,
            take: recordsPerPage,
        });

		const totalCount = await prisma.subject.count();
		const totalPages = Math.ceil(totalCount / recordsPerPage);

		return NextResponse.json({
			data: subjects,
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

        const newSubject = await prisma.subject.create({
            data: {
                name: body.name,
                category: body.category,
                prerequisiteId: parseInt(body.prerequisiteId),
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
        const body = await request.json();
        const subjectId = parseInt(body.id);

        await prisma.subject.updateMany({
            where: { prerequisiteId: subjectId },
            data: { prerequisiteId: null }
        });
        
        const deletedSubject = await prisma.subject.delete({
            where: { id: subjectId }
        });

        return NextResponse.json(
            { success: true, subject: deletedSubject },
            { status: 200 }
        );
    } catch (e) {
        console.log(e);
        return NextResponse.json(
            { error: 'Có lỗi xảy ra khi xóa môn học' },
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

        const updatedSubject = await prisma.subject.update({
            where: { id: parseInt(body.id) },
            data: {
                name: body.name,
                category: body.category,
                prerequisiteId: parseInt(body.prerequisiteId),
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