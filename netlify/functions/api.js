const { createClient } = require('@neondatabase/serverless');

// Initialize Neon client
const neon = createClient({
  connectionString: process.env.DATABASE_URL
});

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
    const { method, path } = event;
    const body = event.body ? JSON.parse(event.body) : {};

    // Route handling
    if (path === '/api/health' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
      };
    }

    if (path === '/api/users' && method === 'POST') {
      // Create user
      const { email, name, role, phone } = body;
      const result = await neon.sql`
        INSERT INTO users (email, name, role, phone, created_at)
        VALUES (${email}, ${name}, ${role}, ${phone}, NOW())
        RETURNING *
      `;
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0])
      };
    }

    if (path === '/api/users' && method === 'GET') {
      // Get users
      const result = await neon.sql`SELECT * FROM users ORDER BY created_at DESC`;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    if (path.startsWith('/api/users/') && method === 'GET') {
      // Get single user
      const userId = path.split('/')[3];
      const result = await neon.sql`SELECT * FROM users WHERE id = ${userId}`;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result[0] || null)
      };
    }

    if (path === '/api/leads' && method === 'POST') {
      // Create lead
      const { title, description, category, location, customer_id, budget } = body;
      const result = await neon.sql`
        INSERT INTO leads (title, description, category, location, customer_id, budget, created_at)
        VALUES (${title}, ${description}, ${category}, ${location}, ${customer_id}, ${budget}, NOW())
        RETURNING *
      `;
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0])
      };
    }

    if (path === '/api/leads' && method === 'GET') {
      // Get leads
      const result = await neon.sql`SELECT * FROM leads ORDER BY created_at DESC`;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
