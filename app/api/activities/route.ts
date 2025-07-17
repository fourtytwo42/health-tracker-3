import { NextRequest, NextResponse } from 'next/server';
import { ActivityService } from '../../../lib/services/ActivityService';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/auth';

const activityService = new ActivityService();

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const daysBack = parseInt(searchParams.get('daysBack') || '30', 10);
    const activities = await activityService.getActivityHistory(req.user!.userId, daysBack);
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Activities GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const result = await activityService.logActivity(req.user!.userId, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Activities POST error:', error);
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}); 