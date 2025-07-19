const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Nutrient mapping from USDA to our database fields
const NUTRIENT_MAPPING = {
  // Energy
  1008: 'calories', // Energy (kcal)
  1062: 'calories', // Energy (kJ) - will convert to kcal
  
  // Macronutrients
  1003: 'protein', // Protein (g)
  1005: 'carbohydrate', // Carbohydrate (g)
  1004: 'fat', // Total lipid (fat) (g)
  1079: 'fiber', // Fiber, total dietary (g)
  2000: 'sugar', // Sugars, total including NLEA (g)
  
  // Minerals
  1093: 'sodium', // Sodium, Na (mg)
  1253: 'cholesterol', // Cholesterol (mg)
  
  // Fatty acids
  1258: 'saturatedFat', // Fatty acids, total saturated (g)
  1292: 'monounsaturatedFat', // Fatty acids, total monounsaturated (g)
  1293: 'polyunsaturatedFat', // Fatty acids, total polyunsaturated (g)
  1257: 'transFat', // Fatty acids, total trans (g)
};

function extractNutrientValue(foodNutrients, nutrientId) {
  if (!foodNutrients || !Array.isArray(foodNutrients)) return null;
  
  const nutrient = foodNutrients.find(n => {
    // Handle different nutrient structures
    if (n.nutrient && n.nutrient.id === nutrientId) return true;
    if (n.nutrientId === nutrientId) return true;
    return false;
  });
  
  if (!nutrient) return null;
  
  // Handle different value structures
  if (nutrient.amount !== undefined) return nutrient.amount;
  if (nutrient.value !== undefined) return nutrient.value;
  return null;
}

function processUsdaFood(food, fileType) {
  try {
    // Extract basic food information
    const name = food.description || 'Unknown Food';
    const fdcId = food.fdcId || food.ndbNumber || 'unknown';
    
    if (!name || name === 'Unknown Food' || name.trim() === '') {
      return null;
    }
    
    // Process nutrients
    const foodNutrients = food.foodNutrients || [];
    const nutrients = {};
    
    for (const [nutrientId, fieldName] of Object.entries(NUTRIENT_MAPPING)) {
      const value = extractNutrientValue(foodNutrients, parseInt(nutrientId));
      if (value !== null && value !== undefined) {
        // Convert kJ to kcal if needed
        if (nutrientId === '1062' && fieldName === 'calories') {
          nutrients[fieldName] = value / 4.184; // Convert kJ to kcal
        } else {
          nutrients[fieldName] = value;
        }
      }
    }
    
    // Skip if no calories or very low calories
    if (!nutrients.calories || nutrients.calories <= 0) {
      return null;
    }
    
    // Calculate net carbs
    const netCarbs = (nutrients.carbohydrate || 0) - (nutrients.fiber || 0);
    
    // Determine category and aisle
    let category = 'Other';
    let aisle = 'Pantry';
    
    if (fileType === 'foundation') {
      category = food.foodCategory?.description || 'Foundation Foods';
    } else if (fileType === 'legacy') {
      category = food.foodCategory?.description || 'Legacy Foods';
    } else if (fileType === 'survey') {
      category = 'Survey Foods';
    } else if (fileType === 'branded') {
      category = food.brandOwner ? 'Branded Foods' : 'Other';
    }
    
    // Determine aisle based on category
    if (category.toLowerCase().includes('vegetable') || category.toLowerCase().includes('fruit')) {
      aisle = 'Produce';
    } else if (category.toLowerCase().includes('dairy') || category.toLowerCase().includes('milk')) {
      aisle = 'Dairy & Eggs';
    } else if (category.toLowerCase().includes('meat') || category.toLowerCase().includes('poultry')) {
      aisle = 'Meat & Poultry';
    } else if (category.toLowerCase().includes('seafood') || category.toLowerCase().includes('fish')) {
      aisle = 'Seafood';
    } else if (category.toLowerCase().includes('grain') || category.toLowerCase().includes('bread')) {
      aisle = 'Bakery';
    }
    
    // Get serving size
    let servingSize = '100g';
    if (food.foodPortions && food.foodPortions.length > 0) {
      const portion = food.foodPortions[0];
      if (portion.gramWeight && portion.gramWeight > 0) {
        servingSize = `${portion.gramWeight}g`;
      }
    }
    
    return {
      name: name.trim(),
      description: name.trim(),
      servingSize,
      calories: nutrients.calories || 0,
      protein: nutrients.protein || 0,
      carbs: nutrients.carbohydrate || 0,
      fat: nutrients.fat || 0,
      fiber: nutrients.fiber || 0,
      sugar: nutrients.sugar || 0,
      sodium: nutrients.sodium || 0,
      cholesterol: nutrients.cholesterol || 0,
      saturatedFat: nutrients.saturatedFat || 0,
      monounsaturatedFat: nutrients.monounsaturatedFat || 0,
      polyunsaturatedFat: nutrients.polyunsaturatedFat || 0,
      transFat: nutrients.transFat || 0,
      netCarbs: netCarbs,
      category: category,
      aisle: aisle,
      isActive: true,
      usdaFdcId: fdcId.toString(),
      dataSource: fileType
    };
    
  } catch (error) {
    console.error(`Error processing food:`, error.message);
    return null;
  }
}

async function processUsdaFile(filePath, fileType, maxItems = 500) {
  console.log(`\n📁 Processing ${fileType}: ${path.basename(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return { processed: 0, skipped: 0, errors: 0 };
  }

  try {
    const stats = fs.statSync(filePath);
    console.log(`📊 File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Read a large sample of the file to get food objects
    const sampleSize = Math.min(50 * 1024 * 1024, stats.size); // 50MB or file size
    const fileHandle = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(sampleSize);
    const bytesRead = fs.readSync(fileHandle, buffer, 0, sampleSize, 0);
    fs.closeSync(fileHandle);
    
    const sampleData = buffer.toString('utf8', 0, bytesRead);
    
    // Find the main array key
    let mainKey = null;
    if (sampleData.includes('"FoundationFoods"')) {
      mainKey = 'FoundationFoods';
    } else if (sampleData.includes('"SRLegacyFoods"')) {
      mainKey = 'SRLegacyFoods';
    } else if (sampleData.includes('"SurveyFoods"')) {
      mainKey = 'SurveyFoods';
    } else if (sampleData.includes('"BrandedFoods"')) {
      mainKey = 'BrandedFoods';
    }
    
    if (!mainKey) {
      console.log(`❌ Could not determine main array key for ${fileType}`);
      return { processed: 0, skipped: 0, errors: 0 };
    }
    
    console.log(`📋 Main array key: ${mainKey}`);
    
    // Extract food objects using a more robust approach
    const foodObjects = extractFoodObjectsFromSample(sampleData, mainKey);
    console.log(`🔍 Found ${foodObjects.length} food objects in sample`);
    
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < Math.min(foodObjects.length, maxItems); i++) {
      try {
        const food = foodObjects[i];
        const ingredient = processUsdaFood(food, fileType);
        
        if (ingredient) {
          // Insert into database
          await prisma.ingredient.create({
            data: ingredient
          });
          processed++;
          
          if (processed % 50 === 0) {
            console.log(`   Processed ${processed} foods...`);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        if (errors < 5) { // Only show first few errors
          console.error(`   Error processing food ${i}:`, error.message);
        }
      }
    }
    
    console.log(`✅ ${fileType} processing complete!`);
    console.log(`   - Processed: ${processed} foods`);
    console.log(`   - Skipped: ${skipped} foods`);
    console.log(`   - Errors: ${errors} foods`);
    
    return { processed, skipped, errors };
    
  } catch (error) {
    console.error(`❌ Error processing ${fileType}:`, error.message);
    return { processed: 0, skipped: 0, errors: 0 };
  }
}

function extractFoodObjectsFromSample(sampleData, mainKey) {
  const objects = [];
  
  // Find the start of the main array
  const arrayStart = sampleData.indexOf(`"${mainKey}": [`);
  if (arrayStart === -1) {
    console.log(`❌ Could not find ${mainKey} array start`);
    return objects;
  }
  
  // Find the end of the array (simplified - just look for a reasonable end)
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  let arrayEnd = arrayStart;
  
  for (let i = arrayStart; i < sampleData.length; i++) {
    const char = sampleData[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          // End of a food object
          const objectStart = sampleData.lastIndexOf('{', i);
          if (objectStart !== -1) {
            try {
              const objectJson = sampleData.substring(objectStart, i + 1);
              const food = JSON.parse(objectJson);
              if (food.description && food.foodNutrients) {
                objects.push(food);
              }
            } catch (error) {
              // Skip invalid JSON
            }
          }
        }
      } else if (char === ']' && braceCount === 0) {
        // End of main array
        arrayEnd = i;
        break;
      }
    }
  }
  
  return objects;
}

async function seedAllUsdaIngredients() {
  console.log('🥗 Starting USDA ingredients seeding...');
  
  const ingredientDataPath = path.join(process.cwd(), 'ingredientData');
  
  if (!fs.existsSync(ingredientDataPath)) {
    console.log('❌ ingredientData folder not found');
    return;
  }
  
  // Clear existing ingredients first
  console.log('🗑️  Clearing existing ingredients...');
  await prisma.ingredient.deleteMany({});
  console.log('✅ Existing ingredients cleared');
  
  const files = [
    {
      path: path.join(ingredientDataPath, 'FoodData_Central_foundation_food_json_2025-04-24.json'),
      type: 'foundation'
    },
    {
      path: path.join(ingredientDataPath, 'FoodData_Central_sr_legacy_food_json_2018-04.json'),
      type: 'legacy'
    },
    {
      path: path.join(ingredientDataPath, 'surveyDownload.json'),
      type: 'survey'
    },
    {
      path: path.join(ingredientDataPath, 'FoodData_Central_branded_food_json_2025-04-24.json'),
      type: 'branded'
    }
  ];
  
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      const result = await processUsdaFile(file.path, file.type, 500); // Process 500 items per file
      totalProcessed += result.processed;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
    } else {
      console.log(`⚠️  File not found: ${file.path}`);
    }
  }
  
  const totalCount = await prisma.ingredient.count();
  
  console.log('\n🎉 USDA ingredients seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Total processed: ${totalProcessed} foods`);
  console.log(`   - Total skipped: ${totalSkipped} foods`);
  console.log(`   - Total errors: ${totalErrors} foods`);
  console.log(`   - Final ingredient count: ${totalCount}`);
}

async function main() {
  try {
    await seedAllUsdaIngredients();
  } catch (error) {
    console.error('❌ Error during USDA seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedAllUsdaIngredients }; 