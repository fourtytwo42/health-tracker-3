const { MCPHandler } = require('./lib/mcp');

async function testWorkoutGeneration() {
  try {
    console.log('Testing workout generation...');
    
    const mcpHandler = MCPHandler.getInstance();
    
    // Mock auth info
    const authInfo = {
      userId: 'test-user-id',
      username: 'testuser',
      role: 'USER'
    };
    
    // Test workout generation
    const result = await mcpHandler.handleToolCall({
      tool: 'generate_workout',
      args: {
        keywords: 'I want a 20-minute beginner strength workout for my arms',
        workoutType: 'STRENGTH',
        duration: 20,
        difficulty: 'BEGINNER',
        targetMuscleGroups: ['BICEPS', 'TRICEPS'],
        equipment: [],
        generateImage: false
      }
    }, authInfo);
    
    console.log('Workout generation result:', JSON.stringify(result, null, 2));
    
    if (result.type === 'WorkoutCard') {
      console.log('✅ Workout generation successful!');
      console.log(`Workout name: ${result.props.workout.name}`);
      console.log(`Number of exercises: ${result.props.workout.exercises.length}`);
    } else {
      console.log('❌ Workout generation failed - unexpected result type');
    }
    
  } catch (error) {
    console.error('❌ Workout generation test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testWorkoutGeneration(); 