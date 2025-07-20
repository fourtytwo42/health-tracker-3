const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Nutrition mapping from USDA to our schema
const nutritionMapping = {
  '203': 'protein',      // Protein
  '204': 'fat',          // Total lipid (fat)
  '205': 'carbs',        // Carbohydrate, by difference
  '208': 'calories',     // Energy
  '291': 'fiber',        // Fiber, total dietary
  '269': 'sugar',        // Total Sugars
  '307': 'sodium',       // Sodium, Na
  '601': 'cholesterol',  // Cholesterol
  '606': 'saturatedFat', // Fatty acids, total saturated
  '645': 'monounsaturatedFat', // Fatty acids, total monounsaturated
  '646': 'polyunsaturatedFat', // Fatty acids, total polyunsaturated
};

async function seedSurveyFoods() {
  console.log('Starting survey foods seeding...');
  
  const filePath = path.join(__dirname, '..', 'ingredientData', 'surveyDownload.json');
  
  if (!fs.existsSync(filePath)) {
    console.error('Survey foods file not found:', filePath);
    return;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // The file contains a JSON object with SurveyFoods property
    const foodsArray = data.SurveyFoods || [];
    
    console.log(`Found ${foodsArray.length} survey foods to process`);
    
    let processed = 0;
    let created = 0;
    let skipped = 0;
    
    for (const food of foodsArray) {
      try {
        processed++;
        
        if (processed % 100 === 0) {
          console.log(`Processed ${processed}/${foodsArray.length} foods...`);
        }
        
        // Skip if no description
        if (!food.description) {
          skipped++;
          continue;
        }
        
        // Check if ingredient already exists
        const existing = await prisma.ingredient.findUnique({
          where: { name: food.description }
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Extract nutrition data
        const nutrition = {};
        
        if (food.foodNutrients) {
          for (const nutrient of food.foodNutrients) {
            const nutrientId = nutrient.nutrient?.number;
            const amount = nutrient.amount;
            
            if (nutritionMapping[nutrientId] && amount !== null && amount !== undefined) {
              nutrition[nutritionMapping[nutrientId]] = parseFloat(amount);
            }
          }
        }
        
        // Get serving size from foodPortions if available
        let servingSize = '100g';
        if (food.foodPortions && food.foodPortions.length > 0) {
          const primaryPortion = food.foodPortions.find(p => p.portionDescription === '1 cup') ||
                                food.foodPortions.find(p => p.portionDescription === '1 serving') ||
                                food.foodPortions[0];
          
          if (primaryPortion) {
            servingSize = `${primaryPortion.portionDescription} (${primaryPortion.gramWeight}g)`;
          }
        }
        
        // Create ingredient
        const ingredientData = {
          name: food.description,
          description: food.description,
          servingSize: servingSize,
          calories: nutrition.calories || 0,
          protein: nutrition.protein || 0,
          carbs: nutrition.carbs || 0,
          fat: nutrition.fat || 0,
          fiber: nutrition.fiber || 0,
          sugar: nutrition.sugar || 0,
          sodium: nutrition.sodium || 0,
          cholesterol: nutrition.cholesterol || 0,
          saturatedFat: nutrition.saturatedFat || 0,
          monounsaturatedFat: nutrition.monounsaturatedFat || 0,
          polyunsaturatedFat: nutrition.polyunsaturatedFat || 0,
          category: food.wweiaFoodCategory?.wweiaFoodCategoryDescription || null,
          isActive: true
        };
        
        await prisma.ingredient.create({
          data: ingredientData
        });
        
        created++;
        
      } catch (error) {
        console.error(`Error processing food "${food.description}":`, error.message);
        skipped++;
      }
    }
    
    console.log(`Survey foods seeding completed!`);
    console.log(`- Processed: ${processed}`);
    console.log(`- Created: ${created}`);
    console.log(`- Skipped: ${skipped}`);
    
  } catch (error) {
    console.error('Error reading or parsing survey foods file:', error);
  }
}

async function main() {
  try {
    await seedSurveyFoods();
  } catch (error) {
    console.error('Error in main:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedSurveyFoods }; 