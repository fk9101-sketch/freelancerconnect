import pkg from 'pg';
const { Pool } = pkg;
import fetch from 'node-fetch';

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5000,
  database: 'hirelocal',
  user: 'postgres',
  password: 'Jhotwara#321'
});

async function checkMissedLeads() {
  try {
    console.log('🕐 Running missed leads check at:', new Date().toISOString());
    
    // Call the API endpoint to check for missed leads
    const response = await fetch('http://localhost:3000/api/admin/check-missed-leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Missed leads check completed:', result);
    } else {
      console.error('❌ Failed to check missed leads:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error running missed leads check:', error);
  }
}

// Run the check
checkMissedLeads().then(() => {
  console.log('🏁 Missed leads check finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Missed leads check failed:', error);
  process.exit(1);
});
