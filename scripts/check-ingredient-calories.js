const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIngredientCalories() {
  try {
    console.log('Checking ingredient calorie data...\n');
    
    // Count total ingredients
    const totalCount = await prisma.ingredient.count();
    console.log(`Total ingredients in database: ${totalCount}\n`);
    
    // Count ingredients with 0 calories
    const zeroCaloriesCount = await prisma.ingredient.count({
      where: { calories: 0 }
    });
    console.log(`Ingredients with 0 calories: ${zeroCaloriesCount}\n`);
    
    // Count ingredients with very high calories (likely kJ values)
    const highCaloriesCount = await prisma.ingredient.count({
      where: { calories: { gt: 1000 } }
    });
    console.log(`Ingredients with >1000 calories (likely kJ): ${highCaloriesCount}\n`);
    
    // Sample ingredients with 0 calories
    const zeroCaloriesIngredients = await prisma.ingredient.findMany({
      where: { calories: 0 },
      take: 10,
      select: { name: true, calories: true, protein: true, carbs: true, fat: true }
    });
    
    console.log('Sample ingredients with 0 calories:');
    zeroCaloriesIngredients.forEach((ing, index) => {
      console.log(`${index + 1}. ${ing.name}: ${ing.calories} cal, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat`);
    });
    
    // Sample ingredients with very high calories
    const highCaloriesIngredients = await prisma.ingredient.findMany({
      where: { calories: { gt: 1000 } },
      take: 10,
      select: { name: true, calories: true, protein: true, carbs: true, fat: true }
    });
    
    console.log('\nSample ingredients with >1000 calories (likely kJ values):');
    highCaloriesIngredients.forEach((ing, index) => {
      console.log(`${index + 1}. ${ing.name}: ${ing.calories} cal, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat`);
    });
    
    // Check for ingredients with reasonable calorie ranges
    const reasonableCaloriesCount = await prisma.ingredient.count({
      where: { 
        calories: { 
          gt: 0,
          lt: 1000 
        } 
      }
    });
    console.log(`\nIngredients with reasonable calories (1-999): ${reasonableCaloriesCount}\n`);
    
    // Sample ingredients with reasonable calories
    const reasonableCaloriesIngredients = await prisma.ingredient.findMany({
      where: { 
        calories: { 
          gt: 0,
          lt: 1000 
        } 
      },
      take: 10,
      select: { name: true, calories: true, protein: true, carbs: true, fat: true },
      orderBy: { calories: 'desc' }
    });
    
    console.log('Sample ingredients with reasonable calories:');
    reasonableCaloriesIngredients.forEach((ing, index) => {
      console.log(`${index + 1}. ${ing.name}: ${ing.calories} cal, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat`);
    });
    
  } catch (error) {
    console.error('Error checking ingredient calories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkIngredientCalories();
}

module.exports = { checkIngredientCalories }; 