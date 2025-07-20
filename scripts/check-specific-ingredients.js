const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpecificIngredients() {
  try {
    console.log('Checking specific ingredients in database...\n');
    
    const searchTerms = [
      'duck',
      'olive oil',
      'butter',
      'salt',
      'corn',
      'cherry',
      'vinegar'
    ];
    
    for (const term of searchTerms) {
      console.log(`\nSearching for: "${term}"`);
      
      const ingredients = await prisma.ingredient.findMany({
        where: {
          name: {
            contains: term
          },
          isActive: true
        },
        take: 5,
        select: {
          name: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
          servingSize: true
        }
      });
      
      if (ingredients.length > 0) {
        ingredients.forEach((ing, index) => {
          console.log(`  ${index + 1}. ${ing.name}`);
          console.log(`     ${ing.calories} cal, ${ing.protein}g protein, ${ing.carbs}g carbs, ${ing.fat}g fat (per ${ing.servingSize})`);
        });
      } else {
        console.log('  No ingredients found');
      }
    }
    
  } catch (error) {
    console.error('Error checking ingredients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkSpecificIngredients();
}

module.exports = { checkSpecificIngredients }; 