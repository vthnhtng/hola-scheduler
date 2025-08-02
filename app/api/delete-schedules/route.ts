import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

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

    console.log('🗑️ Deleting schedules for course:', course.name, 'with teams:', course.teams.map(t => ({ id: t.id, name: t.name })));

    if (course.teams.length === 0) {
      console.log('⚠️ Course has no teams, nothing to delete');
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
      console.log(`🗑️ Checking team directory: ${teamDir} (${team.name})`);
      
      // Xóa files trong thư mục done
      const doneDir = path.join(baseDir, teamDir, 'done');
      try {
        const doneFiles = await fs.readdir(doneDir);
        console.log(`📄 Found ${doneFiles.length} files in ${doneDir}`);
        for (const file of doneFiles) {
          if (file.endsWith('.json')) {
            const filePath = path.join(doneDir, file);
            await fs.unlink(filePath);
            deletedFiles.push(`${teamDir}/done/${file}`);
            console.log(`🗑️ Deleted: ${teamDir}/done/${file}`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Error reading ${doneDir}:`, error);
      }

      // Xóa files trong thư mục scheduled
      const scheduledDir = path.join(baseDir, teamDir, 'scheduled');
      try {
        const scheduledFiles = await fs.readdir(scheduledDir);
        console.log(`📄 Found ${scheduledFiles.length} files in ${scheduledDir}`);
        for (const file of scheduledFiles) {
          if (file.endsWith('.json')) {
            const filePath = path.join(scheduledDir, file);
            await fs.unlink(filePath);
            deletedFiles.push(`${teamDir}/scheduled/${file}`);
            console.log(`🗑️ Deleted: ${teamDir}/scheduled/${file}`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Error reading ${scheduledDir}:`, error);
      }
    }

    // Cập nhật status của course về 'Undone'
    await prisma.course.update({
      where: { id: Number(courseId) },
      data: { status: 'Undone' }
    });

    console.log(`✅ Deleted ${deletedFiles.length} files for course ${course.name}`);
    
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