const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimpleNutrition() {
  try {
    console.log('Testing simple nutrition calculation...\n');
    
    // Test with simple ingredient names
    const testIngredients = [
      { name: 'duck', amount: 478.5, unit: 'g' },
      { name: 'olive oil', amount: 35.9, unit: 'ml' },
      { name: 'butter', amount: 23.9, unit: 'g' },
      { name: 'salt', amount: 2, unit: 'g' },
      { name: 'corn', amount: 12, unit: 'g' }
    ];
    
    for (const testIngredient of testIngredients) {
      console.log(`\nTesting: ${testIngredient.name} (${testIngredient.amount}${testIngredient.unit})`);
      
      // Search for the ingredient
      const foundIngredient = await prisma.ingredient.findFirst({
        where: {
          name: {
            contains: testIngredient.name
          },
          isActive: true
        }
      });
      
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
    
    // Also test with some sample ingredients from database
    console.log('\n\nTesting with sample ingredients from database:');
    const sampleIngredients = await prisma.ingredient.findMany({
      take: 5,
      where: { calories: { gt: 0 } },
      orderBy: { calories: 'desc' }
    });
    
    for (const ingredient of sampleIngredients) {
      console.log(`\nSample: ${ingredient.name}`);
      console.log(`Base: ${ingredient.calories} cal per ${ingredient.servingSize}`);
      
      // Test with 200g
      const testAmount = 200;
      const servingRatio = testAmount / 100; // Assuming 100g base
      
      const scaledCalories = Math.round(ingredient.calories * servingRatio);
      console.log(`Scaled (${testAmount}g): ${scaledCalories} cal`);
    }
    
  } catch (error) {
    console.error('Error testing nutrition calculation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testSimpleNutrition();
}

module.exports = { testSimpleNutrition }; 