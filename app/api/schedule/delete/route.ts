import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, session, teamId, status } = body;

    if (!date || !session || !teamId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: date, session, teamId, status' 
      }, { status: 400 });
    }

    const baseDir = path.join(process.cwd(), 'resource/schedules');
    const teamDir = `team${teamId}`;
    const statusDir = path.join(baseDir, teamDir, status);

    // Tìm file chứa lịch cần xóa
    try {
      const files = await fs.readdir(statusDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(statusDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const scheduleData = JSON.parse(content);
          
          // Tìm và xóa item có date và session tương ứng
          const updatedData = scheduleData.filter((item: any) => 
            !(item.date === date && item.session === session)
          );
          
          // Nếu có thay đổi, ghi lại file
          if (updatedData.length !== scheduleData.length) {
            await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
            
            return NextResponse.json({ 
              success: true, 
              message: 'Đã xóa lịch thành công',
              deletedCount: scheduleData.length - updatedData.length
            });
          }
        }
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Không tìm thấy lịch cần xóa' 
      }, { status: 404 });
      
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Không thể đọc hoặc ghi file lịch' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Lỗi server khi xóa lịch' 
    }, { status: 500 });
  }
} 