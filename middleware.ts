import { NextRequest, NextResponse } from 'next/server';
import { verifyBasicAuth } from './lib/auth';

// Các route cần bảo vệ
const protectedRoutes = [
  '/timetable',
  '/subjects',
  '/lecturers',
  '/locations',
  '/curriculums',
  '/teams',
  '/users',
  '/holidays',
  '/calendar'
];

// Các route chỉ dành cho scheduler
const schedulerOnlyRoutes = [
  '/scheduler',
  '/api/generate-schedules',
  '/api/export-schedule'
];

// Các route công khai
const publicRoutes = [
  '/',
  '/login',
  '/api/auth/login',
  '/api/auth/logout'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Bỏ qua các file tĩnh và API routes không cần auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Kiểm tra nếu là route công khai
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Lấy thông tin xác thực từ header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    // Redirect đến trang login nếu không có thông tin xác thực
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } }
      );
    } else {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  try {
    // Xác thực Basic Auth
    const user = await verifyBasicAuth(authHeader);
    
    if (!user) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } }
        );
      } else {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        loginUrl.searchParams.set('error', 'invalid_credentials');
        return NextResponse.redirect(loginUrl);
      }
    }

    // Kiểm tra quyền truy cập cho các route chỉ dành cho scheduler
    if (schedulerOnlyRoutes.some(route => pathname.startsWith(route))) {
      if (user.role !== 'scheduler') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Forbidden - Insufficient permissions' },
            { status: 403 }
          );
        } else {
          return NextResponse.redirect(new URL('/?error=insufficient_permissions', request.url));
        }
      }
    }

    // Thêm thông tin user vào header để sử dụng trong API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id.toString());
    requestHeaders.set('x-user-role', user.role || 'viewer');
    requestHeaders.set('x-user-username', user.username);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('Authentication error:', error);
    
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    } else {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'server_error');
      return NextResponse.redirect(loginUrl);
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 