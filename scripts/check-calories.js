const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCalories() {
  try {
    console.log('Checking calorie data in database...\n');
    
    // Get total count
    const totalIngredients = await prisma.ingredient.count();
    console.log(`Total ingredients: ${totalIngredients}`);
    
    // Check ingredients with 0 calories
    const zeroCalories = await prisma.ingredient.count({
      where: { calories: 0 }
    });
    console.log(`Ingredients with 0 calories: ${zeroCalories}`);
    
    // Check ingredients with calories > 0
    const hasCalories = await prisma.ingredient.count({
      where: { calories: { gt: 0 } }
    });
    console.log(`Ingredients with calories > 0: ${hasCalories}`);
    
    // Show some examples of ingredients with 0 calories
    console.log('\nExamples of ingredients with 0 calories:');
    const zeroCalExamples = await prisma.ingredient.findMany({
      where: { calories: 0 },
      take: 10,
      select: {
        name: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        category: true
      }
    });
    
    zeroCalExamples.forEach(ing => {
      console.log(`- ${ing.name} (${ing.category}): ${ing.calories} cal, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat`);
    });
    
    // Show some examples of ingredients with calories > 0
    console.log('\nExamples of ingredients with calories > 0:');
    const hasCalExamples = await prisma.ingredient.findMany({
      where: { calories: { gt: 0 } },
      take: 10,
      select: {
        name: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        category: true
      }
    });
    
    hasCalExamples.forEach(ing => {
      console.log(`- ${ing.name} (${ing.category}): ${ing.calories} cal, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat`);
    });
    
    // Check the USDA data directly
    console.log('\nChecking USDA data directly...');
    const fs = require('fs');
    const path = require('path');
    
    const usdaDataPath = path.join(__dirname, '../Data/FoodData_Central_foundation_food_json_2025-04-24.json');
    const usdaData = JSON.parse(fs.readFileSync(usdaDataPath, 'utf8'));
    const foundationFoods = usdaData.FoundationFoods;
    
    console.log(`USDA foundation foods: ${foundationFoods.length}`);
    
    // Check first 10 USDA items for calories
    console.log('\nFirst 10 USDA items calorie check:');
    for (let i = 0; i < Math.min(10, foundationFoods.length); i++) {
      const food = foundationFoods[i];
      const foodNutrients = food.foodNutrients || [];
      const calories = foodNutrients.find(n => n.nutrient.id === 1008);
      
      console.log(`${i + 1}. ${food.description}: ${calories ? calories.amount : 'NOT FOUND'} calories`);
    }
    
    // Check some specific items that should have calories
    console.log('\nChecking specific items that should have calories:');
    const specificItems = ['Spinach, raw', 'Tomatoes, grape, raw', 'Yogurt, Greek, plain, nonfat'];
    
    for (const itemName of specificItems) {
      const ingredient = await prisma.ingredient.findFirst({
        where: { name: { contains: itemName } },
        select: { name: true, calories: true, protein: true, carbs: true, fat: true }
      });
      
      if (ingredient) {
        console.log(`- ${ingredient.name}: ${ingredient.calories} cal, ${ingredient.protein}g protein, ${ingredient.carbs}g carbs, ${ingredient.fat}g fat`);
      }
    }
    
  } catch (error) {
    console.error('Error checking calories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCalories(); 