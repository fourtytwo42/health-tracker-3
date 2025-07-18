const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Function to detect and seed USDA data files
async function seedUsdaDataFiles() {
  const dataDir = path.join(__dirname, '../Data');
  
  if (!fs.existsSync(dataDir)) {
    console.log('Data directory not found, skipping USDA data seeding');
    return;
  }
  
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('No JSON files found in Data directory');
    return;
  }
  
  console.log(`Found ${files.length} JSON file(s) in Data directory:`);
  files.forEach(file => console.log(`  - ${file}`));
  
  for (const file of files) {
    console.log(`\n=== Processing ${file} ===`);
    await processUsdaFile(path.join(dataDir, file));
  }
}

async function processUsdaFile(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Handle different USDA data formats
    if (data.FoundationFoods) {
      await seedFoundationFoods(data.FoundationFoods, path.basename(filePath));
    } else if (Array.isArray(data)) {
      await seedFoundationFoods(data, path.basename(filePath));
    } else {
      console.log(`Unknown data format in ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${path.basename(filePath)}:`, error.message);
  }
}

async function seedFoundationFoods(foundationFoods, sourceFile) {
  console.log(`Processing ${foundationFoods.length} foundation foods from ${sourceFile}`);
  
  // Import the USDA conversion functions
  const { convertUsdaToIngredient } = require('./seed-usda-ingredients.js');
  
  let processed = 0;
  let seeded = 0;
  let skipped = 0;
  
  for (const usdaFood of foundationFoods) {
    try {
      const ingredient = convertUsdaToIngredient(usdaFood);
      
      // Skip if missing essential data
      if (!ingredient.name) {
        skipped++;
        continue;
      }
      
      // Accept ingredients even with 0 calories if they have other nutritional data
      // Many spices, dried beans, and certain ingredients have 0 calories but are still valid
      const hasNutritionalData = ingredient.protein > 0 || ingredient.carbs > 0 || ingredient.fat > 0 || 
                                ingredient.fiber > 0 || ingredient.sodium > 0 || ingredient.cholesterol > 0;
      
      if (ingredient.calories === 0 && !hasNutritionalData) {
        skipped++;
        continue;
      }
      
      // Add source file info to description
      ingredient.description = `${ingredient.description} (Source: ${sourceFile})`;
      
      try {
        await prisma.ingredient.create({
          data: ingredient
        });
        seeded++;
      } catch (error) {
        if (error.code === 'P2002') {
          // Duplicate key error, skip this ingredient
          skipped++;
        } else {
          console.error(`Error creating ingredient ${ingredient.name}:`, error.message);
          skipped++;
        }
      }
      
      processed++;
      
      if (processed % 50 === 0) {
        console.log(`Processed ${processed} ingredients...`);
      }
    } catch (error) {
      console.error(`Error processing food ${usdaFood.description}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`\n${sourceFile} processing complete:`);
  console.log(`- Processed: ${processed}`);
  console.log(`- Seeded: ${seeded}`);
  console.log(`- Skipped: ${skipped}`);
}

// Seed demo users and other data
async function seedDemoData() {
  console.log('\n=== Seeding Demo Data ===');
  
  // Create demo users
  const adminPassword = await bcrypt.hash('demo', 12);
  const userPassword = await bcrypt.hash('demo', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@healthcompanion.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          activityLevel: 'MODERATELY_ACTIVE',
          calorieTarget: 2000,
          proteinTarget: 150,
          carbTarget: 200,
          fatTarget: 65,
          fiberTarget: 25,
          dietaryPreferences: JSON.stringify(['none']),
          privacySettings: JSON.stringify({ leaderboardVisible: true })
        }
      },
      leaderboard: {
        create: {
          totalPoints: 1250,
          rank: 1
        }
      }
    }
  });

  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      email: 'user@healthcompanion.com',
      passwordHash: userPassword,
      role: 'USER',
      profile: {
        create: {
          firstName: 'Demo',
          lastName: 'User',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'OTHER',
          height: 170,
          weight: 70,
          targetWeight: 65,
          activityLevel: 'LIGHTLY_ACTIVE',
          calorieTarget: 1800,
          proteinTarget: 120,
          carbTarget: 180,
          fatTarget: 60,
          fiberTarget: 25,
          dietaryPreferences: JSON.stringify(['vegetarian']),
          privacySettings: JSON.stringify({ leaderboardVisible: true })
        }
      },
      leaderboard: {
        create: {
          totalPoints: 850,
          rank: 2
        }
      }
    }
  });

  // Create default LLM settings
  const defaultLLMSettings = {
    selectedModel: 'llama3.2:3b',
    selectedProvider: 'ollama',
    latencyWeight: 0.7,
    costWeight: 0.3,
    providers: {
      ollama: { enabled: true, priority: 1 },
      groq: { enabled: true, priority: 2 },
      openai: { enabled: true, priority: 3 },
      anthropic: { enabled: true, priority: 4 },
      aws: { enabled: false, priority: 5 },
      azure: { enabled: false, priority: 6 },
    },
  };

  await prisma.setting.upsert({
    where: { key: 'llm_settings' },
    update: {},
    create: {
      key: 'llm_settings',
      value: JSON.stringify(defaultLLMSettings),
      description: 'Default LLM Router Configuration'
    }
  });

  console.log('✅ Demo users created:');
  console.log('   Admin: admin / demo');
  console.log('   User: user / demo');
  console.log('🤖 LLM settings configured');
}

// Main seeding function
async function seedAllData() {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    
    // Seed USDA data first
    console.log('\n=== Seeding USDA Data ===');
    await seedUsdaDataFiles();
    
    // Seed demo data
    await seedDemoData();
    
    // Show final statistics
    const totalIngredients = await prisma.ingredient.count();
    const totalUsers = await prisma.user.count();
    
    console.log('\n📊 Final Statistics:');
    console.log(`   Total ingredients: ${totalIngredients}`);
    console.log(`   Total users: ${totalUsers}`);
    
    const categories = await prisma.ingredient.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });
    
    console.log('\n📂 Ingredients by category:');
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count.category}`);
    });
    
    console.log('\n✅ Comprehensive seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedAllData()
    .then(() => {
      console.log('🎉 All data seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAllData, seedUsdaDataFiles, seedDemoData }; 