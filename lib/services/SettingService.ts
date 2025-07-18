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
    };
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
        aws: { enabled: false, priority: 5 },
        azure: { enabled: false, priority: 6 },
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

  async getFeatureFlag(key: string): Promise<boolean> {
    const value = await this.getSetting(`feature_flag_${key}`);
    return value === 'true';
  }

  async setFeatureFlag(key: string, enabled: boolean): Promise<void> {
    await this.setSetting(
      `feature_flag_${key}`,
      enabled.toString(),
      `Feature flag: ${key}`
    );
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  async getAllSettings(): Promise<Record<string, string>> {
    try {
      const settings = await prisma.setting.findMany();
      const result: Record<string, string> = {};
      
      for (const setting of settings) {
        result[setting.key] = setting.value;
      }
      
      return result;
    } catch (error) {
      console.error('Error getting all settings:', error);
      return {};
    }
  }
}

export default SettingService; 