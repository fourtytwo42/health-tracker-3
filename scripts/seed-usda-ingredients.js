const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// USDA nutrient ID mappings to our fields
const NUTRIENT_MAPPINGS = {
  1003: 'protein',           // Protein
  1004: 'fat',               // Total lipid (fat)
  1005: 'carbs',             // Carbohydrate, by difference
  1008: 'calories',          // Energy (kcal)
  1051: 'water',             // Water
  1087: 'calcium',           // Calcium, Ca
  1092: 'potassium',         // Potassium, K
  1093: 'sodium',            // Sodium, Na
  1253: 'cholesterol',       // Cholesterol
  1258: 'saturatedFat',      // Fatty acids, total saturated
  1292: 'monounsaturatedFat', // Fatty acids, total monounsaturated
  1293: 'polyunsaturatedFat', // Fatty acids, total polyunsaturated
  1257: 'transFat',          // Fatty acids, total trans
  1079: 'fiber',             // Fiber, total dietary
  2000: 'sugar',             // Sugars, total including NLEA
  1009: 'ash',               // Ash
  1062: 'energyKj',          // Energy (kJ)
};

// Category mappings from USDA to our comprehensive categories
const CATEGORY_MAPPINGS = {
  'Beef Products': 'Proteins - Meats (beef, pork, lamb, game)',
  'Pork Products': 'Proteins - Meats (beef, pork, lamb, game)',
  'Lamb, Veal, and Game Products': 'Proteins - Meats (beef, pork, lamb, game)',
  'Poultry Products': 'Proteins - Poultry (chicken, turkey, duck)',
  'Finfish and Shellfish Products': 'Proteins - Seafood (fish, shellfish)',
  'Dairy and Egg Products': 'Dairy & Alternatives - Milk, Yogurt, Cheese, Butter',
  'Legumes and Legume Products': 'Legumes & Pulses - Beans (black, kidney, navy)',
  'Vegetables and Vegetable Products': 'Vegetables - Leafy Greens (spinach, kale)',
  'Fruits and Fruit Juices': 'Fruits - Berries',
  'Cereal Grains and Pasta': 'Grains & Starches - Whole Grains (brown rice, quinoa)',
  'Fats and Oils': 'Fats & Oils - Cooking Oils (olive, avocado)',
  'Nut and Seed Products': 'Nuts & Seeds - Tree Nuts, Peanuts',
  'Baked Products': 'Bakery - Breads, Tortillas, Pastries',
  'Beverages': 'Beverages - Water, Tea, Coffee',
  'Sweets': 'Sweets & Snacks - Chocolate, Candy',
  'Spices and Herbs': 'Herbs & Spices - Fresh Herbs (basil, cilantro)',
  'Soups, Sauces, and Gravies': 'Condiments & Sauces - Mustards, Ketchups, Hot Sauces',
  'Sausages and Luncheon Meats': 'Proteins - Meats (beef, pork, lamb, game)',
  'Restaurant Foods': 'Pantry & Canned Goods - Canned Vegetables, Beans',
};

// Aisle mappings based on categories
const AISLE_MAPPINGS = {
  'Beef Products': 'meat',
  'Pork Products': 'meat',
  'Lamb, Veal, and Game Products': 'meat',
  'Poultry Products': 'meat',
  'Finfish and Shellfish Products': 'seafood',
  'Dairy and Egg Products': 'dairy',
  'Legumes and Legume Products': 'pantry',
  'Vegetables and Vegetable Products': 'produce',
  'Fruits and Fruit Juices': 'produce',
  'Cereal Grains and Pasta': 'pantry',
  'Fats and Oils': 'pantry',
  'Nut and Seed Products': 'pantry',
  'Baked Products': 'bakery',
  'Beverages': 'beverages',
  'Sweets': 'sweets',
  'Spices and Herbs': 'pantry',
  'Soups, Sauces, and Gravies': 'pantry',
  'Sausages and Luncheon Meats': 'meat',
  'Restaurant Foods': 'pantry',
};

function extractNutrientValue(foodNutrients, nutrientId) {
  const nutrient = foodNutrients.find(n => n.nutrient.id === nutrientId);
  return nutrient ? nutrient.amount : null;
}

function extractCalories(foodNutrients) {
  // Try multiple energy nutrient IDs
  const energyNutrientIds = [
    1008, // Energy (kcal) - primary
    1062, // Energy (kJ) - convert to kcal
    208   // Energy (kcal) - alternative
  ];
  
  for (const id of energyNutrientIds) {
    const nutrient = foodNutrients.find(n => n.nutrient.id === id);
    if (nutrient) {
      // If it's kJ, convert to kcal (1 kcal = 4.184 kJ)
      if (id === 1062) {
        return nutrient.amount / 4.184;
      }
      return nutrient.amount;
    }
  }
  
  // If no energy data found, calculate from macronutrients
  const protein = extractNutrientValue(foodNutrients, 1003) || 0;
  const carbs = extractNutrientValue(foodNutrients, 1005) || 0;
  const fat = extractNutrientValue(foodNutrients, 1004) || 0;
  
  // Calculate calories: 4 cal/g protein, 4 cal/g carbs, 9 cal/g fat
  const calculatedCalories = (protein * 4) + (carbs * 4) + (fat * 9);
  
  return calculatedCalories > 0 ? calculatedCalories : null;
}

function mapUsdaCategoryToOurCategory(usdaCategory) {
  return CATEGORY_MAPPINGS[usdaCategory] || 'Other';
}

function mapUsdaCategoryToAisle(usdaCategory) {
  return AISLE_MAPPINGS[usdaCategory] || 'pantry';
}

function generateDietaryFlags(foodNutrients, description) {
  const flags = [];
  
  // Check for common dietary restrictions
  const hasGluten = description.toLowerCase().includes('wheat') || 
                   description.toLowerCase().includes('gluten') ||
                   description.toLowerCase().includes('bread') ||
                   description.toLowerCase().includes('pasta');
  
  const hasDairy = description.toLowerCase().includes('milk') || 
                  description.toLowerCase().includes('cheese') ||
                  description.toLowerCase().includes('yogurt') ||
                  description.toLowerCase().includes('cream');
  
  const hasNuts = description.toLowerCase().includes('nut') || 
                 description.toLowerCase().includes('almond') ||
                 description.toLowerCase().includes('peanut');
  
  const hasSeafood = description.toLowerCase().includes('fish') || 
                    description.toLowerCase().includes('shrimp') ||
                    description.toLowerCase().includes('salmon');
  
  const hasEggs = description.toLowerCase().includes('egg');
  
  const hasSoy = description.toLowerCase().includes('soy') || 
                description.toLowerCase().includes('tofu');
  
  if (!hasGluten) flags.push('Gluten-Free');
  if (!hasDairy) flags.push('Dairy-Free');
  if (!hasNuts) flags.push('Nut-Free');
  if (!hasSeafood) flags.push('Seafood-Free');
  if (!hasEggs) flags.push('Egg-Free');
  if (!hasSoy) flags.push('Soy-Free');
  
  // Check if it's vegan (no animal products)
  if (!hasDairy && !hasEggs && !hasSeafood && 
      !description.toLowerCase().includes('beef') &&
      !description.toLowerCase().includes('pork') &&
      !description.toLowerCase().includes('chicken') &&
      !description.toLowerCase().includes('turkey')) {
    flags.push('Vegan');
  }
  
  return flags.join(', ');
}

function generateAllergens(description) {
  const allergens = [];
  
  if (description.toLowerCase().includes('wheat') || 
      description.toLowerCase().includes('gluten')) {
    allergens.push('Wheat');
  }
  
  if (description.toLowerCase().includes('milk') || 
      description.toLowerCase().includes('cheese') ||
      description.toLowerCase().includes('yogurt')) {
    allergens.push('Dairy');
  }
  
  if (description.toLowerCase().includes('nut') || 
      description.toLowerCase().includes('almond') ||
      description.toLowerCase().includes('peanut')) {
    allergens.push('Tree Nuts');
  }
  
  if (description.toLowerCase().includes('fish') || 
      description.toLowerCase().includes('shrimp') ||
      description.toLowerCase().includes('salmon')) {
    allergens.push('Fish');
  }
  
  if (description.toLowerCase().includes('egg')) {
    allergens.push('Eggs');
  }
  
  if (description.toLowerCase().includes('soy') || 
      description.toLowerCase().includes('tofu')) {
    allergens.push('Soy');
  }
  
  return allergens.join(', ');
}

function convertUsdaToIngredient(usdaFood) {
  const foodNutrients = usdaFood.foodNutrients || [];
  
  // Extract basic nutrient values
  const protein = extractNutrientValue(foodNutrients, 1003);
  const fat = extractNutrientValue(foodNutrients, 1004);
  const carbs = extractNutrientValue(foodNutrients, 1005);
  const calories = extractCalories(foodNutrients);
  const fiber = extractNutrientValue(foodNutrients, 1079);
  const sugar = extractNutrientValue(foodNutrients, 2000);
  const sodium = extractNutrientValue(foodNutrients, 1093);
  const cholesterol = extractNutrientValue(foodNutrients, 1253);
  const saturatedFat = extractNutrientValue(foodNutrients, 1258);
  const monounsaturatedFat = extractNutrientValue(foodNutrients, 1292);
  const polyunsaturatedFat = extractNutrientValue(foodNutrients, 1293);
  const transFat = extractNutrientValue(foodNutrients, 1257);
  
  // Calculate net carbs
  const netCarbs = carbs && fiber ? carbs - fiber : null;
  
  // Get serving size from food portions
  let servingSize = '100g'; // Default
  if (usdaFood.foodPortions && usdaFood.foodPortions.length > 0) {
    const portion = usdaFood.foodPortions[0];
    servingSize = `${portion.value} ${portion.measureUnit.name} (${portion.gramWeight}g)`;
  }
  
  // Map category and aisle
  const usdaCategory = usdaFood.foodCategory?.description || 'Other';
  const category = mapUsdaCategoryToOurCategory(usdaCategory);
  const aisle = mapUsdaCategoryToAisle(usdaCategory);
  
  // Generate dietary flags and allergens
  const dietaryFlags = generateDietaryFlags(foodNutrients, usdaFood.description);
  const allergens = generateAllergens(usdaFood.description);
  
  return {
    name: usdaFood.description,
    description: `USDA Foundation Food - ${usdaFood.foodClass}`,
    servingSize,
    calories: calories || 0,
    protein: protein || 0,
    carbs: carbs || 0,
    fat: fat || 0,
    fiber: fiber || null,
    sugar: sugar || null,
    sodium: sodium || null,
    cholesterol: cholesterol || null,
    saturatedFat: saturatedFat || null,
    monounsaturatedFat: monounsaturatedFat || null,
    polyunsaturatedFat: polyunsaturatedFat || null,
    transFat: transFat || null,
    netCarbs: netCarbs || null,
    glycemicIndex: null, // Not available in USDA data
    glycemicLoad: null,  // Not available in USDA data
    dietaryFlags,
    allergens,
    category,
    aisle,
    isActive: true
  };
}

async function seedUsdaIngredients() {
  try {
    console.log('Starting USDA ingredient seeding...');
    
    // Read USDA data
    const usdaDataPath = path.join(__dirname, '../Data/FoodData_Central_foundation_food_json_2025-04-24.json');
    const usdaData = JSON.parse(fs.readFileSync(usdaDataPath, 'utf8'));
    const foundationFoods = usdaData.FoundationFoods;
    
    console.log(`Found ${foundationFoods.length} USDA foundation foods`);
    
    // Convert and filter foods
    const ingredients = [];
    let processed = 0;
    let skipped = 0;
    
    for (const usdaFood of foundationFoods) {
      try {
        const ingredient = convertUsdaToIngredient(usdaFood);
        
        // Skip if missing essential data
        if (!ingredient.name) {
          skipped++;
          continue;
        }
        
        // Accept ingredients even with 0 calories if they have other nutritional data
        // Many spices, dried beans, and certain ingredients have 0 calories but are still valid
        const hasNutritionalData = ingredient.protein > 0 || ingredient.carbs > 0 || ingredient.fat > 0 || 
                                  ingredient.fiber > 0 || ingredient.sodium > 0 || ingredient.cholesterol > 0;
        
        if (ingredient.calories === 0 && !hasNutritionalData) {
          skipped++;
          continue;
        }
        
        ingredients.push(ingredient);
        processed++;
        
        if (processed % 50 === 0) {
          console.log(`Processed ${processed} ingredients...`);
        }
      } catch (error) {
        console.error(`Error processing food ${usdaFood.description}:`, error.message);
        skipped++;
      }
    }
    
    console.log(`\nConversion complete:`);
    console.log(`- Processed: ${processed}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Total ingredients to seed: ${ingredients.length}`);
    
    // Clear existing ingredients
    console.log('\nClearing existing ingredients...');
    await prisma.ingredient.deleteMany({});
    
    // Seed ingredients in batches
    const batchSize = 100;
    let seeded = 0;
    
    for (let i = 0; i < ingredients.length; i += batchSize) {
      const batch = ingredients.slice(i, i + batchSize);
      
      try {
        // Use individual inserts for SQLite compatibility
        for (const ingredient of batch) {
          try {
            await prisma.ingredient.create({
              data: ingredient
            });
            seeded++;
          } catch (error) {
            // Skip duplicates silently
            if (error.code === 'P2002') {
              // Duplicate key error, skip this ingredient
              continue;
            }
            console.error(`Error creating ingredient ${ingredient.name}:`, error.message);
          }
        }
        
        console.log(`Seeded batch ${Math.floor(i / batchSize) + 1}: ${seeded}/${ingredients.length} ingredients`);
      } catch (error) {
        console.error(`Error seeding batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }
    
    console.log(`\nSeeding complete! Total ingredients seeded: ${seeded}`);
    
    // Show some statistics
    const totalIngredients = await prisma.ingredient.count();
    console.log(`\nDatabase now contains ${totalIngredients} ingredients`);
    
    const categories = await prisma.ingredient.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });
    
    console.log('\nIngredients by category:');
    categories.forEach(cat => {
      console.log(`  ${cat.category}: ${cat._count.category}`);
    });
    
  } catch (error) {
    console.error('Error seeding USDA ingredients:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedUsdaIngredients()
    .then(() => {
      console.log('USDA ingredient seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('USDA ingredient seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedUsdaIngredients, convertUsdaToIngredient }; 