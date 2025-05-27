import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @returns - Returns a list of subjects by lecturer. 
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    if (request.method !== 'GET') {
        return NextResponse.json({ message: 'Phương thức không hợp lệ' }, { status: 405 })
    }

	try {
        const lecturerId = searchParams.get('lecturerId') || '';

        if (!lecturerId) {
            return NextResponse.json({ error: 'Mã giảng viên không hợp lệ' }, { status: 400 });
        }

        const subjectIds = await prisma.lecturerSpecialization.findMany({
            where: {
                lecturerId:  parseInt(lecturerId)
            }
        });

        const subjects = await prisma.subject.findMany({
            where: {
                id: {
                    in: subjectIds.map((subject) => subject.subjectId)
                }
            }
        });

        return NextResponse.json({
            data: subjects.map((subject) => ({
                value: subject.id.toString(),
                label: subject.name
            }))
        });
	} catch (error) {
		return NextResponse.json({ error: 'Có lỗi xảy ra khi lấy danh sách môn học theo giảng viên' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}

