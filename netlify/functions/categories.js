import { neon } from '@neondatabase/serverless';

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL);

export const handler = async (event, context) => {
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
    try {
      const result = await sql`SELECT * FROM categories WHERE is_active = true ORDER BY name`;
      console.log('Database categories count:', result.length);
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
      console.log('Fallback categories count:', fallbackCategories.length);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(fallbackCategories)
      };
    }
  } catch (error) {
    console.error('Categories error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
