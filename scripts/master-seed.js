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
  'Vegetables and Vegetable Products': 'Vegetables',
  'Fruits and Fruit Juices': 'Fruits',
  'Dairy and Egg Products': 'Dairy',
  'Legumes and Legume Products': 'Proteins',
  'Cereal Grains and Pasta': 'Grains and Flours',
  'Spices and Herbs': 'Spices and Herbs',
  'Fats and Oils': 'Oils and Fats',
  'Sweets': 'Sweeteners',
  'Beverages': 'Beverages',
  'Poultry Products': 'Proteins',
  'Pork Products': 'Proteins',
  'Beef Products': 'Proteins',
  'Finfish and Shellfish Products': 'Proteins',
  'Sausages and Luncheon Meats': 'Proteins',
  'Baked Products': 'Breads and Grains',
  'Breakfast Cereals': 'Grains and Flours',
  'Meals, Entrees, and Side Dishes': 'Snacks',
  'American Indian/Alaska Native Foods': 'Snacks',
  'Ethnic Foods': 'Snacks',
  'Baby Foods': 'Snacks',
  'Fast Foods': 'Snacks',
  'Restaurant Foods': 'Snacks',
  'Vegetable and Lentil Mixes': 'Vegetables',
  'Chewing Gum & Mints': 'Snacks',
  'Crusts & Dough': 'Baking Essentials',
  'Cake, Cookie & Cupcake Mixes': 'Baking Essentials',
  'Soups, Sauces, and Gravies': 'Condiments',
  'Snacks': 'Snacks',
  'Cereal': 'Grains and Flours',
  'Rice': 'Grains and Flours'
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

function normalizeNutritionValues(nutrients, servingSize, servingSizeUnit) {
  const size = parseFloat(servingSize);
  
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

function determineCategory(foodCategory) {
  if (!foodCategory) return 'Snacks';
  
  // Handle both branded and foundation food category structures
  const categoryName = foodCategory.description || foodCategory;
  return CATEGORY_MAPPINGS[categoryName] || 'Snacks';
}

function determineAisle(category) {
  return AISLE_MAPPINGS[category] || 'Snacks';
}

function cleanDescription(description) {
  if (!description) return '';
  
  // Clean up the description
  let cleaned = description
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .toLowerCase();
  
  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

async function clearIngredients() {
  console.log('🗑️  Clearing all ingredients from database...');
  
  const deletedCount = await prisma.ingredient.deleteMany({
    where: {
      isActive: true
    }
  });
  
  console.log(`✅ Deleted ${deletedCount.count} ingredients\n`);
}

async function seedFoundationFoods() {
  console.log('🌱 Seeding Foundation Foods...');
  
  const filePath = path.join(__dirname, '../ingredientData/FoodData_Central_foundation_food_json_2025-04-24.json');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  Foundation foods file not found, skipping...');
    return { processed: 0, added: 0, skipped: 0, errors: 0 };
  }

  const stats = fs.statSync(filePath);
  console.log(`📖 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);
  const foods = data.FoundationFoods || [];
  
  console.log(`📊 Found ${foods.length} foundation foods to process`);
  
  let processedCount = 0;
  let addedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const foodItem of foods) {
    try {
      processedCount++;

      const description = cleanDescription(foodItem.description);
      const category = determineCategory(foodItem.foodCategory);
      const aisle = determineAisle(category);

      if (!description) {
        skippedCount++;
        continue;
      }

      // Foundation foods are already per 100g
      const nutrients = extractNutrients(foodItem.foodNutrients);

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
          description: `USDA foundation food: ${foodItem.description}`,
          servingSize: '100g',
          calories: nutrients.calories,
          protein: nutrients.protein,
          carbs: nutrients.carbs,
          fat: nutrients.fat,
          fiber: nutrients.fiber,
          sugar: nutrients.sugar,
          sodium: nutrients.sodium,
          cholesterol: nutrients.cholesterol,
          saturatedFat: nutrients.saturatedFat,
          transFat: nutrients.transFat,
          category: category,
          aisle: aisle,
          isActive: true
        }
      });

      addedCount++;

    } catch (error) {
      errorCount++;
      if (errorCount <= 5) {
        console.error(`❌ Error processing foundation food:`, error.message);
      }
    }
  }

  console.log(`✅ Foundation Foods: ${addedCount} added, ${skippedCount} skipped, ${errorCount} errors\n`);
  return { processed: processedCount, added: addedCount, skipped: skippedCount, errors: errorCount };
}

async function seedSurveyFoods() {
  console.log('🌱 Seeding Survey Foods...');
  
  const filePath = path.join(__dirname, '../ingredientData/surveyDownload.json');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  Survey foods file not found, skipping...');
    return { processed: 0, added: 0, skipped: 0, errors: 0 };
  }

  const stats = fs.statSync(filePath);
  console.log(`📖 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);
  const foods = data.SurveyFoods || [];
  
  console.log(`📊 Found ${foods.length} survey foods to process`);
  
  let processedCount = 0;
  let addedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const foodItem of foods) {
    try {
      processedCount++;

      const description = cleanDescription(foodItem.description);
      const category = determineCategory(foodItem.foodCategory);
      const aisle = determineAisle(category);

      if (!description) {
        skippedCount++;
        continue;
      }

      // Survey foods are already per 100g
      const nutrients = extractNutrients(foodItem.foodNutrients);

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
          description: `USDA survey food: ${foodItem.description}`,
          servingSize: '100g',
          calories: nutrients.calories,
          protein: nutrients.protein,
          carbs: nutrients.carbs,
          fat: nutrients.fat,
          fiber: nutrients.fiber,
          sugar: nutrients.sugar,
          sodium: nutrients.sodium,
          cholesterol: nutrients.cholesterol,
          saturatedFat: nutrients.saturatedFat,
          transFat: nutrients.transFat,
          category: category,
          aisle: aisle,
          isActive: true
        }
      });

      addedCount++;

    } catch (error) {
      errorCount++;
      if (errorCount <= 5) {
        console.error(`❌ Error processing survey food:`, error.message);
      }
    }
  }

  console.log(`✅ Survey Foods: ${addedCount} added, ${skippedCount} skipped, ${errorCount} errors\n`);
  return { processed: processedCount, added: addedCount, skipped: skippedCount, errors: errorCount };
}

async function seedLegacyFoods() {
  console.log('🌱 Seeding Legacy Foods...');
  
  const filePath = path.join(__dirname, '../ingredientData/FoodData_Central_sr_legacy_food_json_2018-04.json');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  Legacy foods file not found, skipping...');
    return { processed: 0, added: 0, skipped: 0, errors: 0 };
  }

  const stats = fs.statSync(filePath);
  console.log(`📖 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);
  const foods = data.SRLegacyFoods || [];
  
  console.log(`📊 Found ${foods.length} legacy foods to process`);
  
  let processedCount = 0;
  let addedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const foodItem of foods) {
    try {
      processedCount++;

      const description = cleanDescription(foodItem.description);
      const category = determineCategory(foodItem.foodCategory);
      const aisle = determineAisle(category);

      if (!description) {
        skippedCount++;
        continue;
      }

      // Legacy foods are already per 100g
      const nutrients = extractNutrients(foodItem.foodNutrients);

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
          description: `USDA legacy food: ${foodItem.description}`,
          servingSize: '100g',
          calories: nutrients.calories,
          protein: nutrients.protein,
          carbs: nutrients.carbs,
          fat: nutrients.fat,
          fiber: nutrients.fiber,
          sugar: nutrients.sugar,
          sodium: nutrients.sodium,
          cholesterol: nutrients.cholesterol,
          saturatedFat: nutrients.saturatedFat,
          transFat: nutrients.transFat,
          category: category,
          aisle: aisle,
          isActive: true
        }
      });

      addedCount++;

    } catch (error) {
      errorCount++;
      if (errorCount <= 5) {
        console.error(`❌ Error processing legacy food:`, error.message);
      }
    }
  }

  console.log(`✅ Legacy Foods: ${addedCount} added, ${skippedCount} skipped, ${errorCount} errors\n`);
  return { processed: processedCount, added: addedCount, skipped: skippedCount, errors: errorCount };
}

async function masterSeed() {
  console.log('🚀 Starting Master USDA Data Seeding Process...\n');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Clear all existing ingredients
    await clearIngredients();
    
    // Step 2: Seed Foundation Foods (smallest file first)
    const foundationResults = await seedFoundationFoods();
    
    // Step 3: Seed Survey Foods
    const surveyResults = await seedSurveyFoods();
    
    // Step 4: Seed Legacy Foods
    const legacyResults = await seedLegacyFoods();
    
    // Summary
    const totalTime = (Date.now() - startTime) / 1000;
    const totalAdded = foundationResults.added + surveyResults.added + legacyResults.added;
    const totalProcessed = foundationResults.processed + surveyResults.processed + legacyResults.processed;
    
    console.log('🎉 Master Seeding Completed Successfully!');
    console.log('=' .repeat(50));
    console.log(`📊 Summary:`);
    console.log(`  - Total Processed: ${totalProcessed.toLocaleString()}`);
    console.log(`  - Total Added: ${totalAdded.toLocaleString()}`);
    console.log(`  - Foundation Foods: ${foundationResults.added} added`);
    console.log(`  - Survey Foods: ${surveyResults.added} added`);
    console.log(`  - Legacy Foods: ${legacyResults.added} added`);
    console.log(`  - Total Time: ${totalTime.toFixed(1)} seconds`);
    console.log(`  - Average Rate: ${(totalProcessed / totalTime).toFixed(0)} items/second`);
    console.log('\n✅ Database now contains comprehensive USDA nutrition data!');
    
  } catch (error) {
    console.error('❌ Error during master seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the master seeding
masterSeed(); 