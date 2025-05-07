import { NextResponse } from 'next/server';
import { generateSchedulesForTeamsJob } from '@/app/scheduler/generator';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { startDate } = body;

        if (!startDate) {
            return NextResponse.json(
                { error: 'Start date is required' },
                { status: 400 }
            );
        }

        const result = await generateSchedulesForTeamsJob(new Date(startDate));

        return NextResponse.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Failed to generate schedules:', error);
        return NextResponse.json(
            { error: 'Failed to generate schedules' },
            { status: 500 }
        );
    }
} 