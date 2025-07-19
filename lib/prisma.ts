import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  portablePrisma: PrismaClient | undefined;
};

// Main database for user data, meals, activities, etc.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Portable database for ingredients and exercises only
export const portablePrisma =
  globalForPrisma.portablePrisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: `file:${path.join(process.cwd(), 'data', 'health-tracker-data.db')}`,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.portablePrisma = portablePrisma;
}

// Helper function to get the appropriate Prisma client for a model
export function getPrismaClient(modelName: string): PrismaClient {
  // Use portable database for ingredients and exercises
  if (modelName === 'Ingredient' || modelName === 'Exercise') {
    return portablePrisma;
  }
  
  // Use main database for everything else
  return prisma;
} 