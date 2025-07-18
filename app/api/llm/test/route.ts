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
      userId: 'admin-test',
      maxTokens: 50,
      temperature: 0.7
    };

    const response = await llmRouter.testProvider(provider, testRequest);
    
    return NextResponse.json({
      success: true,
      provider: response.provider,
      content: response.content,
      usage: response.usage
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