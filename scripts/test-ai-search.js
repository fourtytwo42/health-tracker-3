const fetch = require('node-fetch');

async function testAISearch() {
  const baseUrl = 'http://localhost:3000';
  
  // First, get an access token (you'll need to replace with actual credentials)
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'demo'
    })
  });

  if (!loginResponse.ok) {
    console.error('Failed to login:', await loginResponse.text());
    return;
  }

  const { accessToken } = await loginResponse.json();
  console.log('✅ Logged in successfully');

  // Test ingredients for AI search
  const testIngredients = [
    {
      id: '1',
      name: 'spices, pepper, black',
      description: 'Ground black pepper spice',
      category: 'Herbs & Spices',
      aisle: 'Spices',
      servingSize: '1 tsp',
      calories: 6,
      protein: 0.3,
      carbs: 1.5,
      fat: 0.1,
      fiber: 0.6,
      sugar: 0,
      sodium: 1,
      isActive: true
    },
    {
      id: '2',
      name: 'black beans, canned',
      description: 'Canned black beans',
      category: 'Legumes & Pulses',
      aisle: 'Canned Goods',
      servingSize: '100g',
      calories: 91,
      protein: 6.03,
      carbs: 16.6,
      fat: 0.29,
      fiber: 6.9,
      sugar: 0.23,
      sodium: 384,
      isActive: true
    },
    {
      id: '3',
      name: 'black tea, brewed',
      description: 'Brewed black tea',
      category: 'Beverages',
      aisle: 'Beverages',
      servingSize: '100g',
      calories: 1,
      protein: 0,
      carbs: 0.3,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 3,
      isActive: true
    }
  ];

  // Test AI search
  console.log('\n🔍 Testing AI search for "black pepper"...');
  
  const aiSearchResponse = await fetch(`${baseUrl}/api/ingredients/ai-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      searchTerm: 'black pepper',
      ingredients: testIngredients
    })
  });

  if (aiSearchResponse.ok) {
    const result = await aiSearchResponse.json();
    console.log('✅ AI Search successful!');
    console.log('Best match:', result.bestMatch.name);
    console.log('Reasoning:', result.reasoning);
    console.log('Total candidates analyzed:', result.totalCandidates);
  } else {
    const error = await aiSearchResponse.text();
    console.error('❌ AI Search failed:', error);
  }

  // Test with different search terms
  const testCases = [
    'pepper',
    'black beans',
    'tea',
    'spices'
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing AI search for "${testCase}"...`);
    
    const response = await fetch(`${baseUrl}/api/ingredients/ai-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        searchTerm: testCase,
        ingredients: testIngredients
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Best match for "${testCase}":`, result.bestMatch.name);
    } else {
      console.error(`❌ Failed for "${testCase}":`, await response.text());
    }
  }
}

// Run the test
testAISearch().catch(console.error); 