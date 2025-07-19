const { PrismaClient } = require('@prisma/client');

const mainPrisma = new PrismaClient({
  log: ['error'],
});

async function clearMainDbIngredients() {
  try {
    console.log('🧹 Clearing ingredients from main database...\n');
    
    // Check current count
    const beforeCount = await mainPrisma.ingredient.count();
    console.log(`📊 Ingredients in main DB before: ${beforeCount}`);
    
    if (beforeCount > 0) {
      // Clear all ingredients
      await mainPrisma.ingredient.deleteMany({});
      console.log('✅ Cleared all ingredients from main database');
      
      // Verify
      const afterCount = await mainPrisma.ingredient.count();
      console.log(`📊 Ingredients in main DB after: ${afterCount}`);
      
      if (afterCount === 0) {
        console.log('✅ Successfully cleared main database ingredients');
        console.log('📋 Now the app will use the portable database for ingredients');
      } else {
        console.log('❌ Failed to clear all ingredients');
      }
    } else {
      console.log('✅ Main database already has no ingredients');
    }
    
  } catch (error) {
    console.error('Error clearing ingredients:', error);
  } finally {
    await mainPrisma.$disconnect();
  }
}

clearMainDbIngredients(); 