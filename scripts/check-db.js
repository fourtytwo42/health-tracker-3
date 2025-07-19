const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Main database for user data
const mainPrisma = new PrismaClient();

// Portable database for ingredients and exercises
const portablePrisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(process.cwd(), 'data', 'health-tracker-data.db')}`,
    },
  },
});

async function checkDatabases() {
  try {
    console.log('🔍 Checking Main Database (prisma/dev.db)...');
    
    // Check main database
    const mainUserCount = await mainPrisma.user.count();
    const mainSystemMessageCount = await mainPrisma.systemMessage.count();
    const mainMealCount = await mainPrisma.meal.count();
    const mainActivityCount = await mainPrisma.activity.count();
    
    console.log('📊 Main Database Counts:');
    console.log(`   Users: ${mainUserCount}`);
    console.log(`   System Messages (AI Prompts): ${mainSystemMessageCount}`);
    console.log(`   Meals: ${mainMealCount}`);
    console.log(`   Activities: ${mainActivityCount}`);
    
    if (mainSystemMessageCount > 0) {
      const sampleSystemMessage = await mainPrisma.systemMessage.findFirst();
      console.log('\n🤖 Sample System Message:');
      console.log(`   Key: ${sampleSystemMessage.key}`);
      console.log(`   Category: ${sampleSystemMessage.category}`);
    }
    
    console.log('\n🔍 Checking Portable Database (data/health-tracker-data.db)...');
    
    // Check portable database
    const portableExerciseCount = await portablePrisma.exercise.count();
    const portableIngredientCount = await portablePrisma.ingredient.count();
    
    console.log('📊 Portable Database Counts:');
    console.log(`   Exercises: ${portableExerciseCount}`);
    console.log(`   Ingredients: ${portableIngredientCount}`);
    
    if (portableExerciseCount > 0) {
      const sampleExercise = await portablePrisma.exercise.findFirst();
      console.log('\n📝 Sample Exercise:');
      console.log(`   Activity: ${sampleExercise.activity}`);
      console.log(`   Code: ${sampleExercise.code}`);
      console.log(`   MET: ${sampleExercise.met}`);
    }
    
    if (portableIngredientCount > 0) {
      const sampleIngredient = await portablePrisma.ingredient.findFirst();
      console.log('\n🥗 Sample Ingredient:');
      console.log(`   Name: ${sampleIngredient.name}`);
      console.log(`   Calories: ${sampleIngredient.calories}`);
      console.log(`   Protein: ${sampleIngredient.protein}g`);
    }
    
  } catch (error) {
    console.error('❌ Error checking databases:', error);
  } finally {
    await mainPrisma.$disconnect();
    await portablePrisma.$disconnect();
  }
}

checkDatabases(); 