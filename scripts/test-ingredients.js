const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testIngredients() {
  try {
    console.log('Testing seeded ingredients data...\n');

    // Test 1: Count total ingredients
    const totalCount = await prisma.ingredient.count();
    console.log(`Total ingredients in database: ${totalCount}`);

    // Test 2: Check categories
    const categories = await prisma.ingredient.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { category: { not: null } }
    });
    console.log(`\nCategories found: ${categories.length}`);
    console.log('Sample categories:', categories.slice(0, 10).map(c => c.category));

    // Test 3: Check aisles
    const aisles = await prisma.ingredient.findMany({
      select: { aisle: true },
      distinct: ['aisle'],
      where: { aisle: { not: null } }
    });
    console.log(`\nAisles found: ${aisles.length}`);
    console.log('Sample aisles:', aisles.slice(0, 10).map(a => a.aisle));

    // Test 4: Test pagination (first page)
    const firstPage = await prisma.ingredient.findMany({
      take: 10,
      skip: 0,
      orderBy: { name: 'asc' }
    });
    console.log(`\nFirst page (10 items):`);
    firstPage.forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.name} (${ingredient.category || 'No category'})`);
    });

    // Test 5: Test pagination (second page)
    const secondPage = await prisma.ingredient.findMany({
      take: 10,
      skip: 10,
      orderBy: { name: 'asc' }
    });
    console.log(`\nSecond page (10 items):`);
    secondPage.forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.name} (${ingredient.category || 'No category'})`);
    });

    // Test 6: Search functionality
    const searchResults = await prisma.ingredient.findMany({
      where: {
        OR: [
          { name: { contains: 'apple' } },
          { description: { contains: 'apple' } },
          { category: { contains: 'apple' } }
        ]
      },
      take: 5
    });
    console.log(`\nSearch results for 'apple':`);
    searchResults.forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.name} (${ingredient.category || 'No category'})`);
    });

    // Test 7: Check nutritional data
    const sampleWithNutrition = await prisma.ingredient.findFirst({
      where: {
        calories: { gt: 0 },
        protein: { gt: 0 },
        carbs: { gt: 0 },
        fat: { gt: 0 }
      }
    });
    if (sampleWithNutrition) {
      console.log(`\nSample ingredient with nutrition data:`);
      console.log(`Name: ${sampleWithNutrition.name}`);
      console.log(`Calories: ${sampleWithNutrition.calories}`);
      console.log(`Protein: ${sampleWithNutrition.protein}g`);
      console.log(`Carbs: ${sampleWithNutrition.carbs}g`);
      console.log(`Fat: ${sampleWithNutrition.fat}g`);
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('Error testing ingredients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testIngredients(); 