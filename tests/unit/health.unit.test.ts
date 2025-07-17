import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/healthz/route';

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
    user: {
      count: vi.fn().mockResolvedValue(2)
    }
  }))
}));

describe('Health Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return healthy status when database is connected', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.database.connected).toBe(true);
    expect(data.database.userCount).toBe(2);
    expect(data.timestamp).toBeDefined();
    expect(data.uptime).toBeDefined();
    expect(data.memory).toBeDefined();
  });

  it('should include required fields in response', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('database');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('memory');
    expect(data).toHaveProperty('version');
  });
}); 