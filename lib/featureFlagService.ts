import { PrismaClient } from '@prisma/client';
import QuickLRU from 'quick-lru';

const prisma = new PrismaClient();

// Cache for feature flags and settings (5 minutes TTL)
const cache = new QuickLRU<string, any>({
  maxSize: 1000,
  maxAge: 5 * 60 * 1000, // 5 minutes
});

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  rolloutPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMRouterConfig {
  latencyWeight: number;
  costWeight: number;
  providers: {
    [key: string]: {
      enabled: boolean;
      priority: number;
    };
  };
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;

  private constructor() {}

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Check if a feature flag is enabled for a user
   */
  async isFeatureEnabled(flagKey: string, userId?: string): Promise<boolean> {
    const cacheKey = `feature:${flagKey}:${userId || 'global'}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const flag = await prisma.featureFlag.findUnique({
        where: { key: flagKey }
      });

      if (!flag || !flag.enabled) {
        cache.set(cacheKey, false);
        return false;
      }

      // If rollout percentage is 0, feature is disabled
      if (flag.rolloutPercentage === 0) {
        cache.set(cacheKey, false);
        return false;
      }

      // If rollout percentage is 100, feature is enabled for everyone
      if (flag.rolloutPercentage === 100) {
        cache.set(cacheKey, true);
        return true;
      }

      // For partial rollouts, use deterministic hash based on userId
      if (userId) {
        const hash = this.hashUserId(userId);
        const enabled = hash % 100 < flag.rolloutPercentage;
        cache.set(cacheKey, enabled);
        return enabled;
      }

      // No userId provided, use global setting
      cache.set(cacheKey, flag.enabled);
      return flag.enabled;
    } catch (error) {
      console.error('Error checking feature flag:', error);
      return false; // Fail safe - disable feature on error
    }
  }

  /**
   * Get all feature flags
   */
  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    const cacheKey = 'all_feature_flags';
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const flags = await prisma.featureFlag.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      cache.set(cacheKey, flags);
      return flags;
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      return [];
    }
  }

  /**
   * Create or update a feature flag
   */
  async upsertFeatureFlag(data: {
    key: string;
    name: string;
    description?: string;
    enabled: boolean;
    rolloutPercentage: number;
  }): Promise<FeatureFlag> {
    try {
      const flag = await prisma.featureFlag.upsert({
        where: { key: data.key },
        update: {
          name: data.name,
          description: data.description,
          enabled: data.enabled,
          rolloutPercentage: data.rolloutPercentage,
          updatedAt: new Date()
        },
        create: {
          key: data.key,
          name: data.name,
          description: data.description,
          enabled: data.enabled,
          rolloutPercentage: data.rolloutPercentage
        }
      });

      // Clear related caches
      this.clearFeatureFlagCaches(data.key);
      
      return flag;
    } catch (error) {
      console.error('Error upserting feature flag:', error);
      throw error;
    }
  }

  /**
   * Delete a feature flag
   */
  async deleteFeatureFlag(key: string): Promise<void> {
    try {
      await prisma.featureFlag.delete({
        where: { key }
      });

      // Clear related caches
      this.clearFeatureFlagCaches(key);
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      throw error;
    }
  }

  /**
   * Get a setting value
   */
  async getSetting(key: string): Promise<string | null> {
    const cacheKey = `setting:${key}`;
    
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const setting = await prisma.setting.findUnique({
        where: { key }
      });

      const value = setting?.value || null;
      cache.set(cacheKey, value);
      return value;
    } catch (error) {
      console.error('Error fetching setting:', error);
      return null;
    }
  }

  /**
   * Set a setting value
   */
  async setSetting(key: string, value: string, description?: string): Promise<Setting> {
    try {
      const setting = await prisma.setting.upsert({
        where: { key },
        update: {
          value,
          description,
          updatedAt: new Date()
        },
        create: {
          key,
          value,
          description
        }
      });

      // Clear cache
      cache.delete(`setting:${key}`);
      
      return setting;
    } catch (error) {
      console.error('Error setting setting:', error);
      throw error;
    }
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<Setting[]> {
    const cacheKey = 'all_settings';
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const settings = await prisma.setting.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      cache.set(cacheKey, settings);
      return settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return [];
    }
  }

  /**
   * Get LLM Router configuration
   */
  async getLLMRouterConfig(): Promise<LLMRouterConfig> {
    const latencyWeight = await this.getSetting('llm_router_latency_weight');
    const costWeight = await this.getSetting('llm_router_cost_weight');
    
    const providers = await this.getSetting('llm_router_providers');
    
    return {
      latencyWeight: parseFloat(latencyWeight || '0.7'),
      costWeight: parseFloat(costWeight || '0.3'),
      providers: providers ? JSON.parse(providers) : {
        ollama: { enabled: true, priority: 1 },
        groq: { enabled: true, priority: 2 },
        openai: { enabled: true, priority: 3 },
        anthropic: { enabled: true, priority: 4 },
        aws: { enabled: false, priority: 5 },
        azure: { enabled: false, priority: 6 }
      }
    };
  }

  /**
   * Update LLM Router configuration
   */
  async updateLLMRouterConfig(config: Partial<LLMRouterConfig>): Promise<void> {
    if (config.latencyWeight !== undefined) {
      await this.setSetting('llm_router_latency_weight', config.latencyWeight.toString());
    }
    
    if (config.costWeight !== undefined) {
      await this.setSetting('llm_router_cost_weight', config.costWeight.toString());
    }
    
    if (config.providers) {
      await this.setSetting('llm_router_providers', JSON.stringify(config.providers));
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    cache.clear();
  }

  /**
   * Clear caches related to a specific feature flag
   */
  private clearFeatureFlagCaches(flagKey: string): void {
    // Clear specific flag cache
    cache.delete(`feature:${flagKey}:global`);
    
    // Clear all flags cache
    cache.delete('all_feature_flags');
    
    // Clear user-specific caches (we can't enumerate all users, so we'll let them expire)
  }

  /**
   * Simple hash function for deterministic user assignment
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const featureFlagService = FeatureFlagService.getInstance(); 