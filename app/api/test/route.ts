import { NextRequest, NextResponse } from 'next/server';
import { MealService } from '../../../lib/services/MealService';
import { LeaderboardService } from '../../../lib/services/LeaderboardService';
import { UserService } from '../../../lib/services/UserService';

export async function GET(req: NextRequest) {
  try {
    const mealService = new MealService();
    const leaderboardService = new LeaderboardService();
    const userService = new UserService();

    // Test basic service instantiation
    const testResult = {
      message: 'Services are working!',
      timestamp: new Date().toISOString(),
      services: {
        mealService: mealService ? 'instantiated' : 'error',
        leaderboardService: leaderboardService ? 'instantiated' : 'error',
        userService: userService ? 'instantiated' : 'error',
      },
    };

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 