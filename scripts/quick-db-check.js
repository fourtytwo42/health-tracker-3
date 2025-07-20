const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickCheck() {
  try {
    console.log('🔍 Quick database check...\n');
    
    // Count total ingredients
    const totalCount = await prisma.ingredient.count({
      where: { isActive: true }
    });
    
    console.log(`Total active ingredients: ${totalCount}\n`);
    
    // Get a few sample ingredients
    const samples = await prisma.ingredient.findMany({
      where: { isActive: true },
      select: {
        name: true,
        category: true,
        aisle: true
      },
      take: 10,
      orderBy: { name: 'asc' }
    });
    
    console.log('Sample ingredients:');
    samples.forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.name} (${ingredient.category}) - ${ingredient.aisle}`);
    });
    
    // Check for pepper specifically
    console.log('\n🔍 Looking for pepper:');
    const pepperResults = await prisma.ingredient.findMany({
      where: {
        isActive: true,
        name: {
          contains: 'pepper'
        }
      },
      select: {
        name: true,
        category: true,
        aisle: true
      }
    });
    
    if (pepperResults.length > 0) {
      pepperResults.forEach((ingredient, index) => {
        console.log(`${index + 1}. ${ingredient.name} (${ingredient.category}) - ${ingredient.aisle}`);
      });
    } else {
      console.log('No pepper ingredients found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck(); 