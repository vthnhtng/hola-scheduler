import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function POST(request: NextRequest) {
    if (request.method !== 'POST') {
        return NextResponse.json({ message: 'Phương thức không hợp lệ' }, { status: 405 })
    }

	try {
        const requestData = await request.json();
        const { targetId, data } = requestData;
        const lecturerId = targetId;
        const subjectIds = data.map((subject: any) => subject.subject);
        const filteredSubjectIds = [...new Set(subjectIds.filter((subjectId: string) => subjectId !== ''))] as string[];

        const lecturer = await prisma.lecturer.findUnique({
            where: {
                id: parseInt(lecturerId)
            }
        });

        if (!lecturer) {
            return NextResponse.json({ error: 'Giảng viên không tồn tại' }, { status: 400 });
        }
        
        await prisma.lecturerSpecialization.deleteMany({
            where: {
                lecturerId: parseInt(lecturerId)
            }
        });

        await prisma.lecturerSpecialization.createMany({
            data: filteredSubjectIds.map((subjectId: string) => ({
                lecturerId: parseInt(lecturerId),
                subjectId: parseInt(subjectId),
            }))
        });

        return NextResponse.json({ message: 'Thành công' }, { status: 200 });
	} catch (error) {
        console.log(error);
		return NextResponse.json({ error: 'Có lỗi xảy ra khi lưu danh sách môn chuyên sâu' }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}
