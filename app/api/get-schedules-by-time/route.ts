import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const team = searchParams.get('team');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
  }

  const baseDir = path.join(process.cwd(), 'resource/schedules');
  let teamDirs: string[] = [];

  if (team) {
    teamDirs = [`team${team}`];
  } else {
    teamDirs = (await fs.readdir(baseDir, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('team'))
      .map(dirent => dirent.name);
  }

  let result: any[] = [];
  for (const t of teamDirs) {
    const doneDir = path.join(baseDir, t, 'done');
    let files: string[] = [];
    try {
      files = await fs.readdir(doneDir);
    } catch { continue; }
    for (const file of files) {
      if (file.endsWith('.json')) {
        // Tên file: week_{start}_{end}.json
        const match = file.match(/week_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})\.json/);
        if (match) {
          const [ , fileStart, fileEnd ] = match;
          if (fileStart >= startDate && fileEnd <= endDate) {
            const content = await fs.readFile(path.join(doneDir, file), 'utf8');
            result.push(JSON.parse(content));
          }
        }
      }
    }
  }

  if (result.length === 0) return NextResponse.json(null);
  return NextResponse.json(result);
} 