const fs = require('fs');
const path = require('path');

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
    
    // Map nutrient IDs to our fields
    const nutrientMapping = {
      1008: 'calories', // Energy (kcal)
      1003: 'protein', // Protein (g)
      1005: 'carbohydrate', // Carbohydrate (g)
      1004: 'fat', // Total lipid (fat) (g)
      1079: 'fiber', // Fiber, total dietary (g)
      2000: 'sugar', // Sugars, total including NLEA (g)
      1093: 'sodium', // Sodium, Na (mg)
      1253: 'cholesterol', // Cholesterol (mg)
      1258: 'saturatedFat', // Fatty acids, total saturated (g)
      1292: 'monounsaturatedFat', // Fatty acids, total monounsaturated (g)
      1293: 'polyunsaturatedFat', // Fatty acids, total polyunsaturated (g)
      1257: 'transFat', // Fatty acids, total trans (g)
    };
    
    for (const [nutrientId, fieldName] of Object.entries(nutrientMapping)) {
      const value = extractNutrientValue(foodNutrients, parseInt(nutrientId));
      if (value !== null && value !== undefined) {
        nutrients[fieldName] = value;
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

function processUsdaFile(filePath, fileType, maxItems = 1000) {
  console.log(`\n📁 Processing ${fileType}: ${path.basename(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return { processed: 0, skipped: 0, errors: 0 };
  }

  try {
    const stats = fs.statSync(filePath);
    console.log(`📊 File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Read the file in chunks to find the structure
    const fileHandle = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(1024 * 1024); // 1MB
    const bytesRead = fs.readSync(fileHandle, buffer, 0, buffer.length, 0);
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
    
    // Use streaming JSON parser for large files
    const { Transform } = require('stream');
    const { pipeline } = require('stream/promises');
    const { createReadStream } = require('fs');
    
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    let inMainArray = false;
    let braceCount = 0;
    let currentObject = '';
    let inString = false;
    let escapeNext = false;
    
    // Create a transform stream to process the JSON
    const jsonProcessor = new Transform({
      transform(chunk, encoding, callback) {
        const data = chunk.toString();
        
        for (let i = 0; i < data.length; i++) {
          const char = data[i];
          
          if (escapeNext) {
            escapeNext = false;
            currentObject += char;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            currentObject += char;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            currentObject += char;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
              currentObject += char;
            } else if (char === '}') {
              braceCount--;
              currentObject += char;
              
              if (braceCount === 0) {
                // Complete object found
                try {
                  const food = JSON.parse(currentObject);
                  const ingredient = processUsdaFood(food, fileType);
                  
                  if (ingredient) {
                    processed++;
                  } else {
                    skipped++;
                  }
                  
                  if (processed >= maxItems) {
                    console.log(`   Reached max items (${maxItems}), stopping...`);
                    break;
                  }
                  
                } catch (error) {
                  errors++;
                }
                
                currentObject = '';
              }
            } else {
              currentObject += char;
            }
          } else {
            currentObject += char;
          }
        }
        
        callback();
      }
    });
    
    // Process the file
    const readStream = createReadStream(filePath, { encoding: 'utf8' });
    
    // For now, let's use a simpler approach with the existing structure
    console.log(`⚠️  Using simplified processing for ${fileType}`);
    
    // Read a larger sample to get more data
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
    const largeBytesRead = fs.readSync(fileHandle, largeBuffer, 0, largeBuffer.length, 0);
    const largeSample = largeBuffer.toString('utf8', 0, largeBytesRead);
    
    // Extract JSON objects using regex
    const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    const matches = largeSample.match(objectRegex);
    
    if (matches) {
      for (let i = 0; i < Math.min(matches.length, maxItems); i++) {
        try {
          const food = JSON.parse(matches[i]);
          if (food.description && food.foodNutrients) {
            const ingredient = processUsdaFood(food, fileType);
            if (ingredient) {
              processed++;
            } else {
              skipped++;
            }
          }
        } catch (error) {
          errors++;
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

async function main() {
  console.log('🔍 USDA Schema Analysis - Simple Version');
  console.log('========================================');
  
  const files = [
    {
      path: path.join(process.cwd(), 'ingredientData', 'FoodData_Central_foundation_food_json_2025-04-24.json'),
      type: 'foundation'
    },
    {
      path: path.join(process.cwd(), 'ingredientData', 'FoodData_Central_sr_legacy_food_json_2018-04.json'),
      type: 'legacy'
    },
    {
      path: path.join(process.cwd(), 'ingredientData', 'surveyDownload.json'),
      type: 'survey'
    },
    {
      path: path.join(process.cwd(), 'ingredientData', 'FoodData_Central_branded_food_json_2025-04-24.json'),
      type: 'branded'
    }
  ];
  
  for (const file of files) {
    processUsdaFile(file.path, file.type, 100); // Process max 100 items per file for testing
  }
}

main().catch(console.error); 