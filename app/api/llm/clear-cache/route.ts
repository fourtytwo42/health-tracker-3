import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { LLMRouter } from '@/lib/llmRouter';

export const POST = requireRole('ADMIN')(async (req) => {
  try {
    const llmRouter = LLMRouter.getInstance();
    llmRouter.clearCache();
    
    return NextResponse.json({ 
      success: true,
      message: 'LLM cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing LLM cache:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cache'
      },
      { status: 500 }
    );
  }
}); 