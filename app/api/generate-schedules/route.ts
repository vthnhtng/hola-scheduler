import { NextResponse } from 'next/server';
import { generateSchedulesForTeamsJob } from '@/app/scheduler/generator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate schedules for specified teams
 * @param request - Request containing array of team IDs
 * @returns Response with generated schedule files
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamIds } = body;

    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return NextResponse.json({
        error: 'Invalid team IDs list'
      }, { status: 400 });
    }

    // Get teams data from database
    const teams = await prisma.team.findMany({
      where: {
        id: {
          in: teamIds
        }
      }
    });

    if (teams.length !== teamIds.length) {
      return NextResponse.json({
        error: 'Some team IDs are invalid or not found'
      }, { status: 400 });
    }

    // Generate schedules for specified teams
    const result = await generateSchedulesForTeamsJob(new Date(), teams);

    if (result.errors.length > 0) {
      return NextResponse.json({
        error: 'Error generating schedules',
        details: result.errors
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      processedFiles: result.processedFiles,
      message: `Successfully generated schedules for ${result.processedFiles.length} file(s)`
    });
  } catch (error) {
    console.error('Error generating schedules:', error);
    return NextResponse.json({
      error: 'Server error while generating schedules',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
