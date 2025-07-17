import { NextResponse } from 'next/server';
import { featureFlagService } from '@/lib/featureFlagService';
import { withAuth } from '@/lib/middleware/auth';
import { z } from 'zod';

// Validation schema
const checkFeatureFlagSchema = z.object({
  userId: z.string().optional()
});

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const validatedData = checkFeatureFlagSchema.parse(body);
    
    // Extract key from URL
    const url = new URL(req.url);
    const key = url.pathname.split('/')[3]; // /api/feature-flags/[key]/check

    if (!key) {
      return NextResponse.json(
        { error: 'Feature flag key is required' },
        { status: 400 }
      );
    }

    const enabled = await featureFlagService.isFeatureEnabled(key, validatedData.userId);
    
    return NextResponse.json({ enabled });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error checking feature flag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 