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

async function createReviewsTable() {
  console.log('🚀 Creating reviews table...\n');

  try {
    const client = await pool.connect();
    
    try {
      // Check if table already exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'reviews'
        );
      `);
      
      if (tableExists.rows[0].exists) {
        console.log('✅ Reviews table already exists');
        return;
      }

      console.log('🔧 Creating reviews table...');
      
      // Create the table
      await client.query(`
        CREATE TABLE "reviews" (
          "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          "customer_id" varchar NOT NULL REFERENCES "users"("id"),
          "freelancer_id" varchar NOT NULL REFERENCES "freelancer_profiles"("id"),
          "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
          "review_text" text NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      
      console.log('✅ Reviews table created successfully');

      // Create indexes
      console.log('🔧 Creating indexes...');
      await client.query(`
        CREATE INDEX "IDX_reviews_freelancer_id" ON "reviews"("freelancer_id");
      `);
      
      await client.query(`
        CREATE INDEX "IDX_reviews_customer_id" ON "reviews"("customer_id");
      `);
      
      await client.query(`
        CREATE INDEX "IDX_reviews_created_at" ON "reviews"("created_at");
      `);
      
      console.log('✅ Indexes created successfully');

      // Add unique constraint
      console.log('🔧 Adding unique constraint...');
      await client.query(`
        ALTER TABLE "reviews" ADD CONSTRAINT "unique_customer_freelancer_review" 
        UNIQUE ("customer_id", "freelancer_id");
      `);
      
      console.log('✅ Unique constraint added successfully');

      console.log('\n🎉 Reviews table setup completed successfully!');
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error creating reviews table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the function
createReviewsTable().catch(console.error);

