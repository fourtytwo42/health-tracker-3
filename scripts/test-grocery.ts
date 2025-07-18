import { AuthService } from '../lib/auth';

async function testGroceryList() {
  try {
    console.log('Testing Grocery List Tool...\n');

    // Generate a valid token
    const testPayload = {
      userId: 'test-user-id',
      username: 'testuser',
      role: 'USER',
    };
    const accessToken = AuthService.generateAccessToken(testPayload);

    // Test grocery list with minimal args
    const requestBody = {
      tool: 'generate_grocery_list',
      args: {}
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
        console.log('✅ Response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('✅ Response (non-JSON):', responseText);
      }
    } else {
      console.error('❌ Error:', responseText);
    }

    console.log('\n✅ Grocery List test completed');
  } catch (error) {
    console.error('❌ Grocery List test failed:', error);
  }
}

// Run the test
testGroceryList()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 