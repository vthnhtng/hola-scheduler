import { NextRequest } from 'next/server';
import { generateSchedulesForTeamsJob } from '@/app/scheduler/generator';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { withAuth, logApiActivity, createErrorResponse, createSuccessResponse, validateRequestBody } from '@/lib/api-helpers';

const prisma = new PrismaClient();

/**
 * Generate schedules for teams in a course
 * @param request - Request containing courseId and optionally startDate/endDate
 * @returns Response with generated schedule files
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      console.log('==== [API] /api/generate-schedules called ====');
      console.log('Request body:', req.body);
      console.log('Received request body:', body); // Debug log

      // Validate required fields
      const validationError = validateRequestBody(body, ['courseId']);
      if (validationError) {
        return createErrorResponse(validationError, 400);
      }

      const { courseId, startDate, endDate } = body;

      // Convert courseId to integer for Prisma
      const courseIdInt = parseInt(courseId as string, 10);
      if (isNaN(courseIdInt)) {
        console.log('Invalid courseId:', courseId); // Debug log
        return createErrorResponse('Invalid course ID format', 400);
      }

      console.log('Looking for course with ID:', courseIdInt); // Debug log

      // Get course information from database
      const course = await prisma.course.findUnique({
        where: { id: courseIdInt },
        include: {
          teams: true // Include teams in this course
        }
      });

      if (!course) {
        console.log('Course not found for ID:', courseIdInt); // Debug log
        return createErrorResponse('Course not found', 404);
      }

      console.log('Course found:', course);
      console.log('Found course:', course.name, 'with teams:', course.teams.length); // Debug log

      if (!course.teams || course.teams.length === 0) {
        return createErrorResponse('No teams found in this course', 400);
      }

      // If startDate/endDate provided, update course first
      if (startDate || endDate) {
        const updateData: any = {};
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);

        console.log('Updating course with dates:', updateData); // Debug log

        await prisma.course.update({
          where: { id: courseIdInt },
          data: updateData
        });

        // Update local course object with new dates
        if (startDate) course.startDate = new Date(startDate);
        if (endDate) course.endDate = new Date(endDate);
      }

      // Use course start date or current date
      const scheduleStartDate = course.startDate ? new Date(course.startDate) : new Date();

      // Map teams to match the expected interface
      const mappedTeams = course.teams.map(team => ({
        ...team,
        universityId: course.id // Map courseId to universityId for compatibility
      }));

      console.log('Teams:', mappedTeams);
      console.log('Generating schedules for teams:', mappedTeams.length); // Debug log

      // Generate schedules for teams in this course
      console.log('Calling generateSchedulesForTeamsJob with:', {
        startDate: scheduleStartDate,
        teamsCount: mappedTeams.length,
        teams: mappedTeams.map(t => ({ id: t.id, name: t.name, program: t.program }))
      });
      const result = await generateSchedulesForTeamsJob(scheduleStartDate, mappedTeams);
      console.log('Result from generateSchedulesForTeamsJob:', result);
      console.log('Result errors:', result.errors);
      console.log('Result processedFiles:', result.processedFiles);

      if (result.errors.length > 0) {
        console.error('Errors during schedule generation:', result.errors); // Debug log
        // Không return error ngay, vẫn thử đọc file nếu có
        console.warn('Continue despite errors to check if any files were created');
      }

      // Small delay to ensure files are written
      await new Promise(resolve => setTimeout(resolve, 100));

      // Read processed files content
      const fileContents: { [key: string]: unknown } = {};
      const scheduleData: any[] = []; // Array để chứa tất cả dữ liệu lịch
      
      // Read files from each team's scheduled directory
      for (const team of mappedTeams) {
        const teamScheduleDir = path.join(process.cwd(), 'resource', 'schedules', `team${team.id}`, 'scheduled');
        console.log('Checking team directory:', teamScheduleDir); // Debug log
        
        if (fs.existsSync(teamScheduleDir)) {
          const files = fs.readdirSync(teamScheduleDir)
            .filter(f => f.startsWith('week_') && f.endsWith('.json'));
          console.log(`Team ${team.id} schedule files:`, files);
          
          console.log('Found files for team', team.id, ':', files); // Debug log
          
          for (const fileName of files) {
            const filePath = path.join(teamScheduleDir, fileName);
            console.log('Reading file:', filePath); // Debug log
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const key = `team${team.id}_${fileName}`;
            fileContents[key] = content;
            
            // Thêm dữ liệu vào scheduleData để trả về UI
            if (Array.isArray(content)) {
              scheduleData.push(...content.map((item: any) => ({
                ...item,
                teamName: team.name,
                fileName: fileName
              })));
            }
            
            console.log('Added to fileContents:', key, 'with', content.length, 'items'); // Debug log
          }
        } else {
          console.warn('Team directory does not exist:', teamScheduleDir); // Debug log
        }
      }

      console.log('Generated files:', Object.keys(fileContents)); // Debug log
      console.log('File contents count:', Object.keys(fileContents).length); // Debug log
      console.log('Processed files from result:', result.processedFiles); // Debug log
      console.log('Total schedule items for UI:', scheduleData.length); // Debug log
      console.log('Final scheduleData:', scheduleData);

      // Update course status to Processing if generation was successful
      if (result.processedFiles.length > 0) {
        try {
          await prisma.course.update({
            where: { id: courseIdInt },
            data: { status: 'Processing' }
          });
          console.log('Course status updated to Processing');
        } catch (statusError) {
          console.error('Failed to update course status:', statusError);
        }
      }

      // Log activity
      await logApiActivity(user.id, 'POST', '/api/generate-schedules', {
        courseId,
        courseName: course.name,
        startDate: scheduleStartDate.toISOString(),
        teamsCount: course.teams.length,
        processedFiles: result.processedFiles.length,
        errors: result.errors.length,
        datesUpdated: !!(startDate || endDate),
        statusUpdated: result.processedFiles.length > 0
      });

      const response = createSuccessResponse({
        course: {
          id: course.id,
          name: course.name,
          startDate: course.startDate,
          endDate: course.endDate
        },
        teamsCount: course.teams.length,
        processedFiles: result.processedFiles,
        errors: result.errors,
        fileContents,
        scheduleData, // Dữ liệu lịch cho UI
        totalScheduleItems: scheduleData.length,
        datesUpdated: !!(startDate || endDate)
      });

      console.log('==== [API] /api/generate-schedules response ====', response);
      console.log('Sending response:', response); // Debug log
      console.log('Response data structure:', {
        hasCourse: !!response.data?.course,
        hasTeamsCount: !!response.data?.teamsCount,
        hasFileContents: !!response.data?.fileContents,
        hasScheduleData: !!response.data?.scheduleData,
        fileContentsKeys: Object.keys(response.data?.fileContents || {}),
        fileContentsCount: Object.keys(response.data?.fileContents || {}).length,
        scheduleDataCount: response.data?.scheduleData?.length || 0
      }); // Debug log
      return response;

    } catch (err) {
      console.error('Exception in /api/generate-schedules:', err);
      return createErrorResponse('Internal server error', 500);
    }
  }, { resource: 'schedules', action: 'generate' });
}
