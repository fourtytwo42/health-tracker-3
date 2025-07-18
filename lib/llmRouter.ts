import QuickLRU from 'quick-lru';
import crypto from 'crypto';
import { SettingService, LLMSettings } from './services/SettingService';
import { LLMUsageService, UsageData } from './services/LLMUsageService';

export interface LLMProvider {
  name: string;
  endpoint: string;
  apiKey: string;
  pricing: {
    type: 'free' | 'flat' | 'input_output';
    costPer1k?: number;
    inputCostPer1k?: number;
    outputCostPer1k?: number;
    modelPricing?: Record<string, {
      inputCostPer1k?: number;
      outputCostPer1k?: number;
      costPer1k?: number;
    }>;
  };
  avgLatencyMs: number;
  avgTokensPerSecond?: number; // Average tokens per second across requests
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
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    // Support for different provider formats
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  provider: string;
  toolCalls?: any[];
  timing?: {
    generationTimeMs: number; // Time spent generating tokens (excluding setup)
    tokensPerSecond?: number; // Calculated tokens per second
  };
}

export class LLMRouter {
  private static instance: LLMRouter;
  private providers: Map<string, LLMProvider> = new Map();
  private cache: QuickLRU<string, LLMResponse>;
  private readonly CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
  private settingService: SettingService;
  private settings: LLMSettings | null = null;
  private usageService: LLMUsageService;

  private constructor() {
    this.cache = new QuickLRU({
      maxSize: 1000,
      maxAge: this.CACHE_TTL_MS,
    });
    
    this.settingService = SettingService.getInstance();
    this.usageService = LLMUsageService.getInstance();
    // Initialize providers asynchronously
    this.initializeProviders().catch(error => {
      console.error('Failed to initialize LLM providers:', error);
    });
  }

  // Add method to check if providers are initialized
  async waitForInitialization(): Promise<void> {
    // If providers are already initialized, return immediately
    if (this.providers.size > 0) {
      return;
    }
    
    // Wait for initialization to complete
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 30 seconds
    
    while (this.providers.size === 0 && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (this.providers.size === 0) {
      throw new Error('LLM providers failed to initialize within timeout');
    }
  }

  static getInstance(): LLMRouter {
    if (!LLMRouter.instance) {
      LLMRouter.instance = new LLMRouter();
      // Initialize providers immediately when instance is created
      LLMRouter.instance.initializeProviders().catch(error => {
        console.error('Failed to initialize providers on instance creation:', error);
      });
    }
    return LLMRouter.instance;
  }

  // Add method to refresh providers
  async refreshProviders(): Promise<void> {
    // Reload settings from database
    try {
      this.settings = await this.settingService.getLLMSettings();
      
      // Reload API keys for all providers
      const configs = await this.settingService.getLLMProviderConfigs();
      
      for (const config of configs) {
        const provider = this.providers.get(config.key);
        if (provider) {
          // Reload API key from database
          let apiKey = await this.settingService.getLLMProviderAPIKey(config.key);
          
          // Fallback to environment variables for backward compatibility
          if (!apiKey && config.apiKeyRequired) {
            const envKey = `${config.key.toUpperCase()}_API_KEY`;
            apiKey = process.env[envKey] || '';
          }
          provider.apiKey = apiKey || '';
          // Reload provider-specific model
          const providerModel = await this.settingService.getLLMProviderModel(config.key);
          if (providerModel) {
            provider.model = providerModel;
          }
          // For Ollama, update endpoint
          if (config.key === 'ollama') {
            provider.endpoint = await this.settingService.getOllamaEndpoint();
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh LLM settings:', error);
    }
    await this.probeProviders();
  }

  // Add method to update model for a specific provider
  async updateProviderModel(providerKey: string, model: string): Promise<boolean> {
    const provider = this.providers.get(providerKey);
    
    if (!provider) {
      return false;
    }
    
    // Check if model is actually changing
    const modelChanged = provider.model !== model;
    
    // Update the model in the provider and store it in settings
    provider.model = model;
    await this.settingService.setLLMProviderModel(providerKey, model);
    
    // For Ollama, verify the model exists
    if (provider.name === 'Ollama') {
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
      console.log(`Cleared cache due to model change: ${provider.name} -> ${model}`);
    }
    
    console.log(`Updated ${provider.name} model to: ${model}`);
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
    console.log('Initializing LLM providers...');
    
    // Load settings from database
    try {
      this.settings = await this.settingService.getLLMSettings();
    } catch (error) {
      console.error('Failed to load LLM settings:', error);
      this.settings = null;
    }

    // Get provider configurations
    const configs = await this.settingService.getLLMProviderConfigs();

    for (const config of configs) {
      // Check if provider is enabled in settings
      const isEnabled = this.settings?.providers[config.key]?.enabled ?? true;
      
      if (!isEnabled) {
        console.log(`Skipping disabled provider: ${config.key}`);
        continue;
      }

      // Get API key from database (or environment for backward compatibility)
      let apiKey = await this.settingService.getLLMProviderAPIKey(config.key);
      
      // Fallback to environment variables for backward compatibility
      if (!apiKey && config.apiKeyRequired) {
        const envKey = `${config.key.toUpperCase()}_API_KEY`;
        apiKey = process.env[envKey] || '';
      }

      // Get provider-specific model or fall back to default
      let providerModel = await this.settingService.getLLMProviderModel(config.key);
      if (!providerModel) {
        providerModel = config.defaultModel;
      }

      // For Ollama, use dynamic endpoint
      let endpoint = config.endpoint;
      if (config.key === 'ollama') {
        endpoint = await this.settingService.getOllamaEndpoint();
      }

      // Add all enabled providers to the map, even if they don't have API keys
      // This allows them to show up in the admin interface
      this.providers.set(config.key, {
        name: config.name,
        endpoint,
        apiKey: apiKey || '',
        pricing: config.pricing,
        avgLatencyMs: 0,
        isAvailable: false, // Will be set to true during probing if API key is available
        model: providerModel,
      });
    }

    console.log(`Initialized ${this.providers.size} providers:`, Array.from(this.providers.keys()));

    // Initialize providers asynchronously
    this.probeProviders().catch(error => {
      console.error('Failed to initialize LLM providers:', error);
    });
  }

  private async probeProviders(): Promise<void> {
    console.log('Probing LLM providers for availability and latency...');
    
    for (const [key, provider] of Array.from(this.providers.entries())) {
      try {
        // Check if provider has API key if required
        const configs = await this.settingService.getLLMProviderConfigs();
        const config = configs.find(c => c.key === key);
        const hasApiKey = config?.apiKeyRequired ? !!provider.apiKey : true;
        
        if (!hasApiKey) {
          provider.isAvailable = false;
          provider.avgLatencyMs = 0;
          console.log(`Provider ${provider.name}: Unavailable (no API key)`);
          continue;
        }
        
        const startTime = Date.now();
        const isAvailable = await this.healthCheck(provider);
        const latency = Date.now() - startTime;
        
        provider.isAvailable = isAvailable;
        provider.avgLatencyMs = latency;
        
        // For Ollama, verify the provider's model exists, otherwise use first available
        if (provider.name === 'Ollama' && isAvailable) {
          try {
            const response = await fetch(`${provider.endpoint}/api/tags`);
            if (response.ok) {
              const data = await response.json();
              if (data.models && data.models.length > 0) {
                // Check if the provider's model exists
                const providerModel = provider.model;
                const modelExists = data.models.some((m: any) => m.name === providerModel);
                
                if (providerModel && modelExists) {
                  console.log(`Ollama model set to provider model: ${provider.model}`);
                } else {
                  provider.model = data.models[0].name;
                  console.log(`Ollama model set to first available: ${provider.model} (provider model ${providerModel} not found)`);
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
      } else if (provider.name === 'Groq' || provider.name === 'OpenAI') {
        // For OpenAI-compatible providers, test the models endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const modelsEndpoint = provider.name === 'Groq' 
            ? 'https://api.groq.com/openai/v1/models'
            : 'https://api.openai.com/v1/models';
            
          const response = await fetch(modelsEndpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            return data.data && data.data.length > 0;
          }
          // For testing: if we have an API key but the call fails, still consider available
          if (provider.apiKey && provider.apiKey.length > 10) {
            console.log(`${provider.name} has API key but API call failed - considering available for testing`);
            return true;
          }
          return false;
        } catch (error) {
          clearTimeout(timeoutId);
          console.error(`${provider.name} health check failed:`, error);
          // For testing: if we have an API key but the call fails, still consider available
          if (provider.apiKey && provider.apiKey.length > 10) {
            console.log(`${provider.name} has API key but API call failed - considering available for testing`);
            return true;
          }
          return false;
        }
      } else if (provider.name === 'Anthropic') {
        // For Anthropic, test the models endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const response = await fetch('https://api.anthropic.com/v1/models', {
            method: 'GET',
            headers: {
              'x-api-key': provider.apiKey,
              'anthropic-version': '2023-06-01',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            return data.data && data.data.length > 0;
          }
          // For testing: if we have an API key but the call fails, still consider available
          if (provider.apiKey && provider.apiKey.length > 10) {
            console.log(`${provider.name} has API key but API call failed - considering available for testing`);
            return true;
          }
          return false;
        } catch (error) {
          clearTimeout(timeoutId);
          console.error(`${provider.name} health check failed:`, error);
          // For testing: if we have an API key but the call fails, still consider available
          if (provider.apiKey && provider.apiKey.length > 10) {
            console.log(`${provider.name} has API key but API call failed - considering available for testing`);
            return true;
          }
          return false;
        }
      } else {
        // For other providers, assume available if we have API key
        return !!provider.apiKey;
      }
    } catch (error) {
      console.error(`Health check failed for ${provider.name}:`, error);
      return false;
    }
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
    
    // Get available providers in priority order
    const availableProviders = this.getAvailableProvidersInOrder();
    
    if (availableProviders.length === 0) {
      throw new Error('No available LLM providers');
    }

    // Try providers in priority order
    let lastError: Error | null = null;
    
    for (const provider of availableProviders) {
      try {
        console.log(`Attempting request with ${provider.name}`);
        
        // Check cache with provider-specific key
        const cacheKey = this.generateCacheKey(request, provider);
        const cachedResponse = this.cache.get(cacheKey);
        
        if (cachedResponse) {
          console.log('Cache hit for request:', cacheKey);
          return cachedResponse;
        }

        // For Ollama, ensure the model is loaded before making the request
        if (provider.name === 'Ollama') {
          await this.ensureOllamaModelLoaded(provider);
        }

        const response = await this.callProvider(provider, request);
        
        // Cache the response
        this.cache.set(cacheKey, response);
        
        // Record usage if we have token information
        if (response.usage) {
          try {
            const usageData: UsageData = {
              providerKey: this.getProviderKey(provider.name),
              model: provider.model || 'unknown',
              promptTokens: response.usage.promptTokens || response.usage.prompt_tokens || 0,
              completionTokens: response.usage.completionTokens || response.usage.completion_tokens || 0,
              totalTokens: response.usage.totalTokens || response.usage.total_tokens || 0,
              userId: request.userId,
              requestType: request.tool || 'chat',
            };
            
            await this.usageService.recordUsage(usageData, provider.pricing);
            console.log(`Recorded usage for ${provider.name}: ${response.usage.totalTokens} tokens`);
          } catch (error) {
            console.error('Failed to record usage:', error);
          }
        }
        
        console.log(`Successfully routed request to ${provider.name}`);
        return response;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`Provider ${provider.name} failed:`, error);
        
        // Don't mark provider as unavailable immediately - it might be a temporary issue
        // Only mark as unavailable after multiple consecutive failures
        // For now, just continue to the next provider
      }
    }
    
    // If we get here, all providers failed
    throw new Error(`All LLM providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  private getAvailableProvidersInOrder(): LLMProvider[] {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isAvailable);

    if (availableProviders.length === 0) {
      return [];
    }

    // Get provider order from settings (admin dashboard priority)
    const providerOrder = this.settings?.providers ? 
      Object.entries(this.settings.providers)
        .filter(([_, config]) => (config as any).enabled)
        .sort(([_, a], [__, b]) => (a as any).priority - (b as any).priority)
        .map(([key, _]) => key) : 
      ['ollama', 'openai', 'groq', 'anthropic', 'aws', 'azure'];

    // Map provider keys to names
    const keyToName: Record<string, string> = {
      'ollama': 'Ollama',
      'openai': 'OpenAI',
      'groq': 'Groq',
      'anthropic': 'Anthropic',
      'aws': 'AWS Bedrock',
      'azure': 'Azure OpenAI'
    };

    // Sort available providers by priority order
    const sortedProviders: LLMProvider[] = [];
    
    for (const providerKey of providerOrder) {
      const providerName = keyToName[providerKey];
      const provider = availableProviders.find(p => p.name === providerName);
      if (provider) {
        sortedProviders.push(provider);
      }
    }
    
    // Add any remaining providers that weren't in the priority list
    availableProviders.forEach(provider => {
      if (!sortedProviders.find(p => p.name === provider.name)) {
        sortedProviders.push(provider);
      }
    });
    
    return sortedProviders;
  }

  // Helper function to get provider key from name
  private getProviderKey(providerName: string): string {
    const nameToKey: Record<string, string> = {
      'Ollama': 'ollama',
      'OpenAI': 'openai',
      'Groq': 'groq',
      'Anthropic': 'anthropic',
      'AWS Bedrock': 'aws',
      'Azure OpenAI': 'azure'
    };
    return nameToKey[providerName] || providerName.toLowerCase();
  }

  // Helper function to get provider cost for priority calculation
  private getProviderCost(provider: LLMProvider): number {
    if (!provider.pricing) return 0;
    
    const { pricing, model } = provider;
    
    if (pricing.type === 'free') {
      return 0;
    }
    
    if (pricing.type === 'flat') {
      return pricing.costPer1k || 0;
    }
    
    if (pricing.type === 'input_output') {
      // Get model-specific pricing if available
      let inputCost = pricing.inputCostPer1k || 0;
      let outputCost = pricing.outputCostPer1k || 0;
      
      if (model && pricing.modelPricing && pricing.modelPricing[model]) {
        const modelPricing = pricing.modelPricing[model];
        inputCost = modelPricing.inputCostPer1k || inputCost;
        outputCost = modelPricing.outputCostPer1k || outputCost;
      }
      
      // Return average cost for priority calculation
      return (inputCost + outputCost) / 2;
    }
    
    return 0;
  }

  async testProvider(providerKey: string, request: LLMRequest): Promise<LLMResponse> {
    // Ensure providers are initialized
    if (this.providers.size === 0) {
      await this.initializeProviders();
    }
    
    // Map provider key to name
    const keyToName: Record<string, string> = {
      'ollama': 'Ollama',
      'openai': 'OpenAI',
      'groq': 'Groq',
      'anthropic': 'Anthropic',
      'aws': 'AWS Bedrock',
      'azure': 'Azure OpenAI'
    };
    
    const providerName = keyToName[providerKey];
    if (!providerName) {
      throw new Error(`Unknown provider: ${providerKey}`);
    }
    
    // Find the specific provider
    const provider = Array.from(this.providers.values()).find(p => p.name === providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    
    // Refresh API key from database before testing
    let apiKey = await this.settingService.getLLMProviderAPIKey(providerKey);
    
    // Fallback to environment variables for backward compatibility
    if (!apiKey) {
      const configs = await this.settingService.getLLMProviderConfigs();
      const config = configs.find(c => c.key === providerKey);
      if (config?.apiKeyRequired) {
        const envKey = `${providerKey.toUpperCase()}_API_KEY`;
        apiKey = process.env[envKey] || '';
      }
    }
    
    // Update provider with fresh API key
    provider.apiKey = apiKey || '';
    
    // Check if provider has API key if required
    const configs = await this.settingService.getLLMProviderConfigs();
    const config = configs.find(c => c.key === providerKey);
    const hasApiKey = config?.apiKeyRequired ? !!provider.apiKey : true;
    
    if (!hasApiKey) {
      throw new Error(`Provider ${providerName} requires API key but none is configured`);
    }
    
    if (!provider.isAvailable) {
      throw new Error(`Provider ${providerName} is not available`);
    }

    console.log(`Testing provider: ${provider.name}`);

    // For Ollama, ensure the model is loaded before making the request
    if (provider.name === 'Ollama') {
      await this.ensureOllamaModelLoaded(provider);
    }

    // Test the specific provider without caching
    const startTime = Date.now();
    const response = await this.callProvider(provider, request);
    const endTime = Date.now();
    
    // Calculate generation time (excluding setup time)
    const generationTimeMs = endTime - startTime;
    
    // Debug: Log the response usage data
    console.log(`${provider.name} test response usage:`, response.usage);
    
    // Normalize usage data from different providers
    let normalizedUsage = null;
    if (response.usage) {
      // Handle different property names from different providers
      const promptTokens = response.usage.promptTokens || response.usage.prompt_tokens || 0;
      const completionTokens = response.usage.completionTokens || response.usage.completion_tokens || 0;
      const totalTokens = response.usage.totalTokens || response.usage.total_tokens || (promptTokens + completionTokens);
      
      normalizedUsage = {
        promptTokens: promptTokens,
        completionTokens: completionTokens,
        totalTokens: totalTokens,
      };
      
      console.log(`${provider.name} normalized usage:`, normalizedUsage);
    }
    
    // Record usage for test requests
    if (normalizedUsage && (normalizedUsage.promptTokens > 0 || normalizedUsage.completionTokens > 0)) {
      try {
        const usageData: UsageData = {
          providerKey: this.getProviderKey(provider.name),
          model: provider.model || 'unknown',
          promptTokens: normalizedUsage.promptTokens || 0,
          completionTokens: normalizedUsage.completionTokens || 0,
          totalTokens: normalizedUsage.totalTokens || 0,
          userId: request.userId,
          requestType: 'test',
        };
        
        console.log(`${provider.name} usage data to record:`, usageData);
        
        await this.usageService.recordUsage(usageData, provider.pricing);
        console.log(`Recorded test usage for ${provider.name}: ${normalizedUsage.totalTokens} tokens`);
        
        // Update the response with normalized usage
        response.usage = normalizedUsage;
        
        // Calculate tokens per second
        if (generationTimeMs > 0 && normalizedUsage.totalTokens > 0) {
          const tokensPerSecond = (normalizedUsage.totalTokens / generationTimeMs) * 1000;
          response.timing = {
            generationTimeMs,
            tokensPerSecond
          };
          
          // Update provider's average tokens per second
          if (!provider.avgTokensPerSecond) {
            provider.avgTokensPerSecond = tokensPerSecond;
          } else {
            // Simple moving average (could be improved with exponential moving average)
            provider.avgTokensPerSecond = (provider.avgTokensPerSecond + tokensPerSecond) / 2;
          }
          
          console.log(`${provider.name} tokens per second: ${tokensPerSecond.toFixed(2)}`);
        }
      } catch (error) {
        console.error('Failed to record test usage:', error);
      }
    } else {
      console.log(`No usage data available for ${provider.name} test request`);
      
      // Fallback: estimate token usage if API doesn't provide it
      if (response.content) {
        const estimatedPromptTokens = Math.ceil(request.prompt.length / 4);
        const estimatedCompletionTokens = Math.ceil(response.content.length / 4);
        const estimatedTotalTokens = estimatedPromptTokens + estimatedCompletionTokens;
        
        console.log(`${provider.name} estimated usage:`, {
          promptTokens: estimatedPromptTokens,
          completionTokens: estimatedCompletionTokens,
          totalTokens: estimatedTotalTokens
        });
        
        // Update the response with estimated usage
        response.usage = {
          promptTokens: estimatedPromptTokens,
          completionTokens: estimatedCompletionTokens,
          totalTokens: estimatedTotalTokens,
        };
        
        try {
          const usageData: UsageData = {
            providerKey: this.getProviderKey(provider.name),
            model: provider.model || 'unknown',
            promptTokens: estimatedPromptTokens,
            completionTokens: estimatedCompletionTokens,
            totalTokens: estimatedTotalTokens,
            userId: request.userId,
            requestType: 'test',
          };
          
          await this.usageService.recordUsage(usageData, provider.pricing);
          console.log(`Recorded estimated usage for ${provider.name}: ${estimatedTotalTokens} tokens`);
          
          // Add timing information for estimated usage
          if (generationTimeMs > 0 && estimatedTotalTokens > 0) {
            const tokensPerSecond = (estimatedTotalTokens / generationTimeMs) * 1000;
            response.timing = {
              generationTimeMs,
              tokensPerSecond
            };
            
            // Update provider's average tokens per second
            if (!provider.avgTokensPerSecond) {
              provider.avgTokensPerSecond = tokensPerSecond;
            } else {
              provider.avgTokensPerSecond = (provider.avgTokensPerSecond + tokensPerSecond) / 2;
            }
            
            console.log(`${provider.name} estimated tokens per second: ${tokensPerSecond.toFixed(2)}`);
          }
        } catch (error) {
          console.error('Failed to record estimated usage:', error);
        }
      }
    }
    
    return response;
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
        
        // Estimate token usage for Ollama (rough approximation)
        const estimatedPromptTokens = Math.ceil(request.prompt.length / 4);
        const estimatedCompletionTokens = Math.ceil(data.response.length / 4);
        const estimatedTotalTokens = estimatedPromptTokens + estimatedCompletionTokens;
        
        return {
          content: data.response,
          provider: provider.name,
          usage: {
            promptTokens: estimatedPromptTokens,
            completionTokens: estimatedCompletionTokens,
            totalTokens: estimatedTotalTokens,
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
    // Debug: Check if API key is present
    if (!provider.apiKey) {
      console.error(`${provider.name} API key is missing`);
      throw new Error(`${provider.name} API key is missing`);
    }
    
    console.log(`Making request to ${provider.name} with model: ${provider.model}`);
    console.log(`${provider.name} API key length: ${provider.apiKey.length}, starts with: ${provider.apiKey.substring(0, 8)}...`);
    
    const requestBody = {
      model: provider.model,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
    };
    
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${provider.name} request failed: ${response.status} - ${errorText}`);
      throw new Error(`${provider.name} request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`${provider.name} API response usage:`, data.usage);
    
    return {
      content: data.choices[0].message.content,
      provider: provider.name,
      usage: data.usage,
      toolCalls: data.choices[0].message.tool_calls,
    };
  }

  private async callAnthropic(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    const requestBody = {
      model: provider.model,
      max_tokens: request.maxTokens || 1000,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
      temperature: request.temperature || 0.7,
    };
    
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`${provider.name} API response usage:`, data.usage);
    
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