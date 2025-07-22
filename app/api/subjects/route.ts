import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth, logApiActivity, createErrorResponse, createSuccessResponse, validateRequestBody, parsePaginationParams, createPaginationResponse } from '@/lib/api-helpers';

/**
 * @returns - Returns a list of subjects from the database. 
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    if (page && limit) {
      // Trả về phân trang như cũ
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const skip = (pageNum - 1) * limitNum;
      const [subjects, total] = await Promise.all([
        prisma.subject.findMany({ skip, take: limitNum }),
        prisma.subject.count()
      ]);
      return NextResponse.json({ success: true, data: subjects, total });
    } else {
      // Không có page/limit: trả về toàn bộ
      const subjects = await prisma.subject.findMany();
      return NextResponse.json({ success: true, data: subjects });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
  }
}

/**
 * @returns - Returns a list of subjects from the database (no pagination, no filtering).
 */
export async function GET_ALL() {
  try {
    // Lấy toàn bộ subjects, không phân trang
    const subjects = await prisma.subject.findMany();
    return NextResponse.json({ success: true, data: subjects });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
  }
}

/**
 * @param request - Request object containing the subject data.
 * @returns - Create new subject in the database.
 */
export async function POST(request: NextRequest) {
    return withAuth(request, async (req, user) => {
        try {
            const body = await req.json();

            // Validate required fields
            const validationError = validateRequestBody(body, ['name', 'category']);
            if (validationError) {
                return createErrorResponse(validationError, 400);
            }

            const newSubject = await prisma.subject.create({
                data: {
                    name: body.name,
                    category: body.category,
                    prerequisiteId: body.prerequisiteId ? parseInt(body.prerequisiteId) : null,
                },
            });

            // Log activity
            await logApiActivity(user.id, 'POST', '/api/subjects', { 
                subjectId: newSubject.id,
                subjectName: newSubject.name 
            });

            return createSuccessResponse(newSubject, 201);
        } catch (error) {
            console.error('Error creating subject:', error);
            return createErrorResponse('Failed to create subject', 500);
        } finally {
            await prisma.$disconnect();
        }
    }, { resource: 'subjects', action: 'create' });
}

/**
 * @param request - Request object containing the subject ID to delete.
 * @returns - Delete subject from the database.
 */
export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req, user) => {
        try {
            const body = await req.json();

            // Validate required fields
            const validationError = validateRequestBody(body, ['id']);
            if (validationError) {
                return createErrorResponse(validationError, 400);
            }

            const subjectId = parseInt(body.id);

            // Update subjects that have this as prerequisite
            await prisma.subject.updateMany({
                where: { prerequisiteId: subjectId },
                data: { prerequisiteId: null }
            });
            
            const deletedSubject = await prisma.subject.delete({
                where: { id: subjectId }
            });

            // Log activity
            await logApiActivity(user.id, 'DELETE', '/api/subjects', { 
                subjectId: deletedSubject.id,
                subjectName: deletedSubject.name 
            });

            return createSuccessResponse(deletedSubject);
        } catch (error) {
            console.error('Error deleting subject:', error);
            return createErrorResponse('Có lỗi xảy ra khi xóa môn học', 500);
        } finally {
            await prisma.$disconnect();
        }
    }, { resource: 'subjects', action: 'delete' });
}

/**
 * @param request - Request object containing the subject data to update.
 * @returns - Change subject information in the database.
 */
export async function PUT(request: NextRequest) {
    return withAuth(request, async (req, user) => {
        try {
            const body = await req.json();

            // Validate required fields
            const validationError = validateRequestBody(body, ['id', 'name', 'category']);
            if (validationError) {
                return createErrorResponse(validationError, 400);
            }

            const updatedSubject = await prisma.subject.update({
                where: { id: parseInt(body.id) },
                data: {
                    name: body.name,
                    category: body.category,
                    prerequisiteId: body.prerequisiteId ? parseInt(body.prerequisiteId) : null,
                },
            });

            // Log activity
            await logApiActivity(user.id, 'PUT', '/api/subjects', { 
                subjectId: updatedSubject.id,
                subjectName: updatedSubject.name 
            });

            return createSuccessResponse(updatedSubject);
        } catch (error) {
            console.error('Error updating subject:', error);
            return createErrorResponse('Failed to update subject', 500);
        } finally {
            await prisma.$disconnect();
        }
    }, { resource: 'subjects', action: 'update' });
}