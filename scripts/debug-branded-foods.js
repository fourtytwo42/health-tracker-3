const fs = require('fs');
const path = require('path');

function debugBrandedFoods() {
  try {
    console.log('🔍 Debugging USDA branded foods file structure...\n');
    
    const filePath = path.join(__dirname, '../ingredientData/FoodData_Central_branded_food_json_2025-04-24.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ USDA branded foods file not found:', filePath);
      return;
    }

    console.log('📖 Reading first 200KB of USDA branded foods file...');
    
    // Read first 200KB
    const fileStream = fs.createReadStream(filePath, { 
      encoding: 'utf8',
      highWaterMark: 1024 * 200 // 200KB
    });

    let buffer = '';
    let firstChunk = true;

    return new Promise((resolve, reject) => {
      fileStream.on('data', (chunk) => {
        if (firstChunk) {
          buffer += chunk;
          firstChunk = false;
          fileStream.destroy(); // Stop after first chunk
        }
      });

      fileStream.on('end', () => {
        console.log(`📊 Read ${buffer.length} characters\n`);
        
        // Look for the first complete JSON object
        console.log('🔍 Finding first complete JSON object...');
        
        const firstBrace = buffer.indexOf('{');
        if (firstBrace === -1) {
          console.log('❌ No opening brace found');
          return;
        }
        
        console.log(`📍 First { found at position ${firstBrace}`);
        
        // Try to find the matching closing brace
        let braceCount = 0;
        let endPos = -1;
        
        for (let i = firstBrace; i < buffer.length; i++) {
          if (buffer[i] === '{') {
            braceCount++;
          } else if (buffer[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endPos = i;
              break;
            }
          }
        }
        
        if (endPos === -1) {
          console.log('❌ Could not find matching closing brace');
          return;
        }
        
        console.log(`📍 Matching } found at position ${endPos}`);
        console.log(`📏 First JSON object length: ${endPos - firstBrace + 1} characters`);
        
        // Extract the first JSON object
        const firstJson = buffer.substring(firstBrace, endPos + 1);
        console.log('\n📝 First JSON object (first 300 chars):');
        console.log(firstJson.substring(0, 300) + '...');
        
        // Try to parse it
        try {
          const parsed = JSON.parse(firstJson);
          console.log('\n✅ Successfully parsed first JSON object!');
          console.log(`📊 Keys: ${Object.keys(parsed).join(', ')}`);
          console.log(`📊 Description: ${parsed.description}`);
          console.log(`📊 Serving Size: ${parsed.servingSize} ${parsed.servingSizeUnit}`);
          console.log(`📊 Brand Owner: ${parsed.brandOwner}`);
          console.log(`📊 Category: ${parsed.brandedFoodCategory}`);
        } catch (error) {
          console.log('\n❌ Failed to parse first JSON object:', error.message);
          
          // Try to find where the JSON breaks
          console.log('\n🔍 Looking for JSON structure issues...');
          const sample = buffer.substring(firstBrace, firstBrace + 500);
          console.log(`📝 Sample: ${sample}...`);
        }
        
        // Look for what comes after the first JSON object
        const afterFirst = buffer.substring(endPos + 1, endPos + 100);
        console.log('\n🔍 What comes after first JSON object:');
        console.log(`"${afterFirst}"`);
        
        // Check if there are more JSON objects
        const nextBrace = buffer.indexOf('{', endPos + 1);
        if (nextBrace !== -1) {
          console.log(`\n📍 Next { found at position ${nextBrace}`);
          console.log(`📏 Gap between objects: ${nextBrace - endPos - 1} characters`);
          
          const gap = buffer.substring(endPos + 1, nextBrace);
          console.log(`📝 Gap content: "${gap}"`);
          
          // Check if the gap contains newlines or other separators
          const gapLines = gap.split('\n');
          console.log(`📊 Gap has ${gapLines.length} lines`);
          gapLines.forEach((line, index) => {
            if (line.trim()) {
              console.log(`  Line ${index + 1}: "${line.trim()}"`);
            }
          });
        }
        
        // Try to find all JSON objects in the buffer
        console.log('\n🔍 Counting JSON objects in buffer...');
        let objectCount = 0;
        let pos = 0;
        
        while (true) {
          const startPos = buffer.indexOf('{', pos);
          if (startPos === -1) break;
          
          let braceCount = 0;
          let endPos = -1;
          
          for (let i = startPos; i < buffer.length; i++) {
            if (buffer[i] === '{') {
              braceCount++;
            } else if (buffer[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                endPos = i;
                break;
              }
            }
          }
          
          if (endPos === -1) break;
          
          objectCount++;
          pos = endPos + 1;
          
          if (objectCount <= 3) {
            console.log(`  Object ${objectCount}: positions ${startPos}-${endPos} (${endPos - startPos + 1} chars)`);
          }
        }
        
        console.log(`📊 Found ${objectCount} complete JSON objects in buffer`);
        
        resolve();
      });

      fileStream.on('error', (error) => {
        console.error('❌ Error reading file:', error);
        reject(error);
      });
    });

  } catch (error) {
    console.error('❌ Error debugging branded foods file:', error);
  }
}

// Run the debugging
debugBrandedFoods(); 