import { z } from 'zod';
import { LLMRouter } from './llmRouter';
import { AuthService, JWTPayload } from './auth';

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

  private constructor() {
    this.llmRouter = LLMRouter.getInstance();
    this.registerDefaultTools();
  }

  private generateRealisticMealPlan(args: { duration_days: number; calorie_target?: number; dietary_preferences?: string[]; goal?: string }) {
    const calorieTarget = args.calorie_target || 2000;
    const days = [];
    
    const breakfastOptions = [
      { name: 'Breakfast: Greek Yogurt with Berries', calories: 350, protein: 25, carbs: 30, fat: 12 },
      { name: 'Breakfast: Oatmeal with Banana', calories: 400, protein: 15, carbs: 65, fat: 8 },
      { name: 'Breakfast: Eggs with Whole Grain Toast', calories: 450, protein: 22, carbs: 35, fat: 18 },
      { name: 'Breakfast: Smoothie Bowl', calories: 380, protein: 18, carbs: 45, fat: 10 },
      { name: 'Breakfast: Avocado Toast', calories: 420, protein: 12, carbs: 40, fat: 20 },
    ];

    const lunchOptions = [
      { name: 'Lunch: Grilled Chicken Salad', calories: 550, protein: 35, carbs: 25, fat: 22 },
      { name: 'Lunch: Quinoa Bowl', calories: 600, protein: 20, carbs: 70, fat: 18 },
      { name: 'Lunch: Turkey Sandwich', calories: 580, protein: 28, carbs: 55, fat: 20 },
      { name: 'Lunch: Salmon with Rice', calories: 620, protein: 32, carbs: 60, fat: 24 },
      { name: 'Lunch: Vegetarian Wrap', calories: 520, protein: 18, carbs: 65, fat: 16 },
    ];

    const dinnerOptions = [
      { name: 'Dinner: Baked Salmon with Vegetables', calories: 480, protein: 30, carbs: 25, fat: 20 },
      { name: 'Dinner: Lean Beef Stir Fry', calories: 520, protein: 35, carbs: 30, fat: 22 },
      { name: 'Dinner: Chicken Breast with Sweet Potato', calories: 450, protein: 40, carbs: 35, fat: 12 },
      { name: 'Dinner: Vegetarian Pasta', calories: 480, protein: 15, carbs: 70, fat: 14 },
      { name: 'Dinner: Fish Tacos', calories: 520, protein: 28, carbs: 45, fat: 20 },
    ];

    const snackOptions = [
      { name: 'Snack: Apple with Almonds', calories: 200, protein: 8, carbs: 25, fat: 12 },
      { name: 'Snack: Protein Shake', calories: 180, protein: 25, carbs: 15, fat: 3 },
      { name: 'Snack: Hummus with Carrots', calories: 150, protein: 6, carbs: 20, fat: 6 },
      { name: 'Snack: Greek Yogurt', calories: 120, protein: 15, carbs: 8, fat: 2 },
      { name: 'Snack: Mixed Nuts', calories: 160, protein: 6, carbs: 8, fat: 14 },
    ];

    for (let i = 0; i < args.duration_days; i++) {
      const breakfast = breakfastOptions[i % breakfastOptions.length];
      const lunch = lunchOptions[i % lunchOptions.length];
      const dinner = dinnerOptions[i % dinnerOptions.length];
      const snack = snackOptions[i % snackOptions.length];

      days.push({
        day: i + 1,
        meals: [breakfast, lunch, dinner, snack],
        totalCalories: breakfast.calories + lunch.calories + dinner.calories + snack.calories,
      });
    }

    return {
      days,
      totalCalories: days.reduce((sum, day) => sum + day.totalCalories, 0),
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
        // Generate realistic meal plan
        const mealPlan = this.generateRealisticMealPlan(args);
        
        const response = await this.llmRouter.generateResponse({
          prompt: `I've created a ${args.duration_days}-day meal plan${args.calorie_target ? ` with ${args.calorie_target} calories per day` : ''}${args.dietary_preferences ? ` considering: ${args.dietary_preferences.join(', ')}` : ''}${args.goal ? ` for ${args.goal}` : ''}. The plan includes ${mealPlan.days.length} days with balanced meals. Provide a brief summary of what this meal plan includes and tips for following it. Do not ask the user to share a meal plan - you are providing the meal plan.`,
          userId: authInfo.userId,
          tool: 'generate_meal_plan',
        });

        return {
          type: 'PlanSummary',
          props: {
            title: `${args.duration_days}-Day Meal Plan`,
            description: response.content || `A balanced ${args.duration_days}-day meal plan designed for your health goals.`,
            type: 'meal',
            duration: args.duration_days,
            status: 'active',
            days: mealPlan.days,
            totalCalories: mealPlan.totalCalories,
            avgCaloriesPerDay: Math.round(mealPlan.totalCalories / args.duration_days),
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
        const response = await this.llmRouter.generateResponse({
          prompt: `Generate a grocery list for ${args.meal_plan_days || 7} days${args.dietary_preferences ? ` considering: ${args.dietary_preferences.join(', ')}` : ''}${args.budget ? ` with a budget of $${args.budget}` : ''}. Group by aisle and include quantities.`,
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

      // Create a prompt that helps the AI understand what tools are available and extract proper arguments
      const systemPrompt = `You are an AI Health Companion. Your job is to analyze user messages and determine which tool to use.

Available tools:
- generate_meal_plan: For creating meal plans, weekly menus, diet plans
- log_meal: For logging food intake, meals eaten, nutrition tracking
- get_leaderboard: For showing rankings, points, progress, competition
- log_biomarker: For tracking health metrics like weight, blood pressure, glucose, etc.
- create_goal: For setting fitness goals, health objectives, targets
- generate_grocery_list: For creating shopping lists, grocery planning

User message: "${message}"

Based on the user's message, respond with ONLY a JSON object containing the tool name and arguments:

Examples:
- "create a week long meal plan" → {"tool": "generate_meal_plan", "args": {"duration_days": 7}}
- "make a meal plan for this week" → {"tool": "generate_meal_plan", "args": {"duration_days": 7}}
- "I ate a turkey sandwich for lunch" → {"tool": "log_meal", "args": {"name": "turkey sandwich", "meal_type": "LUNCH"}}
- "Show me my health progress and leaderboard" → {"tool": "get_leaderboard", "args": {"type": "global", "limit": 10}}
- "I want to log my weight as 150 pounds" → {"tool": "log_biomarker", "args": {"metric": "weight", "value": 150, "unit": "pounds"}}
- "I want to set a goal to lose 10 pounds" → {"tool": "create_goal", "args": {"title": "Lose 10 pounds", "type": "weight", "target": "Lose 10 pounds"}}
- "Create a grocery list for my meal plan" → {"tool": "generate_grocery_list", "args": {}}

Respond with ONLY the JSON, no other text or explanation.`;

              // Clear cache for natural language requests to prevent stale responses
        this.llmRouter.clearCache();
        
        const response = await this.llmRouter.generateResponse({
          prompt: systemPrompt,
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