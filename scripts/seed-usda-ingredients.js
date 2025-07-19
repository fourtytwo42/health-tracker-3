const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Nutrient mapping from USDA to our database fields
const NUTRIENT_MAPPING = {
  // Energy
  1008: 'calories', // Energy (kcal)
  
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
  
  // Vitamins
  1106: 'vitaminA', // Vitamin A, IU (IU)
  1109: 'vitaminC', // Vitamin C, total ascorbic acid (mg)
  1114: 'vitaminD', // Vitamin D (D2 + D3), International Units (IU)
  1162: 'vitaminB12', // Vitamin B-12 (µg)
  1165: 'vitaminB6', // Vitamin B-6 (mg)
  1167: 'folate', // Folate, total (µg)
  
  // Minerals
  1098: 'calcium', // Calcium, Ca (mg)
  1099: 'iron', // Iron, Fe (mg)
  1100: 'magnesium', // Magnesium, Mg (mg)
  1101: 'phosphorus', // Phosphorus, P (mg)
  1102: 'potassium', // Potassium, K (mg)
  1103: 'zinc', // Zinc, Zn (mg)
};

async function processNutrients(foodNutrients) {
  const nutrients = {};
  
  if (!foodNutrients || !Array.isArray(foodNutrients)) {
    return nutrients;
  }
  
  foodNutrients.forEach(nutrient => {
    const nutrientId = nutrient.nutrientId;
    const value = nutrient.value;
    
    if (NUTRIENT_MAPPING[nutrientId] && value !== null && value !== undefined) {
      nutrients[NUTRIENT_MAPPING[nutrientId]] = value;
    }
  });
  
  return nutrients;
}

async function seedUsdaFile(filePath, fileType) {
  console.log(`\n📁 Processing ${fileType}: ${path.basename(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return { processed: 0, skipped: 0, errors: 0 };
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let foods;
    
    // Handle different file formats
    if (fileType === 'surveyDownload') {
      // surveyDownload.json has a different structure
      const data = JSON.parse(fileContent);
      foods = data.foods || [];
    } else {
      // Standard USDA files
      foods = JSON.parse(fileContent);
    }
    
    if (!Array.isArray(foods)) {
      console.log(`❌ Invalid data format in ${fileType}`);
      return { processed: 0, skipped: 0, errors: 0 };
    }
    
    console.log(`📊 Found ${foods.length} foods to process`);
    
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    let duplicates = 0;
    
    for (let i = 0; i < foods.length; i++) {
      try {
        const food = foods[i];
        
        // Extract basic food information
        const name = food.description || food.foodDescription || food.longDescription || 'Unknown Food';
        const fdcId = food.fdcId || food.ndbNumber || `unknown_${i}`;
        
        // Skip if no name or invalid data
        if (!name || name === 'Unknown Food' || name.trim() === '') {
          skipped++;
          continue;
        }
        
        // Process nutrients
        const nutrients = await processNutrients(food.foodNutrients);
        
        // Skip if no calories or very low calories (likely invalid data)
        if (!nutrients.calories || nutrients.calories <= 0) {
          skipped++;
          continue;
        }
        
        // Calculate net carbs
        const netCarbs = (nutrients.carbohydrate || 0) - (nutrients.fiber || 0);
        
        // Determine category based on food type and nutrients
        let category = 'Other';
        if (fileType === 'foundation') {
          category = food.foodCategory?.description || 'Foundation Foods';
        } else if (fileType === 'branded') {
          category = food.brandOwner ? 'Branded Foods' : 'Other';
        } else if (fileType === 'legacy') {
          category = food.foodCategory?.description || 'Legacy Foods';
        } else if (fileType === 'surveyDownload') {
          category = 'Survey Foods';
        }
        
        // Determine aisle based on category
        let aisle = 'Pantry';
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
        
        // Create ingredient object
        const ingredient = {
          name: name.trim(),
          description: name.trim(),
          servingSize: food.servingSize || '100g',
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
        
        // Fix serving size if it contains "undetermined"
        if (ingredient.servingSize && ingredient.servingSize.includes('undetermined')) {
          if (ingredient.name.toLowerCase().includes('wine')) {
            ingredient.servingSize = '5 fl oz (148ml)';
          } else if (ingredient.name.toLowerCase().includes('beer')) {
            ingredient.servingSize = '12 fl oz (355ml)';
          } else {
            ingredient.servingSize = '100g';
          }
        }
        
        // Try to create the ingredient
        try {
          await prisma.ingredient.create({
            data: ingredient
          });
          processed++;
        } catch (error) {
          if (error.code === 'P2002') {
            // Duplicate name, skip
            duplicates++;
          } else {
            throw error;
          }
        }
        
        // Progress update every 1000 items
        if ((i + 1) % 1000 === 0) {
          console.log(`   Processed ${i + 1}/${foods.length} foods (${Math.round((i + 1)/foods.length*100)}%)`);
        }
        
      } catch (error) {
        console.error(`   Error processing food ${i}:`, error.message);
        errors++;
      }
    }
    
    console.log(`✅ ${fileType} processing complete!`);
    console.log(`   - Processed: ${processed} foods`);
    console.log(`   - Skipped: ${skipped} foods`);
    console.log(`   - Duplicates: ${duplicates} foods`);
    console.log(`   - Errors: ${errors} foods`);
    
    return { processed, skipped, errors, duplicates };
    
  } catch (error) {
    console.error(`❌ Error processing ${fileType}:`, error.message);
    return { processed: 0, skipped: 0, errors: 0, duplicates: 0 };
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
      type: 'foundation'
    },
    {
      path: path.join(ingredientDataPath, 'FoodData_Central_sr_legacy_food_json_2018-04.json'),
      type: 'legacy'
    },
    {
      path: path.join(ingredientDataPath, 'surveyDownload.json'),
      type: 'surveyDownload'
    },
    {
      path: path.join(ingredientDataPath, 'FoodData_Central_branded_food_json_2025-04-24.json'),
      type: 'branded'
    }
  ];
  
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalDuplicates = 0;
  
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      const result = await seedUsdaFile(file.path, file.type);
      totalProcessed += result.processed;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
      totalDuplicates += result.duplicates;
    } else {
      console.log(`⚠️  File not found: ${file.path}`);
    }
  }
  
  const totalCount = await prisma.ingredient.count();
  
  console.log('\n🎉 USDA ingredients seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Total processed: ${totalProcessed} foods`);
  console.log(`   - Total skipped: ${totalSkipped} foods`);
  console.log(`   - Total duplicates: ${totalDuplicates} foods`);
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