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

async function seedUSDASample() {
  try {
    console.log('🌱 Starting USDA sample seeding (first 1000 items)...\n');
    
    const filePath = path.join(__dirname, '../ingredientData/FoodData_Central_branded_food_json_2025-04-24.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ USDA data file not found:', filePath);
      return;
    }

    console.log('📖 Reading first 1000 lines of USDA data file...');
    
    // Read file in chunks to get first 1000 lines
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    let buffer = '';
    let lineCount = 0;
    const maxLines = 1000;
    const lines = [];

    return new Promise((resolve, reject) => {
      fileStream.on('data', (chunk) => {
        buffer += chunk;
        const newLines = buffer.split('\n');
        buffer = newLines.pop(); // Keep incomplete line in buffer
        
        for (const line of newLines) {
          if (line.trim() && lineCount < maxLines) {
            lines.push(line);
            lineCount++;
          }
          if (lineCount >= maxLines) break;
        }
        
        if (lineCount >= maxLines) {
          fileStream.destroy();
        }
      });

      fileStream.on('end', async () => {
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

            if (processedCount % 100 === 0) {
              console.log(`⏳ Processed ${processedCount}/${lines.length} items... (Added: ${addedCount}, Skipped: ${skippedCount})`);
            }

            // Extract basic info
            const description = cleanDescription(foodItem.description);
            const servingSize = foodItem.servingSize;
            const servingSizeUnit = foodItem.servingSizeUnit;

            // Skip if no description or serving info
            if (!description || !servingSize || !servingSizeUnit) {
              skippedCount++;
              continue;
            }

            // Extract and normalize nutrition
            const rawNutrients = extractNutrients(foodItem.foodNutrients);
            const normalizedNutrients = normalizeNutritionValues(rawNutrients, servingSize, servingSizeUnit);

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
                category: 'Snacks',
                aisle: 'Snacks',
                isActive: true
              }
            });

            addedCount++;

          } catch (error) {
            errorCount++;
            if (errorCount <= 5) { // Only show first 5 errors
              console.error(`❌ Error processing item ${processedCount}:`, error.message);
            }
          }
        }

        console.log(`\n✅ USDA sample seeding completed!`);
        console.log(`📊 Summary:`);
        console.log(`  - Processed: ${processedCount} items`);
        console.log(`  - Added: ${addedCount} new ingredients`);
        console.log(`  - Skipped: ${skippedCount} (already exist or invalid)`);
        console.log(`  - Errors: ${errorCount}`);

        resolve();
      });

      fileStream.on('error', (error) => {
        console.error('❌ Error reading file:', error);
        reject(error);
      });
    });

  } catch (error) {
    console.error('❌ Error seeding USDA sample:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sample seeding
seedUSDASample(); 