import { NextRequest, NextResponse } from 'next/server';
import { SettingService } from '@/lib/services/SettingService';
import { LLMRouter } from '@/lib/llmRouter';
import { AuthService } from '@/lib/auth';

const settingService = SettingService.getInstance();

export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    const token = authHeader.substring(7);
    const authInfo = AuthService.verifyAccessToken(token);
    if (authInfo.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { endpoint } = body;
    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }
    await settingService.setOllamaEndpoint(endpoint);
    // Refresh LLMRouter
    await LLMRouter.getInstance().refreshProviders();
    return NextResponse.json({ success: true, endpoint });
  } catch (error) {
    console.error('Error updating Ollama endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to update Ollama endpoint' },
      { status: 500 }
    );
  }
} 