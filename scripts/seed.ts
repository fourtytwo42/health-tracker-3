import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('Seeding users...');
  
  // Create admin user
  const adminPasswordHash = await bcrypt.hash('demo', 12);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          activityLevel: 'MODERATELY_ACTIVE',
          dietaryPreferences: JSON.stringify(['VEGETARIAN']),
          calorieTarget: 2000,
          proteinTarget: 150,
          carbTarget: 200,
          fatTarget: 65,
          fiberTarget: 25,
          privacySettings: JSON.stringify({ leaderboardVisible: true })
        }
      },
      leaderboard: {
        create: {
          totalPoints: 1250,
          rank: 1
        }
      }
    }
  });

  // Create demo user
  const demoPasswordHash = await bcrypt.hash('demo', 12);
  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@example.com',
      passwordHash: demoPasswordHash,
      role: 'USER',
      profile: {
        create: {
          firstName: 'Demo',
          lastName: 'User',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'OTHER',
          height: 175,
          weight: 70,
          targetWeight: 68,
          activityLevel: 'MODERATELY_ACTIVE',
          dietaryPreferences: JSON.stringify(['GLUTEN_FREE']),
          calorieTarget: 1800,
          proteinTarget: 120,
          carbTarget: 180,
          fatTarget: 60,
          fiberTarget: 25,
          privacySettings: JSON.stringify({ leaderboardVisible: true })
        }
      },
      leaderboard: {
        create: {
          totalPoints: 850,
          rank: 2
        }
      }
    }
  });

  // Create test user
  const testPasswordHash = await bcrypt.hash('test', 12);
  const testUser = await prisma.user.upsert({
    where: { username: 'test' },
    update: {},
    create: {
      username: 'test',
      email: 'test@example.com',
      passwordHash: testPasswordHash,
      role: 'USER',
      profile: {
        create: {
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: new Date('1985-05-15'),
          gender: 'MALE',
          height: 180,
          weight: 75,
          targetWeight: 72,
          activityLevel: 'VERY_ACTIVE',
          dietaryPreferences: JSON.stringify(['KETO']),
          calorieTarget: 2200,
          proteinTarget: 180,
          carbTarget: 50,
          fatTarget: 150,
          fiberTarget: 30,
          privacySettings: JSON.stringify({ leaderboardVisible: false })
        }
      },
      leaderboard: {
        create: {
          totalPoints: 650,
          rank: 3
        }
      }
    }
  });

  console.log(`Created users: ${adminUser.username}, ${demoUser.username}, ${testUser.username}`);
  return { adminUser, demoUser, testUser };
}

async function seedUserDetails() {
  console.log('Seeding user details...');
  
  const users = await prisma.user.findMany({
    include: { profile: true }
  });
  
  for (const user of users) {
    await prisma.userDetails.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        height: user.profile?.height || 170,
        weight: user.profile?.weight || 70,
        targetWeight: user.profile?.targetWeight || 68,
        bodyFatPercentage: 15,
        muscleMass: 55,
        bmi: 24.2,
        bloodType: 'O+',
        allergies: JSON.stringify(['Peanuts', 'Shellfish']),
        medications: JSON.stringify(['Vitamin D', 'Omega-3']),
        medicalConditions: JSON.stringify(['Asthma']),
        disabilities: JSON.stringify(['Mild knee injury']),
        exerciseLimitations: JSON.stringify(['Avoid high impact on knees']),
        mobilityIssues: JSON.stringify(['Slight stiffness in morning']),
        injuryHistory: JSON.stringify(['ACL reconstruction 2018']),
        activityLevel: 'MODERATELY_ACTIVE',
        sleepQuality: 'GOOD',
        stressLevel: 'MODERATE',
        smokingStatus: 'NEVER',
        alcoholConsumption: 'LIGHT',
        fitnessGoals: JSON.stringify(['Build muscle', 'Improve endurance']),
        dietaryGoals: JSON.stringify(['Increase protein', 'Reduce processed foods']),
        weightGoals: JSON.stringify(['Maintain current weight', 'Build muscle'])
      }
    });
  }
  
  console.log('User details seeded successfully');
}

async function seedSystemMessages() {
  console.log('Seeding system messages...');
  
  const systemMessages = [
    {
      key: 'welcome',
      title: 'Welcome Message',
      content: 'Welcome to your AI Health Companion! I\'m here to help you achieve your health and fitness goals. I can assist with meal planning, exercise recommendations, tracking your progress, and answering health-related questions. How can I help you today?',
      category: 'GENERAL',
      isActive: true
    },
    {
      key: 'meal_planning',
      title: 'Meal Planning Assistant',
      content: 'I can help you create personalized meal plans based on your dietary preferences, allergies, and health goals. I\'ll consider your calorie needs, macronutrient targets, and food preferences to suggest balanced, nutritious meals.',
      category: 'MEAL_PLANNING',
      isActive: true
    },
    {
      key: 'exercise_guidance',
      title: 'Exercise Guidance',
      content: 'I can provide exercise recommendations tailored to your fitness level, goals, and any physical limitations. I\'ll help you create workout plans, suggest modifications for injuries, and track your progress.',
      category: 'EXERCISE',
      isActive: true
    },
    {
      key: 'health_tracking',
      title: 'Health Tracking',
      content: 'I can help you track various health metrics including weight, body measurements, biomarkers, and progress toward your goals. I\'ll provide insights and recommendations based on your data.',
      category: 'TRACKING',
      isActive: true
    },
    {
      key: 'nutrition_advice',
      title: 'Nutrition Advice',
      content: 'I can provide evidence-based nutrition advice, help you understand food labels, suggest healthy alternatives, and answer questions about vitamins, minerals, and dietary supplements.',
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
  
  console.log('System messages seeded successfully');
}

async function seedLLMProviders() {
  console.log('Seeding LLM providers...');
  
  const providers = [
    {
      name: 'OpenAI',
      type: 'OPENAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      isActive: true,
      priority: 1,
      models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo']
    },
    {
      name: 'Anthropic',
      type: 'ANTHROPIC',
      baseUrl: 'https://api.anthropic.com',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      isActive: true,
      priority: 2,
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
    },
    {
      name: 'Ollama Local',
      type: 'OLLAMA',
      baseUrl: 'http://localhost:11434',
      apiKey: '',
      isActive: false,
      priority: 3,
      models: ['llama2', 'mistral', 'codellama']
    }
  ];

  for (const provider of providers) {
    await prisma.setting.upsert({
      where: { key: `llm_provider_${provider.name.toLowerCase()}` },
      update: {
        value: JSON.stringify(provider)
      },
      create: {
        key: `llm_provider_${provider.name.toLowerCase()}`,
        value: JSON.stringify(provider),
        description: `LLM Provider configuration for ${provider.name}`
      }
    });
  }
  
  console.log('LLM providers seeded successfully');
}

async function seedLLMSettings() {
  console.log('Seeding LLM settings...');
  
  const settings = [
    {
      key: 'default_llm_provider',
      value: 'OpenAI',
      description: 'Default LLM provider to use'
    },
    {
      key: 'default_model',
      value: 'gpt-4',
      description: 'Default model to use for LLM requests'
    },
    {
      key: 'max_tokens',
      value: '2000',
      description: 'Maximum tokens for LLM responses'
    },
    {
      key: 'temperature',
      value: '0.7',
      description: 'Temperature setting for LLM responses'
    },
    {
      key: 'enable_router',
      value: 'true',
      description: 'Enable LLM router for automatic provider selection'
    }
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    });
  }
  
  console.log('LLM settings seeded successfully');
}

async function seedSampleData() {
  console.log('Seeding sample meals and activities...');
  
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Create sample meals
    const sampleMeals = [
      {
        name: 'Breakfast - Oatmeal with Berries',
        mealType: 'BREAKFAST',
        ingredients: JSON.stringify([
          { name: 'Oats', quantity: 1, unit: 'cup' },
          { name: 'Blueberries', quantity: 0.5, unit: 'cup' },
          { name: 'Almond Milk', quantity: 1, unit: 'cup' },
          { name: 'Honey', quantity: 1, unit: 'tbsp' }
        ]),
        nutritionInfo: JSON.stringify({
          calories: 320,
          protein: 12,
          carbs: 58,
          fat: 8,
          fiber: 8
        }),
        notes: 'Healthy breakfast with antioxidants',
        loggedAt: new Date()
      },
      {
        name: 'Lunch - Grilled Chicken Salad',
        mealType: 'LUNCH',
        ingredients: JSON.stringify([
          { name: 'Chicken Breast', quantity: 150, unit: 'g' },
          { name: 'Mixed Greens', quantity: 2, unit: 'cups' },
          { name: 'Cherry Tomatoes', quantity: 0.5, unit: 'cup' },
          { name: 'Olive Oil', quantity: 1, unit: 'tbsp' }
        ]),
        nutritionInfo: JSON.stringify({
          calories: 280,
          protein: 35,
          carbs: 8,
          fat: 12,
          fiber: 4
        }),
        notes: 'High protein lunch',
        loggedAt: new Date()
      }
    ];

    for (const meal of sampleMeals) {
      await prisma.meal.create({
        data: {
          userId: user.id,
          ...meal
        }
      });
    }

    // Create sample activities
    const sampleActivities = [
      {
        name: 'Morning Walk',
        type: 'CARDIO',
        duration: 30,
        calories: 150,
        intensity: 'LIGHT',
        notes: 'Brisk walk around the neighborhood',
        loggedAt: new Date()
      },
      {
        name: 'Weight Training',
        type: 'STRENGTH',
        duration: 45,
        calories: 200,
        intensity: 'MODERATE',
        notes: 'Upper body workout',
        loggedAt: new Date()
      }
    ];

    for (const activity of sampleActivities) {
      await prisma.activity.create({
        data: {
          userId: user.id,
          ...activity
        }
      });
    }

    // Create sample biomarkers
    const sampleBiomarkers = [
      {
        type: 'WEIGHT',
        value: 70,
        unit: 'kg',
        notes: 'Morning weight',
        loggedAt: new Date()
      },
      {
        type: 'BLOOD_PRESSURE',
        value: 120,
        unit: 'mmHg',
        notes: 'Systolic pressure',
        loggedAt: new Date()
      }
    ];

    for (const biomarker of sampleBiomarkers) {
      await prisma.biomarker.create({
        data: {
          userId: user.id,
          ...biomarker
        }
      });
    }

    // Create sample goals
    const sampleGoals = [
      {
        title: 'Lose 5kg',
        description: 'Gradual weight loss goal',
        type: 'WEIGHT_LOSS',
        targetValue: 65,
        currentValue: 70,
        unit: 'kg',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        status: 'ACTIVE'
      },
      {
        title: 'Run 5K',
        description: 'Complete a 5K run',
        type: 'FITNESS',
        targetValue: 5,
        currentValue: 0,
        unit: 'km',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        status: 'ACTIVE'
      }
    ];

    for (const goal of sampleGoals) {
      await prisma.goal.create({
        data: {
          userId: user.id,
          ...goal
        }
      });
    }
  }
  
  console.log('Sample data seeded successfully');
}

async function seedIngredientMappings() {
  console.log('🌱 Seeding ingredient mappings...');
  
  const ingredientMappings = [
    // Salt and variants
    { keyword: 'salt', ingredientName: 'salt, table, iodized' },
    { keyword: 'Salt', ingredientName: 'salt, table, iodized' },
    { keyword: 'SALT', ingredientName: 'salt, table, iodized' },
    { keyword: 'table salt', ingredientName: 'salt, table, iodized' },
    { keyword: 'sea salt', ingredientName: 'salt, table, iodized' },
    { keyword: 'kosher salt', ingredientName: 'salt, table, iodized' },
    
    // Pepper and variants
    { keyword: 'pepper', ingredientName: 'spices, pepper, black' },
    { keyword: 'Pepper', ingredientName: 'spices, pepper, black' },
    { keyword: 'PEPPER', ingredientName: 'spices, pepper, black' },
    { keyword: 'black pepper', ingredientName: 'spices, pepper, black' },
    { keyword: 'Black Pepper', ingredientName: 'spices, pepper, black' },
    { keyword: 'BLACK PEPPER', ingredientName: 'spices, pepper, black' },
    { keyword: 'ground black pepper', ingredientName: 'spices, pepper, black' },
    { keyword: 'fresh ground black pepper', ingredientName: 'spices, pepper, black' },
    
    // Salt and Pepper combinations
    { keyword: 'salt and pepper', ingredientName: 'salt, table, iodized' },
    { keyword: 'Salt and Pepper', ingredientName: 'salt, table, iodized' },
    { keyword: 'SALT AND PEPPER', ingredientName: 'salt, table, iodized' },
    
    // Wine variants
    { keyword: 'red wine', ingredientName: 'alcoholic beverage, wine, table, red' },
    { keyword: 'Red Wine', ingredientName: 'alcoholic beverage, wine, table, red' },
    { keyword: 'RED WINE', ingredientName: 'alcoholic beverage, wine, table, red' },
    { keyword: 'wine', ingredientName: 'alcoholic beverage, wine, table, red' },
    { keyword: 'Wine', ingredientName: 'alcoholic beverage, wine, table, red' },
    { keyword: 'WINE', ingredientName: 'alcoholic beverage, wine, table, red' },
    
    // Pork variants
    { keyword: 'pork chops', ingredientName: 'pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, raw' },
    { keyword: 'Pork Chops', ingredientName: 'pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, raw' },
    { keyword: 'PORK CHOPS', ingredientName: 'pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, raw' },
    
    // Herbs and spices
    { keyword: 'thyme', ingredientName: 'spices, thyme, dried' },
    { keyword: 'Thyme', ingredientName: 'spices, thyme, dried' },
    { keyword: 'THYME', ingredientName: 'spices, thyme, dried' },
    { keyword: 'fresh thyme', ingredientName: 'spices, thyme, dried' },
    { keyword: 'rosemary', ingredientName: 'spices, rosemary, dried' },
    { keyword: 'Rosemary', ingredientName: 'spices, rosemary, dried' },
    { keyword: 'ROSEMARY', ingredientName: 'spices, rosemary, dried' },
    { keyword: 'fresh rosemary', ingredientName: 'spices, rosemary, dried' },
    
    // Citrus
    { keyword: 'lemon', ingredientName: 'lemon juice, raw' },
    { keyword: 'Lemon', ingredientName: 'lemon juice, raw' },
    { keyword: 'LEMON', ingredientName: 'lemon juice, raw' },
    
    // Ginger
    { keyword: 'ginger paste', ingredientName: 'ginger root, raw' },
    { keyword: 'ginger', ingredientName: 'ginger root, raw' },
    { keyword: 'fresh ginger', ingredientName: 'ginger root, raw' },
    
    // Beef variants
    { keyword: 'beef strips', ingredientName: 'beef, loin, top loin steak, boneless, lip off, separable lean only, trimmed to 0" fat, select, raw' },
    { keyword: 'beef strip', ingredientName: 'beef, loin, top loin steak, boneless, lip off, separable lean only, trimmed to 0" fat, select, raw' },
    { keyword: 'beef', ingredientName: 'beef, ground, 80% lean meat / 20% fat, raw' },
    { keyword: 'beef striploin', ingredientName: 'beef, loin, top loin steak, boneless, lip off, separable lean only, trimmed to 0" fat, select, raw' },
    { keyword: 'strip steak', ingredientName: 'beef, grass-fed, strip steaks, lean only, raw' },
    { keyword: 'steak', ingredientName: 'beef, grass-fed, strip steaks, lean only, raw' },
    { keyword: 'ground beef', ingredientName: 'beef, ground, 80% lean meat / 20% fat, raw' },
    
    // Noodles and pasta
    { keyword: 'egg noodles', ingredientName: 'noodles, egg, cooked, enriched, with added salt' },
    { keyword: 'noodles', ingredientName: 'noodles, egg, cooked, enriched, with added salt' },
    
    // Cheese variants
    { keyword: 'parmesan cheese', ingredientName: 'cheese, parmesan, grated' },
    { keyword: 'parmesan', ingredientName: 'cheese, parmesan, grated' },
    { keyword: 'cheddar cheese', ingredientName: 'cheese, cheddar' },
    { keyword: 'Cheddar Cheese', ingredientName: 'cheese, cheddar' },
    { keyword: 'cheddar', ingredientName: 'cheese, cheddar' },
    { keyword: 'cheese', ingredientName: 'cheese, cheddar' },
    { keyword: 'cream cheese', ingredientName: 'cheese, cream' },
    
    // Cream variants
    { keyword: 'heavy cream', ingredientName: 'cream, fluid, heavy whipping' },
    { keyword: 'whipping cream', ingredientName: 'cream, fluid, heavy whipping' },
    { keyword: 'whipped cream', ingredientName: 'cream, whipped, cream topping, pressurized' },
    { keyword: 'sour cream', ingredientName: 'cream, sour, cultured' },
    
    // Vegetables
    { keyword: 'zucchini', ingredientName: 'squash, summer, green, zucchini, includes skin, raw' },
    { keyword: 'onions', ingredientName: 'onions, red, raw' },
    { keyword: 'Onions', ingredientName: 'onions, red, raw' },
    { keyword: 'onion', ingredientName: 'onions, red, raw' },
    { keyword: 'spinach', ingredientName: 'spinach, baby' },
    { keyword: 'Spinach', ingredientName: 'spinach, baby' },
    { keyword: 'mushrooms', ingredientName: 'mushrooms, white, raw' },
    { keyword: 'button mushrooms', ingredientName: 'mushrooms, white button' },
    { keyword: 'mushroom', ingredientName: 'mushrooms, white, raw' },
    { keyword: 'bell peppers', ingredientName: 'peppers, sweet, green, raw' },
    { keyword: 'Bell Peppers', ingredientName: 'peppers, sweet, green, raw' },
    { keyword: 'bell pepper', ingredientName: 'peppers, sweet, green, raw' },
    { keyword: 'broccoli', ingredientName: 'broccoli, raw' },
    { keyword: 'tomato', ingredientName: 'tomatoes, red, ripe, raw, year round average' },
    { keyword: 'tomatoes', ingredientName: 'tomatoes, red, ripe, raw, year round average' },
    
    // Dairy and fats
    { keyword: 'butter', ingredientName: 'butter, salted' },
    { keyword: 'unsalted butter', ingredientName: 'butter, stick, unsalted' },
    { keyword: 'unsalted butter, melted', ingredientName: 'butter, stick, unsalted' },
    
    // Fish
    { keyword: 'salmon', ingredientName: 'fish, salmon, pink, raw' },
    { keyword: 'salmon fillets', ingredientName: 'fish, salmon, raw' },
    
    // Grains
    { keyword: 'quinoa', ingredientName: 'quinoa, cooked' },
    
    // Herbs and spices
    { keyword: 'dill', ingredientName: 'spices, dill weed, dried' },
    
    // Meat
    { keyword: 'bacon', ingredientName: 'pork, bacon, rendered fat, cooked' },
    
    // Bread variants
    { keyword: 'whole wheat bread', ingredientName: 'bread, whole-wheat, commercially prepared' },
    { keyword: 'bread', ingredientName: 'bread, whole-wheat, commercially prepared' },
    { keyword: 'white bread', ingredientName: 'bread, white, commercially prepared' },
    { keyword: 'sourdough bread', ingredientName: 'bread, white, commercially prepared' },
    
    // Potatoes
    { keyword: 'mashed potatoes', ingredientName: 'potatoes, mashed, home-prepared, whole milk and butter added' },
    
    // Beverages
    { keyword: 'almond milk', ingredientName: 'beverages, almond milk, unsweetened, shelf stable' },
    
    // Sweeteners
    { keyword: 'granulated sugar', ingredientName: 'sugars, granulated' },
    { keyword: 'sugar', ingredientName: 'sugars, granulated' },
    { keyword: 'brown sugar', ingredientName: 'sugars, brown' },
    { keyword: 'light brown sugar', ingredientName: 'sugars, brown' },
    { keyword: 'dark brown sugar', ingredientName: 'sugars, brown' },
    { keyword: 'maple syrup', ingredientName: 'syrups, maple' },
    
    // Eggs
    { keyword: 'large eggs', ingredientName: 'eggs, grade a, large, egg white' },
    { keyword: 'eggs', ingredientName: 'eggs, grade a, large, egg white' },
    
    // Dairy
    { keyword: 'buttermilk', ingredientName: 'buttermilk, low fat' },
    { keyword: 'greek yogurt', ingredientName: 'yogurt, greek, plain, nonfat' },
    
    // Nuts
    { keyword: 'pecans', ingredientName: 'nuts, pecans, halves, raw' },
    
    // Extracts and flavorings
    { keyword: 'pure vanilla extract', ingredientName: 'vanilla extract' },
    { keyword: 'vanilla extract', ingredientName: 'vanilla extract' },
    
    // Chocolate
    { keyword: 'cocoa powder', ingredientName: 'cocoa, dry powder, unsweetened' },
    { keyword: 'unsweetened cocoa powder', ingredientName: 'cocoa, dry powder, unsweetened' },
    
    // Ice cream
    { keyword: 'vanilla ice cream', ingredientName: 'ice creams, vanilla' },
    { keyword: 'ice cream', ingredientName: 'ice creams, vanilla' },
    
    // Tortillas
    { keyword: 'whole wheat tortillas', ingredientName: 'tortillas, ready-to-bake or -fry, corn, without added salt' },
    
    // Sauces
    { keyword: 'salsa', ingredientName: 'sauce, salsa, ready-to-serve' },
    
    // Flour
    { keyword: 'flour', ingredientName: 'flour, wheat, all-purpose, enriched, bleached' },
    { keyword: 'all-purpose flour', ingredientName: 'flour, wheat, all-purpose, enriched, bleached' },
    
    // Chicken
    { keyword: 'boneless chicken breast', ingredientName: 'chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, braised' },
    { keyword: 'chicken breast', ingredientName: 'chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, braised' },
    
    // Seasonings
    { keyword: 'fajita seasoning', ingredientName: 'spices, poultry seasoning' },
    
    // Oils and fats
    { keyword: 'olive oil', ingredientName: 'olive oil' },
    { keyword: 'tahini', ingredientName: 'tahini' },
    
    // Garlic
    { keyword: 'garlic', ingredientName: 'garlic, raw' },
    { keyword: 'lemon juice', ingredientName: 'lemon juice, 100%, ns as to form' },
  ];

  let createdCount = 0;
  let skippedCount = 0;
  
  for (const mapping of ingredientMappings) {
    try {
      // Find the ingredient by name
      const ingredient = await prisma.ingredient.findFirst({
        where: { name: mapping.ingredientName, isActive: true }
      });
      
      if (!ingredient) {
        console.log(`⚠️  Ingredient not found: ${mapping.ingredientName}`);
        skippedCount++;
        continue;
      }
      
      // Check if mapping already exists
      const existingMapping = await prisma.ingredientMapping.findUnique({
        where: { keyword: mapping.keyword }
      });
      
      if (existingMapping) {
        console.log(`⏭️  Mapping already exists: ${mapping.keyword} → ${mapping.ingredientName}`);
        skippedCount++;
        continue;
      }
      
      // Create the mapping
      await prisma.ingredientMapping.create({
        data: {
          keyword: mapping.keyword,
          ingredientId: ingredient.id
        }
      });
      
      console.log(`✅ Created mapping: ${mapping.keyword} → ${mapping.ingredientName}`);
      createdCount++;
      
    } catch (error) {
      console.error(`❌ Error creating mapping for ${mapping.keyword}:`, error);
      skippedCount++;
    }
  }
  
  console.log(`🌱 Ingredient mappings seeding complete!`);
  console.log(`✅ Created: ${createdCount} mappings`);
  console.log(`⏭️  Skipped: ${skippedCount} mappings`);
}

async function main() {
  console.log('🚀 Starting comprehensive database seeding...');

  try {
    // Seed users first
    await seedUsers();
    
    // Seed user details
    await seedUserDetails();
    
    // Seed system messages
    await seedSystemMessages();
    
    // Seed LLM providers and settings
    await seedLLMProviders();
    await seedLLMSettings();
    
    // Seed sample data
    await seedSampleData();

    // Seed ingredient mappings
    await seedIngredientMappings();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin/demo');
    console.log('   Demo: demo/demo');
    console.log('   Test: test/test');
    console.log('\n🚀 You can now start the application and test all features!');
    console.log('\n💡 Note: Run "node scripts/seed-ingredients-simple.js" for basic ingredients');
    console.log('💡 Note: Run "node scripts/seed-all.js" for full ingredients and exercises');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 