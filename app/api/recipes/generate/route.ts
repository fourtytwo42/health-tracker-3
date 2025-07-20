import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { RecipeService } from '@/lib/services/RecipeService';
import { MCPHandler } from '@/lib/mcp';
import { IngredientService } from '@/lib/services/IngredientService';
import { LLMRouter } from '@/lib/llmRouter';

// Helper function to calculate nutrition based on serving size
function calculateIngredientNutrition(ingredient: any, amount: number, unit: string) {
  // Parse the serving size to get the base amount
  const servingSizeMatch = ingredient.servingSize.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
  if (!servingSizeMatch) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  }

  const baseAmount = parseFloat(servingSizeMatch[1]);
  const baseUnit = servingSizeMatch[2].toLowerCase();
  
  // Convert to grams for calculation
  let amountInGrams = amount;
  if (unit.toLowerCase() === 'ml') {
    amountInGrams = amount; // 1ml ≈ 1g for most ingredients
  } else if (unit.toLowerCase() === 'g') {
    amountInGrams = amount;
  } else if (unit.toLowerCase() === 'kg') {
    amountInGrams = amount * 1000;
  } else if (unit.toLowerCase() === 'l') {
    amountInGrams = amount * 1000;
  }

  let baseAmountInGrams = baseAmount;
  if (baseUnit === 'ml') {
    baseAmountInGrams = baseAmount;
  } else if (baseUnit === 'g') {
    baseAmountInGrams = baseAmount;
  } else if (baseUnit === 'kg') {
    baseAmountInGrams = baseAmount * 1000;
  } else if (baseUnit === 'l') {
    baseAmountInGrams = baseAmount * 1000;
  }

  // Calculate scaling factor
  const scalingFactor = amountInGrams / baseAmountInGrams;

  return {
    calories: Math.round(ingredient.calories * scalingFactor),
    protein: Math.round(ingredient.protein * scalingFactor * 10) / 10,
    carbs: Math.round(ingredient.carbs * scalingFactor * 10) / 10,
    fat: Math.round(ingredient.fat * scalingFactor * 10) / 10
  };
}

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
        height: userDetails?.height,
        weight: userDetails?.weight,
        activityLevel: userDetails?.activityLevel,
        calorieTarget: calorieGoal || userProfile?.calorieTarget,
        dietaryPreferences: dietaryPreferences,
        fitnessGoals: userDetails?.fitnessGoals ? JSON.parse(userDetails.fitnessGoals) : [],
        dietaryGoals: userDetails?.dietaryGoals ? JSON.parse(userDetails.dietaryGoals) : [],
        weightGoals: userDetails?.weightGoals ? JSON.parse(userDetails.weightGoals) : [],
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
        }))
      }
    };

    // STEP 1: Generate initial recipe
    console.log('Step 1: Generating initial recipe...');
    
    // Clear LLM cache to ensure we get fresh responses with updated prompts
    const llmRouter = LLMRouter.getInstance();
    llmRouter.clearCache();
    console.log('Cleared LLM cache to ensure fresh recipe generation');
    
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
    const ingredientSearchResults: any[] = [];
    const resolvedIngredients: any[] = [];
    const unresolvedIngredients: any[] = [];

    await Promise.all(
      (initialRecipe.ingredients || []).map(async (ing: any, index: number) => {
        const ingredientName = ing.name;
        console.log(`Searching for ingredient: ${ingredientName}`);
        
        // Check hardcoded mappings first (case-insensitive)
        const hardcodedMappings: Record<string, string> = {
          'salt': 'salt, table, iodized',
          'table salt': 'salt, table, iodized',
          'pepper': 'spices, pepper, black',
          'black pepper': 'spices, pepper, black',
          'red bell pepper': 'peppers, sweet, red, raw',
          'bell pepper': 'peppers, sweet, green, raw',
          'bell peppers': 'peppers, sweet, green, raw',
          'yellow onion': 'onions, yellow, raw',
          'onion': 'onions, raw',
          'onions': 'onions, raw',
          'zucchini': 'squash, summer, green, zucchini, includes skin, raw',
          'tahini': 'tahini',
          'greek yogurt': 'yogurt, greek, plain, nonfat',
          'olive oil': 'olive oil',
          'garlic': 'garlic, raw',
          'lemon juice': 'lemon juice, 100%, ns as to form',
          'boneless chicken breast': 'chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, braised',
          'chicken breast': 'chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, braised',
          'fajita seasoning': 'spices, poultry seasoning',
          'whole wheat tortillas': 'tortillas, ready-to-bake or -fry, corn, without added salt',
          'tortillas': 'tortillas, ready-to-bake or -fry, corn, without added salt',
          'flour': 'flour, wheat, all-purpose, enriched, bleached',
          'beef': 'beef, raw',
          'beef steak': 'beef, raw',
          'mushrooms': 'mushrooms, white button',
          'button mushrooms': 'mushrooms, white button',
          'cream cheese': 'cheese, cream',
          'butter': 'butter, salted',
          'egg noodles': 'noodles, egg, cooked, enriched, with added salt',
          'noodles': 'noodles, egg, cooked, enriched, with added salt',
          'salmon': 'fish, salmon, raw',
          'salmon fillets': 'fish, salmon, raw',
          'quinoa': 'quinoa, cooked',
          'milk': 'milk, whole, 3.25% milkfat',
          'dill': 'spices, dill weed, dried',
          'bacon': 'pork, cured, bacon, cooked, restaurant',
          'cheddar cheese': 'cheese, cheddar',
          'cheese': 'cheese, cheddar',
          'whole wheat bread': 'bread, whole-wheat, commercially prepared',
          'bread': 'bread, whole-wheat, commercially prepared',
          'white bread': 'bread, white, commercially prepared',
          'sourdough bread': 'bread, white, commercially prepared'
        };
        
        // Check if we have a hardcoded mapping (case-insensitive)
        const hardcodedMatch = hardcodedMappings[ingredientName.toLowerCase()];
        let ingredientFound = false;
        
        if (hardcodedMatch) {
          console.log(`✅ Using hardcoded mapping: ${ingredientName} → ${hardcodedMatch}`);
          
          const foundIngredient = await prisma.ingredient.findFirst({
            where: {
              name: hardcodedMatch,
              isActive: true
            }
          });
          
          if (foundIngredient) {
            const nutrition = calculateIngredientNutrition(foundIngredient, ing.amount || 0, ing.unit || 'g');
            
            resolvedIngredients.push({
              ...ing,
              resolvedIngredient: foundIngredient,
              nutrition,
              originalName: ingredientName // Preserve the original AI ingredient name (e.g., "Salt", "Black Pepper")
            });
            
            ingredientSearchResults.push({
              original_name: ingredientName,
              search_results: [{
                name: foundIngredient.name,
                calories: foundIngredient.calories,
                protein: foundIngredient.protein,
                carbs: foundIngredient.carbs,
                fat: foundIngredient.fat,
                servingSize: foundIngredient.servingSize
              }]
            });
            
            ingredientFound = true;
          }
        }
        
        // Only proceed with AI search if hardcoded mapping didn't work
        if (!ingredientFound) {
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

            if (aiSearchResponse.success && aiSearchResponse.data?.bestMatch) {
              const bestMatch = aiSearchResponse.data.bestMatch;
              console.log(`✅ AI found best match for "${ingredientName}": ${bestMatch.name}`);
              
              // Get the full ingredient data
              const foundIngredient = await prisma.ingredient.findFirst({
                where: {
                  name: bestMatch.name,
                  isActive: true
                }
              });

              if (foundIngredient) {
                // Calculate nutrition based on serving size
                const nutrition = calculateIngredientNutrition(foundIngredient, ing.amount || 0, ing.unit || 'g');
                
                resolvedIngredients.push({
                  ...ing,
                  resolvedIngredient: foundIngredient,
                  nutrition,
                  originalName: ingredientName // Preserve the original AI ingredient name
                });

                ingredientSearchResults.push({
                  original_name: ingredientName,
                  search_results: [{
                    name: foundIngredient.name,
                    calories: foundIngredient.calories,
                    protein: foundIngredient.protein,
                    carbs: foundIngredient.carbs,
                    fat: foundIngredient.fat,
                    servingSize: foundIngredient.servingSize
                  }]
                });
              } else {
                console.log(`⚠️  AI suggested ingredient not found in database: ${bestMatch.name}`);
                unresolvedIngredients.push(ing);
              }
            } else {
              console.log(`⚠️  AI search failed for "${ingredientName}", using fallback search...`);
              
              // Fallback search with better filtering
              const ingredientService = new IngredientService();
              const fallbackResults = await ingredientService.getIngredientsPaginated(
                1, 100, false, ingredientName, ing.category, undefined
              );

              // Filter out processed foods and prefer basic ingredients
              const filteredResults = fallbackResults.ingredients.filter((ingredient: any) => {
                const name = ingredient.name.toLowerCase();
                const searchTerm = ingredientName.toLowerCase();
                const category = ingredient.category?.toLowerCase() || '';

                // Avoid processed foods and complex recipes
                if (name.includes('with salt added') ||
                    name.includes('with added') ||
                    name.includes('dry roasted') ||
                    name.includes('bottled') ||
                    name.includes('frozen') ||
                    name.includes('cooked') ||
                    name.includes('processed') ||
                    name.includes('canned') ||
                    name.includes('sweetened') ||
                    name.includes('drained') ||
                    name.includes('frankfurter') ||
                    name.includes('bologna') ||
                    name.includes('cake') ||
                    name.includes('cupcake') ||
                    name.includes('gingerbread') ||
                    name.includes('with eggs') ||
                    name.includes('with onion') ||
                    name.includes('chopped, with') ||
                    name.includes('cured') ||
                    name.includes('smoked') ||
                    name.includes('dehydrated') ||
                    name.includes('flakes') ||
                    name.includes('extra light') ||
                    name.includes('arrowroot') ||
                    name.includes('shiitake') ||
                    name.includes('jujube') ||
                    name.includes('chinese') ||
                    name.includes('pasteurized') ||
                    name.includes('breaded') ||
                    name.includes('par fried') ||
                    name.includes('prepared') ||
                    name.includes('heated') ||
                    name.includes('no sauce') ||
                    name.includes('pickles') ||
                    name.includes('almonds') ||
                    name.includes('nuts')) {
                  return false;
                }

                // STRICT category-specific filtering to prevent cross-category mismatches
                if (searchTerm === 'salt' || searchTerm.includes('salt')) {
                  // Salt should only be in Spices and Herbs category
                  if (category !== 'spices and herbs' || !name.includes('salt')) {
                    return false;
                  }
                }
                
                if (searchTerm === 'pepper' || searchTerm.includes('pepper')) {
                  // Pepper should only be in Spices and Herbs category
                  if (category !== 'spices and herbs' || !name.includes('pepper')) {
                    return false;
                  }
                }
                
                if (searchTerm === 'beef' || searchTerm.includes('beef')) {
                  // Beef should only be in Proteins category
                  if (category !== 'proteins' || !name.includes('beef')) {
                    return false;
                  }
                }
                
                if (searchTerm === 'chicken' || searchTerm.includes('chicken')) {
                  // Chicken should only be in Proteins category
                  if (category !== 'proteins' || !name.includes('chicken')) {
                    return false;
                  }
                }
                
                if (searchTerm === 'onion' || searchTerm.includes('onion')) {
                  // Onions should only be in Vegetables category
                  if (category !== 'vegetables' || !name.includes('onion')) {
                    return false;
                  }
                }
                
                if (searchTerm === 'garlic' || searchTerm.includes('garlic')) {
                  // Garlic should only be in Vegetables category
                  if (category !== 'vegetables' || !name.includes('garlic')) {
                    return false;
                  }
                }
                
                if (searchTerm === 'flour' || searchTerm.includes('flour')) {
                  // Flour should only be in Grains and Flours category
                  if (category !== 'grains and flours' || !name.includes('flour')) {
                    return false;
                  }
                }
                
                if (searchTerm === 'noodles' || searchTerm.includes('noodles')) {
                  // Noodles should only be in Breads and Grains category
                  if (category !== 'breads and grains' || !name.includes('noodle')) {
                    return false;
                  }
                }
                
                if (searchTerm === 'milk' || searchTerm.includes('milk')) {
                  // Milk should only be in Beverages category
                  if (category !== 'beverages' || !name.includes('milk')) {
                    return false;
                  }
                }
                
                if (searchTerm === 'butter' || searchTerm.includes('butter')) {
                  // Butter should only be in Oils and Fats category
                  if (category !== 'oils and fats' || !name.includes('butter')) {
                    return false;
                  }
                }
                
                if (searchTerm === 'dill' || searchTerm.includes('dill')) {
                  // Dill should only be in Spices and Herbs category
                  if (category !== 'spices and herbs' || !name.includes('dill')) {
                    return false;
                  }
                }
                
                if (searchTerm === 'olive oil' || searchTerm.includes('olive oil')) {
                  // Olive oil should only be in Oils and Fats category
                  if (category !== 'oils and fats' || !name.includes('olive')) {
                    return false;
                  }
                }

                // Prefer exact matches or close matches
                if (name === searchTerm) return true;
                if (name.startsWith(searchTerm + ' ')) return true;
                if (name.includes(searchTerm + ',')) return true;
                
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
                  nutrition,
                  originalName: ingredientName // Preserve the original AI ingredient name
                });

                ingredientSearchResults.push({
                  original_name: ingredientName,
                  search_results: [{
                    name: bestMatch.name,
                    calories: bestMatch.calories,
                    protein: bestMatch.protein,
                    carbs: bestMatch.carbs,
                    fat: bestMatch.fat,
                    servingSize: bestMatch.servingSize
                  }]
                });
              } else {
                // Try common substitutions if ingredient not found
                const substitutions: Record<string, string[]> = {
                  'pork chops': ['pork', 'pork loin', 'pork tenderloin'],
                  'salt': ['salt, table, iodized'],
                  'table salt': ['salt, table, iodized'],
                  'pepper': ['spices, pepper, black'],
                  'black pepper': ['spices, pepper, black'],
                  'milk': ['milk, lowfat, fluid, 1% milkfat', 'milk, reduced fat, fluid, 2% milkfat'],
                  'butter': ['butter, stick, unsalted', 'butter, stick, salted'],
                  'garlic': ['garlic, raw'],
                  'ginger': ['ginger root, raw'],
                  'potatoes': ['potato, russet, without skin, raw'],
                  'broccoli': ['broccoli, raw', 'broccoli, cooked, boiled, drained, with salt'],
                  'carrots': ['carrots, raw', 'carrots, cooked, boiled, drained, without salt'],
                  'onions': ['onions, raw', 'onions, cooked, boiled, drained, without salt'],
                  'bell peppers': ['peppers, sweet, green, raw', 'peppers, sweet, red, raw'],
                  'olive oil': ['olive oil'],
                  'soy sauce': ['soy sauce made from soy and wheat (shoyu)'],
                  'flour': ['wheat flour, white, all-purpose, enriched, bleached'],
                  'all-purpose flour': ['wheat flour, white, all-purpose, enriched, bleached'],
                  'beef broth': ['beef broth, bouillon and consomme, canned, condensed'],
                  'sour cream': ['sour cream, reduced fat'],
                  'parsley': ['parsley, fresh'],
                  'chopped fresh parsley': ['parsley, fresh'],
                  'egg noodles': ['noodles, egg, cooked, enriched, with added salt'],
                  'mushrooms': ['mushrooms, white, raw'],
                  'brussels sprouts': ['brussels sprouts, raw'],
                  'vinegar': ['vinegar, balsamic'],
                  'balsamic vinegar': ['vinegar, balsamic']
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
                          nutrition,
                          originalName: ingredientName // Preserve the original AI ingredient name
                        });

                        ingredientSearchResults.push({
                          original_name: ingredientName,
                          search_results: [{
                            name: bestMatch.name,
                            calories: bestMatch.calories,
                            protein: bestMatch.protein,
                            carbs: bestMatch.carbs,
                            fat: bestMatch.fat,
                            servingSize: bestMatch.servingSize
                          }]
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
              }
            }
          } catch (error) {
            console.error(`Error searching for ingredient "${ingredientName}":`, error);
            unresolvedIngredients.push(ing);
          }
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
    const finalResolvedIngredients = await Promise.all(
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

        if (foundIngredient) {
          console.log(`✅ Resolved ingredient: ${ingredientName} -> ${foundIngredient.name} (${ing.amount || 0}${ing.unit || 'g'} = ${Math.round(foundIngredient.calories * (ing.amount || 0) / 100)} cal)`);
          
          // Calculate nutrition based on serving size
          const nutrition = calculateIngredientNutrition(foundIngredient, ing.amount || 0, ing.unit || 'g');
          
          return {
            ...ing,
            ingredientId: foundIngredient.id, // Set the ingredient ID
            resolvedIngredient: foundIngredient,
            nutrition,
            originalName: ing.originalName || ing.name // Preserve the original AI ingredient name
          };
        } else {
          console.log(`❌ Ingredient not found: ${ingredientName}`);
          return {
            ...ing,
            ingredientId: null,
            resolvedIngredient: null,
            nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }
          };
        }
      })
    );

    // Filter out unavailable ingredients and calculate total nutrition
    const availableIngredients = finalResolvedIngredients.filter(ing => !ing.unavailable);
    const unavailableIngredients = finalResolvedIngredients.filter(ing => ing.unavailable);

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
    let finalIngredientsList = finalResolvedIngredients;
    let finalPerServingNutrition = perServingNutrition;
    let scalingApplied = false;

    // If calories are outside the acceptable range, scale the ingredients
    if (calorieDifference > calorieThreshold && totalNutrition.calories > 0) {
      console.log(`Recipe calories (${perServingNutrition.calories}) outside target range (${targetCalories} ± ${calorieThreshold}). Scaling ingredients...`);
      
      // Calculate scaling factor to reach target calories
      const scalingFactor = targetCalories / perServingNutrition.calories;
      
      // Scale up all ingredient amounts (only available ingredients)
      finalIngredientsList = finalResolvedIngredients.map(ing => {
        if (ing.unavailable) {
          return ing; // Keep unavailable ingredients as-is
        }
        
        // Don't scale spices, salt, and other ingredients that should remain small
        const ingredientName = ing.originalName?.toLowerCase() || '';
        const isSpiceOrSeasoning = ingredientName.includes('salt') || 
                                  ingredientName.includes('pepper') || 
                                  ingredientName.includes('spices') ||
                                  ingredientName.includes('seasoning') ||
                                  ingredientName.includes('herbs') ||
                                  ingredientName.includes('garlic') ||
                                  ingredientName.includes('onion') ||
                                  ingredientName.includes('lemon juice') ||
                                  ingredientName.includes('vinegar');
        
        let scalingFactorToUse = scalingFactor;
        
        // Limit scaling for spices and seasonings to prevent excessive amounts
        if (isSpiceOrSeasoning) {
          // Cap scaling at 2x for spices and seasonings
          scalingFactorToUse = Math.min(scalingFactor, 2.0);
          console.log(`Limited scaling for ${ingredientName} to ${scalingFactorToUse}x (was ${scalingFactor}x)`);
        }
        
        const scaledAmount = Math.round(ing.amount * scalingFactorToUse * 10) / 10; // Round to 1 decimal place
        
        return {
          ...ing,
          amount: scaledAmount,
          originalAmount: ing.amount, // Keep original for reference
          scalingFactor: scalingFactorToUse,
          nutrition: {
            calories: Math.round(ing.nutrition.calories * scalingFactorToUse),
            protein: Math.round(ing.nutrition.protein * scalingFactorToUse * 10) / 10,
            carbs: Math.round(ing.nutrition.carbs * scalingFactorToUse * 10) / 10,
            fat: Math.round(ing.nutrition.fat * scalingFactorToUse * 10) / 10,
            fiber: Math.round(ing.nutrition.fiber * scalingFactorToUse * 10) / 10,
            sugar: Math.round(ing.nutrition.sugar * scalingFactorToUse * 10) / 10,
            sodium: Math.round(ing.nutrition.sodium * scalingFactorToUse)
          }
        };
      });

      // Recalculate total nutrition
      const scaledTotalNutrition = finalIngredientsList
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
      ingredients: finalIngredientsList.map(ing => ({
        ingredientId: ing.ingredientId,
        amount: ing.amount,
        unit: ing.unit,
        notes: ing.originalName, // Use the original AI ingredient name as notes
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
          ingredients: finalIngredientsList
            .filter(ing => !ing.unavailable) // Only include available ingredients in the main ingredients list
            .map(ing => ({
              name: ing.originalName, // Use the original AI ingredient name (e.g., "Salt", "Black Pepper")
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