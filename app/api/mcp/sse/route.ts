import { NextRequest } from 'next/server';
import { MCPHandler, withMcpAuth } from '@/lib/mcp';

const mcpHandler = MCPHandler.getInstance();

export const POST = withMcpAuth(async (request, authInfo) => {
  const response = await mcpHandler.handleToolCall(request, authInfo);
  return response;
});

export async function GET() {
  return new Response(JSON.stringify({
    name: 'AI Health Companion MCP Server',
    version: '1.0.0',
    tools: mcpHandler.getRegisteredTools(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
} 