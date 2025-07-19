const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import quick seeding function
const { seedQuick } = require('./seed-quick.js');

async function runSeedingStep(stepName, stepFunction) {
  console.log(`\n🔄 Running: ${stepName}`);
  try {
    await stepFunction();
    console.log(`✅ Completed: ${stepName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${stepName}`, error.message);
    return false;
  }
}

async function runExternalScript(scriptName, description) {
  console.log(`\n🔄 Running: ${description}`);
  try {
    execSync(`node scripts/${scriptName}`, { stdio: 'inherit' });
    console.log(`✅ Completed: ${description}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${description}`, error.message);
    return false;
  }
}

async function seedComplete() {
  console.log('🚀 Starting Complete Database Seeding...\n');
  
  try {
    // Use the quick seeding approach
    await seedQuick();
    
    console.log('\n🎉 Complete seeding finished successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@demo.com / demo');
    console.log('   Demo: demo@demo.com / demo');
    console.log('   Test: test@test.com / test');
    console.log('\n🚀 You can now start the application and test all features!');
    console.log('   npm run dev');
    console.log('   Then visit: http://localhost:3001');
    
  } catch (error) {
    console.log('\n⚠️  Seeding failed. Check the errors above.');
    console.log('💡 You can also try the portable database approach:');
    console.log('   node scripts/create-portable-db.js');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedComplete()
    .then(() => {
      console.log('\n✨ Seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error during seeding:', error);
      process.exit(1);
    });
}

module.exports = { seedComplete }; 