const fetch = require('node-fetch');

async function testEnhancedRecipeGeneration() {
  try {
    // First, login to get an access token
    console.log('Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.accessToken;

    console.log('Login successful, testing enhanced recipe generation...');

    // Test enhanced recipe generation
    const recipeResponse = await fetch('http://localhost:3000/api/recipes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        keywords: 'chicken stir fry with vegetables',
        mealType: 'DINNER',
        servings: 2,
        calorieGoal: 600,
        preferences: ['low-sodium', 'high-protein'],
        healthMetrics: {
          weight: 70,
          height: 175,
          activityLevel: 'MODERATE'
        },
        difficulty: 'medium',
        cuisine: 'asian'
      })
    });

    if (!recipeResponse.ok) {
      const errorData = await recipeResponse.json();
      console.error('Recipe generation failed:', errorData);
      return;
    }

    const recipeResult = await recipeResponse.json();
    console.log('Enhanced Recipe Generation Result:');
    console.log('=====================================');
    console.log(`Recipe Name: ${recipeResult.recipe.name}`);
    console.log(`Description: ${recipeResult.recipe.description}`);
    console.log(`Meal Type: ${recipeResult.recipe.mealType}`);
    console.log(`Servings: ${recipeResult.recipe.servings}`);
    console.log(`AI Generated: ${recipeResult.recipe.aiGenerated}`);
    console.log(`Original Query: ${recipeResult.recipe.originalQuery}`);
    
    console.log('\nNutrition Information:');
    console.log('======================');
    console.log(`Per Serving: ${JSON.stringify(recipeResult.nutrition, null, 2)}`);
    console.log(`Total Recipe: ${JSON.stringify(recipeResult.totalNutrition, null, 2)}`);
    console.log(`Target Calories: ${recipeResult.targetCalories}`);
    console.log(`Scaling Applied: ${recipeResult.scalingApplied}`);
    
    console.log('\nIngredients:');
    console.log('============');
    recipeResult.mcpResponse.props.ingredients.forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.amount} ${ingredient.unit} ${ingredient.name}`);
      console.log(`   Category: ${ingredient.category}, Aisle: ${ingredient.aisle}`);
      console.log(`   Nutrition: ${ingredient.calories} cal, ${ingredient.protein}g protein, ${ingredient.carbs}g carbs, ${ingredient.fat}g fat`);
      if (ingredient.scalingFactor && ingredient.scalingFactor !== 1) {
        console.log(`   Scaling: ${ingredient.scalingFactor.toFixed(1)}x (Originally: ${ingredient.originalAmount} ${ingredient.unit})`);
      }
      console.log('');
    });

    if (recipeResult.unavailableIngredients.length > 0) {
      console.log('Unavailable Ingredients:');
      console.log('========================');
      recipeResult.unavailableIngredients.forEach((ingredient, index) => {
        console.log(`${index + 1}. ${ingredient}`);
      });
      console.log('');
    }

    console.log('Instructions:');
    console.log('=============');
    recipeResult.mcpResponse.props.instructions.forEach((instruction, index) => {
      console.log(`${index + 1}. ${instruction}`);
    });

    console.log('\nUser Context Used:');
    console.log('==================');
    if (recipeResult.mcpResponse.props.userContext) {
      console.log(`Profile: ${JSON.stringify(recipeResult.mcpResponse.props.userContext.profile, null, 2)}`);
      console.log(`Biomarkers: ${recipeResult.mcpResponse.props.userContext.biomarkers.length} recent measurements`);
      console.log(`Preferences: ${recipeResult.mcpResponse.props.userContext.preferences.foodPreferences.length} food preferences`);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testEnhancedRecipeGeneration(); 