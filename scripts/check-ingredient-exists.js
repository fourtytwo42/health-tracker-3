const { PrismaClient } = require('@prisma/client');

async function checkIngredients() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking for specific ingredients...\n');
    
    // Check for black pepper specifically
    const blackPepper = await prisma.ingredient.findFirst({
      where: {
        name: { contains: 'spices, pepper, black' }
      }
    });
    
    if (blackPepper) {
      console.log('✅ Found spices, pepper, black:');
      console.log(`   ID: ${blackPepper.id}`);
      console.log(`   Name: ${blackPepper.name}`);
      console.log(`   Category: ${blackPepper.category}`);
      console.log(`   Aisle: ${blackPepper.aisle}`);
    } else {
      console.log('❌ spices, pepper, black not found');
    }
    
    console.log('\n🔍 Checking for any pepper ingredients...\n');
    
    const pepperIngredients = await prisma.ingredient.findMany({
      where: {
        name: { contains: 'pepper' }
      },
      select: {
        id: true,
        name: true,
        category: true,
        aisle: true
      },
      take: 10
    });
    
    console.log(`Found ${pepperIngredients.length} ingredients with "pepper":`);
    pepperIngredients.forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.name} (${ingredient.category})`);
    });
    
    console.log('\n🔍 Checking for any spices ingredients...\n');
    
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
      take: 10
    });
    
    console.log(`Found ${spicesIngredients.length} ingredients with "spices":`);
    spicesIngredients.forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.name} (${ingredient.category})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIngredients(); 