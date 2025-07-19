const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Nutrient ID mappings for key nutrients
const NUTRIENT_MAPPINGS = {
  1003: 'protein', // Protein
  1004: 'fat', // Total lipid (fat)
  1005: 'carbohydrates', // Carbohydrate, by difference
  1008: 'calories', // Energy (kcal)
  1051: 'water', // Water
  1087: 'calcium', // Calcium, Ca
  1092: 'potassium', // Potassium, K
  1093: 'sodium', // Sodium, Na
  1253: 'cholesterol', // Cholesterol
  1258: 'saturatedFat', // Fatty acids, total saturated
  1292: 'monounsaturatedFat', // Fatty acids, total monounsaturated
  1293: 'polyunsaturatedFat', // Fatty acids, total polyunsaturated
  1257: 'transFat', // Fatty acids, total trans
  1079: 'fiber', // Fiber, total dietary
  1089: 'iron', // Iron, Fe
  2000: 'sugar', // Total Sugars
};

// Common food categories to aisle mappings
const CATEGORY_TO_AISLE = {
  'Baked Products': 'Bakery',
  'Beef Products': 'Meat',
  'Beverages': 'Beverages',
  'Breakfast Cereals': 'Cereal',
  'Cereal Grains and Pasta': 'Grains',
  'Dairy and Egg Products': 'Dairy',
  'Fast Foods': 'Frozen Foods',
  'Fats and Oils': 'Oils & Condiments',
  'Finfish and Shellfish Products': 'Seafood',
  'Fruits and Fruit Juices': 'Produce',
  'Lamb, Veal, and Game Products': 'Meat',
  'Legumes and Legume Products': 'Canned Goods',
  'Meals, Entrees, and Side Dishes': 'Frozen Foods',
  'Nut and Seed Products': 'Nuts & Seeds',
  'Pork Products': 'Meat',
  'Poultry Products': 'Meat',
  'Restaurant Foods': 'Frozen Foods',
  'Sausages and Luncheon Meats': 'Deli',
  'Snacks': 'Snacks',
  'Soups, Sauces, and Gravies': 'Canned Goods',
  'Spices and Herbs': 'Spices',
  'Sweets': 'Candy',
  'Vegetables and Vegetable Products': 'Produce',
};

async function seedUsdaLegacyFoods() {
  console.log('Starting USDA Legacy Foods seeding...');
  
  const filePath = path.join(process.cwd(), 'Data', 'FoodData_Central_sr_legacy_food_json_2018-04.json');
  
  try {
    // Read and parse the JSON file
    console.log('Reading USDA data file...');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const usdaData = JSON.parse(fileContent);
    
    const foods = usdaData.SRLegacyFoods;
    console.log(`Found ${foods.length} foods to process`);
    
    // Clear existing ingredients first
    console.log('Clearing existing ingredients...');
    await prisma.ingredient.deleteMany({});
    
    let processed = 0;
    let skipped = 0;
    const batchSize = 100;
    
    // Process in batches to avoid memory issues
    for (let i = 0; i < foods.length; i += batchSize) {
      const batch = foods.slice(i, i + batchSize);
      
      const ingredientsToCreate = [];
      
      for (const food of batch) {
        try {
          // Extract basic info
          const name = food.description || 'Unknown Food';
          const category = food.foodCategory?.description || 'Other';
          const aisle = CATEGORY_TO_AISLE[category] || 'Other';
          
          // Extract nutrients
          const nutrients = {};
          if (food.foodNutrients && Array.isArray(food.foodNutrients)) {
            food.foodNutrients.forEach(nutrient => {
              const nutrientId = nutrient.nutrient?.id;
              const fieldName = NUTRIENT_MAPPINGS[nutrientId];
              
              if (fieldName && nutrient.amount !== null && nutrient.amount !== undefined) {
                // Convert to per 100g basis if needed
                let amount = nutrient.amount;
                
                // Handle scientific notation
                if (typeof amount === 'string' && amount.includes('E')) {
                  amount = parseFloat(amount);
                }
                
                nutrients[fieldName] = amount;
              }
            });
          }
          
          // Extract serving size info
          let servingSize = 100; // Default to 100g
          let servingUnit = 'g';
          
          if (food.foodPortions && food.foodPortions.length > 0) {
            const portion = food.foodPortions[0];
            if (portion.gramWeight) {
              servingSize = portion.gramWeight;
            }
            if (portion.measureUnit?.name) {
              servingUnit = portion.measureUnit.name;
            }
          }
          
          // Create ingredient object
          const ingredient = {
            name: name.substring(0, 255), // Truncate if too long
            description: name.length > 255 ? name : null,
            servingSize: `${servingSize}${servingUnit}`,
            calories: nutrients.calories || 0,
            protein: nutrients.protein || 0,
            carbs: nutrients.carbohydrates || 0,
            fat: nutrients.fat || 0,
            fiber: nutrients.fiber || 0,
            sugar: nutrients.sugar || 0,
            sodium: nutrients.sodium || 0,
            cholesterol: nutrients.cholesterol || 0,
            saturatedFat: nutrients.saturatedFat || 0,
            transFat: nutrients.transFat || 0,
            monounsaturatedFat: nutrients.monounsaturatedFat || 0,
            polyunsaturatedFat: nutrients.polyunsaturatedFat || 0,
            category: category.substring(0, 100),
            aisle: aisle.substring(0, 100),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          ingredientsToCreate.push(ingredient);
          
        } catch (error) {
          console.error(`Error processing food ${food.fdcId}:`, error.message);
          skipped++;
        }
      }
      
      // Insert batch
      if (ingredientsToCreate.length > 0) {
        await prisma.ingredient.createMany({
          data: ingredientsToCreate,
          skipDuplicates: true
        });
        
        processed += ingredientsToCreate.length;
        console.log(`Processed ${processed}/${foods.length} foods (${Math.round(processed/foods.length*100)}%)`);
      }
    }
    
    console.log(`\nSeeding complete!`);
    console.log(`- Processed: ${processed} foods`);
    console.log(`- Skipped: ${skipped} foods`);
    
    // Get final count
    const totalCount = await prisma.ingredient.count();
    console.log(`- Total ingredients in database: ${totalCount}`);
    
  } catch (error) {
    console.error('Error seeding USDA data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedUsdaLegacyFoods()
    .then(() => {
      console.log('USDA Legacy Foods seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedUsdaLegacyFoods }; 