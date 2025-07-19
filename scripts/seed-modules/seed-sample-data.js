const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSampleData() {
  console.log('📊 Seeding sample meals and activities...');
  
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
  
  console.log('✅ Sample data seeded successfully');
}

async function main() {
  try {
    await seedSampleData();
    console.log('🎉 Sample data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during sample data seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedSampleData }; 