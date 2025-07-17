import { NextRequest, NextResponse } from 'next/server';
import { featureFlagService } from '@/lib/featureFlagService';
import { requireRole } from '@/lib/middleware/auth';
import { z } from 'zod';

// Validation schemas
const createFeatureFlagSchema = z.object({
  key: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100)
});

const updateFeatureFlagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().min(0).max(100).optional()
});

export const GET = requireRole('ADMIN')(async (req) => {
  try {
    const flags = await featureFlagService.getAllFeatureFlags();
    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = requireRole('ADMIN')(async (req) => {
  try {
    const body = await req.json();
    const validatedData = createFeatureFlagSchema.parse(body);

    const flag = await featureFlagService.upsertFeatureFlag(validatedData);
    
    return NextResponse.json({ flag }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating feature flag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 