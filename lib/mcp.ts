import { z } from 'zod';
import { LLMRouter } from './llmRouter';
import { AuthService, JWTPayload } from './auth';
import { SystemMessageService } from './services/SystemMessageService';
import { prisma } from './prisma';

export interface MCPTool {
  name: string;
  description: string;
  schema: z.ZodSchema;
  handler: (args: any, authInfo: JWTPayload) => Promise<any>;
}

export interface MCPRequest {
  tool: string;
  args: any;
}

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  componentJson?: any;
}

export class MCPHandler {
  private static instance: MCPHandler;
  private tools: Map<string, MCPTool> = new Map();
  private llmRouter: LLMRouter;
  private systemMessageService: SystemMessageService;

  private constructor() {
    this.llmRouter = LLMRouter.getInstance();
    this.systemMessageService = new SystemMessageService();
    this.registerDefaultTools();
  }

  private cleanJsonString(jsonString: string): string {
    // Remove any remaining text before the first {
    jsonString = jsonString.replace(/^[^{]*/, '');
    // Remove any text after the last }
    jsonString = jsonString.replace(/}[^}]*$/, '}');
    // Fix missing quotes around property names (only if they're missing)
    jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Filter out any letters in the amount field and pull just the number
    jsonString = jsonString.replace(/"amount":\s*"?([0-9]+(?:\.[0-9]+)?)[a-zA-Z]*"?/g, '"amount": $1');
    
    // Fix ingredient amounts that have units attached (e.g., "400g" -> "400")
    jsonString = jsonString.replace(/"amount":\s*"?(\d+(?:\.\d+)?)(g|ml|kg|l|oz|lb|tbsp|tsp|cup|cups)"?/g, '"amount": $1');
    
    // Fix any remaining amounts with units in the entire JSON
    jsonString = jsonString.replace(/"amount":\s*"?(\d+(?:\.\d+)?)(g|ml|kg|l|oz|lb|tbsp|tsp|cup|cups)"?/g, '"amount": $1');
    
    // Fix missing quotes around string values that should be quoted
    jsonString = jsonString.replace(/:\s*([a-zA-Z][a-zA-Z0-9\s]+)(?=\s*[,}])/g, ': "$1"');
    
    // Fix boolean values that might be quoted
    jsonString = jsonString.replace(/"true"/g, 'true');
    jsonString = jsonString.replace(/"false"/g, 'false');
    
    // More comprehensive trailing comma removal
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
    jsonString = jsonString.replace(/,(\s*})/g, '$1');
    jsonString = jsonString.replace(/,(\s*\])/g, '$1');
    
    // Multiple passes for nested structures
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix null values
    jsonString = jsonString.replace(/"null"/g, 'null');
    jsonString = jsonString.replace(/null\s*,/g, 'null,');
    jsonString = jsonString.replace(/null\s*}/g, 'null}');
    
    // Additional manual cleanup for specific issues
    // Remove trailing commas before closing brackets/braces
    jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
    // Remove trailing commas before closing braces
    jsonString = jsonString.replace(/,\s*}/g, '}');
    // Remove trailing commas before closing brackets
    jsonString = jsonString.replace(/,\s*\]/g, ']');
    
    // Fix any remaining unquoted strings in arrays
    jsonString = jsonString.replace(/\[\s*([a-zA-Z][a-zA-Z0-9\s]+)\s*\]/g, '["$1"]');
    
    // Additional cleanup for common JSON issues
    jsonString = jsonString.replace(/\s+/g, ' ').trim();
    
    return jsonString;
  }

  private extractJsonFromResponse(response: string): string | null {
    // Strategy 1: Look for JSON code blocks (```json ... ```)
    const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      console.log('Found JSON in code block');
      return codeBlockMatch[1];
    }
    
    // Strategy 2: Look for JSON after common prefixes
    const afterPrefixMatch = response.match(/(?:Here is|Here's|Generated recipe|Recipe:)[\s\S]*?(\{[\s\S]*?\})/);
    if (afterPrefixMatch) {
      console.log('Found JSON after prefix');
      return afterPrefixMatch[1];
    }
    
    // Strategy 3: Find the outermost JSON object by counting braces
    const firstBrace = response.indexOf('{');
    if (firstBrace === -1) return null;
    
    let braceCount = 0;
    let lastBrace = -1;
    
    for (let i = firstBrace; i < response.length; i++) {
      const char = response[i];
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          lastBrace = i;
          break;
        }
      }
    }
    
    if (lastBrace !== -1) {
      console.log('Found JSON with brace counting');
      return response.substring(firstBrace, lastBrace + 1);
    }
    
    return null;
  }

  // Add method to ensure LLM Router is initialized
  async ensureLLMInitialized(): Promise<void> {
    // Wait for providers to be initialized and probed
    await this.llmRouter.waitForInitialization();
  }

  static getInstance(): MCPHandler {
    if (!MCPHandler.instance) {
      MCPHandler.instance = new MCPHandler();
    }
    return MCPHandler.instance;
  }

  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    console.log(`Registered MCP tool: ${tool.name}`);
  }

  private registerDefaultTools(): void {
    // Chat tool for general conversation
    this.registerTool({
      name: 'chat',
      description: 'Have a conversation with the AI',
      schema: z.object({
        message: z.string().describe('The message to send to the AI'),
      }),
      handler: async (args, authInfo) => {
        const response = await this.llmRouter.generateResponse({
          prompt: args.message,
          userId: authInfo.userId,
          tool: 'chat',
        });
        
        return {
          message: response.content,
          provider: response.provider,
        };
      },
    });

    // Generate meal plan tool
    this.registerTool({
      name: 'generate_meal_plan',
      description: 'Generate a personalized meal plan',
      schema: z.object({
        duration_days: z.number().min(1).max(30).describe('Number of days for the meal plan'),
        calorie_target: z.number().optional().describe('Daily calorie target'),
        dietary_preferences: z.array(z.string()).optional().describe('Dietary preferences or restrictions'),
        goal: z.enum(['weight_loss', 'muscle_gain', 'maintenance']).optional().describe('Fitness goal'),
      }),
      handler: async (args, authInfo) => {
        const calorieTarget = args.calorie_target || 2000;
        const dailyCalories = Math.round(calorieTarget / 4); // Divide by 4 meals per day
        
        // Get system message for meal plan generation
        let mealPlanPrompt = await this.systemMessageService.getMessageContent('prompts.meal_plan_generation');
        
        if (!mealPlanPrompt) {
          // Fallback prompt if system message not found
          mealPlanPrompt = `Generate a detailed ${args.duration_days}-day meal plan with the following requirements:

CALORIE TARGET: ${calorieTarget} calories per day (approximately ${dailyCalories} calories per meal)
DIETARY PREFERENCES: ${args.dietary_preferences?.join(', ') || 'None specified'}
GOAL: ${args.goal || 'maintenance'}

For each day, create 4 meals (breakfast, lunch, dinner, snack) with:
1. Complete recipe with ingredients and measurements
2. Step-by-step cooking instructions
3. Nutritional breakdown (calories, protein, carbs, fat)
4. Prep time and cook time
5. Meal type (BREAKFAST, LUNCH, DINNER, SNACK)

Format the response as a JSON object with this structure:
{
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "name": "Recipe Name",
          "mealType": "BREAKFAST",
          "calories": 400,
          "protein": 25,
          "carbs": 45,
          "fat": 15,
          "ingredients": ["1 cup ingredient", "2 tbsp ingredient"],
          "instructions": ["Step 1", "Step 2", "Step 3"],
          "prepTime": "10 minutes",
          "cookTime": "15 minutes"
        }
      ],
      "totalCalories": 1600
    }
  ],
  "totalCalories": 11200,
  "avgCaloriesPerDay": 1600
}

Make sure each recipe is realistic, healthy, and includes proper nutritional information.`;
        } else {
          // Replace placeholders in system message
          mealPlanPrompt = mealPlanPrompt
            .replace('{durationDays}', args.duration_days.toString())
            .replace('{calorieTarget}', calorieTarget.toString())
            .replace('{preferences}', args.dietary_preferences?.join(', ') || 'None specified');
        }

        const llmResponse = await this.llmRouter.generateResponse({
          prompt: mealPlanPrompt,
          maxTokens: 128000,
          userId: authInfo.userId,
          tool: 'generate_meal_plan',
        });

        // Parse the LLM response to extract the meal plan
        let mealPlan;
        try {
          // Try to extract JSON from the response
          const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            mealPlan = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (error) {
          console.error('Failed to parse meal plan JSON:', error);
          // Fallback to generating a basic structure
          mealPlan = {
            days: [],
            totalCalories: args.duration_days * calorieTarget,
            avgCaloriesPerDay: calorieTarget
          };
        }

        // Create a simple description based on the meal plan data
        const description = `I've created a comprehensive ${args.duration_days}-day meal plan${args.calorie_target ? ` with ${args.calorie_target} calories per day` : ''}${args.dietary_preferences ? ` considering: ${args.dietary_preferences.join(', ')}` : ''}${args.goal ? ` for ${args.goal}` : ''}. 

The meal plan includes detailed recipes for each meal with complete ingredient lists, step-by-step cooking instructions, nutritional information, and prep/cook times. Each day contains 4 meals with a total of ${mealPlan.avgCaloriesPerDay || Math.round(mealPlan.totalCalories / args.duration_days)} calories per day. The plan is designed to be healthy, balanced, and easy to follow.`;

        return {
          type: 'PlanSummary',
          props: {
            title: `${args.duration_days}-Day Meal Plan`,
            description: description,
            type: 'meal',
            duration: args.duration_days,
            status: 'active',
            days: mealPlan.days || [],
            totalCalories: mealPlan.totalCalories || (args.duration_days * calorieTarget),
            avgCaloriesPerDay: mealPlan.avgCaloriesPerDay || Math.round(mealPlan.totalCalories / args.duration_days),
          },
          quickReplies: [
            { label: 'Log a meal from this plan', value: 'I want to log a meal from this plan' },
            { label: 'Generate grocery list', value: 'Create a grocery list for this meal plan' },
            { label: 'Modify the plan', value: 'I want to modify this meal plan' },
          ],
        };
      },
    });

    // Log meal tool
    this.registerTool({
      name: 'log_meal',
      description: 'Log a meal entry',
      schema: z.object({
        name: z.string().describe('Name of the meal'),
        meal_type: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']).describe('Type of meal'),
        calories: z.number().optional().describe('Calories consumed'),
        protein: z.number().optional().describe('Protein in grams'),
        carbs: z.number().optional().describe('Carbohydrates in grams'),
        fat: z.number().optional().describe('Fat in grams'),
        ingredients: z.array(z.string()).optional().describe('List of ingredients'),
        notes: z.string().optional().describe('Additional notes about the meal'),
      }),
      handler: async (args, authInfo) => {
        const response = await this.llmRouter.generateResponse({
          prompt: `Log a meal: ${args.name} (${args.meal_type})${args.calories ? ` - ${args.calories} calories` : ''}${args.notes ? ` - Notes: ${args.notes}` : ''}. Provide a brief confirmation message.`,
          userId: authInfo.userId,
          tool: 'log_meal',
        });

        return {
          type: 'MealCard',
          props: {
            title: args.name,
            mealType: args.meal_type,
            calories: args.calories,
            protein: args.protein,
            carbs: args.carbs,
            fat: args.fat,
            status: 'logged',
            message: response.content,
          },
          quickReplies: [
            { label: 'Log another meal', value: 'I want to log another meal' },
            { label: 'View my meal history', value: 'Show me my recent meals' },
            { label: 'Create a meal plan', value: 'I want to create a meal plan' },
          ],
        };
      },
    });

    // Get leaderboard tool
    this.registerTool({
      name: 'get_leaderboard',
      description: 'Get leaderboard data for users',
      schema: z.object({
        type: z.enum(['global', 'around_me', 'me']).describe('Type of leaderboard'),
        limit: z.number().min(1).max(100).optional().default(10).describe('Number of users to return'),
      }),
      handler: async (args, authInfo) => {
        try {
          const { LeaderboardService } = await import('./services/LeaderboardService');
          const leaderboardService = new LeaderboardService();
          
          let leaderboardData;
          
          switch (args.type) {
            case 'global':
              leaderboardData = await leaderboardService.getTopUsers(args.limit);
              break;
            case 'around_me':
              leaderboardData = await leaderboardService.getUsersAroundMe(authInfo.userId, args.limit);
              break;
            case 'me':
              leaderboardData = await leaderboardService.getUserRank(authInfo.userId);
              break;
            default:
              throw new Error(`Unknown leaderboard type: ${args.type}`);
          }

          return {
            type: 'LeaderboardSnippet',
            props: {
              currentRank: leaderboardData.currentRank || 0,
              totalPoints: leaderboardData.totalPoints || 0,
              topUsers: leaderboardData.users || leaderboardData.topUsers || [],
              type: args.type,
              limit: args.limit
            },
            quickReplies: [
              { label: 'View my stats', value: 'Show me my personal health stats' },
              { label: 'Set a goal', value: 'I want to set a new fitness goal' },
              { label: 'Log an activity', value: 'I want to log a workout' },
            ],
          };
        } catch (error) {
          console.error('Leaderboard error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch leaderboard'
          };
        }
      },
    });

    // Generate workout tool
    this.registerTool({
      name: 'generate_workout',
      description: 'Generate a personalized workout plan',
      schema: z.object({
        keywords: z.string().describe('User request or keywords for the workout'),
        workoutType: z.enum(['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'HIIT', 'CIRCUIT', 'YOGA', 'PILATES']).describe('Type of workout'),
        duration: z.number().min(15).max(120).describe('Duration in minutes'),
        difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).describe('Difficulty level'),
        targetMuscleGroups: z.array(z.string()).optional().describe('Target muscle groups'),
        equipment: z.array(z.string()).optional().describe('Available equipment'),
        generateImage: z.boolean().optional().default(false).describe('Whether to generate exercise images'),
      }),
      handler: async (args, authInfo) => {
        try {
          // Get user profile
          const userProfile = await prisma.profile.findUnique({
            where: { userId: authInfo.userId }
          });
          
          // Parse JSON strings if profile exists
          if (userProfile) {
            try {
              if (userProfile.dietaryPreferences) {
                userProfile.dietaryPreferences = JSON.parse(userProfile.dietaryPreferences);
              }
              if (userProfile.privacySettings) {
                userProfile.privacySettings = JSON.parse(userProfile.privacySettings);
              }
            } catch (parseError) {
              console.error('Error parsing profile JSON fields in MCP:', parseError);
            }
          }

          const biomarkers = await prisma.biomarker.findMany({
            where: { userId: authInfo.userId },
            orderBy: { createdAt: 'desc' },
            take: 5
          });

                   // Generate workout plan using AI
         const workoutPrompt = `Create a ${args.duration}-minute ${args.difficulty.toLowerCase()} ${args.workoutType.toLowerCase()} workout based on this request: "${args.keywords}"

USER CONTEXT:
${userProfile ? `Weight: ${userProfile.weight || 'Not specified'}kg
Height: ${userProfile.height || 'Not specified'}cm
Fitness Level: ${userProfile.activityLevel || 'Not specified'}
Goals: ${userProfile.fitnessGoals || 'Not specified'}` : 'No specific user profile data available'}

${biomarkers.length > 0 ? `Recent Biomarkers: ${biomarkers.slice(0, 3).map(b => `${b.type}: ${b.value}${b.unit || ''}`).join(', ')}` : ''}

Target muscle groups: ${args.targetMuscleGroups?.join(', ') || 'Any'}
Available equipment: ${args.equipment?.join(', ') || 'None'}

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

CRITICAL WORKOUT TYPE RULES:

**CARDIO WORKOUTS:**
- NO sets or reps - use continuous duration-based activities
- Stay in the SAME environment/location throughout the workout
- Use activities like walking, jogging, cycling, swimming, etc.
- Each exercise should be a continuous block of time
- Include warm-up and cool-down periods

**STRENGTH WORKOUTS:**
- Use sets and reps for resistance exercises
- Can include multiple exercises with rest periods
- Focus on specific muscle groups

**FLEXIBILITY/YOGA WORKOUTS:**
- Use duration-based activities
- Focus on stretching and flexibility
- Include proper warm-up

**HIIT/CIRCUIT WORKOUTS:**
- Use timed intervals (work/rest periods)
- High intensity followed by recovery
- Can include multiple exercises in rotation

EXAMPLES OF CORRECT JSON FORMATS:

**CARDIO WORKOUT EXAMPLE:**
{
  "name": "Beginner Cardio Walk",
  "description": "A gentle 30-minute walking workout for beginners",
  "category": "CARDIO",
  "difficulty": "BEGINNER",
  "duration": 1800,
  "totalCalories": 180,
  "targetMuscleGroups": ["legs", "core"],
  "equipment": [],
  "instructions": [
    "Start with 5 minutes of slow walking to warm up",
    "Increase pace to moderate walking for 20 minutes",
    "Finish with 5 minutes of slow walking to cool down"
  ],
  "mainImagePrompt": "A person walking on a scenic trail in the morning, with a fitness tracker on their wrist and a peaceful expression, surrounded by nature and good lighting",
  "exercises": [
    {
      "name": "Warm-up Walk",
      "activityType": "walking, 1.7 mph, strolling",
      "description": "Walk at a slow, comfortable pace to warm up your muscles",
      "duration": 300,
      "restPeriod": 0,
      "imagePrompt": "A person walking slowly on a flat surface, with relaxed posture and arms swinging naturally",
      "notes": "Focus on breathing and getting comfortable"
    },
    {
      "name": "Moderate Walking",
      "activityType": "walking, 2.5 mph",
      "description": "Walk at a moderate pace, keeping good posture",
      "duration": 1200,
      "restPeriod": 0,
      "imagePrompt": "A person walking briskly with good posture, arms swinging naturally, on a sidewalk or trail",
      "notes": "Maintain steady pace throughout"
    },
    {
      "name": "Cool-down Walk",
      "activityType": "walking, 1.7 mph, strolling",
      "description": "Gradually slow down your pace to cool down",
      "duration": 300,
      "restPeriod": 0,
      "imagePrompt": "A person walking slowly and relaxed, with a content expression, finishing their workout",
      "notes": "Take deep breaths and relax"
    }
  ]
}

**STRENGTH WORKOUT EXAMPLE:**
{
  "name": "Beginner Strength Training",
  "description": "A basic strength workout using bodyweight exercises",
  "category": "STRENGTH",
  "difficulty": "BEGINNER",
  "duration": 1800,
  "totalCalories": 200,
  "targetMuscleGroups": ["legs", "arms", "core"],
  "equipment": [],
  "instructions": [
    "Warm up with 5 minutes of light cardio",
    "Perform 3 sets of each exercise with 60 seconds rest between sets",
    "Cool down with 5 minutes of stretching"
  ],
  "mainImagePrompt": "A person performing bodyweight exercises in a well-lit home gym, showing determination and proper form",
  "exercises": [
    {
      "name": "Bodyweight Squats",
      "activityType": "calisthenics, moderate effort",
      "description": "Stand with feet shoulder-width apart, lower into squat position, then return to standing",
      "sets": 3,
      "reps": 12,
      "restPeriod": 60,
      "imagePrompt": "A person in a squat position with proper form, knees behind toes, back straight",
      "notes": "Keep your back straight and knees behind your toes"
    }
  ]
}

**CORRECT JSON STRUCTURE:**
{
  "name": "Workout Name",
  "description": "Workout description",
  "category": "CARDIO|STRENGTH|FLEXIBILITY|HIIT",
  "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
  "duration": 1800,
  "totalCalories": 200,
  "targetMuscleGroups": ["legs", "core"],
  "equipment": [],
  "instructions": ["step 1", "step 2"],
  "mainImagePrompt": "DESCRIPTION FOR MAIN WORKOUT IMAGE - THIS GOES AT WORKOUT LEVEL",
  "exercises": [
    {
      "name": "Exercise Name",
      "activityType": "walking, 2.5 mph",
      "description": "Exercise description",
      "duration": 300,
      "restPeriod": 60,
      "imagePrompt": "DESCRIPTION FOR THIS EXERCISE'S IMAGE - THIS GOES INSIDE EACH EXERCISE",
      "notes": "Exercise notes"
    }
  ]
}

Please create a workout that:
1. Is appropriate for the user's fitness level and goals
2. Uses preferred exercises when possible
3. Avoids disliked exercises
4. Considers any health markers or limitations
5. Provides detailed, step-by-step instructions with form cues
6. Includes proper warm-up and cool-down
7. Has appropriate rest periods and progression
8. Follows the specific rules for the workout type above
9. Creates detailed image prompts for the main workout and each exercise

IMAGE PROMPT REQUIREMENTS:
- Create a "mainImagePrompt" field at the WORKOUT LEVEL (not inside exercises) that captures the overall theme and energy of the workout
- Create an "imagePrompt" field for each exercise that shows proper form and technique
- Make prompts detailed and descriptive for better image generation
- Include relevant details like environment, equipment, and form cues

CRITICAL: The "mainImagePrompt" must be at the workout level, NOT inside individual exercises. Each exercise should have its own "imagePrompt" field.

Format the response as JSON following the examples above. For CARDIO workouts, use duration-based exercises with NO sets or reps. For STRENGTH workouts, use sets and reps.`;

          const llmResponse = await this.llmRouter.generateResponse({
            prompt: workoutPrompt,
            userId: authInfo.userId,
            tool: 'generate_workout',
            maxTokens: 3000,
            temperature: 0.7
          });

          // Parse the workout response
          let workoutData;
          try {
            const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              workoutData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found in response');
            }
          } catch (parseError) {
            console.error('Failed to parse workout response:', llmResponse.content);
            throw new Error('Failed to parse workout generation response');
          }

          // Process exercises using activity types and MET values
          const matchedExercises = [];

          // MET values mapping
          const metValues = {
            'walking, 1.7 mph, strolling': 2.3,
            'walking, 2.5 mph': 2.9,
            'yoga, Hatha': 3.0,
            'water aerobics': 2.5,
            'resistance training, multiple exercises, 8-15 reps': 3.5,
            'calisthenics, moderate effort': 3.8,
            'Pilates, general': 3.8,
            'calisthenics, home exercise, light/moderate effort': 3.5,
            'walking 3.0 mph': 3.3,
            'walking 3.4 mph': 3.6,
            'bicycling, <10 mph, leisure': 4.0,
            'bicycling, stationary, 50 watts, very light effort': 5.3,
            'bicycling, stationary, 100 watts, light effort': 5.5,
            'jogging, general': 7.0,
            'calisthenics, heavy, vigorous effort': 8.0,
            'running/jogging, in place': 8.0,
            'rope jumping': 10.0
          };

          for (const exercise of workoutData.exercises) {
            try {
              const activityType = exercise.activityType;
              const met = metValues[activityType];
              
              if (!met) {
                console.error(`Unknown activity type: "${activityType}"`);
                continue;
              }
              
                              // Calculate calories for this exercise
                let exerciseCalories = 0;
                let totalDuration = 0;
                const userWeight = userProfile?.weight || 70; // Default to 70kg if no weight available
                
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
                
                // Rest time between sets
                const totalRestTime = (exercise.sets - 1) * (exercise.restPeriod || 60);
                
                // For calorie calculation, use total work time
                totalDuration = totalWorkTime;
                
                // Calories = (MET * weight * work_duration_in_hours)
                exerciseCalories = Math.round((adjustedMet * userWeight * totalDuration) / 3600);
                
                console.log(`Rep-based exercise: ${exercise.name} - ${exercise.sets} sets × ${exercise.reps} reps = ${totalWorkTime}s work + ${totalRestTime}s rest = ${totalDuration}s active time`);
              } else if (exercise.duration) {
                // Time-based exercise (cardio, yoga, etc.)
                totalDuration = exercise.duration;
                
                // Calories = (MET * weight * duration_in_hours)
                exerciseCalories = Math.round((met * userWeight * totalDuration) / 3600);
                
                console.log(`Time-based exercise: ${exercise.name} - ${totalDuration}s duration`);
              }
              
              // Create a virtual exercise object
              const virtualExercise = {
                id: `virtual-${Date.now()}-${Math.random()}`,
                activity: exercise.name,
                code: `VIRTUAL-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                met: met,
                description: exercise.description,
                category: 'Virtual Exercise',
                intensity: met < 3 ? 'LIGHT' : met < 6 ? 'MODERATE' : 'VIGOROUS',
                isActive: true
              };
              
              matchedExercises.push({
                ...exercise,
                exercise: virtualExercise,
                name: exercise.name,
                activityType: activityType,
                met: met,
                calories: exerciseCalories,
                sets: exercise.sets || null,
                reps: exercise.reps || null,
                duration: exercise.duration || null
              });
              
              console.log(`Created virtual exercise: ${exercise.name} (${activityType}, MET: ${met}, Calories: ${exerciseCalories})`);
            } catch (error) {
              console.error(`Failed to process exercise "${exercise.name}":`, error);
              // Continue with other exercises
            }
          }

          // Only create workout if we have at least one valid exercise
          if (matchedExercises.length === 0) {
            throw new Error('No valid exercises found for the workout. Please try again with different exercise terms.');
          }

          console.log(`Creating workout with ${matchedExercises.length} exercises`);
          
          // Calculate total calories from all exercises
          const totalCalories = matchedExercises.reduce((total, exercise) => total + (exercise.calories || 0), 0);
          
          // Create the workout in the database with virtual exercises first
          const workout = await prisma.workout.create({
            data: {
              userId: authInfo.userId,
              name: workoutData.name,
              description: workoutData.description,
              category: workoutData.category,
              difficulty: workoutData.difficulty,
              duration: workoutData.duration,
              totalCalories: totalCalories,
              targetMuscleGroups: JSON.stringify(workoutData.targetMuscleGroups || []),
              equipment: JSON.stringify(workoutData.equipment || []),
              instructions: JSON.stringify(workoutData.instructions || []),
              virtualExercises: JSON.stringify(matchedExercises), // Store virtual exercises
              isFavorite: false,
              isPublic: false,
              aiGenerated: true,
              originalQuery: args.keywords
            }
          });

          // Get user profile for image personalization
          const userProfileForImages = await prisma.profile.findUnique({
            where: { userId: authInfo.userId },
          });
          
          // Parse JSON strings if profile exists
          if (userProfileForImages) {
            try {
              if (userProfileForImages.dietaryPreferences) {
                userProfileForImages.dietaryPreferences = JSON.parse(userProfileForImages.dietaryPreferences);
              }
              if (userProfileForImages.privacySettings) {
                userProfileForImages.privacySettings = JSON.parse(userProfileForImages.privacySettings);
              }
            } catch (parseError) {
              console.error('Error parsing profile JSON fields in MCP:', parseError);
            }
          }

          // Generate images if requested
          let workoutPhotoUrl = null;
          let exerciseImages: any[] | null = null;
          
          if (args.generateImage) {
            try {
              console.log('Generating images for workout via MCP...');
              
              // Build personalized workout image prompt
              const baseWorkoutPrompt = workoutData.workoutImagePrompt || `A professional fitness photo showing a ${workoutData.difficulty.toLowerCase()} ${workoutData.category.toLowerCase()} workout. The image should show someone in athletic clothing performing exercises like ${matchedExercises.slice(0, 3).map((e: any) => e.name).join(', ')} in a well-lit gym or home setting. The person should be using proper form and the image should be suitable for fitness instruction.`;
              const workoutImagePrompt = buildPersonalizedWorkoutImagePrompt(baseWorkoutPrompt, userProfileForImages);
              
              const { generateImage } = await import('./services/ImageGenerationService');
              
              const workoutImageResult = await generateImage({
                prompt: workoutImagePrompt,
                textModel: 'gpt-4o-mini',
                quality: 'low',
                size: '1024x1536'
              });

              if (workoutImageResult.success) {
                workoutPhotoUrl = workoutImageResult.imageUrl;
                console.log('Workout image generated successfully via MCP');
                
                // Update workout with image URL
                await prisma.workout.update({
                  where: { id: workout.id },
                  data: { photoUrl: workoutPhotoUrl }
                });
              } else {
                console.error('Failed to generate workout image via MCP:', workoutImageResult.error);
              }
              
              // Generate exercise images in parallel
              console.log('Generating exercise images in parallel via MCP...');
              const exerciseImagePromises = matchedExercises.map(async (exercise: any, index: number) => {
                // Use AI-generated image prompt if available, otherwise fall back to template
                const baseExercisePrompt = exercise.imagePrompt || `A clear, instructional fitness photo showing how to perform ${exercise.name}. The image should show proper form and technique for this exercise. The person should be in athletic clothing and the image should be well-lit and suitable for fitness instruction. ${exercise.description || ''}`;
                const exerciseImagePrompt = buildPersonalizedExerciseImagePrompt(baseExercisePrompt, userProfileForImages);
                
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
                  console.error(`Error generating image for exercise ${exercise.name} via MCP:`, error);
                  return {
                    exerciseIndex: index,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                  };
                }
              });
              
              const exerciseImageResults = await Promise.all(exerciseImagePromises);
              exerciseImages = exerciseImageResults;
              
              console.log(`Generated ${exerciseImageResults.filter((r: any) => r.success).length} out of ${matchedExercises.length} exercise images via MCP`);
              
              // Update matched exercises with their images
              matchedExercises.forEach((exercise: any, index: number) => {
                const exerciseImage = exerciseImages ? exerciseImages.find((img: any) => img.exerciseIndex === index) : null;
                if (exerciseImage?.success) {
                  exercise.imageUrl = exerciseImage.imageUrl;
                }
              });
              
            } catch (error) {
              console.error('Error generating workout images via MCP:', error);
            }
          }

          return {
            type: 'WorkoutCard',
            props: {
              workout: {
                ...workout,
                targetMuscleGroups: workoutData.targetMuscleGroups || [],
                equipment: workoutData.equipment || [],
                instructions: workoutData.instructions || [],
                exercises: matchedExercises.map((exercise, index) => ({
                  ...exercise,
                  order: index + 1
                }))
              },
              generateImage: args.generateImage
            },
            quickReplies: [
              { label: 'Save this workout', value: 'I want to save this workout to my favorites' },
              { label: 'Modify the workout', value: 'I want to modify this workout' },
              { label: 'Generate another workout', value: 'I want to generate a different workout' },
            ],
          };
        } catch (error) {
          console.error('Error generating workout:', error);
          throw new Error('Failed to generate workout');
        }
      },
    });

    // Log biomarker tool
    this.registerTool({
      name: 'log_biomarker',
      description: 'Log a biomarker measurement',
      schema: z.object({
        metric: z.enum(['weight', 'blood_pressure', 'glucose', 'heart_rate', 'body_fat', 'muscle_mass']).describe('Type of biomarker'),
        value: z.number().describe('Measured value'),
        unit: z.string().describe('Unit of measurement'),
        notes: z.string().optional().describe('Additional notes'),
      }),
      handler: async (args, authInfo) => {
        try {
          const { BiomarkerService } = await import('./services/BiomarkerService');
          const biomarkerService = new BiomarkerService();
          
          // Log the biomarker
          const loggedBiomarker = await biomarkerService.logBiomarker({
            userId: authInfo.userId,
            type: args.metric,
            value: args.value,
            unit: args.unit,
            notes: args.notes
          });

          // Get recent history for trend analysis
          const recentBiomarkers = await biomarkerService.getBiomarkersByUser(
            authInfo.userId,
            args.metric,
            10 // Get last 10 measurements
          );

          // Calculate trend
          let trend = 'stable';
          if (recentBiomarkers.length >= 2) {
            const latest = recentBiomarkers[0].value;
            const previous = recentBiomarkers[1].value;
            trend = latest > previous ? 'up' : latest < previous ? 'down' : 'stable';
          }

          return {
            type: 'BiomarkerChart',
            props: {
              metric: args.metric,
              currentValue: args.value,
              unit: args.unit,
              trend: trend,
              data: recentBiomarkers.map(b => ({
                date: b.loggedAt.toISOString().split('T')[0],
                value: b.value,
                unit: b.unit
              })),
              targetRange: { min: args.value * 0.9, max: args.value * 1.1 }, // Simple range
            },
            quickReplies: [
              { label: 'Log another biomarker', value: 'I want to log another measurement' },
              { label: 'View trends', value: 'Show me my biomarker trends' },
              { label: 'Set target range', value: 'I want to set a target range for this metric' },
            ],
          };
        } catch (error) {
          console.error('Biomarker logging error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to log biomarker'
          };
        }
      },
    });

    // Create goal tool
    this.registerTool({
      name: 'create_goal',
      description: 'Create a new health or fitness goal',
      schema: z.object({
        title: z.string().describe('Goal title'),
        type: z.enum(['weight', 'fitness', 'nutrition', 'general']).describe('Type of goal'),
        target: z.string().describe('Target value or description'),
        deadline: z.string().optional().describe('Deadline for the goal'),
        description: z.string().optional().describe('Detailed description of the goal'),
      }),
      handler: async (args, authInfo) => {
        try {
          const { GoalService } = await import('./services/GoalService');
          const goalService = new GoalService();
          
          // Create the goal
          const createdGoal = await goalService.createGoal({
            userId: authInfo.userId,
            title: args.title,
            type: args.type,
            target: args.target,
            deadline: args.deadline ? new Date(args.deadline) : undefined,
            description: args.description
          });

          return {
            type: 'GoalBadge',
            props: {
              title: createdGoal.title,
              description: createdGoal.description,
              type: createdGoal.type,
              target: createdGoal.target,
              current: '0%',
              progress: 0,
              deadline: createdGoal.deadline,
              status: 'active',
            },
            quickReplies: [
              { label: 'Update progress', value: 'I want to update my goal progress' },
              { label: 'Create another goal', value: 'I want to set another goal' },
              { label: 'View all goals', value: 'Show me all my goals' },
            ],
          };
        } catch (error) {
          console.error('Goal creation error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create goal'
          };
        }
      },
    });

    // Generate grocery list tool
    this.registerTool({
      name: 'generate_grocery_list',
      description: 'Generate a grocery list from meal plans',
      schema: z.object({
        meal_plan_days: z.number().optional().describe('Number of days to plan for'),
        dietary_preferences: z.array(z.string()).optional().describe('Dietary preferences'),
        budget: z.number().optional().describe('Budget limit'),
      }).partial(),
      handler: async (args, authInfo) => {
        try {
          const { GroceryService } = await import('./services/GroceryService');
          const groceryService = new GroceryService();
          
          // Generate grocery list
          const groceryList = await groceryService.generateGroceryList({
            userId: authInfo.userId,
            days: args.meal_plan_days || 7,
            dietaryPreferences: args.dietary_preferences,
            budget: args.budget
          });

          return {
            type: 'GroceryListCard',
            props: {
              title: `${args.meal_plan_days || 7}-Day Grocery List`,
              items: groceryList.items || [],
              totalItems: groceryList.items?.length || 0,
              estimatedCost: groceryList.estimatedCost || '$0.00',
            },
            quickReplies: [
              { label: 'Add items', value: 'I want to add items to this list' },
              { label: 'Export list', value: 'I want to export this grocery list' },
              { label: 'Create meal plan', value: 'I want to create a meal plan first' },
            ],
          };
        } catch (error) {
          console.error('Grocery list generation error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate grocery list'
          };
        }
      },
    });

    // Generate recipe tool (two-step process)
    this.registerTool({
      name: 'generate_recipe_step1',
      description: 'Step 1: Generate initial recipe with ingredient names - this will be followed by ingredient search and refinement',
      schema: z.object({
        keywords: z.string().describe('Main ingredients or cuisine type'),
        meal_type: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'DESSERT']).describe('Type of meal (BREAKFAST, LUNCH, DINNER, SNACK, or DESSERT)'),
        servings: z.number().min(1).max(20).describe('Number of servings'),
        calorie_goal: z.number().optional().describe('Target calories per serving'),
        dietary_preferences: z.array(z.string()).optional().describe('Dietary preferences or restrictions'),
        difficulty: z.string().optional().describe('Difficulty level (easy, medium, hard)'),
        cuisine: z.string().optional().describe('Cuisine type'),
      }),
      handler: async (args, authInfo) => {
        // Get available ingredient categories for better search accuracy
        const { IngredientService } = await import('./services/IngredientService');
        const ingredientService = IngredientService.getInstance();
        const categories = await ingredientService.getCategories();
        
        const recipePrompt = `Generate a detailed recipe based on the following requirements:

Keywords: ${args.keywords}
Meal Type: ${args.meal_type} (must be one of: BREAKFAST, LUNCH, DINNER, SNACK, DESSERT)
Servings: ${args.servings}
${args.calorie_goal ? `Calorie Goal: ${args.calorie_goal} calories per serving` : ''}
${args.dietary_preferences?.length ? `Dietary Preferences: ${args.dietary_preferences.join(', ')}` : ''}
Difficulty: ${args.difficulty || 'medium'}
Cuisine: ${args.cuisine || 'general'}

AVAILABLE INGREDIENT CATEGORIES (use these for ingredient categorization):
${categories.join(', ')}

IMPORTANT REQUIREMENTS:
1. Meal type must be exactly one of: BREAKFAST, LUNCH, DINNER, SNACK, DESSERT
2. Servings must be EXACTLY ${args.servings} - do not change this number under any circumstances
3. Use SIMPLE, COMMON ingredient names that are likely to be found in a database
4. Provide amounts in grams (g) or milliliters (ml) for precise measurement
5. Include detailed step-by-step instructions
6. For each ingredient, specify the most appropriate category from the available list above
7. For each ingredient, provide a brief description explaining what it is and its culinary use

CATEGORY USAGE EXAMPLES:
- "salt" → category: "Spices and Herbs"
- "pepper" → category: "Spices and Herbs" 
- "beef" → category: "Proteins"
- "chicken" → category: "Proteins"
- "onions" → category: "Vegetables"
- "garlic" → category: "Vegetables"
- "flour" → category: "Grains and Flours"
- "milk" → category: "Beverages"
- "butter" → category: "Oils and Fats"
- "olive oil" → category: "Oils and Fats"
- "noodles" → category: "Breads and Grains"
- "dill" → category: "Spices and Herbs"

Generate a complete recipe in the following JSON format (ensure valid JSON with proper quotes, commas, and structure):

{
  "name": "Recipe Name",
  "description": "Brief description of the recipe",
  "mealType": "${args.meal_type}",
  "servings": ${args.servings},
  "prepTime": 15,
  "cookTime": 30,
  "totalTime": 45,
  "difficulty": "${args.difficulty || 'medium'}",
  "cuisine": "${args.cuisine || 'general'}",
  "tags": ["tag1", "tag2"],
  "ingredients": [
    {
      "name": "Ingredient Name",
      "amount": 100,
      "unit": "g",
      "category": "appropriate_category_from_list",
      "description": "Brief description of what this ingredient is and how it's used in cooking"
    }
  ],
  "instructions": [
    "Step 1: Detailed instruction",
    "Step 2: Detailed instruction"
  ]
}

CRITICAL: The "servings" field MUST be exactly ${args.servings}. Do not change this number.

IMPORTANT: For each ingredient, choose the most appropriate category from the available categories listed above. Use simple, common ingredient names that are likely to be found in a database. Provide helpful descriptions that explain what the ingredient is and its culinary purpose.

Timestamp: ${Date.now()}`;

        let llmResponse = await this.llmRouter.generateResponse({
          prompt: recipePrompt,
          maxTokens: 128000,
          userId: authInfo.userId,
          tool: 'generate_recipe_step1',
        });

        // Parse the LLM response to extract the recipe
        let recipe;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            // Try multiple strategies to extract JSON from the response
            console.log('Attempting to extract JSON from response...');
            console.log('Response length:', llmResponse.content.length);
            console.log('Response preview:', llmResponse.content.substring(0, 200));
            
            let jsonString = this.extractJsonFromResponse(llmResponse.content);
            
            if (jsonString) {
              console.log('Extracted JSON string length:', jsonString.length);
              console.log('JSON preview:', jsonString.substring(0, 200));
              
              // Clean up the JSON string with more robust parsing
              jsonString = this.cleanJsonString(jsonString);
              
              console.log('Cleaned JSON preview:', jsonString.substring(0, 200));
              
              recipe = JSON.parse(jsonString);
              console.log('Successfully parsed recipe:', recipe.name);
              break; // Success, exit the retry loop
            } else {
              throw new Error('No JSON found in response');
            }
          } catch (error) {
            console.error(`Failed to parse recipe JSON (attempt ${retryCount + 1}):`, error);
            console.error('Raw response:', llmResponse.content);
            
            if (retryCount < maxRetries) {
              // Retry with better instructions
              const retryPrompt = `Your previous response had malformed JSON. Here's an example of the correct format:

{
  "name": "Grilled Chicken Breast",
  "description": "Simple grilled chicken breast with herbs",
  "mealType": "DINNER",
  "servings": 2,
  "prepTime": 10,
  "cookTime": 20,
  "totalTime": 30,
  "difficulty": "easy",
  "cuisine": "american",
  "tags": ["chicken", "grilled", "healthy"],
  "ingredients": [
    {
      "name": "chicken breast",
      "amount": 400, // Numeric only, no units or text
      "unit": "g", // Only 'g' or 'ml' allowed
      "category": "Meat",
      "description": "Boneless chicken breast, commonly used for grilling and pan-frying"
    },
    {
      "name": "olive oil",
      "amount": 15, // Numeric only, no units or text
      "unit": "ml", // Only 'g' or 'ml' allowed
      "category": "Oils",
      "description": "Extra virgin olive oil used for cooking and flavoring"
    }
  ],
  "instructions": [
    "Season chicken with salt, pepper, and your choice of herbs (such as thyme or rosemary)",
    "Heat grill to medium-high heat.",
    "Grill chicken for 10 minutes per side, or until it reaches an internal temperature of 165°F (74°C)."
  ]
}

IMPORTANT: The 'amount' field must be a number only (no units, no text). The 'unit' field must be either 'g' or 'ml'. Do NOT include units or text in the 'amount' field. Only use 'g' or 'ml' for the 'unit' field. If the ingredient is a spice or seasoning, use 'g'.

Please generate a recipe for: ${args.keywords} (${args.meal_type}) with ${args.servings} servings.
Ensure your response is valid JSON with proper quotes, commas, and structure.
Timestamp: ${Date.now()}`;

              llmResponse = await this.llmRouter.generateResponse({
                prompt: retryPrompt,
                maxTokens: 128000,
                userId: authInfo.userId,
                tool: 'generate_recipe_step1',
              });
            }
            retryCount++;
          }
        }

        if (!recipe) {
          throw new Error('Failed to generate valid recipe JSON after multiple attempts');
        }

        console.log('Final recipe object:', JSON.stringify(recipe, null, 2));
        console.log('Recipe name:', recipe.name);
        console.log('Recipe ingredients:', recipe.ingredients);

        return {
          success: true,
          data: {
            step: 'initial_recipe',
            recipe: recipe,
            message: 'Initial recipe generated. Next step: ingredient search and refinement.'
          }
        };
      },
    });

    // Refine recipe tool (step 2)
    this.registerTool({
      name: 'refine_recipe_step2',
      description: 'Step 2: Refine recipe with proper ingredient names based on search results',
      schema: z.object({
        original_recipe: z.object({
          name: z.string(),
          description: z.string(),
          mealType: z.string(),
          servings: z.number(),
          prepTime: z.number(),
          cookTime: z.number(),
          totalTime: z.number(),
          difficulty: z.string(),
          cuisine: z.string(),
          tags: z.array(z.string()),
          ingredients: z.array(z.object({
            name: z.string(),
            amount: z.number().optional(),
            unit: z.string().optional(),
            category: z.string().optional(),
            description: z.string().optional()
          })),
          instructions: z.array(z.string())
        }).describe('The original recipe from step 1'),
        ingredient_search_results: z.array(z.object({
          original_name: z.string(),
          search_results: z.array(z.object({
            name: z.string(),
            calories: z.number(),
            protein: z.number(),
            carbs: z.number(),
            fat: z.number(),
            servingSize: z.string()
          }))
        })).describe('Search results for each ingredient'),
        user_profile: z.object({
          calorieTarget: z.number().optional(),
          dietaryPreferences: z.array(z.string()).optional(),
          healthMetrics: z.any().optional()
        }).describe('User profile information')
      }),
      handler: async (args, authInfo) => {
        const refinePrompt = `You have generated an initial recipe, and I have searched for each ingredient in our database. 
Now I need you to refine the recipe by choosing the most appropriate ingredients from the search results.

ORIGINAL RECIPE:
${JSON.stringify(args.original_recipe, null, 2)}

INGREDIENT SEARCH RESULTS:
${JSON.stringify(args.ingredient_search_results, null, 2)}

USER PROFILE:
${JSON.stringify(args.user_profile, null, 2)}

TASK: Refine the recipe by:
1. For each ingredient, choose the best match from the search results
2. If no good match is found, suggest a reasonable alternative or keep the original name
3. Adjust amounts if needed based on the serving sizes in the search results
4. Ensure the recipe meets the user's dietary preferences and calorie goals
5. Make any other improvements to the recipe

Please provide the refined recipe in the same JSON format as the original, but with updated ingredient names and amounts if needed.

IMPORTANT: Use the exact ingredient names from the search results when possible, as these will be used for accurate nutrition calculation.

Timestamp: ${Date.now()}`;

        let llmResponse = await this.llmRouter.generateResponse({
          prompt: refinePrompt,
          maxTokens: 128000,
          userId: authInfo.userId,
          tool: 'refine_recipe_step2',
        });

        // Parse the refined recipe (same logic as step 1)
        let refinedRecipe;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            let jsonString = this.extractJsonFromResponse(llmResponse.content);
            
            if (jsonString) {
              // Clean up the JSON string
              jsonString = this.cleanJsonString(jsonString);
              
              refinedRecipe = JSON.parse(jsonString);
              console.log('Successfully parsed refined recipe:', refinedRecipe.name);
              break;
            } else {
              throw new Error('No JSON found in response');
            }
          } catch (error) {
            console.error(`Failed to parse refined recipe JSON (attempt ${retryCount + 1}):`, error);
            
            if (retryCount < maxRetries) {
              const retryPrompt = `Your previous response had malformed JSON. Please provide the refined recipe in valid JSON format.

Original recipe: ${JSON.stringify(args.original_recipe, null, 2)}
Search results: ${JSON.stringify(args.ingredient_search_results, null, 2)}

Please provide the refined recipe as valid JSON.
Timestamp: ${Date.now()}`;

              llmResponse = await this.llmRouter.generateResponse({
                prompt: retryPrompt,
                maxTokens: 128000,
                userId: authInfo.userId,
                tool: 'refine_recipe_step2',
              });
            }
            retryCount++;
          }
        }

        if (!refinedRecipe) {
          throw new Error('Failed to generate valid refined recipe JSON after multiple attempts');
        }

        return {
          success: true,
          data: {
            step: 'refined_recipe',
            recipe: refinedRecipe,
            message: 'Recipe refined with proper ingredient names. Ready for nutrition calculation.'
          }
        };
      },
    });

    // Find ingredient alternative tool
    this.registerTool({
      name: 'find_ingredient_alternative',
      description: 'Find alternative ingredients based on dietary preferences or requirements',
      schema: z.object({
        ingredient_name: z.string().describe('Name of the ingredient to find alternatives for'),
        requirements: z.string().describe('Dietary requirements or preferences (e.g., vegan, gluten-free, low-sodium)'),
        recipe_context: z.string().optional().describe('Context of the recipe this ingredient is used in'),
      }),
      handler: async (args, authInfo) => {
        const alternativePrompt = `Find alternative ingredients for "${args.ingredient_name}" with the following requirements: ${args.requirements}
${args.recipe_context ? `Recipe context: ${args.recipe_context}` : ''}

Provide 3-5 alternative ingredients with:
1. Name of the alternative
2. Why it's a good substitute
3. Any adjustments needed (amount, cooking method, etc.)
4. Nutritional differences

Format the response as a JSON object with alternatives array.`;

        const llmResponse = await this.llmRouter.generateResponse({
          prompt: alternativePrompt,
          maxTokens: 128000,
          userId: authInfo.userId,
          tool: 'find_ingredient_alternative',
        });

        // Parse the LLM response to extract alternatives
        let alternatives;
        try {
          const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            alternatives = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (error) {
          console.error('Failed to parse alternatives JSON:', error);
          alternatives = {
            originalIngredient: args.ingredient_name,
            requirements: args.requirements,
            alternatives: [
              {
                name: 'Alternative not found',
                reason: 'Unable to generate alternatives at this time',
                adjustments: 'Please try again',
                nutrition: 'N/A'
              }
            ]
          };
        }

        return {
          type: 'IngredientAlternatives',
          props: {
            originalIngredient: args.ingredient_name,
            requirements: args.requirements,
            alternatives: alternatives.alternatives || [],
            message: `Found ${(alternatives.alternatives || []).length} alternatives for ${args.ingredient_name}`
          },
          quickReplies: [
            { label: 'Find more alternatives', value: `Find more alternatives for ${args.ingredient_name}` },
            { label: 'Generate recipe with alternative', value: `Generate a recipe using one of these alternatives` },
            { label: 'Search for different ingredient', value: 'I want to find alternatives for a different ingredient' },
          ],
        };
      },
    });

    // Raw ingredient search tool
    this.registerTool({
      name: 'search_ingredients',
      description: 'Search for ingredients in the database and return all matching results',
      schema: z.object({
        search_term: z.string().describe('Search term for ingredients'),
        category: z.string().optional().describe('Filter by ingredient category'),
        aisle: z.string().optional().describe('Filter by grocery aisle'),
        limit: z.number().min(1).max(1000).optional().default(100).describe('Maximum number of results to return'),
      }),
      handler: async (args, authInfo) => {
        try {
          const { IngredientService } = await import('./services/IngredientService');
          const ingredientService = IngredientService.getInstance();
          
          const results = await ingredientService.getIngredientsPaginated(
            1, // Start from page 1
            args.limit,
            false, // includeInactive
            args.search_term,
            args.category,
            args.aisle
          );

          return {
            success: true,
            data: {
              searchTerm: args.search_term,
              totalResults: results.pagination.totalCount,
              ingredients: results.ingredients.map(ingredient => ({
                id: ingredient.id,
                name: ingredient.name,
                description: ingredient.description,
                category: ingredient.category,
                aisle: ingredient.aisle,
                calories: ingredient.calories,
                protein: ingredient.protein,
                carbs: ingredient.carbs,
                fat: ingredient.fat,
                fiber: ingredient.fiber,
                sugar: ingredient.sugar,
                sodium: ingredient.sodium,
                servingSize: ingredient.servingSize,
                isActive: ingredient.isActive
              }))
            }
          };
        } catch (error) {
          console.error('Ingredient search error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to search ingredients'
          };
        }
      },
    });

    // AI ingredient search tool
    this.registerTool({
      name: 'ai_search_ingredients',
      description: 'Use AI to find the single best matching ingredient from search results',
      schema: z.object({
        search_term: z.string().describe('Search term for ingredients'),
        category: z.string().optional().describe('Filter by ingredient category'),
        aisle: z.string().optional().describe('Filter by grocery aisle'),
        description: z.string().optional().describe('Description of what the ingredient is and its culinary use'),
      }),
      handler: async (args, authInfo) => {
        try {
          // Call the AI search logic directly
          const { IngredientService } = await import('./services/IngredientService');
          const ingredientService = IngredientService.getInstance();
          
          // Get all matching ingredients first
          const searchResults = await ingredientService.getIngredientsPaginated(
            1, // Start from page 1
            1000, // Get a large number for AI analysis
            false, // includeInactive
            args.search_term,
            args.category,
            args.aisle
          );

          if (searchResults.ingredients.length === 0) {
            return {
              success: false,
              error: 'No ingredients found matching the search term'
            };
          }

          // Clear cache to prevent context pollution
          this.llmRouter.clearCache();

          // Limit to top 20 results for AI analysis to reduce context size
          const topResults = searchResults.ingredients.slice(0, 20);

          // Use the same high-quality prompt as the admin panel AI search
          const aiPrompt = `You are an expert at matching ingredient search terms to the most appropriate ingredient from a database.

SEARCH TERM: "${args.search_term}"

${args.description ? `INGREDIENT DESCRIPTION: "${args.description}"` : ''}

AVAILABLE INGREDIENTS (top 20 results from ${searchResults.ingredients.length} total):
${topResults.map((ingredient: any, index: number) => 
  `${index + 1}. ID: ${ingredient.id} - ${ingredient.name} (${ingredient.category || 'Unknown'}) - ${ingredient.description || 'No description'}`
).join('\n')}

TASK: Analyze the search term and the top 20 available ingredients. Return ONLY the single best matching ingredient as JSON.

CRITERIA for best match:
1. Exact name match (highest priority)
2. Contains all search words in any order
3. Most relevant category match
4. Closest semantic meaning
5. Most commonly used/recognizable ingredient

RESPONSE FORMAT: Return ONLY a JSON object with this exact structure:
{
  "bestMatch": {
    "id": "ingredient_id",
    "name": "ingredient_name",
    "description": "ingredient_description",
    "category": "ingredient_category",
    "aisle": "ingredient_aisle",
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "sodium": number
  },
  "reasoning": "Brief explanation of why this ingredient is the best match"
  }

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`;

          const llmResponse = await this.llmRouter.generateResponse({
            prompt: aiPrompt,
            userId: authInfo.userId,
            tool: 'ai_search_ingredients',
            maxTokens: 1000,
            temperature: 0.1 // Low temperature for more consistent results (same as admin panel)
          });

          // Parse the AI response (same robust approach as admin panel)
          let aiResult;
          try {
            // Extract JSON from the response (in case there's extra text)
            const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              aiResult = JSON.parse(jsonMatch[0]);
              console.log('Parsed AI result:', aiResult);
            } else {
              throw new Error('No JSON found in response');
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', llmResponse.content);
            return {
              success: false,
              error: 'Failed to parse AI response',
              content: llmResponse.content
            };
          }

          // Validate the AI response structure
          if (!aiResult.bestMatch || !aiResult.bestMatch.id) {
            console.error('Invalid AI response structure:', aiResult);
            return {
              success: false,
              error: 'Invalid AI response structure',
              result: aiResult
            };
          }

          console.log('AI selected ID:', aiResult.bestMatch.id);
          console.log('Available IDs:', searchResults.ingredients.map(i => i.id));

          // Find the actual ingredient data from the original list
          const bestMatch = searchResults.ingredients.find((ingredient: any) => 
            ingredient.id === aiResult.bestMatch.id
          );

          if (!bestMatch) {
            console.error('AI selected ingredient not found in original list');
            console.error('AI selected ID:', aiResult.bestMatch.id);
            console.error('Available ingredients:', searchResults.ingredients.map(i => ({ id: i.id, name: i.name })));
            
            // Fallback: try to find by name if ID doesn't match
            const fallbackMatch = searchResults.ingredients.find((ingredient: any) => 
              ingredient.name.toLowerCase() === aiResult.bestMatch.name.toLowerCase()
            );
            
            if (fallbackMatch) {
              console.log('Found fallback match by name:', fallbackMatch.name);
            return {
              success: true,
              data: {
                searchTerm: args.search_term,
                  bestMatch: fallbackMatch,
                  reasoning: aiResult.reasoning || 'AI selected this ingredient as the best match (found by name)',
                  totalCandidates: topResults.length,
                  totalFound: searchResults.ingredients.length,
                  provider: llmResponse.provider,
                  note: 'Matched by name due to ID mismatch'
                }
              };
            }
            
            return {
              success: false,
              error: 'AI selected ingredient not found in original list',
              selectedId: aiResult.bestMatch.id,
              selectedName: aiResult.bestMatch.name,
              availableIds: searchResults.ingredients.map(i => i.id).slice(0, 10)
            };
          }

          console.log('Successfully found matching ingredient:', bestMatch.name);

          return {
            success: true,
            data: {
              searchTerm: args.search_term,
              bestMatch: bestMatch,
              reasoning: aiResult.reasoning || 'AI selected this ingredient as the best match',
              totalCandidates: topResults.length,
              totalFound: searchResults.ingredients.length,
              provider: llmResponse.provider
            }
          };

        } catch (error) {
          console.error('AI ingredient search error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to perform AI ingredient search'
          };
        }
      },
    });

    // Raw exercise search tool
    this.registerTool({
      name: 'search_exercises',
      description: 'Search for exercises in the database and return all matching results',
      schema: z.object({
        search_term: z.string().describe('Search term for exercises'),
        category: z.string().optional().describe('Filter by exercise category'),
        intensity: z.string().optional().describe('Filter by exercise intensity'),
        met_range: z.object({
          min: z.number().optional(),
          max: z.number().optional()
        }).optional().describe('Filter by MET range'),
        limit: z.number().min(1).max(1000).optional().default(100).describe('Maximum number of results to return'),
      }),
      handler: async (args, authInfo) => {
        try {
          const { ExerciseService } = await import('./services/ExerciseService');
          const exerciseService = ExerciseService.getInstance();
          
          const results = await exerciseService.getExercisesPaginated(
            1, // Start from page 1
            args.limit,
            false, // includeInactive
            args.search_term,
            args.category,
            args.intensity,
            args.met_range
          );

          return {
            success: true,
            data: {
              searchTerm: args.search_term,
              totalResults: results.pagination.totalCount,
              exercises: results.exercises.map(exercise => ({
                id: exercise.id,
                activity: exercise.activity,
                description: exercise.description,
                category: exercise.category,
                intensity: exercise.intensity,
                met: exercise.met,
                code: exercise.code,
                isActive: exercise.isActive
              }))
            }
          };
        } catch (error) {
          console.error('Exercise search error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to search exercises'
          };
        }
      },
    });

    // AI exercise search tool
    this.registerTool({
      name: 'ai_search_exercises',
      description: 'Use AI to find the single best matching exercise from search results',
      schema: z.object({
        search_term: z.string().describe('Search term for exercises'),
        category: z.string().optional().describe('Filter by exercise category'),
        intensity: z.string().optional().describe('Filter by exercise intensity'),
        met_range: z.object({
          min: z.number().optional(),
          max: z.number().optional()
        }).optional().describe('Filter by MET range'),
      }),
      handler: async (args, authInfo) => {
        try {
          // Call the AI search logic directly
          const { ExerciseService } = await import('./services/ExerciseService');
          const exerciseService = ExerciseService.getInstance();
          
          // Get all matching exercises first
          const searchResults = await exerciseService.getExercisesPaginated(
            1, // Start from page 1
            1000, // Get a large number for AI analysis
            false, // includeInactive
            args.search_term,
            args.category,
            args.intensity,
            args.met_range
          );

          if (searchResults.exercises.length === 0) {
            return {
              success: false,
              error: 'No exercises found matching the search term'
            };
          }

          // Clear cache to prevent context pollution
          this.llmRouter.clearCache();

          // Limit to top 20 results for AI analysis to reduce context size
          const topResults = searchResults.exercises.slice(0, 20);

          // Use LLM to find the best match with minimal context
          const aiPrompt = `You are an expert at matching exercise names. Given the search term "${args.search_term}" and the following list of exercises, find the single best match.

Available exercises (top 20 results):
${topResults.map((ex, i) => `${i + 1}. ${ex.activity} (${ex.description || 'No description'}) - Category: ${ex.category}, Intensity: ${ex.intensity}, MET: ${ex.met}`).join('\n')}

Please analyze the search term and return the best matching exercise. Consider:
- Exact matches
- Common variations and synonyms
- Category relevance
- Intensity level
- Description relevance

Return your response as JSON with this exact format:
{
  "bestMatch": {
    "id": "exercise_id",
    "name": "exercise_name",
    "reasoning": "explanation of why this is the best match"
  }
}`;

          const llmResponse = await this.llmRouter.generateResponse({
            prompt: aiPrompt,
            userId: authInfo.userId,
            tool: 'ai_search_exercises',
          });

          // Parse the AI response
          const jsonString = this.extractJsonFromResponse(llmResponse.content);
          if (!jsonString) {
            throw new Error('Failed to extract JSON from AI response');
          }

          const aiResult = JSON.parse(jsonString);
          const bestMatch = searchResults.exercises.find(ex => ex.id === aiResult.bestMatch.id);

          if (!bestMatch) {
            // Fallback to first result if AI selection not found
            return {
              success: true,
              data: {
                searchTerm: args.search_term,
                bestMatch: searchResults.exercises[0],
                reasoning: 'Selected first available match as fallback',
                totalCandidates: searchResults.exercises.length,
                provider: 'fallback'
              }
            };
          }

          return {
            success: true,
            data: {
              searchTerm: args.search_term,
              bestMatch: bestMatch,
              reasoning: aiResult.bestMatch.reasoning,
              totalCandidates: searchResults.exercises.length,
              provider: 'ai_analysis'
            }
          };
        } catch (error) {
          console.error('AI exercise search error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to perform AI exercise search'
          };
        }
      },
    });
  }

  async handleToolCall(request: MCPRequest, authInfo: JWTPayload): Promise<MCPResponse> {
    try {
      // Ensure LLM Router is initialized before processing tool calls
      await this.ensureLLMInitialized();

      const tool = this.tools.get(request.tool);
      if (!tool) {
        return {
          success: false,
          error: `Unknown tool: ${request.tool}`,
        };
      }

      // Validate arguments
      const validatedArgs = tool.schema.parse(request.args);
      
      // Execute tool
      const result = await tool.handler(validatedArgs, authInfo);
      
      return {
        success: true,
        data: result,
        componentJson: result.type ? result : undefined,
      };
    } catch (error) {
      console.error('MCP tool call failed:', error);
      
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Invalid arguments: ${error.message}`,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Add method to handle natural language and route to appropriate tools
  async handleNaturalLanguage(message: string, authInfo: JWTPayload): Promise<MCPResponse> {
    try {
      await this.ensureLLMInitialized();

      // Get system prompt from database
      const systemPrompt = await this.systemMessageService.getMessageContent('mcp.natural_language_router');
      
      if (!systemPrompt) {
        throw new Error('System prompt not found in database');
      }

      // Replace placeholder with actual message
      const formattedPrompt = systemPrompt.replace('{message}', message);

      // Clear cache for natural language requests to prevent stale responses
      this.llmRouter.clearCache();
      
      const response = await this.llmRouter.generateResponse({
        prompt: formattedPrompt,
        userId: authInfo.userId,
        tool: 'natural_language_router',
      });

      // Try to parse the response as JSON to extract tool call
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.tool && parsed.args) {
            console.log('Parsed tool call:', parsed);
            // Call the appropriate tool
            return await this.handleToolCall(parsed, authInfo);
          }
        }
      } catch (parseError) {
        console.log('Could not parse tool call from response, treating as chat');
      }

      // Fallback to chat response
      return {
        success: true,
        data: {
          message: response.content,
          provider: response.provider,
        },
      };
    } catch (error) {
      console.error('Natural language handling failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getRegisteredTools(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolSchema(toolName: string): any {
    const tool = this.tools.get(toolName);
    return tool ? tool.schema : null;
  }
}

export async function withMcpAuth(
  handler: (request: MCPRequest, authInfo: JWTPayload) => Promise<MCPResponse>
) {
  return async (req: Request): Promise<Response> => {
    try {
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid authorization header' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.substring(7);
      const authInfo = AuthService.verifyAccessToken(token);
      const body = await req.json();
      const response = await handler(body, authInfo);
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('MCP auth error:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error instanceof Error ? error.message : 'Authentication failed' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
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

export default MCPHandler; 