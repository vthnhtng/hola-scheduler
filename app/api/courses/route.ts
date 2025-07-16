import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Lấy danh sách Course (có phân trang)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 10;
  const skip = (page - 1) * limit;

  const [data, totalCount] = await Promise.all([
    prisma.course.findMany({
      skip,
      take: limit,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        school: true,
        startDate: true,
        endDate: true,
        status: true,
      }
    }),
    prisma.course.count()
  ]);

  return NextResponse.json({
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    }
  });
}

// POST: Thêm mới Course
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, school, startDate, endDate } = body;
  const course = await prisma.course.create({
    data: {
      name,
      school,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: 'Undone'
    }
  });
  return NextResponse.json({ success: true, data: course });
}

// PUT: Sửa Course
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, school, startDate, endDate } = body;
  // Chỉ cập nhật startDate và endDate nếu cả hai trường đều có trong request
  const updateData: any = { name, school };
  if (startDate && endDate) {
    updateData.startDate = new Date(startDate);
    updateData.endDate = new Date(endDate);
  }
  const course = await prisma.course.update({
    where: { id: Number(id) },
    data: updateData
  });
  return NextResponse.json({ success: true, data: course });
}

// DELETE: Xóa Course
export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;
  await prisma.course.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
} 