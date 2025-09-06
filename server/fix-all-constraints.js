import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
});

async function fixAllConstraints() {
  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    
    console.log('🔄 Checking all constraints on freelancer_profiles table...');
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'freelancer_profiles'
    `);
    
    console.log('Current constraints:', constraints.rows);
    
    // Drop all foreign key constraints
    for (const row of constraints.rows) {
      if (row.constraint_type === 'FOREIGN KEY') {
        console.log(`🔄 Dropping constraint: ${row.constraint_name}`);
        try {
          await client.query(`
            ALTER TABLE freelancer_profiles 
            DROP CONSTRAINT "${row.constraint_name}"
          `);
          console.log(`✅ Dropped constraint: ${row.constraint_name}`);
        } catch (error) {
          console.log(`⚠️ Could not drop constraint ${row.constraint_name}:`, error.message);
        }
      }
    }
    
    console.log('🔄 Recreating foreign key constraints...');
    
    // Recreate user_id foreign key
    try {
      await client.query(`
        ALTER TABLE freelancer_profiles 
        ADD CONSTRAINT freelancer_profiles_user_id_users_id_fk 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
      `);
      console.log('✅ Recreated user_id foreign key');
    } catch (error) {
      console.log('⚠️ Could not recreate user_id foreign key:', error.message);
    }
    
    // Recreate category_id foreign key
    try {
      await client.query(`
        ALTER TABLE freelancer_profiles 
        ADD CONSTRAINT freelancer_profiles_category_id_categories_id_fk 
        FOREIGN KEY (category_id) REFERENCES categories(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
      `);
      console.log('✅ Recreated category_id foreign key');
    } catch (error) {
      console.log('⚠️ Could not recreate category_id foreign key:', error.message);
    }
    
    client.release();
    console.log('✅ Database constraints fixed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing constraints:', error);
  } finally {
    await pool.end();
  }
}

fixAllConstraints();
