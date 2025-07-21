'use client';

import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Paper,
} from '@mui/material';

interface NutritionLabelProps {
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  totalFat?: number;
  className?: string;
}

export default function NutritionLabel({
  servings,
  calories,
  protein,
  carbs,
  fat,
  fiber = 0,
  sugar = 0,
  sodium = 0,
  saturatedFat = 0,
  transFat = 0,
  cholesterol = 0,
  totalFat = fat,
  className,
}: NutritionLabelProps) {
  // Calculate total values
  const totalCalories = calories * servings;
  const totalProtein = protein * servings;
  const totalCarbs = carbs * servings;
  const totalFatValue = totalFat * servings;
  const totalFiber = fiber * servings;
  const totalSugar = sugar * servings;
  const totalSodium = sodium * servings;
  const totalSaturatedFat = saturatedFat * servings;
  const totalTransFat = transFat * servings;
  const totalCholesterol = cholesterol * servings;

  const nutritionRow = (label: string, perServing: number, total: number, unit: string = 'g') => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant="body2" sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right', minWidth: 60 }}>
        {perServing}{unit}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right', minWidth: 60 }}>
        {total}{unit}
      </Typography>
    </Box>
  );

  const nutritionRowCalories = (label: string, perServing: number, total: number) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant="body2" sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right', minWidth: 60 }}>
        {perServing}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right', minWidth: 60 }}>
        {total}
      </Typography>
    </Box>
  );

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        border: '2px solid #000',
        borderRadius: 1,
        maxWidth: 300,
        fontFamily: 'monospace',
      }}
      className={className}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
          Nutrition Facts
        </Typography>
      </Box>

      <Divider sx={{ borderWidth: 2, mb: 1 }} />

      {/* Servings */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          Servings per recipe: {servings}
        </Typography>
      </Box>

      <Divider sx={{ borderWidth: 2, mb: 1 }} />

      {/* Calories */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Amount per serving
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Total
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Calories
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {totalCalories}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
          {calories} calories per serving
        </Typography>
      </Box>

      <Divider sx={{ borderWidth: 2, mb: 1 }} />

      {/* Daily Value Note */}
      <Typography variant="caption" sx={{ fontStyle: 'italic', mb: 1, display: 'block' }}>
        * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
      </Typography>

      {/* Total Fat */}
      {totalFatValue > 0 && nutritionRow('Total Fat', totalFat, totalFatValue)}

      {/* Saturated Fat */}
      {totalSaturatedFat > 0 && (
        <Box sx={{ pl: 2 }}>
          {nutritionRow('  Saturated Fat', totalSaturatedFat, totalSaturatedFat)}
        </Box>
      )}

      {/* Trans Fat */}
      {totalTransFat > 0 && (
        <Box sx={{ pl: 2 }}>
          {nutritionRow('  Trans Fat', totalTransFat, totalTransFat)}
        </Box>
      )}

      {/* Cholesterol */}
      {totalCholesterol > 0 && nutritionRow('Cholesterol', totalCholesterol, totalCholesterol, 'mg')}

      {/* Sodium */}
      {totalSodium > 0 && nutritionRow('Sodium', totalSodium, totalSodium, 'mg')}

      {/* Total Carbohydrates */}
      {totalCarbs > 0 && nutritionRow('Total Carbohydrate', totalCarbs, totalCarbs)}

      {/* Dietary Fiber */}
      {totalFiber > 0 && (
        <Box sx={{ pl: 2 }}>
          {nutritionRow('  Dietary Fiber', totalFiber, totalFiber)}
        </Box>
      )}

      {/* Total Sugars */}
      {totalSugar > 0 && (
        <Box sx={{ pl: 2 }}>
          {nutritionRow('  Total Sugars', totalSugar, totalSugar)}
        </Box>
      )}

      {/* Protein */}
      {totalProtein > 0 && nutritionRow('Protein', totalProtein, totalProtein)}

      {/* Macronutrient Breakdown */}
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Macronutrients per serving:
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          Protein: {protein}g ({Math.round((protein * 4 / calories) * 100)}% of calories)
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          Carbs: {carbs}g ({Math.round((carbs * 4 / calories) * 100)}% of calories)
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          Fat: {totalFat}g ({Math.round((totalFat * 9 / calories) * 100)}% of calories)
        </Typography>
      </Box>


    </Paper>
  );
} 