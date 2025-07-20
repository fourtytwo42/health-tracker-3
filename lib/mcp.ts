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

  private generateRealisticMealPlan(args: { duration_days: number; calorie_target?: number; dietary_preferences?: string[]; goal?: string }) {
    const calorieTarget = args.calorie_target || 2000;
    const days = [];
    
    const breakfastRecipes = [
      {
        name: 'Greek Yogurt with Berries and Honey',
        calories: 350,
        protein: 25,
        carbs: 30,
        fat: 12,
        ingredients: [
          '1 cup Greek yogurt (non-fat)',
          '1/2 cup mixed berries (strawberries, blueberries, raspberries)',
          '1 tbsp honey',
          '2 tbsp granola',
          '1 tbsp chopped almonds'
        ],
        instructions: [
          'In a bowl, add 1 cup of Greek yogurt',
          'Top with fresh mixed berries',
          'Drizzle with honey',
          'Sprinkle granola and chopped almonds on top',
          'Serve immediately'
        ],
        prepTime: '5 minutes',
        cookTime: '0 minutes'
      },
      {
        name: 'Oatmeal with Banana and Cinnamon',
        calories: 400,
        protein: 15,
        carbs: 65,
        fat: 8,
        ingredients: [
          '1 cup rolled oats',
          '1 cup water',
          '1 cup milk (or almond milk)',
          '1 ripe banana, sliced',
          '1 tbsp honey',
          '1/2 tsp cinnamon',
          'Pinch of salt'
        ],
        instructions: [
          'In a medium saucepan, combine oats, water, milk, and salt',
          'Bring to a boil over medium heat, then reduce to low',
          'Simmer for 5 minutes, stirring occasionally',
          'Remove from heat and let stand for 2 minutes',
          'Top with sliced banana, honey, and cinnamon',
          'Serve hot'
        ],
        prepTime: '5 minutes',
        cookTime: '7 minutes'
      },
      {
        name: 'Scrambled Eggs with Whole Grain Toast',
        calories: 450,
        protein: 22,
        carbs: 35,
        fat: 18,
        ingredients: [
          '3 large eggs',
          '1 tbsp butter',
          '2 slices whole grain bread',
          '1/4 cup diced bell peppers',
          '1/4 cup diced onions',
          'Salt and pepper to taste',
          '1 tbsp fresh herbs (optional)'
        ],
        instructions: [
          'Toast the whole grain bread',
          'In a bowl, whisk eggs with salt and pepper',
          'Heat butter in a non-stick pan over medium heat',
          'Add diced peppers and onions, sauté for 2 minutes',
          'Pour in whisked eggs and cook, stirring gently',
          'Cook until eggs are set but still moist',
          'Serve eggs over toast and garnish with fresh herbs'
        ],
        prepTime: '5 minutes',
        cookTime: '8 minutes'
      }
    ];

    const lunchRecipes = [
      {
        name: 'Grilled Chicken Salad with Mixed Greens',
        calories: 550,
        protein: 35,
        carbs: 25,
        fat: 22,
        ingredients: [
          '4 oz chicken breast',
          '2 cups mixed greens (spinach, arugula, romaine)',
          '1/2 cup cherry tomatoes, halved',
          '1/4 cup cucumber, sliced',
          '1/4 cup red onion, thinly sliced',
          '2 tbsp olive oil',
          '1 tbsp balsamic vinegar',
          'Salt and pepper to taste'
        ],
        instructions: [
          'Season chicken breast with salt and pepper',
          'Grill chicken for 6-8 minutes per side until cooked through',
          'Let chicken rest for 5 minutes, then slice',
          'In a large bowl, combine mixed greens, tomatoes, cucumber, and onion',
          'Whisk together olive oil, balsamic vinegar, salt, and pepper',
          'Toss salad with dressing and top with sliced chicken',
          'Serve immediately'
        ],
        prepTime: '10 minutes',
        cookTime: '15 minutes'
      },
      {
        name: 'Quinoa Bowl with Roasted Vegetables',
        calories: 600,
        protein: 20,
        carbs: 70,
        fat: 18,
        ingredients: [
          '1/2 cup quinoa',
          '1 cup vegetable broth',
          '1 cup broccoli florets',
          '1 cup cauliflower florets',
          '1/2 cup chickpeas, drained',
          '2 tbsp olive oil',
          '1 tsp garlic powder',
          '1 tsp paprika',
          'Salt and pepper to taste',
          '2 tbsp tahini sauce'
        ],
        instructions: [
          'Rinse quinoa thoroughly and cook in vegetable broth for 15 minutes',
          'Preheat oven to 400°F (200°C)',
          'Toss broccoli, cauliflower, and chickpeas with olive oil and spices',
          'Roast vegetables for 20-25 minutes until tender',
          'Fluff quinoa with a fork and let cool slightly',
          'Assemble bowl with quinoa base, roasted vegetables, and tahini sauce',
          'Serve warm or at room temperature'
        ],
        prepTime: '15 minutes',
        cookTime: '25 minutes'
      }
    ];

    const dinnerRecipes = [
      {
        name: 'Baked Salmon with Roasted Vegetables',
        calories: 480,
        protein: 30,
        carbs: 25,
        fat: 20,
        ingredients: [
          '6 oz salmon fillet',
          '1 cup broccoli florets',
          '1 cup carrots, sliced',
          '2 tbsp olive oil',
          '1 lemon, sliced',
          '2 cloves garlic, minced',
          '1 tsp dried herbs (thyme, rosemary)',
          'Salt and pepper to taste'
        ],
        instructions: [
          'Preheat oven to 400°F (200°C)',
          'Line a baking sheet with parchment paper',
          'Place salmon in the center and arrange vegetables around it',
          'Drizzle with olive oil and season with garlic, herbs, salt, and pepper',
          'Place lemon slices on top of salmon',
          'Bake for 15-20 minutes until salmon flakes easily',
          'Serve hot with lemon wedges'
        ],
        prepTime: '10 minutes',
        cookTime: '20 minutes'
      },
      {
        name: 'Lean Beef Stir Fry with Brown Rice',
        calories: 520,
        protein: 35,
        carbs: 30,
        fat: 22,
        ingredients: [
          '4 oz lean beef, sliced thin',
          '1 cup brown rice, cooked',
          '1 cup mixed vegetables (bell peppers, broccoli, carrots)',
          '2 tbsp soy sauce',
          '1 tbsp sesame oil',
          '2 cloves garlic, minced',
          '1 tbsp ginger, minced',
          '1 tbsp cornstarch',
          '2 tbsp water'
        ],
        instructions: [
          'Cook brown rice according to package instructions',
          'Heat sesame oil in a wok or large skillet over high heat',
          'Add beef and stir-fry for 2-3 minutes until browned',
          'Add garlic and ginger, stir for 30 seconds',
          'Add vegetables and stir-fry for 3-4 minutes',
          'Mix cornstarch with water and soy sauce',
          'Pour sauce over stir fry and cook until thickened',
          'Serve over brown rice'
        ],
        prepTime: '15 minutes',
        cookTime: '15 minutes'
      }
    ];

    const snackRecipes = [
      {
        name: 'Apple with Almonds and Cinnamon',
        calories: 200,
        protein: 8,
        carbs: 25,
        fat: 12,
        ingredients: [
          '1 medium apple, sliced',
          '1/4 cup raw almonds',
          '1/2 tsp cinnamon',
          '1 tsp honey (optional)'
        ],
        instructions: [
          'Wash and slice apple into wedges',
          'Arrange apple slices on a plate',
          'Sprinkle with cinnamon',
          'Serve with almonds on the side',
          'Drizzle with honey if desired'
        ],
        prepTime: '5 minutes',
        cookTime: '0 minutes'
      },
      {
        name: 'Protein Smoothie Bowl',
        calories: 180,
        protein: 25,
        carbs: 15,
        fat: 3,
        ingredients: [
          '1 scoop vanilla protein powder',
          '1/2 cup frozen berries',
          '1/2 cup almond milk',
          '1 tbsp chia seeds',
          '1 tbsp granola',
          'Fresh berries for topping'
        ],
        instructions: [
          'Blend protein powder, frozen berries, and almond milk until smooth',
          'Pour into a bowl',
          'Top with chia seeds, granola, and fresh berries',
          'Serve immediately with a spoon'
        ],
        prepTime: '5 minutes',
        cookTime: '0 minutes'
      }
    ];

    for (let i = 0; i < args.duration_days; i++) {
      const breakfast = breakfastRecipes[i % breakfastRecipes.length];
      const lunch = lunchRecipes[i % lunchRecipes.length];
      const dinner = dinnerRecipes[i % dinnerRecipes.length];
      const snack = snackRecipes[i % snackRecipes.length];

      days.push({
        day: i + 1,
        meals: [
          { ...breakfast, mealType: 'BREAKFAST' },
          { ...lunch, mealType: 'LUNCH' },
          { ...dinner, mealType: 'DINNER' },
          { ...snack, mealType: 'SNACK' }
        ],
        totalCalories: breakfast.calories + lunch.calories + dinner.calories + snack.calories,
      });
    }

    return {
      days,
      totalCalories: days.reduce((sum, day) => sum + day.totalCalories, 0),
      metadata: {
        calorieTarget: calorieTarget,
        dietaryPreferences: args.dietary_preferences || [],
        goal: args.goal || 'maintenance',
        duration: args.duration_days
      }
    };
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
      description: 'Get current leaderboard standings',
      schema: z.object({
        type: z.enum(['global', 'around_me']).optional().default('global').describe('Type of leaderboard'),
        limit: z.number().min(1).max(100).optional().default(10).describe('Number of users to show'),
      }),
      handler: async (args, authInfo) => {
        const response = await this.llmRouter.generateResponse({
          prompt: `Show ${args.type} leaderboard with top ${args.limit} users. Include user rankings and points.`,
          userId: authInfo.userId,
          tool: 'get_leaderboard',
        });

        return {
          type: 'LeaderboardSnippet',
          props: {
            currentRank: Math.floor(Math.random() * 50) + 1, // Mock data
            totalPoints: Math.floor(Math.random() * 1000) + 100, // Mock data
            topUsers: [
              { username: 'admin', points: 1250 },
              { username: 'user', points: 850 },
              { username: 'fitness_guru', points: 720 },
              { username: 'health_nut', points: 680 },
            ],
          },
          quickReplies: [
            { label: 'View my stats', value: 'Show me my personal health stats' },
            { label: 'Set a goal', value: 'I want to set a new fitness goal' },
            { label: 'Log an activity', value: 'I want to log a workout' },
          ],
        };
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
        const response = await this.llmRouter.generateResponse({
          prompt: `Log ${args.metric}: ${args.value} ${args.unit}${args.notes ? ` - Notes: ${args.notes}` : ''}. Provide analysis and trend information.`,
          userId: authInfo.userId,
          tool: 'log_biomarker',
        });

        return {
          type: 'BiomarkerChart',
          props: {
            metric: args.metric,
            currentValue: args.value,
            unit: args.unit,
            trend: Math.random() > 0.5 ? 'up' : 'down',
            data: [
              { date: '2024-01-01', value: args.value - 2, unit: args.unit },
              { date: '2024-01-02', value: args.value - 1, unit: args.unit },
              { date: '2024-01-03', value: args.value, unit: args.unit },
            ],
            targetRange: { min: args.value - 5, max: args.value + 5 },
          },
          quickReplies: [
            { label: 'Log another biomarker', value: 'I want to log another measurement' },
            { label: 'View trends', value: 'Show me my biomarker trends' },
            { label: 'Set target range', value: 'I want to set a target range for this metric' },
          ],
        };
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
        const response = await this.llmRouter.generateResponse({
          prompt: `Create a ${args.type} goal: ${args.title} - Target: ${args.target}${args.deadline ? ` - Deadline: ${args.deadline}` : ''}${args.description ? ` - Description: ${args.description}` : ''}. Provide motivation and next steps.`,
          userId: authInfo.userId,
          tool: 'create_goal',
        });

        return {
          type: 'GoalBadge',
          props: {
            title: args.title,
            description: args.description,
            type: args.type,
            target: args.target,
            current: '0%',
            progress: 0,
            deadline: args.deadline,
            status: 'active',
          },
          quickReplies: [
            { label: 'Update progress', value: 'I want to update my goal progress' },
            { label: 'Create another goal', value: 'I want to set another goal' },
            { label: 'View all goals', value: 'Show me all my goals' },
          ],
        };
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
        // Get prompt from system messages
        let prompt = await this.systemMessageService.getMessageContent('prompts.grocery_list_generation');
        
        if (!prompt) {
          // Fallback to default prompt
          prompt = `Generate a grocery list for {meal_plan_days} days{preferences}{budget}. Group by aisle and include quantities.`;
        }

        // Replace placeholders with actual values
        const formattedPrompt = prompt
          .replace('{meal_plan_days}', (args.meal_plan_days || 7).toString())
          .replace('{preferences}', args.dietary_preferences ? ` considering: ${args.dietary_preferences.join(', ')}` : '')
          .replace('{budget}', args.budget ? ` with a budget of $${args.budget}` : '');

        const response = await this.llmRouter.generateResponse({
          prompt: formattedPrompt,
          userId: authInfo.userId,
          tool: 'generate_grocery_list',
        });

        return {
          type: 'GroceryListCard',
          props: {
            title: `${args.meal_plan_days || 7}-Day Grocery List`,
            items: [
              { name: 'Chicken Breast', quantity: '2 lbs', aisle: 'Meat' },
              { name: 'Brown Rice', quantity: '1 bag', aisle: 'Grains' },
              { name: 'Broccoli', quantity: '2 heads', aisle: 'Produce' },
              { name: 'Greek Yogurt', quantity: '32 oz', aisle: 'Dairy' },
              { name: 'Almonds', quantity: '1 bag', aisle: 'Nuts' },
            ],
            totalItems: 5,
            estimatedCost: '$45.00',
          },
          quickReplies: [
            { label: 'Add items', value: 'I want to add items to this list' },
            { label: 'Export list', value: 'I want to export this grocery list' },
            { label: 'Create meal plan', value: 'I want to create a meal plan first' },
          ],
        };
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
            let jsonString = null;
            
            console.log('Attempting to extract JSON from response...');
            console.log('Response length:', llmResponse.content.length);
            console.log('Response preview:', llmResponse.content.substring(0, 200));
            
            // Strategy 1: Look for JSON code blocks (```json ... ```)
            const codeBlockMatch = llmResponse.content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch) {
              console.log('Found JSON in code block');
              jsonString = codeBlockMatch[1];
            }
            
            // Strategy 2: Look for JSON object with better regex
            if (!jsonString) {
              const jsonMatch = llmResponse.content.match(/\{[\s\S]*?\}/);
              if (jsonMatch) {
                console.log('Found JSON with basic regex');
                jsonString = jsonMatch[0];
              }
            }
            
            // Strategy 3: Look for JSON after common prefixes
            if (!jsonString) {
              const afterPrefixMatch = llmResponse.content.match(/(?:Here is|Here's|Generated recipe|Recipe:)[\s\S]*?(\{[\s\S]*?\})/);
              if (afterPrefixMatch) {
                console.log('Found JSON after prefix');
                jsonString = afterPrefixMatch[1];
              }
            }
            
            // Strategy 4: Simple approach - find the first { and last }
            if (!jsonString) {
              const firstBrace = llmResponse.content.indexOf('{');
              const lastBrace = llmResponse.content.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                console.log('Found JSON with brace matching');
                jsonString = llmResponse.content.substring(firstBrace, lastBrace + 1);
              }
            }
            
            if (jsonString) {
              console.log('Extracted JSON string length:', jsonString.length);
              console.log('JSON preview:', jsonString.substring(0, 200));
              
              // Clean up the JSON string
              jsonString = jsonString
                // Remove any remaining text before the first {
                .replace(/^[^{]*/, '')
                // Remove any text after the last }
                .replace(/}[^}]*$/, '}')
                // Fix missing quotes around property names (only if they're missing)
                .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
                // Fix trailing commas
                .replace(/,(\s*[}\]])/g, '$1')
                // Fix null values
                .replace(/"null"/g, 'null')
                .replace(/null\s*,/g, 'null,')
                .replace(/null\s*}/g, 'null}');
              
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
            let jsonString = null;
            
            // Strategy 1: Look for JSON code blocks
            const codeBlockMatch = llmResponse.content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch) {
              jsonString = codeBlockMatch[1];
            }
            
            // Strategy 2: Look for JSON object
            if (!jsonString) {
              const jsonMatch = llmResponse.content.match(/\{[\s\S]*?\}/);
              if (jsonMatch) {
                jsonString = jsonMatch[0];
              }
            }
            
            // Strategy 3: Simple approach - find the first { and last }
            if (!jsonString) {
              const firstBrace = llmResponse.content.indexOf('{');
              const lastBrace = llmResponse.content.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonString = llmResponse.content.substring(firstBrace, lastBrace + 1);
              }
            }
            
            if (jsonString) {
              // Clean up the JSON string
              jsonString = jsonString
                .replace(/^[^{]*/, '')
                .replace(/}[^}]*$/, '}')
                .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
                .replace(/,(\s*[}\]])/g, '$1')
                .replace(/"null"/g, 'null')
                .replace(/null\s*,/g, 'null,')
                .replace(/null\s*}/g, 'null}');
              
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
        requirements: z.string().describe('Requirements for the alternative (e.g., "lower calorie", "gluten-free", "vegan")'),
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