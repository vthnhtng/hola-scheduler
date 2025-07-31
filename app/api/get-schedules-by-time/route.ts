import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

interface ScheduleItem {
  week: number;
  teamId: number;
  subjectId: number;
  date: string;
  dayOfWeek: string;
  session: 'morning' | 'afternoon' | 'evening';
  lecturerId: number | null;
  locationId: number | null;
}

interface TimetableData {
  date: string;
  session: 'morning' | 'afternoon' | 'evening';
  teamId: string;
  class: {
    subject: string;
    lecturer: string;
    location: string;
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const courseId = searchParams.get('courseId');
  const status = searchParams.get('status') || 'all'; // 'scheduled', 'done', 'all'
  
  // Thêm các filter parameters mới
  const lecturerId = searchParams.get('lecturerId');
  const subjectId = searchParams.get('subjectId');
  const locationId = searchParams.get('locationId');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
  }

  try {
    // Lấy thông tin subjects, lecturers, locations từ database
    const [subjects, lecturers, locations] = await Promise.all([
      prisma.subject.findMany(),
      prisma.lecturer.findMany(),
      prisma.location.findMany()
    ]);

  const baseDir = path.join(process.cwd(), 'resource/schedules');
  let teamDirs: string[] = [];

    if (courseId) {
      // Lấy danh sách teams từ courseId
      try {
        const teams = await prisma.team.findMany({
          where: { courseId: parseInt(courseId) },
          select: { id: true }
        });
        teamDirs = teams.map(team => `team${team.id}`);
      } catch (error) {
        return NextResponse.json({ error: 'Unable to fetch teams for course' }, { status: 500 });
      }
  } else {
      try {
        const allDirs = await fs.readdir(baseDir, { withFileTypes: true });
        teamDirs = allDirs
      .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('team'))
      .map(dirent => dirent.name);
      } catch (error) {
        return NextResponse.json({ error: 'Unable to read schedules directory' }, { status: 500 });
      }
    }

    let allScheduleItems: ScheduleItem[] = [];
    const statusFolders = status === 'all' ? ['scheduled', 'done'] : [status];

    // Đọc files từ các folders
    for (const teamDir of teamDirs) {
      for (const statusFolder of statusFolders) {
        const statusDir = path.join(baseDir, teamDir, statusFolder);
        
        try {
          const files = await fs.readdir(statusDir);
          
    for (const file of files) {
      if (file.endsWith('.json')) {
        // Tên file: week_{start}_{end}.json
        const match = file.match(/week_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})\.json/);
        if (match) {
                const [, fileStart, fileEnd] = match;
                
                // Kiểm tra nếu file nằm trong khoảng thời gian yêu cầu
          if (fileStart >= startDate && fileEnd <= endDate) {
                  const content = await fs.readFile(path.join(statusDir, file), 'utf8');
                  const scheduleData: ScheduleItem[] = JSON.parse(content);
                  allScheduleItems.push(...scheduleData);
                }
              }
            }
          }
        } catch (error) {
          // Folder không tồn tại hoặc không thể đọc, bỏ qua
          continue;
        }
      }
    }

    if (allScheduleItems.length === 0) {
      return NextResponse.json(null);
    }

    // Apply server-side filters before converting
    let filteredScheduleItems = allScheduleItems;

    // Filter by lecturer
    if (lecturerId) {
      filteredScheduleItems = filteredScheduleItems.filter(item => 
        item.lecturerId?.toString() === lecturerId
      );
    }

    // Filter by subject
    if (subjectId) {
      filteredScheduleItems = filteredScheduleItems.filter(item => 
        item.subjectId?.toString() === subjectId
      );
    }

    // Filter by location
    if (locationId) {
      filteredScheduleItems = filteredScheduleItems.filter(item => 
        item.locationId?.toString() === locationId
      );
    }

    // Convert sang format TimetableData
    const timetableData: TimetableData[] = filteredScheduleItems.map(item => {
      // Tìm thông tin subject, lecturer, location
      const subject = subjects.find(s => s.id === item.subjectId);
      const lecturer = lecturers.find(l => l.id === item.lecturerId);
      const location = locations.find(loc => loc.id === item.locationId);

      return {
        date: item.date,
        session: item.session,
        teamId: item.teamId.toString(),
        class: {
          subject: subject?.name || `Subject ${item.subjectId}`,
          lecturer: lecturer?.fullName || 'TBA',
          location: location?.name || 'TBA'
        }
      };
    });

    // Tạo danh sách teams và dateRange
    const teams = [...new Set(timetableData.map(item => item.teamId))].sort();
    const dates = [...new Set(timetableData.map(item => item.date))].sort();
    const dateRange = dates.length > 0 ? {
      from: dates[0],
      to: dates[dates.length - 1]
    } : undefined;

    // Trả về format mà TimeTable component expect
    const result = [{
      timetableData,
      teams,
      dateRange
    }];

  return NextResponse.json(result);

  } catch (error) {
    console.error('Error in get-schedules-by-time:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 