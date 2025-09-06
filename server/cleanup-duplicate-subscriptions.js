import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, sql } from 'drizzle-orm';
import postgres from 'postgres';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/hirelocal';
const client = postgres(connectionString);
const db = drizzle(client);

async function cleanupDuplicateSubscriptions() {
  try {
    console.log('🔄 Starting duplicate subscription cleanup...');
    
    // First, let's see what duplicates we have
    const duplicateQuery = await client`
      SELECT 
        freelancer_id, 
        type, 
        badge_type,
        COUNT(*) as count,
        ARRAY_AGG(id ORDER BY created_at DESC) as subscription_ids,
        ARRAY_AGG(created_at ORDER BY created_at DESC) as created_dates
      FROM subscriptions 
      WHERE status = 'active'
      GROUP BY freelancer_id, type, badge_type
      HAVING COUNT(*) > 1
      ORDER BY freelancer_id, type
    `;
    
    console.log(`Found ${duplicateQuery.length} groups of duplicate subscriptions:`);
    
    if (duplicateQuery.length === 0) {
      console.log('✅ No duplicate subscriptions found');
      return;
    }
    
    // Show details of duplicates
    duplicateQuery.forEach((group, index) => {
      console.log(`\n${index + 1}. Freelancer: ${group.freelancer_id}, Type: ${group.type}${group.badge_type ? ` (${group.badge_type})` : ''}`);
      console.log(`   Count: ${group.count} duplicates`);
      console.log(`   IDs: ${group.subscription_ids.join(', ')}`);
      console.log(`   Dates: ${group.created_dates.map(d => new Date(d).toLocaleDateString()).join(', ')}`);
    });
    
    // Remove duplicates, keeping only the most recent one
    let totalRemoved = 0;
    
    for (const group of duplicateQuery) {
      const subscriptionIds = group.subscription_ids;
      const idsToRemove = subscriptionIds.slice(1); // Keep the first (most recent), remove the rest
      
      console.log(`\nRemoving ${idsToRemove.length} duplicate(s) for freelancer ${group.freelancer_id}, type ${group.type}${group.badge_type ? ` (${group.badge_type})` : ''}`);
      
      for (const idToRemove of idsToRemove) {
        const deleteResult = await client`
          DELETE FROM subscriptions 
          WHERE id = ${idToRemove}
        `;
        totalRemoved++;
        console.log(`   ✅ Removed subscription ${idToRemove}`);
      }
    }
    
    console.log(`\n🎉 Cleanup completed! Removed ${totalRemoved} duplicate subscriptions.`);
    
    // Verify cleanup
    const remainingDuplicates = await client`
      SELECT 
        freelancer_id, 
        type, 
        badge_type,
        COUNT(*) as count
      FROM subscriptions 
      WHERE status = 'active'
      GROUP BY freelancer_id, type, badge_type
      HAVING COUNT(*) > 1
    `;
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ Verification: No duplicate subscriptions remain');
    } else {
      console.log(`⚠️ Warning: ${remainingDuplicates.length} groups of duplicates still exist`);
    }
    
  } catch (error) {
    console.error('❌ Error during duplicate subscription cleanup:', error);
  } finally {
    await client.end();
  }
}

// Run the cleanup
cleanupDuplicateSubscriptions();
