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
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Test function working',
        timestamp: new Date().toISOString(),
        method: event.httpMethod,
        path: event.path,
        queryStringParameters: event.queryStringParameters
      })
    };
  } catch (error) {
    console.error('Test function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
