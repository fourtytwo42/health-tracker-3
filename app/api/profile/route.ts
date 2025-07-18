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
    
    const user = await prisma.user.findUnique({
      where: { id: authInfo.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    
    const body = await request.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      height,
      weight,
      targetWeight,
      activityLevel,
      dietaryPreferences,
      calorieTarget,
      proteinTarget,
      carbTarget,
      fatTarget,
      fiberTarget,
      privacySettings,
      avatarUrl,
    } = body;

    // Update user avatar if provided
    if (avatarUrl) {
      await prisma.user.update({
        where: { id: authInfo.userId },
        data: { avatarUrl },
      });
    }

    // Update or create profile
    const profile = await prisma.profile.upsert({
      where: { userId: authInfo.userId },
      update: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        targetWeight: targetWeight ? parseFloat(targetWeight) : null,
        activityLevel,
        dietaryPreferences,
        calorieTarget: calorieTarget ? parseInt(calorieTarget) : null,
        proteinTarget: proteinTarget ? parseInt(proteinTarget) : null,
        carbTarget: carbTarget ? parseInt(carbTarget) : null,
        fatTarget: fatTarget ? parseInt(fatTarget) : null,
        fiberTarget: fiberTarget ? parseInt(fiberTarget) : null,
        privacySettings,
        updatedAt: new Date(),
      },
      create: {
        userId: authInfo.userId,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        targetWeight: targetWeight ? parseFloat(targetWeight) : null,
        activityLevel,
        dietaryPreferences,
        calorieTarget: calorieTarget ? parseInt(calorieTarget) : null,
        proteinTarget: proteinTarget ? parseInt(proteinTarget) : null,
        carbTarget: carbTarget ? parseInt(carbTarget) : null,
        fatTarget: fatTarget ? parseInt(fatTarget) : null,
        fiberTarget: fiberTarget ? parseInt(fiberTarget) : null,
        privacySettings,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 