import QuickLRU from 'quick-lru';
import crypto from 'crypto';

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
  private readonly LATENCY_WEIGHT = 0.7;
  private readonly COST_WEIGHT = 0.3;

  private constructor() {
    this.cache = new QuickLRU({
      maxSize: 1000,
      maxAge: this.CACHE_TTL_MS,
    });
    
    this.initializeProviders();
  }

  static getInstance(): LLMRouter {
    if (!LLMRouter.instance) {
      LLMRouter.instance = new LLMRouter();
    }
    return LLMRouter.instance;
  }

  private initializeProviders(): void {
    // Ollama (Local)
    if (process.env.OLLAMA_BASE_URL) {
      this.providers.set('ollama', {
        name: 'Ollama',
        endpoint: process.env.OLLAMA_BASE_URL,
        apiKey: '',
        costPer1k: 0, // Free local model
        avgLatencyMs: 0,
        isAvailable: false,
        model: 'llama2',
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

    this.probeProviders();
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
        
        const response = await fetch(`${provider.endpoint}/api/tags`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response.ok;
      } else {
        // For other providers, just check if the endpoint is reachable
        return true; // Assume available if we have API key
      }
    } catch {
      return false;
    }
  }

  private selectProvider(): LLMProvider | null {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isAvailable);

    if (availableProviders.length === 0) {
      return null;
    }

    // Normalize latency and cost
    const maxLatency = Math.max(...availableProviders.map(p => p.avgLatencyMs));
    const maxCost = Math.max(...availableProviders.map(p => p.costPer1k));

    let bestProvider = availableProviders[0];
    let bestScore = Infinity;

    for (const provider of availableProviders) {
      const latencyNorm = maxLatency > 0 ? provider.avgLatencyMs / maxLatency : 0;
      const costNorm = maxCost > 0 ? provider.costPer1k / maxCost : 0;
      const score = this.LATENCY_WEIGHT * latencyNorm + this.COST_WEIGHT * costNorm;

      if (score < bestScore) {
        bestScore = score;
        bestProvider = provider;
      }
    }

    return bestProvider;
  }

  private generateCacheKey(request: LLMRequest): string {
    const keyData = {
      userId: request.userId,
      tool: request.tool || 'chat',
      args: request.args || {},
      prompt: request.prompt,
    };
    
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(keyData));
    return `${request.userId}|${request.tool || 'chat'}|${hash.digest('hex')}`;
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = this.cache.get(cacheKey);
    
    if (cachedResponse) {
      console.log('Cache hit for request:', cacheKey);
      return cachedResponse;
    }

    // Select best provider
    const provider = this.selectProvider();
    if (!provider) {
      throw new Error('No available LLM providers');
    }

    console.log(`Routing request to ${provider.name}`);

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
        const response = await this.callProvider(fallbackProvider, request);
        this.cache.set(cacheKey, response);
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
      throw new Error(`Ollama request failed: ${response.statusText}`);
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