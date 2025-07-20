const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple flexible search function for testing
function searchIngredientsFlexible(ingredients, query, limit = 20) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
  
  const results = ingredients.filter(ingredient => {
    const nameLower = ingredient.name.toLowerCase();
    
    // Exact match
    if (nameLower === queryLower) return true;
    
    // Contains match
    if (nameLower.includes(queryLower)) return true;
    
    // Word order variations (for multi-word queries)
    if (queryWords.length > 1) {
      // Check if all query words are present in the ingredient name
      const nameWords = nameLower.split(/\s+/);
      return queryWords.every(queryWord => 
        nameWords.some(nameWord => nameWord.includes(queryWord))
      );
    }
    
    // Single word - check if it's contained in the name
    return nameLower.includes(queryWords[0]);
  });

  // Sort by relevance
  const sortedResults = results.sort((a, b) => {
    const aNameLower = a.name.toLowerCase();
    const bNameLower = b.name.toLowerCase();
    
    // Exact matches get highest priority
    const aExact = aNameLower === queryLower;
    const bExact = bNameLower === queryLower;
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    // Starts with matches get second priority
    const aStartsWith = aNameLower.startsWith(queryLower);
    const bStartsWith = bNameLower.startsWith(queryLower);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    // Contains matches get third priority
    const aContains = aNameLower.includes(queryLower);
    const bContains = bNameLower.includes(queryLower);
    
    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;
    
    // Finally, sort alphabetically
    return aNameLower.localeCompare(bNameLower);
  });
  
  return sortedResults.slice(0, limit);
}

async function testFlexibleSearch() {
  console.log('🧪 Testing Flexible Ingredient Search...\n');
  
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
      
      const results = searchIngredientsFlexible(ingredients, testQuery, 5);
      
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
    const blackPepperResults = searchIngredientsFlexible(ingredients, 'black pepper', 10);
    
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
      if (pepperIngredients.length > 0) {
        pepperIngredients.forEach(ingredient => {
          console.log(`  - ${ingredient.name}`);
        });
      } else {
        console.log('  No pepper ingredients found in database');
      }
    }

  } catch (error) {
    console.error('❌ Error testing search:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFlexibleSearch(); 