// Comprehensive test script to verify all fixes
function calculateIngredientNutrition(ingredient, amount, unit) {
  // Check if this is a spice/seasoning by category or name
  const isSpiceOrSeasoning = ingredient.category === 'Spices and Herbs' ||
                            ingredient.name.toLowerCase().includes('baking powder') ||
                            ingredient.name.toLowerCase().includes('leavening') ||
                            ingredient.name.toLowerCase().includes('salt') ||
                            ingredient.name.toLowerCase().includes('pepper') ||
                            ingredient.name.toLowerCase().includes('vanilla') ||
                            ingredient.name.toLowerCase().includes('extract') ||
                            ingredient.name.toLowerCase().includes('chili') ||
                            ingredient.name.toLowerCase().includes('spices');
  
  if (isSpiceOrSeasoning) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  }

  // Parse the serving size to get the base amount
  const servingSizeMatch = ingredient.servingSize.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
  if (!servingSizeMatch) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  }

  const baseAmount = parseFloat(servingSizeMatch[1]);
  const baseUnit = servingSizeMatch[2].toLowerCase();
  
  // Convert to grams for calculation
  let amountInGrams = amount;
  if (unit.toLowerCase() === 'ml') {
    amountInGrams = amount; // 1ml ≈ 1g for most ingredients
  } else if (unit.toLowerCase() === 'g') {
    amountInGrams = amount;
  }

  let baseAmountInGrams = baseAmount;
  if (baseUnit === 'ml') {
    baseAmountInGrams = baseAmount;
  } else if (baseUnit === 'g') {
    baseAmountInGrams = baseAmount;
  }

  // Calculate scaling factor
  const scalingFactor = amountInGrams / baseAmountInGrams;

  // Calculate calories from macros if calories are missing or zero
  let calories = ingredient.calories;
  if (!calories || calories === 0) {
    calories = (ingredient.protein * 4) + (ingredient.carbs * 4) + (ingredient.fat * 9);
  }

  return {
    calories: Math.round(calories * scalingFactor),
    protein: Math.round(ingredient.protein * scalingFactor * 10) / 10,
    carbs: Math.round(ingredient.carbs * scalingFactor * 10) / 10,
    fat: Math.round(ingredient.fat * scalingFactor * 10) / 10
  };
}

// Test cases from the user's examples
const testCases = [
  // From Ham and Vegetable Pasta Bake
  {
    name: 'Ham (150g)',
    ingredient: {
      name: 'ham, minced',
      servingSize: '100g',
      calories: 263,
      protein: 16.3,
      carbs: 1.84,
      fat: 20.7,
      category: 'Proteins'
    },
    amount: 150,
    unit: 'g',
    expectedCalories: 395
  },
  {
    name: 'Pasta (200g)',
    ingredient: {
      name: 'pasta, spaghetti, cooked',
      servingSize: '100g',
      calories: 45,
      protein: 1.41,
      carbs: 8.05,
      fat: 1.48,
      category: 'Grains and Flours'
    },
    amount: 200,
    unit: 'g',
    expectedCalories: 90
  },
  {
    name: 'Olive Oil (250g)',
    ingredient: {
      name: 'olive oil',
      servingSize: '100g',
      calories: 900,
      protein: 0,
      carbs: 0,
      fat: 100,
      category: 'Oils and Fats'
    },
    amount: 250,
    unit: 'g',
    expectedCalories: 2250
  },
  {
    name: 'Garlic (20g)',
    ingredient: {
      name: 'garlic, raw',
      servingSize: '100g',
      calories: 143,
      protein: 6.62,
      carbs: 28.2,
      fat: 0.38,
      category: 'Vegetables'
    },
    amount: 20,
    unit: 'g',
    expectedCalories: 29
  },
  // From Beef Stroganoff
  {
    name: 'Beef Strips (200g)',
    ingredient: {
      name: 'beef, loin, top loin steak, boneless, lip off, separable lean only, trimmed to 0" fat, select, raw',
      servingSize: '100g',
      calories: 157,
      protein: 22.8,
      carbs: 0,
      fat: 7.1,
      category: 'Proteins'
    },
    amount: 200,
    unit: 'g',
    expectedCalories: 314
  },
  {
    name: 'Flour (25g)',
    ingredient: {
      name: 'flour, wheat, all-purpose, enriched, bleached',
      servingSize: '100g',
      calories: 366,
      protein: 10.9,
      carbs: 77.3,
      fat: 1.48,
      category: 'Grains and Flours'
    },
    amount: 25,
    unit: 'g',
    expectedCalories: 92
  },
  {
    name: 'Butter (25g)',
    ingredient: {
      name: 'butter, stick, unsalted',
      servingSize: '100g',
      calories: 102,
      protein: 0.12,
      carbs: 0.01,
      fat: 11.52,
      category: 'Dairy'
    },
    amount: 25,
    unit: 'g',
    expectedCalories: 26
  },
  {
    name: 'Sour Cream (50g)',
    ingredient: {
      name: 'cream, sour, cultured',
      servingSize: '100g',
      calories: 196,
      protein: 3.07,
      carbs: 5.56,
      fat: 18,
      category: 'Dairy'
    },
    amount: 50,
    unit: 'g',
    expectedCalories: 98
  },
  {
    name: 'Salt (5g)',
    ingredient: {
      name: 'salt, table, iodized',
      servingSize: '100g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      category: 'Spices and Herbs'
    },
    amount: 5,
    unit: 'g',
    expectedCalories: 0
  },
  {
    name: 'Black Pepper (5g)',
    ingredient: {
      name: 'spices, pepper, black',
      servingSize: '100g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      category: 'Spices and Herbs'
    },
    amount: 5,
    unit: 'g',
    expectedCalories: 0
  }
];

console.log('🧪 Comprehensive Nutrition Scaling Test:\n');

testCases.forEach(testCase => {
  const result = calculateIngredientNutrition(testCase.ingredient, testCase.amount, testCase.unit);
  
  console.log(`📊 ${testCase.name}:`);
  console.log(`   Amount: ${testCase.amount}${testCase.unit}`);
  console.log(`   Base: ${testCase.ingredient.servingSize} = ${testCase.ingredient.calories} cal`);
  console.log(`   Expected: ${testCase.expectedCalories} cal`);
  console.log(`   Calculated: ${result.calories} cal`);
  console.log(`   ✅ ${result.calories === testCase.expectedCalories ? 'CORRECT' : 'WRONG'}`);
  console.log('');
});

console.log('🎯 Summary:');
const correctCount = testCases.filter(testCase => {
  const result = calculateIngredientNutrition(testCase.ingredient, testCase.amount, testCase.unit);
  return result.calories === testCase.expectedCalories;
}).length;

console.log(`${correctCount}/${testCases.length} tests passed`);

if (correctCount === testCases.length) {
  console.log('🎉 All tests passed! Nutrition scaling is working correctly.');
} else {
  console.log('❌ Some tests failed. Check the nutrition calculation logic.');
} 