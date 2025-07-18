import { AuthService } from '../lib/auth';

async function testMealPlan() {
  try {
    console.log('Testing Meal Plan Tool...\n');

    // Generate a valid token
    const testPayload = {
      userId: 'test-user-id',
      username: 'testuser',
      role: 'USER',
    };
    const accessToken = AuthService.generateAccessToken(testPayload);

    // Test meal plan generation
    const requestBody = {
      tool: 'generate_meal_plan',
      args: { duration_days: 7 }
    };
    
    const response = await fetch('http://localhost:3000/api/mcp/sse', {
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
        
        // Check if meals are properly structured
        if (data.success && data.data?.props?.days) {
          console.log('\n📋 Meal Plan Structure:');
          data.data.props.days.forEach((day: any, index: number) => {
            console.log(`\nDay ${day.day}:`);
            if (day.meals) {
              day.meals.forEach((meal: any, mealIndex: number) => {
                console.log(`  ${mealIndex + 1}. ${meal.name} (${meal.calories} cal)`);
              });
            }
          });
        }
      } catch (e) {
        console.log('✅ Response (non-JSON):', responseText);
      }
    } else {
      console.error('❌ Error:', responseText);
    }

    console.log('\n✅ Meal Plan test completed');
  } catch (error) {
    console.error('❌ Meal Plan test failed:', error);
  }
}

// Run the test
testMealPlan()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 