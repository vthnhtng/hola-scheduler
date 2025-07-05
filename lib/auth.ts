import prisma from './prisma';

export interface AuthUser {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  role: 'scheduler' | 'viewer' | null;
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'generate' | 'export';
}

/**
 * Verify Basic Authentication header
 */
export async function verifyBasicAuth(authHeader: string): Promise<AuthUser | null> {
  try {
    // Get credentials from Basic Auth header
    const base64Credentials = authHeader.replace('Basic ', '');
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      return null;
    }

    // Find user in database
    const user = await prisma.appUser.findUnique({
      where: {
        username: username,
      },
      select: {
        id: true,
        username: true,
        password: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    // Compare password directly (no hashing)
    if (!user || user.password !== password) {
      return null;
    }

    // Return user information (excluding password)
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error('Error verifying Basic Auth:', error);
    return null;
  }
}

/**
 * Create Basic Auth header from username and password
 */
export function createBasicAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return `Basic ${base64Credentials}`;
}

/**
 * Check basic access permissions
 */
export function hasPermission(userRole: string | null, requiredRole: 'scheduler' | 'viewer'): boolean {
  if (!userRole) return false;
  
  if (requiredRole === 'scheduler') {
    return userRole === 'scheduler';
  }
  
  return userRole === 'scheduler' || userRole === 'viewer';
}

/**
 * Check detailed access permissions for each resource and action
 */
export function checkPermission(userRole: string | null, permission: Permission): boolean {
  if (!userRole) return false;

  // Define permissions for each role
  const rolePermissions: Record<string, Permission[]> = {
    scheduler: [
      { resource: 'subjects', action: 'create' },
      { resource: 'subjects', action: 'read' },
      { resource: 'subjects', action: 'update' },
      { resource: 'subjects', action: 'delete' },
      { resource: 'lecturers', action: 'create' },
      { resource: 'lecturers', action: 'read' },
      { resource: 'lecturers', action: 'update' },
      { resource: 'lecturers', action: 'delete' },
      { resource: 'locations', action: 'create' },
      { resource: 'locations', action: 'read' },
      { resource: 'locations', action: 'update' },
      { resource: 'locations', action: 'delete' },
      { resource: 'curriculums', action: 'create' },
      { resource: 'curriculums', action: 'read' },
      { resource: 'curriculums', action: 'update' },
      { resource: 'curriculums', action: 'delete' },
      { resource: 'teams', action: 'create' },
      { resource: 'teams', action: 'read' },
      { resource: 'teams', action: 'update' },
      { resource: 'teams', action: 'delete' },
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      { resource: 'holidays', action: 'create' },
      { resource: 'holidays', action: 'read' },
      { resource: 'holidays', action: 'update' },
      { resource: 'holidays', action: 'delete' },
      { resource: 'schedules', action: 'generate' },
      { resource: 'schedules', action: 'read' },
      { resource: 'schedules', action: 'export' },
    ],
    viewer: [
      { resource: 'subjects', action: 'read' },
      { resource: 'lecturers', action: 'read' },
      { resource: 'locations', action: 'read' },
      { resource: 'curriculums', action: 'read' },
      { resource: 'teams', action: 'read' },
      { resource: 'holidays', action: 'read' },
      { resource: 'schedules', action: 'read' },
    ]
  };

  const userPermissions = rolePermissions[userRole] || [];
  return userPermissions.some(p => 
    p.resource === permission.resource && p.action === permission.action
  );
}

/**
 * Get user information from request headers (set by middleware)
 */
export function getUserFromHeaders(headers: Headers): AuthUser | null {
  const userId = headers.get('x-user-id');
  const userRole = headers.get('x-user-role') as 'scheduler' | 'viewer' | null;
  const username = headers.get('x-user-username');

  if (!userId || !username) {
    return null;
  }

  return {
    id: parseInt(userId),
    username,
    fullName: null, // Can be retrieved from database if needed
    email: null,    // Can be retrieved from database if needed
    role: userRole,
  };
}

/**
 * Middleware helper to check authentication and authorization
 */
export async function authenticateAndAuthorize(
  request: Request,
  requiredPermission?: Permission
): Promise<{ user: AuthUser | null; error?: string; status?: number }> {
  try {
    // Get user from headers (already authenticated by middleware)
    const user = getUserFromHeaders(request.headers);
    
    if (!user) {
      return {
        user: null,
        error: 'Unauthorized - User not authenticated',
        status: 401
      };
    }

    // Check permission if required
    if (requiredPermission && !checkPermission(user.role, requiredPermission)) {
      return {
        user: null,
        error: 'Forbidden - Insufficient permissions',
        status: 403
      };
    }

    return { user };
  } catch (error) {
    console.error('Authentication and authorization error:', error);
    return {
      user: null,
      error: 'Internal server error',
      status: 500
    };
  }
}

/**
 * Create session token for user
 */
export function createSessionToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Validate session token
 */
export function validateSessionToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return {
      id: payload.id,
      username: payload.username,
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    console.error('Error validating session token:', error);
    return null;
  }
}

/**
 * Log user activity
 */
export async function logUserActivity(
  userId: number,
  action: string,
  resource: string,
  details?: any
): Promise<void> {
  try {
    // Log to console (can be extended to save to database or external logging service)
    console.log(`[AUDIT] User ${userId} performed ${action} on ${resource}`, {
      timestamp: new Date().toISOString(),
      details
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
} 