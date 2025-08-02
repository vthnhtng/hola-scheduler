import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Cập nhật status của Course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, status } = body;

    if (!courseId || !status) {
      return NextResponse.json(
        { success: false, error: 'courseId và status là bắt buộc' },
        { status: 400 }
      );
    }

    const course = await prisma.course.update({
      where: { id: Number(courseId) },
      data: { status }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Course ${courseId} đã được cập nhật status thành ${status}`,
      data: course 
    });
  } catch (error) {
    console.error('Update course status error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi cập nhật status course' },
      { status: 500 }
    );
  }
} 