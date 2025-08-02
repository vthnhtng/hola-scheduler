import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const status = searchParams.get('status') || 'all'; // 'scheduled', 'done', 'all'

  if (!courseId) {
    return NextResponse.json({ 
      success: false, 
      error: 'Missing courseId' 
    }, { status: 400 });
  }

  try {
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

    const baseDir = path.join(process.cwd(), 'resource/schedules');
    let result: any[] = [];
    const statusFolders = status === 'all' ? ['scheduled', 'done'] : [status];

    // Lấy schedules cho tất cả teams thuộc course này
    for (const team of course.teams) {
      const teamDir = `team${team.id}`;
      
      for (const statusFolder of statusFolders) {
        const statusDir = path.join(baseDir, teamDir, statusFolder);
        
        try {
          const files = await fs.readdir(statusDir);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const content = await fs.readFile(path.join(statusDir, file), 'utf8');
              const scheduleData = JSON.parse(content);
              
              // Thêm metadata cho mỗi schedule item
              const enrichedData = scheduleData.map((item: any) => ({
                ...item,
                _metadata: {
                  status: statusFolder,
                  fileName: file,
                  teamDir: teamDir,
                  teamId: team.id,
                  teamName: team.name,
                  courseId: course.id,
                  courseName: course.name
                }
              }));
              
              result.push(...enrichedData);
            }
          }
        } catch (error) {
          // Folder không tồn tại hoặc không thể đọc, bỏ qua
          continue;
        }
      }
    }

    // Sắp xếp theo date và session
    result.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const sessionOrder = { morning: 1, afternoon: 2, evening: 3 };
      return sessionOrder[a.session] - sessionOrder[b.session];
    });

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
      course: {
        id: course.id,
        name: course.name,
        startDate: course.startDate,
        endDate: course.endDate,
        status: course.status
      },
      teams: course.teams.map(team => ({
        id: team.id,
        name: team.name
      }))
    });
  } catch (error) {
    console.error('Error getting schedules by course:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy schedules theo course' },
      { status: 500 }
    );
  }
} 