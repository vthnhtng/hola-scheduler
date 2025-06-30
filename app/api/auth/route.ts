import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, logUserActivity } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body from request
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Username and password are required' 
        },
        { status: 400 }
      );
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

    // Check user and password (compare directly, no hashing)
    if (!user || user.password !== password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid username or password' 
        },
        { status: 401 }
      );
    }

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

    return response;

  } catch (error) {
    console.error('Auth login error:', error);
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