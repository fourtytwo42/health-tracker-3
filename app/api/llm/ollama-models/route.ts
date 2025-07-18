import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';

export const GET = requireRole('ADMIN')(async (req) => {
  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    
    const response = await fetch(`${ollamaUrl}/api/tags`);
    
    if (!response.ok) {
      throw new Error(`Ollama API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract model information
    const models = data.models?.map((model: any) => ({
      name: model.name,
      model: model.model,
      size: model.size,
      modified_at: model.modified_at,
      digest: model.digest
    })) || [];
    
    return NextResponse.json({ 
      success: true,
      models 
    });
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch models',
        models: []
      },
      { status: 500 }
    );
  }
}); 