import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const isFavorite = searchParams.get('isFavorite') === 'true' ? true : 
                      searchParams.get('isFavorite') === 'false' ? false : undefined;

    const skip = (page - 1) * limit;

    const where: any = { userId: user.userId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { originalQuery: { contains: search } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isFavorite !== undefined) {
      where.isFavorite = isFavorite;
    }

    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workout.count({ where })
    ]);

    const workoutsWithStats = workouts.map(workout => calculateWorkoutStats(workout));

    return NextResponse.json({
      workouts: workoutsWithStats,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching workouts:', error);
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
    const workout = await createWorkout({
      ...body,
      userId: user.userId
    });

    return NextResponse.json({ workout });
  } catch (error) {
    console.error('Error creating workout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createWorkout(workoutData: any): Promise<any> {
  const { exercises, ...workoutInfo } = workoutData;

  const workout = await prisma.workout.create({
    data: {
      ...workoutInfo,
      targetMuscleGroups: workoutInfo.targetMuscleGroups ? JSON.stringify(workoutInfo.targetMuscleGroups) : null,
      equipment: workoutInfo.equipment ? JSON.stringify(workoutInfo.equipment) : null,
      instructions: workoutInfo.instructions ? JSON.stringify(workoutInfo.instructions) : null,
      exercises: {
        create: exercises.map((exercise: any, index: number) => ({
          exerciseId: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          duration: exercise.duration,
          restPeriod: exercise.restPeriod || 60,
          order: index + 1,
          notes: exercise.notes,
        })),
      },
    },
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

  return calculateWorkoutStats(workout);
}

function calculateWorkoutStats(workout: any): any {
  // Parse JSON fields
  const targetMuscleGroups = workout.targetMuscleGroups ? JSON.parse(workout.targetMuscleGroups) : [];
  const equipment = workout.equipment ? JSON.parse(workout.equipment) : [];
  const instructions = workout.instructions ? JSON.parse(workout.instructions) : [];

  console.log(`=== DEBUG: calculateWorkoutStats for workout ${workout.id} ===`);
  console.log('AI Generated:', workout.aiGenerated);
  console.log('Virtual Exercises field:', workout.virtualExercises ? 'Present' : 'Missing');
  console.log('Exercises from include:', workout.exercises ? workout.exercises.length : 'No exercises array');

  // For AI-generated workouts, we need to handle virtual exercises
  // Check if this is an AI-generated workout with virtual exercises stored
  if (workout.aiGenerated && workout.virtualExercises) {
    try {
      const virtualExercisesData = JSON.parse(workout.virtualExercises);
      
      // Convert virtual exercises to the format expected by the UI
      const virtualExercises = virtualExercisesData.map((ve: any, index: number) => ({
        id: ve.exerciseId || `virtual-${index + 1}`,
        exercise: {
          id: ve.exerciseId || `virtual-${index + 1}`,
          activity: ve.name || 'Virtual Exercise',
          code: ve.exerciseId || 'VIRTUAL',
          met: 3.5, // Default MET value
          description: ve.description || 'AI-generated exercise',
          category: 'VIRTUAL',
          intensity: 'MODERATE',
          isActive: true
        },
        sets: ve.sets,
        reps: ve.reps,
        duration: ve.duration,
        restPeriod: ve.restPeriod || 60,
        order: ve.order || index + 1,
        notes: ve.notes
      }));

      console.log('Virtual exercises processed:', virtualExercises.length);
      console.log('First virtual exercise:', virtualExercises[0]?.exercise?.activity);

      return {
        ...workout,
        targetMuscleGroups,
        equipment,
        instructions,
        totalCalories: Math.round(workout.totalCalories || 0),
        exercises: virtualExercises, // Override the empty exercises array from the include
        isVirtual: true
      };
    } catch (error) {
      console.error('Error parsing virtual exercises:', error);
    }
  }

  // Calculate total calories if not provided
  let totalCalories = workout.totalCalories;
  if (!totalCalories && workout.exercises.length > 0) {
    totalCalories = workout.exercises.reduce((total: number, we: any) => {
      const exerciseDuration = we.duration || (we.reps ? we.reps * 3 : 60); // Estimate duration
      const setsDuration = exerciseDuration * we.sets;
      const totalDuration = setsDuration + (we.restPeriod * (we.sets - 1));
      const caloriesPerMinute = (we.exercise.met * 3.5 * 70) / 200; // Rough calculation
      return total + (caloriesPerMinute * totalDuration / 60);
    }, 0);
  }

  return {
    ...workout,
    targetMuscleGroups,
    equipment,
    instructions,
    totalCalories: Math.round(totalCalories || 0),
  };
} 