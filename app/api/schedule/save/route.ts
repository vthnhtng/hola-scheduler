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

        // Parse filePath to extract team and fileName
        // Expected format: team{teamId}_{fileName}
        const match = filePath.match(/^team(\d+)_(.+)$/);
        if (!match) {
            return NextResponse.json(
                { error: 'Invalid filePath format. Expected: team{teamId}_{fileName}' },
                { status: 400 }
            );
        }

        const teamId = match[1];
        const fileName = match[2];
        
        // Construct full file path
        const fullPath = path.join(process.cwd(), 'resource', 'schedules', `team${teamId}`, 'scheduled', fileName);
        
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