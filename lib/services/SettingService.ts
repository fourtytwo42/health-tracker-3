import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LLMSettings {
  selectedModel: string;
  selectedProvider: string;
  latencyWeight: number;
  costWeight: number;
  providers: {
    [key: string]: {
      enabled: boolean;
      priority: number;
      apiKey?: string;
      models?: string[];
    };
  };
}

export interface LLMProviderConfig {
  name: string;
  key: string;
  endpoint: string;
  modelsEndpoint: string;
  apiKeyRequired: boolean;
  defaultModel: string;
  pricing: {
    type: 'free' | 'flat' | 'input_output';
    costPer1k?: number; // For flat pricing
    inputCostPer1k?: number; // For input/output pricing
    outputCostPer1k?: number; // For input/output pricing
    modelPricing?: Record<string, {
      inputCostPer1k?: number;
      outputCostPer1k?: number;
      costPer1k?: number;
    }>;
  };
}

export class SettingService {
  private static instance: SettingService;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): SettingService {
    if (!SettingService.instance) {
      SettingService.instance = new SettingService();
    }
    return SettingService.instance;
  }

  private async getSetting(key: string): Promise<string | null> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }

    try {
      const setting = await prisma.setting.findUnique({
        where: { key },
      });

      const value = setting?.value || null;
      
      // Cache the result
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
      });

      return value;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  private async setSetting(key: string, value: string, description?: string): Promise<void> {
    try {
      await prisma.setting.upsert({
        where: { key },
        update: { 
          value,
          description,
          updatedAt: new Date(),
        },
        create: {
          key,
          value,
          description,
        },
      });

      // Update cache
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  }

  async getLLMSettings(): Promise<LLMSettings> {
    const defaultSettings: LLMSettings = {
      selectedModel: 'llama3.2:3b',
      selectedProvider: 'ollama',
      latencyWeight: 0.7,
      costWeight: 0.3,
      providers: {
        ollama: { enabled: true, priority: 1 },
        groq: { enabled: true, priority: 2 },
        openai: { enabled: true, priority: 3 },
        anthropic: { enabled: true, priority: 4 },
      },
    };

    try {
      const settingsJson = await this.getSetting('llm_settings');
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      return defaultSettings;
    } catch (error) {
      console.error('Error parsing LLM settings:', error);
      return defaultSettings;
    }
  }

  async setLLMSettings(settings: LLMSettings): Promise<void> {
    await this.setSetting(
      'llm_settings',
      JSON.stringify(settings),
      'LLM Router Configuration'
    );
  }

  async getLLMProviderConfigs(): Promise<LLMProviderConfig[]> {
    return [
      {
        name: 'Ollama',
        key: 'ollama',
        endpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        modelsEndpoint: '/api/tags',
        apiKeyRequired: false,
        defaultModel: 'llama3.2:3b',
        pricing: {
          type: 'free',
        },
      },
      {
        name: 'Groq',
        key: 'groq',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        modelsEndpoint: 'https://api.groq.com/openai/v1/models',
        apiKeyRequired: true,
        defaultModel: 'mixtral-8x7b-32768',
        pricing: {
          type: 'input_output',
          inputCostPer1k: 0.0001,
          outputCostPer1k: 0.0001,
          modelPricing: {
            'mixtral-8x7b-32768': { inputCostPer1k: 0.0001, outputCostPer1k: 0.0001 },
            'llama-3.1-8b-instant': { inputCostPer1k: 0.00005, outputCostPer1k: 0.00005 },
            'llama-3.1-70b-versatile': { inputCostPer1k: 0.0007, outputCostPer1k: 0.0008 },
            'llama-3.1-405b-reliable': { inputCostPer1k: 0.0024, outputCostPer1k: 0.006 },
            'gemma-7b-it': { inputCostPer1k: 0.00005, outputCostPer1k: 0.00005 },
          },
        },
      },
      {
        name: 'OpenAI',
        key: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        modelsEndpoint: 'https://api.openai.com/v1/models',
        apiKeyRequired: true,
        defaultModel: 'gpt-3.5-turbo',
        pricing: {
          type: 'input_output',
          inputCostPer1k: 0.0005,
          outputCostPer1k: 0.0015,
          modelPricing: {
            'gpt-3.5-turbo': { inputCostPer1k: 0.0005, outputCostPer1k: 0.0015 },
            'gpt-3.5-turbo-16k': { inputCostPer1k: 0.003, outputCostPer1k: 0.004 },
            'gpt-4': { inputCostPer1k: 0.03, outputCostPer1k: 0.06 },
            'gpt-4-turbo': { inputCostPer1k: 0.01, outputCostPer1k: 0.03 },
            'gpt-4o': { inputCostPer1k: 0.005, outputCostPer1k: 0.015 },
            'gpt-4o-mini': { inputCostPer1k: 0.00015, outputCostPer1k: 0.0006 },
          },
        },
      },
      {
        name: 'Anthropic',
        key: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        modelsEndpoint: 'https://api.anthropic.com/v1/models',
        apiKeyRequired: true,
        defaultModel: 'claude-3-sonnet-20240229',
        pricing: {
          type: 'input_output',
          inputCostPer1k: 0.003,
          outputCostPer1k: 0.015,
          modelPricing: {
            'claude-3-sonnet-20240229': { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
            'claude-3-haiku-20240307': { inputCostPer1k: 0.00025, outputCostPer1k: 0.00125 },
            'claude-3-opus-20240229': { inputCostPer1k: 0.015, outputCostPer1k: 0.075 },
            'claude-3.5-sonnet-20241022': { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
            'claude-3.5-haiku-20241022': { inputCostPer1k: 0.00025, outputCostPer1k: 0.00125 },
          },
        },
      },
    ];
  }

  async getLLMProviderAPIKey(providerKey: string): Promise<string | null> {
    try {
      return await this.getSetting(`llm_provider_${providerKey}_api_key`);
    } catch (error) {
      console.error(`Error getting API key for ${providerKey}:`, error);
      return null;
    }
  }

  async setLLMProviderAPIKey(providerKey: string, apiKey: string): Promise<void> {
    await this.setSetting(
      `llm_provider_${providerKey}_api_key`,
      apiKey,
      `API Key for ${providerKey} LLM provider`
    );
  }

  async getLLMProviderModels(providerKey: string): Promise<string[]> {
    try {
      const modelsJson = await this.getSetting(`llm_provider_${providerKey}_models`);
      return modelsJson ? JSON.parse(modelsJson) : [];
    } catch (error) {
      console.error(`Error getting models for ${providerKey}:`, error);
      return [];
    }
  }

  async setLLMProviderModels(providerKey: string, models: string[]): Promise<void> {
    await this.setSetting(
      `llm_provider_${providerKey}_models`,
      JSON.stringify(models),
      `Available models for ${providerKey} LLM provider`
    );
  }

  async getLLMProviderModel(providerKey: string): Promise<string | null> {
    try {
      return await this.getSetting(`llm_provider_${providerKey}_model`);
    } catch (error) {
      console.error(`Error getting model for ${providerKey}:`, error);
      return null;
    }
  }

  async setLLMProviderModel(providerKey: string, model: string): Promise<void> {
    await this.setSetting(
      `llm_provider_${providerKey}_model`,
      model,
      `Selected model for ${providerKey} LLM provider`
    );
  }

  async getSelectedModel(): Promise<string> {
    const settings = await this.getLLMSettings();
    return settings.selectedModel;
  }

  async getSelectedProvider(): Promise<string> {
    const settings = await this.getLLMSettings();
    return settings.selectedProvider;
  }

  async setSelectedModel(model: string, provider: string = 'ollama'): Promise<void> {
    const settings = await this.getLLMSettings();
    settings.selectedModel = model;
    settings.selectedProvider = provider;
    await this.setLLMSettings(settings);
  }

  async getOllamaEndpoint(): Promise<string> {
    const endpoint = await this.getSetting('ollama_endpoint');
    return endpoint || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async setOllamaEndpoint(endpoint: string): Promise<void> {
    await this.setSetting('ollama_endpoint', endpoint, 'Ollama base URL');
  }


  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  async getAllSettings(): Promise<Array<{ key: string; value: string; description?: string }>> {
    try {
      const settings = await prisma.setting.findMany({
        orderBy: { key: 'asc' }
      });
      return settings.map(setting => ({
        key: setting.key,
        value: setting.value,
        description: setting.description || undefined
      }));
    } catch (error) {
      console.error('Error getting all settings:', error);
      return [];
    }
  }
}

export default SettingService; 