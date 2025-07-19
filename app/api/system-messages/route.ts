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
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      const authInfo = AuthService.verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Token expired or invalid' },
        { status: 401 }
      );
    }

    // Get all system messages
    const messages = await systemMessageService.getAllMessages();
    
    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Failed to get system messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get system messages' },
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
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      const authInfo = AuthService.verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Token expired or invalid' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.key || !body.title || !body.content || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: key, title, content, category' },
        { status: 400 }
      );
    }

    // Create new system message
    const newMessage = await systemMessageService.createMessage({
      key: body.key,
      title: body.title,
      content: body.content,
      category: body.category,
      description: body.description || '',
    });
    
    return NextResponse.json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    console.error('Failed to create system message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create system message' },
      { status: 500 }
    );
  }
} 