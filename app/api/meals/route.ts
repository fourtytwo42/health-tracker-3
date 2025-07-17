import { NextRequest, NextResponse } from 'next/server';
import { MealService } from '../../../lib/services/MealService';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';

const mealService = new MealService();

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const mealType = searchParams.get('mealType');

    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      mealType: mealType || undefined,
      limit,
    };

    const meals = await mealService.getMealHistory(req.user!.userId, filters);
    return NextResponse.json(meals);
  } catch (error) {
    console.error('Meals GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const result = await mealService.logMeal({
      userId: req.user!.userId,
      ...body,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Meals POST error:', error);
    return NextResponse.json(
      { error: 'Failed to log meal' },
      { status: 500 }
    );
  }
}); 