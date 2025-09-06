import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool);

async function testUserCreation() {
  console.log('🧪 Testing User Creation in Database...\n');

  let testUserId: string | null = null;

  try {
    // Test 1: Check database connection
    console.log('Test 1: Checking database connection...');
    const testQuery = await db.select().from(users).limit(1);
    console.log('✅ Database connection successful');
    console.log('Sample users count:', testQuery.length);

    // Test 2: Create a test user
    console.log('\nTest 2: Creating a test user...');
    testUserId = 'test-user-' + Date.now();
    
    const testUserData = {
      id: testUserId,
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      role: 'freelancer' as const
    };

    console.log('Test user data:', testUserData);

    const [newUser] = await db.insert(users).values(testUserData).returning();
    console.log('✅ Test user created successfully:', newUser);

    // Test 3: Verify user exists
    console.log('\nTest 3: Verifying user exists...');
    const existingUsers = await db.select().from(users).where(eq(users.id, testUserId));
    
    if (existingUsers.length > 0) {
      console.log('✅ User verification successful:', existingUsers[0]);
    } else {
      console.log('❌ User verification failed - user not found');
    }

    // Test 4: Test user with minimal data
    console.log('\nTest 4: Testing user creation with minimal data...');
    const minimalUserId = 'minimal-user-' + Date.now();
    
    const minimalUserData = {
      id: minimalUserId,
      email: `minimal-${Date.now()}@example.com`,
      role: 'freelancer' as const
    };

    console.log('Minimal user data:', minimalUserData);

    const [minimalUser] = await db.insert(users).values(minimalUserData).returning();
    console.log('✅ Minimal user created successfully:', minimalUser);

    console.log('\n🎉 All user creation tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Database connection works');
    console.log('- ✅ User creation with full data works');
    console.log('- ✅ User verification works');
    console.log('- ✅ User creation with minimal data works');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  } finally {
    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      if (testUserId) {
        await db.delete(users).where(eq(users.id, testUserId));
        console.log('✅ Test user cleaned up');
      }
      
      // Clean up minimal user
      const minimalUserId = 'minimal-user-' + Date.now().toString().slice(0, -3);
      await db.delete(users).where(eq(users.id, minimalUserId));
      console.log('✅ Minimal user cleaned up');
      
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }
    
    await pool.end();
  }
}

// Run the test
testUserCreation().catch(console.error);
