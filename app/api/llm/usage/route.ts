import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { LLMUsageService } from '@/lib/services/LLMUsageService';

export const GET = requireRole('ADMIN')(async (req) => {
  try {
    const usageService = LLMUsageService.getInstance();
    const stats = await usageService.getTotalUsageStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching LLM usage stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 