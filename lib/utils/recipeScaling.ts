/**
 * Utility functions for scaling recipes on the frontend
 */

export interface ScaledIngredient {
  name: string;
  amount: number;
  unit: string;
  originalAmount: number;
  scalingFactor: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  isSpice?: boolean;
  category?: string;
  aisle?: string;
  servingSize?: string;
}

export interface ScaledRecipe {
  ingredients: ScaledIngredient[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  scalingFactor: number;
}

/**
 * Scale a recipe to match a target calorie goal
 * @param ingredients - Array of recipe ingredients
 * @param targetCalories - Target calories per serving
 * @param servings - Number of servings
 * @returns Scaled recipe with adjusted ingredient amounts and nutrition
 */
export function scaleRecipeToCalories(
  ingredients: ScaledIngredient[],
  targetCalories: number,
  servings: number
): ScaledRecipe {
  // Calculate current total calories
  const currentTotalCalories = ingredients.reduce((total, ing) => total + ing.calories, 0);
  const currentPerServingCalories = currentTotalCalories / servings;
  
  // Calculate scaling factor
  const scalingFactor = targetCalories / currentPerServingCalories;
  
  // Scale ingredients (limit spices to prevent excessive amounts)
  const scaledIngredients = ingredients.map(ing => {
    const isSpice = ing.isSpice || 
                   ing.category === 'Spices and Herbs' ||
                   ing.name.toLowerCase().includes('salt') ||
                   ing.name.toLowerCase().includes('pepper') ||
                   ing.name.toLowerCase().includes('vanilla') ||
                   ing.name.toLowerCase().includes('extract') ||
                   ing.name.toLowerCase().includes('chili') ||
                   ing.name.toLowerCase().includes('spices');
    
    let ingredientScalingFactor = scalingFactor;
    
    // Limit scaling for spices and seasonings to prevent excessive amounts
    if (isSpice) {
      ingredientScalingFactor = Math.min(scalingFactor, 2.0);
    }
    
    const scaledAmount = Math.round(ing.amount * ingredientScalingFactor * 10) / 10;
    
    return {
      ...ing,
      amount: scaledAmount,
      originalAmount: ing.amount,
      scalingFactor: ingredientScalingFactor,
      calories: Math.round(ing.calories * ingredientScalingFactor),
      protein: Math.round(ing.protein * ingredientScalingFactor * 10) / 10,
      carbs: Math.round(ing.carbs * ingredientScalingFactor * 10) / 10,
      fat: Math.round(ing.fat * ingredientScalingFactor * 10) / 10,
      fiber: ing.fiber ? Math.round(ing.fiber * ingredientScalingFactor * 10) / 10 : undefined,
      sugar: ing.sugar ? Math.round(ing.sugar * ingredientScalingFactor * 10) / 10 : undefined,
      sodium: ing.sodium ? Math.round(ing.sodium * ingredientScalingFactor) : undefined
    };
  });
  
  // Calculate new nutrition totals
  const totalNutrition = scaledIngredients.reduce((total, ing) => ({
    calories: total.calories + ing.calories,
    protein: total.protein + ing.protein,
    carbs: total.carbs + ing.carbs,
    fat: total.fat + ing.fat,
    fiber: total.fiber + (ing.fiber || 0),
    sugar: total.sugar + (ing.sugar || 0),
    sodium: total.sodium + (ing.sodium || 0)
  }), {
    calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0
  });
  
  const perServingNutrition = {
    calories: Math.round(totalNutrition.calories / servings),
    protein: Math.round(totalNutrition.protein / servings * 10) / 10,
    carbs: Math.round(totalNutrition.carbs / servings * 10) / 10,
    fat: Math.round(totalNutrition.fat / servings * 10) / 10,
    fiber: Math.round(totalNutrition.fiber / servings * 10) / 10,
    sugar: Math.round(totalNutrition.sugar / servings * 10) / 10,
    sodium: Math.round(totalNutrition.sodium / servings)
  };
  
  return {
    ingredients: scaledIngredients,
    nutrition: perServingNutrition,
    totalNutrition,
    scalingFactor
  };
}

/**
 * Scale a recipe by a specific factor
 * @param ingredients - Array of recipe ingredients
 * @param scalingFactor - Factor to scale by (e.g., 1.5 for 50% increase)
 * @param servings - Number of servings
 * @returns Scaled recipe
 */
export function scaleRecipeByFactor(
  ingredients: ScaledIngredient[],
  scalingFactor: number,
  servings: number
): ScaledRecipe {
  return scaleRecipeToCalories(
    ingredients,
    ingredients.reduce((total, ing) => total + ing.calories, 0) / servings * scalingFactor,
    servings
  );
}

/**
 * Get the current calorie count for a recipe
 * @param ingredients - Array of recipe ingredients
 * @param servings - Number of servings
 * @returns Calories per serving
 */
export function getRecipeCalories(
  ingredients: ScaledIngredient[],
  servings: number
): number {
  const totalCalories = ingredients.reduce((total, ing) => total + ing.calories, 0);
  return Math.round(totalCalories / servings);
} 