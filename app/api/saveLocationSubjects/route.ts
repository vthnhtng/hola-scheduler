import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    if (request.method !== 'POST') {
        return NextResponse.json({ message: 'Phương thức không hợp lệ' }, { status: 405 })
    }

    try {
        const requestData = await request.json();
        const { targetId, data } = requestData;
        const locationId = targetId;
        const subjectIds = data.map((subject: any) => subject.subject);
        const filteredSubjectIds = [...new Set(subjectIds.filter((subjectId: string) => subjectId !== ''))] as string[];

        const location = await prisma.location.findUnique({
            where: {
                id: parseInt(locationId)
            }
        });

        if (!location) {
            return NextResponse.json({ error: 'Địa điểm không tồn tại' }, { status: 400 });
        }

        await prisma.locationSubject.deleteMany({
            where: {
                locationId: parseInt(locationId)
            }
        });

        await prisma.locationSubject.createMany({
            data: filteredSubjectIds.map((subjectId: string) => ({
                locationId: parseInt(locationId),
                subjectId: parseInt(subjectId),
            }))
        });

        return NextResponse.json({ message: 'Thành công' }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Có lỗi xảy ra khi lưu danh sách môn học cho địa điểm' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 