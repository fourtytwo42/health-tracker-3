const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Common seasonings that should be in the database
const commonSeasonings = [
  'salt',
  'black pepper',
  'white pepper',
  'garlic powder',
  'onion powder',
  'paprika',
  'cayenne pepper',
  'red pepper flakes',
  'oregano',
  'basil',
  'thyme',
  'rosemary',
  'sage',
  'bay leaves',
  'cumin',
  'coriander',
  'turmeric',
  'ginger',
  'cinnamon',
  'nutmeg',
  'allspice',
  'cloves',
  'cardamom',
  'vanilla extract',
  'lemon juice',
  'lime juice',
  'vinegar',
  'soy sauce',
  'worcestershire sauce',
  'hot sauce',
  'mustard',
  'ketchup',
  'mayonnaise',
  'butter',
  'olive oil',
  'vegetable oil',
  'sesame oil',
  'coconut oil',
  'honey',
  'maple syrup',
  'sugar',
  'brown sugar',
  'powdered sugar',
  'flour',
  'baking powder',
  'baking soda',
  'yeast',
  'breadcrumbs',
  'panko',
  'cornstarch',
  'arrowroot',
  'gelatin',
  'agar agar'
];

async function checkSeasonings() {
  try {
    console.log('🔍 Checking for common seasonings in the database...\n');
    
    const foundSeasonings = [];
    const missingSeasonings = [];
    
    for (const seasoning of commonSeasonings) {
      // Search for the seasoning using multiple strategies
      let found = await prisma.ingredient.findFirst({
        where: {
          OR: [
            { name: { equals: seasoning.toLowerCase() } },
            { name: { contains: seasoning.toLowerCase() } },
            { description: { contains: seasoning.toLowerCase() } }
          ],
          isActive: true
        }
      });
      
      if (found) {
        foundSeasonings.push({
          name: seasoning,
          dbName: found.name,
          calories: found.calories,
          category: found.category
        });
      } else {
        missingSeasonings.push(seasoning);
      }
    }
    
    console.log(`✅ Found ${foundSeasonings.length} seasonings in database:`);
    foundSeasonings.forEach(item => {
      console.log(`  - ${item.name} (${item.dbName}) - ${item.calories} cal`);
    });
    
    console.log(`\n❌ Missing ${missingSeasonings.length} seasonings:`);
    missingSeasonings.forEach(seasoning => {
      console.log(`  - ${seasoning}`);
    });
    
    // Also check for any seasonings/spices in the database
    console.log('\n🔍 Checking for any existing seasonings/spices in database...');
    const existingSeasonings = await prisma.ingredient.findMany({
      where: {
        OR: [
          { category: { contains: 'spice' } },
          { category: { contains: 'seasoning' } },
          { category: { contains: 'herb' } },
          { name: { contains: 'salt' } },
          { name: { contains: 'pepper' } },
          { name: { contains: 'powder' } },
          { name: { contains: 'spice' } },
          { name: { contains: 'herb' } }
        ],
        isActive: true
      },
      select: {
        name: true,
        category: true,
        calories: true
      }
    });
    
    console.log(`Found ${existingSeasonings.length} existing seasonings/spices:`);
    existingSeasonings.forEach(item => {
      console.log(`  - ${item.name} (${item.category}) - ${item.calories} cal`);
    });
    
  } catch (error) {
    console.error('❌ Error checking seasonings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkSeasonings(); 