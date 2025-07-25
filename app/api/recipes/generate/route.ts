import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { RecipeService } from '@/lib/services/RecipeService';
import { MCPHandler } from '@/lib/mcp';
import { IngredientService } from '@/lib/services/IngredientService';
import { LLMRouter } from '@/lib/llmRouter';

// Helper function to calculate nutrition based on serving size
function calculateIngredientNutrition(ingredient: any, amount: number, unit: string) {
  // Debug logging for raw ingredient data
  console.log(`🔍 DEBUG: Raw ingredient data for ${ingredient.name}:`);
  console.log(`   Calories: ${ingredient.calories}, Protein: ${ingredient.protein}, Carbs: ${ingredient.carbs}, Fat: ${ingredient.fat}`);
  console.log(`   Serving size: "${ingredient.servingSize}"`);
  
  // Check if this is a spice/seasoning by category or name
  const isSpiceOrSeasoning = ingredient.category === 'Spices and Herbs' ||
                            ingredient.name.toLowerCase().includes('baking powder') ||
                            ingredient.name.toLowerCase().includes('leavening') ||
                            ingredient.name.toLowerCase().includes('salt') ||
                            ingredient.name.toLowerCase().includes('pepper') ||
                            ingredient.name.toLowerCase().includes('vanilla') ||
                            ingredient.name.toLowerCase().includes('extract') ||
                            ingredient.name.toLowerCase().includes('chili') ||
                            ingredient.name.toLowerCase().includes('spices') ||
                            ingredient.name.toLowerCase().includes('paprika') ||
                            ingredient.name.toLowerCase().includes('cayenne');
  
  if (isSpiceOrSeasoning) {
    // For spices, just return the amount without nutrition info
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      isSpice: true,
      spiceAmount: amount,
      spiceUnit: unit
    };
  }

  // Parse the serving size to get the base amount
  let servingSizeMatch = ingredient.servingSize.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
  if (!servingSizeMatch) {
    // Try alternative parsing for cases like "1cup" without space
    const altMatch = ingredient.servingSize.match(/(\d+(?:\.\d+)?)(\w+)/);
    if (!altMatch) {
      console.log(`⚠️ Could not parse serving size for ${ingredient.name}: "${ingredient.servingSize}"`);
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
    }
    servingSizeMatch = altMatch;
  }

  const baseAmount = parseFloat(servingSizeMatch[1]);
  const baseUnit = servingSizeMatch[2].toLowerCase();
  
  // Check if there's a weight in parentheses like "1 cup (160g)"
  const weightMatch = ingredient.servingSize.match(/\((\d+(?:\.\d+)?)\s*(\w+)\)/);
  let actualBaseAmount = baseAmount;
  let actualBaseUnit = baseUnit;
  
  if (weightMatch) {
    // Use the weight in parentheses instead
    actualBaseAmount = parseFloat(weightMatch[1]);
    actualBaseUnit = weightMatch[2].toLowerCase();
    console.log(`🔍 DEBUG: Found weight in parentheses for ${ingredient.name}: ${actualBaseAmount}${actualBaseUnit} (original: ${baseAmount}${baseUnit})`);
  }
  
  // Debug logging for serving size parsing
  console.log(`🔍 DEBUG: Serving size parsing for ${ingredient.name}:`);
  console.log(`   Original serving size: "${ingredient.servingSize}"`);
  console.log(`   Parsed base amount: ${actualBaseAmount}`);
  console.log(`   Parsed base unit: ${actualBaseUnit}`);
  
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

  let baseAmountInGrams = actualBaseAmount;
  if (actualBaseUnit === 'ml') {
    baseAmountInGrams = actualBaseAmount;
  } else if (actualBaseUnit === 'g') {
    baseAmountInGrams = actualBaseAmount;
  } else if (actualBaseUnit === 'kg') {
    baseAmountInGrams = actualBaseAmount * 1000;
  } else if (actualBaseUnit === 'l') {
    baseAmountInGrams = actualBaseAmount * 1000;
  }

  // Calculate scaling factor
  const scalingFactor = amountInGrams / baseAmountInGrams;

  // Calculate calories from macros if calories are missing or zero
  let calories = ingredient.calories;
  if (!calories || calories === 0) {
    calories = (ingredient.protein * 4) + (ingredient.carbs * 4) + (ingredient.fat * 9);
    console.log(`Calculated calories from macros for ${ingredient.name}: ${calories} cal`);
  }

  // Debug logging for butter specifically
  if (ingredient.name.toLowerCase().includes('butter')) {
    console.log(`🔍 DEBUG: Butter nutrition - calories: ${ingredient.calories}, protein: ${ingredient.protein}, carbs: ${ingredient.carbs}, fat: ${ingredient.fat}`);
    console.log(`🔍 DEBUG: Butter calculated calories: ${calories}`);
  }

  // Limit scaling for spices and salt to prevent unrealistic quantities
  let finalScalingFactor = scalingFactor;
  if (ingredient.category === 'Spices and Herbs' ||
      ingredient.name.toLowerCase().includes('baking powder') ||
      ingredient.name.toLowerCase().includes('leavening') ||
      ingredient.name.toLowerCase().includes('salt') ||
      ingredient.name.toLowerCase().includes('pepper') ||
      ingredient.name.toLowerCase().includes('vanilla') ||
      ingredient.name.toLowerCase().includes('extract') ||
      ingredient.name.toLowerCase().includes('chili') ||
      ingredient.name.toLowerCase().includes('spices')) {
    finalScalingFactor = Math.min(scalingFactor, 2); // Max 2x scaling for spices
    console.log(`Limited scaling for spice ${ingredient.name}: ${scalingFactor} → ${finalScalingFactor}`);
  }

  // Only prevent scaling for spices (which should have 0 calories)
  // For other ingredients, use calculated calories even if original was 0
  if (calories === 0 && !isSpiceOrSeasoning) {
    console.log(`Warning: Zero calories for non-spice ${ingredient.name}, but this shouldn't happen after macro calculation`);
  }

  console.log(`🔢 Nutrition calculation for ${ingredient.name}:`);
  console.log(`   Amount: ${amount}${unit}, Base: ${actualBaseAmount}${actualBaseUnit}`);
  console.log(`   Scaling factor: ${finalScalingFactor}`);
  console.log(`   Base calories: ${calories}, Calculated: ${Math.round(calories * finalScalingFactor)}`);
  console.log(`🔢 Nutrition calculation: ${amount}${unit} = ${Math.round(calories * finalScalingFactor)} cal (base: ${calories} cal per ${actualBaseAmount}${actualBaseUnit})`);

  return {
    calories: Math.round(calories * finalScalingFactor),
    protein: Math.round(ingredient.protein * finalScalingFactor * 10) / 10,
    carbs: Math.round(ingredient.carbs * finalScalingFactor * 10) / 10,
    fat: Math.round(ingredient.fat * finalScalingFactor * 10) / 10,
    fiber: ingredient.fiber ? Math.round(ingredient.fiber * finalScalingFactor * 10) / 10 : 0,
    sugar: ingredient.sugar ? Math.round(ingredient.sugar * finalScalingFactor * 10) / 10 : 0,
    sodium: ingredient.sodium ? Math.round(ingredient.sodium * finalScalingFactor) : 0
  };
}

// Function to convert egg weights to egg quantities
function convertEggWeightToQuantity(amount: number, unit: string): { quantity: number, displayUnit: string } {
  // Average large egg weight is about 50g (egg white is about 33g)
  const averageEggWeight = 50; // grams
  const averageEggWhiteWeight = 33; // grams
  
  // Convert to grams
  let weightInGrams = amount;
  if (unit.toLowerCase() === 'g') {
    weightInGrams = amount;
  } else if (unit.toLowerCase() === 'ml') {
    weightInGrams = amount; // 1ml ≈ 1g for eggs
  } else if (unit.toLowerCase() === 'kg') {
    weightInGrams = amount * 1000;
  }
  
  // Calculate number of eggs and round to nearest whole egg
  const eggQuantity = Math.round(weightInGrams / averageEggWeight);
  
  // Format the display
  if (eggQuantity === 1) {
    return { quantity: 1, displayUnit: 'egg' };
  } else if (eggQuantity === 0) {
    return { quantity: 1, displayUnit: 'egg' }; // Minimum 1 egg
  } else {
    return { quantity: eggQuantity, displayUnit: 'eggs' };
  }
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
      preferences,
      healthMetrics,
      difficulty,
      cuisine,
      calorieGoal,
      generateImage
    } = body;

    if (!keywords || !mealType || !servings) {
      return NextResponse.json(
        { error: 'Missing required fields: keywords, mealType, servings' },
        { status: 400 }
      );
    }

    // Get comprehensive user data for personalization
    const [userProfile, foodPreferences, recentBiomarkers] = await Promise.all([
      // Get user's profile for health metrics and personal information
      prisma.profile.findUnique({
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

    // Parse JSON strings from profile if they exist
    if (userProfile) {
      try {
        if (userProfile.dietaryPreferences) {
          userProfile.dietaryPreferences = JSON.parse(userProfile.dietaryPreferences);
        }
        if (userProfile.privacySettings) {
          userProfile.privacySettings = JSON.parse(userProfile.privacySettings);
        }
      } catch (parseError) {
        console.error('Error parsing profile JSON fields:', parseError);
      }
    }

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
        height: userProfile?.height,
        weight: userProfile?.weight,
        activityLevel: userProfile?.activityLevel,
        calorieTarget: userProfile?.calorieTarget || undefined,
        dietaryPreferences: dietaryPreferences,
        fitnessGoals: (userProfile as any)?.fitnessGoals ? (typeof (userProfile as any).fitnessGoals === 'string' ? JSON.parse((userProfile as any).fitnessGoals) : (userProfile as any).fitnessGoals) : [],
        dietaryGoals: (userProfile as any)?.dietaryGoals ? (typeof (userProfile as any).dietaryGoals === 'string' ? JSON.parse((userProfile as any).dietaryGoals) : (userProfile as any).dietaryGoals) : [],
        weightGoals: (userProfile as any)?.weightGoals ? (typeof (userProfile as any).weightGoals === 'string' ? JSON.parse((userProfile as any).weightGoals) : (userProfile as any).weightGoals) : [],
        allergies: (userProfile as any)?.allergies ? (typeof (userProfile as any).allergies === 'string' ? JSON.parse((userProfile as any).allergies) : (userProfile as any).allergies) : []
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
    
    // Validate that the AI respected the servings parameter
    if (initialRecipe.servings !== servings) {
      console.warn(`⚠️ AI generated recipe for ${initialRecipe.servings} servings instead of requested ${servings} servings. Correcting...`);
      initialRecipe.servings = servings;
    }
    
    console.log('Initial recipe generated:', initialRecipe.name);

    // STEP 2: Use AI ingredient search for each ingredient
    console.log('Step 2: Using AI ingredient search...');
    const ingredientSearchResults: any[] = [];
    const resolvedIngredients: any[] = [];
    const unresolvedIngredients: any[] = [];

    // Pre-process ingredients to split combined ingredients like "Salt and Pepper"
    const processedIngredients: any[] = [];
    for (const ing of initialRecipe.ingredients || []) {
      const ingredientName = ing.name;
      
      // Check for combined ingredients that need to be split
      if (/salt\s+and\s+pepper/i.test(ingredientName) || 
          /pepper\s+and\s+salt/i.test(ingredientName) ||
          /salt\s*&\s*pepper/i.test(ingredientName) ||
          /pepper\s*&\s*salt/i.test(ingredientName) ||
          /salt\s*\+\s*pepper/i.test(ingredientName) ||
          /pepper\s*\+\s*salt/i.test(ingredientName)) {
        
        console.log(`🔧 Detected combined ingredient: "${ingredientName}" → splitting into Salt and Pepper`);
        
        // Split the amount between the two ingredients
        const splitAmount = Math.round((ing.amount || 0) / 2);
        
        // Add Salt ingredient
        processedIngredients.push({
          ...ing,
          name: 'Salt',
          amount: splitAmount,
          originalName: 'Salt'
        });
        
        // Add Pepper ingredient
        processedIngredients.push({
          ...ing,
          name: 'Pepper',
          amount: splitAmount,
          originalName: 'Pepper'
        });
      } else {
        // Keep original ingredient
        processedIngredients.push(ing);
      }
    }

    await Promise.all(
      processedIngredients.map(async (ing: any, index: number) => {
        const ingredientName = ing.name;
        console.log(`Searching for ingredient: ${ingredientName}`);
        
        // Check database mappings first (case-insensitive)
        let ingredientFound = false;
        
        console.log(`🔍 Checking database mapping for "${ingredientName}"`);
        
        // Try exact match first, then case-insensitive
        const dbMapping = await prisma.ingredientMapping.findFirst({
          where: {
            OR: [
              { keyword: ingredientName },
              { keyword: ingredientName.toLowerCase() }
            ],
            isActive: true
          },
          include: {
            ingredient: true
          }
        });
        
        console.log(`🔍 Database mapping query for "${ingredientName}": ${dbMapping ? `FOUND → ${dbMapping.ingredient.name}` : 'NOT FOUND'}`);
        
        if (dbMapping) {
          console.log(`✅ Using database mapping: ${ingredientName} → ${dbMapping.ingredient.name}`);
          
          const foundIngredient = dbMapping.ingredient;
          
          if (foundIngredient) {
            console.log(`✅ Found ingredient in database: ${foundIngredient.name}`);
            const nutrition = calculateIngredientNutrition(foundIngredient, ing.amount || 0, ing.unit || 'g');
            console.log(`🔢 Nutrition calculation: ${ing.amount}${ing.unit} = ${nutrition.calories} cal (base: ${foundIngredient.calories} cal per ${foundIngredient.servingSize})`);
            
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
            
            ingredientFound = true;
          }
        }
        
        // Only proceed with AI search if database mapping didn't work
        if (!ingredientFound) {
          console.log(`🔍 No database mapping found for "${ingredientName}", proceeding with AI search...`);
        
          
          // Only proceed with AI search if fallback didn't work
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
                const ingredientService = IngredientService.getInstance();
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
                  
                  if (searchTerm === 'oats' || searchTerm.includes('oats') || searchTerm.includes('oatmeal')) {
                    // Oats should only be in Grains and Flours category and contain "oat"
                    if (category !== 'grains and flours' || !name.includes('oat')) {
                      return false;
                    }
                  }
                  
                  if (searchTerm === 'egg' || searchTerm.includes('egg')) {
                    // Eggs should only be in Eggs and omelets category
                    if (category !== 'eggs and omelets' || !name.includes('egg')) {
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
                    'balsamic vinegar': ['vinegar, balsamic'],
                    'jalapeños': ['peppers, jalapenos'],
                    'jalapenos': ['peppers, jalapenos'],
                    'shredded cheese': ['cheese, mozzarella, low moisture, part-skim, shredded'],
                    'cheese': ['cheese, mozzarella, low moisture, part-skim, shredded'],
                    'mozzarella': ['cheese, mozzarella, low moisture, part-skim, shredded'],
                    'black beans': ['beans, black, mature seeds, raw'],
                    'canned black beans': ['beans, black, mature seeds, raw'],
                    'kidney beans': ['beans, kidney, red, mature seeds, raw'],
                    'chickpeas': ['chickpeas (garbanzo beans, bengal gram), mature seeds, raw'],
                    'garbanzo beans': ['chickpeas (garbanzo beans, bengal gram), mature seeds, raw']
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
          calorieTarget: userProfile?.calorieTarget || undefined,
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
    
    // Create a mapping of database names to original AI names from the resolved ingredients
    const originalNameMapping: { [key: string]: string } = {};
    resolvedIngredients.forEach(ing => {
      if (ing.resolvedIngredient && ing.originalName) {
        originalNameMapping[ing.resolvedIngredient.name] = ing.originalName;
      }
    });
    
    const finalResolvedIngredients = await Promise.all(
      (refinedRecipe.ingredients || []).map(async (ing: any, index: number) => {
        const ingredientName = ing.name;
        const originalName = originalNameMapping[ingredientName] || ingredientName; // Use original AI name if available
        
        console.log(`🔍 DEBUG: Processing ingredient - database name: "${ingredientName}", original AI name: "${originalName}"`);
        
        // First, check if we already resolved this ingredient in Step 2
        const existingResolution = resolvedIngredients.find(r => 
          r.originalName === originalName || 
          r.resolvedIngredient?.name === ingredientName
        );
        
        if (existingResolution && existingResolution.resolvedIngredient) {
          console.log(`✅ Using existing resolution for "${originalName}": ${existingResolution.resolvedIngredient.name}`);
          return {
            ...ing,
            ingredientId: existingResolution.resolvedIngredient.id,
            resolvedIngredient: existingResolution.resolvedIngredient,
            nutrition: existingResolution.nutrition,
            originalName: originalName,
            notes: originalName // Add notes field for frontend access
          };
        }
        
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
          
          // Special handling for salt and pepper to prevent wrong matches
          if (ingredientName.toLowerCase() === 'salt' || 
              ingredientName.toLowerCase() === 'table salt' ||
              ingredientName.toLowerCase() === 'sea salt' ||
              ingredientName.toLowerCase() === 'kosher salt') {
            console.log(`🔧 STEP4 FALLBACK: Force matching "${ingredientName}" to salt, table, iodized`);
            foundIngredient = await prisma.ingredient.findFirst({
              where: { name: 'salt, table, iodized', isActive: true }
            });
          } else if ((ingredientName.toLowerCase() === 'pepper' || 
                      ingredientName.toLowerCase() === 'black pepper' ||
                      ingredientName.toLowerCase() === 'ground black pepper') && 
                     !ingredientName.toLowerCase().includes('bell') &&
                     !ingredientName.toLowerCase().includes('cherry')) {
            console.log(`🔧 STEP4 FALLBACK: Force matching "${ingredientName}" to spices, pepper, black`);
            foundIngredient = await prisma.ingredient.findFirst({
              where: { name: 'spices, pepper, black', isActive: true }
            });
          } else {
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
                // Additional check to ensure the match is relevant
                const foundName = foundIngredient.name.toLowerCase();
                const searchName = ingredientName.toLowerCase();
                
                // Check if the found ingredient actually contains the main ingredient word
                const mainWords = searchName.split(' ').filter((word: string) => 
                  word.length > 2 && 
                  !['fresh', 'raw', 'ripe', 'large', 'small', 'medium', 'boneless', 'skinless'].includes(word)
                );
                
                const isRelevant = mainWords.some((word: string) => foundName.includes(word));
                
                if (isRelevant) {
                  console.log(`✅ Found ingredient with simplified name: ${simplifiedName} -> ${foundIngredient.name}`);
                  break;
                } else {
                  console.log(`⚠️  Found ingredient but not relevant: ${simplifiedName} -> ${foundIngredient.name} (skipping)`);
                  foundIngredient = null; // Reset to try next option
                }
              }
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
            originalName: originalName, // Preserve the original AI ingredient name
            notes: originalName // Add notes field for frontend access
          };
        } else {
          console.log(`❌ Ingredient not found: ${ingredientName}`);
          return {
            ...ing,
            ingredientId: null,
            resolvedIngredient: null,
            nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            originalName: originalName, // Preserve the original AI ingredient name even if not found
            notes: originalName // Add notes field for frontend access
          };
        }
      })
    );

    // Filter out unavailable ingredients and calculate total nutrition
    const availableIngredients = finalResolvedIngredients.filter(ing => !ing.unavailable && ing.ingredientId !== null);
    const unavailableIngredients = finalResolvedIngredients.filter(ing => ing.unavailable || ing.ingredientId === null);

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

    // Apply calorie goal scaling if provided or if user has a calorie target
    let finalRecipeData = refinedRecipe;
    let finalIngredientsList = finalResolvedIngredients;
    let finalPerServingNutrition = perServingNutrition;
    let scalingApplied = false;
    let scalingFactor = 1.0;
    let targetCalories = null;

    // Determine target calories: use provided calorieGoal or user's profile target
    const targetCaloriesPerServing = calorieGoal || userProfile?.calorieTarget;
    
    if (targetCaloriesPerServing && targetCaloriesPerServing > 0) {
      console.log(`🎯 Applying calorie goal scaling: ${targetCaloriesPerServing} cal per serving`);
      
      // Calculate target total calories for the recipe
      const targetTotalCalories = targetCaloriesPerServing * refinedRecipe.servings;
      const currentTotalCalories = totalNutrition.calories;
      
      // Calculate scaling factor
      scalingFactor = targetTotalCalories / currentTotalCalories;
      
      console.log(`📊 Scaling calculation:`);
      console.log(`   Current total calories: ${currentTotalCalories}`);
      console.log(`   Target total calories: ${targetTotalCalories}`);
      console.log(`   Scaling factor: ${scalingFactor.toFixed(2)}`);
      
      // Scale ingredients (limit spices to prevent excessive amounts)
      finalIngredientsList = finalResolvedIngredients.map(ing => {
        const isSpice = ing.resolvedIngredient?.category === 'Spices and Herbs' ||
                       ing.originalName?.toLowerCase().includes('salt') ||
                       ing.originalName?.toLowerCase().includes('pepper') ||
                       ing.originalName?.toLowerCase().includes('vanilla') ||
                       ing.originalName?.toLowerCase().includes('extract') ||
                       ing.originalName?.toLowerCase().includes('chili') ||
                       ing.originalName?.toLowerCase().includes('spices');
        
        let ingredientScalingFactor = scalingFactor;
        
        // Limit scaling for spices and seasonings to prevent excessive amounts
        if (isSpice) {
          ingredientScalingFactor = Math.min(scalingFactor, 2.0);
          console.log(`🔧 Limited scaling for spice "${ing.originalName}": ${scalingFactor.toFixed(2)} → ${ingredientScalingFactor.toFixed(2)}`);
        }
        
        const scaledAmount = Math.round(ing.amount * ingredientScalingFactor * 10) / 10;
        const scaledNutrition = {
          calories: Math.round(ing.nutrition.calories * ingredientScalingFactor),
          protein: Math.round(ing.nutrition.protein * ingredientScalingFactor * 10) / 10,
          carbs: Math.round(ing.nutrition.carbs * ingredientScalingFactor * 10) / 10,
          fat: Math.round(ing.nutrition.fat * ingredientScalingFactor * 10) / 10,
          fiber: ing.nutrition.fiber ? Math.round(ing.nutrition.fiber * ingredientScalingFactor * 10) / 10 : 0,
          sugar: ing.nutrition.sugar ? Math.round(ing.nutrition.sugar * ingredientScalingFactor * 10) / 10 : 0,
          sodium: ing.nutrition.sodium ? Math.round(ing.nutrition.sodium * ingredientScalingFactor) : 0
        };
        
        return {
          ...ing,
          amount: scaledAmount,
          originalAmount: ing.amount,
          scalingFactor: ingredientScalingFactor,
          nutrition: scaledNutrition
        };
      });
      
      // Calculate new nutrition totals
      const scaledTotalNutrition = finalIngredientsList.reduce((total, ing) => ({
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
      targetCalories = targetCaloriesPerServing;
      
      console.log(`✅ Recipe scaled successfully:`);
      console.log(`   New per-serving calories: ${finalPerServingNutrition.calories}`);
      console.log(`   Scaling factor: ${scalingFactor.toFixed(2)}`);
      console.log(`   Target achieved: ${Math.abs(finalPerServingNutrition.calories - targetCaloriesPerServing) <= 5 ? '✅' : '⚠️'}`);
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
      ingredients: finalIngredientsList
        .filter(ing => ing.ingredientId !== null) // Filter out unresolved ingredients
        .map(ing => {
          console.log(`🔍 DEBUG: Processing ingredient for database - originalName: "${ing.originalName}", name: "${ing.name}", notes: "${ing.notes}"`);
          return {
            ingredientId: ing.ingredientId,
            amount: ing.amount,
            unit: ing.unit,
            notes: ing.originalName, // Use the original AI ingredient name as notes
            isOptional: ing.isOptional,
            unavailable: ing.unavailable
          };
        }),
      unavailableIngredients: unavailableIngredients.map(ing => ing.originalName || ing.notes || 'Unknown ingredient')
    });

    // Generate image if requested
    let photoUrl = null;
    if (generateImage) {
      try {
        console.log('Generating image for recipe...');
        
        // Create a comprehensive prompt for image generation
        const recipeName = finalRecipeData.title || finalRecipeData.name;
        const recipeDescription = finalRecipeData.description || '';
        const imagePrompt = `A beautiful, appetizing photo of ${recipeName}. ${recipeDescription} The dish should be presented on a clean plate with good lighting, showing the final cooked result ready to eat. Professional food photography style.`;
        
        console.log('DEBUG: Recipe image prompt:', imagePrompt.substring(0, 100) + '...');
        
        // Import the image generation function directly
        const { generateImage } = await import('@/lib/services/ImageGenerationService');
        
        const imageResult = await generateImage({
          prompt: imagePrompt,
          textModel: 'gpt-4o-mini',
          quality: 'low',
          size: '1024x1024'
        });

        if (imageResult.success) {
          photoUrl = imageResult.imageUrl;
          
          // Update the recipe with the generated image URL
          await recipeService.updateRecipe(recipe.id, { photoUrl });
          console.log('Image generated and saved to recipe');
        } else {
          console.error('Failed to generate image:', imageResult.error);
        }
      } catch (error) {
        console.error('Error generating image:', error);
      }
    }

    // Format the response for the RecipeCard component
    const recipeCardData = {
      id: recipe.id,
      name: recipe.name,
      title: recipe.name, // Add title for compatibility
      description: recipe.description,
      mealType: recipe.mealType,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine,
      tags: recipe.tags,
      photoUrl: photoUrl,
      imageUrl: photoUrl, // Add imageUrl for compatibility
      instructions: Array.isArray(recipe.instructions) 
        ? recipe.instructions.join('\n')
        : recipe.instructions,
      isFavorite: false,
      isPublic: false,
      aiGenerated: true,
      originalQuery: keywords,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      ingredients: finalIngredientsList
        .filter(ing => !ing.unavailable) // Only include available ingredients in the main ingredients list
        .map(ing => ({
          id: ing.ingredientId || `temp-${Date.now()}-${Math.random()}`,
          amount: ing.amount,
          unit: ing.unit,
          notes: ing.originalName, // Use the original AI ingredient name as notes
          isOptional: ing.isOptional || false,
          order: ing.order || 0,
          name: ing.originalName, // Use the original AI ingredient name
          calories: ing.nutrition?.calories || 0,
          protein: ing.nutrition?.protein || 0,
          carbs: ing.nutrition?.carbs || 0,
          fat: ing.nutrition?.fat || 0,
          fiber: ing.nutrition?.fiber || 0,
          sugar: ing.nutrition?.sugar || 0,
          ingredient: ing.resolvedIngredient ? {
            id: ing.resolvedIngredient.id,
            name: ing.resolvedIngredient.name,
            category: ing.resolvedIngredient.category || '',
            aisle: ing.resolvedIngredient.aisle || '',
            calories: ing.resolvedIngredient.calories,
            protein: ing.resolvedIngredient.protein,
            carbs: ing.resolvedIngredient.carbs,
            fat: ing.resolvedIngredient.fat,
            fiber: ing.resolvedIngredient.fiber,
            sugar: ing.resolvedIngredient.sugar
          } : undefined
        })),
      nutrition: {
        totalCalories: finalPerServingNutrition.calories * refinedRecipe.servings,
        totalProtein: finalPerServingNutrition.protein * refinedRecipe.servings,
        totalCarbs: finalPerServingNutrition.carbs * refinedRecipe.servings,
        totalFat: finalPerServingNutrition.fat * refinedRecipe.servings,
        totalFiber: finalPerServingNutrition.fiber * refinedRecipe.servings,
        totalSugar: finalPerServingNutrition.sugar * refinedRecipe.servings,
        caloriesPerServing: finalPerServingNutrition.calories,
        proteinPerServing: finalPerServingNutrition.protein,
        carbsPerServing: finalPerServingNutrition.carbs,
        fatPerServing: finalPerServingNutrition.fat,
        fiberPerServing: finalPerServingNutrition.fiber,
        sugarPerServing: finalPerServingNutrition.sugar
      },
      scalingFactor: scalingFactor
    };

    return NextResponse.json({ 
      success: true,
      data: {
        message: `I've generated a delicious ${recipe.name} recipe for you! It serves ${recipe.servings} people and contains ${Math.round(finalPerServingNutrition.calories)} calories per serving.`,
        recipe: recipeCardData
      },
      componentJson: {
        type: 'RecipeCard',
        props: recipeCardData,
        quickReplies: [
          { label: 'Save recipe', value: 'I want to save this recipe to my favorites' },
          { label: 'Generate another', value: 'I want to generate another recipe' },
          { label: 'Print recipe', value: 'I want to print this recipe' },
          { label: 'Adjust calories', value: 'I want to adjust the calorie content of this recipe' }
        ]
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