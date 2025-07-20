const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the source database
const sourceDbPath = path.join(__dirname, '../Data/health-tracker-data.db');
const sourceDb = new sqlite3.Database(sourceDbPath);

async function checkSourceData() {
  console.log('🔍 Checking source database content...\n');
  
  return new Promise((resolve, reject) => {
    // Check all tables
    sourceDb.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('Error checking tables:', err);
        reject(err);
        return;
      }
      
      console.log('📋 Tables found:', tables.map(t => t.name));
      console.log('');
      
      // Check each table for data
      let tableIndex = 0;
      
      function checkNextTable() {
        if (tableIndex >= tables.length) {
          resolve();
          return;
        }
        
        const tableName = tables[tableIndex].name;
        
        sourceDb.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, result) => {
          if (err) {
            console.log(`❌ Error checking ${tableName}: ${err.message}`);
          } else {
            console.log(`📊 ${tableName}: ${result.count} records`);
            
            // If table has data, show sample
            if (result.count > 0 && result.count <= 10) {
              sourceDb.all(`SELECT * FROM ${tableName} LIMIT 3`, (err, rows) => {
                if (!err && rows.length > 0) {
                  console.log(`   Sample data:`, JSON.stringify(rows[0], null, 2));
                }
                console.log('');
                tableIndex++;
                checkNextTable();
              });
            } else if (result.count > 10) {
              console.log(`   (showing first 3 records)`);
              sourceDb.all(`SELECT * FROM ${tableName} LIMIT 3`, (err, rows) => {
                if (!err && rows.length > 0) {
                  console.log(`   Sample data:`, JSON.stringify(rows[0], null, 2));
                }
                console.log('');
                tableIndex++;
                checkNextTable();
              });
            } else {
              console.log('');
              tableIndex++;
              checkNextTable();
            }
          }
        });
      }
      
      checkNextTable();
    });
  });
}

async function main() {
  try {
    await checkSourceData();
    console.log('✅ Source database check completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    sourceDb.close();
  }
}

main(); 