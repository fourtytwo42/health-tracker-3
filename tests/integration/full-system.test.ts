import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { parse } from 'url';
import { NextRequest } from 'next/server';
import { featureFlagService } from '@/lib/featureFlagService';

const prisma = new PrismaClient();

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/healthtracker_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

describe('Full System Integration', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();
    
    // Clean up test data
    await prisma.meal.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.biomarker.deleteMany();
    await prisma.goal.deleteMany();
    await prisma.leaderboardEntry.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'USER'
      }
    });

    // Create user profile
    await prisma.profile.create({
      data: {
        userId: testUser.id,
        firstName: 'Test',
        lastName: 'User',
        calorieTarget: 2000,
        proteinTarget: 150,
        carbTarget: 200,
        fatTarget: 65,
        fiberTarget: 25
      }
    });
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123'
        })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.accessToken).toBeDefined();
    });

    it('should login existing user', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.accessToken).toBeDefined();
      authToken = data.accessToken;
    });
  });

  describe('Meal Management', () => {
    it('should log a meal and award points', async () => {
      const mealData = {
        name: 'Grilled Chicken Salad',
        mealType: 'LUNCH',
        ingredients: [
          { name: 'Chicken Breast', quantity: 150, unit: 'g' },
          { name: 'Mixed Greens', quantity: 100, unit: 'g' },
          { name: 'Olive Oil', quantity: 15, unit: 'ml' }
        ],
        nutritionInfo: {
          calories: 350,
          protein: 45,
          carbs: 8,
          fat: 18,
          fiber: 4
        }
      };

      const response = await fetch('http://localhost:3000/api/meals/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(mealData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.meal).toBeDefined();
      expect(data.pointsAwarded).toBeGreaterThan(0);

      // Verify meal was saved
      const savedMeal = await prisma.meal.findFirst({
        where: { userId: testUser.id }
      });
      expect(savedMeal).toBeDefined();
      expect(savedMeal?.name).toBe('Grilled Chicken Salad');
    });

    it('should generate meal plan', async () => {
      const planData = {
        durationDays: 7,
        calorieTarget: 2000,
        preferences: ['low-carb', 'high-protein']
      };

      const response = await fetch('http://localhost:3000/api/meals/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(planData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.plan).toBeDefined();
      expect(data.plan.days).toHaveLength(7);
    });
  });

  describe('Activity Management', () => {
    it('should log an activity and award points', async () => {
      const activityData = {
        name: 'Morning Run',
        type: 'RUNNING',
        duration: 30,
        calories: 300,
        intensity: 'MODERATE'
      };

      const response = await fetch('http://localhost:3000/api/activities/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(activityData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.activity).toBeDefined();
      expect(data.pointsAwarded).toBeGreaterThan(0);
    });
  });

  describe('Biomarker Tracking', () => {
    it('should log a biomarker', async () => {
      const biomarkerData = {
        type: 'WEIGHT',
        value: 75.5,
        unit: 'kg',
        notes: 'Morning weight'
      };

      const response = await fetch('http://localhost:3000/api/biomarkers/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(biomarkerData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.biomarker).toBeDefined();
      expect(data.pointsAwarded).toBeGreaterThan(0);
    });

    it('should get biomarker trends', async () => {
      // First log some biomarkers
      const biomarkers = [
        { type: 'WEIGHT', value: 75.0, unit: 'kg' },
        { type: 'WEIGHT', value: 74.8, unit: 'kg' },
        { type: 'WEIGHT', value: 74.5, unit: 'kg' }
      ];

      for (const biomarker of biomarkers) {
        await fetch('http://localhost:3000/api/biomarkers/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(biomarker)
        });
      }

      const response = await fetch('http://localhost:3000/api/biomarkers/trends?type=WEIGHT&daysBack=30', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.trends).toBeDefined();
      expect(data.trends.length).toBeGreaterThan(0);
    });
  });

  describe('Leaderboard System', () => {
    it('should award points and update leaderboard', async () => {
      // Log some activities to earn points
      const activities = [
        { name: 'Workout 1', type: 'STRENGTH', duration: 45, calories: 250 },
        { name: 'Workout 2', type: 'CARDIO', duration: 30, calories: 300 }
      ];

      for (const activity of activities) {
        await fetch('http://localhost:3000/api/activities/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(activity)
        });
      }

      // Check leaderboard
      const response = await fetch('http://localhost:3000/api/leaderboard/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.entry).toBeDefined();
      expect(data.entry.totalPoints).toBeGreaterThan(0);
    });
  });

  describe('Goal Management', () => {
    it('should create and track goals', async () => {
      const goalData = {
        title: 'Lose 5kg',
        description: 'Weight loss goal',
        type: 'WEIGHT_LOSS',
        targetValue: 70.0,
        unit: 'kg',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await fetch('http://localhost:3000/api/goals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(goalData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.goal).toBeDefined();
      expect(data.goal.title).toBe('Lose 5kg');
    });
  });

  describe('Grocery List Generation', () => {
    it('should generate grocery list from meal plan', async () => {
      // First create a meal plan
      const planResponse = await fetch('http://localhost:3000/api/meals/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          durationDays: 3,
          calorieTarget: 2000
        })
      });

      const planData = await planResponse.json();
      const planId = planData.plan.id;

      // Generate grocery list
      const response = await fetch('http://localhost:3000/api/grocery-list/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ planId })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.groceryList).toBeDefined();
      expect(data.groceryList.items).toBeDefined();
    });
  });

  describe('Feature Flags', () => {
    it('should check feature flag status', async () => {
      // Create a test feature flag
      await featureFlagService.upsertFeatureFlag({
        key: 'test_feature',
        name: 'Test Feature',
        description: 'Test feature flag',
        enabled: true,
        rolloutPercentage: 100
      });

      const response = await fetch('http://localhost:3000/api/feature-flags/test_feature/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ userId: testUser.id })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.enabled).toBe(true);
    });
  });

  describe('Health Checks', () => {
    it('should return system health status', async () => {
      const response = await fetch('http://localhost:3000/api/healthz');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.database).toBe('connected');
    });

    it('should return metrics', async () => {
      const response = await fetch('http://localhost:3000/api/metrics');
      expect(response.status).toBe(200);
      const data = await response.text();
      expect(data).toContain('http_requests_total');
    });
  });

  describe('PWA Functionality', () => {
    it('should serve web app manifest', async () => {
      const response = await fetch('http://localhost:3000/manifest.json');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe('AI Health Companion');
      expect(data.short_name).toBeDefined();
      expect(data.start_url).toBeDefined();
    });

    it('should serve service worker', async () => {
      const response = await fetch('http://localhost:3000/sw.js');
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('javascript');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid requests gracefully', async () => {
      const response = await fetch('http://localhost:3000/api/nonexistent');
      expect(response.status).toBe(404);
    });

    it('should handle authentication errors', async () => {
      const response = await fetch('http://localhost:3000/api/meals', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      expect(response.status).toBe(401);
    });

    it('should handle validation errors', async () => {
      const response = await fetch('http://localhost:3000/api/meals/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ invalid: 'data' })
      });
      expect(response.status).toBe(400);
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        fetch('http://localhost:3000/api/healthz')
      );

      const responses = await Promise.all(requests);
      const allSuccessful = responses.every(r => r.status === 200);
      expect(allSuccessful).toBe(true);
    });

    it('should respond within acceptable time', async () => {
      const start = Date.now();
      const response = await fetch('http://localhost:3000/api/healthz');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });
  });
}); 