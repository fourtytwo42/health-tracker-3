const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEnrichedFlour() {
  try {
    console.log('Searching for enriched flour...\n');
    
    const results = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'enriched flour'
        }
      },
      select: {
        name: true,
        category: true
      },
      take: 10
    });
    
    console.log('Found ingredients:');
    results.forEach((ing, i) => {
      console.log(`${i + 1}. ${ing.name} (${ing.category})`);
    });
    
    // Also search for just "flour" to see basic options
    console.log('\nSearching for basic flour options...\n');
    
    const flourResults = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'flour'
        }
      },
      select: {
        name: true,
        category: true
      },
      take: 15
    });
    
    console.log('Basic flour options:');
    flourResults.forEach((ing, i) => {
      console.log(`${i + 1}. ${ing.name} (${ing.category})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnrichedFlour(); 