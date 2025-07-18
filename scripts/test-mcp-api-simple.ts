import { AuthService } from '../lib/auth';

async function testMCPAPISimple() {
  try {
    console.log('Testing MCP API Endpoint (Simple)...\n');

    // Generate a valid token
    const testPayload = {
      userId: 'test-user-id',
      username: 'testuser',
      role: 'USER',
    };
    const accessToken = AuthService.generateAccessToken(testPayload);
    console.log('Generated token:', accessToken.substring(0, 50) + '...');

    // Test the API endpoint
    console.log('\n1. Testing MCP API endpoint...');
    
    const requestBody = {
      tool: 'chat',
      args: { message: 'Hello, this is a test message from the API' }
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('http://localhost:3001/api/mcp/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ API call successful:', data);
      } catch (e) {
        console.log('✅ API call successful (non-JSON response):', responseText);
      }
    } else {
      console.error('❌ API call failed with status:', response.status);
      console.error('Response body:', responseText);
    }

    console.log('\n✅ MCP API test completed');
  } catch (error) {
    console.error('❌ MCP API test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

// Run the test
testMCPAPISimple()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 