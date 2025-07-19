import { NextRequest, NextResponse } from 'next/server';
import { SystemMessageService } from '@/lib/services/SystemMessageService';
import { AuthService } from '@/lib/auth';

const systemMessageService = new SystemMessageService();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const messageId = params.id;
    
    // Validate required fields
    if (!body.key || !body.title || !body.content || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: key, title, content, category' },
        { status: 400 }
      );
    }

    // Update system message
    const updatedMessage = await systemMessageService.updateMessage(body.key, {
      title: body.title,
      content: body.content,
      category: body.category,
      description: body.description || '',
      isActive: body.is_active !== false, // Default to true
    });
    
    return NextResponse.json({
      success: true,
      data: updatedMessage,
    });
  } catch (error) {
    console.error('Failed to update system message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update system message' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const messageId = params.id;
    
    // First get the message to get the key
    const messages = await systemMessageService.getAllMessages();
    const message = messages.find(m => m.id === messageId);
    
    if (!message) {
      return NextResponse.json(
        { success: false, error: 'System message not found' },
        { status: 404 }
      );
    }

    // Delete system message by key
    await systemMessageService.deleteMessage(message.key);
    
    return NextResponse.json({
      success: true,
      message: 'System message deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete system message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete system message' },
      { status: 500 }
    );
  }
} 