const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedBasicIngredients() {
  console.log('Seeding basic ingredients...');
  
  // Clear existing ingredients first
  await prisma.ingredient.deleteMany({});
  
  const basicIngredients = [
    // Proteins
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
      category: 'Protein',
      aisle: 'Meat & Poultry',
      isActive: true
    },
    {
      name: 'Salmon',
      description: 'Atlantic salmon, farmed',
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
      category: 'Protein',
      aisle: 'Seafood',
      isActive: true
    },
    {
      name: 'Eggs',
      description: 'Large whole eggs',
      servingSize: '100g',
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      fiber: 0,
      sugar: 1.1,
      sodium: 124,
      cholesterol: 373,
      saturatedFat: 3.3,
      monounsaturatedFat: 4.4,
      polyunsaturatedFat: 1.4,
      transFat: 0,
      netCarbs: 1.1,
      category: 'Protein',
      aisle: 'Dairy & Eggs',
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
      polyunsaturatedFat: 0,
      transFat: 0,
      netCarbs: 3.6,
      category: 'Dairy',
      aisle: 'Dairy & Eggs',
      isActive: true
    },
    
    // Grains
    {
      name: 'Oats',
      description: 'Rolled oats, dry',
      servingSize: '100g',
      calories: 389,
      protein: 17,
      carbs: 66,
      fat: 7,
      fiber: 10,
      sugar: 1,
      sodium: 2,
      cholesterol: 0,
      saturatedFat: 1.2,
      monounsaturatedFat: 2.2,
      polyunsaturatedFat: 2.5,
      transFat: 0,
      netCarbs: 56,
      category: 'Grains',
      aisle: 'Pantry',
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
      name: 'Quinoa',
      description: 'Cooked quinoa',
      servingSize: '100g',
      calories: 120,
      protein: 4.4,
      carbs: 22,
      fat: 1.9,
      fiber: 2.8,
      sugar: 0.9,
      sodium: 7,
      cholesterol: 0,
      saturatedFat: 0.2,
      monounsaturatedFat: 0.5,
      polyunsaturatedFat: 1.1,
      transFat: 0,
      netCarbs: 19.2,
      category: 'Grains',
      aisle: 'Pantry',
      isActive: true
    },
    
    // Vegetables
    {
      name: 'Broccoli',
      description: 'Raw broccoli',
      servingSize: '100g',
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      fiber: 2.6,
      sugar: 1.5,
      sodium: 33,
      cholesterol: 0,
      saturatedFat: 0,
      monounsaturatedFat: 0,
      polyunsaturatedFat: 0.2,
      transFat: 0,
      netCarbs: 4.4,
      category: 'Vegetables',
      aisle: 'Produce',
      isActive: true
    },
    {
      name: 'Spinach',
      description: 'Raw spinach',
      servingSize: '100g',
      calories: 23,
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4,
      fiber: 2.2,
      sugar: 0.4,
      sodium: 79,
      cholesterol: 0,
      saturatedFat: 0.1,
      monounsaturatedFat: 0,
      polyunsaturatedFat: 0.2,
      transFat: 0,
      netCarbs: 1.4,
      category: 'Vegetables',
      aisle: 'Produce',
      isActive: true
    },
    {
      name: 'Sweet Potato',
      description: 'Baked sweet potato',
      servingSize: '100g',
      calories: 86,
      protein: 1.6,
      carbs: 20,
      fat: 0.1,
      fiber: 3,
      sugar: 4.2,
      sodium: 55,
      cholesterol: 0,
      saturatedFat: 0,
      monounsaturatedFat: 0,
      polyunsaturatedFat: 0,
      transFat: 0,
      netCarbs: 17,
      category: 'Vegetables',
      aisle: 'Produce',
      isActive: true
    },
    
    // Fruits
    {
      name: 'Banana',
      description: 'Raw banana',
      servingSize: '100g',
      calories: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      fiber: 2.6,
      sugar: 12,
      sodium: 1,
      cholesterol: 0,
      saturatedFat: 0.1,
      monounsaturatedFat: 0,
      polyunsaturatedFat: 0.1,
      transFat: 0,
      netCarbs: 20.4,
      category: 'Fruits',
      aisle: 'Produce',
      isActive: true
    },
    {
      name: 'Blueberries',
      description: 'Raw blueberries',
      servingSize: '100g',
      calories: 57,
      protein: 0.7,
      carbs: 14,
      fat: 0.3,
      fiber: 2.4,
      sugar: 10,
      sodium: 1,
      cholesterol: 0,
      saturatedFat: 0,
      monounsaturatedFat: 0,
      polyunsaturatedFat: 0.2,
      transFat: 0,
      netCarbs: 11.6,
      category: 'Fruits',
      aisle: 'Produce',
      isActive: true
    },
    {
      name: 'Apple',
      description: 'Raw apple with skin',
      servingSize: '100g',
      calories: 52,
      protein: 0.3,
      carbs: 14,
      fat: 0.2,
      fiber: 2.4,
      sugar: 10,
      sodium: 1,
      cholesterol: 0,
      saturatedFat: 0,
      monounsaturatedFat: 0,
      polyunsaturatedFat: 0.1,
      transFat: 0,
      netCarbs: 11.6,
      category: 'Fruits',
      aisle: 'Produce',
      isActive: true
    },
    
    // Nuts & Seeds
    {
      name: 'Almonds',
      description: 'Raw almonds',
      servingSize: '100g',
      calories: 579,
      protein: 21,
      carbs: 22,
      fat: 50,
      fiber: 12,
      sugar: 4.8,
      sodium: 1,
      cholesterol: 0,
      saturatedFat: 3.7,
      monounsaturatedFat: 31,
      polyunsaturatedFat: 12,
      transFat: 0,
      netCarbs: 10,
      category: 'Nuts & Seeds',
      aisle: 'Pantry',
      isActive: true
    },
    {
      name: 'Chia Seeds',
      description: 'Raw chia seeds',
      servingSize: '100g',
      calories: 486,
      protein: 17,
      carbs: 42,
      fat: 31,
      fiber: 34,
      sugar: 0,
      sodium: 16,
      cholesterol: 0,
      saturatedFat: 3.3,
      monounsaturatedFat: 2.3,
      polyunsaturatedFat: 24,
      transFat: 0,
      netCarbs: 8,
      category: 'Nuts & Seeds',
      aisle: 'Pantry',
      isActive: true
    },
    
    // Oils & Fats
    {
      name: 'Olive Oil',
      description: 'Extra virgin olive oil',
      servingSize: '100g',
      calories: 884,
      protein: 0,
      carbs: 0,
      fat: 100,
      fiber: 0,
      sugar: 0,
      sodium: 2,
      cholesterol: 0,
      saturatedFat: 14,
      monounsaturatedFat: 73,
      polyunsaturatedFat: 11,
      transFat: 0,
      netCarbs: 0,
      category: 'Oils & Fats',
      aisle: 'Pantry',
      isActive: true
    },
    {
      name: 'Coconut Oil',
      description: 'Virgin coconut oil',
      servingSize: '100g',
      calories: 862,
      protein: 0,
      carbs: 0,
      fat: 100,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
      saturatedFat: 87,
      monounsaturatedFat: 6,
      polyunsaturatedFat: 2,
      transFat: 0,
      netCarbs: 0,
      category: 'Oils & Fats',
      aisle: 'Pantry',
      isActive: true
    },
    
    // Dairy
    {
      name: 'Milk',
      description: 'Whole milk',
      servingSize: '100g',
      calories: 61,
      protein: 3.2,
      carbs: 4.8,
      fat: 3.3,
      fiber: 0,
      sugar: 4.8,
      sodium: 43,
      cholesterol: 10,
      saturatedFat: 1.9,
      monounsaturatedFat: 0.8,
      polyunsaturatedFat: 0.2,
      transFat: 0,
      netCarbs: 4.8,
      category: 'Dairy',
      aisle: 'Dairy & Eggs',
      isActive: true
    },
    {
      name: 'Cheese',
      description: 'Cheddar cheese',
      servingSize: '100g',
      calories: 403,
      protein: 25,
      carbs: 1.3,
      fat: 33,
      fiber: 0,
      sugar: 0.5,
      sodium: 621,
      cholesterol: 105,
      saturatedFat: 21,
      monounsaturatedFat: 9,
      polyunsaturatedFat: 1.4,
      transFat: 0,
      netCarbs: 1.3,
      category: 'Dairy',
      aisle: 'Dairy & Eggs',
      isActive: true
    }
  ];

  let processed = 0;
  let errors = 0;

  for (const ingredient of basicIngredients) {
    try {
      await prisma.ingredient.create({
        data: ingredient
      });
      processed++;
    } catch (error) {
      console.error(`Error creating ingredient ${ingredient.name}:`, error.message);
      errors++;
    }
  }

  console.log(`Basic ingredients seeding complete!`);
  console.log(`- Processed: ${processed} ingredients`);
  console.log(`- Errors: ${errors} ingredients`);
  
  const totalCount = await prisma.ingredient.count();
  console.log(`- Total ingredients in database: ${totalCount}`);
}

async function main() {
  console.log('🌱 Starting basic ingredients seeding...');

  try {
    await seedBasicIngredients();
    console.log('\n✅ Basic ingredients seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 