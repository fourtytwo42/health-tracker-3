const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  try {
    // Create admin user
    const adminPasswordHash = await bcrypt.hash('demo', 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        email: 'admin@demo.com',
        password: adminPasswordHash,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
    console.log('✅ Admin user created/updated');

    // Create demo user
    const demoPasswordHash = await bcrypt.hash('demo', 12);
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@demo.com' },
      update: {},
      create: {
        email: 'demo@demo.com',
        password: demoPasswordHash,
        name: 'Demo User',
        role: 'USER'
      }
    });
    console.log('✅ Demo user created/updated');

    // Create test user
    const testPasswordHash = await bcrypt.hash('test', 12);
    const testUser = await prisma.user.upsert({
      where: { email: 'test@test.com' },
      update: {},
      create: {
        email: 'test@test.com',
        password: testPasswordHash,
        name: 'Test User',
        role: 'USER'
      }
    });
    console.log('✅ Test user created/updated');

    return [adminUser, demoUser, testUser];
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    throw error;
  }
}

async function seedUserDetails(users) {
  console.log('👤 Seeding user details...');
  
  try {
    for (const user of users) {
      await prisma.userDetail.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          age: 30,
          weight: 70,
          height: 175,
          gender: 'OTHER',
          activityLevel: 'MODERATE',
          goal: 'MAINTAIN',
          dietaryRestrictions: [],
          allergies: [],
          preferences: []
        }
      });
    }
    console.log('✅ User details created/updated');
  } catch (error) {
    console.error('❌ Error seeding user details:', error.message);
    throw error;
  }
}

async function seedSystemMessages() {
  console.log('💬 Seeding system messages...');
  
  try {
    const systemMessages = [
      {
        key: 'chat_welcome',
        message: 'Hello! I\'m your AI health companion. I can help you track meals, activities, and provide nutrition advice. How can I assist you today?',
        category: 'CHAT',
        isActive: true
      },
      {
        key: 'meal_suggestions',
        message: 'I can suggest meals based on your preferences, dietary restrictions, and nutritional goals. Would you like me to recommend something?',
        category: 'MEALS',
        isActive: true
      },
      {
        key: 'activity_tracking',
        message: 'I can help you track your physical activities and calculate calories burned. What activity would you like to log?',
        category: 'ACTIVITIES',
        isActive: true
      },
      {
        key: 'nutrition_advice',
        message: 'I can provide nutrition advice based on your goals and current intake. What would you like to know about?',
        category: 'NUTRITION',
        isActive: true
      }
    ];

    for (const message of systemMessages) {
      await prisma.systemMessage.upsert({
        where: { key: message.key },
        update: message,
        create: message
      });
    }
    console.log('✅ System messages created/updated');
  } catch (error) {
    console.error('❌ Error seeding system messages:', error.message);
    throw error;
  }
}

async function seedLLMProviders() {
  console.log('🤖 Seeding LLM providers...');
  
  try {
    const providers = [
      {
        name: 'OpenAI',
        isActive: true,
        priority: 1,
        config: {
          apiKey: process.env.OPENAI_API_KEY || '',
          model: 'gpt-4',
          maxTokens: 1000
        }
      },
      {
        name: 'Ollama',
        isActive: true,
        priority: 2,
        config: {
          endpoint: 'http://localhost:11434',
          model: 'llama2',
          maxTokens: 1000
        }
      }
    ];

    for (const provider of providers) {
      await prisma.lLMProvider.upsert({
        where: { name: provider.name },
        update: provider,
        create: provider
      });
    }
    console.log('✅ LLM providers created/updated');
  } catch (error) {
    console.error('❌ Error seeding LLM providers:', error.message);
    throw error;
  }
}

async function seedLLMSettings() {
  console.log('⚙️ Seeding LLM settings...');
  
  try {
    const settings = [
      {
        key: 'default_provider',
        value: 'OpenAI',
        description: 'Default LLM provider to use'
      },
      {
        key: 'max_tokens',
        value: '1000',
        description: 'Maximum tokens for LLM responses'
      },
      {
        key: 'temperature',
        value: '0.7',
        description: 'Temperature for LLM responses'
      }
    ];

    for (const setting of settings) {
      await prisma.lLMSetting.upsert({
        where: { key: setting.key },
        update: setting,
        create: setting
      });
    }
    console.log('✅ LLM settings created/updated');
  } catch (error) {
    console.error('❌ Error seeding LLM settings:', error.message);
    throw error;
  }
}

async function seedBasicIngredients() {
  console.log('🥗 Seeding basic ingredients...');
  
  try {
    const ingredients = [
      {
        name: 'Chicken Breast',
        description: 'Skinless, boneless chicken breast',
        servingSize: '100g',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sugar: 0,
        sodium: 74,
        cholesterol: 85,
        saturatedFat: 1.1,
        monounsaturatedFat: 1.2,
        polyunsaturatedFat: 0.8,
        transFat: 0,
        netCarbs: 0,
        category: 'Meat & Poultry',
        aisle: 'Meat & Poultry',
        isActive: true
      },
      {
        name: 'Brown Rice',
        description: 'Cooked brown rice',
        servingSize: '100g',
        calories: 111,
        protein: 2.6,
        carbs: 23,
        fat: 0.9,
        fiber: 1.8,
        sugar: 0.4,
        sodium: 5,
        cholesterol: 0,
        saturatedFat: 0.2,
        monounsaturatedFat: 0.3,
        polyunsaturatedFat: 0.3,
        transFat: 0,
        netCarbs: 21.2,
        category: 'Grains',
        aisle: 'Pantry',
        isActive: true
      },
      {
        name: 'Broccoli',
        description: 'Raw broccoli florets',
        servingSize: '100g',
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fat: 0.4,
        fiber: 2.6,
        sugar: 1.5,
        sodium: 33,
        cholesterol: 0,
        saturatedFat: 0.1,
        monounsaturatedFat: 0.1,
        polyunsaturatedFat: 0.2,
        transFat: 0,
        netCarbs: 4.4,
        category: 'Vegetables',
        aisle: 'Produce',
        isActive: true
      },
      {
        name: 'Salmon',
        description: 'Atlantic salmon, cooked',
        servingSize: '100g',
        calories: 208,
        protein: 25,
        carbs: 0,
        fat: 12,
        fiber: 0,
        sugar: 0,
        sodium: 59,
        cholesterol: 63,
        saturatedFat: 2.3,
        monounsaturatedFat: 4.4,
        polyunsaturatedFat: 3.8,
        transFat: 0,
        netCarbs: 0,
        category: 'Seafood',
        aisle: 'Seafood',
        isActive: true
      },
      {
        name: 'Greek Yogurt',
        description: 'Plain, non-fat Greek yogurt',
        servingSize: '100g',
        calories: 59,
        protein: 10,
        carbs: 3.6,
        fat: 0.4,
        fiber: 0,
        sugar: 3.2,
        sodium: 36,
        cholesterol: 5,
        saturatedFat: 0.1,
        monounsaturatedFat: 0.1,
        polyunsaturatedFat: 0.1,
        transFat: 0,
        netCarbs: 3.6,
        category: 'Dairy',
        aisle: 'Dairy & Eggs',
        isActive: true
      }
    ];

    for (const ingredient of ingredients) {
      await prisma.ingredient.upsert({
        where: { name: ingredient.name },
        update: ingredient,
        create: ingredient
      });
    }
    console.log('✅ Basic ingredients created/updated');
  } catch (error) {
    console.error('❌ Error seeding basic ingredients:', error.message);
    throw error;
  }
}

async function seedSampleData() {
  console.log('📊 Seeding sample data...');
  
  try {
    // Get the demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@demo.com' }
    });

    if (!demoUser) {
      console.log('⚠️ Demo user not found, skipping sample data');
      return;
    }

    // Create sample meals
    const meals = [
      {
        userId: demoUser.id,
        name: 'Breakfast Bowl',
        description: 'Greek yogurt with berries and granola',
        calories: 350,
        protein: 15,
        carbs: 45,
        fat: 12,
        mealType: 'BREAKFAST',
        date: new Date()
      },
      {
        userId: demoUser.id,
        name: 'Grilled Chicken Salad',
        description: 'Mixed greens with grilled chicken breast',
        calories: 280,
        protein: 35,
        carbs: 8,
        fat: 12,
        mealType: 'LUNCH',
        date: new Date()
      }
    ];

    for (const meal of meals) {
      await prisma.meal.create({
        data: meal
      });
    }

    // Create sample activities
    const activities = [
      {
        userId: demoUser.id,
        name: 'Morning Walk',
        description: '30 minute brisk walk',
        caloriesBurned: 150,
        duration: 30,
        activityType: 'CARDIO',
        date: new Date()
      },
      {
        userId: demoUser.id,
        name: 'Weight Training',
        description: 'Upper body workout',
        caloriesBurned: 200,
        duration: 45,
        activityType: 'STRENGTH',
        date: new Date()
      }
    ];

    for (const activity of activities) {
      await prisma.activity.create({
        data: activity
      });
    }

    // Create sample biomarkers
    const biomarkers = [
      {
        userId: demoUser.id,
        name: 'Weight',
        value: 70,
        unit: 'kg',
        date: new Date()
      },
      {
        userId: demoUser.id,
        name: 'Blood Pressure',
        value: 120,
        unit: 'mmHg',
        date: new Date()
      }
    ];

    for (const biomarker of biomarkers) {
      await prisma.biomarker.create({
        data: biomarker
      });
    }

    // Create sample goals
    const goals = [
      {
        userId: demoUser.id,
        name: 'Weight Loss',
        description: 'Lose 5kg in 3 months',
        targetValue: 65,
        currentValue: 70,
        unit: 'kg',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        status: 'IN_PROGRESS'
      }
    ];

    for (const goal of goals) {
      await prisma.goal.create({
        data: goal
      });
    }

    console.log('✅ Sample data created');
  } catch (error) {
    console.error('❌ Error seeding sample data:', error.message);
    throw error;
  }
}

async function seedQuick() {
  console.log('🚀 Starting Quick Database Seeding...\n');
  
  try {
    // Step 1: Seed users
    const users = await seedUsers();
    
    // Step 2: Seed user details
    await seedUserDetails(users);
    
    // Step 3: Seed system messages
    await seedSystemMessages();
    
    // Step 4: Seed LLM providers and settings
    await seedLLMProviders();
    await seedLLMSettings();
    
    // Step 5: Seed basic ingredients
    await seedBasicIngredients();
    
    // Step 6: Seed sample data
    await seedSampleData();
    
    console.log('\n🎉 Quick seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@demo.com / demo');
    console.log('   Demo: demo@demo.com / demo');
    console.log('   Test: test@test.com / test');
    console.log('\n🚀 You can now start the application:');
    console.log('   npm run dev');
    console.log('   Then visit: http://localhost:3001');
    
  } catch (error) {
    console.error('\n❌ Error during quick seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedQuick();
}

module.exports = { seedQuick }; 