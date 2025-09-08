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

    console.log('=== API SIMPLE REQUEST ===');
    console.log('Path:', path);
    console.log('Method:', method);
    console.log('Body:', body);
    console.log('========================');

    // Test endpoint
    if (path === '/api/test' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Netlify Function is working!', 
          timestamp: new Date().toISOString(),
          domain: 'mythefreelance.netlify.app',
          status: 'success'
        })
      };
    }

    // Database test endpoint (without actual DB connection for now)
    if (path === '/api/test-db' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'Function working (DB connection pending)', 
          timestamp: new Date().toISOString(),
          message: 'Environment variables need to be configured'
        })
      };
    }

    // User signup endpoint (basic validation only)
    if (path === '/api/auth/signup' && method === 'POST') {
      console.log('=== SIGNUP REQUEST ===');
      console.log('Body:', body);
      
      const { email, password, fullName, area, role, phone } = body;
      
      // Basic validation
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

      // For now, return success without database operation
      // This will help us verify the function is working
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Account creation successful (test mode)',
          user: {
            email: email,
            fullName: fullName,
            area: area,
            role: role,
            phone: phone || ''
          },
          note: 'Database connection pending - environment variables need to be configured'
        })
      };
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
          'POST /api/auth/signup'
        ]
      })
    };

  } catch (error) {
    console.error('API Simple Error:', error);
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
