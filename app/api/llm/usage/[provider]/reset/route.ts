import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { LLMUsageService } from '@/lib/services/LLMUsageService';

export const POST = requireRole('ADMIN')(async (req: any) => {
  const { params } = req;
  const { provider } = params;
  try {
    const usageService = LLMUsageService.getInstance();
    
    await usageService.resetUsageSummary(provider);
    
    return NextResponse.json({ 
      success: true, 
      message: `Usage statistics for ${provider} have been reset` 
    });
  } catch (error) {
    console.error('Error resetting LLM usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 