import { AuthService } from '../lib/auth';

async function testMCPTool() {
  try {
    console.log('Testing MCP Tool Calling...\n');

    // Generate a valid token
    const testPayload = {
      userId: 'test-user-id',
      username: 'testuser',
      role: 'USER',
    };
    const accessToken = AuthService.generateAccessToken(testPayload);

    // Test messages that should trigger different tools
    const testMessages = [
      "I want to create a meal plan for this week",
      "I ate a turkey sandwich for lunch",
      "Show me my health progress and leaderboard",
      "I want to log my weight as 150 pounds",
      "I want to set a goal to lose 10 pounds",
      "Create a grocery list for my meal plan"
    ];

    for (const message of testMessages) {
      console.log(`\n--- Testing: "${message}" ---`);
      
      const requestBody = {
        tool: 'chat',
        args: { message }
      };
      
      const response = await fetch('http://localhost:3001/api/mcp/sse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('Response status:', response.status);
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('✅ Response:', data);
        } catch (e) {
          console.log('✅ Response (non-JSON):', responseText);
        }
      } else {
        console.error('❌ Error:', responseText);
      }
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ MCP Tool test completed');
  } catch (error) {
    console.error('❌ MCP Tool test failed:', error);
  }
}

// Run the test
testMCPTool()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 