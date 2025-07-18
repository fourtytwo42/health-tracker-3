import { NextRequest } from 'next/server';
import { MCPHandler } from '@/lib/mcp';
import { AuthService } from '@/lib/auth';

const mcpHandler = MCPHandler.getInstance();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      const authInfo = AuthService.verifyAccessToken(token);
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token expired or invalid' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const authInfo = AuthService.verifyAccessToken(token);
    const body = await request.json();
    
    let response;
    if (body.tool === 'chat') {
      // Use natural language handler for chat messages
      response = await mcpHandler.handleNaturalLanguage(body.args.message, authInfo);
    } else {
      // Use direct tool call for specific tools
      response = await mcpHandler.handleToolCall(body, authInfo);
    }
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('MCP route error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    name: 'AI Health Companion MCP Server',
    version: '1.0.0',
    tools: mcpHandler.getRegisteredTools(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
} 