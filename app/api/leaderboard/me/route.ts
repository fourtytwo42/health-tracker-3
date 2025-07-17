import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardService } from '../../../../lib/services/LeaderboardService';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/auth';

const leaderboardService = new LeaderboardService();

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userRank = await leaderboardService.getUserRank(req.user!.userId);
    return NextResponse.json(userRank);
  } catch (error) {
    console.error('Leaderboard me GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user rank' },
      { status: 500 }
    );
  }
}); 