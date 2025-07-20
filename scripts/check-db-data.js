const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('Checking database for ingredients and exercises...\n');
    
    // Check ingredients
    const ingredientCount = await prisma.ingredient.count();
    console.log(`Ingredients in database: ${ingredientCount}`);
    
    if (ingredientCount > 0) {
      const sampleIngredients = await prisma.ingredient.findMany({ 
        take: 10,
        select: {
          name: true,
          category: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true
        }
      });
      console.log('\nSample ingredients:');
      sampleIngredients.forEach(ing => {
        console.log(`- ${ing.name} (${ing.category}): ${ing.calories} cal, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat`);
      });
    }
    
    // Check exercises
    const exerciseCount = await prisma.exercise.count();
    console.log(`\nExercises in database: ${exerciseCount}`);
    
    if (exerciseCount > 0) {
      const sampleExercises = await prisma.exercise.findMany({ 
        take: 10,
        select: {
          name: true,
          category: true,
          caloriesPerMinute: true
        }
      });
      console.log('\nSample exercises:');
      sampleExercises.forEach(ex => {
        console.log(`- ${ex.name} (${ex.category}): ${ex.caloriesPerMinute} cal/min`);
      });
    }
    
    // Check if tables exist
    console.log('\nChecking table structure...');
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log('Available tables:', tables.map(t => t.name));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 