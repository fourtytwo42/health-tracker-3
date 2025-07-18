import { NextRequest, NextResponse } from 'next/server';
import { SystemMessageService } from '@/lib/services/SystemMessageService';
import { AuthService } from '@/lib/auth';

const systemMessageService = new SystemMessageService();

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let messages;
    if (category) {
      messages = await systemMessageService.getMessagesByCategory(category);
    } else {
      messages = await systemMessageService.getAllMessages();
    }

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching system messages:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch system messages' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { key, title, content, category, description } = body;

    if (!key || !title || !content || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: key, title, content, category' },
        { status: 400 }
      );
    }

    const message = await systemMessageService.createMessage({
      key,
      title,
      content,
      category,
      description
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error('Error creating system message:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create system message' 
      },
      { status: 500 }
    );
  }
} 