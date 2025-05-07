import { NextResponse } from 'next/server';
import { generateSchedulesForTeamsJob } from '@/app/scheduler/generator';

// Get schedules for all teams (GET)
export async function GET() {
  try {
    // Use today's date as the start date
    const startDate = new Date();

    // Generate schedules for all teams using the job function
    const result = await generateSchedulesForTeamsJob(startDate);

    if (result.errors.length > 0) {
      return NextResponse.json({ 
        error: 'Lỗi khi tạo lịch học', 
        details: result.errors 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      processedFiles: result.processedFiles,
      message: `Đã tạo lịch học thành công cho ${result.processedFiles.length} file`
    });
  } catch (error) {
    console.error('Lỗi khi tạo lịch học:', error);
    return NextResponse.json({ 
      error: 'Lỗi server khi tạo lịch học',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
