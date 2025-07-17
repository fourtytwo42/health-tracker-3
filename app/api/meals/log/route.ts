import { NextRequest, NextResponse } from 'next/server';
import { MealService } from '../../../../lib/services/MealService';
import { authMiddleware } from ../../../../lib/middleware/auth';

const mealService = new MealService();

export async function POST(req: NextRequest) {
  try {
    // Apply auth middleware
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return NextResponse.json({ error:Unauthorized },{ status: 401;
    }

    const mealData = await req.json();

    // Validate required fields
    if (!mealData.name || !mealData.mealType || !mealData.ingredients) {
      return NextResponse.json(
     [object Object]error: 'name, mealType, and ingredients are required' },
        { status: 400}
      );
    }

    const meal = await mealService.logMeal(authResult.user.id, mealData);

    return NextResponse.json(meal);
  } catch (error) {
    console.error('Error logging meal:', error);
    return NextResponse.json(
    [object Object] error: 'Failed to log meal' },
    [object Object] status:500  );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Apply auth middleware
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return NextResponse.json({ error:Unauthorized },{ status: 401;
    }

    const { searchParams } = new URL(req.url);
    const daysBack = parseInt(searchParams.get(daysBack') ||30;

    const meals = await mealService.getMealHistory(authResult.user.id, daysBack);

    return NextResponse.json(meals);
  } catch (error) {
    console.error('Error fetching meal history:', error);
    return NextResponse.json(
    [object Object] error: 'Failed to fetch meal history' },
    [object Object] status:50 