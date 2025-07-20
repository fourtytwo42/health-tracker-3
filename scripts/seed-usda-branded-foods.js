const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// USDA nutrient ID mappings to our database fields
const NUTRIENT_MAPPINGS = {
  1008: 'calories',      // Energy (kcal)
  1003: 'protein',       // Protein (g)
  1004: 'fat',          // Total lipid (fat) (g)
  1005: 'carbs',        // Carbohydrate, by difference (g)
  2000: 'sugar',        // Total Sugars (g)
  1079: 'fiber',        // Fiber, total dietary (g)
  1093: 'sodium',       // Sodium, Na (mg)
  1253: 'cholesterol',  // Cholesterol (mg)
  1258: 'saturatedFat', // Fatty acids, total saturated (g)
  1257: 'transFat'      // Fatty acids, total trans (g)
};

// Category mappings from USDA to our categories
const CATEGORY_MAPPINGS = {
  'Vegetable and Lentil Mixes': 'Vegetables',
  'Chewing Gum & Mints': 'Snacks',
  'Crusts & Dough': 'Baking Essentials',
  'Cake, Cookie & Cupcake Mixes': 'Baking Essentials',
  'Beverages': 'Beverages',
  'Dairy and Egg Products': 'Dairy',
  'Fruits and Fruit Juices': 'Fruits',
  'Cereal Grains and Pasta': 'Grains and Flours',
  'Spices and Herbs': 'Spices and Herbs',
  'Soups, Sauces, and Gravies': 'Condiments',
  'Snacks': 'Snacks',
  'Fats and Oils': 'Oils and Fats',
  'Sweets': 'Sweeteners',
  'Legumes and Legume Products': 'Proteins',
  'Poultry Products': 'Proteins',
  'Pork Products': 'Proteins',
  'Beef Products': 'Proteins',
  'Finfish and Shellfish Products': 'Proteins',
  'Sausages and Luncheon Meats': 'Proteins',
  'Baked Products': 'Breads and Grains',
  'Fast Foods': 'Snacks',
  'Restaurant Foods': 'Snacks',
  'Baby Foods': 'Snacks',
  'Breakfast Cereals': 'Grains and Flours',
  'Meals, Entrees, and Side Dishes': 'Snacks',
  'American Indian/Alaska Native Foods': 'Snacks',
  'Ethnic Foods': 'Snacks'
};

// Aisle mappings
const AISLE_MAPPINGS = {
  'Vegetables': 'Produce',
  'Fruits': 'Produce',
  'Dairy': 'Dairy',
  'Proteins': 'Meat',
  'Grains and Flours': 'Baking',
  'Baking Essentials': 'Baking',
  'Oils and Fats': 'Oils',
  'Condiments': 'Condiments',
  'Spices and Herbs': 'Spices',
  'Sweeteners': 'Baking',
  'Breads and Grains': 'Bread',
  'Snacks': 'Snacks',
  'Beverages': 'Beverages',
  'Canned Goods': 'Canned Goods'
};

function extractNutrients(foodNutrients) {
  const nutrients = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    cholesterol: 0,
    saturatedFat: 0,
    transFat: 0
  };

  if (!foodNutrients || !Array.isArray(foodNutrients)) {
    return nutrients;
  }

  foodNutrients.forEach(nutrient => {
    const nutrientId = nutrient.nutrient?.id;
    const amount = nutrient.amount || 0;
    const field = NUTRIENT_MAPPINGS[nutrientId];
    
    if (field) {
      nutrients[field] = amount;
    }
  });

  return nutrients;
}

function normalizeServingSize(servingSize, servingSizeUnit) {
  // Convert to grams or milliliters as required by our database
  if (!servingSize || !servingSizeUnit) {
    return '100g';
  }

  const size = parseFloat(servingSize);
  const unit = servingSizeUnit.toLowerCase();

  // Convert to 100g/ml equivalent
  if (unit === 'g' || unit === 'gram' || unit === 'grams') {
    return '100g';
  } else if (unit === 'ml' || unit === 'milliliter' || unit === 'milliliters') {
    return '100ml';
  } else if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') {
    // 1 oz = 28.35g
    return '100g';
  } else if (unit === 'cup' || unit === 'cups') {
    // Approximate: 1 cup = 240ml
    return '100ml';
  } else if (unit === 'tbsp' || unit === 'tablespoon' || unit === 'tablespoons') {
    // 1 tbsp = 15ml
    return '100ml';
  } else if (unit === 'tsp' || unit === 'teaspoon' || unit === 'teaspoons') {
    // 1 tsp = 5ml
    return '100ml';
  } else {
    // Default to grams
    return '100g';
  }
}

function normalizeNutritionValues(nutrients, servingSize, servingSizeUnit) {
  const size = parseFloat(servingSize);
  const unit = servingSizeUnit?.toLowerCase();
  
  if (!size || size === 0) {
    return nutrients;
  }

  // Convert to per 100g/ml values
  const multiplier = 100 / size;
  
  const normalized = {};
  Object.keys(nutrients).forEach(key => {
    normalized[key] = Math.round((nutrients[key] * multiplier) * 100) / 100;
  });

  return normalized;
}

function determineCategory(brandedFoodCategory) {
  return CATEGORY_MAPPINGS[brandedFoodCategory] || 'Snacks';
}

function determineAisle(category) {
  return AISLE_MAPPINGS[category] || 'Snacks';
}

function cleanDescription(description) {
  if (!description) return '';
  
  // Remove brand names and extra text
  let cleaned = description
    .replace(/^[A-Z\s]+,?\s*/, '') // Remove leading brand names
    .replace(/\s*,\s*[A-Z\s]+$/, '') // Remove trailing brand names
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .toLowerCase();
  
  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

async function seedUSDAFoods() {
  try {
    console.log('🌱 Starting USDA branded foods seeding...\n');
    
    const filePath = path.join(__dirname, '../ingredientData/FoodData_Central_branded_food_json_2025-04-24.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ USDA data file not found:', filePath);
      return;
    }

    console.log('📖 Reading USDA data file...');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse JSON - it's a JSONL format (one JSON object per line)
    const lines = fileContent.trim().split('\n');
    console.log(`📊 Found ${lines.length} food items to process\n`);

    let processedCount = 0;
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const line of lines) {
      try {
        if (!line.trim()) continue;
        
        const foodItem = JSON.parse(line);
        processedCount++;

        if (processedCount % 1000 === 0) {
          console.log(`⏳ Processed ${processedCount}/${lines.length} items...`);
        }

        // Extract basic info
        const description = cleanDescription(foodItem.description);
        const ingredients = foodItem.ingredients || '';
        const servingSize = foodItem.servingSize;
        const servingSizeUnit = foodItem.servingSizeUnit;
        const category = determineCategory(foodItem.brandedFoodCategory);
        const aisle = determineAisle(category);

        // Skip if no description or serving info
        if (!description || !servingSize || !servingSizeUnit) {
          skippedCount++;
          continue;
        }

        // Extract and normalize nutrition
        const rawNutrients = extractNutrients(foodItem.foodNutrients);
        const normalizedNutrients = normalizeNutritionValues(rawNutrients, servingSize, servingSizeUnit);
        const normalizedServingSize = normalizeServingSize(servingSize, servingSizeUnit);

        // Check if ingredient already exists
        const existing = await prisma.ingredient.findFirst({
          where: {
            name: description.toLowerCase(),
            isActive: true
          }
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        // Create ingredient
        await prisma.ingredient.create({
          data: {
            name: description.toLowerCase(),
            description: `USDA branded food: ${foodItem.description}`,
            servingSize: normalizedServingSize,
            calories: normalizedNutrients.calories,
            protein: normalizedNutrients.protein,
            carbs: normalizedNutrients.carbs,
            fat: normalizedNutrients.fat,
            fiber: normalizedNutrients.fiber,
            sugar: normalizedNutrients.sugar,
            sodium: normalizedNutrients.sodium,
            cholesterol: normalizedNutrients.cholesterol,
            saturatedFat: normalizedNutrients.saturatedFat,
            transFat: normalizedNutrients.transFat,
            category: category,
            aisle: aisle,
            isActive: true
          }
        });

        addedCount++;

      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing item ${processedCount}:`, error.message);
      }
    }

    console.log(`\n✅ USDA seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`  - Processed: ${processedCount} items`);
    console.log(`  - Added: ${addedCount} new ingredients`);
    console.log(`  - Skipped: ${skippedCount} (already exist or invalid)`);
    console.log(`  - Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ Error seeding USDA foods:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedUSDAFoods(); 