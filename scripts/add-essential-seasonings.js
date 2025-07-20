const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Only true seasonings with 0 calories
const zeroCalorieSeasonings = [
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

async function addEssentialSeasonings() {
  try {
    console.log('🔍 Checking for existing seasonings and adding missing ones...\n');
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const seasoning of zeroCalorieSeasonings) {
      // More thorough check for existing ingredients
      const existing = await prisma.ingredient.findMany({
        where: {
          OR: [
            { name: { equals: seasoning.name.toLowerCase() } },
            { name: { contains: seasoning.name.toLowerCase() } },
            { description: { contains: seasoning.name.toLowerCase() } }
          ],
          isActive: true
        }
      });
      
      // Check if any of the existing matches are actually the seasoning we want
      const isSeasoning = existing.some(item => {
        const itemName = item.name.toLowerCase();
        const itemDesc = (item.description || '').toLowerCase();
        const seasoningName = seasoning.name.toLowerCase();
        
        // Check if it's actually the seasoning, not just containing the word
        return itemName === seasoningName || 
               itemName.includes(`spices, ${seasoningName}`) ||
               itemName.includes(`${seasoningName},`) ||
               itemName.includes(`${seasoningName} `) ||
               itemDesc.includes(`spice`) ||
               itemDesc.includes(`seasoning`);
      });
      
      if (isSeasoning) {
        console.log(`⏭️  Skipping ${seasoning.name} - already exists`);
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
    console.log(`  - Total processed: ${zeroCalorieSeasonings.length}`);
    
  } catch (error) {
    console.error('❌ Error adding seasonings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addEssentialSeasonings(); 