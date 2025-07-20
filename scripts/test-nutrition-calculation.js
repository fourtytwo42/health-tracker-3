const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNutritionCalculation() {
  try {
    console.log('Testing nutrition calculation scaling...\n');
    
    // Test ingredients from the recipe
    const testIngredients = [
      { name: 'Duck, cooked, skin eaten', amount: 478.5, unit: 'g' },
      { name: 'Olive oil', amount: 35.9, unit: 'ml' },
      { name: 'Butter, unsalted', amount: 23.9, unit: 'g' },
      { name: 'Salt, table', amount: 2, unit: 'g' },
      { name: 'Black pepper', amount: 2.4, unit: 'g' },
      { name: 'Corn, sweet, yellow and white kernels, fresh, raw', amount: 12, unit: 'g' },
      { name: 'Cherry juice, tart', amount: 239.2, unit: 'g' },
      { name: 'Vinegar, red wine', amount: 71.8, unit: 'ml' }
    ];
    
    for (const testIngredient of testIngredients) {
      console.log(`\nTesting: ${testIngredient.name} (${testIngredient.amount}${testIngredient.unit})`);
      
      // Search for the ingredient
      let foundIngredient = await prisma.ingredient.findFirst({
        where: {
          name: {
            contains: testIngredient.name.toLowerCase()
          },
          isActive: true
        }
      });
      
      if (!foundIngredient) {
        // Try searching by key words
        const keyWords = testIngredient.name
          .toLowerCase()
          .split(' ')
          .filter(word => 
            word.length > 2 && 
            !['the', 'and', 'or', 'with', 'without', 'fresh', 'raw', 'cooked', 'canned', 'frozen'].includes(word)
          );
        
        if (keyWords.length > 0) {
          foundIngredient = await prisma.ingredient.findFirst({
            where: {
              OR: keyWords.map(word => ({
                name: {
                  contains: word
                }
              })),
              isActive: true
            }
          });
        }
      }
      
      if (foundIngredient) {
        console.log(`Found: ${foundIngredient.name}`);
        console.log(`Base nutrition (per ${foundIngredient.servingSize}):`);
        console.log(`  Calories: ${foundIngredient.calories}`);
        console.log(`  Protein: ${foundIngredient.protein}g`);
        console.log(`  Carbs: ${foundIngredient.carbs}g`);
        console.log(`  Fat: ${foundIngredient.fat}g`);
        
        // Calculate serving ratio
        let servingRatio = 1;
        const servingSizeStr = foundIngredient.servingSize || '100g';
        const servingSizeMatch = servingSizeStr.match(/(\d+(?:\.\d+)?)\s*(g|ml|oz|lb|kg|l|cup|cups|tbsp|tsp)/i);
        
        if (servingSizeMatch) {
          const baseAmount = parseFloat(servingSizeMatch[1]);
          const baseUnit = servingSizeMatch[2].toLowerCase();
          
          // Convert units to grams for comparison if possible
          const unitConversions = {
            'g': 1,
            'kg': 1000,
            'oz': 28.35,
            'lb': 453.59,
            'ml': 1, // Assuming 1ml ≈ 1g for most ingredients
            'l': 1000,
            'cup': 236.59, // 1 cup ≈ 236.59ml
            'cups': 236.59,
            'tbsp': 14.79, // 1 tbsp ≈ 14.79ml
            'tsp': 4.93 // 1 tsp ≈ 4.93ml
          };
          
          const baseAmountInGrams = baseAmount * (unitConversions[baseUnit] || 1);
          const ingredientAmountInGrams = testIngredient.amount * (unitConversions[testIngredient.unit.toLowerCase()] || 1);
          
          servingRatio = ingredientAmountInGrams / baseAmountInGrams;
        } else {
          // Fallback to simple ratio if serving size parsing fails
          servingRatio = testIngredient.amount / 100;
        }
        
        console.log(`Serving ratio: ${servingRatio.toFixed(3)}`);
        
        // Calculate scaled nutrition
        const ingredientNutrition = {
          calories: Math.round(foundIngredient.calories * servingRatio),
          protein: Math.round(foundIngredient.protein * servingRatio * 10) / 10,
          carbs: Math.round(foundIngredient.carbs * servingRatio * 10) / 10,
          fat: Math.round(foundIngredient.fat * servingRatio * 10) / 10
        };
        
        console.log(`Scaled nutrition (${testIngredient.amount}${testIngredient.unit}):`);
        console.log(`  Calories: ${ingredientNutrition.calories}`);
        console.log(`  Protein: ${ingredientNutrition.protein}g`);
        console.log(`  Carbs: ${ingredientNutrition.carbs}g`);
        console.log(`  Fat: ${ingredientNutrition.fat}g`);
        
      } else {
        console.log('NOT FOUND in database');
      }
    }
    
  } catch (error) {
    console.error('Error testing nutrition calculation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testNutritionCalculation();
}

module.exports = { testNutritionCalculation }; 