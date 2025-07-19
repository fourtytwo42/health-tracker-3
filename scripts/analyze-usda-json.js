const fs = require('fs');
const path = require('path');

// Read the first part of the file to analyze structure
const filePath = path.join(process.cwd(), 'Data', 'FoodData_Central_sr_legacy_food_json_2018-04.json');
const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });

let buffer = '';
let lineCount = 0;
const maxLines = 100; // Read first 100 lines to understand structure

fileStream.on('data', (chunk) => {
  buffer += chunk;
  
  // Count lines and stop after maxLines
  const lines = buffer.split('\n');
  lineCount += lines.length - 1;
  
  if (lineCount >= maxLines) {
    fileStream.destroy();
    analyzeStructure(buffer);
  }
});

fileStream.on('end', () => {
  analyzeStructure(buffer);
});

function analyzeStructure(data) {
  console.log('Analyzing USDA JSON structure...\n');
  
  try {
    // Try to parse as JSON
    const jsonData = JSON.parse(data);
    
    console.log('File structure:');
    console.log('Type:', typeof jsonData);
    
    if (Array.isArray(jsonData)) {
      console.log('Array length:', jsonData.length);
      if (jsonData.length > 0) {
        console.log('\nFirst item structure:');
        console.log(JSON.stringify(jsonData[0], null, 2));
        
        console.log('\nAvailable fields in first item:');
        console.log(Object.keys(jsonData[0]));
      }
    } else if (typeof jsonData === 'object') {
      console.log('Object keys:', Object.keys(jsonData));
      if (jsonData.FoundationFoods) {
        console.log('\nFoundationFoods structure:');
        console.log('Type:', typeof jsonData.FoundationFoods);
        if (Array.isArray(jsonData.FoundationFoods)) {
          console.log('Length:', jsonData.FoundationFoods.length);
          if (jsonData.FoundationFoods.length > 0) {
            console.log('\nFirst FoundationFood:');
            console.log(JSON.stringify(jsonData.FoundationFoods[0], null, 2));
          }
        }
      }
    }
    
  } catch (error) {
    console.log('Error parsing JSON:', error.message);
    console.log('\nFirst 1000 characters:');
    console.log(data.substring(0, 1000));
  }
} 