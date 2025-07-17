import { NextResponse } from 'next/server';
import { featureFlagService } from '@/lib/featureFlagService';
import { requireRole } from '@/lib/middleware/auth';
import { z } from 'zod';

// Validation schema for LLM router config
const llmRouterConfigSchema = z.object({
  latencyWeight: z.number().min(0).max(1).optional(),
  costWeight: z.number().min(0).max(1).optional(),
  providers: z.record(z.object({
    enabled: z.boolean(),
    priority: z.number().min(1).max(10)
  })).optional()
});

export const GET = requireRole('ADMIN')(async (req) => {
  try {
    const config = await featureFlagService.getLLMRouterConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching LLM router config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = requireRole('ADMIN')(async (req) => {
  try {
    const body = await req.json();
    const validatedData = llmRouterConfigSchema.parse(body);

    await featureFlagService.updateLLMRouterConfig(validatedData);
    
    // Return updated config
    const config = await featureFlagService.getLLMRouterConfig();
    return NextResponse.json({ config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating LLM router config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 