#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;

// Direct Neon configuration
const NEON_DB_CONFIG = {
  host: 'ep-plain-dew-a1i6qgwj-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_1U4pOodrCNbP',
  ssl: { rejectUnauthorized: false }
};

// Local database configuration
const LOCAL_DB_CONFIG = {
  host: 'localhost',
  port: 5000,
  database: 'hirelocal',
  user: 'postgres',
  password: 'Jhotwara#321'
};

const localPool = new Pool(LOCAL_DB_CONFIG);
const neonPool = new Pool(NEON_DB_CONFIG);

async function migrateUsers() {
  console.log('🔄 Migrating users...');
  
  try {
    // Get users from local
    const localUsers = await localPool.query('SELECT * FROM users');
    console.log(`   📊 Local users: ${localUsers.rows.length}`);
    
    if (localUsers.rows.length === 0) return;
    
    // Clear Neon users
    await neonPool.query('DELETE FROM users');
    
    // Insert users into Neon (handle missing columns)
    for (const user of localUsers.rows) {
      await neonPool.query(`
        INSERT INTO users (id, email, first_name, last_name, profile_image_url, role, area, phone, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        user.id,
        user.email,
        user.first_name,
        user.last_name,
        user.profile_image_url,
        user.role,
        user.area,
        user.phone,
        user.created_at,
        user.updated_at
      ]);
    }
    
    // Verify
    const neonCount = await neonPool.query('SELECT COUNT(*) as count FROM users');
    console.log(`   📊 Neon users: ${neonCount.rows[0].count}`);
    console.log('   ✅ Users migrated successfully');
    
  } catch (error) {
    console.error('   ❌ Failed to migrate users:', error.message);
  }
}

async function migrateCategories() {
  console.log('🔄 Migrating categories...');
  
  try {
    const localCategories = await localPool.query('SELECT * FROM categories');
    console.log(`   📊 Local categories: ${localCategories.rows.length}`);
    
    if (localCategories.rows.length === 0) return;
    
    await neonPool.query('DELETE FROM categories');
    
    for (const category of localCategories.rows) {
      await neonPool.query(`
        INSERT INTO categories (id, name, icon, color, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        category.id,
        category.name,
        category.icon,
        category.color,
        category.is_active,
        category.created_at
      ]);
    }
    
    const neonCount = await neonPool.query('SELECT COUNT(*) as count FROM categories');
    console.log(`   📊 Neon categories: ${neonCount.rows[0].count}`);
    console.log('   ✅ Categories migrated successfully');
    
  } catch (error) {
    console.error('   ❌ Failed to migrate categories:', error.message);
  }
}

async function migrateAreas() {
  console.log('🔄 Migrating areas...');
  
  try {
    const localAreas = await localPool.query('SELECT * FROM areas');
    console.log(`   📊 Local areas: ${localAreas.rows.length}`);
    
    if (localAreas.rows.length === 0) return;
    
    await neonPool.query('DELETE FROM areas');
    
    for (const area of localAreas.rows) {
      await neonPool.query(`
        INSERT INTO areas (id, name, city, state, country, latitude, longitude, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        area.id,
        area.name,
        area.city,
        area.state,
        area.country,
        area.latitude,
        area.longitude,
        area.is_active,
        area.created_at,
        area.updated_at
      ]);
    }
    
    const neonCount = await neonPool.query('SELECT COUNT(*) as count FROM areas');
    console.log(`   📊 Neon areas: ${neonCount.rows[0].count}`);
    console.log('   ✅ Areas migrated successfully');
    
  } catch (error) {
    console.error('   ❌ Failed to migrate areas:', error.message);
  }
}

async function migrateFreelancerProfiles() {
  console.log('🔄 Migrating freelancer profiles...');
  
  try {
    const localProfiles = await localPool.query('SELECT * FROM freelancer_profiles');
    console.log(`   📊 Local profiles: ${localProfiles.rows.length}`);
    
    if (localProfiles.rows.length === 0) return;
    
    await neonPool.query('DELETE FROM freelancer_profiles');
    
    for (const profile of localProfiles.rows) {
      await neonPool.query(`
        INSERT INTO freelancer_profiles (
          id, user_id, category_id, full_name, professional_title, profile_photo_url, 
          area, working_areas, bio, experience, experience_description, skills, 
          portfolio_images, certifications, id_proof_url, hourly_rate, custom_category,
          is_available, rating, total_jobs, verification_status, verification_docs,
          is_online, last_seen, profile_completion_score, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      `, [
        profile.id,
        profile.user_id,
        profile.category_id,
        profile.full_name,
        profile.professional_title,
        profile.profile_photo_url,
        profile.area,
        profile.working_areas,
        profile.bio,
        profile.experience,
        profile.experience_description,
        profile.skills,
        profile.portfolio_images,
        profile.certifications,
        profile.id_proof_url,
        profile.hourly_rate,
        profile.custom_category,
        profile.is_available,
        profile.rating,
        profile.total_jobs,
        profile.verification_status,
        profile.verification_docs,
        profile.is_online,
        profile.last_seen,
        profile.profile_completion_score,
        profile.created_at,
        profile.updated_at
      ]);
    }
    
    const neonCount = await neonPool.query('SELECT COUNT(*) as count FROM freelancer_profiles');
    console.log(`   📊 Neon profiles: ${neonCount.rows[0].count}`);
    console.log('   ✅ Freelancer profiles migrated successfully');
    
  } catch (error) {
    console.error('   ❌ Failed to migrate freelancer profiles:', error.message);
  }
}

async function migrateLeads() {
  console.log('🔄 Migrating leads...');
  
  try {
    const localLeads = await localPool.query('SELECT * FROM leads');
    console.log(`   📊 Local leads: ${localLeads.rows.length}`);
    
    if (localLeads.rows.length === 0) return;
    
    await neonPool.query('DELETE FROM leads');
    
    for (const lead of localLeads.rows) {
      await neonPool.query(`
        INSERT INTO leads (
          id, customer_id, category_id, title, description, budget_min, budget_max,
          location, mobile_number, pincode, preferred_time, photos, status,
          accepted_by, accepted_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        lead.id,
        lead.customer_id,
        lead.category_id,
        lead.title,
        lead.description,
        lead.budget_min,
        lead.budget_max,
        lead.location,
        lead.mobile_number,
        lead.pincode,
        lead.preferred_time,
        lead.photos,
        lead.status,
        lead.accepted_by,
        lead.accepted_at,
        lead.created_at,
        lead.updated_at
      ]);
    }
    
    const neonCount = await neonPool.query('SELECT COUNT(*) as count FROM leads');
    console.log(`   📊 Neon leads: ${neonCount.rows[0].count}`);
    console.log('   ✅ Leads migrated successfully');
    
  } catch (error) {
    console.error('   ❌ Failed to migrate leads:', error.message);
  }
}

async function migrateSubscriptions() {
  console.log('🔄 Migrating subscriptions...');
  
  try {
    const localSubs = await localPool.query('SELECT * FROM subscriptions');
    console.log(`   📊 Local subscriptions: ${localSubs.rows.length}`);
    
    if (localSubs.rows.length === 0) return;
    
    await neonPool.query('DELETE FROM subscriptions');
    
    for (const sub of localSubs.rows) {
      await neonPool.query(`
        INSERT INTO subscriptions (
          id, freelancer_id, type, status, amount, start_date, end_date,
          category_id, area, position, badge_type, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        sub.id,
        sub.freelancer_id,
        sub.type,
        sub.status,
        sub.amount,
        sub.start_date,
        sub.end_date,
        sub.category_id,
        sub.area,
        sub.position,
        sub.badge_type,
        sub.created_at
      ]);
    }
    
    const neonCount = await neonPool.query('SELECT COUNT(*) as count FROM subscriptions');
    console.log(`   📊 Neon subscriptions: ${neonCount.rows[0].count}`);
    console.log('   ✅ Subscriptions migrated successfully');
    
  } catch (error) {
    console.error('   ❌ Failed to migrate subscriptions:', error.message);
  }
}

async function migratePayments() {
  console.log('🔄 Migrating payments...');
  
  try {
    const localPayments = await localPool.query('SELECT * FROM payments');
    console.log(`   📊 Local payments: ${localPayments.rows.length}`);
    
    if (localPayments.rows.length === 0) return;
    
    await neonPool.query('DELETE FROM payments');
    
    for (const payment of localPayments.rows) {
      await neonPool.query(`
        INSERT INTO payments (
          id, user_id, subscription_id, amount, currency, status, payment_method,
          razorpay_order_id, razorpay_payment_id, razorpay_signature, description,
          metadata, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        payment.id,
        payment.user_id,
        payment.subscription_id,
        payment.amount,
        payment.currency,
        payment.status,
        payment.payment_method,
        payment.razorpay_order_id,
        payment.razorpay_payment_id,
        payment.razorpay_signature,
        payment.description,
        payment.metadata,
        payment.created_at,
        payment.updated_at
      ]);
    }
    
    const neonCount = await neonPool.query('SELECT COUNT(*) as count FROM payments');
    console.log(`   📊 Neon payments: ${neonCount.rows[0].count}`);
    console.log('   ✅ Payments migrated successfully');
    
  } catch (error) {
    console.error('   ❌ Failed to migrate payments:', error.message);
  }
}

async function migrateOtherTables() {
  console.log('🔄 Migrating other tables...');
  
  const tables = [
    { name: 'inquiries', query: 'SELECT * FROM inquiries' },
    { name: 'reviews', query: 'SELECT * FROM reviews' },
    { name: 'lead_interests', query: 'SELECT * FROM lead_interests' },
    { name: 'freelancer_lead_interactions', query: 'SELECT * FROM freelancer_lead_interactions' },
    { name: 'notifications', query: 'SELECT * FROM notifications' },
    { name: 'sessions', query: 'SELECT * FROM sessions' }
  ];
  
  for (const table of tables) {
    try {
      const localData = await localPool.query(table.query);
      console.log(`   📊 Local ${table.name}: ${localData.rows.length}`);
      
      if (localData.rows.length === 0) continue;
      
      await neonPool.query(`DELETE FROM ${table.name}`);
      
      if (localData.rows.length > 0) {
        const columns = Object.keys(localData.rows[0]);
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        const insertSQL = `INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        for (const row of localData.rows) {
          const values = columns.map(col => row[col]);
          await neonPool.query(insertSQL, values);
        }
        
        const neonCount = await neonPool.query(`SELECT COUNT(*) as count FROM ${table.name}`);
        console.log(`   📊 Neon ${table.name}: ${neonCount.rows[0].count}`);
        console.log(`   ✅ ${table.name} migrated successfully`);
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to migrate ${table.name}:`, error.message);
    }
  }
}

async function runFinalMigration() {
  console.log('🚀 Starting final data migration to Neon...');
  
  try {
    // Test connections
    const localResult = await localPool.query('SELECT NOW() as current_time');
    const neonResult = await neonPool.query('SELECT NOW() as current_time');
    console.log('✅ Both database connections successful');
    
    // Migrate in dependency order
    await migrateUsers();
    await migrateCategories();
    await migrateAreas();
    await migrateFreelancerProfiles();
    await migrateLeads();
    await migrateSubscriptions();
    await migratePayments();
    await migrateOtherTables();
    
    console.log('\n🎉 Final migration completed!');
    
    // Summary
    const tables = ['users', 'categories', 'areas', 'freelancer_profiles', 'leads', 'subscriptions', 'payments'];
    console.log('\n📊 Migration Summary:');
    
    for (const table of tables) {
      try {
        const localCount = await localPool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const neonCount = await neonPool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table}: ${localCount.rows[0].count} → ${neonCount.rows[0].count}`);
      } catch (error) {
        console.log(`${table}: Error checking counts`);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localPool.end();
    await neonPool.end();
  }
}

// Run migration
runFinalMigration().catch(console.error);
