import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MealService } from '@/lib/services/MealService';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    meal: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock LLM router
vi.mock('@/lib/llmRouter', () => ({
  LLMRouter: {
    getInstance: vi.fn(() => ({
      generateResponse: vi.fn(),
    })),
  },
}));

describe('MealService Database Integration', () => {
  let mealService: MealService;

  beforeEach(() => {
    mealService = new MealService();
    vi.clearAllMocks();
  });

  describe('logMeal', () => {
    it('should log a meal successfully', async () => {
      const mealRequest = {
        userId: 'user1',
        name: 'Grilled Chicken Salad',
        mealType: 'LUNCH' as const,
        ingredients: [
          { name: 'Chicken breast', quantity: 6, unit: 'oz' },
          { name: 'Mixed greens', quantity: 2, unit: 'cups' },
          { name: 'Olive oil', quantity: 1, unit: 'tbsp' },
        ],
        nutritionInfo: {
          calories: 420,
          protein: 35,
          carbs: 8,
          fat: 25,
          fiber: 4,
        },
        notes: 'Delicious and healthy lunch',
      };

      const mockMeal = {
        id: 'meal1',
        userId: 'user1',
        name: 'Grilled Chicken Salad',
        mealType: 'LUNCH',
        ingredients: mealRequest.ingredients,
        nutritionInfo: mealRequest.nutritionInfo,
        loggedAt: new Date(),
      };

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.meal.create).mockResolvedValue(mockMeal as any);

      const result = await mealService.logMeal(mealRequest);

      expect(result).toBeDefined();
      expect(result.type).toBe('MealCard');
      expect(result.props.name).toBe('Grilled Chicken Salad');
      expect(prisma.meal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          name: 'Grilled Chicken Salad',
          mealType: 'LUNCH',
        }),
      });
    });

    it('should throw error for non-existent user', async () => {
      const mealRequest = {
        userId: 'nonexistent-user',
        name: 'Test Meal',
        mealType: 'BREAKFAST' as const,
        ingredients: [{ name: 'Test ingredient', quantity: 1, unit: 'piece' }],
      };

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(mealService.logMeal(mealRequest))
        .rejects.toThrow('User not found');
    });
  });

  describe('getMealHistory', () => {
    it('should return user meal history', async () => {
      const mockMeals = [
        {
          id: 'meal1',
          name: 'Breakfast Bowl',
          mealType: 'BREAKFAST',
          loggedAt: new Date('2024-01-01'),
        },
        {
          id: 'meal2',
          name: 'Lunch Salad',
          mealType: 'LUNCH',
          loggedAt: new Date('2024-01-02'),
        },
      ];

      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.meal.findMany).mockResolvedValue(mockMeals as any);

      const history = await mealService.getMealHistory('user1');

      expect(history).toHaveLength(2);
      expect(history[0].name).toBe('Lunch Salad'); // Most recent first
      expect(history[1].name).toBe('Breakfast Bowl');
      expect(prisma.meal.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { loggedAt: 'desc' },
        take: 50,
      });
    });

    it('should return empty array for user with no meals', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.meal.findMany).mockResolvedValue([]);

      const history = await mealService.getMealHistory('user1');

      expect(history).toHaveLength(0);
    });
  });
}); 