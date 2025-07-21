// Test script to verify nutrition scaling
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

// Test cases
const testCases = [
  {
    name: 'Olive Oil',
    ingredient: {
      name: 'olive oil',
      servingSize: '100ml',
      calories: 900,
      protein: 0,
      carbs: 0,
      fat: 100,
      category: 'Oils and Fats'
    },
    amount: 50.2,
    unit: 'ml'
  },
  {
    name: 'Duck Breast',
    ingredient: {
      name: 'duck, cooked, skin eaten',
      servingSize: '100g',
      calories: 336,
      protein: 18.9,
      carbs: 0,
      fat: 28.2,
      category: 'Proteins'
    },
    amount: 669.6,
    unit: 'g'
  },
  {
    name: 'Black Pepper',
    ingredient: {
      name: 'spices, pepper, black',
      servingSize: '100g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      category: 'Spices and Herbs'
    },
    amount: 8.4,
    unit: 'g'
  }
];

console.log('🧪 Testing Nutrition Scaling Calculations:\n');

testCases.forEach(testCase => {
  const result = calculateIngredientNutrition(testCase.ingredient, testCase.amount, testCase.unit);
  
  console.log(`📊 ${testCase.name}:`);
  console.log(`   Amount: ${testCase.amount}${testCase.unit}`);
  console.log(`   Base: ${testCase.ingredient.servingSize} = ${testCase.ingredient.calories} cal`);
  console.log(`   Calculated: ${result.calories} cal, ${result.protein}g protein, ${result.carbs}g carbs, ${result.fat}g fat`);
  console.log('');
}); 