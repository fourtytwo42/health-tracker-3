import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ActivityService } from '../../../../lib/services/ActivityService';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/auth';

const activityService = new ActivityService();

// Zod schema for activity logging validation
const activityLogSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'SPORTS', 'OTHER']),
  duration: z.number().min(1).max(480),
  intensity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  caloriesBurned: z.number().min(0).max(200).optional(),
  notes: z.string().max(500).optional(),
});

async function handlePost(req: AuthenticatedRequest) {
  const body = await req.json();
  
  // Validate request body
  const validatedData = activityLogSchema.parse(body);
  
  // Log activity using the service
  const activity = await activityService.logActivity(
    req.user!.id,
    validatedData
  );

  return NextResponse.json(activity);
}

async function handleGet(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);
  const daysBack = parseInt(searchParams.get('daysBack') || '300');

  // Get user's activity history
  const activities = await activityService.getActivityHistory(req.user!.id, daysBack);

  return NextResponse.json(activities);
}

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    return await handlePost(req);
  } catch (error) {
    console.error('Error logging activity:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    return await handleGet(req);
  } catch (error) {
    console.error('Error fetching activity history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity history' },
      { status: 500 }
    );
  }
}); 