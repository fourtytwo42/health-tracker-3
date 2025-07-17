import { BaseService } from './BaseService';
import { LLMRouter } from '../llmRouter';

export interface MealPlanRequest {
  userId: string;
  durationDays: number;
  calorieTarget?: number;
  dietaryPreferences?: string[];
  startDate?: Date;
}

export interface MealLogRequest {
  userId: string;
  name: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  photoUrl?: string;
  notes?: string;
}

export class MealService extends BaseService {
  private llmRouter: LLMRouter;

  constructor() {
    super();
    this.llmRouter = LLMRouter.getInstance();
  }

  async generateMealPlan(request: MealPlanRequest): Promise<any> {
    this.validateUserId(request.userId);

    try {
      // Get user profile for personalization
      const profile = await this.prisma.profile.findUnique({
        where: { userId: request.userId },
      });

      const calorieTarget = request.calorieTarget || profile?.calorieTarget || 2000;
      const preferences = request.dietaryPreferences || profile?.dietaryPreferences as string[] || [];

      // Generate meal plan using LLM
      const prompt = `Generate a ${request.durationDays}-day meal plan for a person with:
- Daily calorie target: ${calorieTarget} calories
- Dietary preferences: ${preferences.join(', ') || 'None'}
- Include balanced macronutrients (protein, carbs, fats, fiber)
- Provide specific recipes with ingredients and instructions
- Format as structured JSON with daily meal breakdowns`;

      const llmResponse = await this.llmRouter.generateResponse({
        prompt,
        userId: request.userId,
        tool: 'generate_meal_plan',
        args: request,
      });

      // Parse and structure the plan
      const planData = this.parseMealPlan(llmResponse.content);

      // Save meal plan to database
      const mealPlan = await this.prisma.mealPlan.create({
        data: {
          userId: request.userId,
          title: `${request.durationDays}-Day Meal Plan`,
          description: `Personalized meal plan targeting ${calorieTarget} calories/day`,
          startDate: request.startDate || new Date(),
          endDate: new Date(Date.now() + request.durationDays * 24 * 60 * 60 * 1000),
          planData,
          totalCalories: planData.totalCalories,
          totalProtein: planData.totalProtein,
          totalCarbs: planData.totalCarbs,
          totalFat: planData.totalFat,
          totalFiber: planData.totalFiber,
        },
      });

      // Award points for creating a meal plan
      await this.awardPoints(request.userId, 'meal_plan_created', 50);

      return {
        type: 'PlanSummary',
        props: {
          id: mealPlan.id,
          title: mealPlan.title,
          description: mealPlan.description,
          duration: request.durationDays,
          dailyCalories: Math.round(planData.totalCalories / request.durationDays),
          meals: planData.days || [],
        },
      };
    } catch (error) {
      this.handleError(error, 'Meal plan generation');
    }
  }

  async logMeal(request: MealLogRequest): Promise<any> {
    this.validateUserId(request.userId);

    try {
      // Calculate nutrition info if not provided
      let nutritionInfo = request.nutritionInfo;
      if (!nutritionInfo) {
        nutritionInfo = await this.calculateNutrition(request.ingredients);
      }

      // Save meal to database
      const meal = await this.prisma.meal.create({
        data: {
          userId: request.userId,
          name: request.name,
          mealType: request.mealType,
          ingredients: request.ingredients,
          nutritionInfo,
          photoUrl: request.photoUrl,
          notes: request.notes,
          loggedAt: new Date(),
        },
      });

      // Award points for logging a meal
      await this.awardPoints(request.userId, 'meal_logged', 10);

      // Invalidate meal-related cache
      this.invalidateCache(`meals_${request.userId}`);

      return {
        type: 'MealCard',
        props: {
          id: meal.id,
          name: meal.name,
          mealType: meal.mealType,
          calories: nutritionInfo.calories,
          protein: nutritionInfo.protein,
          carbs: nutritionInfo.carbs,
          fat: nutritionInfo.fat,
          fiber: nutritionInfo.fiber,
          ingredients: request.ingredients,
          loggedAt: meal.loggedAt,
          photoUrl: meal.photoUrl,
        },
      };
    } catch (error) {
      this.handleError(error, 'Meal logging');
    }
  }

  async getMealHistory(userId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    mealType?: string;
    limit?: number;
  }): Promise<any[]> {
    this.validateUserId(userId);

    const cacheKey = `meals_${userId}_${JSON.stringify(filters)}`;
    return this.getCached(cacheKey, async () => {
      const meals = await this.prisma.meal.findMany({
        where: {
          userId,
          ...(filters?.startDate && { loggedAt: { gte: filters.startDate } }),
          ...(filters?.endDate && { loggedAt: { lte: filters.endDate } }),
          ...(filters?.mealType && { mealType: filters.mealType as any }),
        },
        orderBy: { loggedAt: 'desc' },
        take: filters?.limit || 50,
      });

      return meals;
    });
  }

  async getMealById(mealId: string, userId: string): Promise<any> {
    this.validateUserId(userId);

    const meal = await this.prisma.meal.findFirst({
      where: { id: mealId, userId },
    });

    if (!meal) {
      throw new Error('Meal not found');
    }

    return meal;
  }

  async updateMeal(mealId: string, userId: string, updates: Partial<MealLogRequest>): Promise<any> {
    this.validateUserId(userId);

    try {
      const meal = await this.prisma.meal.update({
        where: { id: mealId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      this.invalidateCache(`meals_${userId}`);
      return meal;
    } catch (error) {
      this.handleError(error, 'Meal update');
    }
  }

  async deleteMeal(mealId: string, userId: string): Promise<void> {
    this.validateUserId(userId);

    try {
      await this.prisma.meal.delete({
        where: { id: mealId },
      });

      this.invalidateCache(`meals_${userId}`);
    } catch (error) {
      this.handleError(error, 'Meal deletion');
    }
  }

  private parseMealPlan(llmContent: string): any {
    try {
      // Try to extract JSON from LLM response
      const jsonMatch = llmContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: create a basic structure
      return {
        days: [],
        totalCalories: 2000,
        totalProtein: 150,
        totalCarbs: 200,
        totalFat: 65,
        totalFiber: 25,
      };
    } catch (error) {
      console.error('Failed to parse meal plan:', error);
      return {
        days: [],
        totalCalories: 2000,
        totalProtein: 150,
        totalCarbs: 200,
        totalFat: 65,
        totalFiber: 25,
      };
    }
  }

  private async calculateNutrition(ingredients: Array<{ name: string; quantity: number; unit: string }>): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }> {
    // Simple nutrition calculation - in a real app, this would use a nutrition database
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    for (const ingredient of ingredients) {
      // Basic estimation - would be replaced with actual nutrition data lookup
      const estimatedCaloriesPerUnit = this.getEstimatedCalories(ingredient.name);
      const calories = estimatedCaloriesPerUnit * ingredient.quantity;
      
      totalCalories += calories;
      totalProtein += calories * 0.2; // Rough estimates
      totalCarbs += calories * 0.5;
      totalFat += calories * 0.3;
      totalFiber += calories * 0.05;
    }

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein / 4), // Convert from calories to grams
      carbs: Math.round(totalCarbs / 4),
      fat: Math.round(totalFat / 9),
      fiber: Math.round(totalFiber / 4),
    };
  }

  private getEstimatedCalories(ingredientName: string): number {
    // Basic calorie estimates per typical serving
    const calorieMap: Record<string, number> = {
      'chicken breast': 165,
      'salmon': 206,
      'rice': 130,
      'broccoli': 25,
      'spinach': 7,
      'avocado': 160,
      'eggs': 70,
      'oats': 150,
    };

    const lowerName = ingredientName.toLowerCase();
    for (const [key, calories] of Object.entries(calorieMap)) {
      if (lowerName.includes(key)) {
        return calories;
      }
    }

    // Default estimate
    return 100;
  }
}

export default MealService; 