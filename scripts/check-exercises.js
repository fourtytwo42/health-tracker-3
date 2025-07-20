const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExercises() {
  try {
    console.log('Checking exercises in database...\n');
    
    // Count total exercises
    const totalCount = await prisma.exercise.count();
    console.log(`Total exercises in database: ${totalCount}\n`);
    
    // Get some sample exercises
    const sampleExercises = await prisma.exercise.findMany({
      take: 10,
      orderBy: { activity: 'asc' }
    });
    
    console.log('Sample exercises:');
    sampleExercises.forEach((exercise, index) => {
      console.log(`${index + 1}. ${exercise.activity} (MET: ${exercise.met})`);
    });
    
    // Check by category
    const categories = await prisma.exercise.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    
    console.log('\nExercises by category:');
    categories.forEach(cat => {
      console.log(`- ${cat.category || 'No category'}: ${cat._count.category}`);
    });
    
    // Check MET value ranges
    const metStats = await prisma.exercise.aggregate({
      _min: { met: true },
      _max: { met: true },
      _avg: { met: true }
    });
    
    console.log('\nMET value statistics:');
    console.log(`- Min: ${metStats._min.met}`);
    console.log(`- Max: ${metStats._max.met}`);
    console.log(`- Average: ${metStats._avg.met?.toFixed(2)}`);
    
  } catch (error) {
    console.error('Error checking exercises:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkExercises();
}

module.exports = { checkExercises }; 