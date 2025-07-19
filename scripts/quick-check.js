const { PrismaClient } = require('@prisma/client');
const path = require('path');

const portablePrisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(process.cwd(), 'data', 'health-tracker-data.db')}`,
    },
  },
});

async function quickCheck() {
  try {
    console.log('🔍 Quick check of portable database...\n');
    
    const count = await portablePrisma.ingredient.count();
    const withCalories = await portablePrisma.ingredient.count({
      where: { calories: { gt: 0 } }
    });
    const zeroCalories = await portablePrisma.ingredient.count({
      where: { calories: 0 }
    });
    
    console.log(`📊 Total ingredients: ${count}`);
    console.log(`📊 With calories: ${withCalories}`);
    console.log(`📊 Zero calories: ${zeroCalories}`);
    console.log(`📊 Percentage with calories: ${((withCalories / count) * 100).toFixed(1)}%`);
    
    const sample = await portablePrisma.ingredient.findFirst({
      where: { calories: { gt: 0 } },
      orderBy: { name: 'asc' }
    });
    
    if (sample) {
      console.log(`\n🥗 Sample ingredient with calories:`);
      console.log(`   ${sample.name}`);
      console.log(`   Calories: ${sample.calories}, Protein: ${sample.protein}g, Carbs: ${sample.carbs}g, Fat: ${sample.fat}g`);
    }
    
    const exerciseCount = await portablePrisma.exercise.count();
    console.log(`\n🏃 Total exercises: ${exerciseCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await portablePrisma.$disconnect();
  }
}

quickCheck(); 