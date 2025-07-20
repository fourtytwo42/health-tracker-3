const { PrismaClient } = require('@prisma/client');

async function checkPepperIngredients() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Searching for ingredients with "pepper" in the name...\n');
    
    const pepperIngredients = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'pepper'
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        aisle: true
      },
      take: 20
    });
    
    console.log(`Found ${pepperIngredients.length} ingredients with "pepper":\n`);
    
    pepperIngredients.forEach((ingredient, index) => {
      console.log(`${index + 1}. ID: ${ingredient.id}`);
      console.log(`   Name: ${ingredient.name}`);
      console.log(`   Category: ${ingredient.category || 'Unknown'}`);
      console.log(`   Aisle: ${ingredient.aisle || 'Unknown'}`);
      console.log('');
    });
    
    // Also check for "spices" ingredients
    console.log('🔍 Searching for ingredients with "spices" in the name...\n');
    
    const spicesIngredients = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: 'spices'
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        aisle: true
      },
      take: 10
    });
    
    console.log(`Found ${spicesIngredients.length} ingredients with "spices":\n`);
    
    spicesIngredients.forEach((ingredient, index) => {
      console.log(`${index + 1}. ID: ${ingredient.id}`);
      console.log(`   Name: ${ingredient.name}`);
      console.log(`   Category: ${ingredient.category || 'Unknown'}`);
      console.log(`   Aisle: ${ingredient.aisle || 'Unknown'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPepperIngredients(); 