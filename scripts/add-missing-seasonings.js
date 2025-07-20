const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Common seasonings with their standard serving sizes in g/ml
const commonSeasonings = [
  { name: 'salt', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 387 },
  { name: 'black pepper', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'white pepper', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'garlic powder', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'onion powder', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'paprika', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'cayenne pepper', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'red pepper flakes', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'oregano', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'basil', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'thyme', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'rosemary', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'sage', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'bay leaves', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'cumin', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'coriander', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'turmeric', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'ginger', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'cinnamon', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'nutmeg', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'allspice', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'cloves', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'cardamom', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'vanilla extract', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'lemon juice', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'lime juice', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'vinegar', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'soy sauce', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'worcestershire sauce', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'hot sauce', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'mustard', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'ketchup', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'mayonnaise', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'butter', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'olive oil', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'vegetable oil', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'sesame oil', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'coconut oil', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'honey', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'maple syrup', servingSize: '1ml', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'sugar', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'brown sugar', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'powdered sugar', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'flour', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'baking powder', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'baking soda', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'yeast', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'breadcrumbs', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'panko', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'cornstarch', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'arrowroot', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'gelatin', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'agar agar', servingSize: '1g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
];

async function addMissingSeasonings() {
  try {
    console.log('🔍 Checking for existing seasonings and adding missing ones...\n');
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const seasoning of commonSeasonings) {
      // Check if seasoning already exists
      const existing = await prisma.ingredient.findFirst({
        where: {
          OR: [
            { name: { equals: seasoning.name.toLowerCase() } },
            { name: { contains: seasoning.name.toLowerCase() } }
          ],
          isActive: true
        }
      });
      
      if (existing) {
        console.log(`⏭️  Skipping ${seasoning.name} - already exists as "${existing.name}"`);
        skippedCount++;
      } else {
        // Add the seasoning
        await prisma.ingredient.create({
          data: {
            name: seasoning.name.toLowerCase(),
            description: `Common seasoning: ${seasoning.name}`,
            servingSize: seasoning.servingSize,
            calories: seasoning.calories,
            protein: seasoning.protein,
            carbs: seasoning.carbs,
            fat: seasoning.fat,
            fiber: seasoning.fiber,
            sugar: seasoning.sugar,
            sodium: seasoning.sodium,
            category: 'Spices and Herbs',
            aisle: 'Spices',
            isActive: true
          }
        });
        
        console.log(`✅ Added ${seasoning.name} (${seasoning.servingSize})`);
        addedCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  - Added: ${addedCount} seasonings`);
    console.log(`  - Skipped: ${skippedCount} (already exist)`);
    console.log(`  - Total processed: ${commonSeasonings.length}`);
    
    // Also add some common ingredients that might be missing
    const commonIngredients = [
      { name: 'chicken breast', servingSize: '100g', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, category: 'Poultry Products', aisle: 'Meat' },
      { name: 'ground beef', servingSize: '100g', calories: 250, protein: 25, carbs: 0, fat: 15, fiber: 0, sugar: 0, sodium: 70, category: 'Beef Products', aisle: 'Meat' },
      { name: 'salmon', servingSize: '100g', calories: 208, protein: 25, carbs: 0, fat: 12, fiber: 0, sugar: 0, sodium: 59, category: 'Finfish and Shellfish Products', aisle: 'Seafood' },
      { name: 'rice', servingSize: '100g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 1, category: 'Cereal Grains and Pasta', aisle: 'Grains' },
      { name: 'pasta', servingSize: '100g', calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sugar: 0.8, sodium: 6, category: 'Cereal Grains and Pasta', aisle: 'Grains' },
      { name: 'tomatoes', servingSize: '100g', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5, category: 'Vegetables and Vegetable Products', aisle: 'Produce' },
      { name: 'onions', servingSize: '100g', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sugar: 4.7, sodium: 4, category: 'Vegetables and Vegetable Products', aisle: 'Produce' },
      { name: 'garlic', servingSize: '100g', calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, sugar: 1, sodium: 17, category: 'Vegetables and Vegetable Products', aisle: 'Produce' },
      { name: 'carrots', servingSize: '100g', calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69, category: 'Vegetables and Vegetable Products', aisle: 'Produce' },
      { name: 'broccoli', servingSize: '100g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.5, sodium: 33, category: 'Vegetables and Vegetable Products', aisle: 'Produce' },
      { name: 'spinach', servingSize: '100g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79, category: 'Vegetables and Vegetable Products', aisle: 'Produce' },
      { name: 'eggs', servingSize: '100g', calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1, sodium: 124, category: 'Dairy and Egg Products', aisle: 'Dairy' },
      { name: 'milk', servingSize: '100ml', calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, sugar: 5, sodium: 44, category: 'Dairy and Egg Products', aisle: 'Dairy' },
      { name: 'cheese', servingSize: '100g', calories: 113, protein: 25, carbs: 0.4, fat: 0.3, fiber: 0, sugar: 0.4, sodium: 621, category: 'Dairy and Egg Products', aisle: 'Dairy' },
      { name: 'bread', servingSize: '100g', calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sugar: 5, sodium: 491, category: 'Baked Products', aisle: 'Bakery' }
    ];
    
    console.log('\n🔍 Adding common ingredients...');
    let addedIngredients = 0;
    
    for (const ingredient of commonIngredients) {
      const existing = await prisma.ingredient.findFirst({
        where: {
          OR: [
            { name: { equals: ingredient.name.toLowerCase() } },
            { name: { contains: ingredient.name.toLowerCase() } }
          ],
          isActive: true
        }
      });
      
      if (!existing) {
        await prisma.ingredient.create({
          data: {
            name: ingredient.name.toLowerCase(),
            description: `Common ingredient: ${ingredient.name}`,
            servingSize: ingredient.servingSize,
            calories: ingredient.calories,
            protein: ingredient.protein,
            carbs: ingredient.carbs,
            fat: ingredient.fat,
            fiber: ingredient.fiber,
            sugar: ingredient.sugar,
            sodium: ingredient.sodium,
            category: ingredient.category,
            aisle: ingredient.aisle,
            isActive: true
          }
        });
        
        console.log(`✅ Added ${ingredient.name} (${ingredient.servingSize})`);
        addedIngredients++;
      }
    }
    
    console.log(`\n📊 Final Summary:`);
    console.log(`  - Added seasonings: ${addedCount}`);
    console.log(`  - Added ingredients: ${addedIngredients}`);
    console.log(`  - Total new items: ${addedCount + addedIngredients}`);
    
  } catch (error) {
    console.error('❌ Error adding seasonings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addMissingSeasonings(); 