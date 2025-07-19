const { portablePrisma } = require('../lib/prisma');

async function checkIngredients() {
  try {
    console.log('🔍 Checking ingredients in portable database...\n');
    
    // Get total count
    const totalCount = await portablePrisma.ingredient.count();
    console.log(`📊 Total ingredients: ${totalCount}`);
    
    // Check calorie distribution
    const zeroCalories = await portablePrisma.ingredient.count({
      where: { calories: 0 }
    });
    
    const withCalories = await portablePrisma.ingredient.count({
      where: { calories: { gt: 0 } }
    });
    
    console.log(`📊 Ingredients with calories: ${withCalories}`);
    console.log(`📊 Ingredients with 0 calories: ${zeroCalories}`);
    console.log(`📊 Percentage with calories: ${((withCalories / totalCount) * 100).toFixed(1)}%`);
    
    // Show some sample ingredients
    console.log('\n🥗 Sample ingredients with calories:');
    const samplesWithCalories = await portablePrisma.ingredient.findMany({
      where: { calories: { gt: 0 } },
      take: 5,
      orderBy: { name: 'asc' }
    });
    
    samplesWithCalories.forEach((ingredient, index) => {
      console.log(`   ${index + 1}. ${ingredient.name}`);
      console.log(`      Calories: ${ingredient.calories}, Protein: ${ingredient.protein}g, Carbs: ${ingredient.carbs}g, Fat: ${ingredient.fat}g`);
    });
    
    // Show some ingredients with 0 calories
    console.log('\n🥗 Sample ingredients with 0 calories:');
    const samplesZeroCalories = await portablePrisma.ingredient.findMany({
      where: { calories: 0 },
      take: 5,
      orderBy: { name: 'asc' }
    });
    
    samplesZeroCalories.forEach((ingredient, index) => {
      console.log(`   ${index + 1}. ${ingredient.name}`);
      console.log(`      Calories: ${ingredient.calories}, Protein: ${ingredient.protein}g, Carbs: ${ingredient.carbs}g, Fat: ${ingredient.fat}g`);
    });
    
    // Check exercises too
    const exerciseCount = await portablePrisma.exercise.count();
    console.log(`\n🏃 Total exercises: ${exerciseCount}`);
    
  } catch (error) {
    console.error('Error checking ingredients:', error);
  } finally {
    await portablePrisma.$disconnect();
  }
}

checkIngredients(); 