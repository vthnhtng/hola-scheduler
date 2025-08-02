import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const teamId = searchParams.get('teamId');
  const status = searchParams.get('status') || 'all'; // 'scheduled', 'done', 'all'

  if (!startDate || !endDate) {
    return NextResponse.json({ 
      success: false, 
      error: 'Missing startDate or endDate' 
    }, { status: 400 });
  }

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

    let result: any[] = [];
    const statusFolders = status === 'all' ? ['scheduled', 'done'] : [status];

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
                  const scheduleData = JSON.parse(content);
                  
                  // Thêm metadata cho mỗi schedule item
                  const enrichedData = scheduleData.map((item: any) => ({
                    ...item,
                    _metadata: {
                      status: statusFolder,
                      fileName: file,
                      teamDir: teamDir,
                      teamIdFromDir: teamDir.replace('team', '')
                    }
                  }));
                  
                  result.push(...enrichedData);
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

    // Sắp xếp theo date và session
    result.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const sessionOrder = { morning: 1, afternoon: 2, evening: 3 };
      return sessionOrder[a.session] - sessionOrder[b.session];
    });

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    console.error('Error getting schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi lấy schedules' },
      { status: 500 }
    );
  }
} 