import { AuthService } from '../lib/auth';

async function testMCPAPI() {
  try {
    console.log('Testing MCP API Endpoint...\n');

    // Generate a test token
    const testPayload = {
      userId: 'test-user-id',
      username: 'testuser',
      role: 'USER',
    };
    const accessToken = AuthService.generateAccessToken(testPayload);

    // Test the API endpoint
    console.log('1. Testing MCP API endpoint...');
    const response = await fetch('http://localhost:3001/api/mcp/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        tool: 'chat',
        args: { message: 'Hello, this is a test message from the API' }
      }),
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful:', data);
    } else {
      const errorData = await response.text();
      console.error('❌ API call failed:', errorData);
    }

    console.log('\n✅ MCP API test completed');
  } catch (error) {
    console.error('❌ MCP API test failed:', error);
  }
}

// Run the test
testMCPAPI()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 