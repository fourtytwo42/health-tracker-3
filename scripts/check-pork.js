const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPorkIngredients() {
  try {
    console.log('Searching for pork ingredients...\n');
    
    const porkIngredients = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'pork'
        }
      },
      select: {
        name: true,
        category: true,
        description: true,
        calories: true
      },
      take: 20
    });

    console.log(`Found ${porkIngredients.length} pork ingredients:`);
    porkIngredients.forEach((ing, i) => {
      console.log(`${i + 1}. ${ing.name} (${ing.category}) - ${ing.calories} cal`);
      console.log(`   Description: ${ing.description || 'No description'}`);
      console.log('');
    });

    console.log('\nSearching for "chop" ingredients...\n');
    
    const chopIngredients = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'chop'
        }
      },
      select: {
        name: true,
        category: true,
        description: true,
        calories: true
      },
      take: 10
    });

    console.log(`Found ${chopIngredients.length} chop ingredients:`);
    chopIngredients.forEach((ing, i) => {
      console.log(`${i + 1}. ${ing.name} (${ing.category}) - ${ing.calories} cal`);
      console.log(`   Description: ${ing.description || 'No description'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPorkIngredients(); 