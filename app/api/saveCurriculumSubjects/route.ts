import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    if (request.method !== 'POST') {
        return NextResponse.json({ message: 'Phương thức không hợp lệ' }, { status: 405 })
    }

    try {
        const requestData = await request.json();
        const { targetId, data } = requestData;
        const curriculumId = targetId;
        const subjectIds = data.map((subject: any) => subject.subject);
        const filteredSubjectIds = [...new Set(subjectIds.filter((subjectId: string) => subjectId !== ''))] as string[];

        const curriculum = await prisma.curriculum.findUnique({
            where: {
                id: parseInt(curriculumId)
            }
        });

        if (!curriculum) {
            return NextResponse.json({ error: 'Chương trình không tồn tại' }, { status: 400 });
        }

        await prisma.curriculumSubject.deleteMany({
            where: {
                curriculumId: parseInt(curriculumId)
            }
        });

        await prisma.curriculumSubject.createMany({
            data: filteredSubjectIds.map((subjectId: string) => ({
                curriculumId: parseInt(curriculumId),
                subjectId: parseInt(subjectId),
            }))
        });

        return NextResponse.json({ message: 'Thành công' }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Có lỗi xảy ra khi lưu danh sách môn học cho chương trình' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 