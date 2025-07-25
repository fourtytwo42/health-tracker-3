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
    
    // Wait for LLM providers to be fully initialized
    await llmRouter.waitForInitialization();
    
    const response = await llmRouter.generateResponse({
      prompt: `System: ${systemMessage?.content || getDefaultWorkoutSystemPrompt()}\n\nUser: ${prompt}`,
      temperature: 0.7,
      maxTokens: 3000,
      userId: user.userId,
    });

    // Parse LLM response and create workout
    const workoutData = parseWorkoutResponse(response.content, user.userId, validatedData.keywords, validatedData.generateImage || false, userProfile);
    
    try {
      const workout = await createWorkout(workoutData);
      return NextResponse.json(workout);
    } catch (error) {
      console.error('Error in createWorkout:', error);
      return NextResponse.json(
        { error: 'Failed to create workout', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
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
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });
    
    if (profile) {
      // Parse JSON strings back to objects/arrays
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
    
    return profile;
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

AVAILABLE ACTIVITY TYPES (choose from these for each exercise):
LIGHT INTENSITY (MET < 3):
- walking, 1.7 mph, strolling (MET: 2.3)
- walking, 2.5 mph (MET: 2.9)
- yoga, Hatha (MET: 3.0)
- water aerobics (MET: 2.5)

MODERATE INTENSITY (MET 3-6):
- resistance training, multiple exercises, 8-15 reps (MET: 3.5)
- calisthenics, moderate effort (push ups, sit ups, pull-ups, lunges) (MET: 3.8)
- Pilates, general (MET: 3.8)
- calisthenics, home exercise, light/moderate effort (MET: 3.5)
- walking 3.0 mph (MET: 3.3)
- walking 3.4 mph (MET: 3.6)
- bicycling, <10 mph, leisure (MET: 4.0)
- bicycling, stationary, 50 watts, very light effort (MET: 5.3)
- bicycling, stationary, 100 watts, light effort (MET: 5.5)

VIGOROUS INTENSITY (MET > 6):
- jogging, general (MET: 7.0)
- calisthenics, heavy, vigorous effort (MET: 8.0)
- running/jogging, in place (MET: 8.0)
- rope jumping (MET: 10.0)

CRITICAL: Use "name" field for exercise names and "activityType" field to specify the exact activity type from the list above.

Please create a workout that:
1. Is appropriate for the user's fitness level and goals
2. Uses preferred exercises when possible
3. Avoids disliked exercises
4. Considers any health markers or limitations
5. Provides detailed, step-by-step instructions with form cues
6. Includes proper warm-up and cool-down
7. Has appropriate rest periods and progression
8. Uses descriptive search terms for exercises

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
      "name": "Exercise Name",
      "activityType": "calisthenics, moderate effort",
      "description": "detailed description of how to perform this exercise",
      "sets": 3,        // For strength training (optional for time-based exercises)
      "reps": 12,       // For strength training (optional for time-based exercises)
      "duration": 300,  // For time-based exercises like cardio, yoga, stretching (in seconds)
      "restPeriod": 60,
      "notes": "optional notes about form or modifications"
    }
  ]
}

IMPORTANT: 
1. Use "name" field for exercise names (e.g., "Push-ups", "Squats", "Calf Raises")
2. Use "activityType" field to specify the exact activity type from the list above
3. For strength training exercises, use "sets" and "reps" fields (duration will be calculated automatically)
4. For time-based exercises (cardio, yoga, stretching), use "duration" field (in seconds) instead of sets/reps
5. Choose the appropriate format based on the exercise type
6. The activityType must exactly match one from the list above for accurate calorie calculations
7. For time-based exercises, specify realistic durations (e.g., 300 seconds for 5 minutes of cardio)
      8. DO NOT include any comments in the JSON response - only valid JSON
      9. DO NOT include parenthetical text in numeric values (e.g., use "12" not "12 (per leg)")
      10. For each exercise, include an "imagePrompt" field with a creative, specific description for generating an instructional image of that exercise. Make it detailed and unique to the exercise. Focus on the specific movement, body position, and form cues. Avoid generic descriptions.
      11. Include a "workoutImagePrompt" field at the workout level with a creative, specific description for generating an image that represents the entire workout. This should capture the overall theme, intensity, and feel of the complete workout session. Make it detailed and inspiring, focusing on the workout as a whole rather than individual exercises.
`;
}

function getDefaultWorkoutSystemPrompt(): string {
  return `You are an expert fitness trainer and workout designer with deep knowledge of exercise science, biomechanics, and training principles. Your role is to create comprehensive, safe, and effective workouts that users can follow independently.

CRITICAL RULE: Use "searchTerm" field for exercises, NOT "exerciseId". The searchTerm should be a descriptive name like "push ups", "squats", "aerobic", etc. that can be used to find the best matching exercise in our database.

KEY RESPONSIBILITIES:
1. Design workouts that are appropriate for the specified difficulty level and duration
2. Provide detailed, step-by-step instructions for each exercise
3. Include proper warm-up and cool-down recommendations
4. Consider exercise progression and rest periods
5. Ensure exercises target the specified muscle groups
6. Adapt workouts to available equipment
7. Provide clear pacing and timing guidance
8. Include safety considerations and form cues
9. Use descriptive search terms for exercises - never use numeric codes

WORKOUT STRUCTURE GUIDELINES:
- Always start with a 5-10 minute warm-up
- Include proper rest periods between exercises (30-90 seconds for strength, 15-30 seconds for HIIT)
- End with a 5-10 minute cool-down and stretching
- For strength training: 3-5 sets, 8-15 reps per set (use sets and reps)
- For cardio: 20-60 minutes continuous or interval training (use duration in seconds)
- For HIIT: 30 seconds work, 30 seconds rest cycles (use duration)
- For flexibility: Hold stretches for 15-30 seconds each (use duration)
- For yoga: Hold poses for 30-60 seconds each (use duration)

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
  "workoutImagePrompt": "Creative description for generating an image that represents the entire workout theme and intensity",
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
      "searchTerm": "exercise search term",
      "description": "detailed description of how to perform this exercise",
      "sets": number_of_sets,
      "reps": reps_per_set,
      "restPeriod": rest_seconds,
      "notes": "Specific form cues, modifications, or safety notes",
      "imagePrompt": "Creative description for generating an instructional image of this specific exercise"
    }
  ]
}`;
}

function extractWorkoutJsonFromResponse(response: string): string | null {
  console.log('DEBUG: Extracting JSON from response, length:', response.length);
  console.log('DEBUG: Response starts with:', response.substring(0, 100));
  console.log('DEBUG: Response ends with:', response.substring(response.length - 100));
  
  // Strategy 1: Look for JSON code blocks (```json ... ```)
  const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    console.log('Found JSON in code block');
    return codeBlockMatch[1];
  }
  
  // Strategy 2: Look for JSON after common prefixes
  const afterPrefixMatch = response.match(/(?:Here is|Here's|Generated workout|Workout:)[\s\S]*?(\{[\s\S]*?\})/);
  if (afterPrefixMatch) {
    console.log('Found JSON after prefix');
    return afterPrefixMatch[1];
  }
  
  // Strategy 3: Find the outermost JSON object by counting braces
  const firstBrace = response.indexOf('{');
  console.log('DEBUG: First brace found at position:', firstBrace);
  if (firstBrace === -1) return null;
  
  let braceCount = 0;
  let lastBrace = -1;
  
  console.log('DEBUG: Starting brace counting from position:', firstBrace);
  
  for (let i = firstBrace; i < response.length; i++) {
    const char = response[i];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        lastBrace = i;
        console.log('DEBUG: Found matching closing brace at position:', i);
        break;
      }
    }
  }
  
  console.log('DEBUG: Final brace count:', braceCount);
  console.log('DEBUG: Last brace position:', lastBrace);
  
  if (lastBrace !== -1) {
    console.log('Found JSON with brace counting');
    const extractedJson = response.substring(firstBrace, lastBrace + 1);
    console.log('DEBUG: Extracted JSON length:', extractedJson.length);
    return extractedJson;
  }
  
  return null;
}

function cleanWorkoutJsonString(jsonString: string): string {
  // Remove any text before the first {
  const startIndex = jsonString.indexOf('{');
  if (startIndex > 0) {
    jsonString = jsonString.substring(startIndex);
  }
  
  // Remove any text after the last }
  const endIndex = jsonString.lastIndexOf('}');
  if (endIndex < jsonString.length - 1) {
    jsonString = jsonString.substring(0, endIndex + 1);
  }
  
  // Fix common JSON issues
  jsonString = jsonString
    // Remove single-line comments (// ...)
    .replace(/\/\/.*$/gm, '')
    // Remove multi-line comments (/* ... */)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Fix unquoted property names
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing quotes around string values
    .replace(/:\s*([a-zA-Z][a-zA-Z0-9\s]*[a-zA-Z0-9])(\s*[,}])/g, ':"$1"$2')
    // Remove text in parentheses from numeric values (e.g., "12 (per leg)" -> "12")
    .replace(/:\s*(\d+)\s*\([^)]*\)/g, ': $1')
    // Remove text in parentheses from string values (e.g., "value (note)" -> "value")
    .replace(/:\s*"([^"]*?)\s*\([^)]*\)"/g, ':"$1"')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  return jsonString;
}

function parseWorkoutResponse(
  response: string,
  userId: string,
  originalQuery: string,
  generateImage: boolean,
  userProfile: any
): any {
  try {
    console.log('Raw workout response:', response);
    
    // Extract JSON using the same methodology as MCP handler
    const jsonString = extractWorkoutJsonFromResponse(response);
    if (!jsonString) {
      throw new Error('No JSON found in response');
    }

    console.log('Extracted JSON string:', jsonString);
    
    // Try to parse the JSON directly first
    let workoutData;
    try {
      workoutData = JSON.parse(jsonString);
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying cleanup...');
      // Clean up common JSON issues
      const cleanedJson = cleanWorkoutJsonString(jsonString);
      console.log('Cleaned JSON string:', cleanedJson);
      workoutData = JSON.parse(cleanedJson);
    }

    // Fix common issues with AI-generated workout data
    if (workoutData.duration && typeof workoutData.duration === 'number' && workoutData.duration < 3600) {
      // Convert minutes to seconds if duration is less than 1 hour
      console.log(`Converting duration from ${workoutData.duration} minutes to ${workoutData.duration * 60} seconds`);
      workoutData.duration = workoutData.duration * 60;
    }

    // Ensure we have valid exercises array (handle duplicate exercises arrays)
    let exercises = workoutData.exercises || [];
    if (Array.isArray(exercises) && exercises.length > 0) {
      // Filter out any exercises that don't have required fields
      exercises = exercises.filter((exercise: any) => 
        exercise && 
        exercise.name && 
        exercise.activityType &&
        (exercise.duration || (exercise.sets && exercise.reps))
      );
    }

    // Ensure all required fields are present
    const parsedData = {
      userId,
      name: workoutData.name || 'Generated Workout',
      description: workoutData.description || 'AI-generated workout',
      category: workoutData.category || 'CARDIO',
      difficulty: workoutData.difficulty || 'BEGINNER',
      duration: workoutData.duration || 1800, // Default to 30 minutes
      totalCalories: workoutData.totalCalories || 0,
      targetMuscleGroups: workoutData.targetMuscleGroups || [],
      equipment: workoutData.equipment || [],
      instructions: workoutData.instructions || [],
      photoUrl: null,
      isFavorite: false,
      isPublic: false,
      aiGenerated: true,
      originalQuery,
      exercises: exercises,
      generateImage: generateImage,
      userProfile: userProfile,
      // Store the main image prompt separately for image generation, not in database
      mainImagePrompt: workoutData.mainImagePrompt || workoutData.workoutImagePrompt,
    };

    console.log('Parsed workout data:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Error parsing workout response:', error);
    throw new Error('Failed to parse workout generation response');
  }
}

async function createWorkout(workoutData: any): Promise<any> {
  const { exercises, generateImage, userProfile, mainImagePrompt, ...workoutInfo } = workoutData;
  
  // Generate images if requested
  let workoutPhotoUrl = null;
  let exerciseImages = null;
  
  console.log('DEBUG: workoutData.generateImage =', workoutData.generateImage);
  if (workoutData.generateImage) {
    try {
      console.log('Generating images for workout...');
      
      // Build personalized image prompt using user profile
      const workoutImagePrompt = buildPersonalizedWorkoutImagePrompt(
        mainImagePrompt || `A professional fitness photo showing a ${(workoutData.difficulty || 'beginner').toLowerCase()} ${(workoutData.category || 'cardio').toLowerCase()} workout. The image should show someone in athletic clothing performing exercises like ${exercises.slice(0, 3).map((e: any) => e.name).join(', ')} in a well-lit gym or home setting. The person should be using proper form and the image should be suitable for fitness instruction.`,
        userProfile
      );
      
      const { generateImage } = await import('@/lib/services/ImageGenerationService');
      
      console.log('DEBUG: About to generate workout image with prompt:', workoutImagePrompt);
      const workoutImageResult = await generateImage({
        prompt: workoutImagePrompt,
        textModel: 'gpt-4o-mini',
        quality: 'low',
        size: '1024x1536'
      });
      console.log('DEBUG: Workout image result success:', workoutImageResult.success);

      if (workoutImageResult.success) {
        workoutPhotoUrl = workoutImageResult.imageUrl;
        console.log('Workout image generated successfully');
      } else {
        console.error('Failed to generate workout image:', workoutImageResult.error);
      }
      
      // Generate exercise images in parallel
      console.log('Generating exercise images in parallel...');
      const exerciseImagePromises = exercises.map(async (exercise: any, index: number) => {
        // Use AI-generated image prompt if available, otherwise fall back to template
        const baseExercisePrompt = exercise.imagePrompt || `A clear, instructional fitness photo showing how to perform ${exercise.name}. The image should show proper form and technique for this exercise. The person should be in athletic clothing and the image should be well-lit and suitable for fitness instruction. ${exercise.description || ''}`;
        const exerciseImagePrompt = buildPersonalizedExerciseImagePrompt(baseExercisePrompt, userProfile);
        
        console.log(`DEBUG: Generating image for exercise "${exercise.name}" with prompt: ${exerciseImagePrompt.substring(0, 100)}...`);
        
        try {
          const imageResult = await generateImage({
            prompt: exerciseImagePrompt,
            textModel: 'gpt-4o-mini',
            quality: 'low',
            size: '1024x1536'
          });
          
          return {
            exerciseIndex: index,
            success: imageResult.success,
            imageUrl: imageResult.imageUrl,
            error: imageResult.error
          };
        } catch (error) {
          console.error(`Error generating image for exercise ${exercise.name}:`, error);
          return {
            exerciseIndex: index,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      const exerciseImageResults = await Promise.all(exerciseImagePromises);
      exerciseImages = exerciseImageResults;
      
      console.log(`Generated ${exerciseImageResults.filter(r => r.success).length} out of ${exercises.length} exercise images`);
      
      // Debug: Log each exercise image result
      exerciseImageResults.forEach((result, index) => {
        console.log(`  Exercise ${index + 1} image: ${result.success ? 'Success' : 'Failed'}`);
        if (result.success) {
          console.log(`    URL: ${result.imageUrl?.substring(0, 100)}...`);
        } else {
          console.log(`    Error: ${result.error}`);
        }
      });
      
    } catch (error) {
      console.error('Error generating workout images:', error);
    }
  }

  // MET values mapping
  const metValues = {
    'walking, 1.7 mph, strolling': 2.3,
    'walking, 2.5 mph': 2.9,
    'walking, 3.0 mph': 3.3,
    'walking, 3.4 mph': 3.6,
    'yoga, Hatha': 3.0,
    'water aerobics': 2.5,
    'resistance training, multiple exercises, 8-15 reps': 3.5,
    'calisthenics, moderate effort': 3.8,
    'Pilates, general': 3.8,
    'calisthenics, home exercise, light/moderate effort': 3.5,
    'bicycling, <10 mph, leisure': 4.0,
    'bicycling, stationary, 50 watts, very light effort': 5.3,
    'bicycling, stationary, 100 watts, light effort': 5.5,
    'jogging, general': 7.0,
    'calisthenics, heavy, vigorous effort': 8.0,
    'running/jogging, in place': 8.0,
    'rope jumping': 10.0,
    'flexibility': 2.5
  };

  // Process exercises and calculate calories
  let totalCalories = 0;
  const processedExercises = exercises.map((exercise: any, index: number) => {
    const activityType = exercise.activityType;
    const met = metValues[activityType as keyof typeof metValues];
    
    if (!met) {
      throw new Error(`Unknown activity type: "${activityType}"`);
    }
    
    // Calculate calories for this exercise
    let exerciseCalories = 0;
    let totalDuration = 0;
    const userWeight = 70; // Default weight for calculation
    
    // For strength training, we might need to adjust MET based on intensity
    let adjustedMet = met;
    if (exercise.sets && exercise.reps) {
      // Strength training is more intense than the base MET suggests
      // Adjust MET based on number of sets and reps (more work = higher intensity)
      const totalReps = exercise.sets * exercise.reps;
      if (totalReps >= 30) adjustedMet = met * 1.2; // High volume = higher intensity
      else if (totalReps >= 20) adjustedMet = met * 1.1; // Medium volume
    }
    
    if (exercise.sets && exercise.reps) {
      // Rep-based exercise (strength training)
      // For strength training, we need to account for the full effort of each set
      // This includes the time doing reps, brief pauses between reps, and the intensity
      
      // Calculate total time per set (more realistic)
      // Each set takes approximately 5 minutes (300 seconds)
      // This includes the time doing reps, rest between reps, and setup
      const timePerSet = 300; // 5 minutes per set
      
      // Total work time across all sets
      const totalWorkTime = exercise.sets * timePerSet;
      
      // For calorie calculation, use total work time
      totalDuration = totalWorkTime;
      
      // Calories = (MET * weight * work_duration_in_hours)
      exerciseCalories = Math.round((adjustedMet * userWeight * totalDuration) / 3600);
    } else if (exercise.duration) {
      // Time-based exercise (cardio, yoga, etc.)
      totalDuration = exercise.duration;
      
      // Calories = (MET * weight * duration_in_hours)
      exerciseCalories = Math.round((met * userWeight * totalDuration) / 3600);
    }
    
    totalCalories += exerciseCalories;
    
    // Get exercise image if available
    const exerciseImage = exerciseImages ? exerciseImages.find((img: any) => img.exerciseIndex === index) : null;
    
    return {
      exerciseId: `VIRTUAL-${index + 1}`,
      sets: exercise.sets || null,
      reps: exercise.reps || null,
      duration: exercise.duration || null,
      restPeriod: exercise.restPeriod || 60,
      order: index + 1,
      notes: exercise.notes,
      calories: exerciseCalories,
      name: exercise.name,
      description: exercise.description,
      activityType: exercise.activityType,
      // Add exercise image if generated
      imageUrl: exerciseImage?.success ? exerciseImage.imageUrl : null,
    };
  });

          const workout = await prisma.workout.create({
          data: {
            ...workoutInfo,
            totalCalories: totalCalories,
            targetMuscleGroups: workoutInfo.targetMuscleGroups ? JSON.stringify(workoutInfo.targetMuscleGroups) : null,
            equipment: workoutInfo.equipment ? JSON.stringify(workoutInfo.equipment) : null,
            instructions: workoutInfo.instructions ? JSON.stringify(workoutInfo.instructions) : null,
            // Store virtual exercises data in the workout record
            virtualExercises: JSON.stringify(processedExercises),
            // Add workout image if generated
            photoUrl: workoutPhotoUrl,
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

  return calculateWorkoutStats(workout, processedExercises);
}

function calculateWorkoutStats(workout: any, processedExercises?: any[]): any {
  // Parse JSON fields
  const targetMuscleGroups = workout.targetMuscleGroups ? JSON.parse(workout.targetMuscleGroups) : [];
  const equipment = workout.equipment ? JSON.parse(workout.equipment) : [];
  const instructions = workout.instructions ? JSON.parse(workout.instructions) : [];

  // Use provided total calories or calculate from processed exercises
  let totalCalories = workout.totalCalories;
  if (!totalCalories && processedExercises) {
    totalCalories = processedExercises.reduce((total: number, exercise: any) => {
      return total + (exercise.calories || 0);
    }, 0);
  }

  // Convert virtual exercises to the format expected by the UI
  const exercisesForUI = processedExercises ? processedExercises.map((ve: any, index: number) => ({
    id: ve.exerciseId || `virtual-${index + 1}`,
    exerciseId: ve.exerciseId || `virtual-${index + 1}`,
    exercise: {
      id: ve.exerciseId || `virtual-${index + 1}`,
      activity: ve.name || 'Virtual Exercise',
      code: ve.exerciseId || 'VIRTUAL',
      met: 3.5, // Default MET value
      description: ve.description || 'AI-generated exercise',
      category: 'VIRTUAL',
      intensity: 'MODERATE',
      isActive: true,
      // Add exercise image if available
      imageUrl: ve.imageUrl || null,
    },
    sets: ve.sets,
    reps: ve.reps,
    duration: ve.duration,
    restPeriod: ve.restPeriod || 60,
    order: ve.order || index + 1,
    notes: ve.notes
  })) : [];

  const result = {
    ...workout,
    targetMuscleGroups,
    equipment,
    instructions,
    totalCalories: Math.round(totalCalories || 0),
    // Add virtual exercises for display
    virtualExercises: processedExercises || [],
    // Add exercises in the format expected by the UI
    exercises: exercisesForUI,
  };

        // Debug: Check if exercise images are included
      console.log('DEBUG: Final response exercise images:');
      exercisesForUI.forEach((ex, index) => {
        console.log(`  Exercise ${index + 1}: ${ex.exercise.activity} - imageUrl: ${ex.exercise.imageUrl ? 'Present' : 'Missing'}`);
        if (ex.exercise.imageUrl) {
          console.log(`    URL: ${ex.exercise.imageUrl.substring(0, 100)}...`);
        }
      });

  return result;
}

// Helper function to build personalized workout image prompts
function buildPersonalizedWorkoutImagePrompt(basePrompt: string, userProfile: any): string {
  if (!userProfile) {
    return basePrompt;
  }

  const personalizationDetails = [];
  
  // Add gender if available
  if (userProfile.gender && userProfile.gender !== 'PREFER_NOT_TO_SAY') {
    const genderText = userProfile.gender === 'MALE' ? 'man' : userProfile.gender === 'FEMALE' ? 'woman' : 'person';
    personalizationDetails.push(genderText);
  }
  
  // Add body type information based on height and weight
  if (userProfile.height && userProfile.weight) {
    const heightCm = userProfile.height;
    const weightKg = userProfile.weight;
    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    
    let bodyType = '';
    if (bmi < 18.5) {
      bodyType = 'slim';
    } else if (bmi < 25) {
      bodyType = 'average build';
    } else if (bmi < 30) {
      bodyType = 'athletic build';
    } else {
      bodyType = 'strong build';
    }
    
    personalizationDetails.push(bodyType);
  }
  
  // Add age information if available
  if (userProfile.dateOfBirth) {
    const age = Math.floor((new Date().getTime() - new Date(userProfile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age >= 18 && age <= 65) {
      personalizationDetails.push(`${age}-year-old`);
    }
  }
  
  // Build the personalized prompt
  if (personalizationDetails.length > 0) {
    const personalization = personalizationDetails.join(' ');
    return basePrompt.replace(
      /someone in athletic clothing/,
      `a ${personalization} in athletic clothing`
    );
  }
  
  return basePrompt;
}

// Helper function to build personalized exercise image prompts
function buildPersonalizedExerciseImagePrompt(basePrompt: string, userProfile: any): string {
  if (!userProfile) {
    return basePrompt;
  }

  const personalizationDetails = [];
  
  // Add gender if available
  if (userProfile.gender && userProfile.gender !== 'PREFER_NOT_TO_SAY') {
    const genderText = userProfile.gender === 'MALE' ? 'man' : userProfile.gender === 'FEMALE' ? 'woman' : 'person';
    personalizationDetails.push(genderText);
  }
  
  // Add body type information based on height and weight
  if (userProfile.height && userProfile.weight) {
    const heightCm = userProfile.height;
    const weightKg = userProfile.weight;
    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    
    let bodyType = '';
    if (bmi < 18.5) {
      bodyType = 'slim';
    } else if (bmi < 25) {
      bodyType = 'average build';
    } else if (bmi < 30) {
      bodyType = 'athletic build';
    } else {
      bodyType = 'strong build';
    }
    
    personalizationDetails.push(bodyType);
  }
  
  // Add age information if available
  if (userProfile.dateOfBirth) {
    const age = Math.floor((new Date().getTime() - new Date(userProfile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age >= 18 && age <= 65) {
      personalizationDetails.push(`${age}-year-old`);
    }
  }
  
  // Build the personalized prompt
  if (personalizationDetails.length > 0) {
    const personalization = personalizationDetails.join(' ');
    return basePrompt.replace(
      /The person should be in athletic clothing/,
      `The ${personalization} should be in athletic clothing`
    );
  }
  
  return basePrompt;
} 