
import { NextResponse } from 'next/server';
import { runAssignmentJob } from '@/app/assign/assignResources';


export async function GET() {
  try {
    const result = await runAssignmentJob();
    return NextResponse.json({
      success: true,
      message: 'Job executed successfully',
      data: result
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Job execution failed' },
      { status: 500 }
    );
  }
}