import { NextRequest, NextResponse } from 'next/server';
import { AuthService, JWTPayload } from '../auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);

  try {
    const payload = AuthService.verifyAccessToken(token);
    (request as AuthenticatedRequest).user = payload;
    return null; // Continue to the next middleware/handler
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
      { status: 401 }
    );
  }
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authMiddleware(request);
    if (authResult) {
      return authResult;
    }

    return handler(request as AuthenticatedRequest);
  };
}

export function requireRole(role: string) {
  return function(handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      const authResult = await authMiddleware(request);
      if (authResult) {
        return authResult;
      }

      const user = (request as AuthenticatedRequest).user;
      if (!user || user.role !== role) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
          { status: 403 }
        );
      }

      return handler(request as AuthenticatedRequest, context);
    };
  };
}

export async function verifyAuth(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const payload = AuthService.verifyAccessToken(token);
    return payload;
  } catch (error) {
    return null;
  }
} 