const { createClient } = require('@neondatabase/serverless');

// Initialize Neon client
const neon = createClient({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
});

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-User-ID',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const method = event.httpMethod;
    const path = event.queryStringParameters?.path || event.path;
    const body = event.body ? JSON.parse(event.body) : {};
    
    console.log('=== API REQUEST ===');
    console.log('Method:', method);
    console.log('Path:', path);
    console.log('Body:', body ? 'Present' : 'Empty');
    console.log('==================');

    // Test endpoint
    if (path === '/api/test' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'API is working!', 
          timestamp: new Date().toISOString(),
          neonConnected: !!process.env.DATABASE_URL
        })
      };
    }

    // Database test endpoint
    if (path === '/api/test-db' && method === 'GET') {
      try {
        const result = await neon.sql`SELECT NOW() as current_time, version() as postgres_version`;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            status: 'Database connected', 
            result: result[0],
            timestamp: new Date().toISOString()
          })
        };
      } catch (dbError) {
        console.error('Database test failed:', dbError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Database connection failed', 
            message: dbError.message
          })
        };
      }
    }

    // Auth signup endpoint
    if (path === '/api/auth/signup' && method === 'POST') {
      console.log('=== SIGNUP REQUEST ===');
      console.log('Body:', body);
      
      const { email, password, fullName, area, role, phone } = body;
      
      // Validate required fields
      if (!email || !password || !fullName || !area || !role) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "All fields are required" })
        };
      }

      // Validate role
      if (!['customer', 'freelancer'].includes(role)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Invalid role" })
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Invalid email format" })
        };
      }

      try {
        console.log('Checking if user exists...');
        // Check if user already exists
        const existingUser = await neon.sql`SELECT id FROM users WHERE email = ${email}`;
        
        if (existingUser.length > 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "User with this email already exists" })
          };
        }

        console.log('Creating new user...');
        // Create user
        const result = await neon.sql`
          INSERT INTO users (email, first_name, last_name, area, role, phone, created_at)
          VALUES (${email}, ${fullName.split(' ')[0] || ''}, ${fullName.split(' ').slice(1).join(' ') || ''}, ${area}, ${role}, ${phone || ''}, NOW())
          RETURNING *
        `;
        
        console.log('User created successfully:', result[0]?.id);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ success: true, user: result[0] })
        };
      } catch (dbError) {
        console.error('Database error during signup:', dbError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ message: "Failed to create user", error: dbError.message })
        };
      }
    }

    // Categories endpoint
    if (path === '/api/categories' && method === 'GET') {
      try {
        const categories = await neon.sql`SELECT * FROM categories ORDER BY name`;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(categories)
        };
      } catch (error) {
        console.error('Error fetching categories:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch categories' })
        };
      }
    }

    // Areas endpoint
    if (path === '/api/areas' && method === 'GET') {
      try {
        const query = event.queryStringParameters?.query || '';
        if (!query || query.length < 2) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Query parameter required (min 2 characters)' })
          };
        }

        const areas = await neon.sql`
          SELECT * FROM areas 
          WHERE LOWER(name) LIKE LOWER(${`%${query}%`}) 
          ORDER BY name 
          LIMIT 10
        `;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(areas)
        };
      } catch (error) {
        console.error('Error fetching areas:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch areas' })
        };
      }
    }

    // Default 404 response
    console.log('=== UNMATCHED REQUEST ===');
    console.log('Path:', path);
    console.log('Method:', method);
    console.log('========================');
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        error: 'Not found', 
        path: path,
        method: method,
        availableEndpoints: [
          'GET /api/test',
          'GET /api/test-db',
          'POST /api/auth/signup',
          'GET /api/categories',
          'GET /api/areas?query=...'
        ]
      })
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
