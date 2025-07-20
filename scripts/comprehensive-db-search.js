const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprehensive list of common ingredients that should be in the database
const comprehensiveIngredients = [
  // Dairy & Eggs
  'milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs', 'cottage cheese', 'sour cream',
  'heavy cream', 'half and half', 'whipping cream', 'cream cheese', 'feta cheese',
  'parmesan cheese', 'mozzarella cheese', 'cheddar cheese', 'swiss cheese', 'provolone cheese',
  'ricotta cheese', 'blue cheese', 'gouda cheese', 'brie cheese', 'goat cheese',
  
  // Oils & Fats
  'olive oil', 'vegetable oil', 'coconut oil', 'canola oil', 'sesame oil', 'avocado oil',
  'peanut oil', 'sunflower oil', 'grapeseed oil', 'walnut oil', 'almond oil', 'palm oil',
  
  // Sweeteners
  'sugar', 'honey', 'maple syrup', 'brown sugar', 'powdered sugar', 'agave nectar',
  'stevia', 'splenda', 'aspartame', 'corn syrup', 'molasses', 'date syrup',
  
  // Flours & Grains
  'all-purpose flour', 'whole wheat flour', 'bread flour', 'cake flour', 'pastry flour',
  'self-rising flour', 'almond flour', 'coconut flour', 'rice flour', 'cornmeal',
  'rice', 'pasta', 'spaghetti', 'penne', 'macaroni', 'lasagna noodles', 'fettuccine',
  'quinoa', 'oats', 'oatmeal', 'steel cut oats', 'rolled oats', 'bread', 'tortillas',
  'pita bread', 'naan bread', 'sourdough bread', 'whole wheat bread', 'white bread',
  'bagels', 'english muffins', 'croissants', 'biscuits', 'crackers', 'pretzels',
  
  // Proteins
  'chicken breast', 'chicken thighs', 'chicken wings', 'ground beef', 'beef steak',
  'pork chops', 'pork tenderloin', 'bacon', 'ham', 'sausage', 'hot dogs',
  'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'shrimp', 'crab', 'lobster',
  'tofu', 'tempeh', 'seitan', 'beans', 'lentils', 'chickpeas', 'black beans',
  'kidney beans', 'pinto beans', 'navy beans', 'lima beans', 'split peas',
  
  // Vegetables
  'onion', 'garlic', 'tomato', 'lettuce', 'spinach', 'kale', 'arugula', 'romaine',
  'carrots', 'potatoes', 'sweet potato', 'yams', 'bell pepper', 'jalapeno pepper',
  'cucumber', 'zucchini', 'yellow squash', 'eggplant', 'mushrooms', 'broccoli',
  'cauliflower', 'asparagus', 'green beans', 'snap peas', 'snow peas', 'peas',
  'corn', 'celery', 'radishes', 'turnips', 'rutabaga', 'beets', 'parsnips',
  'brussels sprouts', 'cabbage', 'bok choy', 'napa cabbage', 'collard greens',
  'mustard greens', 'swiss chard', 'leeks', 'shallots', 'scallions', 'chives',
  
  // Fruits
  'apple', 'banana', 'orange', 'lemon', 'lime', 'grapefruit', 'strawberries',
  'blueberries', 'raspberries', 'blackberries', 'grapes', 'peach', 'nectarine',
  'pear', 'plum', 'apricot', 'cherries', 'pineapple', 'mango', 'papaya',
  'kiwi', 'avocado', 'coconut', 'figs', 'dates', 'prunes', 'raisins',
  'cranberries', 'goji berries', 'pomegranate', 'watermelon', 'cantaloupe',
  'honeydew melon', 'dragon fruit', 'star fruit',
  
  // Nuts & Seeds
  'almonds', 'walnuts', 'pecans', 'peanuts', 'cashews', 'pistachios', 'macadamia nuts',
  'hazelnuts', 'pine nuts', 'sunflower seeds', 'pumpkin seeds', 'chia seeds',
  'flax seeds', 'hemp seeds', 'sesame seeds', 'poppy seeds', 'pomegranate seeds',
  
  // Condiments & Sauces
  'ketchup', 'mayonnaise', 'mustard', 'dijon mustard', 'yellow mustard', 'honey mustard',
  'soy sauce', 'tamari', 'hot sauce', 'sriracha', 'tabasco', 'worcestershire sauce',
  'barbecue sauce', 'ranch dressing', 'italian dressing', 'caesar dressing',
  'blue cheese dressing', 'thousand island dressing', 'balsamic vinegar',
  'apple cider vinegar', 'red wine vinegar', 'white wine vinegar', 'rice vinegar',
  
  // Canned Goods
  'tomato sauce', 'tomato paste', 'crushed tomatoes', 'diced tomatoes', 'tomato puree',
  'coconut milk', 'evaporated milk', 'condensed milk', 'cream of mushroom soup',
  'cream of chicken soup', 'chicken broth', 'beef broth', 'vegetable broth',
  'fish sauce', 'oyster sauce', 'hoisin sauce', 'teriyaki sauce',
  
  // Baking Essentials
  'chocolate chips', 'dark chocolate', 'milk chocolate', 'white chocolate',
  'cocoa powder', 'unsweetened cocoa', 'vanilla extract', 'almond extract',
  'lemon extract', 'orange extract', 'food coloring', 'sprinkles', 'marshmallows',
  'baking chocolate', 'chocolate bars', 'chocolate syrup', 'caramel sauce',
  'butterscotch chips', 'peanut butter chips', 'white chocolate chips',
  
  // Other Common Items
  'peanut butter', 'almond butter', 'cashew butter', 'sunflower seed butter',
  'jelly', 'jam', 'preserves', 'nutella', 'hazelnut spread', 'marshmallow fluff',
  'cream cheese', 'sour cream', 'yogurt', 'greek yogurt', 'cottage cheese',
  'ricotta cheese', 'mascarpone cheese', 'burrata cheese', 'halloumi cheese',
  'queso fresco', 'cotija cheese', 'manchego cheese', 'asiago cheese',
  
  // Beverages & Liquids
  'orange juice', 'apple juice', 'grape juice', 'cranberry juice', 'lemonade',
  'limeade', 'coffee', 'tea', 'green tea', 'black tea', 'herbal tea',
  'beer', 'wine', 'red wine', 'white wine', 'vodka', 'rum', 'whiskey',
  
  // Frozen Foods
  'frozen peas', 'frozen corn', 'frozen spinach', 'frozen broccoli',
  'frozen strawberries', 'frozen blueberries', 'ice cream', 'frozen yogurt',
  'popsicles', 'frozen pizza', 'frozen waffles', 'frozen french fries',
  
  // Snacks & Treats
  'popcorn', 'potato chips', 'tortilla chips', 'pretzels', 'crackers',
  'granola bars', 'protein bars', 'energy bars', 'trail mix', 'mixed nuts',
  'dried fruit', 'beef jerky', 'turkey jerky', 'pepperoni', 'salami',
  
  // International Ingredients
  'soba noodles', 'udon noodles', 'rice noodles', 'phyllo dough', 'puff pastry',
  'filo dough', 'pizza dough', 'bread dough', 'pie crust', 'tart shells',
  'wonton wrappers', 'egg roll wrappers', 'spring roll wrappers',
  'curry paste', 'curry powder', 'garam masala', 'turmeric', 'cumin',
  'coriander', 'cardamom', 'cinnamon', 'nutmeg', 'allspice', 'cloves',
  'bay leaves', 'oregano', 'basil', 'thyme', 'rosemary', 'sage',
  'dill', 'parsley', 'cilantro', 'mint', 'chives', 'tarragon',
  'marjoram', 'savory', 'fennel', 'anise', 'star anise', 'saffron',
  'paprika', 'cayenne pepper', 'black pepper', 'white pepper', 'red pepper flakes',
  'chili powder', 'chipotle powder', 'smoked paprika', 'hungarian paprika'
];

async function comprehensiveSearch() {
  try {
    console.log('🔍 Comprehensive Database Search for Missing Ingredients...\n');
    
    const missingIngredients = [];
    const foundIngredients = [];
    const partialMatches = [];
    
    for (const ingredient of comprehensiveIngredients) {
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
      } else if (existing.length > 0) {
        partialMatches.push({ ingredient, matches: existing.map(e => e.name) });
        console.log(`⚠️  Partial: ${ingredient} (found: ${existing.map(e => e.name).join(', ')})`);
      } else {
        missingIngredients.push(ingredient);
        console.log(`❌ Missing: ${ingredient}`);
      }
    }
    
    console.log(`\n📊 Comprehensive Search Summary:`);
    console.log(`  - Found: ${foundIngredients.length} ingredients`);
    console.log(`  - Missing: ${missingIngredients.length} ingredients`);
    console.log(`  - Partial matches: ${partialMatches.length} ingredients`);
    console.log(`  - Total checked: ${comprehensiveIngredients.length}`);
    
    if (missingIngredients.length > 0) {
      console.log(`\n🔍 MISSING INGREDIENTS TO RESEARCH:`);
      console.log('```');
      missingIngredients.forEach((ingredient, index) => {
        console.log(`${index + 1}. ${ingredient}`);
      });
      console.log('```');
    }
    
    return { foundIngredients, missingIngredients, partialMatches };
    
  } catch (error) {
    console.error('❌ Error in comprehensive search:', error);
    return { foundIngredients: [], missingIngredients: [], partialMatches: [] };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the comprehensive search
comprehensiveSearch(); 