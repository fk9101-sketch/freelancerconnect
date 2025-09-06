const { db } = require('./db.ts');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running position plan constraints migration...');
    
    const sqlPath = path.join(__dirname, '..', 'migrations', '0013_add_position_plan_constraints.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        await db.execute(statement.trim());
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
