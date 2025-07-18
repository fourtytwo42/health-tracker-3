import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { LLMRouter } from '@/lib/llmRouter';

export const PUT = requireRole('ADMIN')(async (req) => {
  try {
    const body = await req.json();
    const { model } = body;
    
    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Model name is required' },
        { status: 400 }
      );
    }
    
    const llmRouter = LLMRouter.getInstance();
    
    // Update the Ollama model
    const success = await llmRouter.updateProviderModel('Ollama', model);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update Ollama model' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Ollama model updated to: ${model}`
    });
  } catch (error) {
    console.error('Error updating Ollama model:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update model'
      },
      { status: 500 }
    );
  }
}); 