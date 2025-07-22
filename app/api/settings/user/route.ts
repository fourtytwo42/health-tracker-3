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

    // Get user settings from database
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: authInfo.userId },
    });

    // Return settings with defaults
    const settings = {
      notifications: {
        email: true,
        push: true,
        mealReminders: true,
        goalReminders: true,
      },
      privacy: {
        profileVisible: true,
        leaderboardVisible: true,
        dataSharing: false,
      },
      appearance: {
        theme: 'auto' as const,
        language: 'en',
      },
      recipe: {
        detailedIngredientInfo: userSettings?.showExtraIngredientData ?? true,
      },
      units: {
        useMetricUnits: userSettings?.useMetricUnits ?? false,
      },
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error getting user settings:', error);
    return NextResponse.json(
      { error: 'Failed to get user settings' },
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
    const settings = body;

    // Save user settings to database
    await prisma.userSettings.upsert({
      where: { userId: authInfo.userId },
      update: {
        showExtraIngredientData: settings.recipe?.detailedIngredientInfo ?? true,
        useMetricUnits: settings.units?.useMetricUnits ?? false,
        updatedAt: new Date(),
      },
      create: {
        userId: authInfo.userId,
        showExtraIngredientData: settings.recipe?.detailedIngredientInfo ?? true,
        useMetricUnits: settings.units?.useMetricUnits ?? false,
      },
    });

    console.log('User settings updated:', settings);

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
} 