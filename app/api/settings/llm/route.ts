import { NextRequest, NextResponse } from 'next/server';
import { SettingService } from '@/lib/services/SettingService';
import { AuthService } from '@/lib/auth';

const settingService = SettingService.getInstance();

export async function GET(request: NextRequest) {
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

    const settings = await settingService.getLLMSettings();
    
    return NextResponse.json({
      success: true,
      config: settings,
    });
  } catch (error) {
    console.error('Error getting LLM settings:', error);
    return NextResponse.json(
      { error: 'Failed to get LLM settings' },
      { status: 500 }
    );
  }
}

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
    const { selectedModel, selectedProvider, latencyWeight, costWeight, providers } = body;

    // Validate required fields
    if (!selectedModel || !selectedProvider) {
      return NextResponse.json(
        { error: 'selectedModel and selectedProvider are required' },
        { status: 400 }
      );
    }

    const settings = {
      selectedModel,
      selectedProvider,
      latencyWeight: latencyWeight || 0.7,
      costWeight: costWeight || 0.3,
      providers: providers || {
        ollama: { enabled: true, priority: 1 },
        groq: { enabled: true, priority: 2 },
        openai: { enabled: true, priority: 3 },
        anthropic: { enabled: true, priority: 4 },
        aws: { enabled: false, priority: 5 },
        azure: { enabled: false, priority: 6 },
      },
    };

    await settingService.setLLMSettings(settings);
    
    return NextResponse.json({
      success: true,
      message: 'LLM settings updated successfully',
      config: settings,
    });
  } catch (error) {
    console.error('Error updating LLM settings:', error);
    return NextResponse.json(
      { error: 'Failed to update LLM settings' },
      { status: 500 }
    );
  }
} 