import { BaseService } from './BaseService';
import { LLMRouter } from '../llmRouter';
import { prisma } from '../prisma';

export interface MealPlanData {
  days: Array<{
    date: string;
    meals: Array<{
      id: string;
      title: string;
      type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      nutritionInfo: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
      };
      ingredients: Array<{
        name: string;
        amount: string;
        aisle: string;
      }>;
      instructions: string[];
    }>;
    totalNutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
  }>;
}

export interface PlanPreferences {
  dietaryRestrictions?: string[];
  allergies?: string[];
  preferences?: string[];
  calorieTarget?: number;
  macroTargets?: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export class PlanService extends BaseService {
  async generateMealPlan(
    userId: string,
    durationDays: number,
    calorieTarget: number,
    preferences: PlanPreferences
  ) {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Call LLM to generate plan
    const llmRouter = LLMRouter.getInstance();
    const response = await llmRouter.generateResponse({
      prompt: `Generate a ${durationDays}-day meal plan for ${calorieTarget} calories per day with these preferences: ${JSON.stringify(preferences)}`,
      userId,
      tool: 'generate_meal_plan',
      args: { durationDays, calorieTarget, preferences },
    });

    // Parse the generated plan
    const planData: MealPlanData = JSON.parse(response.content || '{"days": []}');

    // Store the plan
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays - 1);
    
    const plan = await prisma.mealPlan.create({
      data: {
        userId,
        title: `${durationDays}-Day Meal Plan`,
        description: `Generated meal plan for ${calorieTarget} calories per day`,
        startDate,
        endDate,
        planData: planData as any,
        totalCalories: calorieTarget * durationDays,
        isActive: true,
      },
    });

    return plan;
  }

  async getMealPlan(planId: string) {
    return await prisma.mealPlan.findUnique({
      where: { id: planId },
    });
  }

  async getUserMealPlans(userId: string, limit = 10) {
    return await prisma.mealPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async updateMealPlan(planId: string, updates: Partial<MealPlanData>) {
    return await prisma.mealPlan.update({
      where: { id: planId },
      data: {
        planData: updates,
        updatedAt: new Date(),
      },
    });
  }

  async deleteMealPlan(planId: string) {
    return await prisma.mealPlan.delete({
      where: { id: planId },
    });
  }
} 