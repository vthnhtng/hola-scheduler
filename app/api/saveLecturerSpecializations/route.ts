import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function POST(request: NextRequest) {
    if (request.method !== 'POST') {
        return NextResponse.json({ message: 'Phương thức không hợp lệ' }, { status: 405 })
    }

	try {
        console.log('[LECTURER-SPECIALIZATION] Nhận request lưu liên kết môn chuyên sâu');
        const requestData = await request.json();
        console.log('[LECTURER-SPECIALIZATION] requestData:', requestData);
        const { targetId, data } = requestData;
        const lecturerId = targetId;
        const subjectIds = data.map((subject: any) => subject.subject);
        const filteredSubjectIds = [...new Set(subjectIds.filter((subjectId: string) => subjectId !== ''))] as string[];
        console.log('[LECTURER-SPECIALIZATION] filteredSubjectIds:', filteredSubjectIds);

        const lecturer = await prisma.lecturer.findUnique({
            where: {
                id: parseInt(lecturerId)
            }
        });
        console.log('[LECTURER-SPECIALIZATION] lecturer:', lecturer);

        if (!lecturer) {
            console.log('[LECTURER-SPECIALIZATION] Giảng viên không tồn tại');
            return NextResponse.json({ error: 'Giảng viên không tồn tại' }, { status: 400 });
        }
        
        const deleteResult = await prisma.lecturerSpecialization.deleteMany({
            where: {
                lecturerId: parseInt(lecturerId)
            }
        });
        console.log('[LECTURER-SPECIALIZATION] Đã xóa', deleteResult.count, 'bản ghi cũ');

        if (filteredSubjectIds.length === 0) {
            console.log('[LECTURER-SPECIALIZATION] Không có môn nào để lưu');
            return NextResponse.json({ message: 'Thành công (không có môn nào)' }, { status: 200 });
        }

        const createResult = await prisma.lecturerSpecialization.createMany({
            data: filteredSubjectIds.map((subjectId: string) => ({
                lecturerId: parseInt(lecturerId),
                subjectId: parseInt(subjectId),
            })),
            skipDuplicates: true
        });
        console.log('[LECTURER-SPECIALIZATION] Đã tạo', createResult.count, 'bản ghi mới');

        return NextResponse.json({ message: 'Thành công' }, { status: 200 });
	} catch (error) {
        console.error('[LECTURER-SPECIALIZATION] Lỗi khi lưu:', error);
		return NextResponse.json({ error: 'Có lỗi xảy ra khi lưu danh sách môn chuyên sâu', detail: error?.message }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}
