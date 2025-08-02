import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { format, parseISO } from 'date-fns';

const prisma = new PrismaClient();

// ========================
// JOB FUNCTIONS
// ========================

// Helper function to shuffle array
const shuffleArray = <T>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Function to assign lecturers and locations for sessions
function assignLecturerAndLocationForSessions(sessions: any[], lecturers: any[], locations: any[], allSubjects: any[], course: any): any[] {
  // Copy lại để không ảnh hưởng dữ liệu gốc
  const result: any[] = JSON.parse(JSON.stringify(sessions));
  
  // Group sessions by time slot
  const sessionsBySlot = new Map<string, any[]>();
  for (const session of result) {
    const slotKey = `${session.date}-${session.session}`;
    if (!sessionsBySlot.has(slotKey)) {
      sessionsBySlot.set(slotKey, []);
    }
    sessionsBySlot.get(slotKey)!.push(session);
  }
  
  // Process each time slot
  for (const [slotKey, slotSessions] of sessionsBySlot) {
    console.log(`\n=== Processing time slot: ${slotKey} (${slotSessions.length} sessions) ===`);
    
    // Create lecturer queue with session tracking
    let lecturerQueue = lecturers.map(l => ({
      ...l,
      assignedSessionsCount: 0
    }));
    
    // Create expanded location queue (each location with capacity=n has n entries)
    const createLocationQueue = () => {
      const queue: { location: any, slotCapacity: number }[] = [];
      for (const location of locations) {
        for (let i = 0; i < location.capacity; i++) {
          queue.push({ location, slotCapacity: 1 });
        }
      }
      return queue;
    };
    
    let locationQueue = createLocationQueue();
    const locationUsageInSlot = new Map<number, number>();
    
    // --- PHÂN GIẢNG VIÊN THEO PRIORITY ---
    for (const session of slotSessions) {
      if (!session.subjectId) continue;
      
      const subject = allSubjects.find(s => s.id === session.subjectId);
      if (!subject) continue;
      
      console.log(`\n🔍 Assigning lecturer for Team ${session.teamId} - Subject ${subject.name} (${subject.category})`);
      
      // Get team info for team leader priority
      const team = course.teams.find((t: any) => t.id === session.teamId);
      const teamLeaderId = team?.teamLeaderId;
      
      let assignedLecturerId: number | null = null;
      let lecturerToRemoveIndex = -1;
      
      // PRIORITY 1: Team leader có chuyên môn trùng với môn học
      console.log('Priority 1: Checking if team leader has specialization...');
      for (let i = 0; i < lecturerQueue.length; i++) {
        const lecturer = lecturerQueue[i];
        const hasSpecialization = lecturer.specializations?.some((spec: any) => spec.SubjectIdReference.id === session.subjectId);
        const withinMaxSessions = lecturer.assignedSessionsCount < lecturer.maxSessionsPerWeek;
        const isTeamLeader = lecturer.id === teamLeaderId;
        
        if (isTeamLeader && hasSpecialization && withinMaxSessions) {
          assignedLecturerId = lecturer.id;
          lecturerToRemoveIndex = i;
          console.log(`✓ Found specialized TEAM LEADER: ${lecturer.fullName}`);
          break;
        }
      }
      
      // PRIORITY 2: Lecturer khác có chuyên môn trùng với môn học
      if (!assignedLecturerId) {
        console.log('Priority 2: Searching for specialized lecturer...');
        for (let i = 0; i < lecturerQueue.length; i++) {
          const lecturer = lecturerQueue[i];
          const hasSpecialization = lecturer.specializations?.some((spec: any) => spec.SubjectIdReference.id === session.subjectId);
          const withinMaxSessions = lecturer.assignedSessionsCount < lecturer.maxSessionsPerWeek;
          
          if (hasSpecialization && withinMaxSessions) {
            assignedLecturerId = lecturer.id;
            lecturerToRemoveIndex = i;
            console.log(`✓ Found specialized lecturer: ${lecturer.fullName}`);
            break;
          }
        }
      }
      
      // PRIORITY 3: Any available lecturer (fallback)
      if (!assignedLecturerId) {
        console.log('Priority 3: Searching for any available lecturer...');
        for (let i = 0; i < lecturerQueue.length; i++) {
          const lecturer = lecturerQueue[i];
          const withinMaxSessions = lecturer.assignedSessionsCount < lecturer.maxSessionsPerWeek;
          
          if (withinMaxSessions) {
            assignedLecturerId = lecturer.id;
            lecturerToRemoveIndex = i;
            console.log(`✓ Found available lecturer: ${lecturer.fullName}`);
            break;
          }
        }
      }
      
      // Assign lecturer và update queue
      if (assignedLecturerId && lecturerToRemoveIndex >= 0) {
        session.lecturerId = assignedLecturerId;
        const lecturer = lecturerQueue[lecturerToRemoveIndex];
        lecturer.assignedSessionsCount++;
        
        // Remove lecturer from queue if reached max sessions
        if (lecturer.assignedSessionsCount >= lecturer.maxSessionsPerWeek) {
          lecturerQueue.splice(lecturerToRemoveIndex, 1);
          console.log(`Removed lecturer ${lecturer.fullName} from queue (reached max: ${lecturer.maxSessionsPerWeek})`);
        }
      } else {
        console.log(`✗ No suitable lecturer found for subject ${session.subjectId}`);
      }
    }
    
    console.log(`Remaining lecturers in queue: ${lecturerQueue.length}`);
    
    // --- PHÂN PHÒNG (USING EXPANDED QUEUE) ---
    for (const session of slotSessions) {
      if (!session.subjectId) continue;
      
      console.log(`\n🔍 Assigning location for subject ${session.subjectId}`);
      
      // Filter out locations that are already at capacity for this slot
      const availableLocationQueue = locationQueue.filter(item => {
        const currentUsageInSlot = locationUsageInSlot.get(item.location.id) || 0;
        return currentUsageInSlot < item.location.capacity;
      });
      
      let assignedLocationId: number | null = null;
      
      // Try to find a suitable location with subject compatibility first
      for (const item of availableLocationQueue) {
        const hasSubject = item.location.subjects?.some((sub: any) => sub.SubjectIdReference.id === session.subjectId);
        if (hasSubject) {
          assignedLocationId = item.location.id;
          console.log(`✓ Found suitable location: ${item.location.name}`);
          break;
        }
      }
      
      // If no subject-specific location, try any available location
      if (!assignedLocationId && availableLocationQueue.length > 0) {
        assignedLocationId = availableLocationQueue[0].location.id;
        console.log(`✓ Found fallback location: ${availableLocationQueue[0].location.name}`);
      }
      
      if (assignedLocationId) {
        session.locationId = assignedLocationId;
        locationUsageInSlot.set(assignedLocationId, (locationUsageInSlot.get(assignedLocationId) || 0) + 1);
      } else {
        console.log(`✗ No suitable location found for subject ${session.subjectId}`);
      }
    }
  }
  
  return result;
}

// Main job function
async function runAssignmentJob(courseId: number): Promise<{ processedFiles: string[]; errors: string[]; assignedCount: number }> {
  console.log('\n=== STARTING ASSIGNMENT JOB ===');
  const processedFiles: string[] = [];
  const errors: string[] = [];
  let totalAssignedCount = 0;
  
  try {
    // 1. Lấy thông tin course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teams: {
          include: {
            teamLeaderReference: true
          }
        }
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // 2. Lấy tất cả lecturers và locations
    const [lecturers, locations, allSubjects] = await Promise.all([
      prisma.lecturer.findMany({
        include: {
          specializations: {
            include: {
              SubjectIdReference: true
            }
          }
        }
      }),
      prisma.location.findMany({
        include: {
          subjects: {
            include: {
              SubjectIdReference: true
            }
          }
        }
      }),
      prisma.subject.findMany()
    ]);

    console.log(`📚 Found ${lecturers.length} lecturers, ${locations.length} locations, ${allSubjects.length} subjects`);

    // 3. Đọc tất cả schedule files cho course này
    const baseDir = path.join(process.cwd(), 'resource', 'schedules');
    
    for (const team of course.teams) {
      const scheduledDir = path.join(baseDir, `team${team.id}`, 'scheduled');
      const doneDir = path.join(baseDir, `team${team.id}`, 'done');
      
      try {
        const files = await fs.readdir(scheduledDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const inputPath = path.join(scheduledDir, file);
              const outputPath = path.join(doneDir, file);
              
              // Đọc file gốc
              const content = await fs.readFile(inputPath, 'utf8');
              const sessions = JSON.parse(content);
              
              console.log(`\n📄 Processing file: ${file} (${sessions.length} sessions)`);
              
              // Thực hiện assign resources
              const assignedSessions = assignLecturerAndLocationForSessions(sessions, lecturers, locations, allSubjects, course);
              
              // Đếm số resources đã assign
              const assignedCount = assignedSessions.filter(s => s.lecturerId && s.locationId).length;
              totalAssignedCount += assignedCount;
              
              console.log(`✅ Assigned ${assignedCount} resources for ${file}`);
              
              // Tạo thư mục done nếu chưa có
              await fs.mkdir(doneDir, { recursive: true });
              
              // Lưu file đã assign
              await fs.writeFile(outputPath, JSON.stringify(assignedSessions, null, 2), 'utf8');
              
              // Xóa file gốc
              await fs.unlink(inputPath);
              
              processedFiles.push(file);
              console.log(`✅ Moved: ${file} → done/`);
              
            } catch (fileError) {
              errors.push(`Error processing ${file}: ${fileError}`);
              console.error(`❌ Error processing ${file}:`, fileError);
            }
          }
        }
      } catch (error) {
        console.log(`No scheduled files for team ${team.id}`);
      }
    }
    
  } catch (error) {
    errors.push(`Job error: ${error}`);
    console.error('💥 Job error:', error);
  }
  
  console.log('\n=== JOB COMPLETED ===');
  console.log(`Processed files: ${processedFiles.length}`);
  console.log(`Total assigned resources: ${totalAssignedCount}`);
  console.log(`Errors: ${errors.length}`);
  
  return { processedFiles, errors, assignedCount: totalAssignedCount };
}

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

    // Chạy job assignment
    const result = await runAssignmentJob(courseId);
    
    // Update course status to Done if resources were assigned
    if (result.assignedCount > 0) {
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
      message: `Assigned resources to ${result.assignedCount} schedules`,
      assignedCount: result.assignedCount,
      processedFiles: result.processedFiles.length,
      errors: result.errors,
      courseStatusUpdated: result.assignedCount > 0
    });
    
  } catch (error) {
    console.error('💥 Error in assignment API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign resources' },
      { status: 500 }
    );
  }
} 