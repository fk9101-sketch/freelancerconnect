import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Add JSON parsing middleware
app.use(express.json());

// PostgreSQL connection configuration
const createPool = () => {
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5000'), // Fixed: PostgreSQL is running on port 5000
    database: process.env.DB_NAME || 'hirelocal',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Jhotwara#321',
    ssl: false, // Disable SSL for local development
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout
    // Add connection retry settings
    retryDelay: 1000,
    maxRetries: 3,
  });
};

// Create database connection
let pool = null;
try {
  pool = createPool();
  console.log('✅ Database connection established');
} catch (error) {
  console.error('❌ Database connection failed:', error);
  console.log('⚠️  Continuing with mock data...');
}

// Serve static files from the dist directory
app.use(express.static('dist/public'));

// Load areas data
const areasPath = path.join(__dirname, 'server', 'data', 'jaipur_areas_50km.json');
const areasData = fs.readFileSync(areasPath, 'utf8');
const areas = JSON.parse(areasData);

console.log(`Loaded ${areas.length} areas from JSON file`);

// Areas API for auto-suggestions
app.get('/api/areas', (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.status(400).json({ message: "Query parameter must be at least 2 characters" });
    }

    // Simple case-insensitive partial matching
    const lowerQuery = query.toLowerCase();
    const filteredAreas = areas
      .filter(area => area.toLowerCase().includes(lowerQuery))
      .slice(0, 8) // Limit to 8 suggestions
      .map(area => ({
        name: area,
        distance_km: undefined,
        meta: 'Locality • Jaipur'
      }));

    console.log(`Query: "${query}" -> Found ${filteredAreas.length} results`);
    res.json(filteredAreas);
  } catch (error) {
    console.error("Error fetching area suggestions:", error);
    res.status(500).json({ message: "Failed to fetch area suggestions" });
  }
});

// Areas API for getting all areas (for dropdowns)
app.get('/api/areas/all', (req, res) => {
  try {
    res.json(areas);
  } catch (error) {
    console.error("Error fetching all areas:", error);
    res.status(500).json({ message: "Failed to fetch areas" });
  }
});

// Mock categories API
app.get('/api/categories', (req, res) => {
  const categories = [
    { id: '1', name: 'Electrical', icon: 'fas fa-bolt', color: '#ff6b6b', isActive: true, createdAt: new Date() },
    { id: '2', name: 'Plumbing', icon: 'fas fa-wrench', color: '#4ecdc4', isActive: true, createdAt: new Date() },
    { id: '3', name: 'Carpentry', icon: 'fas fa-hammer', color: '#45b7d1', isActive: true, createdAt: new Date() },
    { id: '4', name: 'Cleaning', icon: 'fas fa-broom', color: '#96ceb4', isActive: true, createdAt: new Date() },
    { id: '5', name: 'Painting', icon: 'fas fa-paint-brush', color: '#feca57', isActive: true, createdAt: new Date() },
    { id: '6', name: 'Gardening', icon: 'fas fa-leaf', color: '#ff9ff3', isActive: true, createdAt: new Date() }
  ];
  res.json(categories);
});

// Customer profile API - Now uses real database
app.get('/api/customer/profile', async (req, res) => {
  try {
    // Get user info from Firebase headers
    const firebaseUserId = req.headers['x-firebase-user-id'];
    const authHeader = req.headers.authorization;
    
    if (!firebaseUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    console.log('🔍 Fetching customer profile for user:', firebaseUserId);
    
    // Try to get user from database first
    if (pool) {
      try {
        const result = await pool.query(
          'SELECT id, email, first_name as "firstName", last_name as "lastName", role, area, phone, profile_image_url as "profileImageUrl", created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE id = $1',
          [firebaseUserId]
        );
        
        if (result.rows.length > 0) {
          const user = result.rows[0];
          console.log('✅ User found in database:', user);
          res.json(user);
          return;
        } else {
          console.log('⚠️  User not found in database, creating new user...');
          
          // Create new user in database
          const insertResult = await pool.query(
            'INSERT INTO users (id, email, first_name, last_name, role, area, phone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name as "firstName", last_name as "lastName", role, area, phone, profile_image_url as "profileImageUrl", created_at as "createdAt", updated_at as "updatedAt"',
            [firebaseUserId, 'kushiram@example.com', 'Kushiram', '', 'customer', 'Kukas', '+91 9876543210']
          );
          
          const newUser = insertResult.rows[0];
          console.log('✅ New user created in database:', newUser);
          res.json(newUser);
          return;
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        console.log('⚠️  Falling back to mock data...');
      }
    }
    
    // Fallback to mock data if database is not available
    console.log('📋 Using mock data for user:', firebaseUserId);
    res.json({
      id: firebaseUserId,
      email: 'kushiram@example.com',
      firstName: 'Kushiram',
      lastName: '',
      role: 'customer',
      area: 'Kukas',
      phone: '+91 9876543210',
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error in customer profile API:', error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Mock user API for authentication
app.get('/api/auth/user', (req, res) => {
  // Get user info from Firebase headers
  const firebaseUserId = req.headers['x-firebase-user-id'];
  const authHeader = req.headers.authorization;
  
  let userEmail = 'customer@example.com';
  let userName = 'Kushiram';
  let userPhone = '+91 XXXXXXXXXX';
  
  // Use Firebase user ID to determine the user
  if (firebaseUserId) {
    // In a real app, you would look up the user in the database
    // For now, we'll use the Firebase user ID to determine the user
    if (firebaseUserId.includes('kushiram') || firebaseUserId.includes('Kushiram')) {
      userEmail = 'kushiram@example.com';
      userName = 'Kushiram';
      userPhone = '+91 9876543210';
    } else {
      // Default user
      userEmail = 'customer@example.com';
      userName = 'Customer';
      userPhone = '+91 XXXXXXXXXX';
    }
  }
  
  res.json({
    id: firebaseUserId || '1',
    email: userEmail,
    firstName: userName,
    lastName: '',
    role: 'customer',
    area: 'Kukas',
    profileImageUrl: null,
    phone: userPhone,
    createdAt: new Date(),
    updatedAt: new Date()
  });
});

// Mock authentication check endpoint
app.get('/api/auth/check', (req, res) => {
  // Get user info from Firebase headers
  const firebaseUserId = req.headers['x-firebase-user-id'];
  const authHeader = req.headers.authorization;
  
  let userEmail = 'customer@example.com';
  let userName = 'Kushiram';
  
  // Use Firebase user ID to determine the user
  if (firebaseUserId) {
    // In a real app, you would look up the user in the database
    // For now, we'll use the Firebase user ID to determine the user
    if (firebaseUserId.includes('kushiram') || firebaseUserId.includes('Kushiram')) {
      userEmail = 'kushiram@example.com';
      userName = 'Kushiram';
    } else {
      // Default user
      userEmail = 'customer@example.com';
      userName = 'Customer';
    }
  }
  
  res.json({
    isAuthenticated: true,
    user: {
      id: firebaseUserId || '1',
      email: userEmail,
      firstName: userName,
      lastName: '',
      role: 'customer',
      area: 'Kukas'
    }
  });
});

// Mock login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  // Mock successful login for any email/password combination
  // In a real app, you would validate credentials against the database
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: 'kushiram123',
      email: email || 'kushiram@example.com',
      firstName: 'Kushiram',
      lastName: '',
      role: 'customer',
      area: 'Kukas',
      token: 'mock-jwt-token-' + Date.now()
    }
  });
});

// Mock signup endpoint
app.post('/api/auth/signup', (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  
  console.log('Signup attempt:', { email, firstName, lastName, role });
  
  // Mock successful signup
  res.json({
    success: true,
    message: 'Signup successful',
    user: {
      id: 'newuser123',
      email: email,
      firstName: firstName || 'New',
      lastName: lastName || 'User',
      role: role || 'customer',
      area: 'Kukas',
      token: 'mock-jwt-token-' + Date.now()
    }
  });
});

// Mock freelancer profile API
app.get('/api/freelancer/profile', (req, res) => {
  res.json({
    id: '1',
    userId: '2',
    categoryId: '1',
    fullName: 'Jane Smith',
    professionalTitle: 'Senior Electrician',
    profilePhotoUrl: null,
    area: 'Vaishali Nagar',
    workingAreas: ['Vaishali Nagar', 'Sirsi Road'],
    bio: 'Experienced electrician with 5+ years of experience in residential and commercial electrical work.',
    experience: '5',
    experienceDescription: 'Specialized in electrical installations, repairs, and maintenance.',
    skills: ['Electrical Installation', 'Wiring', 'Circuit Repair'],
    portfolioImages: [],
    certifications: ['Licensed Electrician'],
    idProofUrl: null,
    hourlyRate: '₹500-800',
    isAvailable: true,
    rating: '4.8',
    totalJobs: 25,
    verificationStatus: 'approved',
    verificationDocs: [],
    profileCompletionScore: 85,
    isOnline: true,
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  });
});

// Mock freelancer profile update API
app.put('/api/freelancer/profile', (req, res) => {
  console.log('Updating freelancer profile:', req.body);
  res.json({ success: true });
});

// FREELANCERS API - FETCHES REAL DATA FROM DATABASE ONLY
app.get('/api/customer/available-freelancers', async (req, res) => {
  console.log('🔍 FREELANCERS API CALLED - FETCHING FROM DATABASE ONLY');
  
  // Set proper headers for JSON response
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    // Try to get real freelancers from database ONLY
    if (pool) {
      try {
        console.log('📊 Querying database for real freelancers...');
        
        const result = await pool.query(`
          SELECT 
            fp.id,
            fp.user_id as "userId",
            fp.full_name as "fullName",
            fp.area,
            fp.bio,
            fp.experience,
            fp.experience_description as "experienceDescription",
            fp.skills,
            fp.hourly_rate as "hourlyRate",
            fp.is_available as "isAvailable",
            fp.verification_status as "verificationStatus",
            fp.rating,
            fp.category_id as "categoryId",
            u.first_name as "userFirstName",
            u.last_name as "userLastName",
            u.email as "userEmail",
            u.profile_image_url as "userProfileImageUrl",
            c.name as "categoryName"
          FROM freelancer_profiles fp
          LEFT JOIN users u ON fp.user_id = u.id
          LEFT JOIN categories c ON fp.category_id = c.id
          ORDER BY fp.created_at DESC
        `);
        
        if (result.rows.length > 0) {
          console.log(`✅ Found ${result.rows.length} real freelancers in database`);
          
          const realFreelancers = result.rows.map(row => ({
            id: row.id,
            userId: row.userId,
            fullName: row.fullName,
            user: {
              id: row.userId,
              firstName: row.userFirstName,
              lastName: row.userLastName,
              email: row.userEmail,
              profileImageUrl: row.userProfileImageUrl,
              area: row.area
            },
            category: {
              id: row.categoryId,
              name: row.categoryName
            },
            categoryId: row.categoryId,
            area: row.area,
            bio: row.bio,
            experience: row.experience,
            experienceDescription: row.experienceDescription,
            skills: row.skills || [],
            hourlyRate: row.hourlyRate,
            isAvailable: row.isAvailable,
            verificationStatus: row.verificationStatus,
            rating: row.rating,
            subscriptions: []
          }));
          
          console.log('📋 Real freelancers from database:', realFreelancers.map(f => f.fullName));
          res.json(realFreelancers);
          return;
        } else {
          console.log('⚠️ No freelancers found in database');
        }
      } catch (dbError) {
        console.error('❌ Database query error:', dbError);
      }
    }
    
    // If no database connection or no results, return empty array - NO MOCK DATA
    console.log('📋 Returning empty array - no real freelancers found in database');
    res.json([]);
    
  } catch (error) {
    console.error('❌ Error in freelancers API:', error);
    res.status(500).json({ message: "Failed to fetch freelancers from database" });
  }
});

// Serve static files from the dist/public directory (built React app)
app.use(express.static(path.join(__dirname, 'dist', 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// Serve the main React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Simple development server running on http://localhost:${PORT}`);
  console.log(`📊 Loaded ${areas.length} areas`);
  console.log(`🔍 Test the API: http://localhost:${PORT}/api/areas?query=Va`);
  console.log(`📋 All areas: http://localhost:${PORT}/api/areas/all`);
  console.log(`🌐 Open your browser and go to: http://localhost:${PORT}`);
});
