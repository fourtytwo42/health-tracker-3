import { NextRequest, NextResponse } from 'next/server';
import { MealService } from '../../../lib/services/MealService';

const mealService = new MealService();

export async function GET(req: NextRequest) {
  try {
    // Test meal service instantiation and basic functionality
    const testResult = [object Object]      message: Meal service test,
      timestamp: new Date().toISOString(),
      serviceStatus: 'instantiated',
      methods: [
       generateMealPlan',
  logMeal, 
        getMealHistory',
     getMealById,
    updateMeal,
        deleteMeal'
      ],
      // Test basic service methods
      testData: {
        hasPrisma: !!mealService[prisma'],
        hasCache: !!mealService['cache],      hasLlmRouter: !!mealService['llmRouter'],
      }
    };

    return NextResponse.json(testResult);
  } catch (error) {
    console.error(Mealservice test error:', error);
    return NextResponse.json(
      { error: Meal service test failed', details: error instanceof Error ? error.message : 'Unknown error' },
    [object Object] status:50 