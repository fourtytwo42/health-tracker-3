import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { LLMRouter } from '@/lib/llmRouter';
import { SystemMessageService } from '@/lib/services/SystemMessageService';
import { z } from 'zod';

const generateWorkoutSchema = z.object({
  keywords: z.string().min(1),
  workoutType: z.string(),
  duration: z.number().min(10).max(180),
  difficulty: z.string(),
  targetMuscleGroups: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  generateImage: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = generateWorkoutSchema.parse(body);

    // Get user profile data and preferences
    const [userProfile, exercisePreferences, biomarkers] = await Promise.all([
      getUserProfile(user.userId),
      getExercisePreferences(user.userId),
      getBiomarkers(user.userId)
    ]);

    // Get system message for workout generation
    const systemMessageService = new SystemMessageService();
    const systemMessage = await systemMessageService.getMessageByKey('workout_generation');
    
    // Get available exercises based on criteria and user preferences
    const exercises = await getAvailableExercises(
      validatedData.workoutType, 
      validatedData.targetMuscleGroups || [], 
      validatedData.equipment || [],
      exercisePreferences
    );
    
    // Generate workout using LLM with user context
    const prompt = buildWorkoutGenerationPrompt(
      validatedData.keywords,
      validatedData.workoutType,
      validatedData.duration,
      validatedData.difficulty,
      validatedData.targetMuscleGroups || [],
      validatedData.equipment || [],
      exercises,
      userProfile,
      exercisePreferences,
      biomarkers
    );

    const llmRouter = LLMRouter.getInstance();
    const response = await llmRouter.generateResponse({
      prompt: `System: ${systemMessage?.content || getDefaultWorkoutSystemPrompt()}\n\nUser: ${prompt}`,
      temperature: 0.7,
      maxTokens: 3000,
      userId: user.userId,
    });

    // Parse LLM response and create workout
    const workoutData = parseWorkoutResponse(response.content, user.userId, validatedData.keywords, validatedData.generateImage || false);
    
    const workout = await createWorkout(workoutData);

    return NextResponse.json(workout);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error generating workout:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getUserProfile(userId: string): Promise<any> {
  try {
    const userDetails = await prisma.userDetails.findUnique({
      where: { userId }
    });
    return userDetails;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

async function getExercisePreferences(userId: string): Promise<any[]> {
  try {
    // For now, return empty array since exercise preferences table might not exist
    // This can be enhanced when the exercise preferences system is fully implemented
    return [];
  } catch (error) {
    console.error('Error fetching exercise preferences:', error);
    return [];
  }
}

async function getBiomarkers(userId: string): Promise<any[]> {
  try {
    const biomarkers = await prisma.biomarker.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10 // Get recent biomarkers
    });
    return biomarkers;
  } catch (error) {
    console.error('Error fetching biomarkers:', error);
    return [];
  }
}

async function getAvailableExercises(
  workoutType: string,
  targetMuscleGroups: string[],
  equipment: string[],
  exercisePreferences: any[]
): Promise<any[]> {
  const where: any = { isActive: true };

  // Filter by workout type/category
  if (workoutType) {
    where.category = workoutType;
  }

  // Get exercises from database
  const exercises = await prisma.exercise.findMany({
    where,
    take: 100, // Limit for LLM context
  });

  // Filter based on user preferences
  const preferredExercises = exercisePreferences
    .filter(pref => pref.preference === 'like')
    .map(pref => pref.exercise.code);
  
  const dislikedExercises = exercisePreferences
    .filter(pref => pref.preference === 'dislike')
    .map(pref => pref.exercise.code);

  // Prioritize preferred exercises and exclude disliked ones
  const filteredExercises = exercises.filter(exercise => {
    if (dislikedExercises.includes(exercise.code)) {
      return false;
    }
    return true;
  });

  // Sort to prioritize preferred exercises
  filteredExercises.sort((a, b) => {
    const aPreferred = preferredExercises.includes(a.code);
    const bPreferred = preferredExercises.includes(b.code);
    if (aPreferred && !bPreferred) return -1;
    if (!aPreferred && bPreferred) return 1;
    return 0;
  });

  return filteredExercises;
}

function buildWorkoutGenerationPrompt(
  keywords: string,
  workoutType: string,
  duration: number,
  difficulty: string,
  targetMuscleGroups: string[],
  equipment: string[],
  exercises: any[],
  userProfile: any,
  exercisePreferences: any[],
  biomarkers: any[]
): string {
  // Build user context information
  const userContext = [];
  if (userProfile) {
    if (userProfile.age) userContext.push(`Age: ${userProfile.age}`);
    if (userProfile.weight) userContext.push(`Weight: ${userProfile.weight}kg`);
    if (userProfile.height) userContext.push(`Height: ${userProfile.height}cm`);
    if (userProfile.fitnessLevel) userContext.push(`Fitness Level: ${userProfile.fitnessLevel}`);
    if (userProfile.goals) userContext.push(`Goals: ${userProfile.goals}`);
  }

  const recentBiomarkers = biomarkers.slice(0, 3).map(b => `${b.type}: ${b.value}${b.unit || ''}`).join(', ');
  if (recentBiomarkers) {
    userContext.push(`Recent Biomarkers: ${recentBiomarkers}`);
  }

  const preferredExercises = exercisePreferences
    .filter(pref => pref.preference === 'like')
    .map(pref => pref.exercise?.activity || pref.exerciseId)
    .slice(0, 5);
  
  const dislikedExercises = exercisePreferences
    .filter(pref => pref.preference === 'dislike')
    .map(pref => pref.exercise?.activity || pref.exerciseId)
    .slice(0, 5);

  return `
Create a ${duration}-minute ${difficulty.toLowerCase()} ${workoutType.toLowerCase()} workout based on this request: "${keywords}"

USER CONTEXT:
${userContext.length > 0 ? userContext.join('\n') : 'No specific user profile data available'}

${preferredExercises.length > 0 ? `Preferred exercises: ${preferredExercises.join(', ')}` : ''}
${dislikedExercises.length > 0 ? `Avoid these exercises: ${dislikedExercises.join(', ')}` : ''}

Target muscle groups: ${targetMuscleGroups.join(', ') || 'Any'}
Available equipment: ${equipment.join(', ') || 'None'}

Available exercises (use these exercise codes):
${exercises.map(ex => `- ${ex.code}: ${ex.activity} (MET: ${ex.met})`).join('\n')}

Please create a workout that:
1. Is appropriate for the user's fitness level and goals
2. Uses preferred exercises when possible
3. Avoids disliked exercises
4. Considers any health markers or limitations
5. Provides detailed, step-by-step instructions with form cues
6. Includes proper warm-up and cool-down
7. Has appropriate rest periods and progression

Format the response as JSON:
{
  "name": "Workout Name",
  "description": "Brief description",
  "category": "${workoutType}",
  "difficulty": "${difficulty}",
  "duration": ${duration},
  "totalCalories": estimated_calories,
  "targetMuscleGroups": ["muscle1", "muscle2"],
  "equipment": ["equipment1", "equipment2"],
  "instructions": ["step1", "step2", "step3"],
  "exercises": [
    {
      "exerciseId": "exercise_code",
      "sets": 3,
      "reps": 12,
      "restPeriod": 60,
      "notes": "optional notes"
    }
  ]
}
`;
}

function getDefaultWorkoutSystemPrompt(): string {
  return `You are an expert fitness trainer and workout designer with deep knowledge of exercise science, biomechanics, and training principles. Your role is to create comprehensive, safe, and effective workouts that users can follow independently.

KEY RESPONSIBILITIES:
1. Design workouts that are appropriate for the specified difficulty level and duration
2. Provide detailed, step-by-step instructions for each exercise
3. Include proper warm-up and cool-down recommendations
4. Consider exercise progression and rest periods
5. Ensure exercises target the specified muscle groups
6. Adapt workouts to available equipment
7. Provide clear pacing and timing guidance
8. Include safety considerations and form cues

WORKOUT STRUCTURE GUIDELINES:
- Always start with a 5-10 minute warm-up
- Include proper rest periods between sets (30-90 seconds for strength, 15-30 seconds for HIIT)
- End with a 5-10 minute cool-down and stretching
- For strength training: 3-5 sets, 8-15 reps per set
- For cardio: 20-60 minutes continuous or interval training
- For HIIT: 30 seconds work, 30 seconds rest cycles
- For flexibility: Hold stretches for 15-30 seconds each

SAFETY FIRST:
- Always include form cues and safety reminders
- Suggest modifications for different fitness levels
- Warn about common mistakes to avoid
- Recommend stopping if pain occurs

RESPONSE FORMAT:
Return a valid JSON object with the following structure:
{
  "name": "Creative, descriptive workout name",
  "description": "Brief overview of the workout goals and benefits",
  "category": "STRENGTH|CARDIO|FLEXIBILITY|HIIT|SPORTS|REHAB",
  "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
  "duration": total_minutes,
  "totalCalories": estimated_calories_burned,
  "targetMuscleGroups": ["muscle1", "muscle2"],
  "equipment": ["equipment1", "equipment2"],
  "instructions": [
    "Step 1: Detailed warm-up instructions",
    "Step 2: Exercise 1 with form cues and safety notes",
    "Step 3: Rest period guidance",
    "Step 4: Exercise 2 with detailed instructions",
    "... continue for all exercises",
    "Final step: Cool-down and stretching instructions"
  ],
  "exercises": [
    {
      "exerciseId": "exercise_code_from_database",
      "sets": number_of_sets,
      "reps": reps_per_set,
      "restPeriod": rest_seconds,
      "notes": "Specific form cues, modifications, or safety notes"
    }
  ]
}`;
}

function parseWorkoutResponse(
  response: string,
  userId: string,
  originalQuery: string,
  generateImage: boolean
): any {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const workoutData = JSON.parse(jsonMatch[0]);

    return {
      userId,
      name: workoutData.name,
      description: workoutData.description,
      category: workoutData.category,
      difficulty: workoutData.difficulty,
      duration: workoutData.duration,
      totalCalories: workoutData.totalCalories,
      targetMuscleGroups: workoutData.targetMuscleGroups || [],
      equipment: workoutData.equipment || [],
      instructions: workoutData.instructions || [],
      photoUrl: generateImage ? undefined : undefined, // TODO: Implement image generation
      isFavorite: false,
      isPublic: false,
      aiGenerated: true,
      originalQuery,
      exercises: workoutData.exercises || [],
    };
  } catch (error) {
    console.error('Error parsing workout response:', error);
    throw new Error('Failed to parse workout generation response');
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