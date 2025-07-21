import { useState, useMemo } from 'react';
import { scaleRecipeToCalories, scaleRecipeByFactor, getRecipeCalories, ScaledIngredient, ScaledRecipe } from '@/lib/utils/recipeScaling';

interface UseRecipeScalingProps {
  ingredients: ScaledIngredient[];
  servings: number;
  initialCalorieGoal?: number;
}

interface UseRecipeScalingReturn {
  // Current state
  currentIngredients: ScaledIngredient[];
  currentNutrition: ScaledRecipe['nutrition'];
  currentTotalNutrition: ScaledRecipe['totalNutrition'];
  currentCalories: number;
  scalingFactor: number;
  
  // Controls
  setCalorieGoal: (calories: number) => void;
  setScalingFactor: (factor: number) => void;
  resetToOriginal: () => void;
  
  // Info
  originalCalories: number;
  isScaled: boolean;
}

export function useRecipeScaling({
  ingredients,
  servings,
  initialCalorieGoal
}: UseRecipeScalingProps): UseRecipeScalingReturn {
  const [calorieGoal, setCalorieGoalState] = useState<number | null>(initialCalorieGoal || null);
  const [scalingFactor, setScalingFactorState] = useState<number>(1.0);
  
  // Calculate original calories
  const originalCalories = useMemo(() => 
    getRecipeCalories(ingredients, servings), 
    [ingredients, servings]
  );
  
  // Calculate scaled recipe
  const scaledRecipe = useMemo(() => {
    if (calorieGoal) {
      return scaleRecipeToCalories(ingredients, calorieGoal, servings);
    } else if (scalingFactor !== 1.0) {
      return scaleRecipeByFactor(ingredients, scalingFactor, servings);
    } else {
      // No scaling applied
      return {
        ingredients,
        nutrition: {
          calories: originalCalories,
          protein: ingredients.reduce((total, ing) => total + ing.protein, 0) / servings,
          carbs: ingredients.reduce((total, ing) => total + ing.carbs, 0) / servings,
          fat: ingredients.reduce((total, ing) => total + ing.fat, 0) / servings,
          fiber: ingredients.reduce((total, ing) => total + (ing.fiber || 0), 0) / servings,
          sugar: ingredients.reduce((total, ing) => total + (ing.sugar || 0), 0) / servings,
          sodium: ingredients.reduce((total, ing) => total + (ing.sodium || 0), 0) / servings
        },
        totalNutrition: {
          calories: ingredients.reduce((total, ing) => total + ing.calories, 0),
          protein: ingredients.reduce((total, ing) => total + ing.protein, 0),
          carbs: ingredients.reduce((total, ing) => total + ing.carbs, 0),
          fat: ingredients.reduce((total, ing) => total + ing.fat, 0),
          fiber: ingredients.reduce((total, ing) => total + (ing.fiber || 0), 0),
          sugar: ingredients.reduce((total, ing) => total + (ing.sugar || 0), 0),
          sodium: ingredients.reduce((total, ing) => total + (ing.sodium || 0), 0)
        },
        scalingFactor: 1.0
      };
    }
  }, [ingredients, servings, calorieGoal, scalingFactor, originalCalories]);
  
  // Control functions
  const setCalorieGoal = (calories: number) => {
    setCalorieGoalState(calories);
    setScalingFactorState(1.0); // Reset scaling factor when using calorie goal
  };
  
  const setScalingFactor = (factor: number) => {
    setScalingFactorState(factor);
    setCalorieGoalState(null); // Reset calorie goal when using scaling factor
  };
  
  const resetToOriginal = () => {
    setCalorieGoalState(null);
    setScalingFactorState(1.0);
  };
  
  return {
    // Current state
    currentIngredients: scaledRecipe.ingredients,
    currentNutrition: scaledRecipe.nutrition,
    currentTotalNutrition: scaledRecipe.totalNutrition,
    currentCalories: scaledRecipe.nutrition.calories,
    scalingFactor: scaledRecipe.scalingFactor,
    
    // Controls
    setCalorieGoal,
    setScalingFactor,
    resetToOriginal,
    
    // Info
    originalCalories,
    isScaled: calorieGoal !== null || scalingFactor !== 1.0
  };
} 