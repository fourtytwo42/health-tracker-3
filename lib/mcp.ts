import { z } from 'zod';
import { LLMRouter } from './llmRouter';
import { AuthService, JWTPayload } from './auth';
import { SystemMessageService } from './services/SystemMessageService';

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
        const recipePrompt = `Generate a detailed recipe based on the following requirements:

Keywords: ${args.keywords}
Meal Type: ${args.meal_type} (must be one of: BREAKFAST, LUNCH, DINNER, SNACK, DESSERT)
Servings: ${args.servings}
${args.calorie_goal ? `Calorie Goal: ${args.calorie_goal} calories per serving` : ''}
${args.dietary_preferences?.length ? `Dietary Preferences: ${args.dietary_preferences.join(', ')}` : ''}
Difficulty: ${args.difficulty || 'medium'}
Cuisine: ${args.cuisine || 'general'}

IMPORTANT REQUIREMENTS:
1. Meal type must be exactly one of: BREAKFAST, LUNCH, DINNER, SNACK, DESSERT
2. Use common, recognizable ingredient names (e.g., "chicken breast", "olive oil", "tomatoes")
3. Provide amounts in grams (g) or milliliters (ml) for precise measurement
4. Include detailed step-by-step instructions
5. Keep ingredient names simple and recognizable

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
      "unit": "g"
    }
  ],
  "instructions": [
    "Step 1: Detailed instruction",
    "Step 2: Detailed instruction"
  ]
}

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
      "amount": 400,
      "unit": "g"
    },
    {
      "name": "olive oil",
      "amount": 15,
      "unit": "ml"
    }
  ],
  "instructions": [
    "Season chicken with salt and pepper",
    "Heat grill to medium-high",
    "Grill chicken for 10 minutes per side"
  ]
}

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
            amount: z.number(),
            unit: z.string()
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

          // Use LLM to find the best match
          const aiPrompt = `You are an expert at matching ingredient names. Given the search term "${args.search_term}" and the following list of ingredients, find the single best match.

Available ingredients:
${searchResults.ingredients.map((ing, i) => `${i + 1}. ${ing.name} (${ing.description || 'No description'})`).join('\n')}

Please analyze the search term and return the best matching ingredient. Consider:
- Exact matches
- Common variations and synonyms
- Category relevance
- Description relevance

Return your response as JSON with this exact format:
{
  "bestMatch": {
    "id": "ingredient_id",
    "name": "ingredient_name",
    "reasoning": "explanation of why this is the best match"
  }
}`;

          const llmResponse = await this.llmRouter.generateResponse({
            prompt: aiPrompt,
            userId: authInfo.userId,
            tool: 'ai_search_ingredients',
          });

          // Parse the AI response
          const jsonString = this.extractJsonFromResponse(llmResponse.content);
          if (!jsonString) {
            throw new Error('Failed to extract JSON from AI response');
          }

          const aiResult = JSON.parse(jsonString);
          const bestMatch = searchResults.ingredients.find(ing => ing.id === aiResult.bestMatch.id);

          if (!bestMatch) {
            // Fallback to first result if AI selection not found
            return {
              success: true,
              data: {
                searchTerm: args.search_term,
                bestMatch: searchResults.ingredients[0],
                reasoning: 'Selected first available match as fallback',
                totalCandidates: searchResults.ingredients.length,
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
              totalCandidates: searchResults.ingredients.length,
              provider: 'ai_analysis'
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

          // Use LLM to find the best match
          const aiPrompt = `You are an expert at matching exercise names. Given the search term "${args.search_term}" and the following list of exercises, find the single best match.

Available exercises:
${searchResults.exercises.map((ex, i) => `${i + 1}. ${ex.activity} (${ex.description || 'No description'}) - Category: ${ex.category}, Intensity: ${ex.intensity}, MET: ${ex.met}`).join('\n')}

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

export default MCPHandler; 