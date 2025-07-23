import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const systemMessages = [
  // Chat Messages
  {
    key: 'chat.welcome',
    title: 'Chat Welcome Message',
    content: "Hello! I'm your AI Health Companion. I can help you with meal planning, activity tracking, biomarker logging, and more. What would you like to do today?",
    category: 'chat',
    description: 'Welcome message shown when user first opens the chat'
  },
  {
    key: 'chat.loading',
    title: 'Chat Loading Message',
    content: '🤔 Thinking... (this may take a moment on first request)',
    category: 'chat',
    description: 'Message shown while AI is processing a request'
  },
  {
    key: 'chat.loading_retry',
    title: 'Chat Loading Retry Message',
    content: '🤔 Thinking... (attempt {retry} - model may be loading)',
    category: 'chat',
    description: 'Message shown during retry attempts'
  },
  {
    key: 'chat.error',
    title: 'Chat Error Message',
    content: 'Sorry, I encountered an error. Please try again.',
    category: 'chat',
    description: 'Generic error message for chat failures'
  },
  {
    key: 'chat.error_retry',
    title: 'Chat Error Retry Message',
    content: "I'm having trouble connecting right now. This might be due to the AI model loading. Please try again in a moment.",
    category: 'chat',
    description: 'Error message shown after multiple retry attempts'
  },

  // MCP System Prompts
  {
    key: 'mcp.natural_language_router',
    title: 'MCP Natural Language Router',
    content: `You are an AI Health Companion. Your job is to analyze user messages and determine which tool to use.

Available tools:
- generate_meal_plan: For creating meal plans, weekly menus, diet plans with detailed recipes
- log_meal: For logging food intake, meals eaten, nutrition tracking
- get_leaderboard: For showing rankings, points, progress, competition
- log_biomarker: For tracking health metrics like weight, blood pressure, glucose, etc.
- create_goal: For setting fitness goals, health objectives, targets
- generate_grocery_list: For creating shopping lists, grocery planning

User message: "{message}"

Based on the user's message, respond with ONLY a JSON object containing the tool name and arguments:

Examples:
- "create a week long meal plan" → {"tool": "generate_meal_plan", "args": {"duration_days": 7}}
- "make a meal plan for this week" → {"tool": "generate_meal_plan", "args": {"duration_days": 7}}
- "I want to create a meal plan for this week" → {"tool": "generate_meal_plan", "args": {"duration_days": 7}}
- "generate a meal plan" → {"tool": "generate_meal_plan", "args": {"duration_days": 7}}
- "I want the ai to generate the meal plan" → {"tool": "generate_meal_plan", "args": {"duration_days": 7}}
- "I ate a turkey sandwich for lunch" → {"tool": "log_meal", "args": {"name": "turkey sandwich", "meal_type": "LUNCH"}}
- "Show me my health progress and leaderboard" → {"tool": "get_leaderboard", "args": {"type": "global", "limit": 10}}
- "I want to log my weight as 150 pounds" → {"tool": "log_biomarker", "args": {"metric": "weight", "value": 150, "unit": "pounds"}}
- "I want to set a goal to lose 10 pounds" → {"tool": "create_goal", "args": {"title": "Lose 10 pounds", "type": "weight", "target": "Lose 10 pounds"}}
- "Create a grocery list for my meal plan" → {"tool": "generate_grocery_list", "args": {}}

For meal plan requests, always use the generate_meal_plan tool with appropriate duration_days. The tool will create detailed meal plans with recipes, ingredients, and cooking instructions.

Respond with ONLY the JSON, no other text or explanation.`,
    category: 'mcp',
    description: 'System prompt for routing natural language to MCP tools'
  },

  // Meal Plan Prompts
  {
    key: 'prompts.meal_plan_generation',
    title: 'Meal Plan Generation Prompt',
    content: `Generate a {durationDays}-day meal plan for a person with:
- Daily calorie target: {calorieTarget} calories
- Dietary preferences: {preferences}
- Include balanced macronutrients (protein, carbs, fats, fiber)
- Provide specific recipes with ingredients and instructions

For each day, create 4 meals (breakfast, lunch, dinner, snack) with complete recipes.

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
          "ingredients": [
            {
              "name": "Ingredient Name",
              "amount": 100, // Numeric only, no units or text
              "unit": "g", // Only 'g' or 'ml' allowed
              "category": "appropriate_category_from_list",
              "description": "Brief description of what this ingredient is and how it's used in cooking"
            }
          ],
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

IMPORTANT: The 'amount' field must be a number only (no units, no text). The 'unit' field must be either 'g' or 'ml'. Do NOT include units or text in the 'amount' field. Only use 'g' or 'ml' for the 'unit' field. If the ingredient is a spice or seasoning, use 'g'.

Make sure each recipe is realistic, healthy, and includes proper nutritional information.`,
    category: 'prompts',
    description: 'Prompt template for generating meal plans'
  },
  {
    key: 'prompts.meal_plan_simple',
    title: 'Simple Meal Plan Generation',
    content: `Generate a {durationDays}-day meal plan for {calorieTarget} calories per day with these preferences: {preferences}`,
    category: 'prompts',
    description: 'Simple meal plan generation prompt'
  },

  // Activity Plan Prompts
  {
    key: 'prompts.activity_plan_generation',
    title: 'Activity Plan Generation Prompt',
    content: `Generate a {span} activity plan for a user targeting {targetCalories} calories per day. 
Preferences: {preferences}
    
Return a JSON object with this structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "type": "CARDIO|STRENGTH|FLEXIBILITY|SPORTS|WALKING|RUNNING|CYCLING|SWIMMING|YOGA|PILATES|OTHER",
          "name": "Activity name",
          "duration": 30,
          "intensity": "LIGHT|MODERATE|VIGOROUS",
          "calories": 150,
          "description": "Brief description"
        }
      ],
      "totalCalories": 30
    }
  ]
}`,
    category: 'prompts',
    description: 'Prompt template for generating activity plans'
  },

  // Grocery List Prompts
  {
    key: 'prompts.grocery_list_generation',
    title: 'Grocery List Generation Prompt',
    content: `Generate a grocery list for {meal_plan_days} days{preferences}{budget}. Group by aisle and include quantities.`,
    category: 'prompts',
    description: 'Prompt template for generating grocery lists'
  },

  // Chat System Prompts
  {
    key: 'chat.system_context',
    title: 'Chat System Context',
    content: `You are an AI Health Companion, a helpful assistant focused on health, nutrition, fitness, and wellness. 

Your capabilities include:
- Creating personalized meal plans with detailed recipes
- Logging meals and tracking nutrition
- Generating grocery lists
- Setting and tracking health goals
- Monitoring biomarkers and health metrics
- Providing fitness and activity recommendations
- Showing progress and leaderboards

Always be encouraging, supportive, and provide evidence-based health advice. When users ask for meal plans, activities, or other health-related content, use the appropriate tools to generate detailed, personalized responses.

Be conversational and friendly, but always prioritize health and safety in your recommendations.`,
    category: 'chat',
    description: 'System context that defines the AI\'s role and behavior in chat'
  },

  // Tool-Specific Instructions
  {
    key: 'mcp.tool_instructions',
    title: 'MCP Tool Usage Instructions',
    content: `When using MCP tools, follow these guidelines:

1. **Meal Plans**: Always generate detailed, realistic recipes with ingredients, instructions, and nutritional information
2. **Grocery Lists**: Organize by aisle and include specific quantities
3. **Activity Plans**: Consider user fitness level and provide safe, progressive recommendations
4. **Biomarker Logging**: Validate input values and provide context for the data
5. **Goal Setting**: Create SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals

Always format tool responses as structured data when possible, and provide helpful summaries for users.`,
    category: 'mcp',
    description: 'General instructions for using MCP tools effectively'
  },

  // Quick Replies
  {
    key: 'quick_replies.welcome',
    title: 'Welcome Quick Replies',
    content: JSON.stringify([
      { label: 'Create a meal plan', value: 'I want to create a meal plan for this week' },
      { label: 'Log a meal', value: 'I want to log what I ate for lunch' },
      { label: 'Check my progress', value: 'Show me my health progress and leaderboard' },
      { label: 'Set a goal', value: 'I want to set a new fitness goal' }
    ]),
    category: 'quick_replies',
    description: 'Quick reply options for the welcome message'
  },
  {
    key: 'quick_replies.meal_plan',
    title: 'Meal Plan Quick Replies',
    content: JSON.stringify([
      { label: 'Add items', value: 'I want to add items to this list' },
      { label: 'Export list', value: 'I want to export this grocery list' },
      { label: 'Create meal plan', value: 'I want to create a meal plan first' }
    ]),
    category: 'quick_replies',
    description: 'Quick reply options for meal plan responses'
  },
  {
    key: 'quick_replies.grocery_list',
    title: 'Grocery List Quick Replies',
    content: JSON.stringify([
      { label: 'Add items', value: 'I want to add items to this list' },
      { label: 'Export list', value: 'I want to export this grocery list' },
      { label: 'Create meal plan', value: 'I want to create a meal plan first' }
    ]),
    category: 'quick_replies',
    description: 'Quick reply options for grocery list responses'
  },

  // Error Messages
  {
    key: 'errors.meal_plan_failed',
    title: 'Meal Plan Generation Failed',
    content: 'Sorry, I was unable to generate a meal plan. Please try again with different parameters.',
    category: 'errors',
    description: 'Error message when meal plan generation fails'
  },
  {
    key: 'errors.activity_plan_failed',
    title: 'Activity Plan Generation Failed',
    content: 'Sorry, I was unable to generate an activity plan. Please try again with different parameters.',
    category: 'errors',
    description: 'Error message when activity plan generation fails'
  },
  {
    key: 'errors.grocery_list_failed',
    title: 'Grocery List Generation Failed',
    content: 'Sorry, I was unable to generate a grocery list. Please try again.',
    category: 'errors',
    description: 'Error message when grocery list generation fails'
  },
  {
    key: 'errors.meal_log_failed',
    title: 'Meal Logging Failed',
    content: 'Sorry, I was unable to log your meal. Please try again with more details.',
    category: 'errors',
    description: 'Error message when meal logging fails'
  },
  {
    key: 'errors.biomarker_log_failed',
    title: 'Biomarker Logging Failed',
    content: 'Sorry, I was unable to log your biomarker. Please try again with valid values.',
    category: 'errors',
    description: 'Error message when biomarker logging fails'
  },
  {
    key: 'errors.goal_creation_failed',
    title: 'Goal Creation Failed',
    content: 'Sorry, I was unable to create your goal. Please try again with more details.',
    category: 'errors',
    description: 'Error message when goal creation fails'
  },
  {
    key: 'errors.leaderboard_failed',
    title: 'Leaderboard Fetch Failed',
    content: 'Sorry, I was unable to fetch the leaderboard. Please try again.',
    category: 'errors',
    description: 'Error message when leaderboard fetch fails'
  },

  // Success Messages
  {
    key: 'success.meal_plan_generated',
    title: 'Meal Plan Generated Success',
    content: "I've generated a meal plan for you!",
    category: 'success',
    description: 'Success message when meal plan is generated'
  },
  {
    key: 'success.meal_logged',
    title: 'Meal Logged Success',
    content: "Great! I've logged your meal.",
    category: 'success',
    description: 'Success message when meal is logged'
  },
  {
    key: 'success.activity_logged',
    title: 'Activity Logged Success',
    content: "Excellent! Your activity has been logged.",
    category: 'success',
    description: 'Success message when activity is logged'
  },
  {
    key: 'success.biomarker_logged',
    title: 'Biomarker Logged Success',
    content: "Perfect! Your biomarker has been recorded.",
    category: 'success',
    description: 'Success message when biomarker is logged'
  },
  {
    key: 'success.goal_set',
    title: 'Goal Set Success',
    content: "Goal set successfully! Let's work towards it together.",
    category: 'success',
    description: 'Success message when goal is set'
  },
  {
    key: 'success.grocery_list_generated',
    title: 'Grocery List Generated Success',
    content: "Here's your grocery list based on your meal plan.",
    category: 'success',
    description: 'Success message when grocery list is generated'
  },
  {
    key: 'success.report_generated',
    title: 'Report Generated Success',
    content: "Your health report is ready!",
    category: 'success',
    description: 'Success message when report is generated'
  }
];

async function main() {
  console.log('Seeding system messages...');

  for (const message of systemMessages) {
    try {
      await prisma.systemMessage.upsert({
        where: { key: message.key },
        update: {
          title: message.title,
          content: message.content,
          category: message.category,
          description: message.description,
          updatedAt: new Date()
        },
        create: message
      });
      console.log(`✓ Seeded system message: ${message.key}`);
    } catch (error) {
      console.error(`✗ Failed to seed system message ${message.key}:`, error);
    }
  }

  console.log('System messages seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding system messages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 