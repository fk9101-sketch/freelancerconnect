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

async function fixConstraint() {
  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    
    console.log('🔄 Checking existing constraints...');
    const result = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'freelancer_profiles_category_id_categories_id_fk'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Constraint exists, dropping it...');
      await client.query(`
        ALTER TABLE freelancer_profiles 
        DROP CONSTRAINT freelancer_profiles_category_id_categories_id_fk
      `);
      console.log('✅ Constraint dropped successfully');
    } else {
      console.log('ℹ️ Constraint does not exist');
    }
    
    console.log('🔄 Recreating constraint...');
    await client.query(`
      ALTER TABLE freelancer_profiles 
      ADD CONSTRAINT freelancer_profiles_category_id_categories_id_fk 
      FOREIGN KEY (category_id) REFERENCES categories(id) 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);
    console.log('✅ Constraint recreated successfully');
    
    client.release();
    console.log('✅ Database constraint fixed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing constraint:', error);
  } finally {
    await pool.end();
  }
}

fixConstraint();
