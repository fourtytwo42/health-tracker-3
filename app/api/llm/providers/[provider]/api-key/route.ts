import { NextRequest, NextResponse } from 'next/server';
import { SettingService } from '@/lib/services/SettingService';
import { AuthService } from '@/lib/auth';

const settingService = SettingService.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
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

    const { provider } = params;
    const apiKey = await settingService.getLLMProviderAPIKey(provider);
    
    return NextResponse.json({
      success: true,
      hasApiKey: !!apiKey,
      maskedApiKey: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : null,
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    return NextResponse.json(
      { error: 'Failed to get API key' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
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

    const { provider } = params;
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    await settingService.setLLMProviderAPIKey(provider, apiKey);
    
    // Refresh LLM providers to pick up the new API key
    try {
      const { LLMRouter } = await import('@/lib/llmRouter');
      const llmRouter = LLMRouter.getInstance();
      await llmRouter.refreshProviders();
    } catch (error) {
      console.error('Failed to refresh LLM providers:', error);
      // Don't fail the request if refresh fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'API key updated successfully',
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
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

    const { provider } = params;
    await settingService.setLLMProviderAPIKey(provider, '');
    
    return NextResponse.json({
      success: true,
      message: 'API key removed successfully',
    });
  } catch (error) {
    console.error('Error removing API key:', error);
    return NextResponse.json(
      { error: 'Failed to remove API key' },
      { status: 500 }
    );
  }
} 