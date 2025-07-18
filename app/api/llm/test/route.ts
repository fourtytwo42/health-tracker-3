import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { LLMRouter } from '@/lib/llmRouter';

export const POST = requireRole('ADMIN')(async (req) => {
  try {
    const body = await req.json();
    const { provider, prompt } = body;

    if (!provider) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Provider parameter is required'
        },
        { status: 400 }
      );
    }

    const llmRouter = LLMRouter.getInstance();
    
    // Wait for providers to be initialized and probed
    await llmRouter.waitForInitialization();
    
    // Clear cache for test requests to ensure fresh responses
    llmRouter.clearCache();
    
    // Test the specific provider
    const testRequest = {
      prompt: prompt || 'Hello, this is a test message.',
      userId: 'cmd8gdmj3000085xcpqgbvyn9', // Use the actual admin user ID
      maxTokens: 50,
      temperature: 0.7
    };

    const response = await llmRouter.testProvider(provider, testRequest);
    
    // Calculate cost based on usage and provider pricing
    let cost = 0;
    if (response.usage && response.usage.totalTokens) {
      const providerStats = llmRouter.getProviderStats();
      const providerInfo = providerStats[provider];
      
      if (providerInfo && providerInfo.pricing) {
        const { pricing } = providerInfo;
        
        if (pricing.type === 'free') {
          cost = 0;
        } else if (pricing.type === 'flat') {
          cost = (response.usage.totalTokens / 1000) * (pricing.costPer1k || 0);
        } else if (pricing.type === 'input_output') {
          const promptTokens = response.usage.promptTokens || 0;
          const completionTokens = response.usage.completionTokens || 0;
          
          const inputCost = (promptTokens / 1000) * (pricing.inputCostPer1k || 0);
          const outputCost = (completionTokens / 1000) * (pricing.outputCostPer1k || 0);
          
          cost = inputCost + outputCost;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      provider: response.provider,
      content: response.content,
      usage: response.usage,
      cost: cost,
      timing: response.timing
    });
  } catch (error) {
    console.error('Error testing LLM provider:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}); 