import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as registerHandler } from '@/app/api/auth/register/route';

// Mock the AuthService
vi.mock('@/lib/auth', () => ({
  AuthService: {
    registerUser: vi.fn(),
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
  },
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      };

      const { AuthService } = await import('@/lib/auth');
      vi.mocked(AuthService.registerUser).mockResolvedValue(mockUser as any);
      vi.mocked(AuthService.generateAccessToken).mockReturnValue('access-token');
      vi.mocked(AuthService.generateRefreshToken).mockReturnValue('refresh-token');

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: { 'content-type': 'application/json' },
      });

      const response = await registerHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.user).toEqual({
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      });
      expect(responseData.accessToken).toBe('access-token');
      expect(responseData.refreshToken).toBe('refresh-token');
    });

    it('should reject registration with invalid data', async () => {
      const invalidData = {
        username: '',
        email: 'invalid-email',
        password: '123', // too short
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'content-type': 'application/json' },
      });

      const response = await registerHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle duplicate username/email', async () => {
      const userData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };

      const { AuthService } = await import('@/lib/auth');
      vi.mocked(AuthService.registerUser).mockRejectedValue(
        new Error('Username or email already exists')
      );

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: { 'content-type': 'application/json' },
      });

      const response = await registerHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.error.code).toBe('CONFLICT');
    });
  });
}); 