import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoalService } from '../../../../lib/services/GoalService';
import { withAuth, AuthenticatedRequest } from ../../../../lib/middleware/auth';

const goalService = new GoalService();

// Zod schema for goal creation validation
const goalCreateSchema = z.object({
  title: z.string().min(1).max(100,
  description: z.string().max(500tional(),
  targetValue: z.number().min(0),
  currentValue: z.number().min(0).optional(),
  unit: z.string().min(1).max(20deadline: z.string().datetime().optional(),
  category: z.enum([WEIGHT', 'FITNESS', 'NUTRITION', HEALTH', 'OTHER']),
});

async function handlePost(req: AuthenticatedRequest) {
  const body = await req.json();
  
  // Validate request body
  const validatedData = goalCreateSchema.parse(body);
  
  // Create goal using the service
  const goal = await goalService.createGoal(
    req.user!.id,
    validatedData
  );

  return NextResponse.json(goal);
}

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    return await handlePost(req);
  } catch (error) {
    console.error('Error creating goal:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
[object Object]error: Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
    [object Object] error:Failed to create goal' },
    [object Object] status:500 }
    );
  }
}); 