import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { RecipeService } from '@/lib/services/RecipeService';
import { MCPHandler } from '@/lib/mcp';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      keywords,
      mealType,
      servings,
      calorieGoal,
      preferences,
      healthMetrics,
      difficulty,
      cuisine
    } = body;

    if (!keywords || !mealType || !servings) {
      return NextResponse.json(
        { error: 'Missing required fields: keywords, mealType, servings' },
        { status: 400 }
      );
    }

    // Get user's food preferences
    const foodPreferences = await prisma.foodPreference.findMany({
      where: {
        userId: user.userId
      }
    });

    // Get user's profile for health metrics from main database
    const userProfile = await prisma.profile.findUnique({
      where: { userId: user.userId }
    });

    // Use MCP server for sophisticated recipe generation
    const mcpHandler = MCPHandler.getInstance();
    
    // Prepare dietary preferences from user preferences
    const dietaryPreferences = foodPreferences
      .filter((p: any) => p.preference === 'LIKE')
      .map((p: any) => p.ingredient.category)
      .filter(Boolean);

    // STEP 1: Generate initial recipe
    console.log('Step 1: Generating initial recipe...');
    const step1Response = await mcpHandler.handleToolCall({
      tool: 'generate_recipe_step1',
      args: {
        keywords,
        meal_type: mealType.toUpperCase(),
        servings,
        calorie_goal: calorieGoal || userProfile?.calorieTarget,
        dietary_preferences: dietaryPreferences,
        difficulty: difficulty || 'medium',
        cuisine: cuisine || 'general'
      }
    }, {
      userId: user.userId,
      username: user.username,
      role: user.role
    });

    if (!step1Response.success) {
      return NextResponse.json(
        { error: step1Response.error || 'Failed to generate initial recipe' },
        { status: 500 }
      );
    }

    const initialRecipe = step1Response.data.recipe;
    console.log('Initial recipe generated:', initialRecipe.name);

    // STEP 2: Search for ingredients and get search results
    console.log('Step 2: Searching for ingredients...');
    const ingredientSearchResults = await Promise.all(
      (initialRecipe.ingredients || []).map(async (ing: any) => {
        const ingredientName = ing.name;
        
        // Search for the ingredient using multiple strategies
        let searchResults = [];
        
        // Strategy 1: Exact name match
        let foundIngredient = await prisma.ingredient.findFirst({
          where: {
            name: {
              equals: ingredientName.toLowerCase()
            },
            isActive: true
          }
        });
        if (foundIngredient) searchResults.push(foundIngredient);

        // Strategy 2: Contains name match
        if (searchResults.length === 0) {
          foundIngredient = await prisma.ingredient.findFirst({
            where: {
              name: {
                contains: ingredientName.toLowerCase()
              },
              isActive: true
            }
          });
          if (foundIngredient) searchResults.push(foundIngredient);
        }

        // Strategy 3: Search by key words
        if (searchResults.length === 0) {
          const keyWords = ingredientName
            .toLowerCase()
            .split(' ')
            .filter((word: string) => 
              word.length > 2 && 
              !['the', 'and', 'or', 'with', 'without', 'fresh', 'raw', 'cooked', 'canned', 'frozen'].includes(word)
            );
          
          if (keyWords.length > 0) {
            const keywordResults = await prisma.ingredient.findMany({
              where: {
                OR: keyWords.map((word: string) => ({
                  name: {
                    contains: word
                  }
                })),
                isActive: true
              },
              take: 3 // Limit to top 3 matches
            });
            searchResults.push(...keywordResults);
          }
        }

        // Strategy 4: Search by category
        if (searchResults.length === 0) {
          foundIngredient = await prisma.ingredient.findFirst({
            where: {
              OR: [
                { category: { contains: ingredientName.toLowerCase() } },
                { category: { contains: ingredientName.split(' ')[0].toLowerCase() } }
              ],
              isActive: true
            }
          });
          if (foundIngredient) searchResults.push(foundIngredient);
        }

        // Remove duplicates and format results
        const uniqueResults = searchResults
          .filter((result, index, self) => 
            index === self.findIndex(r => r.id === result.id)
          )
          .map(result => ({
            name: result.name,
            calories: result.calories,
            protein: result.protein,
            carbs: result.carbs,
            fat: result.fat,
            servingSize: result.servingSize || '100g'
          }));

        console.log(`Search results for "${ingredientName}": ${uniqueResults.length} matches`);
        uniqueResults.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.name} (${result.calories} cal per ${result.servingSize})`);
        });

        return {
          original_name: ingredientName,
          search_results: uniqueResults
        };
      })
    );

    // STEP 3: Refine recipe with search results
    console.log('Step 3: Refining recipe with search results...');
    const step2Response = await mcpHandler.handleToolCall({
      tool: 'refine_recipe_step2',
      args: {
        original_recipe: initialRecipe,
        ingredient_search_results: ingredientSearchResults,
        user_profile: {
          calorieTarget: calorieGoal || userProfile?.calorieTarget,
          dietaryPreferences: dietaryPreferences,
          healthMetrics: healthMetrics
        }
      }
    }, {
      userId: user.userId,
      username: user.username,
      role: user.role
    });

    if (!step2Response.success) {
      return NextResponse.json(
        { error: step2Response.error || 'Failed to refine recipe' },
        { status: 500 }
      );
    }

    const refinedRecipe = step2Response.data.recipe;
    console.log('Recipe refined:', refinedRecipe.name);

    // STEP 4: Resolve ingredients and calculate nutrition
    console.log('Step 4: Calculating nutrition...');
    const resolvedIngredients = await Promise.all(
      (refinedRecipe.ingredients || []).map(async (ing: any, index: number) => {
        const ingredientName = ing.name;
        
        // Find the ingredient in the database
        let foundIngredient = await prisma.ingredient.findFirst({
          where: {
            name: {
              equals: ingredientName
            },
            isActive: true
          }
        });

        // If not found by exact match, try contains
        if (!foundIngredient) {
          foundIngredient = await prisma.ingredient.findFirst({
            where: {
              name: {
                contains: ingredientName
              },
              isActive: true
            }
          });
        }

        // If still not found, create fallback ingredient
        if (!foundIngredient) {
          console.log(`Creating fallback ingredient for: ${ingredientName}`);
          
          // Estimate nutrition based on ingredient type
          let estimatedNutrition = {
            calories: 100,
            protein: 5,
            carbs: 10,
            fat: 2,
            fiber: 2,
            sugar: 5,
            sodium: 100
          };

          // Adjust estimates based on ingredient type
          const lowerName = ingredientName.toLowerCase();
          if (lowerName.includes('beef') || lowerName.includes('lamb') || lowerName.includes('pork') || lowerName.includes('meat')) {
            estimatedNutrition = { calories: 250, protein: 25, carbs: 0, fat: 15, fiber: 0, sugar: 0, sodium: 70 };
          } else if (lowerName.includes('chicken') || lowerName.includes('turkey') || lowerName.includes('poultry')) {
            estimatedNutrition = { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74 };
          } else if (lowerName.includes('fish') || lowerName.includes('salmon') || lowerName.includes('tuna')) {
            estimatedNutrition = { calories: 208, protein: 25, carbs: 0, fat: 12, fiber: 0, sugar: 0, sodium: 59 };
          } else if (lowerName.includes('rice') || lowerName.includes('pasta') || lowerName.includes('bread')) {
            estimatedNutrition = { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 1 };
          } else if (lowerName.includes('oil') || lowerName.includes('butter') || lowerName.includes('fat')) {
            estimatedNutrition = { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, sodium: 0 };
          } else if (lowerName.includes('vegetable') || lowerName.includes('carrot') || lowerName.includes('broccoli')) {
            estimatedNutrition = { calories: 25, protein: 1.5, carbs: 5, fat: 0.3, fiber: 2.5, sugar: 2.5, sodium: 30 };
          } else if (lowerName.includes('fruit') || lowerName.includes('apple') || lowerName.includes('banana')) {
            estimatedNutrition = { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1 };
          } else if (lowerName.includes('milk') || lowerName.includes('cheese') || lowerName.includes('yogurt')) {
            estimatedNutrition = { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, sugar: 5, sodium: 44 };
          } else if (lowerName.includes('egg')) {
            estimatedNutrition = { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1, sodium: 124 };
          } else if (lowerName.includes('salt') || lowerName.includes('pepper') || lowerName.includes('spice')) {
            estimatedNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 1000 };
          } else if (lowerName.includes('water') || lowerName.includes('broth') || lowerName.includes('stock')) {
            estimatedNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 50 };
          } else if (lowerName.includes('vinegar') || lowerName.includes('lemon') || lowerName.includes('lime')) {
            estimatedNutrition = { calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, sugar: 0.5, sodium: 1 };
          } else if (lowerName.includes('herb') || lowerName.includes('basil') || lowerName.includes('oregano')) {
            estimatedNutrition = { calories: 1, protein: 0.1, carbs: 0.2, fat: 0, fiber: 0.1, sugar: 0, sodium: 1 };
          } else if (lowerName.includes('garlic') || lowerName.includes('onion')) {
            estimatedNutrition = { calories: 4, protein: 0.2, carbs: 1, fat: 0, fiber: 0.1, sugar: 0.3, sodium: 1 };
          }

          foundIngredient = await prisma.ingredient.create({
            data: {
              name: ingredientName,
              description: `AI-generated ingredient: ${ingredientName}`,
              servingSize: '100g',
              calories: estimatedNutrition.calories,
              protein: estimatedNutrition.protein,
              carbs: estimatedNutrition.carbs,
              fat: estimatedNutrition.fat,
              fiber: estimatedNutrition.fiber,
              sugar: estimatedNutrition.sugar,
              sodium: estimatedNutrition.sodium,
              category: 'Other',
              aisle: 'Other',
              isActive: true
            }
          });
        }

        // Calculate nutrition based on actual ingredient amount and serving size
        let servingRatio = 1;
        
        // Parse serving size to get base amount
        const servingSizeStr = foundIngredient.servingSize || '100g';
        const servingSizeMatch = servingSizeStr.match(/(\d+(?:\.\d+)?)\s*(g|ml|oz|lb|kg|l|cup|cups|tbsp|tsp)/i);
        
        if (servingSizeMatch) {
          const baseAmount = parseFloat(servingSizeMatch[1]);
          const baseUnit = servingSizeMatch[2].toLowerCase();
          
          // Convert units to grams for comparison if possible
          const unitConversions: { [key: string]: number } = {
            'g': 1,
            'kg': 1000,
            'oz': 28.35,
            'lb': 453.59,
            'ml': 1, // Assuming 1ml ≈ 1g for most ingredients
            'l': 1000,
            'cup': 236.59, // 1 cup ≈ 236.59ml
            'cups': 236.59,
            'tbsp': 14.79, // 1 tbsp ≈ 14.79ml
            'tsp': 4.93 // 1 tsp ≈ 4.93ml
          };
          
          const baseAmountInGrams = baseAmount * (unitConversions[baseUnit] || 1);
          const ingredientAmountInGrams = ing.amount * (unitConversions[ing.unit.toLowerCase()] || 1);
          
          servingRatio = ingredientAmountInGrams / baseAmountInGrams;
        } else {
          // Fallback to simple ratio if serving size parsing fails
          servingRatio = ing.amount / 100;
        }

        const ingredientNutrition = {
          calories: Math.round(foundIngredient.calories * servingRatio),
          protein: Math.round(foundIngredient.protein * servingRatio * 10) / 10,
          carbs: Math.round(foundIngredient.carbs * servingRatio * 10) / 10,
          fat: Math.round(foundIngredient.fat * servingRatio * 10) / 10,
          fiber: Math.round((foundIngredient.fiber || 0) * servingRatio * 10) / 10,
          sugar: Math.round((foundIngredient.sugar || 0) * servingRatio * 10) / 10,
          sodium: Math.round((foundIngredient.sodium || 0) * servingRatio)
        };

        console.log(`Resolved ingredient: ${ingredientName} -> ${foundIngredient.name} (${ing.amount}${ing.unit} = ${ingredientNutrition.calories} cal)`);

        return {
          ingredientId: foundIngredient.id,
          amount: ing.amount,
          unit: ing.unit,
          notes: ing.name,
          isOptional: false,
          nutrition: ingredientNutrition
        };
      })
    );

    // Calculate total nutrition for the recipe
    const totalNutrition = resolvedIngredients.reduce((total, ing) => ({
      calories: total.calories + ing.nutrition.calories,
      protein: total.protein + ing.nutrition.protein,
      carbs: total.carbs + ing.nutrition.carbs,
      fat: total.fat + ing.nutrition.fat,
      fiber: total.fiber + ing.nutrition.fiber,
      sugar: total.sugar + ing.nutrition.sugar,
      sodium: total.sodium + ing.nutrition.sodium
    }), {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0
    });

    // Calculate per-serving nutrition
    const perServingNutrition = {
      calories: Math.round(totalNutrition.calories / refinedRecipe.servings),
      protein: Math.round(totalNutrition.protein / refinedRecipe.servings * 10) / 10,
      carbs: Math.round(totalNutrition.carbs / refinedRecipe.servings * 10) / 10,
      fat: Math.round(totalNutrition.fat / refinedRecipe.servings * 10) / 10,
      fiber: Math.round(totalNutrition.fiber / refinedRecipe.servings * 10) / 10,
      sugar: Math.round(totalNutrition.sugar / refinedRecipe.servings * 10) / 10,
      sodium: Math.round(totalNutrition.sodium / refinedRecipe.servings)
    };

    // Check if calories are within 15% of target
    const targetCalories = calorieGoal || userProfile?.calorieTarget || 500;
    const calorieDifference = Math.abs(perServingNutrition.calories - targetCalories);
    const calorieThreshold = targetCalories * 0.15; // 15% threshold
    
    let finalRecipeData = refinedRecipe;
    let finalResolvedIngredients = resolvedIngredients;
    let finalPerServingNutrition = perServingNutrition;

    // If calories are outside the acceptable range, scale up the ingredients
    if (calorieDifference > calorieThreshold && perServingNutrition.calories < targetCalories) {
      console.log(`Recipe calories (${perServingNutrition.calories}) below target range (${targetCalories} ± ${calorieThreshold}). Scaling up ingredients...`);
      
      // Calculate scaling factor to reach target calories
      const scalingFactor = targetCalories / perServingNutrition.calories;
      
      // Scale up all ingredient amounts
      finalResolvedIngredients = resolvedIngredients.map(ing => ({
        ...ing,
        amount: Math.round(ing.amount * scalingFactor * 10) / 10, // Round to 1 decimal place
        nutrition: {
          calories: Math.round(ing.nutrition.calories * scalingFactor),
          protein: Math.round(ing.nutrition.protein * scalingFactor * 10) / 10,
          carbs: Math.round(ing.nutrition.carbs * scalingFactor * 10) / 10,
          fat: Math.round(ing.nutrition.fat * scalingFactor * 10) / 10,
          fiber: Math.round(ing.nutrition.fiber * scalingFactor * 10) / 10,
          sugar: Math.round(ing.nutrition.sugar * scalingFactor * 10) / 10,
          sodium: Math.round(ing.nutrition.sodium * scalingFactor)
        }
      }));

      // Recalculate total nutrition
      const scaledTotalNutrition = finalResolvedIngredients.reduce((total, ing) => ({
        calories: total.calories + ing.nutrition.calories,
        protein: total.protein + ing.nutrition.protein,
        carbs: total.carbs + ing.nutrition.carbs,
        fat: total.fat + ing.nutrition.fat,
        fiber: total.fiber + ing.nutrition.fiber,
        sugar: total.sugar + ing.nutrition.sugar,
        sodium: total.sodium + ing.nutrition.sodium
      }), {
        calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0
      });

      // Recalculate per-serving nutrition
      finalPerServingNutrition = {
        calories: Math.round(scaledTotalNutrition.calories / refinedRecipe.servings),
        protein: Math.round(scaledTotalNutrition.protein / refinedRecipe.servings * 10) / 10,
        carbs: Math.round(scaledTotalNutrition.carbs / refinedRecipe.servings * 10) / 10,
        fat: Math.round(scaledTotalNutrition.fat / refinedRecipe.servings * 10) / 10,
        fiber: Math.round(scaledTotalNutrition.fiber / refinedRecipe.servings * 10) / 10,
        sugar: Math.round(scaledTotalNutrition.sugar / refinedRecipe.servings * 10) / 10,
        sodium: Math.round(scaledTotalNutrition.sodium / refinedRecipe.servings)
      };

      console.log(`Scaled recipe to ${finalPerServingNutrition.calories} calories per serving (target: ${targetCalories})`);
    }

    // Save recipe to main database
    const recipeService = new RecipeService();
    const recipe = await recipeService.createRecipe({
      userId: user.userId,
      name: finalRecipeData.title || finalRecipeData.name,
      description: finalRecipeData.description,
      mealType: finalRecipeData.mealType,
      servings: finalRecipeData.servings,
      instructions: Array.isArray(finalRecipeData.instructions) 
        ? finalRecipeData.instructions.join('\n') 
        : finalRecipeData.instructions,
      prepTime: finalRecipeData.prepTime,
      cookTime: finalRecipeData.cookTime,
      totalTime: finalRecipeData.totalTime,
      difficulty: finalRecipeData.difficulty,
      cuisine: finalRecipeData.cuisine,
      tags: finalRecipeData.tags,
      aiGenerated: true,
      originalQuery: keywords,
      ingredients: finalResolvedIngredients.map(ing => ({
        ingredientId: ing.ingredientId,
        amount: ing.amount,
        unit: ing.unit,
        notes: ing.notes,
        isOptional: ing.isOptional
      }))
    });

    return NextResponse.json({ 
      recipe,
      nutrition: finalPerServingNutrition,
      mcpResponse: {
        ...step2Response.data || step2Response.componentJson,
        props: {
          ...(step2Response.data?.props || step2Response.componentJson?.props),
          id: recipe.id, // Include the saved recipe ID
          title: recipe.name,
          description: recipe.description,
          mealType: recipe.mealType,
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          totalTime: recipe.totalTime,
          difficulty: recipe.difficulty,
          cuisine: recipe.cuisine,
          tags: recipe.tags,
          ingredients: finalResolvedIngredients.map(ing => ({
            name: ing.notes,
            amount: ing.amount,
            unit: ing.unit,
            calories: ing.nutrition.calories,
            protein: ing.nutrition.protein,
            carbs: ing.nutrition.carbs,
            fat: ing.nutrition.fat,
            fiber: ing.nutrition.fiber,
            sugar: ing.nutrition.sugar,
            sodium: ing.nutrition.sodium
          })),
          instructions: Array.isArray(recipe.instructions) 
            ? recipe.instructions 
            : recipe.instructions.split('\n'),
          aiGenerated: true,
          originalQuery: keywords
        }
      }
    });
  } catch (error) {
    console.error('Error generating recipe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 