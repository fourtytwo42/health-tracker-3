import QuickLRU from 'quick-lru';
import crypto from 'crypto';
import { SettingService, LLMSettings } from './services/SettingService';

export interface LLMProvider {
  name: string;
  endpoint: string;
  apiKey: string;
  costPer1k: number;
  avgLatencyMs: number;
  isAvailable: boolean;
  model?: string;
}

export interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  userId: string;
  tool?: string;
  args?: any;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  toolCalls?: any[];
}

export class LLMRouter {
  private static instance: LLMRouter;
  private providers: Map<string, LLMProvider> = new Map();
  private cache: QuickLRU<string, LLMResponse>;
  private readonly CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
  private settingService: SettingService;
  private settings: LLMSettings | null = null;

  private constructor() {
    this.cache = new QuickLRU({
      maxSize: 1000,
      maxAge: this.CACHE_TTL_MS,
    });
    
    this.settingService = SettingService.getInstance();
    // Initialize providers asynchronously
    this.initializeProviders().catch(error => {
      console.error('Failed to initialize LLM providers:', error);
    });
  }

  static getInstance(): LLMRouter {
    if (!LLMRouter.instance) {
      LLMRouter.instance = new LLMRouter();
    }
    return LLMRouter.instance;
  }

  // Add method to refresh providers
  async refreshProviders(): Promise<void> {
    // Reload settings from database
    try {
      this.settings = await this.settingService.getLLMSettings();
      
      // Update provider models based on settings
      const ollamaProvider = this.providers.get('ollama');
      if (ollamaProvider && this.settings?.selectedProvider === 'ollama') {
        ollamaProvider.model = this.settings.selectedModel;
      }
    } catch (error) {
      console.error('Failed to refresh LLM settings:', error);
    }
    
    await this.probeProviders();
  }

  // Add method to update model for a specific provider
  async updateProviderModel(providerName: string, model: string): Promise<boolean> {
    const provider = Array.from(this.providers.values()).find(p => p.name === providerName);
    
    if (!provider) {
      return false;
    }
    
    // Check if model is actually changing
    const modelChanged = provider.model !== model;
    
    // Update the model
    provider.model = model;
    
    // For Ollama, verify the model exists
    if (providerName === 'Ollama') {
      try {
        const response = await fetch(`${provider.endpoint}/api/tags`);
        if (response.ok) {
          const data = await response.json();
          const modelExists = data.models?.some((m: any) => m.name === model);
          if (!modelExists) {
            console.error(`Model ${model} not found in Ollama`);
            return false;
          }
        }
      } catch (error) {
        console.error('Failed to verify Ollama model:', error);
        return false;
      }
    }
    
    // Clear cache if model changed to prevent stale responses
    if (modelChanged) {
      this.clearCache();
      console.log(`Cleared cache due to model change: ${providerName} -> ${model}`);
    }
    
    console.log(`Updated ${providerName} model to: ${model}`);
    return true;
  }

  // Add method to clear the cache
  clearCache(): void {
    this.cache.clear();
    console.log('LLM cache cleared');
  }

  private async ensureOllamaModelLoaded(provider: LLMProvider): Promise<void> {
    if (!provider.model) {
      throw new Error('No model specified for Ollama');
    }

    try {
      // Check if the model is already loaded by making a simple request
      const response = await fetch(`${provider.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
          prompt: 'test',
          stream: false,
        }),
      });

      if (!response.ok) {
        // If the model isn't loaded, it will return an error
        // We'll let the main request handle the actual loading
        console.log(`Ollama model ${provider.model} may need to be loaded`);
      }
    } catch (error) {
      // Model loading will happen on the first actual request
      console.log(`Ollama model ${provider.model} will be loaded on first request`);
    }
  }

  private async initializeProviders(): Promise<void> {
    // Load settings from database
    try {
      this.settings = await this.settingService.getLLMSettings();
    } catch (error) {
      console.error('Failed to load LLM settings:', error);
      this.settings = null;
    }

    // Ollama (Local)
    if (process.env.OLLAMA_BASE_URL) {
      this.providers.set('ollama', {
        name: 'Ollama',
        endpoint: process.env.OLLAMA_BASE_URL,
        apiKey: '',
        costPer1k: 0, // Free local model
        avgLatencyMs: 0,
        isAvailable: false,
        model: this.settings?.selectedModel || 'llama3.2:3b',
      });
    }

    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', {
        name: 'OpenAI',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: process.env.OPENAI_API_KEY,
        costPer1k: 0.002, // GPT-3.5-turbo pricing
        avgLatencyMs: 0,
        isAvailable: false,
        model: 'gpt-3.5-turbo',
      });
    }

    // Groq
    if (process.env.GROQ_API_KEY) {
      this.providers.set('groq', {
        name: 'Groq',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: process.env.GROQ_API_KEY,
        costPer1k: 0.0001, // Very low cost
        avgLatencyMs: 0,
        isAvailable: false,
        model: 'mixtral-8x7b-32768',
      });
    }

    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', {
        name: 'Anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        apiKey: process.env.ANTHROPIC_API_KEY,
        costPer1k: 0.008, // Claude pricing
        avgLatencyMs: 0,
        isAvailable: false,
        model: 'claude-3-sonnet-20240229',
      });
    }

    // Initialize providers asynchronously
    this.probeProviders().catch(error => {
      console.error('Failed to initialize LLM providers:', error);
    });
  }

  private async probeProviders(): Promise<void> {
    console.log('Probing LLM providers for availability and latency...');
    
    for (const [key, provider] of Array.from(this.providers.entries())) {
      try {
        const startTime = Date.now();
        const isAvailable = await this.healthCheck(provider);
        const latency = Date.now() - startTime;
        
        provider.isAvailable = isAvailable;
        provider.avgLatencyMs = latency;
        
        // For Ollama, verify the selected model exists, otherwise use first available
        if (provider.name === 'Ollama' && isAvailable) {
          try {
            const response = await fetch(`${provider.endpoint}/api/tags`);
            if (response.ok) {
              const data = await response.json();
              if (data.models && data.models.length > 0) {
                // Check if the selected model exists
                const selectedModel = this.settings?.selectedModel;
                const modelExists = data.models.some((m: any) => m.name === selectedModel);
                
                if (selectedModel && modelExists) {
                  provider.model = selectedModel;
                  console.log(`Ollama model set to selected model: ${provider.model}`);
                } else {
                  provider.model = data.models[0].name;
                  console.log(`Ollama model set to first available: ${provider.model} (selected model ${selectedModel} not found)`);
                }
              }
            }
          } catch (error) {
            console.error('Failed to get Ollama models:', error);
          }
        }
        
        console.log(`Provider ${provider.name}: ${isAvailable ? 'Available' : 'Unavailable'} (${latency}ms)`);
      } catch (error) {
        console.error(`Failed to probe provider ${provider.name}:`, error);
        provider.isAvailable = false;
      }
    }
  }

  private async healthCheck(provider: LLMProvider): Promise<boolean> {
    try {
      // Simple health check - attempt to get models or send minimal request
      if (provider.name === 'Ollama') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const response = await fetch(`${provider.endpoint}/api/tags`, {
            method: 'GET',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            // Check if we have at least one model available
            return data.models && data.models.length > 0;
          }
          return false;
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('Ollama health check failed:', error);
          return false;
        }
      } else {
        // For other providers, just check if the endpoint is reachable
        return true; // Assume available if we have API key
      }
    } catch (error) {
      console.error(`Health check failed for ${provider.name}:`, error);
      return false;
    }
  }

  private selectProvider(): LLMProvider | null {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isAvailable);

    if (availableProviders.length === 0) {
      return null;
    }

    // If we have a selected provider from settings, prioritize it
    if (this.settings?.selectedProvider) {
      const selectedProvider = availableProviders.find(p => 
        p.name.toLowerCase() === this.settings!.selectedProvider.toLowerCase()
      );
      if (selectedProvider) {
        return selectedProvider;
      }
    }

    // Fall back to scoring-based selection
    const maxLatency = Math.max(...availableProviders.map(p => p.avgLatencyMs));
    const maxCost = Math.max(...availableProviders.map(p => p.costPer1k));

    let bestProvider = availableProviders[0];
    let bestScore = Infinity;

    for (const provider of availableProviders) {
      const latencyNorm = maxLatency > 0 ? provider.avgLatencyMs / maxLatency : 0;
      const costNorm = maxCost > 0 ? provider.costPer1k / maxCost : 0;
      const latencyWeight = this.settings?.latencyWeight || 0.7;
      const costWeight = this.settings?.costWeight || 0.3;
      const score = latencyWeight * latencyNorm + costWeight * costNorm;

      if (score < bestScore) {
        bestScore = score;
        bestProvider = provider;
      }
    }

    return bestProvider;
  }

  private generateCacheKey(request: LLMRequest, provider?: LLMProvider): string {
    const keyData = {
      userId: request.userId,
      tool: request.tool || 'chat',
      args: request.args || {},
      prompt: request.prompt,
      // Include provider and model information in cache key
      provider: provider?.name || 'unknown',
      model: provider?.model || 'unknown',
    };
    
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(keyData));
    return `${request.userId}|${request.tool || 'chat'}|${provider?.name || 'unknown'}|${provider?.model || 'unknown'}|${hash.digest('hex')}`;
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    // Ensure providers are initialized
    if (this.providers.size === 0) {
      await this.initializeProviders();
    }
    
    // Select best provider first
    const provider = this.selectProvider();
    if (!provider) {
      throw new Error('No available LLM providers');
    }

    // Check cache with provider-specific key
    const cacheKey = this.generateCacheKey(request, provider);
    const cachedResponse = this.cache.get(cacheKey);
    
    if (cachedResponse) {
      console.log('Cache hit for request:', cacheKey);
      return cachedResponse;
    }

    console.log(`Routing request to ${provider.name}`);

    // For Ollama, ensure the model is loaded before making the request
    if (provider.name === 'Ollama') {
      await this.ensureOllamaModelLoaded(provider);
    }

    try {
      const response = await this.callProvider(provider, request);
      
      // Cache the response
      this.cache.set(cacheKey, response);
      
      return response;
    } catch (error) {
      // Mark provider as unavailable and retry with next best
      provider.isAvailable = false;
      console.error(`Provider ${provider.name} failed, marking as unavailable:`, error);
      
      const fallbackProvider = this.selectProvider();
      if (fallbackProvider) {
        console.log(`Retrying with fallback provider: ${fallbackProvider.name}`);
        const fallbackCacheKey = this.generateCacheKey(request, fallbackProvider);
        const response = await this.callProvider(fallbackProvider, request);
        this.cache.set(fallbackCacheKey, response);
        return response;
      }
      
      throw new Error('All LLM providers failed');
    }
  }

  private async callProvider(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    switch (provider.name) {
      case 'Ollama':
        return this.callOllama(provider, request);
      case 'OpenAI':
      case 'Groq':
        return this.callOpenAICompatible(provider, request);
      case 'Anthropic':
        return this.callAnthropic(provider, request);
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }
  }

  private async callOllama(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${provider.endpoint}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: provider.model,
            prompt: request.prompt,
            stream: false,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        return {
          content: data.response,
          provider: provider.name,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`Ollama attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (model might be loading)
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    throw lastError || new Error('Ollama request failed after all retries');
  }

  private async callOpenAICompatible(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`${provider.name} request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      provider: provider.name,
      usage: data.usage,
      toolCalls: data.choices[0].message.tool_calls,
    };
  }

  private async callAnthropic(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: request.maxTokens || 1000,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      provider: provider.name,
      usage: data.usage,
    };
  }

  getProviderStats(): Record<string, Omit<LLMProvider, 'apiKey'>> {
    const stats: Record<string, Omit<LLMProvider, 'apiKey'>> = {};
    
    for (const [key, provider] of Array.from(this.providers.entries())) {
      const { apiKey, ...providerWithoutKey } = provider;
      stats[key] = providerWithoutKey;
    }
    
    return stats;
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: 1000,
      hitRate: 0, // Would need to track hits/misses for accurate rate
    };
  }
}

export default LLMRouter; 