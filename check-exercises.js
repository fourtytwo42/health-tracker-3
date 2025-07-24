const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExercises() {
  try {
    console.log('Checking available exercises...\n');
    
    // Get some sample exercises
    const exercises = await prisma.exercise.findMany({
      where: { isActive: true },
      take: 20,
      orderBy: { activity: 'asc' }
    });
    
    console.log('Sample exercises in database:');
    exercises.forEach((exercise, index) => {
      console.log(`${index + 1}. ${exercise.activity} (Code: ${exercise.code}, Category: ${exercise.category}, MET: ${exercise.met})`);
    });
    
    // Get exercise categories
    const categories = await prisma.exercise.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true }
    });
    
    console.log('\nExercise categories:');
    categories.forEach(cat => {
      console.log(`- ${cat.category}: ${cat._count.category} exercises`);
    });
    
    // Get total count
    const totalCount = await prisma.exercise.count({
      where: { isActive: true }
    });
    
    console.log(`\nTotal active exercises: ${totalCount}`);
    
  } catch (error) {
    console.error('Error checking exercises:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExercises(); 