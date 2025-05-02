import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateSchedulesForTeams } from '@/app/scheduler/generator';

// Get schedules for all teams (GET)
export async function GET() {
  try {
    // Fetch all teams from the database
    const teams = await prisma.team.findMany();

    if (teams.length === 0) {
      return NextResponse.json({ schedules: [], message: 'Không có lớp học nào để tạo lịch' });
    }

    // Use today's date as the start date
    const startDate = new Date(); // Current date as start date

    // Generate schedules for all teams
    const schedules = await generateSchedulesForTeams(teams, startDate);

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Lỗi khi tạo lịch học:', error);
    return NextResponse.json({ error: 'Lỗi server khi tạo lịch học' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
