const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple search function for testing
function simpleSearch(ingredients, query) {
  const queryLower = query.toLowerCase();
  
  return ingredients.filter(ingredient => {
    const nameLower = ingredient.name.toLowerCase();
    
    // Exact match
    if (nameLower === queryLower) return true;
    
    // Contains match
    if (nameLower.includes(queryLower)) return true;
    
    // Word order variations
    const queryWords = queryLower.split(/\s+/);
    const nameWords = nameLower.split(/\s+/);
    
    // Check if all query words are in the name (in any order)
    if (queryWords.length > 1) {
      return queryWords.every(word => 
        nameWords.some(nameWord => nameWord.includes(word))
      );
    }
    
    return false;
  }).sort((a, b) => {
    const aNameLower = a.name.toLowerCase();
    const bNameLower = b.name.toLowerCase();
    
    // Exact matches first
    const aExact = aNameLower === queryLower;
    const bExact = bNameLower === queryLower;
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // Starts with matches second
    const aStartsWith = aNameLower.startsWith(queryLower);
    const bStartsWith = bNameLower.startsWith(queryLower);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    // Alphabetical order
    return aNameLower.localeCompare(bNameLower);
  });
}

async function testSearch() {
  console.log('🧪 Testing Simple Ingredient Search...\n');
  
  try {
    // Get all ingredients from database
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        aisle: true
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
      
      const results = simpleSearch(ingredients, testQuery);
      
      if (results.length > 0) {
        console.log(`  ✅ Found ${results.length} results:`);
        results.slice(0, 5).forEach((result, index) => {
          console.log(`    ${index + 1}. ${result.name} (${result.category})`);
        });
        if (results.length > 5) {
          console.log(`    ... and ${results.length - 5} more`);
        }
      } else {
        console.log(`  ❌ No results found`);
      }
      console.log('');
    }

    // Test specific case that was failing
    console.log('🎯 Testing the specific failing case:');
    console.log('Query: "black pepper"');
    const blackPepperResults = simpleSearch(ingredients, 'black pepper');
    
    if (blackPepperResults.length > 0) {
      console.log('✅ Found results:');
      blackPepperResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.name}`);
      });
    } else {
      console.log('❌ Still no results for "black pepper"');
      
      // Let's see what pepper-related ingredients exist
      console.log('\n🔍 Looking for pepper-related ingredients:');
      const pepperIngredients = ingredients.filter(i => 
        i.name.toLowerCase().includes('pepper')
      );
      pepperIngredients.forEach(ingredient => {
        console.log(`  - ${ingredient.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing search:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSearch(); 