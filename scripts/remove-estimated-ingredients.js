const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeEstimatedIngredients() {
  try {
    console.log('🔍 Searching for estimated ingredients...');
    
    // Find all ingredients with the estimated nutrition patterns
    const estimatedIngredients = await prisma.ingredient.findMany({
      where: {
        OR: [
          // Pattern 1: Standard estimated values
          {
            calories: 100,
            protein: 5,
            carbs: 10,
            fat: 2,
            fiber: 2,
            sugar: 5,
            sodium: 100
          },
          // Pattern 2: Meat estimates
          {
            calories: 250,
            protein: 25,
            carbs: 0,
            fat: 15,
            fiber: 0,
            sugar: 0,
            sodium: 70
          },
          // Pattern 3: Poultry estimates
          {
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
            fiber: 0,
            sugar: 0,
            sodium: 74
          },
          // Pattern 4: Fish estimates
          {
            calories: 208,
            protein: 25,
            carbs: 0,
            fat: 12,
            fiber: 0,
            sugar: 0,
            sodium: 59
          },
          // Pattern 5: Grain estimates
          {
            calories: 130,
            protein: 2.7,
            carbs: 28,
            fat: 0.3,
            fiber: 0.4,
            sugar: 0.1,
            sodium: 1
          },
          // Pattern 6: Oil/fat estimates
          {
            calories: 884,
            protein: 0,
            carbs: 0,
            fat: 100,
            fiber: 0,
            sugar: 0,
            sodium: 0
          },
          // Pattern 7: Vegetable estimates
          {
            calories: 25,
            protein: 1.5,
            carbs: 5,
            fat: 0.3,
            fiber: 2.5,
            sugar: 2.5,
            sodium: 30
          },
          // Pattern 8: Fruit estimates
          {
            calories: 52,
            protein: 0.3,
            carbs: 14,
            fat: 0.2,
            fiber: 2.4,
            sugar: 10,
            sodium: 1
          },
          // Pattern 9: Dairy estimates
          {
            calories: 42,
            protein: 3.4,
            carbs: 5,
            fat: 1,
            fiber: 0,
            sugar: 5,
            sodium: 44
          },
          // Pattern 10: Egg estimates
          {
            calories: 155,
            protein: 13,
            carbs: 1.1,
            fat: 11,
            fiber: 0,
            sugar: 1.1,
            sodium: 124
          },
          // Pattern 11: Salt/spice estimates
          {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 1000
          },
          // Pattern 12: Water/broth estimates
          {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 50
          },
          // Pattern 13: Vinegar/citrus estimates
          {
            calories: 3,
            protein: 0,
            carbs: 0.5,
            fat: 0,
            fiber: 0,
            sugar: 0.5,
            sodium: 1
          },
          // Pattern 14: Herb estimates
          {
            calories: 1,
            protein: 0.1,
            carbs: 0.2,
            fat: 0,
            fiber: 0.1,
            sugar: 0,
            sodium: 1
          },
          // Pattern 15: Garlic/onion estimates
          {
            calories: 4,
            protein: 0.2,
            carbs: 1,
            fat: 0,
            fiber: 0.1,
            sugar: 0.3,
            sodium: 1
          }
        ]
      }
    });

    console.log(`📊 Found ${estimatedIngredients.length} estimated ingredients to remove:`);
    
    estimatedIngredients.forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.name} (${ingredient.calories} cal, ${ingredient.protein}g protein, ${ingredient.carbs}g carbs, ${ingredient.fat}g fat)`);
    });

    if (estimatedIngredients.length === 0) {
      console.log('✅ No estimated ingredients found!');
      return;
    }

    // Also check for ingredients with "AI-generated" in description
    const aiGeneratedIngredients = await prisma.ingredient.findMany({
      where: {
        description: {
          contains: 'AI-generated'
        }
      }
    });

    console.log(`🤖 Found ${aiGeneratedIngredients.length} AI-generated ingredients to remove:`);
    
    aiGeneratedIngredients.forEach((ingredient, index) => {
      console.log(`${index + 1}. ${ingredient.name} - ${ingredient.description}`);
    });

    // Combine all ingredients to remove
    const allIngredientsToRemove = [...estimatedIngredients, ...aiGeneratedIngredients];
    const uniqueIngredientsToRemove = allIngredientsToRemove.filter((ingredient, index, self) => 
      index === self.findIndex(i => i.id === ingredient.id)
    );

    console.log(`\n🗑️  Total unique ingredients to remove: ${uniqueIngredientsToRemove.length}`);

    if (uniqueIngredientsToRemove.length > 0) {
      // Delete the ingredients
      const deleteResult = await prisma.ingredient.deleteMany({
        where: {
          id: {
            in: uniqueIngredientsToRemove.map(i => i.id)
          }
        }
      });

      console.log(`✅ Successfully removed ${deleteResult.count} estimated/AI-generated ingredients from database`);
    }

  } catch (error) {
    console.error('❌ Error removing estimated ingredients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
removeEstimatedIngredients(); 