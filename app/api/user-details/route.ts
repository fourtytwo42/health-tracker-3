import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/middleware/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId }
    });

    // Parse JSON strings if they exist
    if (profile) {
      try {
        if (profile.dietaryPreferences) {
          profile.dietaryPreferences = JSON.parse(profile.dietaryPreferences);
        }
        if (profile.privacySettings) {
          profile.privacySettings = JSON.parse(profile.privacySettings);
        }
      } catch (parseError) {
        console.error('Error parsing profile JSON fields:', parseError);
      }
    }

    return NextResponse.json({ userDetails: profile });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Upsert user profile
    const userDetails = await prisma.profile.upsert({
      where: { userId: user.userId },
      update: {
        // Basic Information
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender,
        
        // Physical Measurements
        height: body.height,
        weight: body.weight,
        targetWeight: body.targetWeight,
        
        // Medical Information
        allergies: body.allergies,
        medications: body.medications,
        medicalConditions: body.medicalConditions,
        disabilities: body.disabilities,
        
        // Exercise & Mobility
        exerciseLimitations: body.exerciseLimitations,
        mobilityIssues: body.mobilityIssues,
        injuryHistory: body.injuryHistory,
        
        // Activity Level
        activityLevel: body.activityLevel,
        
        // Nutrition Targets
        dietaryPreferences: body.dietaryPreferences ? JSON.stringify(body.dietaryPreferences) : null,
        calorieTarget: body.calorieTarget,
        proteinTarget: body.proteinTarget,
        carbTarget: body.carbTarget,
        fatTarget: body.fatTarget,
        fiberTarget: body.fiberTarget,
        
        updatedAt: new Date()
      },
      create: {
        userId: user.userId,
        // Basic Information
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender,
        
        // Physical Measurements
        height: body.height,
        weight: body.weight,
        targetWeight: body.targetWeight,
        
        // Medical Information
        allergies: body.allergies,
        medications: body.medications,
        medicalConditions: body.medicalConditions,
        disabilities: body.disabilities,
        
        // Exercise & Mobility
        exerciseLimitations: body.exerciseLimitations,
        mobilityIssues: body.mobilityIssues,
        injuryHistory: body.injuryHistory,
        
        // Activity Level
        activityLevel: body.activityLevel,
        
        // Nutrition Targets
        dietaryPreferences: body.dietaryPreferences ? JSON.stringify(body.dietaryPreferences) : null,
        calorieTarget: body.calorieTarget,
        proteinTarget: body.proteinTarget,
        carbTarget: body.carbTarget,
        fatTarget: body.fatTarget,
        fiberTarget: body.fiberTarget
      }
    });

    // Parse JSON strings if they exist
    try {
      if (userDetails.dietaryPreferences) {
        userDetails.dietaryPreferences = JSON.parse(userDetails.dietaryPreferences);
      }
      if (userDetails.privacySettings) {
        userDetails.privacySettings = JSON.parse(userDetails.privacySettings);
      }
    } catch (parseError) {
      console.error('Error parsing userDetails JSON fields:', parseError);
    }

    return NextResponse.json({ 
      message: 'User details saved successfully',
      userDetails 
    });
  } catch (error) {
    console.error('Error saving user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 