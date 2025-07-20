const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearExercises() {
  try {
    console.log('Clearing all exercises from database...');
    
    const deletedCount = await prisma.exercise.deleteMany({});
    
    console.log(`Deleted ${deletedCount.count} exercises from database.`);
    
  } catch (error) {
    console.error('Error clearing exercises:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  clearExercises();
}

module.exports = { clearExercises }; 