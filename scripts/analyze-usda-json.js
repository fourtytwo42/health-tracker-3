const fs = require('fs');
const path = require('path');

// Read the USDA JSON file
const usdaDataPath = path.join(__dirname, '../Data/FoodData_Central_foundation_food_json_2025-04-24.json');
const usdaData = JSON.parse(fs.readFileSync(usdaDataPath, 'utf8'));

console.log('USDA Data Analysis');
console.log('==================');

// Check if it's an array or object
console.log('Data type:', Array.isArray(usdaData) ? 'Array' : 'Object');
console.log('Data structure:', Object.keys(usdaData));

// Access the FoundationFoods array
const foundationFoods = usdaData.FoundationFoods;
console.log('FoundationFoods type:', Array.isArray(foundationFoods) ? 'Array' : 'Object');
console.log('Number of foundation foods:', Array.isArray(foundationFoods) ? foundationFoods.length : 'N/A');

if (Array.isArray(foundationFoods)) {
  console.log('\nFirst item structure:');
  const firstItem = foundationFoods[0];
  console.log('Keys:', Object.keys(firstItem));
  
  // Analyze the first item in detail
  console.log('\nDetailed structure of first item:');
  console.log('Description:', firstItem.description);
  console.log('Food Class:', firstItem.foodClass);
  console.log('Data Type:', firstItem.dataType);
  console.log('Food Category:', firstItem.foodCategory);
  console.log('FDC ID:', firstItem.fdcId);
  
  // Analyze nutrients
  if (firstItem.foodNutrients && Array.isArray(firstItem.foodNutrients)) {
    console.log('\nNutrients found:', firstItem.foodNutrients.length);
    console.log('Sample nutrients:');
    firstItem.foodNutrients.slice(0, 10).forEach((nutrient, index) => {
      console.log(`  ${index + 1}. ${nutrient.nutrient.name}: ${nutrient.amount} ${nutrient.nutrient.unitName}`);
    });
  }
  
  // Analyze food portions
  if (firstItem.foodPortions && Array.isArray(firstItem.foodPortions)) {
    console.log('\nFood portions found:', firstItem.foodPortions.length);
    console.log('Sample portions:');
    firstItem.foodPortions.slice(0, 3).forEach((portion, index) => {
      console.log(`  ${index + 1}. ${portion.value} ${portion.measureUnit.name} (${portion.gramWeight}g)`);
    });
  }
  
  // Find common nutrient IDs
  const nutrientIds = new Set();
  const nutrientNames = new Map();
  
  foundationFoods.slice(0, 100).forEach(item => {
    if (item.foodNutrients) {
      item.foodNutrients.forEach(nutrient => {
        nutrientIds.add(nutrient.nutrient.id);
        nutrientNames.set(nutrient.nutrient.id, nutrient.nutrient.name);
      });
    }
  });
  
  console.log('\nCommon nutrient IDs found in first 100 items:');
  console.log('Total unique nutrients:', nutrientIds.size);
  
  // Show some common nutrients
  const commonNutrients = [
    1003, // Protein
    1004, // Total lipid (fat)
    1005, // Carbohydrate, by difference
    1008, // Energy
    1051, // Water
    1087, // Calcium, Ca
    1092, // Potassium, K
    1093, // Sodium, Na
    1253, // Cholesterol
    1258, // Fatty acids, total saturated
    1292, // Fatty acids, total monounsaturated
    1293, // Fatty acids, total polyunsaturated
    1257, // Fatty acids, total trans
  ];
  
  console.log('\nKey nutrients mapping:');
  commonNutrients.forEach(id => {
    const name = nutrientNames.get(id);
    if (name) {
      console.log(`  ${id}: ${name}`);
    }
  });
  
  // Analyze categories
  const categories = new Set();
  foundationFoods.slice(0, 1000).forEach(item => {
    if (item.foodCategory && item.foodCategory.description) {
      categories.add(item.foodCategory.description);
    }
  });
  
  console.log('\nFood categories found:');
  Array.from(categories).sort().forEach(category => {
    console.log(`  - ${category}`);
  });
  
} else {
  console.log('FoundationFoods structure:', Object.keys(foundationFoods));
}

console.log('\nAnalysis complete!'); 