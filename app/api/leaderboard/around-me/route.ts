import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardService } from '../../../../lib/services/LeaderboardService';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/auth';

const leaderboardService = new LeaderboardService();

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const radius = parseInt(searchParams.get('radius') || '5', 10);
    
    const aroundMe = await leaderboardService.getUsersAroundMe(req.user!.userId, radius);
    return NextResponse.json(aroundMe);
  } catch (error) {
    console.error('Leaderboard around-me GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users around me' },
      { status: 500 }
    );
  }
}); 