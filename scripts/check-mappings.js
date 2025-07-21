const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMappings() {
  try {
    console.log('Checking Salt and Pepper Mappings...\n');
    
    const saltMappings = await prisma.ingredientMapping.findMany({
      where: {
        keyword: {
          in: ['salt', 'Salt', 'SALT', 'table salt', 'sea salt', 'kosher salt']
        }
      },
      include: {
        ingredient: true
      }
    });
    
    const pepperMappings = await prisma.ingredientMapping.findMany({
      where: {
        keyword: {
          in: ['pepper', 'Pepper', 'PEPPER', 'black pepper', 'Black Pepper', 'BLACK PEPPER']
        }
      },
      include: {
        ingredient: true
      }
    });
    
    console.log('Salt Mappings:');
    saltMappings.forEach(m => {
      console.log(`  ${m.keyword} → ${m.ingredient.name}`);
    });
    
    console.log('\nPepper Mappings:');
    pepperMappings.forEach(m => {
      console.log(`  ${m.keyword} → ${m.ingredient.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMappings(); 