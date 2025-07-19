const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Create a Prisma client for the portable database
const portablePrisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(process.cwd(), 'data', 'health-tracker-data.db')}`,
    },
  },
});

// Main database for clearing existing data
const mainPrisma = new PrismaClient();

async function createPortableDatabase() {
  console.log('🗄️  Creating Portable Pre-seeded Database...\n');

  try {
    // Ensure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create the portable database file if it doesn't exist
    const dbPath = path.join(dataDir, 'health-tracker-data.db');
    if (!fs.existsSync(dbPath)) {
      // Create an empty database file
      fs.writeFileSync(dbPath, '');
      console.log('📁 Created empty portable database file');
    }

    // Push the schema to the portable database to create tables
    console.log('🔧 Setting up database schema...');
    const { execSync } = require('child_process');
    try {
      execSync(`npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss`, {
        env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
        stdio: 'inherit'
      });
      console.log('✅ Schema pushed to portable database');
    } catch (error) {
      console.log('⚠️  Schema push failed, continuing with existing schema...');
    }

    console.log('🗑️  Clearing existing ingredients and exercises...');
    
    // Clear ingredients and exercises from portable database
    await portablePrisma.ingredient.deleteMany({});
    console.log('✅ Ingredients cleared');
    await portablePrisma.exercise.deleteMany({});
    console.log('✅ Exercises cleared');

    console.log('\n🏃 Seeding ALL exercises from CSV...');
    await seedAllExercises();

    console.log('\n🥗 Seeding ALL ingredients from JSON files...');
    await seedAllIngredients();

    console.log('\n📦 Creating portable database...');
    
    // Create setup scripts
    createSetupScripts();
    
    console.log('✅ Portable database created successfully!');
    console.log(`📁 Location: ${dbPath}`);
    
    const stats = fs.statSync(dbPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Size: ${sizeMB} MB`);
    
    console.log('📜 Setup script created: setup-data.sh');
    console.log('📜 Windows setup script created: setup-data.bat');
    
    console.log('\n🎉 Portable database creation completed!');
    console.log('\n📋 What\'s included:');
    console.log('   - ALL USDA ingredients (foundation, legacy, branded foods)');
    console.log('   - ALL exercise data (1,000+ activities with MET values)');
    console.log('   - Complete nutrition data for all ingredients');
    console.log('   - Exercise MET values and calorie burn rates');
    
    console.log('\n🚀 Next steps:');
    console.log('1. The pre-seeded database is ready at: data/health-tracker-data.db');
    console.log('2. Users can run: ./setup-data.sh (Unix) or setup-data.bat (Windows)');
    console.log('3. Or manually copy: data/health-tracker-data.db to prisma/dev.db');
    console.log('4. Users will still need to create their own accounts in the app');

  } catch (error) {
    console.error('❌ Error creating portable database:', error);
  } finally {
    await portablePrisma.$disconnect();
    await mainPrisma.$disconnect();
  }
}

// Function to seed all exercises from CSV
async function seedAllExercises() {
  return new Promise((resolve, reject) => {
    const exercises = [];
    const csvPath = path.join(process.cwd(), 'excerciseData', 'met.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`);
      reject(new Error('CSV file not found'));
      return;
    }
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Skip header row and empty rows
        if (row.Actvitiy && row.Code && row.MET && row.Description) {
          exercises.push({
            activity: row.Actvitiy,
            code: row.Code,
            description: row.Description,
            met: parseFloat(row.MET),
            category: row.Actvitiy, // Use activity as category
            intensity: getIntensityFromMET(parseFloat(row.MET)),
            isActive: true
          });
        }
      })
      .on('end', async () => {
        console.log(`📊 Found ${exercises.length} exercises in CSV`);
        
        // Remove duplicates based on code
        const uniqueExercises = exercises.filter((exercise, index, self) => 
          index === self.findIndex(e => e.code === exercise.code)
        );
        console.log(`📊 After removing duplicates: ${uniqueExercises.length} exercises`);
        
        // Clear existing exercises first to avoid duplicates
        await portablePrisma.exercise.deleteMany({});
        console.log('🗑️  Cleared existing exercises');
        
        // Insert exercises in batches
        const batchSize = 100;
        for (let i = 0; i < uniqueExercises.length; i += batchSize) {
          const batch = uniqueExercises.slice(i, i + batchSize);
          try {
            await portablePrisma.exercise.createMany({
              data: batch
            });
            console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(uniqueExercises.length/batchSize)}`);
          } catch (error) {
            console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
          }
        }
        
        console.log('✅ All exercises created');
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Function to seed all ingredients from JSON files
async function seedAllIngredients() {
  console.log('\n🥗 Seeding all ingredients from USDA data...');
  
  // Clear existing ingredients first to avoid duplicates
  console.log('🧹 Clearing existing ingredients...');
  try {
    await portablePrisma.ingredient.deleteMany({});
    console.log('✅ Cleared existing ingredients');
  } catch (error) {
    console.log('⚠️  No existing ingredients to clear');
  }
  
  const usdaFiles = [
    'ingredientData/FoodData_Central_branded_food_json_2025-04-24.json',
    'ingredientData/FoodData_Central_foundation_food_json_2025-04-24.json',
    'ingredientData/FoodData_Central_sr_legacy_food_json_2018-04.json'
  ];
  
  let totalIngredients = 0;
  let duplicateCount = 0;
  
  for (const fileName of usdaFiles) {
    console.log(`\n📁 Processing ${fileName}...`);
    
    if (!fs.existsSync(fileName)) {
      console.log(`   File not found: ${fileName}`);
      continue;
    }
    
    try {
      // Read and parse the JSON file
      const fileContent = fs.readFileSync(fileName, 'utf8');
      const jsonData = JSON.parse(fileContent);
      
      let foodItems = [];
      if (jsonData.FoundationFoods) {
        foodItems = jsonData.FoundationFoods;
        console.log(`   Found ${foodItems.length} Foundation Foods`);
      } else if (jsonData.SRLegacyFoods) {
        foodItems = jsonData.SRLegacyFoods;
        console.log(`   Found ${foodItems.length} SR Legacy Foods`);
      } else if (jsonData.BrandedFoods) {
        foodItems = jsonData.BrandedFoods;
        console.log(`   Found ${foodItems.length} Branded Foods`);
      } else if (Array.isArray(jsonData)) {
        foodItems = jsonData;
        console.log(`   Found ${foodItems.length} items in array`);
      } else {
        console.log(`   Unknown JSON structure in ${fileName}, skipping...`);
        continue;
      }
      
      console.log(`   Processing ${foodItems.length} food items...`);
      
      let processedCount = 0;
      let validCount = 0;
      let insertedCount = 0;
      
      for (const foodItem of foodItems) {
        try {
          // Extract nutrition data
          const nutritionData = extractNutritionData(foodItem);
          
          if (nutritionData) {
            const ingredientData = {
              name: foodItem.description || foodItem.foodDescription || 'Unknown Food',
              description: foodItem.description || foodItem.foodDescription || 'Unknown Food',
              servingSize: '100g',
              calories: nutritionData.calories || 0,
              protein: nutritionData.protein || 0,
              carbs: nutritionData.carbs || 0,
              fat: nutritionData.fat || 0,
              fiber: nutritionData.fiber || 0,
              sugar: nutritionData.sugar || 0,
              sodium: nutritionData.sodium || 0,
              cholesterol: nutritionData.cholesterol || 0,
              saturatedFat: nutritionData.saturatedFat || 0,
              monounsaturatedFat: nutritionData.monounsaturatedFat || 0,
              polyunsaturatedFat: nutritionData.polyunsaturatedFat || 0,
              transFat: nutritionData.transFat || 0,
              netCarbs: (nutritionData.carbs || 0) - (nutritionData.fiber || 0),
              category: foodItem.foodCategory?.description || foodItem.wweiaFoodCategory?.wweiaFoodCategoryDescription || 'Other',
              aisle: 'Unknown',
              isActive: true
            };
            
            validCount++;
            
            // Insert individually to handle duplicates gracefully
            try {
              await portablePrisma.ingredient.create({
                data: ingredientData
              });
              insertedCount++;
              totalIngredients++;
            } catch (error) {
              if (error.code === 'P2002') {
                duplicateCount++;
                // Skip duplicates silently
              } else {
                console.error(`   Error inserting ingredient: ${error.message}`);
              }
            }
          }
          
          processedCount++;
          if (processedCount % 1000 === 0) {
            console.log(`   Processed ${processedCount}/${foodItems.length} items from ${fileName} (${validCount} valid, ${insertedCount} inserted, ${duplicateCount} duplicates)`);
          }
          
        } catch (parseError) {
          // Skip invalid items
          continue;
        }
      }
      
      console.log(`✅ Processed ${processedCount} items, ${validCount} valid, ${insertedCount} inserted, ${duplicateCount} duplicates from ${fileName}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error.message);
    }
  }
  
  console.log(`✅ Total ingredients seeded: ${totalIngredients}`);
  console.log(`📊 Summary: ${totalIngredients} ingredients inserted, ${duplicateCount} duplicates skipped`);
}

// Helper function to determine intensity from MET value
function getIntensityFromMET(met) {
  if (met < 3.0) return 'LIGHT';
  if (met < 6.0) return 'MODERATE';
  return 'VIGOROUS';
}

// Helper function to extract nutrition data from food items
function extractNutritionData(foodItem) {
  if (!foodItem.foodNutrients || !Array.isArray(foodItem.foodNutrients)) {
    return null;
  }
  
  const nutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    cholesterol: 0,
    saturatedFat: 0,
    monounsaturatedFat: 0,
    polyunsaturatedFat: 0,
    transFat: 0
  };
  
  let hasKilojoules = false;
  let kilojoules = 0;
  
  for (const nutrient of foodItem.foodNutrients) {
    const nutrientId = nutrient.nutrient?.id || nutrient.nutrientId;
    const amount = nutrient.amount || 0;
    
    // Map nutrient IDs to our fields
    switch (nutrientId) {
      case 1008: // Energy (kcal)
        nutrition.calories = amount;
        break;
      case 1062: // Energy (kJ) - convert to kcal
        hasKilojoules = true;
        kilojoules = amount;
        break;
      case 1003: // Protein
        nutrition.protein = amount;
        break;
      case 1005: // Carbohydrate, by difference
        nutrition.carbs = amount;
        break;
      case 1004: // Total lipid (fat)
        nutrition.fat = amount;
        break;
      case 1079: // Fiber, total dietary
        nutrition.fiber = amount;
        break;
      case 2000: // Total Sugars
      case 1063: // Sugars, Total
        nutrition.sugar = amount;
        break;
      case 1093: // Sodium, Na
        nutrition.sodium = amount;
        break;
      case 1253: // Cholesterol
        nutrition.cholesterol = amount;
        break;
      case 1258: // Fatty acids, total saturated
        nutrition.saturatedFat = amount;
        break;
      case 1292: // Fatty acids, total monounsaturated
        nutrition.monounsaturatedFat = amount;
        break;
      case 1293: // Fatty acids, total polyunsaturated
        nutrition.polyunsaturatedFat = amount;
        break;
      case 1257: // Fatty acids, total trans
        nutrition.transFat = amount;
        break;
    }
  }
  
  // Calculate calories from kilojoules if kcal is not available
  if (nutrition.calories === 0 && hasKilojoules) {
    nutrition.calories = Math.round(kilojoules / 4.184); // Convert kJ to kcal
  }
  
  // Return nutrition data if we have any meaningful nutritional information
  // Include items with calories, protein, carbs, or fat
  if (nutrition.calories > 0 || nutrition.protein > 0 || nutrition.carbs > 0 || nutrition.fat > 0) {
    return nutrition;
  }
  
  return null;
}

// Function to create setup scripts
function createSetupScripts() {
  const setupScript = `#!/bin/bash
# Health Tracker - Data Setup Script
# This script sets up the pre-seeded ingredients and exercises database

echo "🏥 Setting up Health Tracker Data..."

# Copy the pre-seeded database
cp data/health-tracker-data.db prisma/dev.db

echo "✅ Data setup complete!"
echo ""
echo "🚀 You can now start the application:"
echo "   npm run dev"
echo "   Then visit: http://localhost:3001"
echo ""
echo "📋 The database includes:"
echo "   - ALL USDA ingredients (foundation, legacy, branded foods)"
echo "   - ALL exercise data (1,000+ activities with MET values)"
echo "   - Complete nutrition data for all ingredients"
echo "   - Exercise MET values and calorie burn rates"
`;

  const setupScriptPath = path.join(process.cwd(), 'setup-data.sh');
  fs.writeFileSync(setupScriptPath, setupScript);
  
  // Make it executable on Unix systems
  try {
    fs.chmodSync(setupScriptPath, '755');
  } catch (error) {
    // Ignore on Windows
  }

  const batchScript = `@echo off
REM Health Tracker - Data Setup Script (Windows)
REM This script sets up the pre-seeded ingredients and exercises database

echo 🏥 Setting up Health Tracker Data...

REM Copy the pre-seeded database
copy data\\health-tracker-data.db prisma\\dev.db

echo ✅ Data setup complete!
echo.
echo 🚀 You can now start the application:
echo    npm run dev
echo    Then visit: http://localhost:3001
echo.
echo 📋 The database includes:
echo    - ALL USDA ingredients (foundation, legacy, branded foods)
echo    - ALL exercise data (1,000+ activities with MET values)
echo    - Complete nutrition data for all ingredients
echo    - Exercise MET values and calorie burn rates
pause
`;

  const batchScriptPath = path.join(process.cwd(), 'setup-data.bat');
  fs.writeFileSync(batchScriptPath, batchScript);
}

// Run if called directly
if (require.main === module) {
  createPortableDatabase();
}

module.exports = { createPortableDatabase }; 