const fetch = require('node-fetch');

async function testExerciseAISearch() {
  try {
    // First, login to get an access token
    console.log('Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.accessToken;

    console.log('Login successful, testing exercise AI search...');

    // Test exercise AI search
    const aiSearchResponse = await fetch('http://localhost:3000/api/exercises/ai-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        searchTerm: 'running',
        category: undefined,
        intensity: undefined,
        metRange: undefined
      })
    });

    if (!aiSearchResponse.ok) {
      const errorData = await aiSearchResponse.json();
      console.error('AI search failed:', errorData);
      return;
    }

    const aiSearchResult = await aiSearchResponse.json();
    console.log('AI Search Result:');
    console.log(JSON.stringify(aiSearchResult, null, 2));

    // Test regular exercise search for comparison
    console.log('\nTesting regular exercise search...');
    const regularSearchResponse = await fetch('http://localhost:3000/api/exercises?search=running&page=1&pageSize=10', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (regularSearchResponse.ok) {
      const regularSearchResult = await regularSearchResponse.json();
      console.log('Regular Search Results:');
      console.log(`Found ${regularSearchResult.exercises.length} exercises`);
      regularSearchResult.exercises.slice(0, 3).forEach((exercise, index) => {
        console.log(`${index + 1}. ${exercise.activity} (${exercise.category}) - MET: ${exercise.met}`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testExerciseAISearch(); 