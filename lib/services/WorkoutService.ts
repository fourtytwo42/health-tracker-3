import { BaseService } from './BaseService';
import { LLMRouter } from '../llmRouter';
import { SystemMessageService } from './SystemMessageService';
import { prisma } from '../prisma';
import { z } from 'zod';

export interface WorkoutExerciseInput {
  exerciseId: string;
  sets: number;
  reps?: number;
  duration?: number; // seconds
  restPeriod?: number; // seconds
  notes?: string;
}

export interface CreateWorkoutInput {
  userId: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  duration: number; // minutes
  totalCalories?: number;
  targetMuscleGroups?: string[];
  equipment?: string[];
  instructions?: string[];
  photoUrl?: string;
  isFavorite?: boolean;
  isPublic?: boolean;
  aiGenerated?: boolean;
  originalQuery?: string;
  exercises: WorkoutExerciseInput[];
}

export interface WorkoutWithExercises {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  duration: number;
  totalCalories?: number;
  targetMuscleGroups?: string[];
  equipment?: string[];
  instructions?: string[];
  photoUrl?: string;
  isFavorite: boolean;
  isPublic: boolean;
  aiGenerated: boolean;
  originalQuery?: string;
  createdAt: Date;
  updatedAt: Date;
  exercises: Array<{
    id: string;
    exerciseId: string;
    sets: number;
    reps?: number;
    duration?: number;
    restPeriod: number;
    order: number;
    notes?: string;
    exercise: {
      id: string;
      activity: string;
      code: string;
      met: number;
      description?: string;
      category?: string;
      intensity?: string;
      imageUrl?: string;
    };
  }>;
}

export class WorkoutService extends BaseService {
  private llmRouter: LLMRouter;
  private systemMessageService: SystemMessageService;

  constructor() {
    super();
    this.llmRouter = LLMRouter.getInstance();
    this.systemMessageService = new SystemMessageService();
  }

  async createWorkout(input: CreateWorkoutInput): Promise<WorkoutWithExercises> {
    const { exercises, ...workoutData } = input;

    const workout = await prisma.workout.create({
      data: {
        ...workoutData,
        targetMuscleGroups: workoutData.targetMuscleGroups ? JSON.stringify(workoutData.targetMuscleGroups) : null,
        equipment: workoutData.equipment ? JSON.stringify(workoutData.equipment) : null,
        instructions: workoutData.instructions ? JSON.stringify(workoutData.instructions) : null,
        exercises: {
          create: exercises.map((exercise, index) => ({
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

    return this.calculateWorkoutStats(workout);
  }

  async getWorkoutById(id: string): Promise<WorkoutWithExercises | null> {
    const workout = await prisma.workout.findUnique({
      where: { id },
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

    return workout ? this.calculateWorkoutStats(workout) : null;
  }

  async getUserWorkouts(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    category?: string,
    isFavorite?: boolean
  ): Promise<{
    workouts: WorkoutWithExercises[];
    total: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = { userId };

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

    const workoutsWithStats = workouts.map(workout => this.calculateWorkoutStats(workout));

    return {
      workouts: workoutsWithStats,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateWorkout(id: string, input: Partial<CreateWorkoutInput>): Promise<WorkoutWithExercises | null> {
    const { exercises, ...workoutData } = input;

    const updateData: any = { ...workoutData };
    if (workoutData.targetMuscleGroups) {
      updateData.targetMuscleGroups = JSON.stringify(workoutData.targetMuscleGroups);
    }
    if (workoutData.equipment) {
      updateData.equipment = JSON.stringify(workoutData.equipment);
    }
    if (workoutData.instructions) {
      updateData.instructions = JSON.stringify(workoutData.instructions);
    }

    const workout = await prisma.workout.update({
      where: { id },
      data: updateData,
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

    return this.calculateWorkoutStats(workout);
  }

  async deleteWorkout(id: string, userId: string): Promise<boolean> {
    try {
      const workout = await prisma.workout.findFirst({
        where: { id, userId }
      });

      if (!workout) {
        return false;
      }

      await prisma.workout.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      return false;
    }
  }

  async toggleFavorite(id: string): Promise<WorkoutWithExercises | null> {
    const workout = await prisma.workout.findUnique({
      where: { id },
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

    if (!workout) {
      return null;
    }

    const updatedWorkout = await prisma.workout.update({
      where: { id },
      data: { isFavorite: !workout.isFavorite },
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

    return this.calculateWorkoutStats(updatedWorkout);
  }

  async generateWorkout(
    userId: string,
    keywords: string,
    workoutType: string,
    duration: number,
    difficulty: string,
    targetMuscleGroups: string[],
    equipment: string[],
    generateImage: boolean = false
  ): Promise<WorkoutWithExercises> {
    // Get system message for workout generation
    const systemMessage = await this.systemMessageService.getMessageByKey('workout_generation');
    
    // Get available exercises based on criteria
    const exercises = await this.getAvailableExercises(workoutType, targetMuscleGroups, equipment);
    
    // Generate workout using LLM
    const prompt = this.buildWorkoutGenerationPrompt(
      keywords,
      workoutType,
      duration,
      difficulty,
      targetMuscleGroups,
      equipment,
      exercises
    );

    const response = await this.llmRouter.routeRequest({
      messages: [
        { role: 'system', content: systemMessage?.content || this.getDefaultWorkoutSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      maxTokens: 3000,
    });

    // Parse LLM response and create workout
    const workoutData = this.parseWorkoutResponse(response.content, userId, keywords, generateImage);
    
    return this.createWorkout(workoutData);
  }

  private async getAvailableExercises(
    workoutType: string,
    targetMuscleGroups: string[],
    equipment: string[]
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

    return exercises;
  }

  private buildWorkoutGenerationPrompt(
    keywords: string,
    workoutType: string,
    duration: number,
    difficulty: string,
    targetMuscleGroups: string[],
    equipment: string[],
    exercises: any[]
  ): string {
    return `
Create a ${duration}-minute ${difficulty.toLowerCase()} ${workoutType.toLowerCase()} workout based on this request: "${keywords}"

Target muscle groups: ${targetMuscleGroups.join(', ') || 'Any'}
Available equipment: ${equipment.join(', ') || 'None'}

Available exercises (use these exercise codes):
${exercises.map(ex => `- ${ex.code}: ${ex.activity} (MET: ${ex.met})`).join('\n')}

Please create a workout with:
1. A creative name
2. Brief description
3. List of exercises with sets, reps, and rest periods
4. Estimated calorie burn
5. Step-by-step instructions

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

  private parseWorkoutResponse(
    response: string,
    userId: string,
    originalQuery: string,
    generateImage: boolean
  ): CreateWorkoutInput {
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
        aiGenerated: true,
        originalQuery,
        exercises: workoutData.exercises || [],
      };
    } catch (error) {
      console.error('Error parsing workout response:', error);
      throw new Error('Failed to parse workout generation response');
    }
  }

  private getDefaultWorkoutSystemPrompt(): string {
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

  private calculateWorkoutStats(workout: any): WorkoutWithExercises {
    // Parse JSON fields
    const targetMuscleGroups = workout.targetMuscleGroups ? JSON.parse(workout.targetMuscleGroups) : [];
    const equipment = workout.equipment ? JSON.parse(workout.equipment) : [];
    const instructions = workout.instructions ? JSON.parse(workout.instructions) : [];
    const virtualExercises = workout.virtualExercises ? JSON.parse(workout.virtualExercises) : [];

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

    // Process exercises to include images from virtualExercises
    const exercisesWithImages = workout.exercises.map((exercise: any, index: number) => {
      // Find corresponding virtual exercise with image
      const virtualExercise = virtualExercises[index];
      
      return {
        ...exercise,
        exercise: {
          ...exercise.exercise,
          // Add image URL if available from virtual exercise
          imageUrl: virtualExercise?.imageUrl || null,
        }
      };
    });

    return {
      ...workout,
      targetMuscleGroups,
      equipment,
      instructions,
      totalCalories: Math.round(totalCalories || 0),
      exercises: exercisesWithImages,
    };
  }
} 