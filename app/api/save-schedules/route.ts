import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { schedules } = await request.json();
    
    if (!schedules || !Array.isArray(schedules)) {
      console.error('❌ Invalid schedules data:', schedules);
      return NextResponse.json(
        { error: 'Invalid schedules data' },
        { status: 400 }
      );
    }
    const baseDir = path.join(process.cwd(), 'resource', 'schedules');
    await cleanupOldFiles(baseDir);

    // 2. Sắp xếp lại thành các file JSON con theo tổ chức
    const teamWeekMap = organizeSchedulesByTeamAndWeek(schedules);
    console.log('🗂️ Organized into teams/weeks:', Object.keys(teamWeekMap));

    // 3. Ghi đè các file mới
    const saveResults = await saveNewFiles(teamWeekMap, baseDir);

    // 4. Update course status to Done if all schedules have lecturer and location
    let courseId: number | null = null;
    if (schedules.length > 0 && schedules[0]._metadata?.courseId) {
      courseId = schedules[0]._metadata.courseId;
    }

    if (courseId) {
      // Kiểm tra xem tất cả schedules đã có lecturer và location chưa
      const allSchedulesHaveResources = schedules.every(schedule => 
        schedule.lecturerId && schedule.locationId
      );
      if (allSchedulesHaveResources) {
        try {
          await prisma.course.update({
            where: { id: courseId },
            data: { status: 'Done' }
          });
        } catch (statusError) {
          console.error('❌ Failed to update course status:', statusError);
        }
      }
    }
    return NextResponse.json({ 
      success: true, 
      message: `Processed ${schedules.length} schedules into ${saveResults.length} files`,
      savedFiles: saveResults,
      courseStatusUpdated: courseId && schedules.every(s => s.lecturerId && s.locationId)
    });
    
  } catch (error) {
    console.error('💥 Error processing schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process schedules' },
      { status: 500 }
    );
  }
}

// Hàm xóa tất cả file cũ
async function cleanupOldFiles(baseDir: string) {
  try {
    const teamDirs = await fs.readdir(baseDir);
    
    for (const teamDir of teamDirs) {
      if (teamDir.startsWith('team')) {
        const doneDir = path.join(baseDir, teamDir, 'done');
        
        try {
          // Kiểm tra thư mục done có tồn tại không
          const stats = await fs.stat(doneDir);
          if (stats.isDirectory()) {
            // Xóa tất cả file trong thư mục done
            const files = await fs.readdir(doneDir);
            for (const file of files) {
              if (file.endsWith('.json')) {
                await fs.unlink(path.join(doneDir, file));
                console.log('🗑️ Deleted:', path.join(teamDir, 'done', file));
              }
            }
          }
        } catch (error) {
          // Thư mục done không tồn tại, bỏ qua
        }
      }
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Hàm sắp xếp schedule theo team và tuần
function organizeSchedulesByTeamAndWeek(schedules: any[]) {
  const teamWeekMap: Record<string, Record<string, any[]>> = {};
  
  schedules.forEach((schedule: any) => {
    if (!schedule.date || !schedule.teamId) return;
    
    const teamId = String(schedule.teamId);
    const date = typeof schedule.date === 'string' ? parseISO(schedule.date) : schedule.date;
    
    // Tính toán tuần (Thứ 2 đến Thứ 7)
    const weekStartDate = startOfWeek(date, { weekStartsOn: 1 });
    const weekEndDate = addDays(weekStartDate, 5); // Thứ 7
    
    const weekStart = format(weekStartDate, 'yyyy-MM-dd');
    const weekEnd = format(weekEndDate, 'yyyy-MM-dd');
    const weekKey = `${weekStart}_${weekEnd}`;
    
    if (!teamWeekMap[teamId]) teamWeekMap[teamId] = {};
    if (!teamWeekMap[teamId][weekKey]) teamWeekMap[teamId][weekKey] = [];
    
    // Làm sạch dữ liệu schedule
    const cleanedSchedule = {
      week: schedule.week,
      teamId: schedule.teamId,
      subjectId: schedule.subjectId,
      date: typeof schedule.date === 'string' ? schedule.date.split('T')[0] : format(schedule.date, 'yyyy-MM-dd'),
      dayOfWeek: schedule.dayOfWeek,
      session: schedule.session,
      lecturerId: schedule.lecturerId,
      locationId: schedule.locationId
    };
    
    teamWeekMap[teamId][weekKey].push(cleanedSchedule);
  });
  
  return teamWeekMap;
}

// Hàm ghi file mới
async function saveNewFiles(teamWeekMap: Record<string, Record<string, any[]>>, baseDir: string) {
  const savePromises = [];
  
  for (const [teamId, weekMap] of Object.entries(teamWeekMap)) {
    for (const [weekKey, weekSchedules] of Object.entries(weekMap)) {
      if (weekSchedules.length === 0) continue;
      
      const fileName = `week_${weekKey}.json`;
      const filePath = `team${teamId}/done/${fileName}`;
      const fullPath = path.join(baseDir, filePath);
      
      const savePromise = (async () => {
        try {
          // Tạo thư mục nếu chưa có
          const dir = path.dirname(fullPath);
          await fs.mkdir(dir, { recursive: true });
          
          // Ghi file
          await fs.writeFile(fullPath, JSON.stringify(weekSchedules, null, 2), 'utf8');
          return { filePath, success: true };
        } catch (error) {
          console.error('❌ Failed to save:', filePath, error);
          return { filePath, success: false, error: error };
        }
      })();
      
      savePromises.push(savePromise);
    }
  }
  
  const results = await Promise.all(savePromises);
  const failedSaves = results.filter(r => !r.success);
  
  if (failedSaves.length > 0) {
    console.error('Some saves failed:', failedSaves);
    throw new Error(`Failed to save ${failedSaves.length} files`);
  }
  
  return results.map(r => r.filePath);
}