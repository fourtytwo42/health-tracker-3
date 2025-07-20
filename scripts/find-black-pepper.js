const { PrismaClient } = require('@prisma/client');

async function findBlackPepper() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Searching for black pepper ingredients...\n');
    
    // Search for ingredients with "pepper" and "black"
    const pepperIngredients = await prisma.ingredient.findMany({
      where: {
        OR: [
          { name: { contains: 'pepper' } },
          { name: { contains: 'black' } }
        ]
      },
      select: {
        id: true,
        name: true,
        category: true,
        aisle: true,
        description: true
      },
      take: 30
    });
    
    console.log(`Found ${pepperIngredients.length} ingredients with "pepper" or "black":\n`);
    
    pepperIngredients.forEach((ingredient, index) => {
      console.log(`${index + 1}. ID: ${ingredient.id}`);
      console.log(`   Name: ${ingredient.name}`);
      console.log(`   Category: ${ingredient.category || 'Unknown'}`);
      console.log(`   Aisle: ${ingredient.aisle || 'Unknown'}`);
      console.log(`   Description: ${ingredient.description || 'None'}`);
      console.log('');
    });
    
    // Specifically look for "spices" ingredients
    console.log('🔍 Searching for spices ingredients...\n');
    
    const spicesIngredients = await prisma.ingredient.findMany({
      where: {
        name: { contains: 'spices' }
      },
      select: {
        id: true,
        name: true,
        category: true,
        aisle: true
      },
      take: 20
    });
    
    console.log(`Found ${spicesIngredients.length} ingredients with "spices":\n`);
    
    spicesIngredients.forEach((ingredient, index) => {
      console.log(`${index + 1}. ID: ${ingredient.id}`);
      console.log(`   Name: ${ingredient.name}`);
      console.log(`   Category: ${ingredient.category || 'Unknown'}`);
      console.log(`   Aisle: ${ingredient.aisle || 'Unknown'}`);
      console.log('');
    });
    
    // Check total count of ingredients
    const totalCount = await prisma.ingredient.count();
    console.log(`Total ingredients in database: ${totalCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findBlackPepper(); 