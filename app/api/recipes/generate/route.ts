import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { RecipeService } from '@/lib/services/RecipeService';
import { MCPHandler } from '@/lib/mcp';
import { IngredientService } from '@/lib/services/IngredientService';

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

    // Get comprehensive user data for personalization
    const [userProfile, userDetails, foodPreferences, recentBiomarkers] = await Promise.all([
      // Get user's profile for health metrics from main database
      prisma.profile.findUnique({
        where: { userId: user.userId }
      }),
      
      // Get detailed user information
      prisma.userDetails.findUnique({
        where: { userId: user.userId }
      }),
      
      // Get user's food preferences
      prisma.foodPreference.findMany({
        where: { userId: user.userId }
      }),
      
      // Get recent biomarkers for health context
      prisma.biomarker.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Use MCP server for sophisticated recipe generation
    const mcpHandler = MCPHandler.getInstance();
    
    // Prepare dietary preferences from user preferences
    const dietaryPreferences = foodPreferences
      .filter((p: any) => p.preference === 'LIKE')
      .map((p: any) => p.ingredient.category)
      .filter(Boolean);

    // Prepare comprehensive user context for AI
    const userContext = {
      profile: {
        age: userDetails?.age,
        gender: userDetails?.gender,
        height: userDetails?.height,
        weight: userDetails?.weight,
        activityLevel: userDetails?.activityLevel,
        calorieTarget: calorieGoal || userProfile?.calorieTarget,
        dietaryPreferences: dietaryPreferences,
        fitnessGoals: userDetails?.fitnessGoals ? JSON.parse(userDetails.fitnessGoals) : [],
        dietaryGoals: userDetails?.dietaryGoals ? JSON.parse(userDetails.dietaryGoals) : [],
        weightGoals: userDetails?.weightGoals ? JSON.parse(userDetails.weightGoals) : [],
        healthConditions: userDetails?.healthConditions ? JSON.parse(userDetails.healthConditions) : [],
        allergies: userDetails?.allergies ? JSON.parse(userDetails.allergies) : []
      },
      biomarkers: recentBiomarkers.map(b => ({
        type: b.type,
        value: b.value,
        unit: b.unit,
        date: b.createdAt
      })),
      preferences: {
        foodPreferences: foodPreferences.map((p: any) => ({
          ingredient: p.ingredient.name,
          category: p.ingredient.category,
          preference: p.preference
        })),
        exercisePreferences: userDetails?.exercisePreferences ? JSON.parse(userDetails.exercisePreferences) : []
      }
    };

    // STEP 1: Generate initial recipe with comprehensive user context
    console.log('Step 1: Generating initial recipe with user context...');
    const step1Response = await mcpHandler.handleToolCall({
      tool: 'generate_recipe_step1',
      args: {
        keywords,
        meal_type: mealType.toUpperCase(),
        servings,
        calorie_goal: calorieGoal || userProfile?.calorieTarget,
        dietary_preferences: dietaryPreferences,
        difficulty: difficulty || 'medium',
        cuisine: cuisine || 'general',
        user_context: userContext
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

    console.log('Step 1 response:', JSON.stringify(step1Response, null, 2));
    const initialRecipe = step1Response.data.data.recipe;
    
    if (!initialRecipe) {
      console.error('No recipe found in step1Response.data:', step1Response.data);
      return NextResponse.json(
        { error: 'No recipe generated in step 1' },
        { status: 500 }
      );
    }
    
    console.log('Initial recipe generated:', initialRecipe.name);

    // STEP 2: Use AI ingredient search for each ingredient
    console.log('Step 2: Using AI ingredient search...');
    const ingredientSearchResults = await Promise.all(
      (initialRecipe.ingredients || []).map(async (ing: any) => {
        const ingredientName = ing.name;
        
        try {
          // Use MCP AI ingredient search tool directly
          const aiSearchResponse = await mcpHandler.handleToolCall({
            tool: 'ai_search_ingredients',
            args: {
              search_term: ingredientName,
              category: ing.category, // Use category from recipe if available
              aisle: undefined,
              description: ing.description // Use description from recipe if available
            }
          }, {
            userId: user.userId,
            username: user.username,
            role: user.role
          });

          if (aiSearchResponse.success && aiSearchResponse.data.success) {
            const aiResult = aiSearchResponse.data.data;
            console.log(`✅ AI found best match for "${ingredientName}": ${aiResult.bestMatch.name}`);
            return {
              original_name: ingredientName,
              search_results: [{
                name: aiResult.bestMatch.name,
                calories: aiResult.bestMatch.calories,
                protein: aiResult.bestMatch.protein,
                carbs: aiResult.bestMatch.carbs,
                fat: aiResult.bestMatch.fat,
                fiber: aiResult.bestMatch.fiber,
                sugar: aiResult.bestMatch.sugar,
                sodium: aiResult.bestMatch.sodium,
                servingSize: aiResult.bestMatch.servingSize,
                category: aiResult.bestMatch.category,
                aisle: aiResult.bestMatch.aisle,
                ai_selected: true,
                reasoning: aiResult.reasoning
              }]
            };
          }
        } catch (error) {
          console.error(`AI search failed for "${ingredientName}":`, error);
        }

        // Fallback search with better filtering
        const ingredientService = new IngredientService();
        const fallbackResults = await ingredientService.getIngredientsPaginated(
          1, 100, false, ingredientName, ing.category, undefined
        );

        // Filter out processed foods and prefer basic ingredients
        const filteredResults = fallbackResults.ingredients.filter(ingredient => {
          const name = ingredient.name.toLowerCase();
          
          // Avoid processed foods
          if (name.includes('with salt added') || 
              name.includes('with added') ||
              name.includes('dry roasted') ||
              name.includes('bottled') ||
              name.includes('frozen') ||
              name.includes('cooked') ||
              name.includes('processed')) {
            return false;
          }
          
          // Prefer basic ingredients
          return true;
        });

        // Sort by relevance (exact matches first, then simple names)
        const sortedResults = filteredResults.sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const searchTerm = ingredientName.toLowerCase();
          
          // Exact match gets highest priority
          if (aName === searchTerm && bName !== searchTerm) return -1;
          if (bName === searchTerm && aName !== searchTerm) return 1;
          
          // Simple names get priority over complex ones
          const aComplexity = aName.split(',').length + aName.split(' ').length;
          const bComplexity = bName.split(',').length + bName.split(' ').length;
          
          if (aComplexity !== bComplexity) return aComplexity - bComplexity;
          
          // Alphabetical as tiebreaker
          return aName.localeCompare(bName);
        });

        console.log(`Fallback search results for "${ingredientName}": ${sortedResults.length} matches`);
        
        if (sortedResults.length > 0) {
          const bestMatch = sortedResults[0];
          console.log(`✅ Found ingredient with fallback search: ${bestMatch.name}`);
          
          // Calculate nutrition based on serving size
          const nutrition = calculateIngredientNutrition(bestMatch, ing.amount || 0, ing.unit || 'g');
          
          resolvedIngredients.push({
            ...ing,
            resolvedIngredient: bestMatch,
            nutrition
          });
        } else {
          console.log(`❌ No ingredient found for "${ingredientName}" even with fallback search`);
          unresolvedIngredients.push(ing);
        }
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
          healthMetrics: healthMetrics,
          userContext: userContext
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

    const refinedRecipe = step2Response.data.data.recipe;
    console.log('Recipe refined:', refinedRecipe.name);

    // STEP 4: Resolve ingredients and calculate nutrition with precise scaling
    console.log('Step 4: Calculating nutrition with precise scaling...');
    const resolvedIngredients = await Promise.all(
      (refinedRecipe.ingredients || []).map(async (ing: any, index: number) => {
        const ingredientName = ing.name;
        
        // Find the ingredient in the database using the refined name
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

        // If ingredient not found, try with simplified name
        if (!foundIngredient) {
          console.log(`⚠️  Ingredient not found: ${ingredientName}, trying simplified name...`);
          
          // Simplify the ingredient name by taking first 1-2 words
          const words = ingredientName.toLowerCase().split(' ');
          const simplifiedNames = [];
          
          // Try first word only
          if (words.length > 1) {
            simplifiedNames.push(words[0]);
          }
          
          // Try first two words
          if (words.length > 2) {
            simplifiedNames.push(words.slice(0, 2).join(' '));
          }
          
          // Try common substitutions
          const substitutions: { [key: string]: string } = {
            'beef striploin': 'beef',
            'beef tenderloin': 'beef',
            'chicken breast': 'chicken',
            'boneless chicken': 'chicken',
            'extra virgin olive oil': 'olive oil',
            'cherry tomatoes': 'tomatoes',
            'roma tomatoes': 'tomatoes',
            'yellow onions': 'onions',
            'red onions': 'onions',
            'white onions': 'onions',
            'fresh garlic': 'garlic',
            'minced garlic': 'garlic',
            'dried thyme': 'thyme',
            'fresh thyme': 'thyme',
            'ground black pepper': 'pepper',
            'black pepper': 'pepper',
            'sea salt': 'salt',
            'kosher salt': 'salt',
            'table salt': 'salt'
          };
          
          const substitution = substitutions[ingredientName.toLowerCase()];
          if (substitution) {
            simplifiedNames.push(substitution);
          }
          
          // Try each simplified name
          for (const simplifiedName of simplifiedNames) {
            foundIngredient = await prisma.ingredient.findFirst({
              where: {
                name: {
                  contains: simplifiedName
                },
                isActive: true
              }
            });
            
            if (foundIngredient) {
              console.log(`✅ Found ingredient with simplified name: ${simplifiedName} -> ${foundIngredient.name}`);
              break;
            }
          }
        }

        // If ingredient not found, try common substitutions if ingredient not found
        const substitutions: Record<string, string[]> = {
          'pork chops': ['pork', 'pork loin', 'pork tenderloin'],
          'salt': ['salt, table, iodized'],
          'pepper': ['pepper, black', 'peppercorns'],
          'milk': ['milk, lowfat, fluid, 1% milkfat', 'milk, reduced fat, fluid, 2% milkfat'],
          'butter': ['butter, stick, unsalted', 'butter, stick, salted'],
          'garlic': ['garlic, raw'],
          'potatoes': ['potato, russet, without skin, raw'],
          'broccoli': ['broccoli, raw', 'broccoli, cooked, boiled, drained, with salt']
        };

        let foundWithSubstitution = false;
        for (const [original, substitutes] of Object.entries(substitutions)) {
          if (ingredientName.toLowerCase().includes(original.toLowerCase())) {
            for (const substitute of substitutes) {
              const subResults = await ingredientService.getIngredientsPaginated(
                1, 10, false, substitute, undefined, undefined
              );
              
              if (subResults.ingredients.length > 0) {
                const bestMatch = subResults.ingredients[0];
                console.log(`✅ Found ingredient with substitution: ${ingredientName} → ${bestMatch.name}`);
                
                const nutrition = calculateIngredientNutrition(bestMatch, ing.amount || 0, ing.unit || 'g');
                
                resolvedIngredients.push({
                  ...ing,
                  resolvedIngredient: bestMatch,
                  nutrition
                });
                
                foundWithSubstitution = true;
                break;
              }
            }
            if (foundWithSubstitution) break;
          }
        }

        if (!foundWithSubstitution) {
          console.log(`❌ No ingredient found for "${ingredientName}" even with substitutions`);
          unresolvedIngredients.push(ing);
        }
      })
    );

    // Filter out unavailable ingredients and calculate total nutrition
    const availableIngredients = resolvedIngredients.filter(ing => !ing.unavailable);
    const unavailableIngredients = resolvedIngredients.filter(ing => ing.unavailable);

    if (unavailableIngredients.length > 0) {
      console.log(`⚠️  ${unavailableIngredients.length} ingredients not found in database:`);
      unavailableIngredients.forEach(ing => {
        console.log(`  - ${ing.notes}`);
      });
    }

    // Calculate total nutrition for available ingredients only
    const totalNutrition = availableIngredients.reduce((total, ing) => ({
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

    // Enhanced calorie scaling with user context
    const targetCalories = calorieGoal || userProfile?.calorieTarget || 500;
    const calorieDifference = Math.abs(perServingNutrition.calories - targetCalories);
    const calorieThreshold = targetCalories * 0.15; // 15% threshold
    
    let finalRecipeData = refinedRecipe;
    let finalResolvedIngredients = resolvedIngredients;
    let finalPerServingNutrition = perServingNutrition;
    let scalingApplied = false;

    // If calories are outside the acceptable range, scale the ingredients
    if (calorieDifference > calorieThreshold) {
      console.log(`Recipe calories (${perServingNutrition.calories}) outside target range (${targetCalories} ± ${calorieThreshold}). Scaling ingredients...`);
      
      // Calculate scaling factor to reach target calories
      const scalingFactor = targetCalories / perServingNutrition.calories;
      
      // Scale up all ingredient amounts (only available ingredients)
      finalResolvedIngredients = resolvedIngredients.map(ing => {
        if (ing.unavailable) {
          return ing; // Keep unavailable ingredients as-is
        }
        
        const scaledAmount = Math.round(ing.amount * scalingFactor * 10) / 10; // Round to 1 decimal place
        
        return {
          ...ing,
          amount: scaledAmount,
          originalAmount: ing.amount, // Keep original for reference
          scalingFactor: scalingFactor,
          nutrition: {
            calories: Math.round(ing.nutrition.calories * scalingFactor),
            protein: Math.round(ing.nutrition.protein * scalingFactor * 10) / 10,
            carbs: Math.round(ing.nutrition.carbs * scalingFactor * 10) / 10,
            fat: Math.round(ing.nutrition.fat * scalingFactor * 10) / 10,
            fiber: Math.round(ing.nutrition.fiber * scalingFactor * 10) / 10,
            sugar: Math.round(ing.nutrition.sugar * scalingFactor * 10) / 10,
            sodium: Math.round(ing.nutrition.sodium * scalingFactor)
          }
        };
      });

      // Recalculate total nutrition
      const scaledTotalNutrition = finalResolvedIngredients
        .filter(ing => !ing.unavailable)
        .reduce((total, ing) => ({
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

      scalingApplied = true;
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
        isOptional: ing.isOptional,
        unavailable: ing.unavailable
      })),
      unavailableIngredients: unavailableIngredients.map(ing => ing.notes)
    });

    return NextResponse.json({ 
      recipe,
      nutrition: finalPerServingNutrition,
      totalNutrition: {
        calories: finalPerServingNutrition.calories * refinedRecipe.servings,
        protein: finalPerServingNutrition.protein * refinedRecipe.servings,
        carbs: finalPerServingNutrition.carbs * refinedRecipe.servings,
        fat: finalPerServingNutrition.fat * refinedRecipe.servings,
        fiber: finalPerServingNutrition.fiber * refinedRecipe.servings,
        sugar: finalPerServingNutrition.sugar * refinedRecipe.servings,
        sodium: finalPerServingNutrition.sodium * refinedRecipe.servings
      },
      unavailableIngredients: unavailableIngredients.map(ing => ing.notes),
      scalingApplied,
      targetCalories,
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
          ingredients: finalResolvedIngredients
            .filter(ing => !ing.unavailable) // Only include available ingredients in the main ingredients list
            .map(ing => ({
              name: ing.notes,
              amount: ing.amount,
              unit: ing.unit,
              originalAmount: ing.originalAmount,
              scalingFactor: ing.scalingFactor,
              calories: ing.nutrition.calories,
              protein: ing.nutrition.protein,
              carbs: ing.nutrition.carbs,
              fat: ing.nutrition.fat,
              fiber: ing.nutrition.fiber,
              sugar: ing.nutrition.sugar,
              sodium: ing.nutrition.sodium,
              category: ing.category,
              aisle: ing.aisle,
              servingSize: ing.servingSize,
              unavailable: false
            })),
          unavailableIngredients: unavailableIngredients.map(ing => ({
            name: ing.notes,
            amount: ing.amount,
            unit: ing.unit,
            notes: ing.notes
          })),
          instructions: Array.isArray(recipe.instructions) 
            ? recipe.instructions 
            : recipe.instructions.split('\n'),
          aiGenerated: true,
          originalQuery: keywords,
          userContext: userContext
        }
      }
    });
  } catch (error) {
    console.error('Error generating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    );
  }
} 