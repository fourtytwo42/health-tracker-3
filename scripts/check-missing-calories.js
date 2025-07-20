const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMissingCalories() {
  try {
    console.log('Checking for ingredients with missing calories...\n');
    
    // Check salmon
    console.log('Salmon ingredients:');
    const salmonResults = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'salmon'
        }
      },
      select: {
        name: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true
      },
      take: 10
    });
    
    salmonResults.forEach((ing, i) => {
      console.log(`${i + 1}. ${ing.name}`);
      console.log(`   Calories: ${ing.calories}, Protein: ${ing.protein}g, Carbs: ${ing.carbs}g, Fat: ${ing.fat}g`);
    });
    
    // Check quinoa
    console.log('\nQuinoa ingredients:');
    const quinoaResults = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'quinoa'
        }
      },
      select: {
        name: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true
      },
      take: 10
    });
    
    quinoaResults.forEach((ing, i) => {
      console.log(`${i + 1}. ${ing.name}`);
      console.log(`   Calories: ${ing.calories}, Protein: ${ing.protein}g, Carbs: ${ing.carbs}g, Fat: ${ing.fat}g`);
    });
    
    // Check for any ingredients with 0 calories
    console.log('\nAll ingredients with 0 calories:');
    const zeroCalories = await prisma.ingredient.findMany({
      where: {
        calories: 0
      },
      select: {
        name: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true
      },
      take: 20
    });
    
    zeroCalories.forEach((ing, i) => {
      console.log(`${i + 1}. ${ing.name} - Calories: ${ing.calories}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingCalories(); 