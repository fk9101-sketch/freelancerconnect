import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/hirelocal';
const client = postgres(connectionString);
const db = drizzle(client);

async function updateUserToAdmin() {
  try {
    console.log('🔄 Updating user to admin role...');
    
    // Update the specific user to admin role
    const userId = 'swQiZDLb6FPj22hfwxx5f7RPRKS2'; // The user ID from the logs
    
    const result = await client`
      UPDATE users 
      SET role = 'admin', updated_at = NOW() 
      WHERE id = ${userId}
    `;
    
    console.log(`✅ Successfully updated user ${userId} to admin role`);
    
    // Verify the update
    const user = await client`SELECT id, email, role FROM users WHERE id = ${userId}`;
    console.log('Updated user:', user[0]);
    
  } catch (error) {
    console.error('❌ Error updating user to admin:', error);
  } finally {
    await client.end();
  }
}

// Run the update
updateUserToAdmin();
