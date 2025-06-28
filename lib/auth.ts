import prisma from './prisma';

export interface AuthUser {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  role: 'scheduler' | 'viewer' | null;
}

/**
 * Verify Basic Authentication header
 */
export async function verifyBasicAuth(authHeader: string): Promise<AuthUser | null> {
  try {
    // Validate auth header format
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return null;
    }

    // Lấy credentials từ Basic Auth header
    const base64Credentials = authHeader.replace('Basic ', '');
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      return null;
    }

    console.log('Credentials from UI');
    console.log('Username: ', username);
    console.log('Password: ', password);

    // Tìm user trong database theo schema Prisma
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

    console.log('User from prisma');
    console.log(user);

    // So sánh plain password trực tiếp
    if (!user || user.password !== password) {
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

/**
 * Tạo user mới trong database
 * DISABLED: User registration is not allowed. Users can only be created by administrators.
 */
/*
export async function createUser(userData: {
  username: string;
  password: string;
  fullName?: string;
  email?: string;
  role?: 'scheduler' | 'viewer';
}): Promise<AuthUser | null> {
  try {
    const user = await prisma.appUser.create({
      data: {
        username: userData.username,
        password: userData.password, // Lưu plain password
        fullName: userData.fullName || null,
        email: userData.email || null,
        role: userData.role || null,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}
*/

/**
 * Cập nhật password của user
 */
export async function updateUserPassword(username: string, newPassword: string): Promise<boolean> {
  try {
    await prisma.appUser.update({
      where: { username },
      data: { password: newPassword }, // Lưu plain password
    });

    return true;
  } catch (error) {
    console.error('Error updating user password:', error);
    return false;
  }
} 