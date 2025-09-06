import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixFunction() {
  console.log('🔧 Fixing database function with correct column names...\n');

  const client = await pool.connect();
  
  try {
    // Fix the ensure_user_exists function with correct column names
    console.log('Step 1: Fixing ensure_user_exists function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION ensure_user_exists(user_id VARCHAR)
      RETURNS BOOLEAN AS $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
              INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
              VALUES (
                  user_id, 
                  'user_' || user_id || '@example.com',
                  'User',
                  '',
                  'freelancer',
                  NOW(),
                  NOW()
              );
              RETURN TRUE;
          END IF;
          RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Function fixed with correct column names');

    // Fix the create_freelancer_profile_safe function
    console.log('\nStep 2: Fixing create_freelancer_profile_safe function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION create_freelancer_profile_safe(
          p_user_id VARCHAR,
          p_category_id VARCHAR DEFAULT NULL,
          p_full_name VARCHAR DEFAULT 'User',
          p_professional_title VARCHAR DEFAULT NULL,
          p_area VARCHAR DEFAULT NULL,
          p_bio TEXT DEFAULT NULL,
          p_experience VARCHAR DEFAULT NULL,
          p_skills TEXT[] DEFAULT NULL,
          p_custom_category VARCHAR DEFAULT NULL
      )
      RETURNS VARCHAR AS $$
      DECLARE
          profile_id VARCHAR;
      BEGIN
          PERFORM ensure_user_exists(p_user_id);
          
          INSERT INTO freelancer_profiles (
              user_id, category_id, full_name, professional_title, area, bio, experience, skills, custom_category, created_at, updated_at
          ) VALUES (
              p_user_id, p_category_id, p_full_name, p_professional_title, p_area, p_bio, p_experience, p_skills, p_custom_category, NOW(), NOW()
          )
          ON CONFLICT (user_id) DO UPDATE SET
              category_id = EXCLUDED.category_id,
              full_name = EXCLUDED.full_name,
              professional_title = EXCLUDED.professional_title,
              area = EXCLUDED.area,
              bio = EXCLUDED.bio,
              experience = EXCLUDED.experience,
              skills = EXCLUDED.skills,
              custom_category = EXCLUDED.custom_category,
              updated_at = NOW()
          RETURNING id INTO profile_id;
          
          RETURN profile_id;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Safe profile creation function fixed');

    console.log('\n🎉 Database functions fixed successfully!');

    // Verify the changes
    console.log('\n🔍 Verifying function fix...');
    
    const functionCheck = await client.query(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_name = 'ensure_user_exists'
    `);
    console.log(functionCheck.rows.length > 0 ? '✅ Function exists' : '❌ Function not found');

    const safeFunctionCheck = await client.query(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_name = 'create_freelancer_profile_safe'
    `);
    console.log(safeFunctionCheck.rows.length > 0 ? '✅ Safe function exists' : '❌ Safe function not found');

    console.log('\n📋 Summary:');
    console.log('- ✅ Database functions fixed with correct column names');
    console.log('- ✅ Foreign key constraint issue should now be resolved');

  } catch (error) {
    console.error('❌ Function fix failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixFunction().catch(console.error);
