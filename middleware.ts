import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, logUserActivity } from './lib/auth';

// Routes that need to be protected
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

// Routes only for scheduler role
const schedulerOnlyRoutes = [
  '/scheduler',
  '/api/generate-schedules',
  '/api/export-schedule'
];

// Public routes (no authentication required)
const publicRoutes = [
  '/',
  '/login'
];

// Auth routes (only need session token, no Basic Auth required)
const authRoutes = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth'
];

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  return response;
}

/**
 * Log authentication process
 */
function logAuthProcess(
  pathname: string, 
  method: string, 
  authMethod: string, 
  success: boolean, 
  userInfo?: string,
  error?: string
) {
  const timestamp = new Date().toISOString();
  const logMessage = `[AUTH-LOG] ${timestamp} | ${method} ${pathname} | Method: ${authMethod} | Success: ${success}${userInfo ? ` | User: ${userInfo}` : ''}${error ? ` | Error: ${error}` : ''}`;
  
  if (success) {
    console.log(logMessage);
  } else {
    console.warn(logMessage);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  console.log(`[MIDDLEWARE] ${method} ${pathname} | IP: ${clientIP} | UA: ${userAgent.substring(0, 50)}...`);
  
  // Skip static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    console.log(`[MIDDLEWARE] Skipping static file: ${pathname}`);
    return addSecurityHeaders(NextResponse.next());
  }

  // Check if it's a public route
  if (publicRoutes.includes(pathname)) {
    console.log(`[MIDDLEWARE] Public route accessed: ${pathname}`);
    return addSecurityHeaders(NextResponse.next());
  }

  // Handle authentication
  let user = null;
  let authMethod = 'session_token';
  let authError: string | undefined = undefined;

  // Check if it's an API route
  if (pathname.startsWith('/api/')) {
    console.log(`[MIDDLEWARE] API route detected: ${pathname}`);
    
    // If it's an auth route, handle differently
    if (authRoutes.includes(pathname)) {
      console.log(`[MIDDLEWARE] Auth route detected: ${pathname}`);
      
      // For login API, allow access without authentication
      if (pathname === '/api/auth/login' && method === 'POST') {
        console.log(`[MIDDLEWARE] Login API - allowing access without authentication`);
        return addSecurityHeaders(NextResponse.next());
      }
      
      // For other auth routes (logout, session check), check session token
      const sessionToken = request.cookies.get('session_token')?.value;
      if (sessionToken) {
        console.log(`[MIDDLEWARE] Session token found, validating...`);
        user = validateSessionToken(sessionToken);
        if (user) {
          console.log(`[MIDDLEWARE] Session token valid for user: ${user.username}`);
        } else {
          console.log(`[MIDDLEWARE] Session token invalid or expired`);
          authError = 'Invalid session token';
        }
      } else {
        console.log(`[MIDDLEWARE] No session token found for auth route`);
        authError = 'No session token';
      }
    } else {
      // All other API routes require session token
      console.log(`[MIDDLEWARE] Protected API route, checking session token...`);
      
      const sessionToken = request.cookies.get('session_token')?.value;
      if (sessionToken) {
        console.log(`[MIDDLEWARE] Session token found for API, validating...`);
        user = validateSessionToken(sessionToken);
        if (user) {
          console.log(`[MIDDLEWARE] Session token valid for API: ${user.username}`);
        } else {
          console.log(`[MIDDLEWARE] Session token invalid for API`);
          authError = 'Invalid session token';
        }
      } else {
        console.log(`[MIDDLEWARE] No session token found for API`);
        authError = 'No session token';
      }
    }
  } else {
    // For non-API routes, use session token
    console.log(`[MIDDLEWARE] Frontend route detected: ${pathname}`);
    
    const sessionToken = request.cookies.get('session_token')?.value;
    if (sessionToken) {
      console.log(`[MIDDLEWARE] Session token found for frontend, validating...`);
      
      user = validateSessionToken(sessionToken);
      if (user) {
        console.log(`[MIDDLEWARE] Session token valid for frontend: ${user.username}`);
      } else {
        console.log(`[MIDDLEWARE] Session token invalid for frontend`);
        authError = 'Invalid session token';
      }
    } else {
      console.log(`[MIDDLEWARE] No session token found for frontend`);
      authError = 'No session token';
    }
  }
  
  if (!user) {
    console.log(`[MIDDLEWARE] Authentication failed - redirecting/returning error`);
    logAuthProcess(pathname, method, authMethod, false, undefined, authError);
    
    // API: return JSON error without 401 status to avoid browser popup
    if (pathname.startsWith('/api/')) {
      console.log(`[MIDDLEWARE] Returning error for API route`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login first' },
        { status: 200 }
      );
    } else {
      // Frontend: redirect to login
      console.log(`[MIDDLEWARE] Redirecting to login for frontend route`);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  try {
    // Check access permissions for scheduler-only routes
    if (schedulerOnlyRoutes.some(route => pathname.startsWith(route))) {
      console.log(`[MIDDLEWARE] Checking scheduler permissions for: ${pathname}`);
      
      if (user.role !== 'scheduler') {
        console.log(`[MIDDLEWARE] Insufficient permissions - user role: ${user.role}, required: scheduler`);
        
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 200 }
          );
        } else {
          return NextResponse.redirect(new URL('/?error=insufficient_permissions', request.url));
        }
      } else {
        console.log(`[MIDDLEWARE] Scheduler permissions granted`);
      }
    }

    // Log user activity
    console.log(`[MIDDLEWARE] Logging user activity for: ${user.username}`);
    await logUserActivity(user.id, 'access', pathname, {
      method: request.method,
      userAgent: request.headers.get('user-agent')
    });

    // Add user information to headers for use in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id.toString());
    requestHeaders.set('x-user-role', user.role || 'viewer');
    requestHeaders.set('x-user-username', user.username);

    console.log(`[MIDDLEWARE] Authentication successful - proceeding with request`);
    logAuthProcess(pathname, method, authMethod, true, `${user.username} (${user.role})`);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Add security headers
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('[MIDDLEWARE] Authentication error:', error);
    
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 200 }
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