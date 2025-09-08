const { createClient } = require('@neondatabase/serverless');

// Initialize Neon client
const neon = createClient({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
});

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-User-ID',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
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

    console.log('=== API HANDLER REQUEST ===');
    console.log('Path:', path);
    console.log('Method:', method);
    console.log('Body:', body);
    console.log('Query params:', event.queryStringParameters);
    console.log('========================');

    // Test endpoint
    if (path === '/api/test' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Netlify Function is working!', 
          timestamp: new Date().toISOString(),
          domain: 'mythefreelance.netlify.app'
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
            message: dbError.message, 
            timestamp: new Date().toISOString() 
          })
        };
      }
    }

    // User signup endpoint
    if (path === '/api/auth/signup' && method === 'POST') {
      console.log('=== SIGNUP REQUEST ===');
      console.log('Body:', body);
      
      const { email, password, fullName, area, role, phone } = body;
      
      // Validation
      if (!email || !password || !fullName || !area || !role) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            message: "All fields are required",
            received: { email: !!email, password: !!password, fullName: !!fullName, area: !!area, role: !!role }
          })
        };
      }

      if (!['customer', 'freelancer'].includes(role)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Invalid role. Must be 'customer' or 'freelancer'" })
        };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Invalid email format" })
        };
      }

      try {
        // Check if user already exists
        const existingUser = await neon.sql`SELECT id FROM users WHERE email = ${email}`;
        if (existingUser.length > 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "User with this email already exists" })
          };
        }

        // Create new user
        const result = await neon.sql`
          INSERT INTO users (email, first_name, last_name, area, role, phone, created_at)
          VALUES (${email}, ${fullName.split(' ')[0] || ''}, ${fullName.split(' ').slice(1).join(' ') || ''}, ${area}, ${role}, ${phone || ''}, NOW())
          RETURNING *
        `;

        console.log('✅ User created successfully:', result[0]);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ 
            success: true, 
            user: result[0],
            message: 'Account created successfully'
          })
        };

      } catch (dbError) {
        console.error('Database error during signup:', dbError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Database error', 
            message: dbError.message 
          })
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
          body: JSON.stringify({ 
            success: true, 
            categories: categories,
            count: categories.length
          })
        };
      } catch (dbError) {
        console.error('Database error fetching categories:', dbError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Database error', 
            message: dbError.message 
          })
        };
      }
    }

    // Areas endpoint
    if (path.startsWith('/api/areas') && method === 'GET') {
      try {
        const query = event.queryStringParameters?.query || '';
        let areas;
        
        if (query) {
          areas = await neon.sql`SELECT * FROM areas WHERE name ILIKE ${'%' + query + '%'} ORDER BY name LIMIT 20`;
        } else {
          areas = await neon.sql`SELECT * FROM areas ORDER BY name LIMIT 50`;
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            areas: areas,
            count: areas.length,
            query: query
          })
        };
      } catch (dbError) {
        console.error('Database error fetching areas:', dbError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Database error', 
            message: dbError.message 
          })
        };
      }
    }

    // Freelancers endpoint
    if (path === '/api/freelancers' && method === 'GET') {
      try {
        const { area, category, limit = 20 } = event.queryStringParameters || {};
        
        let query = 'SELECT * FROM users WHERE role = \'freelancer\'';
        const params = [];
        
        if (area) {
          query += ' AND area = $' + (params.length + 1);
          params.push(area);
        }
        
        if (category) {
          query += ' AND category = $' + (params.length + 1);
          params.push(category);
        }
        
        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
        params.push(parseInt(limit));
        
        const freelancers = await neon.sql(query, params);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            freelancers: freelancers,
            count: freelancers.length,
            filters: { area, category, limit }
          })
        };
      } catch (dbError) {
        console.error('Database error fetching freelancers:', dbError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Database error', 
            message: dbError.message 
          })
        };
      }
    }

    // Default response for unmatched routes
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        error: 'API endpoint not found', 
        path, 
        method,
        availableEndpoints: [
          'GET /api/test',
          'GET /api/test-db',
          'POST /api/auth/signup',
          'GET /api/categories',
          'GET /api/areas',
          'GET /api/freelancers'
        ]
      })
    };

  } catch (error) {
    console.error('API Handler Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal Server Error', 
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};