import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a simple test workout
    const testWorkout = {
      userId: user.userId,
      name: 'Test Upper Body Workout',
      description: 'A simple test workout for the upper body',
      category: 'STRENGTH',
      difficulty: 'INTERMEDIATE',
      duration: 30,
      totalCalories: 200,
      targetMuscleGroups: JSON.stringify(['Chest', 'Back', 'Shoulders']),
      equipment: JSON.stringify(['Dumbbells']),
      instructions: JSON.stringify([
        'Start with a 5-minute warm-up',
        'Perform 3 sets of each exercise',
        'Rest 60 seconds between sets',
        'End with a 5-minute cool-down'
      ]),
      isFavorite: false,
      isPublic: false,
      aiGenerated: false,
      originalQuery: 'test workout'
    };

    const workout = await prisma.workout.create({
      data: testWorkout,
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      workout,
      message: 'Test workout created successfully!' 
    });
  } catch (error) {
    console.error('Error creating test workout:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 