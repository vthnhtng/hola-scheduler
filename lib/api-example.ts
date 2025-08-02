import { NextRequest, NextResponse } from 'next/server';
import { ScheduleExcelExporter } from './ScheduleExcelExporter';
import { ScheduleData } from '../types/ExcelExportTypes';

/**
 * Example API endpoint for exporting schedule to Excel
 * This shows how to use the ScheduleExcelExporter in an API context
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body to get schedule data
    const body = await request.json();
    const scheduleData: ScheduleData[] = body.scheduleData || [];
    
    if (!scheduleData || scheduleData.length === 0) {
      return NextResponse.json(
        { error: 'No schedule data provided' },
        { status: 400 }
      );
    }

    // Create exporter instance
    const exporter = new ScheduleExcelExporter({
      outputPath: 'temp/schedule-export.xlsx', // Temporary file
      teams: ['C1 (Nghĩa)', 'C2 (Nghĩa)', 'C3 (Đức)', 'C4 (TG.Tùng)', 'C5 (Việt Anh)', 'C6 (Đức)', 'C7 (TG.Lâm)']
    });

    // Export to buffer for API response
    const excelBuffer = await exporter.exportToBuffer(scheduleData);

    // Return Excel file as response
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="schedule-export.xlsx"',
        'Content-Length': excelBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('API Export Error:', error);
    return NextResponse.json(
      { error: 'Failed to export schedule to Excel' },
      { status: 500 }
    );
  }
}

/**
 * Example function for getting schedule data from database
 * This would typically fetch data from your database
 */
export async function getScheduleDataFromDatabase(): Promise<ScheduleData[]> {
  // This is a placeholder - replace with your actual database query
  // Example using Prisma:
  /*
  const scheduleData = await prisma.schedule.findMany({
    where: {
      // your conditions
    },
    orderBy: {
      date: 'asc'
    }
  });
  
  return scheduleData.map(item => ({
    week: item.week,
    teamId: item.teamId,
    subjectId: item.subjectId,
    date: item.date.toISOString().split('T')[0],
    dayOfWeek: item.dayOfWeek,
    session: item.session,
    lecturerId: item.lecturerId,
    locationId: item.locationId
  }));
  */
  
  // Return sample data for demonstration
  return [
    {
      week: 1,
      teamId: 1,
      subjectId: 1,
      date: "2025-05-19",
      dayOfWeek: "Mon",
      session: "morning",
      lecturerId: null,
      locationId: null
    },
    // ... more data
  ];
}

/**
 * Example function for saving Excel file to server
 */
export async function saveExcelToServer(scheduleData: ScheduleData[]): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `schedule-export-${timestamp}.xlsx`;
    const filepath = `exports/${filename}`;

    const exporter = new ScheduleExcelExporter({
      outputPath: filepath,
      teams: ['C1 (Nghĩa)', 'C2 (Nghĩa)', 'C3 (Đức)', 'C4 (TG.Tùng)', 'C5 (Việt Anh)', 'C6 (Đức)', 'C7 (TG.Lâm)']
    });

    await exporter.export(scheduleData);
    
    return filepath;
  } catch (error) {
    console.error('Error saving Excel file:', error);
    throw new Error('Failed to save Excel file');
  }
} 