import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { portablePrisma } from '@/lib/prisma';
import { RecipeService } from '@/lib/services/RecipeService';
import { searchIngredients } from '@/lib/searchService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      keywords,
      mealType,
      servings,
      calorieGoal,
      preferences,
      healthMetrics
    } = body;

    if (!keywords || !mealType || !servings) {
      return NextResponse.json(
        { error: 'Missing required fields: keywords, mealType, servings' },
        { status: 400 }
      );
    }

    // Get user's food preferences
    const userPreferences = await portablePrisma.foodPreference.findMany({
      where: { userId: session.user.id }
    });

    // Get user's profile for health metrics
    const userProfile = await portablePrisma.profile.findUnique({
      where: { userId: session.user.id }
    });

    // Build context for AI
    const context = {
      keywords,
      mealType,
      servings,
      calorieGoal: calorieGoal || userProfile?.calorieTarget,
      preferences: userPreferences.map(p => ({
        type: p.type,
        value: p.value,
        isExcluded: p.isExcluded
      })),
      healthMetrics: {
        dietaryPreferences: userProfile?.dietaryPreferences,
        calorieTarget: userProfile?.calorieTarget,
        proteinTarget: userProfile?.proteinTarget,
        carbTarget: userProfile?.carbTarget,
        fatTarget: userProfile?.fatTarget,
        fiberTarget: userProfile?.fiberTarget
      }
    };

    // Generate recipe using AI
    const recipeData = await generateRecipeWithAI(context);

    if (!recipeData) {
      return NextResponse.json(
        { error: 'Failed to generate recipe' },
        { status: 500 }
      );
    }

    // Save recipe to database
    const recipeService = new RecipeService();
    const recipe = await recipeService.createRecipe({
      userId: session.user.id,
      name: recipeData.name,
      description: recipeData.description,
      mealType,
      servings,
      instructions: recipeData.instructions,
      prepTime: recipeData.prepTime,
      cookTime: recipeData.cookTime,
      totalTime: recipeData.totalTime,
      difficulty: recipeData.difficulty,
      cuisine: recipeData.cuisine,
      tags: recipeData.tags,
      aiGenerated: true,
      originalQuery: keywords,
      ingredients: recipeData.ingredients
    });

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Error generating recipe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateRecipeWithAI(context: any) {
  // This is a simplified version - in a real implementation, you'd use your LLM service
  // For now, let's create a basic recipe structure
  
  const { keywords, mealType, servings, calorieGoal } = context;
  
  // Search for ingredients based on keywords
  const allIngredients = await portablePrisma.ingredient.findMany({
    where: { isActive: true },
    take: 1000
  });

  const searchResults = searchIngredients(allIngredients, keywords, 10);
  
  if (searchResults.length === 0) {
    return null;
  }

  // Create a basic recipe structure
  const recipeName = `${keywords} ${mealType}`;
  const mainIngredient = searchResults[0];
  
  // Calculate target calories per serving
  const targetCaloriesPerServing = calorieGoal ? calorieGoal / servings : 500;
  
  // Create ingredients list with appropriate amounts
  const ingredients = searchResults.slice(0, 5).map((ingredient, index) => {
    // Calculate amount based on calories and servings
    const caloriesPer100g = ingredient.calories;
    const targetCalories = targetCaloriesPerServing * (index === 0 ? 0.4 : 0.15); // Main ingredient gets more
    const amount = (targetCalories / caloriesPer100g) * 100;
    
    return {
      ingredientId: ingredient.id,
      amount: Math.round(amount * 10) / 10,
      unit: 'g',
      notes: index === 0 ? 'Main ingredient' : undefined,
      isOptional: index > 2
    };
  });

  // Add some common ingredients
  const commonIngredients = [
    { name: 'olive oil', amount: 15, unit: 'ml' },
    { name: 'salt', amount: 2, unit: 'g' },
    { name: 'black pepper', amount: 1, unit: 'g' }
  ];

  for (const common of commonIngredients) {
    const found = allIngredients.find(ing => 
      ing.name.toLowerCase().includes(common.name.toLowerCase())
    );
    if (found) {
      ingredients.push({
        ingredientId: found.id,
        amount: common.amount * servings,
        unit: common.unit,
        notes: 'Seasoning',
        isOptional: true
      });
    }
  }

  return {
    name: recipeName,
    description: `A delicious ${mealType} featuring ${keywords}`,
    instructions: `1. Prepare ${mainIngredient.name} according to your preference.\n2. Combine all ingredients in a suitable cooking vessel.\n3. Cook until done, adjusting seasoning to taste.\n4. Serve hot and enjoy!`,
    prepTime: 15,
    cookTime: 30,
    totalTime: 45,
    difficulty: 'easy',
    cuisine: 'general',
    tags: [mealType, keywords.toLowerCase()],
    ingredients
  };
} 