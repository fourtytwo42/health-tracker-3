import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { LLMRouter } from '@/lib/llmRouter';

export const GET = requireRole('ADMIN')(async (req) => {
  try {
    const llmRouter = LLMRouter.getInstance();
    const providerStats = llmRouter.getProviderStats();
    
    // Convert to array format for easier frontend consumption
    const providers = Object.entries(providerStats).map(([key, provider]) => ({
      key,
      name: provider.name,
      endpoint: provider.endpoint,
      model: provider.model,
      isAvailable: provider.isAvailable,
      avgLatencyMs: provider.avgLatencyMs,
      costPer1k: provider.costPer1k,
    }));

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching LLM providers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 