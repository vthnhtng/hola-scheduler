import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const { filePath, content } = await request.json();
        
        if (!filePath || !content) {
            return NextResponse.json(
                { error: 'Missing filePath or content' },
                { status: 400 }
            );
        }

        // Cho phép filePath có dạng team{teamId}/scheduled/week_{startDate}_{endDate}.json
        // Kiểm tra teamId từ thư mục
        const match = filePath.match(/^team(\d+)\/scheduled\//);
        if (!match) {
            return NextResponse.json(
                { error: 'Invalid filePath format. Expected: team{teamId}/scheduled/week_{startDate}_{endDate}.json' },
                { status: 400 }
            );
        }

        // Lưu file đúng đường dẫn filePath truyền lên
        const fileName = path.basename(filePath);
        const matchDate = fileName.match(/^week_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})\.json$/);
        if (matchDate) {
            const endDate = matchDate[2];
            const endDay = new Date(endDate).getDay();
            if (endDay === 0) {
                return NextResponse.json(
                    { error: 'Do not allow saving week file ending on Sunday' },
                    { status: 400 }
                );
            }
        }
        const fullPath = path.join(process.cwd(), 'resource', 'schedules', filePath);
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
        // Save the updated schedule
        await fs.writeFile(fullPath, JSON.stringify(content, null, 2), 'utf8');
        return NextResponse.json({ 
            success: true, 
            message: 'Schedule saved successfully',
            filePath: fullPath 
        });
    } catch (error) {
        console.error('Error saving schedule:', error);
        return NextResponse.json(
            { error: 'Failed to save schedule' },
            { status: 500 }
        );
    }
} 