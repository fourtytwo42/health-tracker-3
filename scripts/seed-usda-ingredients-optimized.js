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
      isActive: true
    };
    
  } catch (error) {
    console.error(`Error processing food:`, error.message);
    return null;
  }
}

async function processUsdaFile(filePath, fileType, maxItems = 1000) {
  console.log(`\n📁 Processing ${fileType}: ${path.basename(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return { processed: 0, skipped: 0, errors: 0 };
  }

  try {
    const stats = fs.statSync(filePath);
    console.log(`📊 File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    
    // For large files, use a more efficient approach
    const readStream = fs.createReadStream(filePath, { 
      encoding: 'utf8',
      highWaterMark: 512 * 1024 // 512KB chunks
    });
    
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    let buffer = '';
    let batch = [];
    const batchSize = 50; // Process in batches of 50
    const seenNames = new Set(); // Track seen names to avoid duplicates
    
    return new Promise((resolve, reject) => {
      readStream.on('data', (chunk) => {
        buffer += chunk;
        
        // Process complete food objects from buffer
        while (processed < maxItems) {
          // Look for the start of a food object
          const objectStart = buffer.indexOf('{"foodClass"');
          if (objectStart === -1) break;
          
          // Find the end of this object
          let braceCount = 0;
          let endIndex = objectStart;
          let inString = false;
          let escapeNext = false;
          
          for (let i = objectStart; i < buffer.length; i++) {
            const char = buffer[i];
            
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
              if (char === '{') braceCount++;
              if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  endIndex = i + 1;
                  break;
                }
              }
            }
          }
          
          if (braceCount === 0) {
            // Extract the complete object
            const objectJson = buffer.substring(objectStart, endIndex);
            
            try {
              const food = JSON.parse(objectJson);
              const ingredient = processUsdaFood(food, fileType);
              
              if (ingredient) {
                // Check for duplicate names
                if (seenNames.has(ingredient.name)) {
                  skipped++;
                } else {
                  seenNames.add(ingredient.name);
                  batch.push(ingredient);
                  
                  // Insert batch when it reaches the batch size
                  if (batch.length >= batchSize) {
                    insertBatch(batch).then(() => {
                      processed += batch.length;
                      if (processed % 200 === 0) {
                        console.log(`   Processed ${processed} foods...`);
                      }
                    }).catch((error) => {
                      errors += batch.length;
                      if (errors < 10) {
                        console.error(`   Batch insert error:`, error.message);
                      }
                    });
                    batch = [];
                  }
                }
              } else {
                skipped++;
              }
              
            } catch (error) {
              errors++;
              if (errors < 5) {
                console.error(`   JSON parse error:`, error.message);
              }
            }
            
            // Remove processed object from buffer
            buffer = buffer.substring(endIndex);
            
          } else {
            // Incomplete object, wait for more data
            break;
          }
        }
      });
      
      readStream.on('end', async () => {
        // Insert any remaining items in the batch
        if (batch.length > 0) {
          try {
            await insertBatch(batch);
            processed += batch.length;
          } catch (error) {
            errors += batch.length;
            console.error(`   Final batch insert error:`, error.message);
          }
        }
        
        console.log(`✅ ${fileType} processing complete!`);
        console.log(`   - Processed: ${processed} foods`);
        console.log(`   - Skipped: ${skipped} foods`);
        console.log(`   - Errors: ${errors} foods`);
        resolve({ processed, skipped, errors });
      });
      
      readStream.on('error', (error) => {
        console.error(`❌ Error reading ${fileType}:`, error.message);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error(`❌ Error processing ${fileType}:`, error.message);
    return { processed: 0, skipped: 0, errors: 0 };
  }
}

async function insertBatch(ingredients) {
  // Use createMany for batch insert (more efficient)
  try {
    await prisma.ingredient.createMany({
      data: ingredients,
      skipDuplicates: true // Skip duplicates based on unique constraints
    });
  } catch (error) {
    // Fallback to individual inserts if createMany fails
    for (const ingredient of ingredients) {
      try {
        await prisma.ingredient.create({
          data: ingredient
        });
      } catch (insertError) {
        // Skip duplicates and other errors
        continue;
      }
    }
  }
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
      type: 'foundation',
      maxItems: 500
    },
    {
      path: path.join(ingredientDataPath, 'FoodData_Central_sr_legacy_food_json_2018-04.json'),
      type: 'legacy',
      maxItems: 1000
    },
    {
      path: path.join(ingredientDataPath, 'surveyDownload.json'),
      type: 'survey',
      maxItems: 500
    },
    {
      path: path.join(ingredientDataPath, 'FoodData_Central_branded_food_json_2025-04-24.json'),
      type: 'branded',
      maxItems: 2000 // Limit branded foods due to file size
    }
  ];
  
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      try {
        const result = await processUsdaFile(file.path, file.type, file.maxItems);
        totalProcessed += result.processed;
        totalSkipped += result.skipped;
        totalErrors += result.errors;
      } catch (error) {
        console.error(`❌ Error processing ${file.type}:`, error.message);
      }
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