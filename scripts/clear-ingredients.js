const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearIngredients() {
  try {
    console.log('Clearing all ingredients...');
    const result = await prisma.ingredient.deleteMany({});
    console.log(`Deleted ${result.count} ingredients`);
  } catch (error) {
    console.error('Error clearing ingredients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearIngredients(); 