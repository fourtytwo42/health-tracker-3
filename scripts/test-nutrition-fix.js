// Test script to verify nutrition scaling fix
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

// Test cases from the user's example
const testCases = [
  {
    name: 'Eggs (120g)',
    ingredient: {
      name: 'eggs, grade a, large, egg white',
      servingSize: '100g',
      calories: 55,
      protein: 10.7,
      carbs: 2.36,
      fat: 0,
      category: 'Dairy'
    },
    amount: 120,
    unit: 'g',
    expectedCalories: 66
  },
  {
    name: 'Ham (100g)',
    ingredient: {
      name: 'ham, sliced, pre-packaged, deli meat (96%fat free, water added)',
      servingSize: '100g',
      calories: 106,
      protein: 16.7,
      carbs: 0.27,
      fat: 3.73,
      category: 'Proteins'
    },
    amount: 100,
    unit: 'g',
    expectedCalories: 106
  },
  {
    name: 'Onions (50g)',
    ingredient: {
      name: 'onions, red, raw',
      servingSize: '100g',
      calories: 44,
      protein: 0.94,
      carbs: 9.93,
      fat: 0.1,
      category: 'Vegetables'
    },
    amount: 50,
    unit: 'g',
    expectedCalories: 22
  },
  {
    name: 'Salt (2g)',
    ingredient: {
      name: 'salt, table, iodized',
      servingSize: '100g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      category: 'Spices and Herbs'
    },
    amount: 2,
    unit: 'g',
    expectedCalories: 0
  },
  {
    name: 'Black Pepper (1g)',
    ingredient: {
      name: 'spices, pepper, black',
      servingSize: '100g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      category: 'Spices and Herbs'
    },
    amount: 1,
    unit: 'g',
    expectedCalories: 0
  }
];

console.log('🧪 Testing Nutrition Scaling Fix:\n');

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