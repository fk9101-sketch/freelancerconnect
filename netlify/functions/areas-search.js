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

// Fallback areas search function
function searchAreasFallback(query, limit = 10) {
  if (!query || query.length < 2) {
    return [];
  }
  
  const lowerQuery = query.toLowerCase();
  const filteredAreas = areasData
    .filter(area => area.toLowerCase().includes(lowerQuery))
    .slice(0, limit)
    .map(area => ({
      name: area,
      city: 'Jaipur',
      state: 'Rajasthan',
      country: 'India',
      distance_km: undefined,
      meta: `Jaipur • Rajasthan`
    }));
  
  return filteredAreas;
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
    const { query } = event.queryStringParameters || {};
    
    console.log('Areas search request:', { query, queryStringParameters: event.queryStringParameters });
    
    if (!query || query.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Query parameter must be at least 2 characters" })
      };
    }

    let suggestions = [];

    try {
      // Try to get areas from database first
      const result = await neon.sql`
        SELECT name, city, state, country 
        FROM areas 
        WHERE LOWER(name) LIKE LOWER(${'%' + query + '%'}) 
        AND is_active = true 
        ORDER BY name 
        LIMIT 10
      `;
      
      suggestions = result.map(area => ({
        name: area.name,
        distance_km: undefined,
        meta: `${area.city} • ${area.state}`
      }));
      
      console.log('Database results:', suggestions.length);
    } catch (dbError) {
      console.warn("Database not accessible, using fallback areas data:", dbError.message);
      suggestions = searchAreasFallback(query, 10);
      console.log('Fallback results:', suggestions.length);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(suggestions)
    };

  } catch (error) {
    console.error('Areas search error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
