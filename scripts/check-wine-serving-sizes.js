const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWineServingSizes() {
  try {
    console.log('Checking wine serving sizes...\n');
    
    // Find some wine entries
    const wines = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'wine'
        }
      },
      select: {
        name: true,
        servingSize: true,
        calories: true,
        category: true,
        aisle: true
      },
      take: 10
    });
    
    console.log('Sample wine entries:');
    wines.forEach(wine => {
      console.log(`- ${wine.name}`);
      console.log(`  Serving: ${wine.servingSize}`);
      console.log(`  Calories: ${wine.calories}`);
      console.log(`  Category: ${wine.category}`);
      console.log(`  Aisle: ${wine.aisle}`);
      console.log('');
    });
    
    // Check for any remaining "undetermined" serving sizes
    const undeterminedCount = await prisma.ingredient.count({
      where: {
        servingSize: {
          contains: 'undetermined'
        }
      }
    });
    
    console.log(`Total ingredients with "undetermined" serving sizes: ${undeterminedCount}`);
    
    if (undeterminedCount === 0) {
      console.log('✅ All serving sizes have been fixed!');
    } else {
      console.log('⚠️  Some ingredients still have "undetermined" serving sizes');
    }
    
  } catch (error) {
    console.error('Error checking wine serving sizes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkWineServingSizes();
}

module.exports = { checkWineServingSizes }; 