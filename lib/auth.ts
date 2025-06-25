import { createHash } from 'crypto';
import prisma from './prisma';

export interface AuthUser {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  role: 'scheduler' | 'viewer' | null;
}

/**
 * Hash password sử dụng SHA-256
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Verify Basic Authentication header
 */
export async function verifyBasicAuth(authHeader: string): Promise<AuthUser | null> {
  try {
    // Lấy credentials từ Basic Auth header
    const base64Credentials = authHeader.replace('Basic ', '');
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      return null;
    }

    // Hash password để so sánh
    const hashedPassword = hashPassword(password);

    // Tìm user trong database
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

    if (!user || user.password !== hashedPassword) {
      return null;
    }

    // Trả về thông tin user (không bao gồm password)
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
 * Tạo Basic Auth header từ username và password
 */
export function createBasicAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return `Basic ${base64Credentials}`;
}

/**
 * Kiểm tra quyền truy cập
 */
export function hasPermission(userRole: string | null, requiredRole: 'scheduler' | 'viewer'): boolean {
  if (!userRole) return false;
  
  if (requiredRole === 'scheduler') {
    return userRole === 'scheduler';
  }
  
  return userRole === 'scheduler' || userRole === 'viewer';
}

/**
 * Lấy thông tin user từ request headers (được set bởi middleware)
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
    fullName: null, // Có thể lấy từ database nếu cần
    email: null,    // Có thể lấy từ database nếu cần
    role: userRole,
  };
} 