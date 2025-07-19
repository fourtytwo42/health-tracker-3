const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Test both databases
const mainPrisma = new PrismaClient();
const portablePrisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(process.cwd(), 'data', 'health-tracker-data.db')}`,
    },
  },
});

async function testIngredientsAPI() {
  try {
    console.log('🔍 Testing ingredients API...\n');
    
    // Check both databases
    console.log('📊 Database counts:');
    const mainCount = await mainPrisma.ingredient.count();
    const portableCount = await portablePrisma.ingredient.count();
    console.log(`   Main DB: ${mainCount} ingredients`);
    console.log(`   Portable DB: ${portableCount} ingredients`);
    
    // Test the API endpoint
    console.log('\n🌐 Testing /api/ingredients endpoint...');
    const response = await fetch('http://localhost:3000/api/ingredients?page=1&pageSize=5');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API response successful:`);
      console.log(`   - Total ingredients: ${data.pagination?.totalCount || 'unknown'}`);
      console.log(`   - Ingredients returned: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        console.log(`   - First ingredient: ${data.data[0].name} (${data.data[0].calories} cal)`);
      }
    } else {
      const error = await response.text();
      console.log(`❌ API failed: ${response.status} - ${error}`);
    }
    
    // Test with admin token
    console.log('\n🔐 Testing with admin token...');
    const adminResponse = await fetch('http://localhost:3000/api/ingredients?page=1&pageSize=5', {
      headers: {
        'Authorization': 'Bearer admin-token-placeholder'
      }
    });
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log(`✅ Admin API response successful:`);
      console.log(`   - Total ingredients: ${adminData.pagination?.totalCount || 'unknown'}`);
    } else {
      const error = await adminResponse.text();
      console.log(`❌ Admin API failed: ${adminResponse.status} - ${error}`);
    }
    
  } catch (error) {
    console.error('Error testing ingredients API:', error);
  } finally {
    await mainPrisma.$disconnect();
    await portablePrisma.$disconnect();
  }
}

testIngredientsAPI(); 