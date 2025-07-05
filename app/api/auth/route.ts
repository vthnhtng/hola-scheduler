import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, logUserActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('[AUTH API] Login request received');
    
    // Parse JSON body from request
    const body = await request.json();
    const { username, password } = body;
    
    console.log('[AUTH API] Request body:', { username, password: password ? '***' : 'undefined' });

    // Validate input
    if (!username || !password) {
      console.log('[AUTH API] Missing username or password');
      return NextResponse.json(
        { 
          success: false,
          error: 'Username and password are required' 
        },
        { status: 400 }
      );
    }

    console.log('[AUTH API] Searching for user in database...');
    
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
    
    console.log('[AUTH API] Database query result:', user ? { id: user.id, username: user.username, role: user.role } : 'User not found');

    // Check user and password (compare directly, no hashing)
    if (!user) {
      console.log('[AUTH API] User not found in database');
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid username or password' 
        },
        { status: 200 }
      );
    }
    
    if (user.password !== password) {
      console.log('[AUTH API] Password mismatch. Expected:', user.password, 'Received:', password);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid username or password' 
        },
        { status: 200 }
      );
    }

    console.log('[AUTH API] User authenticated successfully:', { id: user.id, username: user.username, role: user.role });
    
    // Log successful login
    await logUserActivity(user.id, 'login', 'auth', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      method: 'json_auth'
    });

    // Create session token
    const sessionToken = createSessionToken({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
    
    console.log('[AUTH API] Session token created');

    console.log('[AUTH API] Creating response...');
    
    // Create response with user information
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

    // Set session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    console.log('[AUTH API] Response created with session cookie');
    console.log('[AUTH API] Login successful for user:', user.username);

    return response;

  } catch (error) {
    console.error('[AUTH API] Auth login error:', error);
    console.error('[AUTH API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No active session' 
        },
        { status: 401 }
      );
    }

    // Validate session token
    const { validateSessionToken } = await import('@/lib/auth');
    const user = validateSessionToken(sessionToken);
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid or expired session' 
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session valid',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Auth session check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 