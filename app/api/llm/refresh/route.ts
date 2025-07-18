import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { LLMRouter } from '@/lib/llmRouter';

export const POST = requireRole('ADMIN')(async (req) => {
  try {
    const llmRouter = LLMRouter.getInstance();
    await llmRouter.refreshProviders();
    
    return NextResponse.json({ 
      success: true, 
      message: 'LLM providers refreshed successfully' 
    });
  } catch (error) {
    console.error('Error refreshing LLM providers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 