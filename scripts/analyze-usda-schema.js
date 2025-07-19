const fs = require('fs');
const path = require('path');

function analyzeSchema(obj, path = '', maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return { type: typeof obj, truncated: true };
  }

  if (obj === null) return { type: 'null' };
  if (typeof obj !== 'object') return { type: typeof obj };

  if (Array.isArray(obj)) {
    if (obj.length === 0) return { type: 'array', items: 'empty' };
    
    // Analyze first few items
    const sampleItems = obj.slice(0, 3).map((item, index) => 
      analyzeSchema(item, `${path}[${index}]`, maxDepth, currentDepth + 1)
    );
    
    return {
      type: 'array',
      length: obj.length,
      sampleItems
    };
  }

  const schema = {};
  for (const [key, value] of Object.entries(obj)) {
    schema[key] = analyzeSchema(value, `${path}.${key}`, maxDepth, currentDepth + 1);
  }

  return {
    type: 'object',
    properties: schema
  };
}

function analyzeFile(filePath, description) {
  console.log(`\n🔍 Analyzing: ${description}`);
  console.log(`📁 File: ${path.basename(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found');
    return null;
  }

  try {
    const stats = fs.statSync(filePath);
    console.log(`📊 File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Read first 1MB to analyze structure
    const fileHandle = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(1024 * 1024); // 1MB
    const bytesRead = fs.readSync(fileHandle, buffer, 0, buffer.length, 0);
    fs.closeSync(fileHandle);
    
    const sampleData = buffer.toString('utf8', 0, bytesRead);
    
    // Find the end of the first complete object
    let braceCount = 0;
    let endIndex = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < sampleData.length; i++) {
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
    
    const jsonSample = sampleData.substring(0, endIndex);
    const data = JSON.parse(jsonSample);
    
    console.log('📋 Root structure:');
    console.log(JSON.stringify(data, null, 2));
    
    // Analyze the main array if it exists
    const mainKey = Object.keys(data)[0];
    const mainArray = data[mainKey];
    
    if (Array.isArray(mainArray) && mainArray.length > 0) {
      console.log(`\n📊 Main array key: "${mainKey}"`);
      console.log(`📊 Array length: ${mainArray.length}`);
      
      // Analyze first item
      const firstItem = mainArray[0];
      console.log('\n🔍 First item schema:');
      const schema = analyzeSchema(firstItem, mainKey, 4);
      console.log(JSON.stringify(schema, null, 2));
      
      // Look for foodNutrients specifically
      if (firstItem.foodNutrients && Array.isArray(firstItem.foodNutrients)) {
        console.log('\n🥗 FoodNutrients structure:');
        if (firstItem.foodNutrients.length > 0) {
          const nutrientSchema = analyzeSchema(firstItem.foodNutrients[0], 'foodNutrients[0]', 3);
          console.log(JSON.stringify(nutrientSchema, null, 2));
        }
      }
    }
    
    return data;
    
  } catch (error) {
    console.error(`❌ Error analyzing ${description}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🔍 USDA Schema Analysis Tool');
  console.log('============================');
  
  const files = [
    {
      path: path.join(process.cwd(), 'ingredientData', 'FoodData_Central_foundation_food_json_2025-04-24.json'),
      description: 'Foundation Foods'
    },
    {
      path: path.join(process.cwd(), 'ingredientData', 'FoodData_Central_sr_legacy_food_json_2018-04.json'),
      description: 'SR Legacy Foods'
    },
    {
      path: path.join(process.cwd(), 'ingredientData', 'surveyDownload.json'),
      description: 'Survey Foods'
    },
    {
      path: path.join(process.cwd(), 'ingredientData', 'FoodData_Central_branded_food_json_2025-04-24.json'),
      description: 'Branded Foods'
    }
  ];
  
  const results = {};
  
  for (const file of files) {
    const result = analyzeFile(file.path, file.description);
    results[file.description] = result;
  }
  
  console.log('\n📋 Summary of all file structures:');
  console.log('==================================');
  
  for (const [description, result] of Object.entries(results)) {
    if (result) {
      const mainKey = Object.keys(result)[0];
      console.log(`${description}: ${mainKey} (array)`);
    } else {
      console.log(`${description}: ❌ Failed to analyze`);
    }
  }
  
  // Save results to file
  const outputPath = path.join(process.cwd(), 'scripts', 'usda-schema-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Analysis saved to: ${outputPath}`);
}

main().catch(console.error); 