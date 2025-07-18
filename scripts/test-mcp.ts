import { AuthService } from '../lib/auth';
import { MCPHandler } from '../lib/mcp';

async function testMCP() {
  try {
    console.log('Testing MCP Handler...\n');

    // Test MCP Handler
    console.log('1. Testing MCP Handler initialization...');
    const mcpHandler = MCPHandler.getInstance();
    console.log('✅ MCP Handler initialized');

    // Test registered tools
    console.log('\n2. Testing registered tools...');
    const tools = mcpHandler.getRegisteredTools();
    console.log('Registered tools:', tools);

    // Test JWT token generation
    console.log('\n3. Testing JWT token...');
    const testPayload = {
      userId: 'test-user-id',
      username: 'testuser',
      role: 'USER',
    };
    const accessToken = AuthService.generateAccessToken(testPayload);
    console.log('Generated token:', accessToken.substring(0, 20) + '...');

    // Test MCP tool call
    console.log('\n4. Testing MCP tool call...');
    try {
      const response = await mcpHandler.handleToolCall({
        tool: 'chat',
        args: { message: 'Hello, this is a test message' }
      }, testPayload);

      console.log('✅ MCP tool call successful:', response);
    } catch (error) {
      console.error('❌ MCP tool call failed:', error);
    }

    console.log('\n✅ MCP test completed');
  } catch (error) {
    console.error('❌ MCP test failed:', error);
  }
}

// Run the test
testMCP()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 