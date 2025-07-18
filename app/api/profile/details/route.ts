import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authInfo = AuthService.verifyAccessToken(token);
    
    const profile = await prisma.profile.findUnique({
      where: { userId: authInfo.userId },
    });

    if (!profile) {
      return NextResponse.json({
        profile: {
          id: '',
          userId: authInfo.userId,
          firstName: null,
          lastName: null,
          dateOfBirth: null,
          gender: null,
          height: null,
          weight: null,
          targetWeight: null,
          activityLevel: 'SEDENTARY',
          dietaryPreferences: JSON.stringify([]),
          calorieTarget: null,
          proteinTarget: null,
          carbTarget: null,
          fatTarget: null,
          fiberTarget: null,
          privacySettings: JSON.stringify({ leaderboardVisible: true }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error getting profile details:', error);
    return NextResponse.json(
      { error: 'Failed to get profile details' },
      { status: 500 }
    );
  }
} 