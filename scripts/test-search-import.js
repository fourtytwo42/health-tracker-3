console.log('🧪 Testing search function import...\n');

try {
  // Test if we can require the search service
  const { searchIngredientsFlexible } = require('../lib/searchService');
  console.log('✅ Successfully imported searchIngredientsFlexible function');
  
  // Test with mock data
  const mockIngredients = [
    { id: '1', name: 'spices, pepper, black', category: 'Spices and Herbs', aisle: 'Spices' },
    { id: '2', name: 'spices, pepper, white', category: 'Spices and Herbs', aisle: 'Spices' },
    { id: '3', name: 'chicken breast', category: 'Proteins', aisle: 'Meat' },
    { id: '4', name: 'apple, raw', category: 'Fruits', aisle: 'Produce' }
  ];
  
  console.log('\n🔍 Testing with mock data:');
  
  const testQueries = ['black pepper', 'pepper, black', 'pepper black', 'chicken', 'apple'];
  
  testQueries.forEach(query => {
    console.log(`\nQuery: "${query}"`);
    const results = searchIngredientsFlexible(mockIngredients, query, 5);
    
    if (results.length > 0) {
      console.log(`  ✅ Found ${results.length} results:`);
      results.forEach((result, index) => {
        console.log(`    ${index + 1}. ${result.name}`);
      });
    } else {
      console.log(`  ❌ No results found`);
    }
  });
  
} catch (error) {
  console.error('❌ Error importing or using search function:', error);
} 