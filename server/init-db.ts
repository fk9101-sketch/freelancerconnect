import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '@shared/schema';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  host: process.env.NEON_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.NEON_PORT || process.env.DB_PORT || '5432'),
  database: process.env.NEON_DATABASE || process.env.DB_NAME || 'hirelocal',
  user: process.env.NEON_USER || process.env.DB_USER || 'postgres',
  password: process.env.NEON_PASSWORD || process.env.DB_PASSWORD,
  ssl: process.env.NEON_HOST ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, { schema });

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Run migrations
    console.log('🔄 Running migrations...');
    try {
      await migrate(db, { migrationsFolder: './migrations' });
      console.log('✅ Migrations completed');
    } catch (error) {
      console.log('⚠️ Migration error (this may be expected):', error.message);
      // Continue with initialization even if migrations fail
      console.log('🔄 Continuing with database setup...');
    }
    
    // Insert comprehensive categories if they don't exist
    console.log('🔄 Setting up comprehensive categories...');
    const categories = [
      // Home Services
      { name: 'Plumber', icon: 'fas fa-wrench', color: '#4ecdc4' },
      { name: 'Electrician', icon: 'fas fa-bolt', color: '#ff6b6b' },
      { name: 'Carpenter', icon: 'fas fa-hammer', color: '#45b7d1' },
      { name: 'Painter', icon: 'fas fa-paint-brush', color: '#feca57' },
      { name: 'Cleaner', icon: 'fas fa-broom', color: '#96ceb4' },
      { name: 'AC Repair', icon: 'fas fa-snowflake', color: '#74b9ff' },
      { name: 'Mechanic', icon: 'fas fa-tools', color: '#fd79a8' },
      { name: 'Gardener', icon: 'fas fa-leaf', color: '#ff9ff3' },
      { name: 'Tailor', icon: 'fas fa-cut', color: '#a29bfe' },
      { name: 'Driver', icon: 'fas fa-car', color: '#00b894' },
      
      // Professional Services
      { name: 'Tutor', icon: 'fas fa-chalkboard-teacher', color: '#6c5ce7' },
      { name: 'Designer', icon: 'fas fa-palette', color: '#fd79a8' },
      { name: 'Developer', icon: 'fas fa-code', color: '#00cec9' },
      { name: 'Photographer', icon: 'fas fa-camera', color: '#fdcb6e' },
      { name: 'Event Manager', icon: 'fas fa-calendar-alt', color: '#e17055' },
      { name: 'Makeup Artist', icon: 'fas fa-magic', color: '#ff7675' },
      { name: 'Interior Designer', icon: 'fas fa-couch', color: '#a29bfe' },
      { name: 'Architect', icon: 'fas fa-building', color: '#74b9ff' },
      { name: 'Lawyer', icon: 'fas fa-balance-scale', color: '#636e72' },
      { name: 'Accountant', icon: 'fas fa-calculator', color: '#00b894' },
      
      // Skilled Trades
      { name: 'Welder', icon: 'fas fa-fire', color: '#e17055' },
      { name: 'Mason', icon: 'fas fa-hammer', color: '#636e72' },
      { name: 'Roofer', icon: 'fas fa-home', color: '#fdcb6e' },
      { name: 'Plasterer', icon: 'fas fa-trowel', color: '#a29bfe' },
      { name: 'Tiler', icon: 'fas fa-th', color: '#74b9ff' },
      { name: 'Glazier', icon: 'fas fa-window-maximize', color: '#00cec9' },
      { name: 'Furniture Maker', icon: 'fas fa-chair', color: '#fd79a8' },
      { name: 'Blacksmith', icon: 'fas fa-fire', color: '#636e72' },
      { name: 'Potter', icon: 'fas fa-circle', color: '#e17055' },
      { name: 'Jeweler', icon: 'fas fa-gem', color: '#fdcb6e' },
      
      // Technology & Digital
      { name: 'Web Developer', icon: 'fas fa-globe', color: '#00cec9' },
      { name: 'Mobile Developer', icon: 'fas fa-mobile-alt', color: '#6c5ce7' },
      { name: 'Data Analyst', icon: 'fas fa-chart-bar', color: '#00b894' },
      { name: 'SEO Specialist', icon: 'fas fa-search', color: '#fdcb6e' },
      { name: 'Digital Marketer', icon: 'fas fa-bullhorn', color: '#fd79a8' },
      { name: 'Content Writer', icon: 'fas fa-pen-fancy', color: '#a29bfe' },
      { name: 'Video Editor', icon: 'fas fa-video', color: '#e17055' },
      { name: 'Graphic Designer', icon: 'fas fa-paint-brush', color: '#ff7675' },
      { name: 'UI/UX Designer', icon: 'fas fa-desktop', color: '#74b9ff' },
      { name: 'System Administrator', icon: 'fas fa-server', color: '#636e72' },
      
      // Health & Wellness
      { name: 'Personal Trainer', icon: 'fas fa-dumbbell', color: '#00b894' },
      { name: 'Yoga Instructor', icon: 'fas fa-pray', color: '#a29bfe' },
      { name: 'Massage Therapist', icon: 'fas fa-hands', color: '#fdcb6e' },
      { name: 'Nutritionist', icon: 'fas fa-apple-alt', color: '#fd79a8' },
      { name: 'Physiotherapist', icon: 'fas fa-heartbeat', color: '#ff7675' },
      { name: 'Beauty Therapist', icon: 'fas fa-spa', color: '#e17055' },
      { name: 'Hair Stylist', icon: 'fas fa-cut', color: '#74b9ff' },
      { name: 'Nail Technician', icon: 'fas fa-hand-sparkles', color: '#6c5ce7' },
      { name: 'Dental Hygienist', icon: 'fas fa-tooth', color: '#00cec9' },
      { name: 'Optometrist', icon: 'fas fa-eye', color: '#636e72' },
      
      // Education & Training
      { name: 'Language Teacher', icon: 'fas fa-language', color: '#a29bfe' },
      { name: 'Music Teacher', icon: 'fas fa-music', color: '#fdcb6e' },
      { name: 'Dance Instructor', icon: 'fas fa-dancing', color: '#fd79a8' },
      { name: 'Art Teacher', icon: 'fas fa-palette', color: '#ff7675' },
      { name: 'Cooking Instructor', icon: 'fas fa-utensils', color: '#e17055' },
      { name: 'Driving Instructor', icon: 'fas fa-car-side', color: '#74b9ff' },
      { name: 'Swimming Instructor', icon: 'fas fa-swimming-pool', color: '#00cec9' },
      { name: 'Martial Arts Instructor', icon: 'fas fa-fist-raised', color: '#636e72' },
      { name: 'Chess Coach', icon: 'fas fa-chess', color: '#6c5ce7' },
      { name: 'Public Speaking Coach', icon: 'fas fa-microphone', color: '#00b894' },
      
      // Business & Professional
      { name: 'Business Consultant', icon: 'fas fa-briefcase', color: '#636e72' },
      { name: 'Financial Advisor', icon: 'fas fa-chart-line', color: '#00b894' },
      { name: 'HR Consultant', icon: 'fas fa-users', color: '#74b9ff' },
      { name: 'Marketing Consultant', icon: 'fas fa-bullhorn', color: '#fd79a8' },
      { name: 'Sales Trainer', icon: 'fas fa-chart-line', color: '#fdcb6e' },
      { name: 'Project Manager', icon: 'fas fa-tasks', color: '#a29bfe' },
      { name: 'Translator', icon: 'fas fa-language', color: '#e17055' },
      { name: 'Virtual Assistant', icon: 'fas fa-laptop', color: '#6c5ce7' },
      { name: 'Bookkeeper', icon: 'fas fa-book', color: '#00cec9' },
      { name: 'Tax Consultant', icon: 'fas fa-file-invoice-dollar', color: '#ff7675' },
      
      // Creative & Media
      { name: 'Voice Actor', icon: 'fas fa-microphone-alt', color: '#a29bfe' },
      { name: 'Podcast Producer', icon: 'fas fa-podcast', color: '#fdcb6e' },
      { name: 'Film Maker', icon: 'fas fa-film', color: '#e17055' },
      { name: 'Animator', icon: 'fas fa-play-circle', color: '#fd79a8' },
      { name: 'Illustrator', icon: 'fas fa-pencil-alt', color: '#ff7675' },
      { name: '3D Modeler', icon: 'fas fa-cube', color: '#74b9ff' },
      { name: 'Sound Engineer', icon: 'fas fa-volume-up', color: '#00cec9' },
      { name: 'Game Developer', icon: 'fas fa-gamepad', color: '#6c5ce7' },
      { name: 'Comic Artist', icon: 'fas fa-comic', color: '#a29bfe' },
      { name: 'Calligrapher', icon: 'fas fa-pen-nib', color: '#00b894' },
      
      // Specialized Services
      { name: 'Pet Groomer', icon: 'fas fa-paw', color: '#fdcb6e' },
      { name: 'Pet Trainer', icon: 'fas fa-dog', color: '#fd79a8' },
      { name: 'House Sitter', icon: 'fas fa-home', color: '#a29bfe' },
      { name: 'Babysitter', icon: 'fas fa-baby', color: '#ff7675' },
      { name: 'Elder Care', icon: 'fas fa-user-friends', color: '#74b9ff' },
      { name: 'Moving Service', icon: 'fas fa-truck', color: '#00cec9' },
      { name: 'Storage Organizer', icon: 'fas fa-boxes', color: '#6c5ce7' },
      { name: 'Feng Shui Consultant', icon: 'fas fa-yin-yang', color: '#a29bfe' },
      { name: 'Astrologer', icon: 'fas fa-star', color: '#fdcb6e' },
      { name: 'Tarot Reader', icon: 'fas fa-cards', color: '#fd79a8' },
      
      // Maintenance & Repair
      { name: 'Appliance Repair', icon: 'fas fa-tools', color: '#fd79a8' },
      { name: 'Computer Repair', icon: 'fas fa-laptop', color: '#6c5ce7' },
      { name: 'Phone Repair', icon: 'fas fa-mobile-alt', color: '#00cec9' },
      { name: 'Watch Repair', icon: 'fas fa-clock', color: '#fdcb6e' },
      { name: 'Shoe Repair', icon: 'fas fa-shoe-prints', color: '#a29bfe' },
      { name: 'Bicycle Repair', icon: 'fas fa-bicycle', color: '#74b9ff' },
      { name: 'Musical Instrument Repair', icon: 'fas fa-music', color: '#e17055' },
      { name: 'Jewelry Repair', icon: 'fas fa-gem', color: '#ff7675' },
      { name: 'Furniture Repair', icon: 'fas fa-couch', color: '#636e72' },
      { name: 'Electronics Repair', icon: 'fas fa-microchip', color: '#00b894' },
      
      // Other (for custom categories)
      { name: 'Other', icon: 'fas fa-plus-circle', color: '#636e72' }
    ];
    
    for (const category of categories) {
      await db.insert(schema.categories).values(category).onConflictDoNothing();
    }
    
    console.log('✅ Comprehensive categories created');
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().catch(console.error);
}

export { initializeDatabase };
