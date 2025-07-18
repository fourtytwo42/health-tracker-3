const { PrismaClient } = require('@prisma/client');
const { seedUsdaIngredients } = require('./seed-usda-ingredients.js');

const prisma = new PrismaClient();

async function fixCalories() {
  try {
    console.log('🔧 Fixing calorie data in database...\n');
    
    // Check current state
    const totalIngredients = await prisma.ingredient.count();
    const zeroCalories = await prisma.ingredient.count({
      where: { calories: 0 }
    });
    const hasCalories = await prisma.ingredient.count({
      where: { calories: { gt: 0 } }
    });
    
    console.log(`Current state:`);
    console.log(`- Total ingredients: ${totalIngredients}`);
    console.log(`- Ingredients with 0 calories: ${zeroCalories}`);
    console.log(`- Ingredients with calories > 0: ${hasCalories}`);
    
    // Clear existing ingredients
    console.log('\n🗑️ Clearing existing ingredients...');
    await prisma.ingredient.deleteMany({});
    
    // Re-seed with improved logic
    console.log('\n🌱 Re-seeding with improved calorie extraction...');
    await seedUsdaIngredients();
    
    // Check new state
    const newTotalIngredients = await prisma.ingredient.count();
    const newZeroCalories = await prisma.ingredient.count({
      where: { calories: 0 }
    });
    const newHasCalories = await prisma.ingredient.count({
      where: { calories: { gt: 0 } }
    });
    
    console.log(`\n✅ New state:`);
    console.log(`- Total ingredients: ${newTotalIngredients}`);
    console.log(`- Ingredients with 0 calories: ${newZeroCalories}`);
    console.log(`- Ingredients with calories > 0: ${newHasCalories}`);
    
    // Show some examples
    console.log('\n📊 Examples of ingredients with calories:');
    const examples = await prisma.ingredient.findMany({
      where: { calories: { gt: 0 } },
      take: 10,
      select: {
        name: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        category: true
      }
    });
    
    examples.forEach(ing => {
      console.log(`- ${ing.name} (${ing.category}): ${ing.calories} cal, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat`);
    });
    
    console.log('\n🎉 Calorie data fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing calories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (require.main === module) {
  fixCalories()
    .then(() => {
      console.log('✅ Calorie fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Calorie fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixCalories }; 