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
    const configs = await settingService.getLLMProviderConfigs();
    const config = configs.find(c => c.key === provider);
    
    if (!config) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Get API key for the provider
    const apiKey = await settingService.getLLMProviderAPIKey(provider);
    
    if (config.apiKeyRequired && !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key required',
        models: [],
      });
    }

    let models: string[] = [];

    try {
      // Fetch models from the provider's API
      if (provider === 'ollama') {
        // Ollama uses a different endpoint structure
        const response = await fetch(`${config.endpoint}${config.modelsEndpoint}`);
        if (response.ok) {
          const data = await response.json();
          models = data.models?.map((model: any) => model.name) || [];
        }
      } else if (provider === 'groq') {
        // Groq uses OpenAI-compatible API
        const response = await fetch(config.modelsEndpoint, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data?.map((model: any) => model.id) || [];
        }
      } else if (provider === 'openai') {
        // OpenAI models endpoint
        const response = await fetch(config.modelsEndpoint, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data?.map((model: any) => model.id) || [];
        }
      } else if (provider === 'anthropic') {
        // Anthropic models endpoint
        const response = await fetch(config.modelsEndpoint, {
          headers: {
            'x-api-key': apiKey!,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data?.map((model: any) => model.id) || [];
        }
      } else if (provider === 'aws') {
        // AWS Bedrock models endpoint
        const response = await fetch(config.modelsEndpoint, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.modelSummaries?.map((model: any) => model.modelId) || [];
        }
      } else if (provider === 'azure') {
        // Azure OpenAI deployments endpoint
        const response = await fetch(config.modelsEndpoint, {
          headers: {
            'api-key': apiKey!,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data?.map((deployment: any) => deployment.id) || [];
        }
      }

      // Cache the models in the database
      if (models.length > 0) {
        await settingService.setLLMProviderModels(provider, models);
      }

      return NextResponse.json({
        success: true,
        models,
        provider: config.name,
      });
    } catch (error) {
      console.error(`Error fetching models for ${provider}:`, error);
      
      // Return cached models if available
      const cachedModels = await settingService.getLLMProviderModels(provider);
      if (cachedModels.length > 0) {
        return NextResponse.json({
          success: true,
          models: cachedModels,
          provider: config.name,
          cached: true,
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to fetch models',
        models: [],
      });
    }
  } catch (error) {
    console.error('Error getting models:', error);
    return NextResponse.json(
      { error: 'Failed to get models' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { model } = body;

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    // Store the model for this specific provider
    await settingService.setLLMProviderModel(provider, model);
    
    return NextResponse.json({
      success: true,
      message: `Model updated to ${model} for ${provider}`,
    });
  } catch (error) {
    console.error('Error updating model:', error);
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    );
  }
} 