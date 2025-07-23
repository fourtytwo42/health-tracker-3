const { execSync } = require('child_process');
const path = require('path');

async function runSeedScript(scriptPath, description) {
  console.log(`\n🌱 Running: ${description}`);
  console.log('=' .repeat(50));
  
  try {
    const fullPath = path.join(__dirname, scriptPath);
    
    if (scriptPath.endsWith('.ts')) {
      execSync(`npx tsx "${fullPath}"`, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..', '..')
      });
    } else {
      execSync(`node "${fullPath}"`, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..', '..')
      });
    }
    
    console.log(`✅ ${description} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Error running ${description}:`, error.message);
    return false;
  }
}

async function masterSeed() {
  console.log('🚀 Starting Complete Database Seeding Process...\n');
  console.log('This will seed all essential data for the health tracker application.\n');
  
  const startTime = Date.now();
  const results = [];
  
  try {
    // Step 0: Clean AWS and Azure from database
    console.log('🧹 Step 0: Cleaning AWS and Azure LLM Providers...');
    const cleanupSuccess = await runSeedScript('clean-aws-azure.js', 'AWS/Azure Cleanup');
    results.push({ step: 'AWS/Azure Cleanup', success: cleanupSuccess });
    
    // Step 1: Seed nutrition data (foundation foods, survey foods, legacy foods)
    console.log('\n📊 Step 1: Seeding Nutrition Data...');
    const nutritionSuccess = await runSeedScript('seed-foundation-foods.js', 'Foundation Foods');
    results.push({ step: 'Foundation Foods', success: nutritionSuccess });
    
    const surveySuccess = await runSeedScript('seed-survey-foods.js', 'Survey Foods');
    results.push({ step: 'Survey Foods', success: surveySuccess });
    
    const legacySuccess = await runSeedScript('seed-legacy-foods.js', 'Legacy Foods');
    results.push({ step: 'Legacy Foods', success: legacySuccess });
    
    // Step 2: Seed exercises
    console.log('\n🏋️‍♂️ Step 2: Seeding Exercise Data...');
    const exercisesSuccess = await runSeedScript('seed-exercises.js', 'Exercises from MET.csv');
    results.push({ step: 'Exercises', success: exercisesSuccess });
    
    // Step 3: Seed system messages and LLM configuration
    console.log('\n🤖 Step 3: Seeding AI System Configuration...');
    const systemMessagesSuccess = await runSeedScript('seed-system-messages.ts', 'System Messages');
    results.push({ step: 'System Messages', success: systemMessagesSuccess });
    
    const llmProvidersSuccess = await runSeedScript('seed-llm-providers.ts', 'LLM Providers');
    results.push({ step: 'LLM Providers', success: llmProvidersSuccess });
    
    const llmSettingsSuccess = await runSeedScript('seed-llm-settings.ts', 'LLM Settings');
    results.push({ step: 'LLM Settings', success: llmSettingsSuccess });
    
    const workoutSystemSuccess = await runSeedScript('seed-workout-system-message.js', 'Workout System Message');
    results.push({ step: 'Workout System Message', success: workoutSystemSuccess });
    
    // Step 4: Seed ingredient mappings
    console.log('\n🔗 Step 4: Seeding Ingredient Mappings...');
    const mappingsSuccess = await runSeedScript('seed-ingredient-mappings.ts', 'Ingredient Mappings');
    results.push({ step: 'Ingredient Mappings', success: mappingsSuccess });
    
    // Step 5: Seed users and sample data
    console.log('\n👥 Step 5: Seeding Users and Sample Data...');
    const usersSuccess = await runSeedScript('seed-modules/seed-users.js', 'Sample Users');
    results.push({ step: 'Sample Users', success: usersSuccess });
    
    const settingsSuccess = await runSeedScript('seed-modules/seed-settings.js', 'User Settings');
    results.push({ step: 'User Settings', success: settingsSuccess });
    
    const sampleDataSuccess = await runSeedScript('seed-modules/seed-sample-data.js', 'Sample Data');
    results.push({ step: 'Sample Data', success: sampleDataSuccess });
    
    // Summary
    const totalTime = (Date.now() - startTime) / 1000;
    const successfulSteps = results.filter(r => r.success).length;
    const totalSteps = results.length;
    
    console.log('\n🎉 Master Seeding Process Completed!');
    console.log('=' .repeat(60));
    console.log(`📊 Summary:`);
    console.log(`  - Total Steps: ${totalSteps}`);
    console.log(`  - Successful: ${successfulSteps}`);
    console.log(`  - Failed: ${totalSteps - successfulSteps}`);
    console.log(`  - Total Time: ${totalTime.toFixed(1)} seconds`);
    
    console.log('\n📋 Step Results:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.step}`);
    });
    
    if (successfulSteps === totalSteps) {
      console.log('\n🎉 All seeding steps completed successfully!');
      console.log('✅ Database is now fully populated and ready for use.');
      console.log('\n🚀 You can now:');
      console.log('  - Start the development server: npm run dev');
      console.log('  - Login with sample users (admin, demo, test)');
      console.log('  - Test the workout generation system');
      console.log('  - Explore the nutrition database');
    } else {
      console.log('\n⚠️  Some seeding steps failed. Please check the errors above.');
      console.log('You may need to run individual seed scripts to fix specific issues.');
    }
    
  } catch (error) {
    console.error('❌ Critical error during master seeding:', error);
    process.exit(1);
  }
}

// Run the master seeding
masterSeed(); 