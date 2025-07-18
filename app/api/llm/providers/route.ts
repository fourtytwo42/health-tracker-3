import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { LLMRouter } from '@/lib/llmRouter';
import { LLMUsageService } from '@/lib/services/LLMUsageService';

export const GET = requireRole('ADMIN')(async (req) => {
  try {
    console.log('GET /api/llm/providers called');
    const llmRouter = LLMRouter.getInstance();
    console.log('LLMRouter instance obtained');
    
    // Wait for providers to be initialized and probed
    await llmRouter.waitForInitialization();
    console.log('LLM providers initialized and probed');
    
    const providerStats = llmRouter.getProviderStats();
    console.log('Provider stats obtained:', providerStats);
    
    // Get usage summaries for all providers
    const usageService = LLMUsageService.getInstance();
    const usageSummaries = await usageService.getAllUsageSummaries();
    const usageMap = new Map(usageSummaries.map((summary: any) => [summary.providerKey, summary]));

    // Convert to array format for easier frontend consumption
    const providers = Object.entries(providerStats).map(([key, provider]) => {
      const usage = usageMap.get(key);
      return {
        key,
        name: provider.name,
        endpoint: provider.endpoint,
        model: provider.model,
        isAvailable: provider.isAvailable,
        avgLatencyMs: provider.avgLatencyMs,
        pricing: provider.pricing,
        usage: usage ? {
          totalTokens: (usage as any).totalTokens,
          totalCost: (usage as any).totalCost,
          requestCount: (usage as any).requestCount,
          lastResetAt: (usage as any).lastResetAt,
        } : null,
      };
    });

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