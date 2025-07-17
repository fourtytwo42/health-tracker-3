import { NextRequest, NextResponse } from 'next/server;
import { LeaderboardService } from '../../../../lib/services/LeaderboardService';
import { withAuth, AuthenticatedRequest } from ../../../../lib/middleware/auth';

const leaderboardService = new LeaderboardService();

async function handleGet(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ||100;

  // Get global leaderboard
  const leaderboard = await leaderboardService.getTop(limit);

  return NextResponse.json(leaderboard);
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    return await handleGet(req);
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    return NextResponse.json(
    [object Object] error: 'Failed to fetch leaderboard' },
    [object Object] status:500 }
    );
  }
}); 