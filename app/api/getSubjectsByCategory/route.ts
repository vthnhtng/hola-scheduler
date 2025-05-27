import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Category } from '@prisma/client';

/**
 * @returns - Returns a list of subjects by category. 
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    if (request.method !== 'GET') {
        return NextResponse.json({ message: 'Phương thức không hợp lệ' }, { status: 405 })
    }

	try {
        const category = searchParams.get('category') || '';

        if (category !== 'CT' && category !== 'QS') {
            return NextResponse.json({ error: 'Loại không hợp lệ' }, { status: 400 });
        }

        const subjects = await prisma.subject.findMany({
            where: {
                category:  category as Category
            }
        });

        return NextResponse.json({
            data: subjects
        });
	} catch (error) {
		return NextResponse.json({ error: 'Có lỗi xảy ra khi lấy danh sách môn học theo loại' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}

