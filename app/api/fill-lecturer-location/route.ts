import { NextResponse } from 'next/server';
import { runAssignmentJob } from '@/app/assign/assignResources';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Run the assignment job
        const result = await runAssignmentJob();
        
        // Read processed files content
        const fileContents: { [key: string]: any } = {};
        const doneDir = path.join(process.cwd(), 'schedules/done');
        
        for (const fileName of result.processedFiles) {
            const filePath = path.join(doneDir, fileName);
            if (fs.existsSync(filePath)) {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                fileContents[fileName] = content;
            }
        }
        
        return NextResponse.json({
            success: true,
            data: {
                processedFiles: result.processedFiles,
                errors: result.errors,
                fileContents
            }
        });
    } catch (error) {
        console.error('Error in fill-lecturer-location API:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
} 