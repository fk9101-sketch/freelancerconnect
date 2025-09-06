import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/hirelocal';
const client = postgres(connectionString);
const db = drizzle(client);

async function cleanupSubscriptions() {
  try {
    console.log('🔄 Starting subscription cleanup...');
    
    // Direct SQL query to get active subscriptions count
    const countResult = await client`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'`;
    const count = parseInt(countResult[0].count);
    
    console.log(`Found ${count} active subscriptions`);
    
    if (count === 0) {
      console.log('✅ No active subscriptions found to clean up');
      return;
    }
    
    // Get subscription details before deletion
    const subscriptions = await client`
      SELECT id, type, amount, end_date, freelancer_id 
      FROM subscriptions 
      WHERE status = 'active'
      ORDER BY created_at DESC
    `;
    
    // Delete all active subscriptions
    const deleteResult = await client`DELETE FROM subscriptions WHERE status = 'active'`;
    console.log(`✅ Successfully deleted ${count} active subscriptions`);
    
    // List the deleted subscriptions for reference
    console.log('\n📋 Deleted subscriptions:');
    subscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.type} plan - Amount: ₹${sub.amount} - Expires: ${new Date(sub.end_date).toLocaleDateString()}`);
    });
    
    console.log('\n🎉 Subscription cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during subscription cleanup:', error);
  } finally {
    await client.end();
  }
}

// Run the cleanup
cleanupSubscriptions();
