const fs = require('fs');
const path = require('path');

// Read the USDA JSON file
const usdaDataPath = path.join(__dirname, '../Data/FoodData_Central_foundation_food_json_2025-04-24.json');
const usdaData = JSON.parse(fs.readFileSync(usdaDataPath, 'utf8'));
const foundationFoods = usdaData.FoundationFoods;

console.log('USDA Data Filtering Analysis');
console.log('============================');
console.log(`Total foundation foods: ${foundationFoods.length}`);

// Analyze the first 20 items to see what's happening
console.log('\nAnalyzing first 20 items:');
console.log('========================');

let processed = 0;
let skipped = 0;
let skippedReasons = {};

for (let i = 0; i < Math.min(20, foundationFoods.length); i++) {
  const usdaFood = foundationFoods[i];
  console.log(`\n${i + 1}. ${usdaFood.description}`);
  
  // Check if it has nutrients
  const foodNutrients = usdaFood.foodNutrients || [];
  console.log(`   Nutrients count: ${foodNutrients.length}`);
  
  // Check for calories
  const calories = foodNutrients.find(n => n.nutrient.id === 1008);
  console.log(`   Calories: ${calories ? calories.amount : 'NOT FOUND'}`);
  
  // Check for protein
  const protein = foodNutrients.find(n => n.nutrient.id === 1003);
  console.log(`   Protein: ${protein ? protein.amount : 'NOT FOUND'}`);
  
  // Check for fat
  const fat = foodNutrients.find(n => n.nutrient.id === 1004);
  console.log(`   Fat: ${fat ? fat.amount : 'NOT FOUND'}`);
  
  // Check for carbs
  const carbs = foodNutrients.find(n => n.nutrient.id === 1005);
  console.log(`   Carbs: ${carbs ? carbs.amount : 'NOT FOUND'}`);
  
  // Check if it would be skipped
  if (!usdaFood.description) {
    console.log(`   ❌ WOULD SKIP: No name`);
    skippedReasons['No name'] = (skippedReasons['No name'] || 0) + 1;
    skipped++;
  } else if (!calories || calories.amount === 0) {
    console.log(`   ❌ WOULD SKIP: No calories or 0 calories`);
    skippedReasons['No calories or 0 calories'] = (skippedReasons['No calories or 0 calories'] || 0) + 1;
    skipped++;
  } else {
    console.log(`   ✅ WOULD PROCESS`);
    processed++;
  }
}

console.log(`\nSummary of first 20:`);
console.log(`- Would process: ${processed}`);
console.log(`- Would skip: ${skipped}`);

// Now analyze all items to get statistics
console.log('\nAnalyzing all items for skip reasons:');
console.log('=====================================');

let totalProcessed = 0;
let totalSkipped = 0;
let totalSkippedReasons = {};

for (const usdaFood of foundationFoods) {
  const foodNutrients = usdaFood.foodNutrients || [];
  const calories = foodNutrients.find(n => n.nutrient.id === 1008);
  
  if (!usdaFood.description) {
    totalSkippedReasons['No name'] = (totalSkippedReasons['No name'] || 0) + 1;
    totalSkipped++;
  } else if (!calories || calories.amount === 0) {
    totalSkippedReasons['No calories or 0 calories'] = (totalSkippedReasons['No calories or 0 calories'] || 0) + 1;
    totalSkipped++;
  } else {
    totalProcessed++;
  }
}

console.log(`\nTotal analysis:`);
console.log(`- Would process: ${totalProcessed}`);
console.log(`- Would skip: ${totalSkipped}`);
console.log(`- Skip reasons:`);
Object.entries(totalSkippedReasons).forEach(([reason, count]) => {
  console.log(`  ${reason}: ${count}`);
});

// Show some examples of items with 0 calories
console.log('\nExamples of items with 0 calories:');
console.log('===================================');
let examplesShown = 0;
for (const usdaFood of foundationFoods) {
  if (examplesShown >= 5) break;
  
  const foodNutrients = usdaFood.foodNutrients || [];
  const calories = foodNutrients.find(n => n.nutrient.id === 1008);
  
  if (calories && calories.amount === 0) {
    console.log(`- ${usdaFood.description}`);
    console.log(`  Category: ${usdaFood.foodCategory?.description || 'Unknown'}`);
    console.log(`  Food Class: ${usdaFood.foodClass}`);
    examplesShown++;
  }
}

// Show some examples of items with missing calories
console.log('\nExamples of items with missing calories:');
console.log('=========================================');
examplesShown = 0;
for (const usdaFood of foundationFoods) {
  if (examplesShown >= 5) break;
  
  const foodNutrients = usdaFood.foodNutrients || [];
  const calories = foodNutrients.find(n => n.nutrient.id === 1008);
  
  if (!calories) {
    console.log(`- ${usdaFood.description}`);
    console.log(`  Category: ${usdaFood.foodCategory?.description || 'Unknown'}`);
    console.log(`  Food Class: ${usdaFood.foodClass}`);
    console.log(`  Available nutrients: ${foodNutrients.length}`);
    examplesShown++;
  }
} 