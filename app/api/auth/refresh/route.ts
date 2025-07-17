import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/auth';

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = refreshSchema.parse(body);

    const payload = AuthService.verifyRefreshToken(refreshToken);
    const user = await AuthService.getUserById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'User not found' } },
        { status: 401 }
      );
    }

    const newAccessToken = AuthService.generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const newRefreshToken = AuthService.generateRefreshToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.errors } },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' } },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: { code: 'TOKEN_EXPIRED', message: 'Refresh token expired' } },
        { status: 401 }
      );
    }

    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 