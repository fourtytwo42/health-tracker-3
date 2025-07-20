const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

async function seedExercises() {
  console.log('Starting exercises seeding...');
  
  const filePath = path.join(__dirname, '..', 'excerciseData', 'met.csv');
  
  if (!fs.existsSync(filePath)) {
    console.error('Exercises file not found:', filePath);
    return;
  }

  try {
    const exercises = [];
    
    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          exercises.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`Found ${exercises.length} exercises to process`);
    
    let processed = 0;
    let created = 0;
    let skipped = 0;
    
    for (const exercise of exercises) {
      try {
        processed++;
        
        if (processed % 100 === 0) {
          console.log(`Processed ${processed}/${exercises.length} exercises...`);
        }
        
        // Skip if no activity category
        if (!exercise.Actvitiy) {
          skipped++;
          continue;
        }
        
        // Use description as activity name, fallback to category if no description
        const activityName = exercise.Description || exercise.Actvitiy;
        
        // Check if exercise already exists by code
        const existing = await prisma.exercise.findFirst({
          where: { code: exercise.Code }
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Parse MET value
        const met = parseFloat(exercise.MET);
        if (isNaN(met)) {
          skipped++;
          continue;
        }
        
        // Determine intensity based on MET value
        let intensity = 'moderate';
        if (met < 3.0) intensity = 'light';
        else if (met >= 6.0) intensity = 'vigorous';
        
        // Create exercise
        const exerciseData = {
          activity: activityName,
          code: exercise.Code || `${exercise.Actvitiy}_${processed}`,
          met: met,
          description: exercise.Description || exercise.Actvitiy,
          category: exercise.Actvitiy,
          intensity: intensity,
          isActive: true
        };
        
        await prisma.exercise.create({
          data: exerciseData
        });
        
        created++;
        
      } catch (error) {
        console.error(`Error processing exercise "${exercise.Description || exercise.Actvitiy}":`, error.message);
        skipped++;
      }
    }
    
    console.log(`Exercises seeding completed!`);
    console.log(`- Processed: ${processed}`);
    console.log(`- Created: ${created}`);
    console.log(`- Skipped: ${skipped}`);
    
  } catch (error) {
    console.error('Error reading or parsing exercises file:', error);
  }
}

async function main() {
  try {
    await seedExercises();
  } catch (error) {
    console.error('Error in main:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedExercises }; 