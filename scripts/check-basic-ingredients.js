const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBasicIngredients() {
  try {
    const ingredients = ['salt', 'milk', 'butter', 'pepper', 'garlic', 'potato'];
    
    for (const ingredient of ingredients) {
      console.log(`\n=== Searching for "${ingredient}" ===`);
      
      const results = await prisma.ingredient.findMany({
        where: {
          name: {
            contains: ingredient
          }
        },
        select: {
          name: true,
          category: true,
          description: true,
          calories: true
        },
        take: 5
      });

      console.log(`Found ${results.length} results:`);
      results.forEach((ing, i) => {
        console.log(`${i + 1}. ${ing.name} (${ing.category}) - ${ing.calories} cal`);
        console.log(`   Description: ${ing.description || 'No description'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBasicIngredients(); 