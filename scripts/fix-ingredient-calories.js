const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixIngredientCalories() {
  try {
    console.log('Fixing ingredient calorie issues...\n');
    
    // First, let's check for ingredients with very high calories (likely kJ values)
    const highCaloriesIngredients = await prisma.ingredient.findMany({
      where: { calories: { gt: 1000 } },
      select: { id: true, name: true, calories: true, protein: true, carbs: true, fat: true }
    });
    
    console.log(`Found ${highCaloriesIngredients.length} ingredients with >1000 calories (likely kJ values)`);
    
    // Convert kJ to kcal (divide by 4.184)
    let convertedCount = 0;
    for (const ingredient of highCaloriesIngredients) {
      const originalCalories = ingredient.calories;
      const convertedCalories = Math.round(originalCalories / 4.184);
      
      await prisma.ingredient.update({
        where: { id: ingredient.id },
        data: { calories: convertedCalories }
      });
      
      console.log(`Converted ${ingredient.name}: ${originalCalories} kJ -> ${convertedCalories} kcal`);
      convertedCount++;
    }
    
    console.log(`\nConverted ${convertedCount} ingredients from kJ to kcal\n`);
    
    // Now fix ingredients with 0 calories by estimating based on macronutrients
    const zeroCaloriesIngredients = await prisma.ingredient.findMany({
      where: { calories: 0 },
      select: { id: true, name: true, calories: true, protein: true, carbs: true, fat: true }
    });
    
    console.log(`Found ${zeroCaloriesIngredients.length} ingredients with 0 calories`);
    
    let estimatedCount = 0;
    for (const ingredient of zeroCaloriesIngredients) {
      // Calculate calories from macronutrients (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat)
      const calculatedCalories = Math.round(
        (ingredient.protein * 4) + (ingredient.carbs * 4) + (ingredient.fat * 9)
      );
      
      // If calculated calories is still 0, estimate based on ingredient type
      let estimatedCalories = calculatedCalories;
      if (calculatedCalories === 0) {
        const lowerName = ingredient.name.toLowerCase();
        
        if (lowerName.includes('salt') || lowerName.includes('pepper') || lowerName.includes('spice')) {
          estimatedCalories = 0; // Spices typically have negligible calories
        } else if (lowerName.includes('water') || lowerName.includes('broth') || lowerName.includes('stock')) {
          estimatedCalories = 0; // Water-based ingredients
        } else if (lowerName.includes('vinegar') || lowerName.includes('lemon') || lowerName.includes('lime')) {
          estimatedCalories = 3; // Acidic ingredients
        } else if (lowerName.includes('herb') || lowerName.includes('basil') || lowerName.includes('oregano')) {
          estimatedCalories = 1; // Herbs
        } else if (lowerName.includes('garlic') || lowerName.includes('onion')) {
          estimatedCalories = 4; // Aromatics
        } else if (lowerName.includes('mushroom') || lowerName.includes('fungi')) {
          estimatedCalories = 22; // Mushrooms
        } else if (lowerName.includes('lettuce') || lowerName.includes('spinach') || lowerName.includes('kale')) {
          estimatedCalories = 15; // Leafy greens
        } else if (lowerName.includes('cucumber') || lowerName.includes('celery')) {
          estimatedCalories = 16; // High water vegetables
        } else if (lowerName.includes('tomato') || lowerName.includes('bell pepper')) {
          estimatedCalories = 18; // Fruiting vegetables
        } else if (lowerName.includes('carrot') || lowerName.includes('beet')) {
          estimatedCalories = 41; // Root vegetables
        } else if (lowerName.includes('potato') || lowerName.includes('sweet potato')) {
          estimatedCalories = 77; // Starchy vegetables
        } else if (lowerName.includes('bean') || lowerName.includes('lentil') || lowerName.includes('pea')) {
          estimatedCalories = 127; // Legumes
        } else if (lowerName.includes('rice') || lowerName.includes('quinoa') || lowerName.includes('grain')) {
          estimatedCalories = 130; // Grains
        } else if (lowerName.includes('bread') || lowerName.includes('pasta')) {
          estimatedCalories = 265; // Baked goods
        } else if (lowerName.includes('chicken') || lowerName.includes('turkey')) {
          estimatedCalories = 165; // Poultry
        } else if (lowerName.includes('beef') || lowerName.includes('lamb') || lowerName.includes('pork')) {
          estimatedCalories = 250; // Red meat
        } else if (lowerName.includes('fish') || lowerName.includes('salmon') || lowerName.includes('tuna')) {
          estimatedCalories = 208; // Fish
        } else if (lowerName.includes('egg')) {
          estimatedCalories = 155; // Eggs
        } else if (lowerName.includes('milk') || lowerName.includes('yogurt')) {
          estimatedCalories = 42; // Dairy
        } else if (lowerName.includes('cheese')) {
          estimatedCalories = 113; // Cheese
        } else if (lowerName.includes('oil') || lowerName.includes('butter') || lowerName.includes('fat')) {
          estimatedCalories = 884; // Fats
        } else if (lowerName.includes('sugar') || lowerName.includes('honey') || lowerName.includes('syrup')) {
          estimatedCalories = 387; // Sweeteners
        } else if (lowerName.includes('apple') || lowerName.includes('banana') || lowerName.includes('berry')) {
          estimatedCalories = 52; // Fruits
        } else {
          estimatedCalories = 100; // Default fallback
        }
      }
      
      await prisma.ingredient.update({
        where: { id: ingredient.id },
        data: { calories: estimatedCalories }
      });
      
      console.log(`Estimated ${ingredient.name}: ${estimatedCalories} cal (was 0)`);
      estimatedCount++;
    }
    
    console.log(`\nEstimated calories for ${estimatedCount} ingredients\n`);
    
    // Final statistics
    const finalZeroCount = await prisma.ingredient.count({
      where: { calories: 0 }
    });
    
    const finalHighCount = await prisma.ingredient.count({
      where: { calories: { gt: 1000 } }
    });
    
    const finalReasonableCount = await prisma.ingredient.count({
      where: { 
        calories: { 
          gt: 0,
          lt: 1000 
        } 
      }
    });
    
    console.log('Final statistics:');
    console.log(`- Ingredients with 0 calories: ${finalZeroCount}`);
    console.log(`- Ingredients with >1000 calories: ${finalHighCount}`);
    console.log(`- Ingredients with reasonable calories (1-999): ${finalReasonableCount}`);
    
  } catch (error) {
    console.error('Error fixing ingredient calories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixIngredientCalories();
}

module.exports = { fixIngredientCalories }; 