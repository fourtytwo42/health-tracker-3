const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkButterNutrition() {
  try {
    console.log('🔍 Checking butter nutrition data...');
    
    const butter = await prisma.ingredient.findFirst({
      where: {
        name: 'butter, stick, unsalted',
        isActive: true
      }
    });
    
    if (butter) {
      console.log(`\n🔍 Current butter nutrition:`);
      console.log(`Name: ${butter.name}`);
      console.log(`Serving size: ${butter.servingSize}`);
      console.log(`Calories: ${butter.calories}`);
      console.log(`Protein: ${butter.protein}g`);
      console.log(`Carbs: ${butter.carbs}g`);
      console.log(`Fat: ${butter.fat}g`);
      
      // Butter should have calories (about 100-120 cal per 14g serving)
      if (butter.calories === 0) {
        console.log('\n❌ Butter has 0 calories - this is wrong!');
        console.log('Butter should have about 100-120 calories per 14g serving');
        
        // Fix butter nutrition
        const updated = await prisma.ingredient.update({
          where: { id: butter.id },
          data: {
            calories: 102, // Standard butter calories per 14g
            protein: 0.12,
            carbs: 0.01,
            fat: 11.52,
            fiber: 0,
            sugar: 0.01,
            sodium: 2
          }
        });
        
        console.log('✅ Fixed butter nutrition data');
        console.log(`New calories: ${updated.calories}`);
        console.log(`New fat: ${updated.fat}g`);
      } else {
        console.log('✅ Butter nutrition looks correct');
      }
    } else {
      console.log('❌ Butter ingredient not found');
    }
    
  } catch (error) {
    console.error('❌ Error checking butter nutrition:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkButterNutrition(); 