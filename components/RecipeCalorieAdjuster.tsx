'use client';

import React, { useState, useEffect } from 'react';
import { useRecipeScaling } from '@/hooks/useRecipeScaling';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ScaledIngredient } from '@/lib/utils/recipeScaling';

interface RecipeCalorieAdjusterProps {
  ingredients: ScaledIngredient[];
  servings: number;
  onIngredientsChange?: (ingredients: ScaledIngredient[]) => void;
}

export function RecipeCalorieAdjuster({
  ingredients,
  servings,
  onIngredientsChange
}: RecipeCalorieAdjusterProps) {
  const [calorieGoal, setCalorieGoal] = useState<number>(0);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const { profile } = useUserProfile();
  
  const {
    currentIngredients,
    currentNutrition,
    currentCalories,
    originalCalories,
    isScaled,
    setCalorieGoal: setScalingCalorieGoal,
    resetToOriginal
  } = useRecipeScaling({
    ingredients,
    servings,
    initialCalorieGoal: calorieGoal || undefined
  });
  
  // Note: Server-side scaling is now applied during recipe generation
  // This component is for post-generation adjustments only
  
  const handleCalorieGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGoal = parseInt(e.target.value);
    setCalorieGoal(newGoal);
    if (newGoal > 0) {
      setScalingCalorieGoal(newGoal);
      setIsAdjusting(true);
      onIngredientsChange?.(currentIngredients);
    }
  };
  
  const handleApplyScaling = () => {
    if (calorieGoal > 0) {
      setScalingCalorieGoal(calorieGoal);
      setIsAdjusting(true);
      onIngredientsChange?.(currentIngredients);
    }
  };
  
  const handleReset = () => {
    setCalorieGoal(0);
    resetToOriginal();
    setIsAdjusting(false);
    onIngredientsChange?.(ingredients);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Adjust Recipe Calories (Post-Generation)</h3>
      
      <div className="space-y-4">
        {/* Current Nutrition Display */}
        <div className="bg-gray-50 rounded p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Current Calories:</span>
            <span className={`font-bold ${isScaled ? 'text-blue-600' : 'text-gray-900'}`}>
              {currentCalories} cal per serving
            </span>
          </div>
          {isScaled && (
            <div className="text-sm text-gray-600">
              Original: {originalCalories} cal per serving
            </div>
          )}
        </div>
        
        {/* Calorie Goal Input */}
        <div className="space-y-2">
          <label htmlFor="calorieGoal" className="block text-sm font-medium text-gray-700">
            Additional Calorie Adjustment:
            {profile?.calorieTarget && (
              <span className="text-sm text-gray-500 ml-2">
                (Your goal: {profile.calorieTarget} cal)
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              id="calorieGoal"
              value={calorieGoal || ''}
              onChange={handleCalorieGoalChange}
              placeholder="Enter additional calorie adjustment"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="2000"
            />
            <button
              onClick={handleApplyScaling}
              disabled={!calorieGoal || calorieGoal <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
          {profile?.calorieTarget && !calorieGoal && (
            <button
              onClick={() => {
                setCalorieGoal(profile.calorieTarget!);
                setScalingCalorieGoal(profile.calorieTarget!);
                setIsAdjusting(true);
                onIngredientsChange?.(currentIngredients);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Adjust to my calorie goal ({profile.calorieTarget} cal)
            </button>
          )}
        </div>
        
        {/* Scaling Info */}
        {isScaled && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-blue-800">
                <div>Recipe adjusted to {currentCalories} calories per serving</div>
                {originalCalories > 0 && (
                  <div className="text-xs text-blue-600">
                    {currentCalories > originalCalories ? '+' : ''}{Math.round(((currentCalories - originalCalories) / originalCalories) * 100)}% change from current ({originalCalories} cal)
                  </div>
                )}
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Reset to Current
              </button>
            </div>
          </div>
        )}
        
        {/* Nutrition Summary */}
        {isScaled && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Protein:</span>
              <span className="ml-2 font-medium">{currentNutrition.protein}g</span>
            </div>
            <div>
              <span className="text-gray-600">Carbs:</span>
              <span className="ml-2 font-medium">{currentNutrition.carbs}g</span>
            </div>
            <div>
              <span className="text-gray-600">Fat:</span>
              <span className="ml-2 font-medium">{currentNutrition.fat}g</span>
            </div>
            <div>
              <span className="text-gray-600">Fiber:</span>
              <span className="ml-2 font-medium">{currentNutrition.fiber}g</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 