#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;

// Neon database configuration
const NEON_DB_CONFIG = {
  host: 'ep-plain-dew-a1i6qgwj-pooler.ap-southeast-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_1U4pOodrCNbP',
  ssl: { rejectUnauthorized: false }
};

const neonPool = new Pool(NEON_DB_CONFIG);

async function createSchema() {
  console.log('🔄 Creating schema in Neon database...');
  
  try {
    // Create enums
    console.log('Creating enums...');
    await neonPool.query(`CREATE TYPE user_role AS ENUM ('customer', 'freelancer', 'admin')`);
    await neonPool.query(`CREATE TYPE lead_status AS ENUM ('pending', 'accepted', 'completed', 'cancelled', 'missed', 'ignored')`);
    await neonPool.query(`CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled')`);
    await neonPool.query(`CREATE TYPE subscription_type AS ENUM ('lead', 'position', 'badge')`);
    await neonPool.query(`CREATE TYPE badge_type AS ENUM ('verified', 'trusted')`);
    await neonPool.query(`CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected')`);
    await neonPool.query(`CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'cancelled')`);
    await neonPool.query(`CREATE TYPE payment_method AS ENUM ('razorpay', 'other')`);
    console.log('✅ Enums created');
    
    // Drop existing tables if they exist
    console.log('Dropping existing tables...');
    const dropTables = [
      'freelancer_lead_interactions',
      'notifications', 
      'payments',
      'reviews',
      'inquiries',
      'lead_interests',
      'subscriptions',
      'leads',
      'freelancer_profiles',
      'areas',
      'categories',
      'users',
      'sessions'
    ];
    
    for (const table of dropTables) {
      try {
        await neonPool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      } catch (error) {
        // Ignore errors if table doesn't exist
      }
    }
    console.log('✅ Existing tables dropped');
    
    // Create sessions table
    console.log('Creating sessions table...');
    await neonPool.query(`
      CREATE TABLE sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `);
    await neonPool.query(`CREATE INDEX IDX_session_expire ON sessions(expire)`);
    console.log('✅ Sessions table created');
    
    // Create users table
    console.log('Creating users table...');
    await neonPool.query(`
      CREATE TABLE users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        role user_role NOT NULL DEFAULT 'customer',
        area VARCHAR,
        phone VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');
    
    // Create categories table
    console.log('Creating categories table...');
    await neonPool.query(`
      CREATE TABLE categories (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        icon VARCHAR NOT NULL,
        color VARCHAR NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Categories table created');
    
    // Create areas table
    console.log('Creating areas table...');
    await neonPool.query(`
      CREATE TABLE areas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL UNIQUE,
        city VARCHAR NOT NULL DEFAULT 'Jaipur',
        state VARCHAR NOT NULL DEFAULT 'Rajasthan',
        country VARCHAR NOT NULL DEFAULT 'India',
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Areas table created');
    
    // Create freelancer_profiles table
    console.log('Creating freelancer_profiles table...');
    await neonPool.query(`
      CREATE TABLE freelancer_profiles (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        category_id VARCHAR REFERENCES categories(id),
        full_name VARCHAR NOT NULL,
        professional_title VARCHAR,
        profile_photo_url VARCHAR,
        area VARCHAR,
        working_areas TEXT,
        bio TEXT,
        experience VARCHAR,
        experience_description TEXT,
        skills TEXT[],
        portfolio_images TEXT[],
        certifications TEXT[],
        id_proof_url VARCHAR,
        hourly_rate VARCHAR,
        custom_category VARCHAR,
        is_available BOOLEAN DEFAULT true,
        rating DECIMAL(3,2) DEFAULT 0,
        total_jobs INTEGER DEFAULT 0,
        verification_status verification_status DEFAULT 'pending',
        verification_docs TEXT[],
        is_online BOOLEAN DEFAULT false,
        last_seen TIMESTAMP,
        profile_completion_score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Freelancer profiles table created');
    
    // Create leads table
    console.log('Creating leads table...');
    await neonPool.query(`
      CREATE TABLE leads (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id VARCHAR NOT NULL REFERENCES users(id),
        category_id VARCHAR NOT NULL REFERENCES categories(id),
        title VARCHAR NOT NULL,
        description TEXT NOT NULL,
        budget_min INTEGER,
        budget_max INTEGER,
        location VARCHAR NOT NULL,
        mobile_number VARCHAR NOT NULL,
        pincode VARCHAR,
        preferred_time VARCHAR,
        photos TEXT[],
        status lead_status DEFAULT 'pending',
        accepted_by VARCHAR REFERENCES freelancer_profiles(id),
        accepted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Leads table created');
    
    // Create subscriptions table
    console.log('Creating subscriptions table...');
    await neonPool.query(`
      CREATE TABLE subscriptions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        freelancer_id VARCHAR NOT NULL REFERENCES freelancer_profiles(id),
        type subscription_type NOT NULL,
        status subscription_status DEFAULT 'active',
        amount INTEGER NOT NULL,
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP NOT NULL,
        category_id VARCHAR REFERENCES categories(id),
        area VARCHAR,
        position INTEGER,
        badge_type badge_type,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Subscriptions table created');
    
    // Create lead_interests table
    console.log('Creating lead_interests table...');
    await neonPool.query(`
      CREATE TABLE lead_interests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id VARCHAR NOT NULL REFERENCES leads(id),
        freelancer_id VARCHAR NOT NULL REFERENCES freelancer_profiles(id),
        message TEXT,
        is_accepted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Lead interests table created');
    
    // Create inquiries table
    console.log('Creating inquiries table...');
    await neonPool.query(`
      CREATE TABLE inquiries (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id VARCHAR NOT NULL REFERENCES users(id),
        freelancer_id VARCHAR NOT NULL REFERENCES freelancer_profiles(id),
        customer_name VARCHAR NOT NULL,
        requirement TEXT NOT NULL,
        mobile_number VARCHAR NOT NULL,
        budget VARCHAR,
        area VARCHAR,
        status VARCHAR DEFAULT 'new' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Inquiries table created');
    
    // Create reviews table
    console.log('Creating reviews table...');
    await neonPool.query(`
      CREATE TABLE reviews (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id VARCHAR NOT NULL REFERENCES users(id),
        freelancer_id VARCHAR NOT NULL REFERENCES freelancer_profiles(id),
        rating INTEGER NOT NULL,
        review_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Reviews table created');
    
    // Create payments table
    console.log('Creating payments table...');
    await neonPool.query(`
      CREATE TABLE payments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        subscription_id VARCHAR REFERENCES subscriptions(id),
        amount INTEGER NOT NULL,
        currency VARCHAR DEFAULT 'INR',
        status payment_status DEFAULT 'pending',
        payment_method payment_method DEFAULT 'razorpay',
        razorpay_order_id VARCHAR,
        razorpay_payment_id VARCHAR,
        razorpay_signature VARCHAR,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Payments table created');
    
    // Create notifications table
    console.log('Creating notifications table...');
    await neonPool.query(`
      CREATE TABLE notifications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        type VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Notifications table created');
    
    // Create freelancer_lead_interactions table
    console.log('Creating freelancer_lead_interactions table...');
    await neonPool.query(`
      CREATE TABLE freelancer_lead_interactions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        freelancer_id VARCHAR NOT NULL REFERENCES freelancer_profiles(id),
        lead_id VARCHAR NOT NULL REFERENCES leads(id),
        status VARCHAR NOT NULL,
        missed_reason VARCHAR,
        notes TEXT,
        notified_at TIMESTAMP DEFAULT NOW(),
        viewed_at TIMESTAMP,
        responded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Freelancer lead interactions table created');
    
    // Create indexes
    console.log('Creating indexes...');
    const indexes = [
      'CREATE INDEX idx_users_email ON users(email)',
      'CREATE INDEX idx_leads_customer_id ON leads(customer_id)',
      'CREATE INDEX idx_leads_category_id ON leads(category_id)',
      'CREATE INDEX idx_freelancer_profiles_user_id ON freelancer_profiles(user_id)',
      'CREATE INDEX idx_freelancer_profiles_category_id ON freelancer_profiles(category_id)',
      'CREATE INDEX idx_subscriptions_freelancer_id ON subscriptions(freelancer_id)',
      'CREATE INDEX idx_payments_user_id ON payments(user_id)',
      'CREATE INDEX idx_notifications_user_id ON notifications(user_id)',
      'CREATE INDEX idx_freelancer_lead_interactions_freelancer_id ON freelancer_lead_interactions(freelancer_id)',
      'CREATE INDEX idx_freelancer_lead_interactions_lead_id ON freelancer_lead_interactions(lead_id)'
    ];
    
    for (const indexSQL of indexes) {
      await neonPool.query(indexSQL);
    }
    console.log('✅ Indexes created');
    
    console.log('\n🎉 Schema creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
    throw error;
  } finally {
    await neonPool.end();
  }
}

// Run schema creation
createSchema().catch(console.error);
