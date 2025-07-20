const { PrismaClient } = require('@prisma/client');

async function addBlackPepper() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Adding black pepper ingredient to database...\n');
    
    // Check if it already exists
    const existing = await prisma.ingredient.findFirst({
      where: {
        name: { contains: 'spices, pepper, black' }
      }
    });
    
    if (existing) {
      console.log('✅ Black pepper already exists:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      return;
    }
    
    // Add black pepper ingredient
    const blackPepper = await prisma.ingredient.create({
      data: {
        name: 'spices, pepper, black',
        description: 'Ground black pepper spice',
        servingSize: '1 tsp',
        calories: 6,
        protein: 0.3,
        carbs: 1.5,
        fat: 0.1,
        fiber: 0.6,
        sugar: 0,
        sodium: 1,
        category: 'Herbs & Spices',
        aisle: 'Spices',
        isActive: true
      }
    });
    
    console.log('✅ Successfully added black pepper:');
    console.log(`   ID: ${blackPepper.id}`);
    console.log(`   Name: ${blackPepper.name}`);
    console.log(`   Category: ${blackPepper.category}`);
    console.log(`   Aisle: ${blackPepper.aisle}`);
    
    // Also add white pepper for comparison
    const whitePepper = await prisma.ingredient.create({
      data: {
        name: 'spices, pepper, white',
        description: 'Ground white pepper spice',
        servingSize: '1 tsp',
        calories: 6,
        protein: 0.3,
        carbs: 1.5,
        fat: 0.1,
        fiber: 0.6,
        sugar: 0,
        sodium: 1,
        category: 'Herbs & Spices',
        aisle: 'Spices',
        isActive: true
      }
    });
    
    console.log('\n✅ Successfully added white pepper:');
    console.log(`   ID: ${whitePepper.id}`);
    console.log(`   Name: ${whitePepper.name}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBlackPepper(); 