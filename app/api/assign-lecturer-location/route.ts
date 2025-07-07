import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { assignLecturerAndLocationForSessions } from '@/app/assign/assignResources';

export async function POST(req: NextRequest) {
  try {
    const { teamIds, startDate, endDate } = await req.json();
    const results = [];
    const errors = [];
    for (const teamId of teamIds) {
      const filePath = path.join(process.cwd(), `Resource/Schedules/Team_${teamId}/Scheduled/week_${startDate}_${endDate}.json`);
      if (!fs.existsSync(filePath)) {
        errors.push({ teamId, error: 'Schedule file not found' });
        continue;
      }
      const sessions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (sessions.some((s: any) => s.lecturerId !== null || s.locationId !== null)) {
        errors.push({ teamId, error: 'Lecturer/location already assigned' });
        continue;
      }
      const assigned = await assignLecturerAndLocationForSessions(sessions);
      fs.writeFileSync(filePath, JSON.stringify(assigned, null, 2), 'utf-8');
      results.push({ teamId, schedule: assigned });
    }
    if (errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 409 });
    }
    return NextResponse.json({ teams: results });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 