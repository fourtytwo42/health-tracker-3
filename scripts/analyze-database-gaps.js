const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Common ingredients that should be in the database
const commonIngredients = [
  // Dairy & Eggs
  'milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs', 'cottage cheese', 'sour cream',
  
  // Oils & Fats
  'olive oil', 'vegetable oil', 'coconut oil', 'canola oil', 'sesame oil', 'avocado oil',
  
  // Sweeteners
  'sugar', 'honey', 'maple syrup', 'brown sugar', 'powdered sugar', 'agave nectar',
  
  // Flours & Grains
  'all-purpose flour', 'whole wheat flour', 'bread flour', 'cake flour', 'rice', 'pasta',
  'quinoa', 'oats', 'oatmeal', 'bread', 'tortillas', 'pita bread',
  
  // Proteins
  'chicken breast', 'ground beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'tofu',
  'beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans',
  
  // Vegetables
  'onion', 'garlic', 'tomato', 'lettuce', 'spinach', 'kale', 'carrots', 'potatoes',
  'sweet potato', 'bell pepper', 'cucumber', 'zucchini', 'mushrooms', 'broccoli',
  'cauliflower', 'asparagus', 'green beans', 'peas', 'corn',
  
  // Fruits
  'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberries', 'blueberries',
  'grapes', 'peach', 'pear', 'pineapple', 'mango', 'avocado',
  
  // Nuts & Seeds
  'almonds', 'walnuts', 'peanuts', 'cashews', 'sunflower seeds', 'chia seeds',
  'flax seeds', 'pumpkin seeds',
  
  // Condiments & Sauces
  'ketchup', 'mayonnaise', 'mustard', 'soy sauce', 'hot sauce', 'worcestershire sauce',
  'barbecue sauce', 'ranch dressing', 'italian dressing', 'balsamic vinegar',
  
  // Canned Goods
  'tomato sauce', 'tomato paste', 'crushed tomatoes', 'diced tomatoes',
  'coconut milk', 'evaporated milk', 'condensed milk',
  
  // Baking Essentials
  'chocolate chips', 'cocoa powder', 'vanilla extract', 'almond extract',
  'food coloring', 'sprinkles', 'marshmallows',
  
  // Other Common Items
  'peanut butter', 'jelly', 'jam', 'nutella', 'cream cheese', 'feta cheese',
  'parmesan cheese', 'mozzarella cheese', 'cheddar cheese'
];

async function analyzeDatabaseGaps() {
  try {
    console.log('🔍 Analyzing database for missing common ingredients...\n');
    
    const missingIngredients = [];
    const foundIngredients = [];
    
    for (const ingredient of commonIngredients) {
      // Search for the ingredient
      const existing = await prisma.ingredient.findMany({
        where: {
          OR: [
            { name: { equals: ingredient.toLowerCase() } },
            { name: { contains: ingredient.toLowerCase() } },
            { description: { contains: ingredient.toLowerCase() } }
          ],
          isActive: true
        }
      });
      
      // Check if we found a good match
      const isGoodMatch = existing.some(item => {
        const itemName = item.name.toLowerCase();
        const itemDesc = (item.description || '').toLowerCase();
        const searchTerm = ingredient.toLowerCase();
        
        // More precise matching
        return itemName === searchTerm ||
               itemName.includes(`${searchTerm},`) ||
               itemName.includes(`${searchTerm} `) ||
               itemName.includes(` ${searchTerm}`) ||
               itemDesc.includes(searchTerm);
      });
      
      if (isGoodMatch) {
        foundIngredients.push(ingredient);
        console.log(`✅ Found: ${ingredient}`);
      } else {
        missingIngredients.push(ingredient);
        console.log(`❌ Missing: ${ingredient}`);
      }
    }
    
    console.log(`\n📊 Analysis Summary:`);
    console.log(`  - Found: ${foundIngredients.length} ingredients`);
    console.log(`  - Missing: ${missingIngredients.length} ingredients`);
    console.log(`  - Total checked: ${commonIngredients.length}`);
    
    if (missingIngredients.length > 0) {
      console.log(`\n🔍 Missing ingredients to research:`);
      missingIngredients.forEach((ingredient, index) => {
        console.log(`  ${index + 1}. ${ingredient}`);
      });
    }
    
    return { foundIngredients, missingIngredients };
    
  } catch (error) {
    console.error('❌ Error analyzing database:', error);
    return { foundIngredients: [], missingIngredients: [] };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeDatabaseGaps(); 