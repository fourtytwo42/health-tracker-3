import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardService } from '../../../lib/services/LeaderboardService';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';

const leaderboardService = new LeaderboardService();

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    const leaderboard = await leaderboardService.getTopUsers(limit);
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}); 