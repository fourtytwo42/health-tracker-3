import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runCommand(command: string, description: string) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ Error during ${description}:`, error);
    throw error;
  }
}

async function setupDatabase() {
  console.log('🚀 Starting complete database setup...\n');

  try {
    // Step 1: Generate Prisma client
    await runCommand('npx prisma generate', 'Generating Prisma client');

    // Step 2: Push schema to database
    await runCommand('npx prisma db push', 'Pushing database schema');

    // Step 3: Run the main seed script
    await runCommand('npx tsx scripts/seed.ts', 'Running main seed script');

    // Step 4: Seed ingredients (if needed)
    console.log('\n🌱 Checking if ingredients need to be seeded...');
    const ingredientCount = await prisma.ingredient.count();
    
    if (ingredientCount === 0) {
      console.log('📦 No ingredients found, seeding basic ingredients...');
      await runCommand('node scripts/seed-ingredients-simple.js', 'Seeding basic ingredients');
    } else {
      console.log(`✅ Found ${ingredientCount} ingredients, skipping ingredient seeding`);
    }

    // Step 5: Seed exercises (if needed)
    console.log('\n🏃 Checking if exercises need to be seeded...');
    const exerciseCount = await prisma.exercise.count();
    
    if (exerciseCount === 0) {
      console.log('📦 No exercises found, seeding exercises...');
      await runCommand('node scripts/seed-exercises.js', 'Seeding exercises');
    } else {
      console.log(`✅ Found ${exerciseCount} exercises, skipping exercise seeding`);
    }

    // Step 6: Verify ingredient mappings
    console.log('\n🔗 Verifying ingredient mappings...');
    const mappingCount = await prisma.ingredientMapping.count();
    console.log(`✅ Found ${mappingCount} ingredient mappings`);

    console.log('\n🎉 Complete database setup finished successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Access the application at: http://localhost:3000');
    console.log('   3. Login with admin credentials: admin/demo');
    console.log('   4. Visit /admin to manage ingredient mappings and other settings');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase(); 