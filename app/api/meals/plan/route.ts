import { NextRequest, NextResponse } from 'next/server';
import { MealService } from '../../../../lib/services/MealService';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/auth';

const mealService = new MealService();

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { durationDays, calorieTarget, dietaryPreferences, startDate } = body;
    
    const result = await mealService.generateMealPlan({
      userId: req.user!.userId,
      durationDays: durationDays || 7,
      calorieTarget,
      dietaryPreferences,
      startDate: startDate ? new Date(startDate) : undefined,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Meal plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const mealPlans = await mealService.getMealHistory(req.user!.userId, { limit: 10 });
    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error('Meal plans GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
      { status: 500 }
    );
  }
}); 