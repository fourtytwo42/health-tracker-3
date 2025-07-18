import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { LLMRouter } from '@/lib/llmRouter';

export const GET = requireRole('ADMIN')(async (req) => {
  try {
    console.log('GET /api/llm/providers called');
    const llmRouter = LLMRouter.getInstance();
    console.log('LLMRouter instance obtained');
    
    const providerStats = llmRouter.getProviderStats();
    console.log('Provider stats obtained:', providerStats);
    
    // Convert to array format for easier frontend consumption
    const providers = Object.entries(providerStats).map(([key, provider]) => ({
      key,
      name: provider.name,
      endpoint: provider.endpoint,
      model: provider.model,
      isAvailable: provider.isAvailable,
      avgLatencyMs: provider.avgLatencyMs,
      pricing: provider.pricing,
    }));

    console.log('Returning providers array:', providers);
    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching LLM providers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 