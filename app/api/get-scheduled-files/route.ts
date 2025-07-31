import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');

  try {
    const baseDir = path.join(process.cwd(), 'resource/schedules');
    let teamDirs: string[] = [];

    if (teamId) {
      teamDirs = [`team${teamId}`];
    } else {
      // Lấy tất cả team directories
      const allDirs = await fs.readdir(baseDir, { withFileTypes: true });
      teamDirs = allDirs
        .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('team'))
        .map(dirent => dirent.name);
    }

    const result: Record<string, {
      scheduled: string[],
      done: string[]
    }> = {};

    for (const teamDir of teamDirs) {
      const teamPath = path.join(baseDir, teamDir);
      result[teamDir] = {
        scheduled: [],
        done: []
      };

      // Kiểm tra từng folder status
      for (const status of ['scheduled', 'done'] as const) {
        const statusDir = path.join(teamPath, status);
        try {
          const files = await fs.readdir(statusDir);
          result[teamDir][status] = files
            .filter(file => file.endsWith('.json'))
            .sort(); // Sắp xếp theo tên file (date)
        } catch (error) {
          // Folder không tồn tại hoặc không thể đọc
          result[teamDir][status] = [];
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting scheduled files:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy danh sách files schedule' },
      { status: 500 }
    );
  }
} 