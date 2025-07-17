import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create demo users
  const adminPassword = await bcrypt.hash('demo', 12);
  const userPassword = await bcrypt.hash('demo', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@healthcompanion.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          activityLevel: 'MODERATELY_ACTIVE',
          calorieTarget: 2000,
          proteinTarget: 150,
          carbTarget: 200,
          fatTarget: 65,
          fiberTarget: 25,
          dietaryPreferences: ['none'],
          privacySettings: { leaderboardVisible: true }
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

  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      email: 'user@healthcompanion.com',
      passwordHash: userPassword,
      role: 'USER',
      profile: {
        create: {
          firstName: 'Demo',
          lastName: 'User',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'OTHER',
          height: 170,
          weight: 70,
          targetWeight: 65,
          activityLevel: 'LIGHTLY_ACTIVE',
          calorieTarget: 1800,
          proteinTarget: 120,
          carbTarget: 180,
          fatTarget: 60,
          fiberTarget: 25,
          dietaryPreferences: ['vegetarian'],
          privacySettings: { leaderboardVisible: true }
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

  // Create ingredient taxonomy
  const ingredients = [
    // Produce
    { name: 'Apple', aisle: 'Produce', category: 'Fruits' },
    { name: 'Banana', aisle: 'Produce', category: 'Fruits' },
    { name: 'Spinach', aisle: 'Produce', category: 'Leafy Greens' },
    { name: 'Broccoli', aisle: 'Produce', category: 'Vegetables' },
    { name: 'Carrot', aisle: 'Produce', category: 'Vegetables' },
    { name: 'Tomato', aisle: 'Produce', category: 'Vegetables' },
    { name: 'Onion', aisle: 'Produce', category: 'Vegetables' },
    { name: 'Garlic', aisle: 'Produce', category: 'Vegetables' },
    { name: 'Avocado', aisle: 'Produce', category: 'Fruits' },
    { name: 'Sweet Potato', aisle: 'Produce', category: 'Vegetables' },
    
    // Meat & Seafood
    { name: 'Chicken Breast', aisle: 'Meat & Seafood', category: 'Poultry' },
    { name: 'Salmon', aisle: 'Meat & Seafood', category: 'Fish' },
    { name: 'Ground Beef', aisle: 'Meat & Seafood', category: 'Beef' },
    { name: 'Turkey', aisle: 'Meat & Seafood', category: 'Poultry' },
    { name: 'Tuna', aisle: 'Meat & Seafood', category: 'Fish' },
    { name: 'Shrimp', aisle: 'Meat & Seafood', category: 'Seafood' },
    { name: 'Pork Chop', aisle: 'Meat & Seafood', category: 'Pork' },
    { name: 'Lamb', aisle: 'Meat & Seafood', category: 'Lamb' },
    
    // Dairy & Eggs
    { name: 'Eggs', aisle: 'Dairy & Eggs', category: 'Eggs' },
    { name: 'Milk', aisle: 'Dairy & Eggs', category: 'Milk' },
    { name: 'Greek Yogurt', aisle: 'Dairy & Eggs', category: 'Yogurt' },
    { name: 'Cheese', aisle: 'Dairy & Eggs', category: 'Cheese' },
    { name: 'Butter', aisle: 'Dairy & Eggs', category: 'Dairy' },
    { name: 'Cream', aisle: 'Dairy & Eggs', category: 'Dairy' },
    { name: 'Cottage Cheese', aisle: 'Dairy & Eggs', category: 'Cheese' },
    
    // Pantry
    { name: 'Rice', aisle: 'Pantry', category: 'Grains' },
    { name: 'Quinoa', aisle: 'Pantry', category: 'Grains' },
    { name: 'Oats', aisle: 'Pantry', category: 'Grains' },
    { name: 'Pasta', aisle: 'Pantry', category: 'Grains' },
    { name: 'Black Beans', aisle: 'Pantry', category: 'Legumes' },
    { name: 'Chickpeas', aisle: 'Pantry', category: 'Legumes' },
    { name: 'Lentils', aisle: 'Pantry', category: 'Legumes' },
    { name: 'Almonds', aisle: 'Pantry', category: 'Nuts' },
    { name: 'Walnuts', aisle: 'Pantry', category: 'Nuts' },
    { name: 'Peanut Butter', aisle: 'Pantry', category: 'Nuts' },
    { name: 'Olive Oil', aisle: 'Pantry', category: 'Oils' },
    { name: 'Coconut Oil', aisle: 'Pantry', category: 'Oils' },
    
    // Spices & Condiments
    { name: 'Salt', aisle: 'Spices & Condiments', category: 'Spices' },
    { name: 'Black Pepper', aisle: 'Spices & Condiments', category: 'Spices' },
    { name: 'Cumin', aisle: 'Spices & Condiments', category: 'Spices' },
    { name: 'Paprika', aisle: 'Spices & Condiments', category: 'Spices' },
    { name: 'Oregano', aisle: 'Spices & Condiments', category: 'Spices' },
    { name: 'Basil', aisle: 'Spices & Condiments', category: 'Herbs' },
    { name: 'Soy Sauce', aisle: 'Spices & Condiments', category: 'Condiments' },
    { name: 'Hot Sauce', aisle: 'Spices & Condiments', category: 'Condiments' },
    { name: 'Mustard', aisle: 'Spices & Condiments', category: 'Condiments' },
    { name: 'Ketchup', aisle: 'Spices & Condiments', category: 'Condiments' },
    
    // Frozen
    { name: 'Frozen Peas', aisle: 'Frozen', category: 'Vegetables' },
    { name: 'Frozen Corn', aisle: 'Frozen', category: 'Vegetables' },
    { name: 'Frozen Berries', aisle: 'Frozen', category: 'Fruits' },
    { name: 'Frozen Spinach', aisle: 'Frozen', category: 'Vegetables' },
    { name: 'Ice Cream', aisle: 'Frozen', category: 'Desserts' },
    { name: 'Frozen Pizza', aisle: 'Frozen', category: 'Meals' },
    
    // Snacks
    { name: 'Popcorn', aisle: 'Snacks', category: 'Snacks' },
    { name: 'Chips', aisle: 'Snacks', category: 'Snacks' },
    { name: 'Crackers', aisle: 'Snacks', category: 'Snacks' },
    { name: 'Granola Bars', aisle: 'Snacks', category: 'Snacks' },
    { name: 'Dark Chocolate', aisle: 'Snacks', category: 'Snacks' },
    { name: 'Trail Mix', aisle: 'Snacks', category: 'Snacks' }
  ];

  for (const ingredient of ingredients) {
    await prisma.ingredientTaxonomy.upsert({
      where: { name: ingredient.name },
      update: {},
      create: ingredient
    });
  }

  // Create sample meals for demo user
  const sampleMeals = [
    {
      name: 'Grilled Chicken Salad',
      mealType: 'LUNCH',
      ingredients: [
        { name: 'Chicken Breast', quantity: 150, unit: 'g' },
        { name: 'Spinach', quantity: 2, unit: 'cups' },
        { name: 'Tomato', quantity: 1, unit: 'medium' },
        { name: 'Avocado', quantity: 0.5, unit: 'medium' },
        { name: 'Olive Oil', quantity: 1, unit: 'tbsp' }
      ],
      nutritionInfo: {
        calories: 350,
        protein: 35,
        carbs: 15,
        fat: 20,
        fiber: 8
      }
    },
    {
      name: 'Oatmeal with Berries',
      mealType: 'BREAKFAST',
      ingredients: [
        { name: 'Oats', quantity: 0.5, unit: 'cup' },
        { name: 'Milk', quantity: 1, unit: 'cup' },
        { name: 'Frozen Berries', quantity: 0.5, unit: 'cup' },
        { name: 'Almonds', quantity: 2, unit: 'tbsp' }
      ],
      nutritionInfo: {
        calories: 280,
        protein: 12,
        carbs: 45,
        fat: 8,
        fiber: 6
      }
    }
  ];

  for (const meal of sampleMeals) {
    await prisma.meal.create({
      data: {
        userId: user.id,
        name: meal.name,
        mealType: meal.mealType,
        ingredients: meal.ingredients,
        nutritionInfo: meal.nutritionInfo,
        loggedAt: new Date()
      }
    });
  }

  // Create sample activities
  const sampleActivities = [
    {
      name: 'Morning Run',
      type: 'RUNNING',
      duration: 30,
      calories: 300,
      intensity: 'VIGOROUS'
    },
    {
      name: 'Yoga Session',
      type: 'YOGA',
      duration: 45,
      calories: 150,
      intensity: 'LIGHT'
    }
  ];

  for (const activity of sampleActivities) {
    await prisma.activity.create({
      data: {
        userId: user.id,
        name: activity.name,
        type: activity.type,
        duration: activity.duration,
        calories: activity.calories,
        intensity: activity.intensity,
        loggedAt: new Date()
      }
    });
  }

  // Create sample biomarkers
  const sampleBiomarkers = [
    {
      type: 'WEIGHT',
      value: 70,
      unit: 'kg'
    },
    {
      type: 'BLOOD_PRESSURE_SYSTOLIC',
      value: 120,
      unit: 'mmHg'
    },
    {
      type: 'BLOOD_PRESSURE_DIASTOLIC',
      value: 80,
      unit: 'mmHg'
    }
  ];

  for (const biomarker of sampleBiomarkers) {
    await prisma.biomarker.create({
      data: {
        userId: user.id,
        type: biomarker.type,
        value: biomarker.value,
        unit: biomarker.unit,
        loggedAt: new Date()
      }
    });
  }

  // Create sample goals
  const sampleGoals = [
    {
      title: 'Lose 5kg',
      description: 'Goal to reach target weight',
      type: 'WEIGHT_LOSS',
      targetValue: 65,
      currentValue: 70,
      unit: 'kg',
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    },
    {
      title: 'Run 5km',
      description: 'Complete a 5km run',
      type: 'ENDURANCE',
      targetValue: 5,
      currentValue: 3,
      unit: 'km',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  ];

  for (const goal of sampleGoals) {
    await prisma.goal.create({
      data: {
        userId: user.id,
        title: goal.title,
        description: goal.description,
        type: goal.type,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        unit: goal.unit,
        deadline: goal.deadline
      }
    });
  }

  // Create feature flags
  const featureFlags = [
    {
      key: 'leaderboard',
      name: 'Leaderboard',
      description: 'Enable gamification leaderboard',
      enabled: true,
      rolloutPercentage: 100
    },
    {
      key: 'grocery_list',
      name: 'Grocery List',
      description: 'Enable AI-generated grocery lists',
      enabled: true,
      rolloutPercentage: 100
    },
    {
      key: 'biomarker_logging',
      name: 'Biomarker Logging',
      description: 'Enable biomarker tracking with photos',
      enabled: true,
      rolloutPercentage: 100
    },
    {
      key: 'goal_certificates',
      name: 'Goal Certificates',
      description: 'Enable PDF certificates for completed goals',
      enabled: true,
      rolloutPercentage: 100
    }
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag
    });
  }

  // Create default settings
  const settings = [
    {
      key: 'llm_provider',
      value: 'ollama',
      description: 'Default LLM provider'
    },
    {
      key: 'max_retries',
      value: '3',
      description: 'Maximum retry attempts for failed operations'
    },
    {
      key: 'cache_ttl_hours',
      value: '6',
      description: 'Cache TTL in hours'
    }
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('👤 Demo accounts created:');
  console.log('   Admin: admin / demo');
  console.log('   User: user / demo');
  console.log('🏪 Ingredient taxonomy created with 50+ items');
  console.log('🍽 Sample meals, activities, and biomarkers added');
  console.log('🎯 Sample goals created');
  console.log('🚩 Feature flags configured');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 