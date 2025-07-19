const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearMain() {
  try {
    console.log('Clearing ingredients from main database...');
    const count = await prisma.ingredient.count();
    console.log('Before:', count);
    
    if (count > 0) {
      await prisma.ingredient.deleteMany({});
      console.log('Cleared ingredients');
    }
    
    const afterCount = await prisma.ingredient.count();
    console.log('After:', afterCount);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearMain(); 