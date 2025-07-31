import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { schedules } = await request.json();
    
    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: 'Invalid schedules data' },
        { status: 400 }
      );
    }

    console.log('📁 Saving schedules:', schedules.length);

    // Group schedules by team and week
    const teamWeekMap: Record<string, Record<string, any[]>> = {};
    
    schedules.forEach((schedule: any) => {
      if (!schedule.date || !schedule.teamId) return;
      
      const teamId = String(schedule.teamId);
      const date = typeof schedule.date === 'string' ? parseISO(schedule.date) : schedule.date;
      
      // Calculate week range (Monday to Saturday)
      const weekStartDate = startOfWeek(date, { weekStartsOn: 1 });
      const weekEndDate = addDays(weekStartDate, 5); // Saturday
      
      const weekStart = format(weekStartDate, 'yyyy-MM-dd');
      const weekEnd = format(weekEndDate, 'yyyy-MM-dd');
      const weekKey = `${weekStart}_${weekEnd}`;
      
      if (!teamWeekMap[teamId]) teamWeekMap[teamId] = {};
      if (!teamWeekMap[teamId][weekKey]) teamWeekMap[teamId][weekKey] = [];
      
      // Clean schedule data
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

    // Save each team's weekly files
    const savePromises = [];
    
    for (const [teamId, weekMap] of Object.entries(teamWeekMap)) {
      for (const [weekKey, weekSchedules] of Object.entries(weekMap)) {
        if (weekSchedules.length === 0) continue;
        
        const fileName = `week_${weekKey}.json`;
        const filePath = `team${teamId}/scheduled/${fileName}`;
        const fullPath = path.join(process.cwd(), 'resource', 'schedules', filePath);
        
        const savePromise = (async () => {
          try {
            // Ensure directory exists
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
            
            // Save file
            await fs.writeFile(fullPath, JSON.stringify(weekSchedules, null, 2), 'utf8');
            console.log('✅ Saved:', filePath);
            
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
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to save ${failedSaves.length} files`,
          details: failedSaves 
        },
        { status: 500 }
      );
    }
    
    console.log('🎉 All files saved successfully!');
    return NextResponse.json({ 
      success: true, 
      message: `Saved ${results.length} schedule files successfully`,
      savedFiles: results.map(r => r.filePath)
    });
    
  } catch (error) {
    console.error('💥 Error saving schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save schedules' },
      { status: 500 }
    );
  }
}