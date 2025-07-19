// Unit conversion utilities for health tracker
// American units for health profiles, metric for ingredients/recipes

export interface UnitConversion {
  value: number;
  unit: string;
  displayValue: string;
}

// Height conversions
export const convertHeightToAmerican = (cm: number): UnitConversion => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  
  return {
    value: cm,
    unit: 'cm',
    displayValue: `${feet}'${inches}"`
  };
};

export const convertHeightToMetric = (feet: number, inches: number): UnitConversion => {
  const totalInches = (feet * 12) + inches;
  const cm = Math.round(totalInches * 2.54);
  
  return {
    value: cm,
    unit: 'cm',
    displayValue: `${cm} cm`
  };
};

// Weight conversions
export const convertWeightToAmerican = (kg: number): UnitConversion => {
  const lbs = Math.round(kg * 2.20462);
  
  return {
    value: kg,
    unit: 'kg',
    displayValue: `${lbs} lbs`
  };
};

export const convertWeightToMetric = (lbs: number): UnitConversion => {
  const kg = Math.round(lbs / 2.20462 * 10) / 10;
  
  return {
    value: kg,
    unit: 'kg',
    displayValue: `${kg} kg`
  };
};

// Volume conversions for recipes
export const convertVolumeToMetric = (cups: number): UnitConversion => {
  const ml = Math.round(cups * 236.588);
  
  return {
    value: ml,
    unit: 'ml',
    displayValue: `${ml} ml`
  };
};

export const convertVolumeToAmerican = (ml: number): UnitConversion => {
  const cups = Math.round(ml / 236.588 * 100) / 100;
  
  return {
    value: ml,
    unit: 'ml',
    displayValue: `${cups} cups`
  };
};

// Temperature conversions
export const convertTempToAmerican = (celsius: number): UnitConversion => {
  const fahrenheit = Math.round((celsius * 9/5) + 32);
  
  return {
    value: celsius,
    unit: '°C',
    displayValue: `${fahrenheit}°F`
  };
};

export const convertTempToMetric = (fahrenheit: number): UnitConversion => {
  const celsius = Math.round((fahrenheit - 32) * 5/9);
  
  return {
    value: celsius,
    unit: '°C',
    displayValue: `${celsius}°C`
  };
};

// BMI calculation with American units
export const calculateBMI = (weightLbs: number, heightFeet: number, heightInches: number): number => {
  const totalInches = (heightFeet * 12) + heightInches;
  const bmi = (weightLbs / (totalInches * totalInches)) * 703;
  return Math.round(bmi * 10) / 10;
};

// BMI calculation with metric units
export const calculateBMIMetric = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
};

// Get BMI category
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

// Format weight for display (American units)
export const formatWeight = (kg: number): string => {
  const lbs = Math.round(kg * 2.20462);
  return `${lbs} lbs`;
};

// Format height for display (American units)
export const formatHeight = (cm: number): string => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
};

// Format volume for recipes (metric)
export const formatVolume = (ml: number): string => {
  if (ml >= 1000) {
    const liters = ml / 1000;
    return `${liters} L`;
  }
  return `${ml} ml`;
};

// Format weight for ingredients (metric)
export const formatIngredientWeight = (grams: number): string => {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg} kg`;
  }
  return `${grams} g`;
}; 