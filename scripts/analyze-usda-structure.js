const fs = require('fs');
const path = require('path');

async function analyzeUSDAStructure() {
  try {
    console.log('🔍 Analyzing USDA file structure...\n');
    
    const filePath = path.join(__dirname, '../ingredientData/FoodData_Central_branded_food_json_2025-04-24.json');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ USDA data file not found:', filePath);
      return;
    }

    console.log('📖 Reading first 100KB of USDA data file...');
    
    // Read first 100KB to analyze structure
    const fileStream = fs.createReadStream(filePath, { 
      encoding: 'utf8',
      highWaterMark: 1024 * 100 // 100KB
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
        
        // Analyze the structure
        console.log('🔍 File Structure Analysis:');
        console.log('=' .repeat(50));
        
        // Check if it starts with [
        if (buffer.trim().startsWith('[')) {
          console.log('✅ File appears to be a JSON array');
          console.log('📝 Format: JSON array of objects');
        } else if (buffer.trim().startsWith('{')) {
          console.log('✅ File appears to be a JSON object');
          console.log('📝 Format: Single JSON object');
        } else {
          console.log('❓ File format unclear');
        }
        
        // Look for line breaks and JSON structure
        const lines = buffer.split('\n');
        console.log(`📊 First ${Math.min(lines.length, 5)} lines:`);
        lines.slice(0, 5).forEach((line, index) => {
          const trimmed = line.trim();
          console.log(`Line ${index + 1}: ${trimmed.substring(0, 100)}${trimmed.length > 100 ? '...' : ''}`);
        });
        
        // Try to find JSON boundaries
        console.log('\n🔍 JSON Structure Detection:');
        
        // Look for opening bracket
        const openBracketIndex = buffer.indexOf('[');
        const openBraceIndex = buffer.indexOf('{');
        
        if (openBracketIndex !== -1) {
          console.log(`✅ Found opening bracket [ at position ${openBracketIndex}`);
        }
        
        if (openBraceIndex !== -1) {
          console.log(`✅ Found opening brace { at position ${openBraceIndex}`);
        }
        
        // Look for closing bracket
        const closeBracketIndex = buffer.lastIndexOf(']');
        const closeBraceIndex = buffer.lastIndexOf('}');
        
        if (closeBracketIndex !== -1) {
          console.log(`✅ Found closing bracket ] at position ${closeBracketIndex}`);
        }
        
        if (closeBraceIndex !== -1) {
          console.log(`✅ Found closing brace } at position ${closeBraceIndex}`);
        }
        
        // Try to parse as JSON array
        console.log('\n🧪 Testing JSON parsing...');
        try {
          const jsonData = JSON.parse(buffer);
          console.log('✅ Successfully parsed as JSON!');
          console.log(`📊 Type: ${Array.isArray(jsonData) ? 'Array' : 'Object'}`);
          if (Array.isArray(jsonData)) {
            console.log(`📊 Array length: ${jsonData.length}`);
            if (jsonData.length > 0) {
              console.log(`📊 First item keys: ${Object.keys(jsonData[0]).join(', ')}`);
            }
          }
        } catch (error) {
          console.log('❌ Failed to parse as JSON:', error.message);
          
          // Try to find where the JSON breaks
          console.log('\n🔍 Looking for JSON structure issues...');
          const firstBrace = buffer.indexOf('{');
          if (firstBrace !== -1) {
            console.log(`📍 First { found at position ${firstBrace}`);
            const sample = buffer.substring(firstBrace, firstBrace + 200);
            console.log(`📝 Sample: ${sample}...`);
          }
        }
        
        resolve();
      });

      fileStream.on('error', (error) => {
        console.error('❌ Error reading file:', error);
        reject(error);
      });
    });

  } catch (error) {
    console.error('❌ Error analyzing USDA structure:', error);
  }
}

// Run the analysis
analyzeUSDAStructure(); 