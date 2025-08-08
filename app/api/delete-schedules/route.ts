import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { updateUnavailableAfterDelete } from '../../assign/updateUnavailableResources';

export async function POST(req: NextRequest) {
  try {
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing courseId' 
      }, { status: 400 });
    }

    // Lấy thông tin course và teams từ database
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      include: {
        teams: true
      }
    });

    if (!course) {
      return NextResponse.json({ 
        success: false, 
        error: 'Course not found' 
      }, { status: 404 });
    }

    if (course.teams.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Course has no teams to delete schedules from',
        deletedFiles: []
      });
    }

    const baseDir = path.join(process.cwd(), 'resource/schedules');
    const deletedFiles: string[] = [];

    // Xóa tất cả files trong thư mục done và scheduled của các teams thuộc course
    for (const team of course.teams) {
      const teamDir = `team${team.id}`;
      
      // Xóa files trong thư mục done
      const doneDir = path.join(baseDir, teamDir, 'done');
      try {
        const doneFiles = await fs.readdir(doneDir);
        for (const file of doneFiles) {
          if (file.endsWith('.json')) {
            const filePath = path.join(doneDir, file);
            await fs.unlink(filePath);
            deletedFiles.push(`${teamDir}/done/${file}`);
          }
        }
      } catch (error) {
        // Ignore read errors for non-existent directories
      }

      // Xóa files trong thư mục scheduled
      const scheduledDir = path.join(baseDir, teamDir, 'scheduled');
      try {
        const scheduledFiles = await fs.readdir(scheduledDir);
        for (const file of scheduledFiles) {
          if (file.endsWith('.json')) {
            const filePath = path.join(scheduledDir, file);
            await fs.unlink(filePath);
            deletedFiles.push(`${teamDir}/scheduled/${file}`);
          }
        }
      } catch (error) {
        // Ignore read errors for non-existent directories
      }
    }

    // Cập nhật SessionUnavailable sau khi xóa files
    await updateUnavailableAfterDelete();

    // Cập nhật status của course về 'Undone'
    await prisma.course.update({
      where: { id: Number(courseId) },
      data: { status: 'Undone' }
    });
    
    return NextResponse.json({
      success: true,
      message: `Đã xóa ${deletedFiles.length} file lịch cho khóa học ${course.name}`,
      deletedFiles: deletedFiles,
      course: {
        id: course.id,
        name: course.name,
        status: 'Undone'
      }
    });

  } catch (error) {
    console.error('Error deleting schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa lịch' },
      { status: 500 }
    );
  }
} 