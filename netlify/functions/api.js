const { createClient } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Initialize Neon client
console.log('🔍 Environment check:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('NEON_DATABASE_URL:', process.env.NEON_DATABASE_URL ? 'Set' : 'Not set');

const neon = createClient({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
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
    const method = event.httpMethod;
    // Get path from query parameter if redirected, otherwise use event.path
    const path = event.queryStringParameters?.path || event.path;
    const body = event.body ? JSON.parse(event.body) : {};
    
    console.log('Request:', { method, path, queryStringParameters: event.queryStringParameters });

    // Route handling
    if (path === '/api/health' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
      };
    }

    // Database test endpoint
    if (path === '/api/test-db' && method === 'GET') {
      try {
        console.log('Testing database connection...');
        const result = await neon.sql`SELECT NOW() as current_time, version() as postgres_version`;
        console.log('Database test result:', result);
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

    // Simple test endpoint
    if (path === '/api/test' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'API function working',
          timestamp: new Date().toISOString(),
          method: event.httpMethod,
          path: event.path,
          queryStringParameters: event.queryStringParameters
        })
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

    // Areas search API
    if (path === '/api/areas/search' && method === 'GET') {
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
        const searchPattern = `%${query}%`;
        const result = await neon.sql`
          SELECT name, city, state, country 
          FROM areas 
          WHERE LOWER(name) LIKE LOWER(${searchPattern}) 
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
    }

    // Areas API for getting all areas
    if (path === '/api/areas/all' && method === 'GET') {
      let areaNames = [];
      
      try {
        // Try to get areas from database first
        const result = await neon.sql`SELECT name FROM areas WHERE is_active = true ORDER BY name`;
        areaNames = result.map(area => area.name);
      } catch (dbError) {
        console.warn("Database not accessible, using fallback areas data:", dbError.message);
        areaNames = areasData;
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(areaNames)
      };
    }

    // Categories API
    if (path === '/api/categories' && method === 'GET') {
      try {
        const result = await neon.sql`SELECT * FROM categories WHERE is_active = true ORDER BY name`;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result)
        };
      } catch (dbError) {
        console.warn("Database not accessible, using fallback categories:", dbError.message);
        // Fallback categories
        const fallbackCategories = [
          { id: '1', name: 'Web Development', icon: '💻', color: '#3B82F6', isActive: true },
          { id: '2', name: 'Mobile Development', icon: '📱', color: '#10B981', isActive: true },
          { id: '3', name: 'Design', icon: '🎨', color: '#F59E0B', isActive: true },
          { id: '4', name: 'Writing', icon: '✍️', color: '#8B5CF6', isActive: true },
          { id: '5', name: 'Marketing', icon: '📈', color: '#EF4444', isActive: true },
          { id: '6', name: 'Consulting', icon: '💼', color: '#06B6D4', isActive: true },
          { id: '7', name: 'Other', icon: '🔧', color: '#6B7280', isActive: true }
        ];
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(fallbackCategories)
        };
      }
    }

    // Categories search API
    if (path === '/api/categories/search' && method === 'GET') {
      const { query } = event.queryStringParameters || {};
      
      console.log('Categories search request:', { query, queryStringParameters: event.queryStringParameters });
      
      if (!query || query.length < 2) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Query parameter must be at least 2 characters" })
        };
      }

      let suggestions = [];

      try {
        // Try to get categories from database first
        const searchPattern = `%${query}%`;
        const result = await neon.sql`
          SELECT * FROM categories 
          WHERE LOWER(name) LIKE LOWER(${searchPattern}) 
          AND is_active = true 
          ORDER BY name 
          LIMIT 10
        `;
        
        suggestions = result;
        console.log('Database categories results:', suggestions.length);
      } catch (dbError) {
        console.warn("Database not accessible, using fallback categories:", dbError.message);
        // Fallback categories
        const fallbackCategories = [
          { id: '1', name: 'Web Development', icon: '💻', color: '#3B82F6', isActive: true },
          { id: '2', name: 'Mobile Development', icon: '📱', color: '#10B981', isActive: true },
          { id: '3', name: 'Design', icon: '🎨', color: '#F59E0B', isActive: true },
          { id: '4', name: 'Writing', icon: '✍️', color: '#8B5CF6', isActive: true },
          { id: '5', name: 'Marketing', icon: '📈', color: '#EF4444', isActive: true },
          { id: '6', name: 'Consulting', icon: '💼', color: '#06B6D4', isActive: true },
          { id: '7', name: 'Other', icon: '🔧', color: '#6B7280', isActive: true }
        ];
        
        const lowerQuery = query.toLowerCase();
        suggestions = fallbackCategories.filter(category => 
          category.name.toLowerCase().includes(lowerQuery)
        );
        console.log('Fallback categories results:', suggestions.length);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(suggestions)
      };
    }

    // Auth signup endpoint
    if (path === '/api/auth/signup' && method === 'POST') {
      console.log('=== SIGNUP REQUEST ===');
      console.log('Path:', path);
      console.log('Method:', method);
      console.log('Body:', body);
      console.log('Query params:', event.queryStringParameters);
      console.log('========================');
      
      const { email, password, fullName, area, role, phone } = body;
      
      // Validate required fields
      if (!email || !password || !fullName || !area || !role) {
        console.log('Validation failed: missing required fields', { email, fullName, area, role });
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
        console.log('Existing user check result:', existingUser.length);
        
        if (existingUser.length > 0) {
          console.log('User already exists');
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

    // Default response - log what we received
    console.log('=== UNMATCHED REQUEST ===');
    console.log('Path:', path);
    console.log('Method:', method);
    console.log('Query params:', event.queryStringParameters);
    console.log('========================');
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        error: 'Not found', 
        path: path,
        method: method,
        queryParams: event.queryStringParameters
      })
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
