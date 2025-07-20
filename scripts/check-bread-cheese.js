const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBreadCheese() {
  try {
    console.log('Checking for bread ingredients...\n');
    
    const breadResults = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'bread'
        }
      },
      select: {
        name: true,
        category: true,
        calories: true
      },
      take: 10
    });
    
    console.log('Bread ingredients:');
    breadResults.forEach((ing, i) => {
      console.log(`${i + 1}. ${ing.name} (${ing.category}) - ${ing.calories} cal`);
    });
    
    console.log('\nChecking for cheese ingredients...\n');
    
    const cheeseResults = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'cheese'
        }
      },
      select: {
        name: true,
        category: true,
        calories: true
      },
      take: 10
    });
    
    console.log('Cheese ingredients:');
    cheeseResults.forEach((ing, i) => {
      console.log(`${i + 1}. ${ing.name} (${ing.category}) - ${ing.calories} cal`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBreadCheese(); 