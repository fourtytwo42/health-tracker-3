const { PrismaClient } = require('@prisma/client');
const { searchIngredients } = require('../lib/searchService');

const prisma = new PrismaClient();

async function testSearch() {
  console.log('🧪 Testing Improved Ingredient Search...\n');
  
  try {
    // Get all ingredients from database
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        aisle: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        fiber: true,
        sugar: true
      },
      take: 1000,
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Loaded ${ingredients.length} ingredients for testing\n`);

    // Test cases
    const testCases = [
      'black pepper',
      'pepper, black',
      'pepper black',
      'white pepper',
      'pepper, white',
      'chicken',
      'chicken breast',
      'breast chicken',
      'apple',
      'apples',
      'banana',
      'bananas'
    ];

    for (const testQuery of testCases) {
      console.log(`🔍 Testing: "${testQuery}"`);
      
      const results = searchIngredients(ingredients, testQuery, 5);
      
      if (results.length > 0) {
        console.log(`  ✅ Found ${results.length} results:`);
        results.forEach((result, index) => {
          console.log(`    ${index + 1}. ${result.name} (${result.category})`);
        });
      } else {
        console.log(`  ❌ No results found`);
      }
      console.log('');
    }

    // Test specific case that was failing
    console.log('🎯 Testing the specific failing case:');
    console.log('Query: "black pepper"');
    const blackPepperResults = searchIngredients(ingredients, 'black pepper', 10);
    
    if (blackPepperResults.length > 0) {
      console.log('✅ Found results:');
      blackPepperResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.name}`);
      });
    } else {
      console.log('❌ Still no results for "black pepper"');
    }

  } catch (error) {
    console.error('❌ Error testing search:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSearch(); 