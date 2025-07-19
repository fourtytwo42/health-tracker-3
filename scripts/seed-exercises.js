const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedExercises() {
  console.log('Starting Exercise seeding...');
  
  const filePath = path.join(process.cwd(), 'excerciseData', 'met.csv');
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read and parse the CSV file
    console.log('Reading exercise data file...');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} exercises to process`);
    
    // Clear existing exercises first
    console.log('Clearing existing exercises...');
    await prisma.exercise.deleteMany({});
    
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const record of records) {
      try {
        // Extract data from CSV record
        const activity = record.Activity || record.Actvitiy || 'Unknown Exercise';
        const code = record.Code || `EX${processed + 1}`;
        const met = parseFloat(record.MET) || 1.0;
        const description = record.Description || activity;
        const category = record.Category || 'General';
        const intensity = record.Intensity || 'MODERATE';
        
        // Validate required fields
        if (!activity || activity.trim() === '') {
          skipped++;
          continue;
        }
        
        // Create exercise object
        const exercise = {
          activity: activity.trim(),
          code: code.trim(),
          met: met,
          description: description.trim(),
          category: category.trim(),
          intensity: intensity.toUpperCase(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Insert exercise
        await prisma.exercise.create({
          data: exercise
        });
        
        processed++;
        
        if (processed % 100 === 0) {
          console.log(`Processed ${processed}/${records.length} exercises (${Math.round(processed/records.length*100)}%)`);
        }
        
      } catch (error) {
        if (error.code === 'P2002') {
          // Duplicate code, skip
          skipped++;
        } else {
          console.error(`Error processing exercise ${record.Code}:`, error.message);
          errors++;
        }
      }
    }
    
    console.log(`\nSeeding complete!`);
    console.log(`- Processed: ${processed} exercises`);
    console.log(`- Skipped: ${skipped} exercises`);
    console.log(`- Errors: ${errors} exercises`);
    
    // Get final count
    const totalCount = await prisma.exercise.count();
    console.log(`- Total exercises in database: ${totalCount}`);
    
  } catch (error) {
    console.error('Error seeding exercise data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedExercises()
    .then(() => {
      console.log('Exercise seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedExercises }; 