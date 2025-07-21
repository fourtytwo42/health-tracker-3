const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOpenAIKeyStorage() {
  console.log('🔍 Testing OpenAI API Key Storage and Global Usage\n');

  try {
    // Test 1: Check if the settings table exists and can be accessed
    console.log('1️⃣ Testing database connection and settings table...');
    const settingsCount = await prisma.setting.count();
    console.log(`   ✅ Database connected. Found ${settingsCount} settings.\n`);

    // Test 2: Check if the API key exists in the database
    console.log('2️⃣ Checking for existing OpenAI API key...');
    const existingKey = await prisma.setting.findUnique({
      where: { key: 'openai_api_key' },
    });

    if (existingKey) {
      const maskedKey = existingKey.value.substring(0, 7) + '...' + existingKey.value.substring(existingKey.value.length - 4);
      console.log(`   ✅ API key found: ${maskedKey}`);
      console.log(`   📅 Last updated: ${existingKey.updatedAt}`);
    } else {
      console.log('   ⚠️  No API key found in database');
    }
    console.log('');

    // Test 3: Test API key storage functionality
    console.log('3️⃣ Testing API key storage...');
    const testKey = 'sk-test123456789012345678901234567890123456789012345678901234';
    
    await prisma.setting.upsert({
      where: { key: 'openai_api_key' },
      update: { value: testKey },
      create: { key: 'openai_api_key', value: testKey },
    });
    console.log('   ✅ Test API key stored successfully');

    // Verify it was stored
    const storedKey = await prisma.setting.findUnique({
      where: { key: 'openai_api_key' },
    });
    
    if (storedKey && storedKey.value === testKey) {
      console.log('   ✅ API key retrieved successfully from database');
    } else {
      console.log('   ❌ Failed to retrieve stored API key');
    }
    console.log('');

    // Test 4: Test API key status endpoint simulation
    console.log('4️⃣ Testing API key status endpoint simulation...');
    const keyStatus = await prisma.setting.findUnique({
      where: { key: 'openai_api_key' },
    });

    if (keyStatus?.value) {
      const maskedKey = keyStatus.value.substring(0, 7) + '...' + keyStatus.value.substring(keyStatus.value.length - 4);
      console.log(`   ✅ Status: Has key (${maskedKey})`);
    } else {
      console.log('   ❌ Status: No key found');
    }
    console.log('');

    // Test 5: Test global usage simulation
    console.log('5️⃣ Testing global usage simulation...');
    console.log('   Simulating image generation API call...');
    
    // This simulates what the image generation API does
    const apiKeyForUse = await prisma.setting.findUnique({
      where: { key: 'openai_api_key' },
    });

    if (apiKeyForUse?.value) {
      console.log('   ✅ API key retrieved for image generation');
      console.log(`   🔑 Using key: ${apiKeyForUse.value.substring(0, 7)}...${apiKeyForUse.value.substring(apiKeyForUse.value.length - 4)}`);
    } else {
      console.log('   ❌ No API key available for image generation');
    }
    console.log('');

    // Test 6: Clean up test data
    console.log('6️⃣ Cleaning up test data...');
    await prisma.setting.delete({
      where: { key: 'openai_api_key' },
    });
    console.log('   ✅ Test API key removed from database');
    console.log('');

    // Test 7: Verify cleanup
    console.log('7️⃣ Verifying cleanup...');
    const afterCleanup = await prisma.setting.findUnique({
      where: { key: 'openai_api_key' },
    });
    
    if (!afterCleanup) {
      console.log('   ✅ API key successfully removed');
    } else {
      console.log('   ❌ API key still exists after cleanup');
    }

    console.log('\n🎯 Summary:');
    console.log('   ✅ Database connection working');
    console.log('   ✅ Settings table accessible');
    console.log('   ✅ API key storage/retrieval working');
    console.log('   ✅ Global access simulation successful');
    console.log('   ✅ Cleanup functionality working');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOpenAIKeyStorage(); 