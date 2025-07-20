const { seedFoundationFoods } = require('./seed-foundation-foods');
const { seedSurveyFoods } = require('./seed-survey-foods');
const { seedLegacyFoods } = require('./seed-legacy-foods');
const { seedExercises } = require('./seed-exercises');

async function seedAllData() {
  console.log('=== Starting Complete Data Seeding Process ===\n');
  
  try {
    // Seed Foundation Foods (smallest file first)
    console.log('1. Seeding Foundation Foods...');
    await seedFoundationFoods();
    console.log('✓ Foundation Foods completed\n');
    
    // Seed Survey Foods
    console.log('2. Seeding Survey Foods...');
    await seedSurveyFoods();
    console.log('✓ Survey Foods completed\n');
    
    // Seed Legacy Foods
    console.log('3. Seeding Legacy Foods...');
    await seedLegacyFoods();
    console.log('✓ Legacy Foods completed\n');
    
    // Seed Exercises
    console.log('4. Seeding Exercises...');
    await seedExercises();
    console.log('✓ Exercises completed\n');
    
    console.log('=== All Data Seeding Completed Successfully! ===');
    console.log('\nSummary:');
    console.log('- Foundation Foods: USDA foundation foods data');
    console.log('- Survey Foods: USDA survey foods data');
    console.log('- Legacy Foods: USDA legacy foods data');
    console.log('- Exercises: MET values for various activities');
    console.log('\nNote: The 3.3GB branded foods file was skipped as requested.');
    console.log('You can run it separately if needed.');
    
  } catch (error) {
    console.error('Error during data seeding:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedAllData();
}

module.exports = { seedAllData }; 