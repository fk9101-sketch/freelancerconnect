import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '@shared/schema';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5000'),
  database: process.env.DB_NAME || 'hirelocal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Jhotwara#321',
});

const db = drizzle(pool, { schema });

async function initializeCategories() {
  try {
    console.log('🔄 Initializing comprehensive categories database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Clear existing categories to prevent duplicates
    console.log('🔄 Clearing existing categories...');
    await db.delete(schema.categories);
    console.log('✅ Existing categories cleared');
    
    // Comprehensive categories list (200+ unique categories)
    const categories = [
      // Home & Construction Services (40 categories)
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
      { name: 'HVAC Technician', icon: 'fas fa-thermometer-half', color: '#74b9ff' },
      { name: 'Solar Panel Installer', icon: 'fas fa-solar-panel', color: '#fdcb6e' },
      { name: 'Security System Installer', icon: 'fas fa-shield-alt', color: '#00b894' },
      { name: 'Interior Designer', icon: 'fas fa-couch', color: '#a29bfe' },
      { name: 'Architect', icon: 'fas fa-building', color: '#74b9ff' },
      { name: 'Landscaper', icon: 'fas fa-tree', color: '#00b894' },
      { name: 'Pool Maintenance', icon: 'fas fa-swimming-pool', color: '#74b9ff' },
      { name: 'Housekeeper', icon: 'fas fa-home', color: '#96ceb4' },
      { name: 'Pet Sitter', icon: 'fas fa-paw', color: '#fdcb6e' },
      { name: 'Moving Service', icon: 'fas fa-truck', color: '#00cec9' },
      
      // Technology & Digital Services (35 categories)
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
      { name: 'DevOps Engineer', icon: 'fas fa-infinity', color: '#00cec9' },
      { name: 'Data Scientist', icon: 'fas fa-brain', color: '#6c5ce7' },
      { name: 'AI/ML Engineer', icon: 'fas fa-robot', color: '#fd79a8' },
      { name: 'Blockchain Developer', icon: 'fas fa-link', color: '#a29bfe' },
      { name: 'Game Developer', icon: 'fas fa-gamepad', color: '#6c5ce7' },
      { name: '3D Modeler', icon: 'fas fa-cube', color: '#74b9ff' },
      { name: 'Animator', icon: 'fas fa-play-circle', color: '#fd79a8' },
      { name: 'Sound Engineer', icon: 'fas fa-volume-up', color: '#00cec9' },
      { name: 'Podcast Producer', icon: 'fas fa-podcast', color: '#fdcb6e' },
      { name: 'Voice Actor', icon: 'fas fa-microphone-alt', color: '#a29bfe' },
      { name: 'Film Maker', icon: 'fas fa-film', color: '#e17055' },
      { name: 'Illustrator', icon: 'fas fa-pencil-alt', color: '#ff7675' },
      { name: 'Comic Artist', icon: 'fas fa-comic', color: '#a29bfe' },
      { name: 'Calligrapher', icon: 'fas fa-pen-nib', color: '#00b894' },
      { name: 'Photographer', icon: 'fas fa-camera', color: '#fdcb6e' },
      { name: 'Videographer', icon: 'fas fa-video', color: '#e17055' },
      { name: 'Social Media Manager', icon: 'fas fa-share-alt', color: '#fd79a8' },
      { name: 'Email Marketer', icon: 'fas fa-envelope', color: '#74b9ff' },
      { name: 'PPC Specialist', icon: 'fas fa-ad', color: '#00cec9' },
      { name: 'Conversion Optimizer', icon: 'fas fa-chart-line', color: '#fdcb6e' },
      { name: 'E-commerce Developer', icon: 'fas fa-shopping-cart', color: '#a29bfe' },
      { name: 'WordPress Developer', icon: 'fas fa-wordpress', color: '#6c5ce7' },
      { name: 'Shopify Developer', icon: 'fas fa-store', color: '#fd79a8' },
      { name: 'API Developer', icon: 'fas fa-code', color: '#00cec9' },
      { name: 'Database Administrator', icon: 'fas fa-database', color: '#636e72' },
      { name: 'Network Engineer', icon: 'fas fa-network-wired', color: '#74b9ff' },
      { name: 'Cybersecurity Expert', icon: 'fas fa-shield-virus', color: '#ff7675' },
      
      // Professional Services (30 categories)
      { name: 'Tutor', icon: 'fas fa-chalkboard-teacher', color: '#6c5ce7' },
      { name: 'Designer', icon: 'fas fa-palette', color: '#fd79a8' },
      { name: 'Developer', icon: 'fas fa-code', color: '#00cec9' },
      { name: 'Event Manager', icon: 'fas fa-calendar-alt', color: '#e17055' },
      { name: 'Makeup Artist', icon: 'fas fa-magic', color: '#ff7675' },
      { name: 'Lawyer', icon: 'fas fa-balance-scale', color: '#636e72' },
      { name: 'Accountant', icon: 'fas fa-calculator', color: '#00b894' },
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
      { name: 'Real Estate Agent', icon: 'fas fa-home', color: '#a29bfe' },
      { name: 'Insurance Agent', icon: 'fas fa-shield-alt', color: '#00b894' },
      { name: 'Travel Agent', icon: 'fas fa-plane', color: '#74b9ff' },
      { name: 'Wedding Planner', icon: 'fas fa-heart', color: '#fd79a8' },
      { name: 'Personal Stylist', icon: 'fas fa-tshirt', color: '#fdcb6e' },
      { name: 'Life Coach', icon: 'fas fa-lightbulb', color: '#a29bfe' },
      { name: 'Career Counselor', icon: 'fas fa-graduation-cap', color: '#6c5ce7' },
      { name: 'Nutritionist', icon: 'fas fa-apple-alt', color: '#fd79a8' },
      { name: 'Personal Trainer', icon: 'fas fa-dumbbell', color: '#00b894' },
      { name: 'Yoga Instructor', icon: 'fas fa-pray', color: '#a29bfe' },
      { name: 'Massage Therapist', icon: 'fas fa-hands', color: '#fdcb6e' },
      { name: 'Physiotherapist', icon: 'fas fa-heartbeat', color: '#ff7675' },
      { name: 'Beauty Therapist', icon: 'fas fa-spa', color: '#e17055' },
      { name: 'Hair Stylist', icon: 'fas fa-cut', color: '#74b9ff' },
      { name: 'Nail Technician', icon: 'fas fa-hand-sparkles', color: '#6c5ce7' },
      { name: 'Dental Hygienist', icon: 'fas fa-tooth', color: '#00cec9' },
      { name: 'Optometrist', icon: 'fas fa-eye', color: '#636e72' },
      
      // Education & Training (25 categories)
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
      { name: 'Math Tutor', icon: 'fas fa-square-root-alt', color: '#fd79a8' },
      { name: 'Science Tutor', icon: 'fas fa-flask', color: '#a29bfe' },
      { name: 'English Tutor', icon: 'fas fa-book-open', color: '#fdcb6e' },
      { name: 'History Tutor', icon: 'fas fa-landmark', color: '#e17055' },
      { name: 'Computer Science Tutor', icon: 'fas fa-laptop-code', color: '#74b9ff' },
      { name: 'Spanish Teacher', icon: 'fas fa-language', color: '#00cec9' },
      { name: 'French Teacher', icon: 'fas fa-language', color: '#6c5ce7' },
      { name: 'German Teacher', icon: 'fas fa-language', color: '#fd79a8' },
      { name: 'Chinese Teacher', icon: 'fas fa-language', color: '#a29bfe' },
      { name: 'Japanese Teacher', icon: 'fas fa-language', color: '#fdcb6e' },
      { name: 'Arabic Teacher', icon: 'fas fa-language', color: '#e17055' },
      { name: 'Hindi Teacher', icon: 'fas fa-language', color: '#74b9ff' },
      { name: 'Guitar Teacher', icon: 'fas fa-guitar', color: '#00cec9' },
      { name: 'Piano Teacher', icon: 'fas fa-music', color: '#6c5ce7' },
      { name: 'Violin Teacher', icon: 'fas fa-music', color: '#fd79a8' },
      { name: 'Drum Teacher', icon: 'fas fa-drum', color: '#a29bfe' },
      { name: 'Singing Coach', icon: 'fas fa-microphone', color: '#fdcb6e' },
      
      // Creative & Media (20 categories)
      { name: 'Logo Designer', icon: 'fas fa-palette', color: '#ff7675' },
      { name: 'Brand Designer', icon: 'fas fa-trademark', color: '#a29bfe' },
      { name: 'Packaging Designer', icon: 'fas fa-box', color: '#fdcb6e' },
      { name: 'Print Designer', icon: 'fas fa-print', color: '#e17055' },
      { name: 'Web Designer', icon: 'fas fa-desktop', color: '#74b9ff' },
      { name: 'Mobile App Designer', icon: 'fas fa-mobile-alt', color: '#00cec9' },
      { name: 'Icon Designer', icon: 'fas fa-icons', color: '#6c5ce7' },
      { name: 'Typography Designer', icon: 'fas fa-font', color: '#fd79a8' },
      { name: 'Layout Designer', icon: 'fas fa-th-large', color: '#a29bfe' },
      { name: 'Poster Designer', icon: 'fas fa-image', color: '#fdcb6e' },
      { name: 'Brochure Designer', icon: 'fas fa-file-alt', color: '#e17055' },
      { name: 'Business Card Designer', icon: 'fas fa-id-card', color: '#74b9ff' },
      { name: 'T-Shirt Designer', icon: 'fas fa-tshirt', color: '#00cec9' },
      { name: 'Sticker Designer', icon: 'fas fa-sticky-note', color: '#6c5ce7' },
      { name: 'Banner Designer', icon: 'fas fa-flag', color: '#fd79a8' },
      { name: 'Social Media Designer', icon: 'fas fa-share-alt', color: '#a29bfe' },
      { name: 'Email Designer', icon: 'fas fa-envelope', color: '#fdcb6e' },
      { name: 'Presentation Designer', icon: 'fas fa-presentation', color: '#e17055' },
      { name: 'Infographic Designer', icon: 'fas fa-chart-pie', color: '#74b9ff' },
      { name: 'Character Designer', icon: 'fas fa-user', color: '#00cec9' },
      
      // Specialized Services (20 categories)
      { name: 'Pet Groomer', icon: 'fas fa-paw', color: '#fdcb6e' },
      { name: 'Pet Trainer', icon: 'fas fa-dog', color: '#fd79a8' },
      { name: 'House Sitter', icon: 'fas fa-home', color: '#a29bfe' },
      { name: 'Babysitter', icon: 'fas fa-baby', color: '#ff7675' },
      { name: 'Elder Care', icon: 'fas fa-user-friends', color: '#74b9ff' },
      { name: 'Storage Organizer', icon: 'fas fa-boxes', color: '#00cec9' },
      { name: 'Feng Shui Consultant', icon: 'fas fa-yin-yang', color: '#a29bfe' },
      { name: 'Astrologer', icon: 'fas fa-star', color: '#fdcb6e' },
      { name: 'Tarot Reader', icon: 'fas fa-cards', color: '#fd79a8' },
      { name: 'Meditation Guide', icon: 'fas fa-om', color: '#e17055' },
      { name: 'Reiki Healer', icon: 'fas fa-hands', color: '#74b9ff' },
      { name: 'Crystal Healer', icon: 'fas fa-gem', color: '#00cec9' },
      { name: 'Herbalist', icon: 'fas fa-leaf', color: '#6c5ce7' },
      { name: 'Aromatherapist', icon: 'fas fa-spray-can', color: '#fd79a8' },
      { name: 'Hypnotherapist', icon: 'fas fa-eye', color: '#a29bfe' },
      { name: 'Life Coach', icon: 'fas fa-lightbulb', color: '#fdcb6e' },
      { name: 'Business Coach', icon: 'fas fa-briefcase', color: '#e17055' },
      { name: 'Career Coach', icon: 'fas fa-graduation-cap', color: '#74b9ff' },
      { name: 'Relationship Coach', icon: 'fas fa-heart', color: '#00cec9' },
      { name: 'Fitness Coach', icon: 'fas fa-dumbbell', color: '#6c5ce7' },
      { name: 'Wellness Coach', icon: 'fas fa-heart', color: '#fd79a8' },
      
      // Other (for custom categories)
      { name: 'Other', icon: 'fas fa-plus-circle', color: '#636e72' }
    ];
    
    console.log(`🔄 Inserting ${categories.length} unique categories...`);
    
    // Insert categories with conflict handling
    for (const category of categories) {
      await db.insert(schema.categories).values(category).onConflictDoNothing();
    }
    
    console.log('✅ Comprehensive categories created successfully!');
    console.log(`📊 Total categories in database: ${categories.length}`);
    
  } catch (error) {
    console.error('❌ Category initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeCategories().catch(console.error);
}

export { initializeCategories };
