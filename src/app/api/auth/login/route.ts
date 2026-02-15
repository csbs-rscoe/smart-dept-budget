import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { loginSchema, validateRequest } from '@/lib/validations';
import { createAuditLog } from '@/lib/audit';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateRequest(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = validation.data;

    // Attempt login
    const result = await loginUser(email, password);

    if (!result.success) {
      await createAuditLog({
        userId: null,
        action: 'LOGIN_FAILED',
        entityType: 'auth',
        newValues: { email, reason: result.error },
      });

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    // Set auth cookie
    const cookieStore = await cookies();
    // Calculate expiration based on rememberMe
    // Default: 6 hours (6 * 60 * 60)
    // Remember Me: 7 days (7 * 24 * 60 * 60)
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 6 * 60 * 60;

    cookieStore.set('auth_token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge,
      path: '/',
    });

    await createAuditLog({
      userId: result.user!.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'auth',
      newValues: { email },
    });

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}