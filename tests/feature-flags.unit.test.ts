import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FeatureFlagService } from '@/lib/featureFlagService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    featureFlag: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn()
    },
    setting: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn()
    }
  }))
}));

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = FeatureFlagService.getInstance();
    mockPrisma = new PrismaClient();
  });

  afterEach(() => {
    service.clearAllCaches();
  });

  describe('isFeatureEnabled', () => {
    it('should return false when feature flag does not exist', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue(null);

      const result = await service.isFeatureEnabled('nonexistent_flag');
      expect(result).toBe(false);
    });

    it('should return false when feature flag is disabled', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        key: 'test_flag',
        enabled: false,
        rolloutPercentage: 0
      });

      const result = await service.isFeatureEnabled('test_flag');
      expect(result).toBe(false);
    });

    it('should return true when feature flag is enabled with 100% rollout', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        key: 'test_flag',
        enabled: true,
        rolloutPercentage: 100
      });

      const result = await service.isFeatureEnabled('test_flag');
      expect(result).toBe(true);
    });

    it('should return true when feature flag is enabled with 0% rollout (global setting)', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        key: 'test_flag',
        enabled: true,
        rolloutPercentage: 0
      });

      const result = await service.isFeatureEnabled('test_flag');
      expect(result).toBe(true);
    });

    it('should use deterministic hash for partial rollouts', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        key: 'test_flag',
        enabled: true,
        rolloutPercentage: 50
      });

      const userId = 'user123';
      const result1 = await service.isFeatureEnabled('test_flag', userId);
      const result2 = await service.isFeatureEnabled('test_flag', userId);

      // Same user should get same result (deterministic)
      expect(result1).toBe(result2);
    });

    it('should cache results', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        key: 'test_flag',
        enabled: true,
        rolloutPercentage: 100
      });

      // First call
      await service.isFeatureEnabled('test_flag');
      // Second call should use cache
      await service.isFeatureEnabled('test_flag');

      // Should only call database once
      expect(mockPrisma.featureFlag.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllFeatureFlags', () => {
    it('should return all feature flags', async () => {
      const mockFlags = [
        { id: '1', key: 'flag1', name: 'Flag 1', enabled: true, rolloutPercentage: 100 },
        { id: '2', key: 'flag2', name: 'Flag 2', enabled: false, rolloutPercentage: 0 }
      ];

      mockPrisma.featureFlag.findMany.mockResolvedValue(mockFlags);

      const result = await service.getAllFeatureFlags();
      expect(result).toEqual(mockFlags);
    });

    it('should cache results', async () => {
      const mockFlags = [{ id: '1', key: 'flag1', name: 'Flag 1', enabled: true, rolloutPercentage: 100 }];
      mockPrisma.featureFlag.findMany.mockResolvedValue(mockFlags);

      await service.getAllFeatureFlags();
      await service.getAllFeatureFlags();

      expect(mockPrisma.featureFlag.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('upsertFeatureFlag', () => {
    it('should create new feature flag', async () => {
      const flagData = {
        key: 'new_flag',
        name: 'New Flag',
        description: 'Test description',
        enabled: true,
        rolloutPercentage: 50
      };

      const mockFlag = { id: '1', ...flagData, createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.featureFlag.upsert.mockResolvedValue(mockFlag);

      const result = await service.upsertFeatureFlag(flagData);
      expect(result).toEqual(mockFlag);
    });

    it('should update existing feature flag', async () => {
      const flagData = {
        key: 'existing_flag',
        name: 'Updated Flag',
        description: 'Updated description',
        enabled: false,
        rolloutPercentage: 0
      };

      const mockFlag = { id: '1', ...flagData, createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.featureFlag.upsert.mockResolvedValue(mockFlag);

      const result = await service.upsertFeatureFlag(flagData);
      expect(result).toEqual(mockFlag);
    });
  });

  describe('getSetting', () => {
    it('should return setting value', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue({
        key: 'test_setting',
        value: 'test_value'
      });

      const result = await service.getSetting('test_setting');
      expect(result).toBe('test_value');
    });

    it('should return null when setting does not exist', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue(null);

      const result = await service.getSetting('nonexistent_setting');
      expect(result).toBe(null);
    });
  });

  describe('setSetting', () => {
    it('should create new setting', async () => {
      const mockSetting = {
        id: '1',
        key: 'new_setting',
        value: 'new_value',
        description: 'Test setting',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.setting.upsert.mockResolvedValue(mockSetting);

      const result = await service.setSetting('new_setting', 'new_value', 'Test setting');
      expect(result).toEqual(mockSetting);
    });
  });

  describe('getLLMRouterConfig', () => {
    it('should return default config when no settings exist', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue(null);

      const result = await service.getLLMRouterConfig();
      expect(result.latencyWeight).toBe(0.7);
      expect(result.costWeight).toBe(0.3);
      expect(result.providers).toBeDefined();
    });

    it('should return config from settings', async () => {
      mockPrisma.setting.findUnique
        .mockResolvedValueOnce({ value: '0.8' }) // latency weight
        .mockResolvedValueOnce({ value: '0.2' }) // cost weight
        .mockResolvedValueOnce({ value: JSON.stringify({ test: { enabled: true, priority: 1 } }) }); // providers

      const result = await service.getLLMRouterConfig();
      expect(result.latencyWeight).toBe(0.8);
      expect(result.costWeight).toBe(0.2);
      expect(result.providers.test.enabled).toBe(true);
    });
  });

  describe('updateLLMRouterConfig', () => {
    it('should update LLM router configuration', async () => {
      const config = {
        latencyWeight: 0.6,
        costWeight: 0.4,
        providers: { test: { enabled: true, priority: 1 } }
      };

      mockPrisma.setting.upsert.mockResolvedValue({});

      await service.updateLLMRouterConfig(config);

      expect(mockPrisma.setting.upsert).toHaveBeenCalledTimes(3);
    });
  });
}); 