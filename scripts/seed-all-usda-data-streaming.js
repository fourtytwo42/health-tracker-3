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
  2000: 'sugar',             // Total Sugars (Survey format)
  1063: 'sugar',             // Sugars, Total (Foundation format)
  1002: 'nitrogen',          // Nitrogen (for protein calculation)
};

// Category mappings based on food category descriptions
const CATEGORY_MAPPINGS = {
  'Dairy and Egg Products': 'Dairy',
  'Spices and Herbs': 'Spices & Herbs',
  'Baby Foods': 'Baby Food',
  'Fats and Oils': 'Fats & Oils',
  'Poultry Products': 'Meat & Poultry',
  'Soups, Sauces, and Gravies': 'Soups & Sauces',
  'Sausages and Luncheon Meats': 'Meat & Poultry',
  'Breakfast Cereals': 'Grains & Cereals',
  'Fruits and Fruit Juices': 'Fruits',
  'Pork Products': 'Meat & Poultry',
  'Vegetables and Vegetable Products': 'Vegetables',
  'Nut and Seed Products': 'Nuts & Seeds',
  'Beef Products': 'Meat & Poultry',
  'Beverages': 'Beverages',
  'Finfish and Shellfish Products': 'Seafood',
  'Legumes and Legume Products': 'Legumes',
  'Lamb, Veal, and Game Products': 'Meat & Poultry',
  'Baked Products': 'Baked Goods',
  'Sweets': 'Sweets & Desserts',
  'Cereal Grains and Pasta': 'Grains & Cereals',
  'Fast Foods': 'Fast Food',
  'Meals, Entrees, and Side Dishes': 'Meals & Entrees',
  'Snacks': 'Snacks',
  'American Indian/Alaska Native Foods': 'Ethnic Foods',
  'Restaurant Foods': 'Restaurant Foods',
  'Human milk': 'Dairy',
  'Milk, reduced fat': 'Dairy',
  'Milk, whole': 'Dairy',
};

// Aisle mappings based on categories
const AISLE_MAPPINGS = {
  'Dairy': 'Dairy & Eggs',
  'Meat & Poultry': 'Meat & Seafood',
  'Vegetables': 'Produce',
  'Fruits': 'Produce',
  'Grains & Cereals': 'Pantry',
  'Nuts & Seeds': 'Pantry',
  'Legumes': 'Pantry',
  'Beverages': 'Beverages',
  'Fats & Oils': 'Pantry',
  'Spices & Herbs': 'Pantry',
  'Baked Goods': 'Bakery',
  'Sweets & Desserts': 'Bakery',
  'Snacks': 'Snacks',
  'Fast Food': 'Frozen',
  'Meals & Entrees': 'Frozen',
  'Restaurant Foods': 'Frozen',
  'Ethnic Foods': 'International',
  'Baby Food': 'Baby',
  'Seafood': 'Meat & Seafood',
  'Soups & Sauces': 'Pantry',
};

function extractNutrientValue(foodNutrients, nutrientId) {
  const nutrient = foodNutrients.find(n => n.nutrient?.id === nutrientId);
  if (!nutrient) return 0;
  
  // Handle different data structures
  if (nutrient.amount !== undefined) return nutrient.amount;
  if (nutrient.median !== undefined) return nutrient.median;
  if (nutrient.dataPoints && nutrient.dataPoints > 0) {
    return nutrient.median || nutrient.amount || 0;
  }
  return 0;
}

function getCategoryFromDescription(description, foodCategory) {
  // Try to match from food category first
  if (foodCategory?.description) {
    const category = CATEGORY_MAPPINGS[foodCategory.description];
    if (category) return category;
  }
  
  // Try to match from description
  const desc = description.toLowerCase();
  if (desc.includes('milk') || desc.includes('cheese') || desc.includes('yogurt')) return 'Dairy';
  if (desc.includes('chicken') || desc.includes('beef') || desc.includes('pork') || desc.includes('turkey')) return 'Meat & Poultry';
  if (desc.includes('apple') || desc.includes('banana') || desc.includes('orange') || desc.includes('berry')) return 'Fruits';
  if (desc.includes('broccoli') || desc.includes('carrot') || desc.includes('spinach') || desc.includes('tomato')) return 'Vegetables';
  if (desc.includes('bread') || desc.includes('pasta') || desc.includes('rice') || desc.includes('cereal')) return 'Grains & Cereals';
  if (desc.includes('salmon') || desc.includes('tuna') || desc.includes('shrimp') || desc.includes('fish')) return 'Seafood';
  
  return 'Other';
}

function getAisleFromCategory(category) {
  return AISLE_MAPPINGS[category] || 'Other';
}

function processBrandedFood(food) {
  const nutrients = food.foodNutrients || [];
  
  const ingredientData = {
    name: food.description || food.brandOwner + ' ' + food.description,
    description: food.description || '',
    servingSize: '100g',
    calories: extractNutrientValue(nutrients, 1008),
    protein: extractNutrientValue(nutrients, 1003),
    carbs: extractNutrientValue(nutrients, 1005),
    fat: extractNutrientValue(nutrients, 1004),
    fiber: extractNutrientValue(nutrients, 1079),
    sugar: extractNutrientValue(nutrients, 2000) || extractNutrientValue(nutrients, 1063),
    sodium: extractNutrientValue(nutrients, 1093),
    cholesterol: extractNutrientValue(nutrients, 1253),
    saturatedFat: extractNutrientValue(nutrients, 1258),
    monounsaturatedFat: extractNutrientValue(nutrients, 1292),
    polyunsaturatedFat: extractNutrientValue(nutrients, 1293),
    transFat: extractNutrientValue(nutrients, 1257),
    netCarbs: 0, // Will be calculated
    glycemicIndex: 0,
    glycemicLoad: 0,
    dietaryFlags: '',
    allergens: '',
    category: getCategoryFromDescription(food.description, food.foodCategory),
    aisle: '',
    isActive: true
  };
  
  ingredientData.aisle = getAisleFromCategory(ingredientData.category);
  ingredientData.netCarbs = ingredientData.carbs - ingredientData.fiber;
  
  return ingredientData;
}

function processFoundationFood(food) {
  const nutrients = food.foodNutrients || [];
  
  const ingredientData = {
    name: food.description || '',
    description: food.description || '',
    servingSize: '100g',
    calories: extractNutrientValue(nutrients, 1008),
    protein: extractNutrientValue(nutrients, 1003),
    carbs: extractNutrientValue(nutrients, 1005),
    fat: extractNutrientValue(nutrients, 1004),
    fiber: extractNutrientValue(nutrients, 1079),
    sugar: extractNutrientValue(nutrients, 2000) || extractNutrientValue(nutrients, 1063),
    sodium: extractNutrientValue(nutrients, 1093),
    cholesterol: extractNutrientValue(nutrients, 1253),
    saturatedFat: extractNutrientValue(nutrients, 1258),
    monounsaturatedFat: extractNutrientValue(nutrients, 1292),
    polyunsaturatedFat: extractNutrientValue(nutrients, 1293),
    transFat: extractNutrientValue(nutrients, 1257),
    netCarbs: 0, // Will be calculated
    glycemicIndex: 0,
    glycemicLoad: 0,
    dietaryFlags: '',
    allergens: '',
    category: getCategoryFromDescription(food.description, food.foodCategory),
    aisle: '',
    isActive: true
  };
  
  ingredientData.aisle = getAisleFromCategory(ingredientData.category);
  ingredientData.netCarbs = ingredientData.carbs - ingredientData.fiber;
  
  return ingredientData;
}

function processLegacyFood(food) {
  const nutrients = food.foodNutrients || [];
  
  const ingredientData = {
    name: food.description || '',
    description: food.description || '',
    servingSize: '100g',
    calories: extractNutrientValue(nutrients, 1008),
    protein: extractNutrientValue(nutrients, 1003),
    carbs: extractNutrientValue(nutrients, 1005),
    fat: extractNutrientValue(nutrients, 1004),
    fiber: extractNutrientValue(nutrients, 1079),
    sugar: extractNutrientValue(nutrients, 2000) || extractNutrientValue(nutrients, 1063),
    sodium: extractNutrientValue(nutrients, 1093),
    cholesterol: extractNutrientValue(nutrients, 1253),
    saturatedFat: extractNutrientValue(nutrients, 1258),
    monounsaturatedFat: extractNutrientValue(nutrients, 1292),
    polyunsaturatedFat: extractNutrientValue(nutrients, 1293),
    transFat: extractNutrientValue(nutrients, 1257),
    netCarbs: 0, // Will be calculated
    glycemicIndex: 0,
    glycemicLoad: 0,
    dietaryFlags: '',
    allergens: '',
    category: getCategoryFromDescription(food.description, food.foodCategory),
    aisle: '',
    isActive: true
  };
  
  ingredientData.aisle = getAisleFromCategory(ingredientData.category);
  ingredientData.netCarbs = ingredientData.carbs - ingredientData.fiber;
  
  return ingredientData;
}

function processSurveyFood(food) {
  const nutrients = food.foodNutrients || [];
  
  const ingredientData = {
    name: food.description || '',
    description: food.description || '',
    servingSize: '100g',
    calories: extractNutrientValue(nutrients, 1008),
    protein: extractNutrientValue(nutrients, 1003),
    carbs: extractNutrientValue(nutrients, 1005),
    fat: extractNutrientValue(nutrients, 1004),
    fiber: extractNutrientValue(nutrients, 1079),
    sugar: extractNutrientValue(nutrients, 2000) || extractNutrientValue(nutrients, 1063),
    sodium: extractNutrientValue(nutrients, 1093),
    cholesterol: extractNutrientValue(nutrients, 1253),
    saturatedFat: extractNutrientValue(nutrients, 1258),
    monounsaturatedFat: extractNutrientValue(nutrients, 1292),
    polyunsaturatedFat: extractNutrientValue(nutrients, 1293),
    transFat: extractNutrientValue(nutrients, 1257),
    netCarbs: 0, // Will be calculated
    glycemicIndex: 0,
    glycemicLoad: 0,
    dietaryFlags: '',
    allergens: '',
    category: getCategoryFromDescription(food.description, food.wweiaFoodCategory),
    aisle: '',
    isActive: true
  };
  
  ingredientData.aisle = getAisleFromCategory(ingredientData.category);
  ingredientData.netCarbs = ingredientData.carbs - ingredientData.fiber;
  
  return ingredientData;
}

async function processFoundationFoods() {
  console.log('Processing foundation foods...');
  const foundationData = JSON.parse(fs.readFileSync(path.join(__dirname, '../Data/FoodData_Central_foundation_food_json_2025-04-24.json'), 'utf8'));
  const foundationFoods = foundationData.FoundationFoods || [];
  
  let added = 0;
  for (const food of foundationFoods) {
    try {
      const ingredientData = processFoundationFood(food);
      
      // Skip if missing essential data
      if (!ingredientData.name || ingredientData.calories === 0) continue;
      
      await prisma.ingredient.create({
        data: ingredientData
      });
      added++;
      
      if (added % 50 === 0) {
        console.log(`Added ${added} foundation ingredients...`);
      }
    } catch (error) {
      console.error(`Error processing foundation food: ${error.message}`);
    }
  }
  return added;
}

async function processSurveyFoods() {
  console.log('Processing survey foods...');
  const surveyData = JSON.parse(fs.readFileSync(path.join(__dirname, '../Data/surveyDownload.json'), 'utf8'));
  const surveyFoods = surveyData.SurveyFoods || [];
  
  let added = 0;
  for (const food of surveyFoods.slice(0, 500)) { // Limit to first 500 for performance
    try {
      const ingredientData = processSurveyFood(food);
      
      // Skip if missing essential data
      if (!ingredientData.name || ingredientData.calories === 0) continue;
      
      await prisma.ingredient.create({
        data: ingredientData
      });
      added++;
      
      if (added % 50 === 0) {
        console.log(`Added ${added} survey ingredients...`);
      }
    } catch (error) {
      console.error(`Error processing survey food: ${error.message}`);
    }
  }
  return added;
}

async function processLegacyFoods() {
  console.log('Processing legacy foods...');
  const legacyData = JSON.parse(fs.readFileSync(path.join(__dirname, '../Data/FoodData_Central_sr_legacy_food_json_2018-04.json'), 'utf8'));
  const legacyFoods = legacyData.SR_LegacyFoods || [];
  
  let added = 0;
  for (const food of legacyFoods.slice(0, 500)) { // Limit to first 500 for performance
    try {
      const ingredientData = processLegacyFood(food);
      
      // Skip if missing essential data
      if (!ingredientData.name || ingredientData.calories === 0) continue;
      
      await prisma.ingredient.create({
        data: ingredientData
      });
      added++;
      
      if (added % 50 === 0) {
        console.log(`Added ${added} legacy ingredients...`);
      }
    } catch (error) {
      console.error(`Error processing legacy food: ${error.message}`);
    }
  }
  return added;
}

async function seedAllUSDAData() {
  console.log('Starting USDA data seeding...');
  
  try {
    // Check if we already have ingredients
    const existingCount = await prisma.ingredient.count();
    if (existingCount > 0) {
      console.log(`Database already contains ${existingCount} ingredients. Skipping seeding.`);
      return;
    }
    
    let totalAdded = 0;
    
    // Process Foundation Foods (smaller file)
    const foundationAdded = await processFoundationFoods();
    totalAdded += foundationAdded;
    
    // Process Survey Foods
    const surveyAdded = await processSurveyFoods();
    totalAdded += surveyAdded;
    
    // Process Legacy Foods
    const legacyAdded = await processLegacyFoods();
    totalAdded += legacyAdded;
    
    console.log(`\nSeeding completed!`);
    console.log(`Total added: ${totalAdded}`);
    console.log(`Foundation foods: ${foundationAdded}`);
    console.log(`Survey foods: ${surveyAdded}`);
    console.log(`Legacy foods: ${legacyAdded}`);
    
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedAllUSDAData(); 