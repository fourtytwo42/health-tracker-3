const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Main database
const mainPrisma = new PrismaClient({
  log: ['error'],
});

// Portable database
const portablePrisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(process.cwd(), 'data', 'health-tracker-data.db')}`,
    },
  },
  log: ['error'],
});

async function checkBothDatabases() {
  try {
    console.log('🔍 Checking both databases...\n');
    
    // Check main database
    console.log('📊 Main Database (prisma/dev.db):');
    const mainIngredients = await mainPrisma.ingredient.count();
    const mainExercises = await mainPrisma.exercise.count();
    console.log(`   Ingredients: ${mainIngredients}`);
    console.log(`   Exercises: ${mainExercises}`);
    
    // Check portable database
    console.log('\n📊 Portable Database (data/health-tracker-data.db):');
    const portableIngredients = await portablePrisma.ingredient.count();
    const portableExercises = await portablePrisma.exercise.count();
    console.log(`   Ingredients: ${portableIngredients}`);
    console.log(`   Exercises: ${portableExercises}`);
    
    // Summary
    console.log('\n📋 Summary:');
    if (mainIngredients > 0) {
      console.log(`   ⚠️  Main DB has ${mainIngredients} ingredients (should be 0)`);
    } else {
      console.log(`   ✅ Main DB has no ingredients (correct)`);
    }
    
    if (portableIngredients > 0) {
      console.log(`   ✅ Portable DB has ${portableIngredients} ingredients (correct)`);
    } else {
      console.log(`   ❌ Portable DB has no ingredients (should have data)`);
    }
    
    // Show sample from portable DB
    if (portableIngredients > 0) {
      const sample = await portablePrisma.ingredient.findFirst({
        orderBy: { name: 'asc' }
      });
      console.log(`\n🥗 Sample from portable DB: ${sample.name} (${sample.calories} cal)`);
    }
    
  } catch (error) {
    console.error('Error checking databases:', error);
  } finally {
    await mainPrisma.$disconnect();
    await portablePrisma.$disconnect();
  }
}

checkBothDatabases(); 