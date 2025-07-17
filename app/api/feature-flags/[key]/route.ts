import { NextResponse } from 'next/server';
import { featureFlagService } from '@/lib/featureFlagService';
import { requireRole } from '@/lib/middleware/auth';
import { z } from 'zod';

// Validation schema for updates
const updateFeatureFlagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().min(0).max(100).optional()
});

export const PUT = requireRole('ADMIN')(async (req) => {
  try {
    const body = await req.json();
    const validatedData = updateFeatureFlagSchema.parse(body);
    
    // Extract key from URL
    const url = new URL(req.url);
    const key = url.pathname.split('/').pop();

    if (!key) {
      return NextResponse.json(
        { error: 'Feature flag key is required' },
        { status: 400 }
      );
    }

    const flag = await featureFlagService.upsertFeatureFlag({
      key,
      name: validatedData.name || '',
      description: validatedData.description,
      enabled: validatedData.enabled ?? false,
      rolloutPercentage: validatedData.rolloutPercentage ?? 0
    });
    
    return NextResponse.json({ flag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating feature flag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = requireRole('ADMIN')(async (req) => {
  try {
    // Extract key from URL
    const url = new URL(req.url);
    const key = url.pathname.split('/').pop();

    if (!key) {
      return NextResponse.json(
        { error: 'Feature flag key is required' },
        { status: 400 }
      );
    }

    await featureFlagService.deleteFeatureFlag(key);
    
    return NextResponse.json({ message: 'Feature flag deleted successfully' });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 