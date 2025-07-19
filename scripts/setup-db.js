const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Health Tracker Database...\n');

try {
  // Step 1: Generate Prisma client
  console.log('📦 Step 1: Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully\n');

  // Step 2: Push database schema
  console.log('🗄️  Step 2: Setting up database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database schema created successfully\n');

  // Step 3: Run complete seeding
  console.log('🌱 Step 3: Running complete database seeding...');
  try {
    execSync('node scripts/seed-complete.js', { stdio: 'inherit' });
    console.log('✅ Complete seeding finished successfully\n');
  } catch (error) {
    console.log('⚠️  Complete seeding failed, trying individual scripts...');
    // Fallback to individual scripts
    execSync('node scripts/seed-modules/seed-users.js', { stdio: 'inherit' });
    execSync('node scripts/seed-modules/seed-settings.js', { stdio: 'inherit' });
    execSync('node scripts/seed-modules/seed-sample-data.js', { stdio: 'inherit' });
    execSync('node scripts/seed-ingredients-simple.js', { stdio: 'inherit' });
    execSync('node scripts/seed-all.js', { stdio: 'inherit' });
    console.log('✅ Individual seeding completed successfully\n');
  }

  console.log('🎉 Database setup completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin: admin/demo');
  console.log('   Demo: demo/demo');
  console.log('   Test: test/test');
  console.log('\n🚀 Start the application with: npm run dev');
  console.log('🌐 Then visit: http://localhost:3001');

} catch (error) {
  console.error('❌ Error during database setup:', error.message);
  console.log('\n💡 Troubleshooting tips:');
  console.log('   1. Make sure you have Node.js installed');
  console.log('   2. Run "npm install" to install dependencies');
  console.log('   3. Check that your .env.local file is configured');
  console.log('   4. Try running individual steps manually');
  process.exit(1);
} 