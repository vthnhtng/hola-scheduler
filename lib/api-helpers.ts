import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize, logUserActivity, Permission } from './auth';

/**
 * Wrapper function to protect API routes with authentication and authorization
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
  requiredPermission?: Permission
): Promise<NextResponse> {
  try {
    // Check authentication and authorization
    const authResult = await authenticateAndAuthorize(request, requiredPermission);
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // Call handler function with authenicated user
    return await handler(request, authResult.user);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper để log API activity
 */
export async function logApiActivity(
  userId: number,
  method: string,
  endpoint: string,
  details?: any
): Promise<void> {
  await logUserActivity(userId, method.toLowerCase(), endpoint, details);
}

/**
 * Helper để tạo error response
 */
export function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

/**
 * Helper để tạo success response
 */
export function createSuccessResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

/**
 * Helper để validate request body
 */
export function validateRequestBody(body: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!body[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Helper để parse pagination parameters
 */
export function parsePaginationParams(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  
  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)), // Maximum limit of 100 items
    skip: (page - 1) * limit
  };
}

/**
 * Helper để tạo pagination response
 */
export function createPaginationResponse(
  data: any[],
  page: number,
  limit: number,
  totalCount: number
) {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit
    }
  };
} 