import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlanService } from '@/lib/services/planService';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    mealPlan: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock LLM router
vi.mock('@/lib/llmRouter', () => ({
  LLMRouter: {
    call: vi.fn(),
  },
}));

describe('PlanService', () => {
  let planService: PlanService;

  beforeEach(() => {
    planService = new PlanService();
    vi.clearAllMocks();
  });

  describe('generateMealPlan', () => {
    it('should generate a meal plan successfully', async () => {
      const mockUser = { id: 'user1', username: 'testuser' };
      const mockPlan = {
        id: 'plan1',
        userId: 'user1',
        type: 'meal',
        durationDays: 7,
        planData: { days: [] },
        createdAt: new Date(),
      };

      const { prisma } = await import('@/lib/prisma');
      const { LLMRouter } = await import('@/lib/llmRouter');

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(LLMRouter.call).mockResolvedValue({
        content: 'Generated plan',
        toolCalls: [],
      });
      vi.mocked(prisma.mealPlan.create).mockResolvedValue(mockPlan as any);

      const result = await planService.generateMealPlan(
        'user1',
        7,
        2000,
        { preferences: ['vegetarian'] }
      );

      expect(result).toBeDefined();
      expect(prisma.mealPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          type: 'meal',
          durationDays: 7,
        }),
      });
    });

    it('should throw error for invalid user', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        planService.generateMealPlan('invalid-user', 7, 2000, {})
      ).rejects.toThrow('User not found');
    });
  });

  describe('getMealPlan', () => {
    it('should return meal plan by ID', async () => {
      const mockPlan = {
        id: 'plan1',
        userId: 'user1',
        type: 'meal',
        planData: { days: [] },
      };

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.mealPlan.findUnique).mockResolvedValue(mockPlan as any);

      const result = await planService.getMealPlan('plan1');

      expect(result).toEqual(mockPlan);
      expect(prisma.mealPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'plan1' },
      });
    });

    it('should return null for non-existent plan', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.mealPlan.findUnique).mockResolvedValue(null);

      const result = await planService.getMealPlan('non-existent');

      expect(result).toBeNull();
    });
  });
}); 