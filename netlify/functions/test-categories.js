exports.handler = async (event, context) => {
  console.log('Test categories function called');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    const testCategories = [
      { id: '1', name: 'Test Category 1', icon: '💻', color: '#3B82F6', isActive: true },
      { id: '2', name: 'Test Category 2', icon: '📱', color: '#10B981', isActive: true },
      { id: '3', name: 'Test Category 3', icon: '🎨', color: '#F59E0B', isActive: true }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(testCategories)
    };
  } catch (error) {
    console.error('Test categories error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
