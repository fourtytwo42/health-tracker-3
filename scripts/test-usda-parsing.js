const fs = require('fs');
const path = require('path');

async function testUSDAParsing() {
  try {
    console.log('🧪 Testing USDA file parsing...\n');
    
    const filePath = path.join(__dirname, '../ingredientData/FoodData_Central_branded_food_json_2025-04-24.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ USDA data file not found:', filePath);
      return;
    }

    console.log('📖 Reading first 5 lines of USDA data file...');
    
    // Read first 5 lines
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    let buffer = '';
    let lineCount = 0;
    const maxLines = 5;
    const lines = [];

    return new Promise((resolve, reject) => {
      fileStream.on('data', (chunk) => {
        buffer += chunk;
        const newLines = buffer.split('\n');
        buffer = newLines.pop(); // Keep incomplete line in buffer
        
        for (const line of newLines) {
          if (line.trim() && lineCount < maxLines) {
            lines.push(line);
            lineCount++;
          }
          if (lineCount >= maxLines) break;
        }
        
        if (lineCount >= maxLines) {
          fileStream.destroy();
        }
      });

      fileStream.on('end', () => {
        console.log(`📊 Found ${lines.length} lines to test\n`);

        lines.forEach((line, index) => {
          try {
            console.log(`\n--- Line ${index + 1} ---`);
            const foodItem = JSON.parse(line);
            
            console.log('Description:', foodItem.description);
            console.log('Serving Size:', foodItem.servingSize, foodItem.servingSizeUnit);
            console.log('Category:', foodItem.brandedFoodCategory);
            console.log('Ingredients:', foodItem.ingredients?.substring(0, 100) + '...');
            
            if (foodItem.foodNutrients && foodItem.foodNutrients.length > 0) {
              console.log('Nutrients (first 3):');
              foodItem.foodNutrients.slice(0, 3).forEach(nutrient => {
                console.log(`  - ${nutrient.nutrient?.name}: ${nutrient.amount} ${nutrient.nutrient?.unitName}`);
              });
            }
            
            if (foodItem.labelNutrients) {
              console.log('Label Nutrients:');
              console.log('  - Calories:', foodItem.labelNutrients.calories?.value);
              console.log('  - Protein:', foodItem.labelNutrients.protein?.value);
              console.log('  - Carbs:', foodItem.labelNutrients.carbohydrates?.value);
              console.log('  - Fat:', foodItem.labelNutrients.fat?.value);
            }
            
          } catch (error) {
            console.error(`❌ Error parsing line ${index + 1}:`, error.message);
          }
        });

        resolve();
      });

      fileStream.on('error', (error) => {
        console.error('❌ Error reading file:', error);
        reject(error);
      });
    });

  } catch (error) {
    console.error('❌ Error testing USDA parsing:', error);
  }
}

// Run the test
testUSDAParsing(); 