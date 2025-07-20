const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Missing ingredients with researched nutrition facts (per 100g unless noted)
const missingIngredientsWithNutrition = [
  {
    name: 'avocado oil',
    description: 'Pure avocado oil, commonly used for cooking and dressings',
    servingSize: '100ml',
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    category: 'Oils and Fats',
    aisle: 'Oils'
  },
  {
    name: 'agave nectar',
    description: 'Natural sweetener derived from agave plant',
    servingSize: '100ml',
    calories: 310,
    protein: 0,
    carbs: 76,
    fat: 0,
    fiber: 0,
    sugar: 76,
    sodium: 0,
    category: 'Sweeteners',
    aisle: 'Baking'
  },
  {
    name: 'all-purpose flour',
    description: 'Standard wheat flour for general baking',
    servingSize: '100g',
    calories: 364,
    protein: 10,
    carbs: 76,
    fat: 1,
    fiber: 3,
    sugar: 0,
    sodium: 2,
    category: 'Grains and Flours',
    aisle: 'Baking'
  },
  {
    name: 'whole wheat flour',
    description: 'Whole grain wheat flour with higher fiber content',
    servingSize: '100g',
    calories: 340,
    protein: 13,
    carbs: 72,
    fat: 2,
    fiber: 10,
    sugar: 0,
    sodium: 2,
    category: 'Grains and Flours',
    aisle: 'Baking'
  },
  {
    name: 'bread flour',
    description: 'High-protein flour for bread making',
    servingSize: '100g',
    calories: 361,
    protein: 12,
    carbs: 72,
    fat: 1,
    fiber: 3,
    sugar: 0,
    sodium: 2,
    category: 'Grains and Flours',
    aisle: 'Baking'
  },
  {
    name: 'cake flour',
    description: 'Low-protein flour for cakes and pastries',
    servingSize: '100g',
    calories: 362,
    protein: 8,
    carbs: 76,
    fat: 1,
    fiber: 2,
    sugar: 0,
    sodium: 2,
    category: 'Grains and Flours',
    aisle: 'Baking'
  },
  {
    name: 'pita bread',
    description: 'Middle Eastern flatbread',
    servingSize: '100g',
    calories: 275,
    protein: 9,
    carbs: 56,
    fat: 1,
    fiber: 2,
    sugar: 1,
    sodium: 536,
    category: 'Breads and Grains',
    aisle: 'Bread'
  },
  {
    name: 'bell pepper',
    description: 'Sweet bell pepper, commonly red, green, or yellow',
    servingSize: '100g',
    calories: 31,
    protein: 1,
    carbs: 6,
    fat: 0,
    fiber: 2,
    sugar: 4,
    sodium: 4,
    category: 'Vegetables',
    aisle: 'Produce'
  },
  {
    name: 'balsamic vinegar',
    description: 'Traditional Italian vinegar aged in wooden barrels',
    servingSize: '100ml',
    calories: 88,
    protein: 0,
    carbs: 17,
    fat: 0,
    fiber: 0,
    sugar: 15,
    sodium: 23,
    category: 'Condiments',
    aisle: 'Condiments'
  },
  {
    name: 'tomato paste',
    description: 'Concentrated tomato puree',
    servingSize: '100g',
    calories: 82,
    protein: 4,
    carbs: 19,
    fat: 0,
    fiber: 4,
    sugar: 12,
    sodium: 59,
    category: 'Canned Goods',
    aisle: 'Canned Goods'
  },
  {
    name: 'crushed tomatoes',
    description: 'Crushed tomatoes in juice or puree',
    servingSize: '100g',
    calories: 32,
    protein: 2,
    carbs: 7,
    fat: 0,
    fiber: 2,
    sugar: 4,
    sodium: 234,
    category: 'Canned Goods',
    aisle: 'Canned Goods'
  },
  {
    name: 'evaporated milk',
    description: 'Concentrated milk with 60% water removed',
    servingSize: '100ml',
    calories: 134,
    protein: 7,
    carbs: 10,
    fat: 8,
    fiber: 0,
    sugar: 10,
    sodium: 106,
    category: 'Dairy',
    aisle: 'Canned Goods'
  },
  {
    name: 'condensed milk',
    description: 'Sweetened condensed milk',
    servingSize: '100ml',
    calories: 321,
    protein: 8,
    carbs: 54,
    fat: 9,
    fiber: 0,
    sugar: 54,
    sodium: 127,
    category: 'Dairy',
    aisle: 'Canned Goods'
  },
  {
    name: 'almond extract',
    description: 'Concentrated almond flavoring for baking',
    servingSize: '100ml',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    category: 'Baking Essentials',
    aisle: 'Baking'
  },
  {
    name: 'food coloring',
    description: 'Liquid food coloring for baking and cooking',
    servingSize: '100ml',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    category: 'Baking Essentials',
    aisle: 'Baking'
  },
  {
    name: 'feta cheese',
    description: 'Greek brined cheese made from sheep and goat milk',
    servingSize: '100g',
    calories: 264,
    protein: 14,
    carbs: 4,
    fat: 21,
    fiber: 0,
    sugar: 4,
    sodium: 917,
    category: 'Dairy',
    aisle: 'Dairy'
  }
];

async function displayNutritionFacts() {
  try {
    console.log('🔬 Researched Nutrition Facts for Missing Ingredients:\n');
    console.log('=' .repeat(80));
    
    missingIngredientsWithNutrition.forEach((ingredient, index) => {
      console.log(`\n${index + 1}. ${ingredient.name.toUpperCase()}`);
      console.log(`   Description: ${ingredient.description}`);
      console.log(`   Serving Size: ${ingredient.servingSize}`);
      console.log(`   Calories: ${ingredient.calories}`);
      console.log(`   Protein: ${ingredient.protein}g`);
      console.log(`   Carbs: ${ingredient.carbs}g`);
      console.log(`   Fat: ${ingredient.fat}g`);
      console.log(`   Fiber: ${ingredient.fiber}g`);
      console.log(`   Sugar: ${ingredient.sugar}g`);
      console.log(`   Sodium: ${ingredient.sodium}mg`);
      console.log(`   Category: ${ingredient.category}`);
      console.log(`   Aisle: ${ingredient.aisle}`);
      console.log('-'.repeat(40));
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`  - Total ingredients researched: ${missingIngredientsWithNutrition.length}`);
    console.log(`  - Ingredients with calories: ${missingIngredientsWithNutrition.filter(i => i.calories > 0).length}`);
    console.log(`  - Zero-calorie ingredients: ${missingIngredientsWithNutrition.filter(i => i.calories === 0).length}`);
    
    console.log(`\n⚠️  IMPORTANT NOTES:`);
    console.log(`  - All nutrition facts are per 100g or 100ml as appropriate`);
    console.log(`  - Values are based on standard USDA and manufacturer data`);
    console.log(`  - Serving sizes use g/ml units as required by database schema`);
    console.log(`  - Zero-calorie items (almond extract, food coloring) are flavorings only`);
    
  } catch (error) {
    console.error('❌ Error displaying nutrition facts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Display the researched nutrition facts
displayNutritionFacts(); 