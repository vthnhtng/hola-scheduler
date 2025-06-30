import { NextResponse } from 'next/server';
import { generateSchedulesForTeamsJob } from '@/app/scheduler/generator';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { withAuth, logApiActivity, createErrorResponse, createSuccessResponse, validateRequestBody } from '@/lib/api-helpers';

const prisma = new PrismaClient();

/**
 * Generate schedules for specified teams
 * @param request - Request containing array of team IDs
 * @returns Response with generated schedule files
 */
export async function POST(request: Request) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();

      // Validate required fields
      const validationError = validateRequestBody(body, ['teamIds']);
      if (validationError) {
        return createErrorResponse(validationError, 400);
      }

      const { teamIds } = body;

      if (!Array.isArray(teamIds) || teamIds.length === 0) {
        return createErrorResponse('Invalid team IDs list', 400);
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
        return createErrorResponse('Some team IDs are invalid or not found', 400);
      }

      // Generate schedules for specified teams
      const result = await generateSchedulesForTeamsJob(new Date(), teams);

      if (result.errors.length > 0) {
        return createErrorResponse('Error generating schedules', 500);
      }

      // Read processed files content
      const fileContents: { [key: string]: any } = {};
      const scheduledDir = path.join(process.cwd(), 'schedules/scheduled');
      
      for (const fileName of result.processedFiles) {
        const filePath = path.join(scheduledDir, fileName);
        if (fs.existsSync(filePath)) {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          fileContents[fileName] = content;
        }
      }

      // Log activity
      await logApiActivity(user.id, 'POST', '/api/generate-schedules', {
        teamIds,
        processedFiles: result.processedFiles.length,
        errors: result.errors.length
      });

      return createSuccessResponse({
        processedFiles: result.processedFiles,
        errors: result.errors,
        fileContents
      });

    } catch (error) {
      console.error('Error generating schedules:', error);
      return createErrorResponse('Server error while generating schedules', 500);
    }
  }, { resource: 'schedules', action: 'generate' });
}
