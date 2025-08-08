import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { runAssignmentJob } from '../../assign/assignResources';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { courseId, startDate, endDate } = await request.json();
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Starting assignment job for course:', courseId);

    // Chạy job assignment using new queue logic from assignResources.ts
    const result = await runAssignmentJob();
    
    // Update course status to Done if files were processed
    if (result.processedFiles.length > 0) {
      try {
        await prisma.course.update({
          where: { id: courseId },
          data: { status: 'Done' }
        });
        console.log('✅ Course status updated to Done');
      } catch (statusError) {
        console.error('❌ Failed to update course status:', statusError);
      }
    }

    console.log('🎉 Resource assignment completed successfully!');
    return NextResponse.json({ 
      success: true, 
      message: `Processed ${result.processedFiles.length} files with new queue logic`,
      processedFiles: result.processedFiles,
      errors: result.errors,
      courseStatusUpdated: result.processedFiles.length > 0
    });
    
  } catch (error) {
    console.error('💥 Error in assignment API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign resources' },
      { status: 500 }
    );
  }
}