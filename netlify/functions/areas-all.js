const { createClient } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Initialize Neon client
const neon = createClient({
  connectionString: process.env.DATABASE_URL
});

// Fallback areas data
let areasData = [];
try {
  const areasPath = path.join(__dirname, 'data/jaipur_areas_50km.json');
  if (fs.existsSync(areasPath)) {
    const data = fs.readFileSync(areasPath, 'utf8');
    areasData = JSON.parse(data);
  }
} catch (error) {
  console.error('Error reading areas data:', error);
}

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    let areaNames = [];
    
    try {
      // Try to get areas from database first
      const result = await neon.sql`SELECT name FROM areas WHERE is_active = true ORDER BY name`;
      areaNames = result.map(area => area.name);
      console.log('Database areas count:', areaNames.length);
    } catch (dbError) {
      console.warn("Database not accessible, using fallback areas data:", dbError.message);
      areaNames = areasData;
      console.log('Fallback areas count:', areaNames.length);
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(areaNames)
    };
  } catch (error) {
    console.error('Areas all error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
