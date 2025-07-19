const fs = require('fs');
const path = require('path');

async function analyzeUSDAFiles() {
  const usdaFiles = [
    'ingredientData/FoodData_Central_branded_food_json_2025-04-24.json',
    'ingredientData/FoodData_Central_foundation_food_json_2025-04-24.json',
    'ingredientData/FoodData_Central_sr_legacy_food_json_2018-04.json'
  ];

  for (const fileName of usdaFiles) {
    console.log(`\n🔍 Analyzing ${fileName}...`);
    
    if (!fs.existsSync(fileName)) {
      console.log(`   File not found: ${fileName}`);
      continue;
    }

    try {
      // Read file in chunks to handle large files
      const fileStream = fs.createReadStream(fileName, { encoding: 'utf8' });
      let data = '';
      
      fileStream.on('data', chunk => {
        data += chunk;
      });
      
      fileStream.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          let foodItems = [];
          if (jsonData.FoundationFoods) {
            foodItems = jsonData.FoundationFoods;
            console.log(`   Foundation Foods: ${foodItems.length} items`);
          } else if (jsonData.SRLegacyFoods) {
            foodItems = jsonData.SRLegacyFoods;
            console.log(`   SR Legacy Foods: ${foodItems.length} items`);
          } else if (jsonData.BrandedFoods) {
            foodItems = jsonData.BrandedFoods;
            console.log(`   Branded Foods: ${foodItems.length} items`);
          }
          
          if (foodItems.length > 0) {
            // Analyze first few items for nutrient structure
            console.log(`   Analyzing first 5 items...`);
            
            for (let i = 0; i < Math.min(5, foodItems.length); i++) {
              const item = foodItems[i];
              console.log(`\n   Item ${i + 1}: ${item.description || item.foodDescription || 'Unknown'}`);
              
              if (item.foodNutrients && Array.isArray(item.foodNutrients)) {
                console.log(`   Nutrients (${item.foodNutrients.length}):`);
                
                // Look for energy-related nutrients
                const energyNutrients = item.foodNutrients.filter(n => 
                  n.nutrient?.id === 1008 || // Energy (kcal)
                  n.nutrient?.id === 1062 || // Energy (kJ)
                  n.nutrient?.name?.toLowerCase().includes('energy') ||
                  n.nutrient?.name?.toLowerCase().includes('calorie')
                );
                
                energyNutrients.forEach(nutrient => {
                  console.log(`     - ${nutrient.nutrient?.name || 'Unknown'}: ${nutrient.amount} ${nutrient.nutrient?.unitName || 'unit'}`);
                });
                
                // Show all nutrient IDs for reference
                const nutrientIds = item.foodNutrients.map(n => n.nutrient?.id).filter(Boolean);
                console.log(`   All nutrient IDs: ${nutrientIds.slice(0, 10).join(', ')}${nutrientIds.length > 10 ? '...' : ''}`);
              }
            }
          }
          
        } catch (parseError) {
          console.error(`   Error parsing JSON: ${parseError.message}`);
        }
      });
      
      fileStream.on('error', (error) => {
        console.error(`   Error reading file: ${error.message}`);
      });
      
    } catch (error) {
      console.error(`   Error processing ${fileName}: ${error.message}`);
    }
  }
}

analyzeUSDAFiles().catch(console.error); 