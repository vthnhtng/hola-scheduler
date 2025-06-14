import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of lecturers from the database. 
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    if (request.method !== 'GET') {
        return NextResponse.json({ message: 'Phương thức không hợp lệ' }, { status: 405 })
    }

	try {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const lecturers = await prisma.lecturer.findMany({
            skip: (page - 1) * limit,
            take: limit,
        });

        const totalCount = await prisma.lecturer.count();
        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            data: lecturers,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCount: totalCount,
            },
        });
	} catch (error) {
		return NextResponse.json({ error: 'Có lỗi xảy ra khi lấy danh sách giảng viên' }, { status: 500 });
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

        const newLecturer = await prisma.lecturer.create({
            data: {
                fullName: body.fullName,
                faculty: body.faculty,
                maxSessionsPerWeek: parseInt(body.maxSessionsPerWeek),
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
 * @param request - Request object containing the subject ID to delete.
 * @returns - Delete subject from the database.
 */
export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const lecturerId = parseInt(body.id);

        const deletedLecturer = await prisma.lecturer.delete({
            where: { id: lecturerId }
        });

        return NextResponse.json(
            { success: true, lecturer: deletedLecturer },
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

