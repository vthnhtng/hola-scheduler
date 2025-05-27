import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of curriculums from the database. 
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    if (request.method !== 'GET') {
        return NextResponse.json({ message: 'Phương thức không hợp lệ' }, { status: 405 })
    }

	try {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const curriculums = await prisma.curriculum.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });

        const totalCount = await prisma.curriculum.count();
        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            data: curriculums,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCount: totalCount,
            },
        });
	} catch (error) {
		return NextResponse.json({ error: 'Có lỗi xảy ra khi lấy danh sách chương trình' }, { status: 500 });
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
