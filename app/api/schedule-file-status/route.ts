import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { teamIds, startDate, endDate } = await req.json();
    const results = [];
    for (const teamId of teamIds) {
      const filePath = path.join(process.cwd(), `Resource/Schedules/Team_${teamId}/Scheduled/week_${startDate}_${endDate}.json`);
      const exists = fs.existsSync(filePath);
      let hasLecturer = false;
      let hasLocation = false;
      if (exists) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        hasLecturer = data.some((s: any) => s.lecturerId !== null);
        hasLocation = data.some((s: any) => s.locationId !== null);
      }
      results.push({ teamId, exists, hasLecturer, hasLocation });
    }
    return NextResponse.json({ status: results });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 