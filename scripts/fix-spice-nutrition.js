const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSpiceNutrition() {
  try {
    console.log('🔧 Fixing spice nutrition data...');
    
    // Update all spices and herbs to have 0 nutrition
    const result = await prisma.ingredient.updateMany({
      where: {
        category: 'Spices and Herbs',
        isActive: true
      },
      data: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        cholesterol: 0,
        saturatedFat: 0,
        transFat: 0,
        monounsaturatedFat: 0,
        polyunsaturatedFat: 0,
        netCarbs: 0,
        glycemicIndex: 0,
        glycemicLoad: 0
      }
    });
    
    console.log(`✅ Updated ${result.count} spice ingredients to have 0 nutrition`);
    
    // Also fix specific spice ingredients by name
    const specificSpices = [
      'spices, pepper, black',
      'salt, table, iodized',
      'vanilla extract',
      'spices, chili powder',
      'spices, poultry seasoning',
      'spices, dill weed, dried'
    ];
    
    for (const spiceName of specificSpices) {
      const updated = await prisma.ingredient.updateMany({
        where: {
          name: spiceName,
          isActive: true
        },
        data: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          cholesterol: 0,
          saturatedFat: 0,
          transFat: 0,
          monounsaturatedFat: 0,
          polyunsaturatedFat: 0,
          netCarbs: 0,
          glycemicIndex: 0,
          glycemicLoad: 0
        }
      });
      
      if (updated.count > 0) {
        console.log(`✅ Fixed nutrition for: ${spiceName}`);
      }
    }
    
    // Verify the fix
    const blackPepper = await prisma.ingredient.findFirst({
      where: {
        name: 'spices, pepper, black',
        isActive: true
      }
    });
    
    if (blackPepper) {
      console.log(`\n🔍 Verification - Black pepper nutrition:`);
      console.log(`Calories: ${blackPepper.calories}`);
      console.log(`Protein: ${blackPepper.protein}g`);
      console.log(`Carbs: ${blackPepper.carbs}g`);
      console.log(`Fat: ${blackPepper.fat}g`);
    }
    
    console.log('\n✅ Spice nutrition fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing spice nutrition:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpiceNutrition(); 