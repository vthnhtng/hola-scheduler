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
      orderBy: { id: 'asc' }
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
  const { name, status } = body;
  const course = await prisma.course.create({
    data: { name, status }
  });
  return NextResponse.json({ success: true, data: course });
}

// PUT: Sửa Course
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, status } = body;
  const course = await prisma.course.update({
    where: { id: Number(id) },
    data: { name, status }
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