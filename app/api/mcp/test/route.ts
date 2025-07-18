import { NextResponse } from 'next/server';
import { MCPHandler } from '@/lib/mcp';

const mcpHandler = MCPHandler.getInstance();

export async function GET() {
  try {
    const tools = mcpHandler.getRegisteredTools();
    
    return NextResponse.json({
      success: true,
      message: 'MCP Handler is working correctly',
      availableTools: tools,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('MCP test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'MCP Handler test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tool, args } = body;

    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Tool name is required' },
        { status: 400 }
      );
    }

    // Mock auth info for testing
    const mockAuthInfo = {
      userId: 'test-user',
      username: 'test',
      role: 'USER',
    };

    const response = await mcpHandler.handleToolCall({ tool, args }, mockAuthInfo);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('MCP test POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'MCP tool call failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 