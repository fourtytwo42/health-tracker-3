const fs = require('fs');
const path = require('path');

function testUsdaFile(filePath, fileType) {
  console.log(`\n📁 Testing ${fileType}: ${path.basename(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  try {
    const stats = fs.statSync(filePath);
    console.log(`📊 File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Read first 5MB to analyze structure
    const sampleSize = Math.min(5 * 1024 * 1024, stats.size);
    const fileHandle = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(sampleSize);
    const bytesRead = fs.readSync(fileHandle, buffer, 0, sampleSize, 0);
    fs.closeSync(fileHandle);
    
    const sampleData = buffer.toString('utf8', 0, bytesRead);
    
    // Find the main array key
    let mainKey = null;
    if (sampleData.includes('"FoundationFoods"')) {
      mainKey = 'FoundationFoods';
    } else if (sampleData.includes('"SRLegacyFoods"')) {
      mainKey = 'SRLegacyFoods';
    } else if (sampleData.includes('"SurveyFoods"')) {
      mainKey = 'SurveyFoods';
    } else if (sampleData.includes('"BrandedFoods"')) {
      mainKey = 'BrandedFoods';
    }
    
    if (!mainKey) {
      console.log(`❌ Could not determine main array key for ${fileType}`);
      return;
    }
    
    console.log(`📋 Main array key: ${mainKey}`);
    
    // Find the start of the array
    const arrayStart = sampleData.indexOf(`"${mainKey}": [`);
    if (arrayStart === -1) {
      console.log(`❌ Could not find ${mainKey} array start`);
      return;
    }
    
    console.log(`📍 Array starts at position: ${arrayStart}`);
    
    // Look for the first food object
    const firstObjectStart = sampleData.indexOf('{"foodClass"', arrayStart);
    if (firstObjectStart === -1) {
      console.log(`❌ Could not find first food object`);
      return;
    }
    
    console.log(`📍 First food object starts at position: ${firstObjectStart}`);
    
    // Extract the first complete food object
    let braceCount = 0;
    let endIndex = firstObjectStart;
    let inString = false;
    let escapeNext = false;
    
    for (let i = firstObjectStart; i < sampleData.length; i++) {
      const char = sampleData[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
    }
    
    if (braceCount === 0) {
      const firstObjectJson = sampleData.substring(firstObjectStart, endIndex);
      console.log(`✅ Found first food object (${endIndex - firstObjectStart} characters)`);
      
      try {
        const food = JSON.parse(firstObjectJson);
        console.log(`📋 Food object structure:`);
        console.log(`   - foodClass: ${food.foodClass}`);
        console.log(`   - description: ${food.description?.substring(0, 50)}...`);
        console.log(`   - foodNutrients: ${food.foodNutrients?.length || 0} nutrients`);
        console.log(`   - fdcId: ${food.fdcId}`);
        console.log(`   - foodCategory: ${food.foodCategory?.description || 'N/A'}`);
        
        // Show first few nutrients
        if (food.foodNutrients && food.foodNutrients.length > 0) {
          console.log(`🥗 First 3 nutrients:`);
          for (let i = 0; i < Math.min(3, food.foodNutrients.length); i++) {
            const nutrient = food.foodNutrients[i];
            const nutrientName = nutrient.nutrient?.name || 'Unknown';
            const amount = nutrient.amount || nutrient.value || 'N/A';
            console.log(`   - ${nutrientName}: ${amount}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error parsing first food object:`, error.message);
      }
    } else {
      console.log(`❌ Could not find complete first food object`);
    }
    
  } catch (error) {
    console.error(`❌ Error testing ${fileType}:`, error.message);
  }
}

async function main() {
  console.log('🔍 Testing USDA File Parsing');
  console.log('============================');
  
  const files = [
    {
      path: path.join(process.cwd(), 'ingredientData', 'FoodData_Central_foundation_food_json_2025-04-24.json'),
      type: 'foundation'
    },
    {
      path: path.join(process.cwd(), 'ingredientData', 'FoodData_Central_sr_legacy_food_json_2018-04.json'),
      type: 'legacy'
    },
    {
      path: path.join(process.cwd(), 'ingredientData', 'surveyDownload.json'),
      type: 'survey'
    },
    {
      path: path.join(process.cwd(), 'ingredientData', 'FoodData_Central_branded_food_json_2025-04-24.json'),
      type: 'branded'
    }
  ];
  
  for (const file of files) {
    testUsdaFile(file.path, file.type);
  }
}

main().catch(console.error); 