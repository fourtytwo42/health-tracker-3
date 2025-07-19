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

    const userDetails = await prisma.userDetails.findUnique({
      where: { userId: user.id }
    });

    return NextResponse.json({ userDetails });
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
    
    // Validate required fields
    if (!body.activityLevel) {
      return NextResponse.json(
        { error: 'Activity level is required' },
        { status: 400 }
      );
    }

    // Upsert user details
    const userDetails = await prisma.userDetails.upsert({
      where: { userId: user.id },
      update: {
        height: body.height,
        weight: body.weight,
        targetWeight: body.targetWeight,
        bodyFatPercentage: body.bodyFatPercentage,
        muscleMass: body.muscleMass,
        bmi: body.bmi,
        bloodType: body.bloodType,
        allergies: body.allergies,
        medications: body.medications,
        medicalConditions: body.medicalConditions,
        disabilities: body.disabilities,
        exerciseLimitations: body.exerciseLimitations,
        mobilityIssues: body.mobilityIssues,
        injuryHistory: body.injuryHistory,
        activityLevel: body.activityLevel,
        sleepQuality: body.sleepQuality,
        stressLevel: body.stressLevel,
        smokingStatus: body.smokingStatus,
        alcoholConsumption: body.alcoholConsumption,
        fitnessGoals: body.fitnessGoals,
        dietaryGoals: body.dietaryGoals,
        weightGoals: body.weightGoals,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        height: body.height,
        weight: body.weight,
        targetWeight: body.targetWeight,
        bodyFatPercentage: body.bodyFatPercentage,
        muscleMass: body.muscleMass,
        bmi: body.bmi,
        bloodType: body.bloodType,
        allergies: body.allergies,
        medications: body.medications,
        medicalConditions: body.medicalConditions,
        disabilities: body.disabilities,
        exerciseLimitations: body.exerciseLimitations,
        mobilityIssues: body.mobilityIssues,
        injuryHistory: body.injuryHistory,
        activityLevel: body.activityLevel,
        sleepQuality: body.sleepQuality,
        stressLevel: body.stressLevel,
        smokingStatus: body.smokingStatus,
        alcoholConsumption: body.alcoholConsumption,
        fitnessGoals: body.fitnessGoals,
        dietaryGoals: body.dietaryGoals,
        weightGoals: body.weightGoals
      }
    });

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