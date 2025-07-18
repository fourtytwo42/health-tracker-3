import { NextRequest, NextResponse } from 'next/server';
import { SystemMessageService } from '@/lib/services/SystemMessageService';
import { AuthService } from '@/lib/auth';

const systemMessageService = new SystemMessageService();

export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const authInfo = AuthService.verifyAccessToken(token);

    // Check if user is admin
    if (authInfo.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const message = await systemMessageService.toggleMessageActive(params.key);

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error('Error toggling system message:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle system message' 
      },
      { status: 500 }
    );
  }
} 