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
  'Ethnic Foods': 'Snacks',
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

async function seedBrandedFoods() {
  try {
    console.log('🌱 Starting USDA branded foods seeding (corrected structure)...\n');
    
    const filePath = path.join(__dirname, '../ingredientData/FoodData_Central_branded_food_json_2025-04-24.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ USDA branded foods file not found:', filePath);
      return;
    }

    const stats = fs.statSync(filePath);
    console.log(`📖 File size: ${(stats.size / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log('📖 Reading USDA branded foods file...\n');
    
    // Read the file in chunks and process the JSON array
    const fileStream = fs.createReadStream(filePath, { 
      encoding: 'utf8',
      highWaterMark: 1024 * 1024 // 1MB chunks
    });

    let buffer = '';
    let processedCount = 0;
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let startTime = Date.now();
    let inArray = false;
    let braceCount = 0;
    let currentObject = '';
    let objectStart = -1;

    return new Promise((resolve, reject) => {
      fileStream.on('data', (chunk) => {
        buffer += chunk;
        
        // Process complete JSON objects from the buffer
        let pos = 0;
        
        while (pos < buffer.length) {
          // Find the start of the array
          if (!inArray) {
            const arrayStart = buffer.indexOf('"BrandedFoods": [', pos);
            if (arrayStart === -1) {
              // Haven't found the array yet, keep reading
              break;
            }
            inArray = true;
            pos = arrayStart + 17; // Skip past '"BrandedFoods": ['
            continue;
          }
          
          // Find the start of a JSON object
          if (objectStart === -1) {
            const bracePos = buffer.indexOf('{', pos);
            if (bracePos === -1) {
              // No more objects in this chunk
              break;
            }
            objectStart = bracePos;
            braceCount = 0;
            currentObject = '';
          }
          
          // Process the current object
          for (let i = objectStart; i < buffer.length; i++) {
            const char = buffer[i];
            currentObject += char;
            
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                // Complete object found
                try {
                  const foodItem = JSON.parse(currentObject);
                  processedCount++;

                  if (processedCount % 1000 === 0) {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const rate = processedCount / elapsed;
                    console.log(`⏳ Processed ${processedCount.toLocaleString()} items... (Added: ${addedCount}, Skipped: ${skippedCount}, Rate: ${rate.toFixed(0)}/sec)`);
                  }

                  // Extract basic info
                  const description = cleanDescription(foodItem.description);
                  const servingSize = foodItem.servingSize;
                  const servingSizeUnit = foodItem.servingSizeUnit;
                  const category = determineCategory(foodItem.brandedFoodCategory);
                  const aisle = determineAisle(category);

                  // Skip if no description or serving info
                  if (!description || !servingSize || !servingSizeUnit) {
                    skippedCount++;
                    pos = i + 1;
                    objectStart = -1;
                    continue;
                  }

                  // Extract and normalize nutrition
                  const rawNutrients = extractNutrients(foodItem.foodNutrients);
                  const normalizedNutrients = normalizeNutritionValues(rawNutrients, servingSize, servingSizeUnit);

                  // Process the ingredient asynchronously
                  (async () => {
                    try {
                      // Check if ingredient already exists
                      const existing = await prisma.ingredient.findFirst({
                        where: {
                          name: description.toLowerCase(),
                          isActive: true
                        }
                      });

                      if (existing) {
                        skippedCount++;
                        return;
                      }

                      // Create ingredient
                      await prisma.ingredient.create({
                        data: {
                          name: description.toLowerCase(),
                          description: `USDA branded food: ${foodItem.description}`,
                          servingSize: '100g',
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
                      if (errorCount <= 10) {
                        console.error(`❌ Error processing item ${processedCount}:`, error.message);
                      }
                    }
                  })();

                } catch (error) {
                  errorCount++;
                  if (errorCount <= 10) {
                    console.error(`❌ Error processing item ${processedCount}:`, error.message);
                  }
                }
                
                pos = i + 1;
                objectStart = -1;
                break;
              }
            }
          }
          
          // If we didn't complete the object, keep reading
          if (braceCount > 0) {
            break;
          }
        }
        
        // Keep only the unprocessed part of the buffer
        buffer = buffer.substring(pos);
      });

      fileStream.on('end', () => {
        const totalTime = (Date.now() - startTime) / 1000;
        console.log(`\n✅ USDA branded foods seeding completed!`);
        console.log(`📊 Summary:`);
        console.log(`  - Processed: ${processedCount.toLocaleString()} items`);
        console.log(`  - Added: ${addedCount.toLocaleString()} new ingredients`);
        console.log(`  - Skipped: ${skippedCount.toLocaleString()} (already exist or invalid)`);
        console.log(`  - Errors: ${errorCount}`);
        console.log(`  - Total time: ${totalTime.toFixed(1)} seconds`);
        console.log(`  - Average rate: ${(processedCount / totalTime).toFixed(0)} items/second`);
        resolve();
      });

      fileStream.on('error', (error) => {
        console.error('❌ Error reading file:', error);
        reject(error);
      });
    });

  } catch (error) {
    console.error('❌ Error seeding USDA branded foods:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedBrandedFoods(); 