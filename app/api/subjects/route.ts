import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, logApiActivity, createErrorResponse, createSuccessResponse, validateRequestBody, parsePaginationParams, createPaginationResponse } from '@/lib/api-helpers';

/**
 * @returns - Returns a list of subjects from the database. 
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (req, user) => {
        try {
            const { page, limit, skip } = parsePaginationParams(req);
            
            const subjects = await prisma.subject.findMany({
                skip,
                take: limit,
            });

            const totalCount = await prisma.subject.count();

            // Log activity
            await logApiActivity(user.id, 'GET', '/api/subjects', { page, limit });

            return NextResponse.json(createPaginationResponse(subjects, page, limit, totalCount));
        } catch (error) {
            console.error('Error fetching subjects:', error);
            return createErrorResponse('Có lỗi xảy ra khi lấy danh sách môn học', 500);
        } finally {
            await prisma.$disconnect();
        }
    }, { resource: 'subjects', action: 'read' });
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