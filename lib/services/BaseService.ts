import { PrismaClient } from '@prisma/client';
import QuickLRU from 'quick-lru';

export abstract class BaseService {
  protected prisma: PrismaClient;
  protected cache: QuickLRU<string, any>;
  private static prismaInstance: PrismaClient;

  constructor() {
    this.prisma = BaseService.getPrismaInstance();
    this.cache = new QuickLRU({
      maxSize: 100,
      maxAge: 5 * 60 * 1000, // 5 minutes
    });
  }

  private static getPrismaInstance(): PrismaClient {
    if (!BaseService.prismaInstance) {
      BaseService.prismaInstance = new PrismaClient();
    }
    return BaseService.prismaInstance;
  }

  protected async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const result = await fetcher();
    this.cache.set(key, result);
    return result;
  }

  protected invalidateCache(keyPattern?: string): void {
    if (keyPattern) {
      const keys = Array.from(this.cache.keys());
      keys.forEach(key => {
        if (key.includes(keyPattern)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }

  protected async awardPoints(userId: string, action: string, points: number): Promise<void> {
    try {
      await this.prisma.leaderboardEntry.upsert({
        where: { userId },
        create: {
          userId,
          totalPoints: points,
        },
        update: {
          totalPoints: {
            increment: points,
          },
          lastUpdated: new Date(),
        },
      });

      console.log(`Awarded ${points} points to user ${userId} for ${action}`);
      this.invalidateCache('leaderboard');
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  }

  // Common validation patterns
  protected validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }
  }

  protected validateDateRange(startDate?: Date, endDate?: Date): void {
    if (startDate && endDate && startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }
  }

  // Common error handling
  protected handleError(error: any, operation: string): never {
    console.error(`${operation} failed:`, error);
    
    if (error.code === 'P2002') {
      throw new Error('Duplicate entry - record already exists');
    }
    
    if (error.code === 'P2025') {
      throw new Error('Record not found');
    }
    
    throw new Error(`${operation} failed: ${error.message}`);
  }
}

export default BaseService; 