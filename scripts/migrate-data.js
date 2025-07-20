const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const prisma = new PrismaClient();

// Connect to the source database
const sourceDbPath = path.join(__dirname, '../Data/health-tracker-data.db');
const sourceDb = new sqlite3.Database(sourceDbPath);

async function migrateIngredients() {
  console.log('Migrating ingredients...');
  
  return new Promise((resolve, reject) => {
    sourceDb.all("SELECT * FROM ingredients", async (err, rows) => {
      if (err) {
        console.error('Error reading ingredients from source DB:', err);
        reject(err);
        return;
      }
      
      console.log(`Found ${rows.length} ingredients in source database`);
      
      let migrated = 0;
      let skipped = 0;
      
      for (const row of rows) {
        try {
          // Check if ingredient already exists
          const existing = await prisma.ingredient.findUnique({
            where: { name: row.name }
          });
          
          if (existing) {
            skipped++;
            continue;
          }
          
          // Create ingredient in main database
          await prisma.ingredient.create({
            data: {
              name: row.name,
              description: row.description || `Migrated ingredient: ${row.name}`,
              servingSize: row.serving_size || '100g',
              calories: parseFloat(row.calories) || 0,
              protein: parseFloat(row.protein) || 0,
              carbs: parseFloat(row.carbs) || 0,
              fat: parseFloat(row.fat) || 0,
              fiber: row.fiber ? parseFloat(row.fiber) : null,
              sugar: row.sugar ? parseFloat(row.sugar) : null,
              sodium: row.sodium ? parseFloat(row.sodium) : null,
              category: row.category || 'Other',
              aisle: row.aisle || 'Other',
              isActive: true,
              allergens: row.allergens || null,
              cholesterol: row.cholesterol ? parseFloat(row.cholesterol) : null,
              dietaryFlags: row.dietary_flags || null,
              glycemicIndex: row.glycemic_index ? parseFloat(row.glycemic_index) : null,
              glycemicLoad: row.glycemic_load ? parseFloat(row.glycemic_load) : null,
              monounsaturatedFat: row.monounsaturated_fat ? parseFloat(row.monounsaturated_fat) : null,
              netCarbs: row.net_carbs ? parseFloat(row.net_carbs) : null,
              polyunsaturatedFat: row.polyunsaturated_fat ? parseFloat(row.polyunsaturated_fat) : null,
              saturatedFat: row.saturated_fat ? parseFloat(row.saturated_fat) : null,
              transFat: row.trans_fat ? parseFloat(row.trans_fat) : null
            }
          });
          
          migrated++;
          if (migrated % 100 === 0) {
            console.log(`Migrated ${migrated} ingredients...`);
          }
        } catch (error) {
          console.error(`Error migrating ingredient ${row.name}:`, error.message);
        }
      }
      
      console.log(`✅ Ingredients migration complete: ${migrated} migrated, ${skipped} skipped`);
      resolve();
    });
  });
}

async function migrateExercises() {
  console.log('Migrating exercises...');
  
  return new Promise((resolve, reject) => {
    sourceDb.all("SELECT * FROM exercises", async (err, rows) => {
      if (err) {
        console.error('Error reading exercises from source DB:', err);
        reject(err);
        return;
      }
      
      console.log(`Found ${rows.length} exercises in source database`);
      
      // Since we don't have an Exercise model, we'll create them as Activity records
      // or we could create a new Exercise model. For now, let's create them as activities
      let migrated = 0;
      let skipped = 0;
      
      for (const row of rows) {
        try {
          // Check if activity already exists
          const existing = await prisma.activity.findFirst({
            where: { 
              name: row.name,
              type: row.category || 'EXERCISE'
            }
          });
          
          if (existing) {
            skipped++;
            continue;
          }
          
          // Create activity in main database
          await prisma.activity.create({
            data: {
              userId: 'system', // We'll need to handle this differently
              name: row.name,
              type: row.category || 'EXERCISE',
              duration: 30, // Default duration
              calories: row.calories_per_minute ? Math.round(row.calories_per_minute * 30) : 150,
              intensity: 'MODERATE',
              notes: `Migrated exercise: ${row.description || row.name}`,
              loggedAt: new Date()
            }
          });
          
          migrated++;
          if (migrated % 50 === 0) {
            console.log(`Migrated ${migrated} exercises...`);
          }
        } catch (error) {
          console.error(`Error migrating exercise ${row.name}:`, error.message);
        }
      }
      
      console.log(`✅ Exercises migration complete: ${migrated} migrated, ${skipped} skipped`);
      resolve();
    });
  });
}

async function checkSourceDatabase() {
  console.log('Checking source database structure...');
  
  return new Promise((resolve, reject) => {
    sourceDb.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('Error checking source DB tables:', err);
        reject(err);
        return;
      }
      
      console.log('Tables in source database:', tables.map(t => t.name));
      
      // Check ingredients table structure
      sourceDb.all("PRAGMA table_info(ingredients)", (err, columns) => {
        if (err) {
          console.error('Error checking ingredients table:', err);
        } else {
          console.log('Ingredients table columns:', columns.map(c => c.name));
        }
        
        // Check exercises table structure
        sourceDb.all("PRAGMA table_info(exercises)", (err, columns) => {
          if (err) {
            console.error('Error checking exercises table:', err);
          } else {
            console.log('Exercises table columns:', columns.map(c => c.name));
          }
          
          resolve();
        });
      });
    });
  });
}

async function main() {
  console.log('🚀 Starting data migration from health-tracker-data.db...\n');
  
  try {
    // Check source database structure
    await checkSourceDatabase();
    console.log('');
    
    // Migrate ingredients
    await migrateIngredients();
    console.log('');
    
    // Migrate exercises
    await migrateExercises();
    console.log('');
    
    // Verify migration
    const ingredientCount = await prisma.ingredient.count();
    const activityCount = await prisma.activity.count();
    
    console.log('📊 Migration Summary:');
    console.log(`   Ingredients in main DB: ${ingredientCount}`);
    console.log(`   Activities in main DB: ${activityCount}`);
    console.log('\n✅ Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    sourceDb.close();
    await prisma.$disconnect();
  }
}

main(); 