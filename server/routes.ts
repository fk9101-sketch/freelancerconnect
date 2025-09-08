import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertLeadSchema, insertFreelancerProfileSchema, insertSubscriptionSchema, insertLeadInterestSchema, insertPaymentSchema, insertInquirySchema, insertReviewSchema, subscriptions, reviews, leads, users, categories } from "@shared/schema";
import { z } from "zod";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getRazorpayConfig, verifyRazorpaySignature } from './razorpay-config';
import { validatePassword, hashPassword, isPasswordAcceptable } from './passwordValidation';
import { upload, ImageProcessingService, handleUploadError, serveStaticFiles } from './fileUploadService';
// notifyUser function will be defined locally for WebSocket notifications
import type { 
  User, 
  InsertUser, 
  FreelancerProfile, 
  InsertFreelancerProfile, 
  Lead, 
  InsertLead, 
  LeadWithRelations,
  FreelancerWithRelations,
  Subscription, 
  InsertSubscription, 
  Category, 
  InsertCategory, 
  Area, 
  InsertArea,
  Payment,
  InsertPayment,
  Inquiry,
  Review,
  InsertReview
} from '../shared/schema';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Razorpay configuration
const config = getRazorpayConfig();
console.log('🔧 Razorpay Configuration:', {
  keyId: config.KEY_ID,
  keySecret: config.KEY_SECRET ? `${config.KEY_SECRET.substring(0, 10)}...` : 'NOT SET',
  environment: 'TEST'
});

const razorpay = new Razorpay({
  key_id: config.KEY_ID,
  key_secret: config.KEY_SECRET,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Static file serving for uploads
  serveStaticFiles(app);

  // WebSocket server for real-time notifications
  const httpServer = createServer(app);
  let wss: WebSocketServer | undefined;
  const connectedClients = new Map<string, WebSocket>();

  // Enable WebSocket for real-time notifications
  try {
    wss = new WebSocketServer({ server: httpServer });
    console.log('WebSocket server enabled for real-time notifications');
    
    wss.on('connection', (ws, req) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId');
      
      if (userId) {
        connectedClients.set(userId, ws);
        console.log(`WebSocket client connected: ${userId}`);
      }
      
      ws.on('close', () => {
        if (userId) {
          connectedClients.delete(userId);
          console.log(`WebSocket client disconnected: ${userId}`);
        }
      });
    });
  } catch (error) {
    console.log('WebSocket server could not be started:', error);
    console.log('Real-time features will use polling instead');
  }

  // Broadcast notification to specific user
  const notifyUser = (userId: string, data: any) => {
    console.log(`🔔 Attempting to notify user ${userId} with data:`, data);
    
    if (!wss) {
      console.warn('WebSocket server not available, skipping notification');
      return;
    }
    
    const client = connectedClients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(data));
        console.log(`✅ Notification sent successfully to user ${userId}`);
      } catch (error) {
        console.error(`❌ Failed to send notification to user ${userId}:`, error);
      }
    } else {
      console.log(`⚠️ User ${userId} not connected via WebSocket, notification will be delivered via polling`);
    }
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Try to get user from storage, if not found create a mock user for development
      let user;
      try {
        user = await storage.getUser(userId);
      } catch (error) {
        // For development, create a mock user if not found
        if (process.env.NODE_ENV === 'development') {
          user = {
            id: userId,
            email: `user_${userId}@example.com`,
            firstName: 'Dev',
            lastName: 'User',
            role: 'freelancer',
            profileImageUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        } else {
          throw error;
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Role selection
  app.post('/api/auth/select-role', isAuthenticated, async (req: any, res) => {
    try {
      const { role } = req.body;
      const userId = req.user.claims.sub;
      
      if (!['customer', 'freelancer', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      await storage.updateUserRole(userId, role);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Create or update user after Google Sign-In
  app.post('/api/auth/google-signin', async (req: any, res) => {
    try {
      console.log('Google sign-in request received:', req.body);
      const { user: firebaseUser, role } = req.body;
      
      if (!firebaseUser || !firebaseUser.uid || !role) {
        console.log('Missing required fields:', { firebaseUser: !!firebaseUser, uid: firebaseUser?.uid, role });
        return res.status(400).json({ message: "User data and role are required" });
      }
      
      if (!['customer', 'freelancer', 'admin'].includes(role)) {
        console.log('Invalid role:', role);
        return res.status(400).json({ message: "Invalid role" });
      }
      
      console.log('Creating/updating user with data:', {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role
      });
      
      // Create or update user in database
      const userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        profileImageUrl: firebaseUser.photoURL || null,
        role: role as 'customer' | 'freelancer' | 'admin',
      };
      
      const user = await storage.upsertUser(userData);
      console.log('User created/updated successfully:', user.id);
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileImageUrl: user.profileImageUrl
        }
      });
    } catch (error) {
      console.error("Error in Google sign-in:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get user by Firebase UID
  app.get('/api/auth/user/:uid', async (req, res) => {
    try {
      const { uid } = req.params;
      
      if (!uid) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
      
      // Get user from database
      const user = await storage.getUser(uid);
      
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          area: user.area,
          profileImageUrl: user.profileImageUrl
        }
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
  });

  // Create user after Firebase authentication
  app.post('/api/auth/create-user', async (req, res) => {
    try {
      const { uid, email, role, firstName, lastName, area } = req.body;
      
      if (!uid || !email || !role) {
        return res.status(400).json({ success: false, message: "UID, email, and role are required" });
      }
      
      if (!['customer', 'freelancer', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role" });
      }
      
      // Create user in database
      const userData = {
        id: uid,
        email: email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: role as 'customer' | 'freelancer' | 'admin',
        area: area || 'Jaipur', // Default area
        phone: '',
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const user = await storage.upsertUser(userData);
      console.log('New user created successfully:', user.id);
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          area: user.area
        }
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ success: false, message: "Failed to create user" });
    }
  });

  // Email signup endpoint
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, fullName, area, role, phone, categoryId, customCategory } = req.body;
      
      // Validate required fields
      if (!email || !password || !fullName || !area || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Validate category for freelancers
      if (role === 'freelancer') {
        if (!categoryId && !customCategory) {
          return res.status(400).json({ message: "Service category is required for freelancers" });
        }
        if (customCategory && customCategory.trim().length < 3) {
          return res.status(400).json({ message: "Custom category must be at least 3 characters long" });
        }
      }
      
      if (!['customer', 'freelancer'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Validate password strength using strong password policy
      const passwordValidation = validatePassword(password, email, phone, fullName);
      if (!isPasswordAcceptable(passwordValidation)) {
        return res.status(400).json({ 
          message: "Password does not meet security requirements",
          errors: passwordValidation.errors,
          strength: passwordValidation.strength
        });
      }
      
      // Validate area against the database if provided
      if (area) {
        const areas = await storage.getAreas();
        const areaExists = areas.some(a => a.name.toLowerCase() === area.toLowerCase());
        
        if (!areaExists) {
          return res.status(400).json({ 
            message: "Invalid area selected. Please select from the available areas.",
            availableAreas: areas.slice(0, 10).map(a => a.name) // Show first 10 for reference
          });
        }
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Create user in Firebase Auth
      let firebaseUser;
      try {
        const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
        const { initializeApp: initApp, getApps } = await import('firebase/app');
        
        // Initialize Firebase for server (avoid multiple instances)
        const firebaseConfig = {
          apiKey: "AIzaSyC4n_Cum0CvMyrIIWiehMltWO92MYnCvgw",
          authDomain: "freelancer-connect-899a8.firebaseapp.com",
          projectId: "freelancer-connect-899a8",
          storageBucket: "freelancer-connect-899a8.firebasestorage.app",
          messagingSenderId: "224541104230",
          appId: "1:224541104230:web:62bb08bdd9ae55872a35a7",
          measurementId: "G-GXMBYGFZPF"
        };
        
        // Check if Firebase is already initialized
        const apps = getApps();
        let app;
        if (apps.length === 0) {
          app = initApp(firebaseConfig);
        } else {
          app = apps[0];
        }
        
        const auth = getAuth(app);
        
        console.log('Creating Firebase user with email:', email);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        console.log('Firebase user created successfully:', firebaseUser.uid);
      } catch (firebaseError: any) {
        console.error('Firebase auth error:', firebaseError);
        
        if (firebaseError.code === 'auth/operation-not-allowed') {
          return res.status(400).json({ 
            message: "Email/password authentication is not enabled. Please enable it in Firebase Console: Authentication > Sign-in method > Email/Password > Enable" 
          });
        } else if (firebaseError.code === 'auth/email-already-in-use') {
          return res.status(400).json({ message: "An account with this email already exists." });
        } else if (firebaseError.code === 'auth/weak-password') {
          return res.status(400).json({ message: "Password is too weak. Please choose a stronger password (at least 6 characters)." });
        } else if (firebaseError.code === 'auth/invalid-email') {
          return res.status(400).json({ message: "Invalid email format." });
        } else {
          console.error('Unexpected Firebase error:', firebaseError);
          return res.status(500).json({ 
            message: `Authentication error: ${firebaseError.message}` 
          });
        }
      }
      
      // Parse full name into first and last name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Create user in database
      const userData = {
        id: firebaseUser.uid,
        email,
        firstName,
        lastName,
        role,
        area,
        profileImageUrl: null,
      };
      
      const user = await storage.upsertUser(userData);
      
      // Create freelancer profile if role is freelancer
      if (role === 'freelancer') {
        try {
          const profileData = {
            userId: user.id,
            fullName: fullName,
            categoryId: categoryId || null,
            customCategory: customCategory || null,
            area: area,
            isAvailable: true,
          };
          
          await storage.upsertFreelancerProfile(user.id, profileData);
          console.log('Freelancer profile created successfully for user:', user.id);
        } catch (profileError) {
          console.error('Error creating freelancer profile:', profileError);
          // Don't fail the signup if profile creation fails, but log it
        }
      }
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          area: user.area
        }
      });
    } catch (error: any) {
      console.error("Error in signup:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        return res.status(400).json({ message: "User with this email already exists" });
      } else if (error.code === 'auth/weak-password') {
        return res.status(400).json({ message: "Password is too weak" });
      } else if (error.code === 'auth/invalid-email') {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Enhanced freelancer signup endpoint
  app.post('/api/auth/freelancer-signup', async (req, res) => {
    try {
      const { 
        email, 
        password, 
        fullName, 
        phone, 
        professionalTitle,
        bio,
        experience,
        experienceDescription,
        hourlyRate,
        area,
        skills,
        profilePhotoUrl,
        categoryId,
        customCategory
      } = req.body;
      
      // Validate required fields
      if (!email || !password || !fullName || !phone || !professionalTitle || !bio || !experience || !hourlyRate || !area) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }
      
      // Validate category for freelancers
      if (!categoryId && !customCategory) {
        return res.status(400).json({ message: "Service category is required for freelancers" });
      }
      if (customCategory && customCategory.trim().length < 3) {
        return res.status(400).json({ message: "Custom category must be at least 3 characters long" });
      }

      // Validate area against the database
      if (area) {
        const areas = await storage.getAreas();
        const areaExists = areas.some(a => a.name.toLowerCase() === area.toLowerCase());
        
        if (!areaExists) {
          return res.status(400).json({ 
            message: "Invalid area selected. Please select from the available areas.",
            availableAreas: areas.slice(0, 10).map(a => a.name) // Show first 10 for reference
          });
        }
      }



      // Validate skills
      if (!skills || !Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({ message: "At least one skill is required" });
      }

      // Validate bio length
      if (bio.trim().length < 50) {
        return res.status(400).json({ message: "Bio must be at least 50 characters long" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Validate password strength using strong password policy
      const passwordValidation = validatePassword(password, email, phone, fullName);
      if (!isPasswordAcceptable(passwordValidation)) {
        return res.status(400).json({ 
          message: "Password does not meet security requirements",
          errors: passwordValidation.errors,
          strength: passwordValidation.strength
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Create user in Firebase Auth
      let firebaseUser;
      try {
        const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
        const { initializeApp: initApp, getApps } = await import('firebase/app');
        
        // Initialize Firebase for server (avoid multiple instances)
        const firebaseConfig = {
          apiKey: "AIzaSyC4n_Cum0CvMyrIIWiehMltWO92MYnCvgw",
          authDomain: "freelancer-connect-899a8.firebaseapp.com",
          projectId: "freelancer-connect-899a8",
          storageBucket: "freelancer-connect-899a8.firebasestorage.app",
          messagingSenderId: "224541104230",
          appId: "1:224541104230:web:62bb08bdd9ae55872a35a7",
          measurementId: "G-GXMBYGFZPF"
        };
        
        // Check if Firebase is already initialized
        const apps = getApps();
        let app;
        if (apps.length === 0) {
          app = initApp(firebaseConfig);
        } else {
          app = apps[0];
        }
        
        const auth = getAuth(app);
        
        console.log('Creating Firebase user with email:', email);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        console.log('Firebase user created successfully:', firebaseUser.uid);
      } catch (firebaseError: any) {
        console.error('Firebase auth error:', firebaseError);
        
        if (firebaseError.code === 'auth/operation-not-allowed') {
          return res.status(400).json({ 
            message: "Email/password authentication is not enabled. Please enable it in Firebase Console: Authentication > Sign-in method > Email/Password > Enable" 
          });
        } else if (firebaseError.code === 'auth/email-already-in-use') {
          return res.status(400).json({ message: "An account with this email already exists." });
        } else if (firebaseError.code === 'auth/weak-password') {
          return res.status(400).json({ message: "Password is too weak. Please choose a stronger password (at least 6 characters)." });
        } else if (firebaseError.code === 'auth/invalid-email') {
          return res.status(400).json({ message: "Invalid email format." });
        } else {
          console.error('Unexpected Firebase error:', firebaseError);
          return res.status(500).json({ 
            message: `Authentication error: ${firebaseError.message}` 
          });
        }
      }
      
      // Parse full name into first and last name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Create user in database with better error handling
      const userData = {
        id: firebaseUser.uid,
        email,
        firstName,
        lastName,
        role: 'freelancer',
        area,
        phone,
        profileImageUrl: profilePhotoUrl || null,
      };
      
      let user;
      try {
        user = await storage.upsertUser(userData);
        console.log('User created/updated successfully:', user.id);
      } catch (userError) {
        console.error('Error creating user:', userError);
        throw new Error('Failed to create user account. Please try again.');
      }
      
      // Create comprehensive freelancer profile with better error handling
      try {
        const profileData = {
          userId: user.id,
          fullName: fullName,
          professionalTitle: professionalTitle,
          bio: bio,
          experience: experience,
          experienceDescription: experienceDescription || '',
          hourlyRate: hourlyRate,
          area: area,
  
          skills: skills,
          profilePhotoUrl: profilePhotoUrl || null,
          categoryId: categoryId || null,
          customCategory: customCategory || null,
          isAvailable: true,
          verificationStatus: 'pending',
        };
        
        // Add a small delay to ensure user creation is committed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await storage.upsertFreelancerProfile(user.id, profileData, userData);
        console.log('Comprehensive freelancer profile created successfully for user:', user.id);
      } catch (profileError) {
        console.error('Error creating freelancer profile:', profileError);
        // If profile creation fails, we should still return success but log the error
        // The user can complete their profile later
        console.log('User account created but profile creation failed. User can complete profile later.');
      }
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          area: user.area
        }
      });
    } catch (error: any) {
      console.error("Error in freelancer signup:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        return res.status(400).json({ message: "User with this email already exists" });
      } else if (error.code === 'auth/weak-password') {
        return res.status(400).json({ message: "Password is too weak" });
      } else if (error.code === 'auth/invalid-email') {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Provide more specific error messages
      if (error.message) {
        if (error.message.includes('Failed to create user account')) {
          return res.status(500).json({ message: error.message });
        }
        if (error.message.includes('Failed to save freelancer profile')) {
          return res.status(500).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: "Failed to create freelancer account. Please try again." });
    }
  });

  // Test freelancer profile creation
  app.post('/api/auth/test-freelancer-profile', async (req, res) => {
    try {
      const { userId, profileData, userData } = req.body;
      
      console.log('Testing freelancer profile creation...');
      console.log('User ID:', userId);
      console.log('Profile Data:', profileData);
      console.log('User Data:', userData);
      
      // Test user creation first
      let user;
      try {
        user = await storage.upsertUser(userData);
        console.log('✅ User created successfully:', user.id);
      } catch (userError) {
        console.error('❌ User creation failed:', userError);
        return res.status(500).json({ 
          success: false, 
          error: 'User creation failed',
          details: userError.message 
        });
      }
      
      // Test profile creation
      try {
        const profile = await storage.upsertFreelancerProfile(userId, profileData, userData);
        console.log('✅ Profile created successfully:', profile.id);
        res.json({ 
          success: true, 
          user: user,
          profile: profile 
        });
      } catch (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        res.status(500).json({ 
          success: false, 
          error: 'Profile creation failed',
          details: profileError.message,
          user: user
        });
      }
    } catch (error: any) {
      console.error('Test endpoint error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Test failed',
        details: error.message 
      });
    }
  });

  // Test Firebase configuration
  app.get('/api/auth/test-firebase', async (req, res) => {
    try {
      const { getAuth } = await import('firebase/auth');
      const { initializeApp } = await import('firebase/app');
      
      const firebaseConfig = {
        apiKey: "AIzaSyC4n_Cum0CvMyrIIWiehMltWO92MYnCvgw",
        authDomain: "freelancer-connect-899a8.firebaseapp.com",
        projectId: "freelancer-connect-899a8",
        storageBucket: "freelancer-connect-899a8.firebasestorage.app",
        messagingSenderId: "224541104230",
        appId: "1:224541104230:web:62bb08bdd9ae55872a35a7",
        measurementId: "G-GXMBYGFZPF"
      };
      
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      
      res.json({ 
        success: true, 
        message: "Firebase configuration is working",
        authDomain: auth.config.authDomain,
        projectId: auth.config.projectId
      });
    } catch (error: any) {
      console.error('Firebase test error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Firebase configuration error",
        error: error.message 
      });
    }
  });

  // Email login endpoint - REMOVED: Now handled by Firebase Auth + backend user lookup

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Categories search API for auto-suggestions
  app.get('/api/categories/search', async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string' || query.length < 2) {
        return res.status(400).json({ message: "Query parameter must be at least 2 characters" });
      }

      const allCategories = await storage.getAllCategories();
      
      // Filter categories based on query and deduplicate by name (case-insensitive)
      const seenNames = new Set<string>();
      const filteredCategories = [];
      
      for (const category of allCategories) {
        const lowerName = category.name.toLowerCase();
        if (lowerName.includes(query.toLowerCase()) &&
            category.name !== 'Other' && // Exclude "Other" category from search results
            !seenNames.has(lowerName)) { // Deduplicate by name (case-insensitive)
          seenNames.add(lowerName);
          filteredCategories.push(category);
          if (filteredCategories.length >= 10) break; // Limit to 10 results
        }
      }

      res.json(filteredCategories);
    } catch (error) {
      console.error("Error searching categories:", error);
      res.status(500).json({ message: "Failed to search categories" });
    }
  });

  // Areas API for getting all areas (for dropdowns)
  app.get('/api/areas/all', async (req, res) => {
    try {
      let areaNames = [];
      
      try {
        // Try to get areas from database first
        const areas = await storage.getAreas();
        areaNames = areas.map(area => area.name);
      } catch (dbError) {
        console.warn("Database not accessible, using fallback areas data:", dbError.message);
        
        // Fallback to JSON file data
        const { areasData } = await import('./fallback-areas.js');
        areaNames = areasData;
      }
      
      res.json(areaNames);
    } catch (error) {
      console.error("Error fetching all areas:", error);
      res.status(500).json({ message: "Failed to fetch areas" });
    }
  });

  // Test endpoint for areas validation (no auth required)
  
  // Simple test endpoint
  app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
  });


  // Simple test upload endpoint without multer
  app.post('/api/freelancer/upload-photo-test', 
    isAuthenticated,
    async (req: any, res) => {
      try {
        console.log('📸 Test upload endpoint hit');
        console.log('User:', req.user);
        const userId = req.user.claims.sub;
        
        res.json({
          success: true,
          message: 'Test endpoint working',
          userId: userId
        });
      } catch (error) {
        console.error('Error in test endpoint:', error);
        res.status(500).json({
          success: false,
          message: 'Test endpoint error'
        });
      }
    }
  );

  // Profile photo upload endpoint with proper validation and processing
  app.post('/api/freelancer/upload-photo', 
    isAuthenticated,
    upload.single('photo'),
    handleUploadError,
    async (req: any, res) => {
      try {
        console.log('📸 Upload endpoint hit');
        console.log('User:', req.user);
        console.log('File:', req.file);
        const userId = req.user.claims.sub;
        
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        // Validate the uploaded file
        const validation = ImageProcessingService.validateImageFile(req.file);
        if (!validation.valid) {
          // Delete the uploaded file if validation fails
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({
            success: false,
            message: validation.error
          });
        }

        // Get freelancer profile to check for existing photo
        const existingProfile = await storage.getFreelancerProfile(userId);
        let oldPhotoUrl = null;
        
        if (existingProfile?.profilePhotoUrl) {
          oldPhotoUrl = existingProfile.profilePhotoUrl;
        }

        // Generate thumbnail
        const thumbnailUrl = await ImageProcessingService.generateProfileThumbnail(
          req.file.path,
          userId
        );

        // Delete the original uploaded file (we only keep the thumbnail)
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        // Delete old photo if it exists
        if (oldPhotoUrl) {
          await ImageProcessingService.deleteOldPhoto(oldPhotoUrl);
        }

        // Update freelancer profile with new photo URL
        if (existingProfile) {
          await storage.updateFreelancerProfile(existingProfile.id, {
            profilePhotoUrl: thumbnailUrl
          });
        } else {
          // If no profile exists, create a basic one
          await storage.upsertFreelancerProfile(userId, {
            profilePhotoUrl: thumbnailUrl,
            fullName: req.user.displayName || 'User'
          });
        }

        res.json({
          success: true,
          photoUrl: thumbnailUrl,
          message: 'Profile photo uploaded successfully'
        });

      } catch (error) {
        console.error('Error uploading profile photo:', error);
        
        // Clean up uploaded file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
          success: false,
          message: 'Failed to upload profile photo'
        });
      }
    }
  );

  // Test endpoint to verify server is working
  app.get('/api/customer/test', (req, res) => {
    res.json({ success: true, message: 'Customer API is working' });
  });

  // Test endpoint to verify authentication
  app.get('/api/customer/test-auth', isAuthenticated, (req: any, res) => {
    res.json({ success: true, message: 'Authentication is working', userId: req.user.claims.sub });
  });

  // Test endpoint to verify file upload (without auth for testing)
  app.post('/api/customer/test-upload', upload.single('photo'), (req: any, res) => {
    console.log('Test upload endpoint hit');
    console.log('File:', req.file);
    console.log('Body:', req.body);
    res.json({ success: true, message: 'File upload test successful', file: req.file ? 'File received' : 'No file' });
  });

  // Customer profile photo upload endpoint
  app.post('/api/customer/upload-photo', 
    isAuthenticated,
    upload.single('photo'),
    handleUploadError,
    async (req: any, res) => {
      try {
        console.log('📸 Customer upload endpoint hit');
        console.log('Request method:', req.method);
        console.log('Request path:', req.path);
        console.log('Request headers:', req.headers);
        console.log('User:', req.user);
        console.log('File:', req.file);
        console.log('Body:', req.body);
        const userId = req.user.claims.sub;
        
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        // Validate the uploaded file
        const validation = ImageProcessingService.validateImageFile(req.file);
        if (!validation.valid) {
          // Delete the uploaded file if validation fails
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({
            success: false,
            message: validation.error
          });
        }

        // Get existing user to check for old photo
        const existingUser = await storage.getUser(userId);
        let oldPhotoUrl = null;
        
        if (existingUser?.profileImageUrl) {
          oldPhotoUrl = existingUser.profileImageUrl;
        }

        // Generate thumbnail
        const thumbnailUrl = await ImageProcessingService.generateProfileThumbnail(
          req.file.path,
          userId
        );

        // Delete the original uploaded file (we only keep the thumbnail)
        if (fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (deleteError) {
            console.warn('Could not delete original file (this is usually safe):', deleteError.message);
            // Continue execution - the file will be cleaned up later
          }
        }

        // Delete old photo if it exists
        if (oldPhotoUrl) {
          await ImageProcessingService.deleteOldPhoto(oldPhotoUrl);
        }

        // Update user profile with new photo URL
        await storage.updateUser(userId, {
          profileImageUrl: thumbnailUrl
        });

        res.json({
          success: true,
          photoUrl: thumbnailUrl,
          message: 'Profile photo uploaded successfully'
        });

      } catch (error) {
        console.error('Error uploading customer profile photo:', error);
        
        // Clean up uploaded file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (deleteError) {
            console.warn('Could not delete uploaded file during error cleanup:', deleteError.message);
            // Continue execution - the file will be cleaned up later
          }
        }
        
        res.status(500).json({
          success: false,
          message: 'Failed to upload profile photo'
        });
      }
    }
  );

  // Areas API for auto-suggestions
  app.get('/api/areas', async (req, res) => {
    try {
      const { query, lat, lng } = req.query;
      
      if (!query || typeof query !== 'string' || query.length < 2) {
        return res.status(400).json({ message: "Query parameter must be at least 2 characters" });
      }

      let suggestions = [];

      try {
        // Try to get areas from database first
        const areas = await storage.getAreasByQuery(query, 8);
        suggestions = areas.map(area => ({
          name: area.name,
          distance_km: undefined as number | undefined,
          meta: `${area.city} • ${area.state}`
        }));
      } catch (dbError) {
        console.warn("Database not accessible, using fallback areas data:", dbError.message);
        
        // Fallback to JSON file data
        const { searchAreasFallback } = await import('./fallback-areas.js');
        suggestions = searchAreasFallback(query, 8);
      }

      // If coordinates provided, calculate distances
      if (lat && lng) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        
        const suggestionsWithDistance = suggestions.map(suggestion => ({
          ...suggestion,
          distance_km: calculateDistance(userLat, userLng, 26.9124, 75.7873) // Jaipur center coordinates
        }));

        res.json(suggestionsWithDistance);
      } else {
        res.json(suggestions);
      }
    } catch (error) {
      console.error("Error fetching area suggestions:", error);
      res.status(500).json({ message: "Failed to fetch area suggestions" });
    }
  });

  // Areas search API for auto-suggestions (dedicated endpoint)
  app.get('/api/areas/search', async (req, res) => {
    try {
      const { query, lat, lng } = req.query;
      
      if (!query || typeof query !== 'string' || query.length < 2) {
        return res.status(400).json({ message: "Query parameter must be at least 2 characters" });
      }

      let suggestions = [];

      try {
        // Try to get areas from database first
        const areas = await storage.getAreasByQuery(query, 10);
        suggestions = areas.map(area => ({
          name: area.name,
          distance_km: undefined as number | undefined,
          meta: `${area.city} • ${area.state}`
        }));
      } catch (dbError) {
        console.warn("Database not accessible, using fallback areas data:", dbError.message);
        
        // Fallback to JSON file data
        const { searchAreasFallback } = await import('./fallback-areas.js');
        suggestions = searchAreasFallback(query, 10);
      }

      // If coordinates provided, calculate distances
      if (lat && lng) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        
        const suggestionsWithDistance = suggestions.map(suggestion => ({
          ...suggestion,
          distance_km: calculateDistance(userLat, userLng, 26.9124, 75.7873) // Jaipur center coordinates
        }));

        res.json(suggestionsWithDistance);
      } else {
        res.json(suggestions);
      }
    } catch (error) {
      console.error("Error searching areas:", error);
      res.status(500).json({ message: "Failed to search areas" });
    }
  });

  // Customer profile routes
  app.get('/api/customer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Fetching profile for user:', userId);
      let user = await storage.getUser(userId);
      console.log('User data from database:', user);
      
      if (!user) {
        console.log('User not found, creating new user for Firebase UID:', userId);
        // Create new user in database with default values
        user = await storage.upsertUser({
          id: userId,
          email: '',
          firstName: '',
          lastName: '',
          role: 'customer', // Default role
          area: 'Jaipur', // Default area
          phone: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('New user created:', user.id);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put('/api/customer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, email, area, phone } = req.body;
      console.log('Updating profile for user:', userId, 'with data:', { firstName, lastName, email, area, phone });

      // Get current user data to check if phone number has been saved
      let currentUser = await storage.getUser(userId);
      console.log('Current user data:', currentUser);
      if (!currentUser) {
        console.log('User not found, creating new user for Firebase UID:', userId);
        // Create new user in database
        currentUser = await storage.upsertUser({
          id: userId,
          email: email || '',
          firstName: firstName || '',
          lastName: lastName || '',
          role: 'customer', // Default role
          area: area || 'Jaipur', // Default area
          phone: phone || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('New user created:', currentUser.id);
      }

      // Check if phone number is being changed and if it was already saved
      console.log('Phone validation check:', {
        phone: phone,
        currentUserPhone: currentUser.phone,
        currentUserPhoneLength: currentUser.phone?.length,
        isPhoneNull: currentUser.phone === null,
        isPhoneEmpty: currentUser.phone === '',
        condition: phone && currentUser.phone && currentUser.phone !== null && currentUser.phone.length > 3 && phone !== currentUser.phone
      });
      
      if (phone && currentUser.phone && currentUser.phone !== null && currentUser.phone.length > 3 && phone !== currentUser.phone) {
        console.log('Phone number change attempted but already saved');
        return res.status(400).json({ message: "Phone number has been saved and cannot be changed" });
      }

      // Validate area against the database if provided
      if (area) {
        const areas = await storage.getAreas();
        const areaExists = areas.some(a => a.name.toLowerCase() === area.toLowerCase());
        
        if (!areaExists) {
          return res.status(400).json({ 
            message: "Invalid area selected. Please select from the available areas.",
            availableAreas: areas.slice(0, 10).map(a => a.name) // Show first 10 for reference
          });
        }
      }

      // Validate email format if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email is already taken" });
        }
      }

      // Validate phone number format if provided
      if (phone && !/^\+91\d{10}$/.test(phone)) {
        console.log('Invalid phone format:', phone);
        return res.status(400).json({ message: "Invalid phone number format. Must be +91 followed by 10 digits" });
      }

      // Log the exact data being sent to storage
      const updateData = { firstName, lastName, email, area, phone };
      console.log('Final update data being sent to storage:', updateData);
      console.log('Phone number validation passed:', phone);

      console.log('Updating user profile with:', { firstName, lastName, email, area, phone });
      await storage.updateUserProfile(userId, { firstName, lastName, email, area, phone });
      console.log('Profile updated successfully');
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating customer profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin routes for area management (protected)
  app.post('/admin/areas', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { name, city, state, country, latitude, longitude } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Area name is required" });
      }

      const newArea = await storage.createArea({
        name,
        city: city || 'Jaipur',
        state: state || 'Rajasthan',
        country: country || 'India',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      });

      res.json(newArea);
    } catch (error) {
      console.error("Error creating area:", error);
      res.status(500).json({ message: "Failed to create area" });
    }
  });

  app.put('/admin/areas/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { name, city, state, country, latitude, longitude, isActive } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (city !== undefined) updates.city = city;
      if (state !== undefined) updates.state = state;
      if (country !== undefined) updates.country = country;
      if (latitude !== undefined) updates.latitude = latitude ? parseFloat(latitude) : null;
      if (longitude !== undefined) updates.longitude = longitude ? parseFloat(longitude) : null;
      if (isActive !== undefined) updates.isActive = isActive;

      await storage.updateArea(id, updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating area:", error);
      res.status(500).json({ message: "Failed to update area" });
    }
  });

  app.delete('/admin/areas/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      await storage.deleteArea(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting area:", error);
      res.status(500).json({ message: "Failed to delete area" });
    }
  });

  app.get('/admin/areas', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const areas = await storage.getAreas();
      res.json(areas);
    } catch (error) {
      console.error("Error fetching areas:", error);
      res.status(500).json({ message: "Failed to fetch areas" });
    }
  });

  // Customer routes for getting available freelancers - NO VISIBILITY RESTRICTIONS
  app.get('/api/customer/available-freelancers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get all freelancers without ANY visibility restrictions - show ALL freelancers
      const freelancers = await storage.getAllFreelancers();
      console.log(`✅ API: Returning ${freelancers.length} freelancers with NO visibility restrictions`);
      res.json(freelancers);
    } catch (error) {
      console.error("Error fetching available freelancers:", error);
      res.status(500).json({ message: "Failed to fetch freelancers" });
    }
  });

  // Freelancer profile routes
  app.get('/api/freelancer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfileWithCategory(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching freelancer profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/freelancer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let { area, ...otherData } = req.body;
      
      console.log('=== FREELANCER PROFILE CREATION START ===');
      console.log('User ID from claims:', userId);
      console.log('User claims:', req.user.claims);
      console.log('Request body:', req.body);
      console.log('Profile creation request:', { userId, area, otherData });

      // Validate userId
      if (!userId || userId.trim() === '') {
        console.error('ERROR: User ID is missing or empty');
        return res.status(400).json({ 
          message: "Invalid user session. Please log in again.",
          error: "Missing user ID"
        });
      }

      // Get allowed areas from database
      const allowedAreas = await storage.getAreas();
      const allowedAreaNames = allowedAreas.map(a => a.name);

      // Validate single area if provided
      if (area) {
        const normalizedArea = area.trim();
        const matchingArea = allowedAreaNames.find(allowed => 
          allowed.toLowerCase() === normalizedArea.toLowerCase()
        );
        
        if (!matchingArea) {
          return res.status(400).json({ 
            message: `Invalid area selected: ${area}. Please select from the available areas.`,
            availableAreas: allowedAreaNames.slice(0, 10) // Show first 10 for reference
          });
        }
        
        // Use the exact case from the allowed areas list
        area = matchingArea;
      }
      
      // Prepare user data from Firebase claims with better fallbacks
      const userData = {
        id: userId,
        email: req.user.claims.email || req.user.claims.email_verified || `user_${userId}@example.com`,
        firstName: req.user.claims.name?.split(' ')[0] || req.user.claims.given_name || 'User',
        lastName: req.user.claims.name?.split(' ').slice(1).join(' ') || req.user.claims.family_name || '',
        role: 'freelancer' as const,
        profileImageUrl: req.user.claims.picture || req.user.claims.avatar_url || null,
        area: area || null,
        phone: req.user.claims.phone || req.user.claims.phone_number || null
      };
      
      console.log('Prepared user data:', userData);
      
      // Prepare profile data with validated area
      const profileData = {
        ...otherData,
        area
      };
      
      console.log('Prepared profile data:', profileData);
      
      // Validate the profile data
      const validatedProfileData = insertFreelancerProfileSchema.parse({
        ...profileData,
        userId
      });
      
      console.log('Validated profile data:', validatedProfileData);
      console.log('About to call storage.upsertFreelancerProfile...');
      
      // CRITICAL FIX: Ensure user exists before profile creation
      try {
        // First, ensure the user exists with retry logic
        let userExists = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!userExists && retryCount < maxRetries) {
          try {
            await storage.ensureUserExists(userId, userData);
            console.log('✅ User existence confirmed');
            userExists = true;
          } catch (userError) {
            retryCount++;
            console.log(`❌ User existence check failed (attempt ${retryCount}/${maxRetries}):`, userError.message);
            
            if (retryCount < maxRetries) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            } else {
              throw userError;
            }
          }
        }
        
        // Then create/update the profile
        const profile = await storage.upsertFreelancerProfile(userId, validatedProfileData, userData);
        console.log('Profile created/updated successfully:', profile);
        console.log('=== FREELANCER PROFILE CREATION SUCCESS ===');
        res.json(profile);
      } catch (profileError: any) {
        console.error('Profile creation error:', profileError);
        
        // If it's a foreign key constraint error, try to create user first
        if (profileError.code === '23503' || profileError.message.includes('foreign key constraint')) {
          console.log('🔄 Foreign key constraint detected, attempting user creation...');
          
          try {
            // Force create user with minimal data
            const minimalUserData = {
              id: userId,
              email: `user_${userId}@example.com`,
              firstName: 'User',
              lastName: '',
              role: 'freelancer' as const
            };
            
            await storage.ensureUserExists(userId, minimalUserData);
            console.log('✅ User created with minimal data');
            
            // Try profile creation again
            const profile = await storage.upsertFreelancerProfile(userId, validatedProfileData, minimalUserData);
            console.log('Profile created successfully after user fix:', profile);
            console.log('=== FREELANCER PROFILE CREATION SUCCESS (RECOVERY) ===');
            res.json(profile);
            return;
          } catch (recoveryError: any) {
            console.error('Recovery attempt failed:', recoveryError);
            return res.status(500).json({ 
              message: "Failed to save freelancer profile because user account could not be linked.",
              error: "User account linking failed",
              details: "Please try logging out and back in, or contact support if the issue persists."
            });
          }
        }
        
        throw profileError;
      }
    } catch (error: any) {
      console.error("=== FREELANCER PROFILE CREATION ERROR ===");
      console.error("Error creating freelancer profile:", error);
      console.error("Error stack:", error.stack);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Handle specific error messages from our improved storage functions
      if (error.message) {
        if (error.message.includes('Failed to save freelancer profile because user account could not be linked')) {
          return res.status(500).json({ 
            message: "Failed to save freelancer profile because user account could not be linked.",
            error: "User account linking failed",
            details: "Please try logging out and back in, or contact support if the issue persists."
          });
        }
        
        if (error.message.includes('Invalid user session')) {
          return res.status(401).json({ 
            message: "Invalid user session. Please log in again.",
            error: "Authentication required"
          });
        }
        
        if (error.message.includes('A profile already exists')) {
          return res.status(409).json({ 
            message: "A profile already exists for this user.",
            error: "Profile already exists"
          });
        }
        
        if (error.message.includes('User ID is required')) {
          return res.status(400).json({ 
            message: "Invalid user session. Please log in again.",
            error: "Missing user ID"
          });
        }
      }
      
      // Handle database-specific errors
      if (error.code === '23503') { // Foreign key constraint violation
        return res.status(500).json({ 
          message: "Failed to save freelancer profile because user account could not be linked.",
          error: "Foreign key constraint violation",
          details: "Please try logging out and back in, or contact support if the issue persists."
        });
      }
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ 
          message: "A profile already exists for this user.",
          error: "Duplicate profile"
        });
      }
      
      const errorMessage = error.message || "Failed to create profile";
      console.error("=== FREELANCER PROFILE CREATION ERROR END ===");
      res.status(500).json({ message: errorMessage });
    }
  });

  app.put('/api/freelancer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let { area, ...otherData } = req.body;

      console.log('Profile update request:', { userId, area, otherData });

      // Get allowed areas from database
      const allowedAreas = await storage.getAreas();
      const allowedAreaNames = allowedAreas.map(a => a.name);

      // Validate single area if provided
      if (area) {
        const normalizedArea = area.trim();
        const matchingArea = allowedAreaNames.find(allowed => 
          allowed.toLowerCase() === normalizedArea.toLowerCase()
        );
        
        if (!matchingArea) {
          return res.status(400).json({ 
            message: `Invalid area selected: ${area}. Please select from the available areas.`,
            availableAreas: allowedAreaNames.slice(0, 10) // Show first 10 for reference
          });
        }
        
        // Use the exact case from the allowed areas list
        area = matchingArea;
      }

      // Get existing profile
      const existingProfile = await storage.getFreelancerProfile(userId);
      console.log('Looking for profile for user:', userId);
      console.log('Existing profile found:', existingProfile);
      
      if (!existingProfile) {
        console.log('No existing profile found for user:', userId);
        return res.status(404).json({ message: "Freelancer profile not found. Please create a profile first." });
      }

      console.log('Existing profile found:', existingProfile);

      // Update profile with new data (exclude userId since we're updating existing profile)
      const { userId: _, ...updateData } = otherData;
      if (area) {
        updateData.area = area;
      }

      console.log('Updating profile with data:', updateData);

      // Prepare user data from Firebase claims for potential user updates
      const userData = {
        id: userId,
        email: req.user.claims.email || `user_${userId}@example.com`,
        firstName: req.user.claims.name?.split(' ')[0] || 'User',
        lastName: req.user.claims.name?.split(' ').slice(1).join(' ') || '',
        role: 'freelancer' as const,
        profileImageUrl: req.user.claims.picture || null,
        area: area || null,
        phone: req.user.claims.phone || null
      };

      console.log('About to update profile with ID:', existingProfile.id);
      console.log('Update data:', updateData);
      console.log('User data:', userData);
      
      await storage.updateFreelancerProfile(existingProfile.id, updateData, userData);
      console.log('Profile update completed successfully');
      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error: any) {
      console.error("=== FREELANCER PROFILE UPDATE ERROR ===");
      console.error("Error updating freelancer profile:", error);
      console.error("Error stack:", error.stack);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Handle area validation errors first
      if (error.message && error.message.includes('Invalid area selected')) {
        return res.status(400).json({ 
          message: error.message,
          error: "Area validation failed",
          details: "Please select an area from the available options."
        });
      }
      
      // Handle specific error messages from our improved storage functions
      if (error.message) {
        if (error.message.includes('Failed to save freelancer profile because user account could not be linked')) {
          return res.status(500).json({ 
            message: "Failed to save freelancer profile because user account could not be linked.",
            error: "User account linking failed",
            details: "Please try logging out and back in, or contact support if the issue persists."
          });
        }
        
        if (error.message.includes('Invalid user session')) {
          return res.status(401).json({ 
            message: "Invalid user session. Please log in again.",
            error: "Authentication required"
          });
        }
        
        if (error.message.includes('Another profile already exists')) {
          return res.status(409).json({ 
            message: "Another profile already exists for this user ID.",
            error: "Profile conflict"
          });
        }
        
        if (error.message.includes('User ID is required')) {
          return res.status(400).json({ 
            message: "Invalid user session. Please log in again.",
            error: "Missing user ID"
          });
        }
        
        if (error.message.includes('not found')) {
          return res.status(404).json({ 
            message: "Freelancer profile not found. Please create a profile first.",
            error: "Profile not found"
          });
        }
      }
      
      // Handle database-specific errors
      if (error.code === '23503') { // Foreign key constraint violation
        return res.status(500).json({ 
          message: "Failed to save freelancer profile because user account could not be linked.",
          error: "Foreign key constraint violation",
          details: "Please try logging out and back in, or contact support if the issue persists."
        });
      }
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ 
          message: "Another profile already exists for this user ID.",
          error: "Duplicate profile"
        });
      }
      
      const errorMessage = error.message || "Failed to update profile";
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get('/api/freelancer/leads/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log(`🔍 Fetching lead notifications for user: ${userId}`);
      
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        console.log(`❌ Freelancer profile not found for user: ${userId}`);
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      console.log(`✅ Found freelancer profile: ${profile.id} in category ${profile.categoryId} and area ${profile.area}`);
      
      // Get all pending leads in the same category and area (for both free and paid freelancers)
      const results = await db
        .select()
        .from(leads)
        .leftJoin(users, eq(leads.customerId, users.id))
        .leftJoin(categories, eq(leads.categoryId, categories.id))
        .where(
          and(
            eq(leads.status, 'pending'),
            eq(leads.categoryId, profile.categoryId),
            sql`LOWER(${leads.location}) = LOWER(${profile.area})`
          )
        )
        .orderBy(desc(leads.createdAt));

      const leadResults = results.map(row => ({
        ...row.leads,
        customer: row.users!,
        category: row.categories!
      }));
      
      console.log(`✅ Found ${leadResults.length} pending leads for freelancer ${profile.id} in category ${profile.categoryId} and area ${profile.area}`);
      
      // Log lead details for debugging
      leadResults.forEach((lead, index) => {
        console.log(`📋 Lead ${index + 1}: ${lead.id} - ${lead.title} - Budget: ₹${lead.budgetMin}-${lead.budgetMax} - Location: ${lead.location}`);
      });
      
      res.json(leadResults);
    } catch (error) {
      console.error("❌ Error fetching lead notifications:", error);
      res.status(500).json({ message: "Failed to fetch lead notifications" });
    }
  });

  // New endpoint for filtered leads with date filtering
  app.get('/api/freelancer/leads/filtered', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { month, fromDate, toDate } = req.query;
      
      console.log(`🔍 Fetching filtered leads for user: ${userId}`, { month, fromDate, toDate });
      
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        console.log(`❌ Freelancer profile not found for user: ${userId}`);
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      console.log(`✅ Found freelancer profile: ${profile.id} in category ${profile.categoryId} and area ${profile.area}`);
      
      // Build date filter conditions
      let dateConditions = [];
      
      if (month) {
        // Filter by month (format: "2025-01")
        const [year, monthNum] = month.split('-');
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);
        
        dateConditions.push(
          and(
            gte(leads.createdAt, startDate),
            lte(leads.createdAt, endDate)
          )
        );
        
        console.log(`📅 Filtering by month: ${month} (${startDate.toISOString()} to ${endDate.toISOString()})`);
      } else if (fromDate && toDate) {
        // Filter by date range
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        dateConditions.push(
          and(
            gte(leads.createdAt, startDate),
            lte(leads.createdAt, endDate)
          )
        );
        
        console.log(`📅 Filtering by date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      }
      
      // Base conditions for freelancer leads
      const baseConditions = [
        eq(leads.status, 'pending'),
        eq(leads.categoryId, profile.categoryId),
        sql`LOWER(${leads.location}) = LOWER(${profile.area})`
      ];
      
      // Combine all conditions
      const allConditions = dateConditions.length > 0 
        ? and(...baseConditions, ...dateConditions)
        : and(...baseConditions);
      
      // Get filtered leads
      const results = await db
        .select()
        .from(leads)
        .leftJoin(users, eq(leads.customerId, users.id))
        .leftJoin(categories, eq(leads.categoryId, categories.id))
        .where(allConditions)
        .orderBy(desc(leads.createdAt));

      const leadResults = results.map(row => ({
        ...row.leads,
        customer: row.users!,
        category: row.categories!
      }));
      
      console.log(`✅ Found ${leadResults.length} filtered leads for freelancer ${profile.id}`);
      
      // Log lead details for debugging
      leadResults.forEach((lead, index) => {
        console.log(`📋 Lead ${index + 1}: ${lead.id} - ${lead.title} - Created: ${lead.createdAt} - Budget: ₹${lead.budgetMin}-${lead.budgetMax}`);
      });
      
      res.json(leadResults);
    } catch (error) {
      console.error("❌ Error fetching filtered leads:", error);
      res.status(500).json({ message: "Failed to fetch filtered leads" });
    }
  });

  app.get('/api/freelancer/leads/available', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      const leads = await storage.getAvailableLeads(profile.id);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching available leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get('/api/freelancer/leads/accepted', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      const leads = await storage.getLeadsByFreelancer(profile.id);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching accepted leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post('/api/freelancer/leads/:leadId/accept', isAuthenticated, async (req: any, res) => {
    try {
      const { leadId } = req.params;
      const userId = req.user.claims.sub;
      
      console.log(`🎯 Freelancer ${userId} attempting to accept lead: ${leadId}`);
      
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        console.log(`❌ Freelancer profile not found for user: ${userId}`);
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      console.log(`✅ Found freelancer profile: ${profile.id}`);
      
      // Get lead details first to check if it's still available
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        console.log(`❌ Lead ${leadId} not found`);
        return res.status(404).json({ message: "Lead not found" });
      }
      
      console.log(`✅ Found lead: ${lead.id} with status: ${lead.status}`);
      
      if (lead.status !== 'pending') {
        console.log(`❌ Lead ${leadId} is not available (status: ${lead.status})`);
        return res.status(410).json({ message: "This lead has already been taken by another freelancer" });
      }
      
      // Check if freelancer has active lead plan
      const hasLeadPlan = await storage.hasActiveLeadPlan(profile.id);
      console.log(`🔍 Freelancer ${profile.id} has active lead plan: ${hasLeadPlan}`);
      
      if (!hasLeadPlan) {
        console.log(`❌ Freelancer ${profile.id} does not have active lead plan`);
        return res.status(403).json({ 
          message: "Please upgrade to a paid plan to accept this lead.",
          needsSubscription: true,
          redirectTo: '/subscription-plans'
        });
      }
      
      // Accept the lead (this should mark it as taken)
      console.log(`✅ Accepting lead ${leadId} for freelancer ${profile.id}`);
      await storage.acceptLead(leadId, profile.id);
      
      // Update freelancer lead interaction record
      try {
        const existingInteraction = await storage.getFreelancerLeadInteraction(profile.id, leadId);
        if (existingInteraction) {
          await storage.updateFreelancerLeadInteraction(profile.id, leadId, {
            status: 'accepted',
            respondedAt: new Date()
          });
          console.log(`📝 Updated interaction record for freelancer ${profile.id} and lead ${leadId} to accepted`);
        } else {
          // Create new interaction record if it doesn't exist
          await storage.createFreelancerLeadInteraction({
            freelancerId: profile.id,
            leadId: leadId,
            status: 'accepted',
            notifiedAt: new Date(),
            respondedAt: new Date()
          });
          console.log(`📝 Created new interaction record for freelancer ${profile.id} and lead ${leadId} as accepted`);
        }
      } catch (interactionError) {
        console.error(`❌ Failed to update interaction record for freelancer ${profile.id}:`, interactionError);
        // Don't fail the lead acceptance if interaction update fails
      }
      
      // Get updated lead details with customer info to return
      const updatedLead = await storage.getLeadById(leadId);
      const customer = await storage.getUser(lead.customerId);
      
      console.log(`✅ Lead ${leadId} accepted successfully by freelancer ${profile.id}`);
      
      // Notify customer that their lead was accepted
      try {
        notifyUser(lead.customerId, {
          type: 'lead_accepted',
          leadId: lead.id,
          freelancer: {
            id: profile.id,
            fullName: profile.fullName,
            professionalTitle: profile.professionalTitle,
            phone: profile.phone
          }
        });
        console.log(`✅ Customer notification sent for lead ${leadId}`);
      } catch (error) {
        console.error(`❌ Failed to notify customer for lead ${leadId}:`, error);
      }
      
      // Return success with customer details
      res.json({ 
        success: true, 
        message: "Lead accepted successfully!",
        lead: updatedLead,
        customerDetails: {
          name: `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim(),
          phone: lead.mobileNumber,
          email: customer?.email,
          location: lead.location
        }
      });
    } catch (error) {
      console.error("❌ Error accepting lead:", error);
      res.status(500).json({ message: "Failed to accept lead" });
    }
  });

  app.post('/api/freelancer/leads/:leadId/interest', isAuthenticated, async (req: any, res) => {
    try {
      const { leadId } = req.params;
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      const interest = await storage.expressInterest({
        leadId,
        freelancerId: profile.id
      });
      
      res.json(interest);
    } catch (error) {
      console.error("Error expressing interest:", error);
      res.status(500).json({ message: "Failed to express interest" });
    }
  });

  // Freelancer call customer endpoint - securely fetch customer mobile number
  app.get('/api/freelancer/call/:customerId', isAuthenticated, async (req: any, res) => {
    try {
      const { customerId } = req.params;
      const freelancerId = req.user.claims.sub;
      
      // Get freelancer profile to verify subscription
      const freelancerProfile = await storage.getFreelancerProfile(freelancerId);
      if (!freelancerProfile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      // Check if freelancer has active subscription (any type)
      const hasActiveSubscription = await storage.hasActiveSubscription(freelancerProfile.id);
      if (!hasActiveSubscription) {
        return res.status(403).json({ 
          message: "Active subscription required to make calls",
          needsSubscription: true
        });
      }
      
      // Get customer user data
      const customer = await storage.getUser(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Check if customer has a phone number
      if (!customer.phone) {
        return res.status(404).json({ message: "Customer phone number not available" });
      }
      
      // Return the phone number for call initiation
      res.json({
        success: true,
        phoneNumber: customer.phone,
        customerName: `${customer.firstName} ${customer.lastName}`.trim() || 'Customer'
      });
    } catch (error) {
      console.error("Error fetching customer phone number:", error);
      res.status(500).json({ message: "Failed to fetch customer phone number" });
    }
  });

  // Freelancer call customer from inquiry endpoint
  app.get('/api/freelancer/call-inquiry/:inquiryId', isAuthenticated, async (req: any, res) => {
    try {
      const { inquiryId } = req.params;
      const freelancerId = req.user.claims.sub;
      
      // Get freelancer profile to verify subscription
      const freelancerProfile = await storage.getFreelancerProfile(freelancerId);
      if (!freelancerProfile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      // Check if freelancer has active subscription (any type)
      const hasActiveSubscription = await storage.hasActiveSubscription(freelancerProfile.id);
      if (!hasActiveSubscription) {
        return res.status(403).json({ 
          message: "Active subscription required to make calls",
          needsSubscription: true
        });
      }
      
      // Get inquiry data
      const inquiry = await storage.getInquiryById(inquiryId);
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      // Verify this inquiry belongs to the freelancer
      if (inquiry.freelancerId !== freelancerProfile.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Return the phone number from inquiry
      res.json({
        success: true,
        phoneNumber: inquiry.mobileNumber,
        customerName: inquiry.customerName
      });
    } catch (error) {
      console.error("Error fetching inquiry phone number:", error);
      res.status(500).json({ message: "Failed to fetch customer phone number" });
    }
  });

  // Freelancer inquiries endpoint
  app.get('/api/freelancer/inquiries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getFreelancerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      const inquiries = await storage.getInquiriesByFreelancer(profile.id);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Freelancer call customer from lead endpoint
  app.get('/api/freelancer/call-lead/:leadId', isAuthenticated, async (req: any, res) => {
    try {
      const { leadId } = req.params;
      const freelancerId = req.user.claims.sub;
      
      // Get freelancer profile to verify subscription
      const freelancerProfile = await storage.getFreelancerProfile(freelancerId);
      if (!freelancerProfile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      // Check if freelancer has active subscription (any type)
      const hasActiveSubscription = await storage.hasActiveSubscription(freelancerProfile.id);
      if (!hasActiveSubscription) {
        return res.status(403).json({ 
          message: "Active subscription required to make calls",
          needsSubscription: true
        });
      }
      
      // Get lead data
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Verify this lead was accepted by the freelancer
      if (lead.acceptedBy !== freelancerProfile.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Return the phone number from lead
      res.json({
        success: true,
        phoneNumber: lead.mobileNumber,
        customerName: `${lead.customer.firstName} ${lead.customer.lastName}`.trim() || 'Customer'
      });
    } catch (error) {
      console.error("Error fetching lead phone number:", error);
      res.status(500).json({ message: "Failed to fetch customer phone number" });
    }
  });

  // Missed Lead Detection and Notification System
  app.post('/api/admin/check-missed-leads', async (req: any, res) => {
    try {
      console.log('🔍 Checking for missed leads...');
      
      // Get all pending leads that were notified more than 30 minutes ago
      const missedLeadsResult = await db.execute(sql`
        SELECT fli.*, l.title, l.description, l.location, l.budget_min, l.budget_max,
               fp.id as freelancer_id, fp.full_name as freelancer_name, fp.user_id as freelancer_user_id,
               u.first_name as customer_first_name, u.last_name as customer_last_name
        FROM freelancer_lead_interactions fli
        JOIN leads l ON fli.lead_id = l.id
        JOIN freelancer_profiles fp ON fli.freelancer_id = fp.id
        JOIN users u ON l.customer_id = u.id
        WHERE fli.status = 'notified'
        AND fli.notified_at < NOW() - INTERVAL '30 minutes'
        AND l.status = 'pending'
      `);
      
      const missedLeads = missedLeadsResult.rows;
      console.log(`📋 Found ${missedLeads.length} leads that may have been missed`);
      
      let processedCount = 0;
      let notificationCount = 0;
      
      for (const lead of missedLeads) {
        try {
          // Mark lead as missed with reason 'no_response'
          await storage.markLeadAsMissed(
            lead.freelancer_id, 
            lead.lead_id, 
            'no_response', 
            'Automatically marked as missed due to no response within 30 minutes'
          );
          
          // Send notification to freelancer about missed lead
          await storage.createNotification({
            userId: lead.freelancer_user_id,
            type: 'missed_lead',
            title: 'Lead Missed - No Response',
            message: `You missed a lead: "${lead.title}" in ${lead.location}. Budget: ₹${lead.budget_min} - ₹${lead.budget_max}. The lead was automatically marked as missed due to no response within 30 minutes.`,
            link: '/freelancer/leads'
          });
          
          processedCount++;
          notificationCount++;
          
          console.log(`✅ Marked lead ${lead.lead_id} as missed for freelancer ${lead.freelancer_id}`);
        } catch (error) {
          console.error(`❌ Failed to process missed lead ${lead.lead_id}:`, error);
        }
      }
      
      console.log(`✅ Processed ${processedCount} missed leads and sent ${notificationCount} notifications`);
      
      res.json({
        success: true,
        message: `Processed ${processedCount} missed leads`,
        processedCount,
        notificationCount
      });
    } catch (error) {
      console.error('Error checking missed leads:', error);
      res.status(500).json({ message: "Failed to check missed leads" });
    }
  });

  // Enhanced Freelancer Lead Tracking Routes
  app.get('/api/freelancer/leads/all-with-interactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get freelancer profile
      const profile = await storage.getFreelancerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }

      // Check if freelancer has active lead plan (paid freelancers only)
      const hasActiveLeadPlan = await storage.hasActiveLeadPlan(profile.id);
      if (!hasActiveLeadPlan) {
        return res.status(403).json({ 
          message: "Active lead plan required to view lead history",
          needsSubscription: true
        });
      }

      // Get all leads with interactions for this freelancer
      const leads = await storage.getLeadsWithInteractionsForFreelancer(profile.id);
      
      console.log(`✅ Found ${leads.length} leads with interactions for freelancer ${profile.id}`);
      res.json(leads);
    } catch (error) {
      console.error('Error fetching leads with interactions:', error);
      res.status(500).json({ message: "Failed to fetch leads with interactions" });
    }
  });

  app.post('/api/freelancer/leads/:leadId/missed', isAuthenticated, async (req: any, res) => {
    try {
      const { leadId } = req.params;
      const { reason, notes } = req.body;
      const userId = req.user.claims.sub;
      
      console.log(`🎯 Freelancer ${userId} marking lead ${leadId} as missed:`, { reason, notes });
      
      // Get freelancer profile
      const profile = await storage.getFreelancerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }

      // Check if freelancer has active lead plan (paid freelancers only)
      const hasActiveLeadPlan = await storage.hasActiveLeadPlan(profile.id);
      if (!hasActiveLeadPlan) {
        return res.status(403).json({ 
          message: "Active lead plan required to track missed leads",
          needsSubscription: true
        });
      }

      // Validate reason
      const validReasons = ['expired', 'no_response', 'busy', 'not_interested'];
      if (!reason || !validReasons.includes(reason)) {
        return res.status(400).json({ 
          message: "Valid reason required", 
          validReasons 
        });
      }

      // Mark lead as missed
      await storage.markLeadAsMissed(profile.id, leadId, reason, notes);
      
      console.log(`✅ Lead ${leadId} marked as missed by freelancer ${profile.id}`);
      res.json({ success: true, message: "Lead marked as missed" });
    } catch (error) {
      console.error('Error marking lead as missed:', error);
      res.status(500).json({ message: "Failed to mark lead as missed" });
    }
  });

  app.post('/api/freelancer/leads/:leadId/ignored', isAuthenticated, async (req: any, res) => {
    try {
      const { leadId } = req.params;
      const { notes } = req.body;
      const userId = req.user.claims.sub;
      
      console.log(`🎯 Freelancer ${userId} marking lead ${leadId} as ignored:`, { notes });
      
      // Get freelancer profile
      const profile = await storage.getFreelancerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }

      // Check if freelancer has active lead plan (paid freelancers only)
      const hasActiveLeadPlan = await storage.hasActiveLeadPlan(profile.id);
      if (!hasActiveLeadPlan) {
        return res.status(403).json({ 
          message: "Active lead plan required to track ignored leads",
          needsSubscription: true
        });
      }

      // Mark lead as ignored
      await storage.markLeadAsIgnored(profile.id, leadId, notes);
      
      console.log(`✅ Lead ${leadId} marked as ignored by freelancer ${profile.id}`);
      res.json({ success: true, message: "Lead marked as ignored" });
    } catch (error) {
      console.error('Error marking lead as ignored:', error);
      res.status(500).json({ message: "Failed to mark lead as ignored" });
    }
  });

  app.get('/api/freelancer/leads/filtered-with-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status, month, fromDate, toDate } = req.query;
      
      // Get freelancer profile
      const profile = await storage.getFreelancerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }

      // Check if freelancer has active lead plan (paid freelancers only)
      const hasActiveLeadPlan = await storage.hasActiveLeadPlan(profile.id);
      if (!hasActiveLeadPlan) {
        return res.status(403).json({ 
          message: "Active lead plan required to view filtered leads",
          needsSubscription: true
        });
      }

      // Get all leads with interactions first
      let leads = await storage.getLeadsWithInteractionsForFreelancer(profile.id);
      
      // Apply status filter
      if (status && status !== 'all') {
        leads = leads.filter(lead => {
          const interaction = lead.freelancerInteractions?.[0];
          
          if (status === 'accepted') {
            return lead.status === 'accepted' && lead.acceptedBy === profile.id;
          } else if (status === 'missed') {
            return interaction?.status === 'missed';
          }
          return false;
        });
      }
      
      // Apply date filters
      if (month) {
        const [year, monthNum] = month.split('-');
        const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
        
        leads = leads.filter(lead => {
          const interaction = lead.freelancerInteractions?.[0];
          const interactionDate = interaction?.notifiedAt ? new Date(interaction.notifiedAt) : new Date(lead.createdAt);
          return interactionDate >= startDate && interactionDate <= endDate;
        });
      } else if (fromDate && toDate) {
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        
        leads = leads.filter(lead => {
          const interaction = lead.freelancerInteractions?.[0];
          const interactionDate = interaction?.notifiedAt ? new Date(interaction.notifiedAt) : new Date(lead.createdAt);
          return interactionDate >= startDate && interactionDate <= endDate;
        });
      }
      
      console.log(`✅ Found ${leads.length} filtered leads with status for freelancer ${profile.id}`);
      res.json(leads);
    } catch (error) {
      console.error('Error fetching filtered leads with status:', error);
      res.status(500).json({ message: "Failed to fetch filtered leads" });
    }
  });

  // Customer routes
  app.get('/api/customer/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const leads = await storage.getLeadsByCustomer(userId);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching customer leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Position-based freelancer search for customers
  app.get('/api/customer/position-freelancers', isAuthenticated, async (req: any, res) => {
    try {
      const { area, category } = req.query;
      
      if (!area) {
        return res.status(400).json({ message: "Area parameter is required" });
      }

      let freelancers: FreelancerWithRelations[] = [];
      
      if (category) {
        // Search by specific category and area with position plans
        freelancers = await storage.getPositionPlanFreelancers(category, area);
      } else {
        // Search by area only, get freelancers from all categories with position plans
        const allCategories = await storage.getAllCategories();
        const allFreelancers: FreelancerWithRelations[] = [];
        
        for (const cat of allCategories) {
          const categoryFreelancers = await storage.getPositionPlanFreelancers(cat.id, area);
          allFreelancers.push(...categoryFreelancers);
        }
        
        // Sort by position and rating
        freelancers = allFreelancers.sort((a, b) => {
          const aPosition = a.subscriptions.find(s => s.type === 'position' && s.status === 'active')?.position || 999;
          const bPosition = b.subscriptions.find(s => s.type === 'position' && s.status === 'active')?.position || 999;
          
          if (aPosition !== bPosition) {
            return aPosition - bPosition;
          }
          
          return (b.rating || 0) - (a.rating || 0);
        });
      }
      
      res.json(freelancers);
    } catch (error) {
      console.error("Error fetching position-based freelancers:", error);
      res.status(500).json({ message: "Failed to fetch freelancers" });
    }
  });

  app.post('/api/customer/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const leadData = insertLeadSchema.parse({
        ...req.body,
        customerId: userId
      });
      
      console.log('📝 Creating new lead:', leadData);
      
      const lead = await storage.createLead(leadData);
      console.log('✅ Lead created successfully:', lead.id);
      
      // Get all freelancers in the same category and area (location) - both free and paid
      const freelancers = await storage.getFreelancersByCategory(leadData.categoryId, leadData.location);
      console.log(`📢 Found ${freelancers.length} freelancers in category ${leadData.categoryId} and area ${leadData.location}`);
      
      // Log freelancer details for debugging
      freelancers.forEach((freelancer, index) => {
        console.log(`👤 Freelancer ${index + 1}: ${freelancer.id} - ${freelancer.fullName} - Area: ${freelancer.area} - Category: ${freelancer.categoryId}`);
      });
      
      // Get customer details for notification
      const customer = await storage.getUser(userId);
      
      // Send "Lead Ring" notification to ALL freelancers in the category/area
      let notificationCount = 0;
      let errorCount = 0;
      
      for (const freelancer of freelancers) {
        console.log(`🔔 Sending lead ring notification to freelancer: ${freelancer.id} (${freelancer.fullName}) - User ID: ${freelancer.userId}`);
        
        try {
          // Create database notification
          await storage.createNotification({
            userId: freelancer.userId,
            type: 'lead',
            title: 'New Lead Posted in Your Area',
            message: `A new ${lead.category?.name || 'service'} requirement has been posted in ${leadData.location}. Budget: ₹${leadData.budgetMin} - ₹${leadData.budgetMax}`,
            link: `/freelancer/leads/${lead.id}`
          });

          // Create freelancer lead interaction record (for paid freelancers only)
          const hasActiveLeadPlan = await storage.hasActiveLeadPlan(freelancer.id);
          if (hasActiveLeadPlan) {
            try {
              await storage.createFreelancerLeadInteraction({
                freelancerId: freelancer.id,
                leadId: lead.id,
                status: 'notified',
                notifiedAt: new Date()
              });
              console.log(`📝 Created interaction record for freelancer ${freelancer.id} and lead ${lead.id}`);
            } catch (interactionError) {
              console.error(`❌ Failed to create interaction record for freelancer ${freelancer.id}:`, interactionError);
              // Don't fail the entire notification if interaction creation fails
            }
          }
          
          // Send lead ring notification (with sound + popup)
          notifyUser(freelancer.userId, {
            type: 'lead_ring',
            leadId: lead.id,
            lead: {
              ...lead,
              category: freelancer.category,
              customer: customer
            },
            sound: true, // Include sound notification
            requiresAction: true // Requires freelancer action (accept/dismiss)
          });
          notificationCount++;
          console.log(`✅ Notification sent successfully to freelancer ${freelancer.id}`);
        } catch (error) {
          console.error(`❌ Failed to notify freelancer ${freelancer.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`✅ Successfully sent notifications to ${notificationCount}/${freelancers.length} freelancers (${errorCount} errors)`);
      
      res.json({
        ...lead,
        notificationCount,
        totalFreelancers: freelancers.length,
        errorCount
      });
    } catch (error) {
      console.error("❌ Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Development test endpoint for lead creation (development only)
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/test/create-lead', async (req: any, res) => {
      try {
        const testLeadData = {
          title: "Test Lead for Debugging",
          description: "This is a test lead to verify the notification system",
          budgetMin: 1000,
          budgetMax: 5000,
          location: "Kukas", // Use area with freelancers
          mobileNumber: "+91 1234567890",
          categoryId: "020f7ea9-ee6b-44c0-bc6f-d567701df254", // carpenter
          pincode: "",
          preferredTime: "",
          photos: [],
          customerId: "RdW7ruUHSEd0Pa88MfBmFDg159B2" // Use a real user ID from the logs
        };
        
        console.log('🧪 Creating test lead:', testLeadData);
        
        const lead = await storage.createLead(testLeadData);
        console.log('✅ Test lead created:', lead.id);
          
          // Test the notification flow
          const freelancers = await storage.getFreelancersByCategory(testLeadData.categoryId, testLeadData.location);
          console.log(`📢 Test lead would notify ${freelancers.length} freelancers`);
          
          // Get customer details for notification
          const customer = await storage.getUser("test-customer-id");
          
          // Send notifications to matching freelancers
          let notificationCount = 0;
          let errorCount = 0;
          
          for (const freelancer of freelancers) {
            console.log(`🔔 Sending test notification to freelancer: ${freelancer.id} (${freelancer.fullName})`);
            
            try {
              // Create database notification
              await storage.createNotification({
                userId: freelancer.userId,
                type: 'lead',
                title: 'Test Lead Posted in Your Area',
                message: `A test ${lead.category?.name || 'service'} requirement has been posted in ${testLeadData.location}. Budget: ₹${testLeadData.budgetMin} - ₹${testLeadData.budgetMax}`,
                link: `/freelancer/leads/${lead.id}`
              });
              
              // Send real-time notification
              notifyUser(freelancer.userId, {
                type: 'lead_ring',
                leadId: lead.id,
                lead: {
                  ...lead,
                  category: freelancer.category,
                  customer: customer
                },
                sound: true,
                requiresAction: true
              });
              notificationCount++;
              console.log(`✅ Test notification sent successfully to freelancer ${freelancer.id}`);
            } catch (error) {
              console.error(`❌ Failed to send test notification to freelancer ${freelancer.id}:`, error);
              errorCount++;
            }
          }
          
          console.log(`✅ Test completed: ${notificationCount}/${freelancers.length} notifications sent (${errorCount} errors)`);
          
          res.json({
            success: true,
            leadId: lead.id,
            freelancersNotified: notificationCount,
            totalFreelancers: freelancers.length,
            errorCount,
            message: "Test lead created and notifications sent successfully"
          });
        } catch (error) {
          console.error('❌ Test lead creation failed:', error);
          res.status(500).json({ error: error.message });
        }
    });
  }

  // Customer inquiry endpoint
  app.post('/api/customer/inquiries', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔍 Inquiry endpoint hit');
      console.log('Request body:', req.body);
      console.log('User claims:', req.user?.claims);
      
      const userId = req.user.claims.sub;
      console.log('User ID:', userId);
      
      const inquiryData = insertInquirySchema.parse({
        ...req.body,
        customerId: userId
      });
      
      console.log('Parsed inquiry data:', inquiryData);
      
      const inquiry = await storage.createInquiry(inquiryData);
      console.log('Inquiry created successfully:', inquiry);
      
      // Notify the freelancer about the new inquiry via WebSocket
      notifyUser(inquiryData.freelancerId, {
        type: 'new_inquiry',
        inquiry: inquiry
      });
      
      res.json(inquiry);
    } catch (error) {
      console.error("❌ Error creating inquiry:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  // Test endpoint for inquiries (temporary, for debugging)
  app.post('/api/test/inquiries', async (req: any, res) => {
    try {
      console.log('Test inquiry endpoint hit with data:', req.body);
      
      // Validate the data
      const inquiryData = insertInquirySchema.parse({
        ...req.body,
        customerId: 'test-user-id' // Use a test user ID
      });
      
      console.log('Validated inquiry data:', inquiryData);
      
      // Try to create the inquiry
      const inquiry = await storage.createInquiry(inquiryData);
      
      console.log('Inquiry created successfully:', inquiry);
      
      res.json({ 
        success: true, 
        message: 'Test inquiry created successfully',
        inquiry: inquiry 
      });
    } catch (error) {
      console.error("Test inquiry error:", error);
      res.status(500).json({ 
        success: false,
        message: "Test inquiry failed", 
        error: error.message,
        stack: error.stack
      });
    }
  });

  // General freelancers endpoint for customer dashboard
  app.get('/api/freelancers', async (req, res) => {
    try {
      const freelancers = await storage.getAllFreelancers();
      res.json(freelancers);
    } catch (error) {
      console.error("Error fetching all freelancers:", error);
      res.status(500).json({ message: "Failed to fetch freelancers" });
    }
  });

  app.get('/api/customer/freelancers', async (req, res) => {
    try {
      const { categoryId, area } = req.query;
      
      if (!categoryId) {
        return res.status(400).json({ message: "Category ID is required" });
      }
      
      // Get freelancers with position plans first, then regular freelancers
      const positionFreelancers = area ? 
        await storage.getPositionPlanFreelancers(categoryId as string, area as string) : [];
      const regularFreelancers = await storage.getFreelancersByCategory(categoryId as string, area as string);
      
      // Remove duplicates and maintain position order
      const freelancerMap = new Map();
      
      // Add position plan freelancers first
      positionFreelancers.forEach(f => freelancerMap.set(f.id, f));
      
      // Add regular freelancers
      regularFreelancers.forEach(f => {
        if (!freelancerMap.has(f.id)) {
          freelancerMap.set(f.id, f);
        }
      });
      
      const allFreelancers = Array.from(freelancerMap.values());
      res.json(allFreelancers);
    } catch (error) {
      console.error("Error fetching freelancers:", error);
      res.status(500).json({ message: "Failed to fetch freelancers" });
    }
  });

  // Reviews API endpoints
  app.get('/api/freelancers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const freelancer = await storage.getFreelancerById(id);
      
      if (!freelancer) {
        return res.status(404).json({ message: "Freelancer not found" });
      }
      
      res.json(freelancer);
    } catch (error) {
      console.error("Error fetching freelancer:", error);
      res.status(500).json({ message: "Failed to fetch freelancer" });
    }
  });

  app.get('/api/freelancers/:id/reviews', async (req, res) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getFreelancerReviews(id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/freelancers/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const { id: freelancerId } = req.params;
      const { rating, reviewText } = req.body;
      const customerId = req.user.claims.sub;
      
      // Validate input
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      if (!reviewText || reviewText.trim().length === 0) {
        return res.status(400).json({ message: "Review text is required" });
      }
      
      // Check if customer has already reviewed this freelancer
      const existingReview = await storage.getCustomerReview(customerId, freelancerId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this freelancer" });
      }
      
      // Create review
      const review = await storage.createReview({
        customerId,
        freelancerId,
        rating,
        reviewText: reviewText.trim(),
      });
      
      // Update freelancer's average rating
      await storage.updateFreelancerRating(freelancerId);
      
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Subscription routes
  app.get('/api/freelancer/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Subscription request for user:', userId);
      
      // Get or create user
      let user;
      try {
        user = await storage.getUser(userId);
        console.log('Found user:', user);
      } catch (error) {
        console.log('User not found, creating new user');
        // Create a new user if not found
        user = {
          id: userId,
          email: `user_${userId}@example.com`,
          firstName: 'Dev',
          lastName: 'User',
          role: 'customer', // Default role
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // Save the user
        await storage.upsertUser(user);
      }
      
      // Check if user has freelancer role
      if (user?.role !== 'freelancer') {
        console.log('User role is not freelancer:', user?.role);
        return res.status(403).json({ message: "Freelancer access required" });
      }
      
      let profile;
      try {
        profile = await storage.getFreelancerProfile(userId);
        console.log('Found freelancer profile:', profile);
      } catch (error) {
        console.log('Freelancer profile not found, returning empty subscriptions');
        // Return empty subscriptions if profile not found
        return res.json([]);
      }
      
      if (!profile) {
        console.log('No profile found, returning empty subscriptions');
        // Return empty subscriptions if profile not found
        return res.json([]);
      }
      
      const subscriptions = await storage.getActiveSubscriptions(profile.id);
      console.log('Retrieved subscriptions for freelancer profile ID:', profile.id);
      console.log('Retrieved subscriptions:', subscriptions);
      
      // Also check all subscriptions for this freelancer (including inactive ones) for debugging
      try {
        const { db, subscriptions: subscriptionsTable, eq } = await import('./db');
        const allSubscriptions = await db
          .select()
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.freelancerId, profile.id));
        console.log('All subscriptions for freelancer profile ID:', profile.id, ':', allSubscriptions);
      } catch (debugError) {
        console.log('Debug query failed:', debugError);
      }
      
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Debug endpoint to check subscriptions for a user
  app.get('/api/debug/subscriptions/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      console.log('Debug: Checking subscriptions for user:', userId);
      
      // Get user
      const user = await storage.getUser(userId);
      console.log('Debug: User found:', user);
      
      if (!user || user.role !== 'freelancer') {
        return res.status(404).json({ message: 'Freelancer not found' });
      }
      
      // Get freelancer profile
      const profile = await storage.getFreelancerProfile(userId);
      console.log('Debug: Freelancer profile found:', profile);
      
      if (!profile) {
        return res.status(404).json({ message: 'Freelancer profile not found' });
      }
      
      // Get all subscriptions (active and inactive)
      const { db, subscriptions: subscriptionsTable, eq } = await import('./db');
      const allSubscriptions = await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.freelancerId, profile.id));
      
      console.log('Debug: All subscriptions for freelancer:', allSubscriptions);
      
      // Get active subscriptions
      const activeSubscriptions = await storage.getActiveSubscriptions(profile.id);
      console.log('Debug: Active subscriptions for freelancer:', activeSubscriptions);
      
      res.json({
        user,
        profile,
        allSubscriptions,
        activeSubscriptions
      });
    } catch (error) {
      console.error('Debug: Error checking subscriptions:', error);
      res.status(500).json({ message: 'Debug failed', error: error.message });
    }
  });

  app.post('/api/freelancer/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('=== SUBSCRIPTION CREATION START ===');
      console.log('Creating subscription for user:', userId);
      console.log('Subscription data:', req.body);
      
      // Get or create user
      let user;
      try {
        user = await storage.getUser(userId);
        console.log('Found user:', user);
      } catch (error) {
        console.log('User not found, creating new user');
        // Create a new user if not found
        user = {
          id: userId,
          email: `user_${userId}@example.com`,
          firstName: 'Dev',
          lastName: 'User',
          role: 'freelancer', // Set as freelancer for subscription access
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // Save the user
        await storage.upsertUser(user);
      }
      
      // Check if user has freelancer role
      if (user?.role !== 'freelancer') {
        console.log('User role is not freelancer:', user?.role);
        return res.status(403).json({ message: "Freelancer access required" });
      }
      
      let profile;
      try {
        profile = await storage.getFreelancerProfile(userId);
        console.log('Found freelancer profile:', profile);
      } catch (error) {
        console.log('Freelancer profile not found, creating new profile');
        // Create a basic freelancer profile
        profile = await storage.createFreelancerProfile({
          userId: userId,
          professionalTitle: 'Freelancer',
          bio: 'Professional freelancer',
          experience: '1-3 years',
          experienceDescription: 'Experienced in various projects',
          hourlyRate: 25,
          area: 'General',
          skills: ['General'],
          categoryId: null,
          customCategory: null,
        });
      }

      const { type, amount, endDate, position, badgeType } = req.body;

      // Validate subscription data
      if (!type || !amount || !endDate) {
        return res.status(400).json({ message: "Missing required subscription data" });
      }

      // Enhanced validation for duplicate plan purchases
      console.log('=== DUPLICATE PLAN VALIDATION START ===');
      console.log('Checking for existing active subscriptions...');
      const existingSubscriptions = await storage.getActiveSubscriptions(profile.id);
      console.log('Existing active subscriptions:', existingSubscriptions);
      
      // Check if user already has an active subscription of the same type
      const hasActiveSubscriptionOfType = existingSubscriptions.some(sub => 
        sub.type === type && 
        sub.status === 'active' && 
        new Date(sub.endDate) > new Date()
      );
      
      if (hasActiveSubscriptionOfType) {
        console.log('❌ DUPLICATE PLAN DETECTED - User already has an active subscription of type:', type);
        const existingSub = existingSubscriptions.find(sub => sub.type === type);
        return res.status(409).json({ 
          success: false,
          message: `You have already taken this plan.`,
          errorType: 'DUPLICATE_PLAN',
          existingSubscription: existingSub,
          details: {
            planType: type,
            expiryDate: existingSub?.endDate,
            daysRemaining: existingSub ? Math.ceil((new Date(existingSub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
          }
        });
      }

      // For position plans, check for specific position conflicts
      if (type === 'position') {
        const { categoryId, area, position } = req.body;
        console.log('Checking position plan conflicts:', { categoryId, area, position });
        
        // Check if user already has a position plan for this category+area
        const hasPositionPlanForCategoryArea = existingSubscriptions.some(sub => 
          sub.type === 'position' && 
          sub.categoryId === categoryId && 
          sub.area === area &&
          sub.status === 'active' && 
          new Date(sub.endDate) > new Date()
        );
        
        if (hasPositionPlanForCategoryArea) {
          console.log('❌ DUPLICATE POSITION PLAN - User already has position plan for this category+area');
          const existingSub = existingSubscriptions.find(sub => 
            sub.type === 'position' && 
            sub.categoryId === categoryId && 
            sub.area === area
          );
          return res.status(409).json({ 
            success: false,
            message: `You have already taken this plan.`,
            errorType: 'DUPLICATE_POSITION_PLAN',
            existingSubscription: existingSub,
            details: {
              planType: 'position',
              categoryId,
              area,
              currentPosition: existingSub?.position,
              expiryDate: existingSub?.endDate
            }
          });
        }
      }

      // For badge subscriptions, check if user already has the same badge type
      if (type === 'badge' && badgeType) {
        const hasActiveBadgeOfType = existingSubscriptions.some(sub => 
          sub.type === 'badge' && 
          sub.badgeType === badgeType &&
          sub.status === 'active' && 
          new Date(sub.endDate) > new Date()
        );
        
        if (hasActiveBadgeOfType) {
          console.log('❌ DUPLICATE BADGE PLAN - User already has an active badge of type:', badgeType);
          const existingSub = existingSubscriptions.find(sub => sub.type === 'badge' && sub.badgeType === badgeType);
          return res.status(409).json({ 
            success: false,
            message: `You have already taken this plan.`,
            errorType: 'DUPLICATE_BADGE_PLAN',
            existingSubscription: existingSub,
            details: {
              planType: 'badge',
              badgeType,
              expiryDate: existingSub?.endDate
            }
          });
        }
      }
      
      console.log('✅ No duplicate plans found - proceeding with subscription creation');
      console.log('=== DUPLICATE PLAN VALIDATION END ===');

      // Create subscription
      const subscriptionData = {
        freelancerId: profile.id,
        type,
        amount,
        endDate: new Date(endDate),
        position: position || null,
        badgeType: badgeType || null,
      };

      console.log('Creating subscription with data:', subscriptionData);
      const subscription = await storage.createSubscription(subscriptionData);
      console.log('✅ Subscription created successfully:', subscription);

      // Return the subscription data with the correct structure for payment
      res.json({
        id: subscription.id,
        subscriptionId: subscription.id, // For backward compatibility
        type: subscription.type,
        amount: subscription.amount,
        endDate: subscription.endDate,
        status: subscription.status,
        success: true
      });

    } catch (error) {
      console.error('=== SUBSCRIPTION CREATION ERROR ===');
      console.error('Error creating subscription:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack
      });
      
      // Provide specific error messages
      let errorMessage = "Failed to create subscription";
      if (error.message) {
        if (error.message.includes('duplicate')) {
          errorMessage = "Subscription already exists";
        } else if (error.message.includes('foreign key')) {
          errorMessage = "Invalid freelancer profile";
        } else if (error.message.includes('validation')) {
          errorMessage = "Invalid subscription data";
        } else {
          errorMessage = error.message;
        }
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });

  // Position Plan routes
  app.get('/api/freelancer/position-plans/availability/:categoryId/:area', isAuthenticated, async (req: any, res) => {
    try {
      const { categoryId, area } = req.params;
      const userId = req.user.claims.sub;
      
      console.log('Checking position availability for:', { categoryId, area, userId });
      
      // Get freelancer profile
      const profile = await storage.getFreelancerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      // Get current position subscriptions for this category+area
      const existingPositions = await storage.getPositionSubscriptions(categoryId, area);
      
      // Determine available positions (1, 2, 3)
      const takenPositions = existingPositions.map(sub => sub.position);
      const availablePositions = [1, 2, 3].filter(pos => !takenPositions.includes(pos));
      
      // Check if current freelancer already has a position
      const currentFreelancerPosition = existingPositions.find(sub => sub.freelancerId === profile.id);
      
      res.json({
        categoryId,
        area,
        takenPositions,
        availablePositions,
        currentPosition: currentFreelancerPosition?.position || null,
        canPurchase: availablePositions.length > 0 && !currentFreelancerPosition
      });
    } catch (error) {
      console.error("Error checking position availability:", error);
      res.status(500).json({ message: "Failed to check position availability" });
    }
  });

  app.post('/api/freelancer/position-plans/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const { categoryId, area, position, amount } = req.body;
      const userId = req.user.claims.sub;
      
      console.log('Position plan purchase request:', { categoryId, area, position, amount, userId });
      
      // Validate input
      if (!categoryId || !area || !position || !amount) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      if (![1, 2, 3].includes(position)) {
        return res.status(400).json({ message: "Position must be 1, 2, or 3" });
      }
      
      // Get freelancer profile
      const profile = await storage.getFreelancerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Freelancer profile not found" });
      }
      
      // Check if position is available
      const existingPositions = await storage.getPositionSubscriptions(categoryId, area);
      const takenPositions = existingPositions.map(sub => sub.position);
      
      if (takenPositions.includes(position)) {
        return res.status(409).json({ 
          message: `Position ${position} is already taken for this category and area`,
          availablePositions: [1, 2, 3].filter(pos => !takenPositions.includes(pos))
        });
      }
      
      // Enhanced validation: Check if freelancer already has a position in this category+area
      const currentPosition = existingPositions.find(sub => sub.freelancerId === profile.id);
      if (currentPosition) {
        console.log('❌ DUPLICATE POSITION PLAN - User already has position plan for this category+area');
        return res.status(409).json({ 
          success: false,
          message: "You have already taken this plan.",
          errorType: 'DUPLICATE_POSITION_PLAN',
          existingSubscription: currentPosition,
          details: {
            planType: 'position',
            categoryId,
            area,
            currentPosition: currentPosition.position,
            expiryDate: currentPosition.endDate,
            daysRemaining: Math.ceil((new Date(currentPosition.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          }
        });
      }
      
      // Create position subscription
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Position plans are monthly
      
      const subscriptionData = {
        freelancerId: profile.id,
        type: 'position' as const,
        status: 'active' as const, // Position plans are immediately active after purchase
        amount,
        endDate,
        categoryId,
        area,
        position
      };
      
      console.log('Creating position subscription:', subscriptionData);
      const subscription = await storage.createSubscription(subscriptionData);
      console.log('✅ Position subscription created and activated:', subscription);
      
      res.json({
        success: true,
        subscription: {
          id: subscription.id,
          type: subscription.type,
          amount: subscription.amount,
          endDate: subscription.endDate,
          categoryId: subscription.categoryId,
          area: subscription.area,
          position: subscription.position
        }
      });
      
    } catch (error) {
      console.error("Error purchasing position plan:", error);
      
      // Handle specific database errors
      if (error.message?.includes('unique_position_per_category_area')) {
        return res.status(409).json({ 
          message: "This position is already taken for this category and area" 
        });
      }
      
      res.status(500).json({ message: "Failed to purchase position plan" });
    }
  });

  // Test database connection
  app.get('/api/test-db', async (req: any, res) => {
    try {
      console.log('Testing database connection...');
      const result = await storage.getAllCategories();
      console.log('Database test successful, categories count:', result.length);
      res.json({ 
        status: 'success', 
        message: 'Database connection working',
        categoriesCount: result.length 
      });
    } catch (error) {
      console.error('Database test failed:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message 
      });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/leads', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get('/api/admin/verifications/pending', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const pendingVerifications = await storage.getPendingVerifications();
      res.json(pendingVerifications);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  app.post('/api/admin/verifications/:freelancerId/:status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { freelancerId, status } = req.params;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      await storage.updateVerificationStatus(freelancerId, status as 'approved' | 'rejected');
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating verification status:", error);
      res.status(500).json({ message: "Failed to update verification" });
    }
  });

  // Payment routes
  app.post('/api/payments/create-order', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Payment order creation request received:', {
        body: req.body,
        userId: req.user?.claims?.sub,
        headers: {
          authorization: req.headers.authorization ? 'Present' : 'Missing',
          'x-firebase-user-id': req.headers['x-firebase-user-id'] || 'Missing'
        }
      });

      const { amount, currency = 'INR', description, subscriptionId, paymentType, positionPlanDetails } = req.body;
      const userId = req.user.claims.sub;

      if (!userId) {
        console.error('No user ID found in request');
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!amount || amount <= 0) {
        console.error('Invalid amount:', amount);
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Ensure user exists in database
      console.log('Checking if user exists in database:', userId);
      let user = await storage.getUser(userId);
      
      if (!user) {
        console.log('User not found in database, creating user:', userId);
        // Create a basic user record for development
        user = await storage.upsertUser({
          id: userId,
          email: `user_${userId}@example.com`,
          firstName: 'User',
          lastName: 'Account',
          role: 'freelancer', // Default role
          profileImageUrl: null
        });
        console.log('User created successfully:', user.id);
      } else {
        console.log('User found in database:', user.id);
      }

      // Validate subscription if provided
      if (subscriptionId) {
        try {
          // Note: We don't need to validate subscription existence here since it might be created in the same flow
          console.log('Subscription ID provided:', subscriptionId);
        } catch (error) {
          console.log('Subscription validation skipped - may be created in same flow');
        }
      }

      console.log('Creating Razorpay order with:', {
        amount: amount * 100,
        currency,
        userId,
        subscriptionId,
        description
      });

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: userId,
          subscriptionId: subscriptionId || '',
          description: description || 'Subscription payment',
          paymentType: paymentType || 'lead',
          positionPlanDetails: positionPlanDetails ? JSON.stringify(positionPlanDetails) : ''
        }
      });

      console.log('Razorpay order created successfully:', {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });

      // Create payment record in database
      const paymentData = {
        userId,
        subscriptionId: subscriptionId || null,
        amount,
        currency,
        status: 'pending',
        paymentMethod: 'razorpay',
        razorpayOrderId: order.id,
        description: description || 'Subscription payment',
        metadata: { 
          orderId: order.id,
          paymentType: paymentType || 'lead',
          positionPlanDetails: positionPlanDetails || null
        }
      };

      console.log('Creating payment record in database:', paymentData);
      console.log('Payment type from request:', paymentType);
      console.log('Position plan details from request:', positionPlanDetails);

      const payment = await storage.createPayment(paymentData);

      console.log('Payment record created successfully:', {
        paymentId: payment.id,
        orderId: order.id
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment.id
      });
    } catch (error) {
      console.error("Error creating payment order:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to create payment order";
      
      if (error.message) {
        if (error.message.includes('authentication')) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (error.message.includes('amount')) {
          errorMessage = "Invalid payment amount.";
        } else if (error.message.includes('currency')) {
          errorMessage = "Invalid currency specified.";
        } else if (error.message.includes('database')) {
          errorMessage = "Database error occurred.";
        } else if (error.message.includes('razorpay')) {
          errorMessage = "Payment gateway error. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });

  app.post('/api/payments/verify', isAuthenticated, async (req: any, res) => {
    try {
      console.log('=== PAYMENT VERIFICATION START ===');
      console.log('Request body:', req.body);
      console.log('User ID:', req.user.claims.sub);
      
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const userId = req.user.claims.sub;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.log('Missing parameters:', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
        return res.status(400).json({ 
          success: false,
          message: "Missing payment verification parameters" 
        });
      }

      console.log('Verifying signature...');
      // Verify signature first
      const signatureValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!signatureValid) {
        console.log('❌ Signature verification failed');
        return res.status(400).json({ 
          success: false,
          message: "Invalid payment signature" 
        });
      }
      console.log('✅ Signature verification successful');

      // Verify payment status with Razorpay API
      console.log('Checking payment status with Razorpay...');
      let paymentStatus = 'unknown';
      try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        console.log('Razorpay payment details:', payment);
        
        paymentStatus = payment.status;
        
        if (payment.status !== 'captured' && payment.status !== 'authorized') {
          console.log('Payment status is not successful:', payment.status);
          return res.status(400).json({ 
            success: false,
            message: `Payment status is ${payment.status}. Payment was not successful.` 
          });
        }
        
        console.log('Payment status verified as successful:', payment.status);
      } catch (razorpayError) {
        console.error('Error fetching payment from Razorpay:', razorpayError);
        // Don't fail verification if we can't reach Razorpay, but log it
        console.log('Proceeding with signature verification only');
        console.log('Note: Payment status could not be verified with Razorpay API');
      }

      console.log('Processing payment verification...');
      
      // Try to find and update the payment record
      let paymentRecord;
      try {
        // First try to find by order ID
        paymentRecord = await storage.getPaymentByOrderId(razorpay_order_id);
        
        if (!paymentRecord) {
          // If not found by order ID, try to create a new payment record
          console.log('Payment record not found, creating new one...');
          const paymentData = {
            userId,
            amount: 0, // We don't know the amount at this point
            currency: 'INR',
            status: 'success',
            paymentMethod: 'razorpay',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            description: 'Payment verified via Razorpay',
            metadata: { 
              orderId: razorpay_order_id,
              paymentId: razorpay_payment_id,
              verifiedAt: new Date().toISOString(),
              paymentStatus: paymentStatus
            }
          };
          
          paymentRecord = await storage.createPayment(paymentData);
          console.log('New payment record created:', paymentRecord.id);
        } else {
          // Update existing payment record
          console.log('Updating existing payment record...');
          paymentRecord = await storage.updatePaymentStatus(
            razorpay_order_id,
            'success',
            razorpay_payment_id,
            razorpay_signature
          );
          console.log('Payment record updated successfully');
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        
        // Even if database fails, we can still return success since Razorpay confirmed payment
        console.log('Database operation failed, but payment is verified by Razorpay');
        
        // Return success response without database dependency
        return res.json({
          success: true,
          paymentId: 'verified',
          status: 'success',
          message: 'Payment verified successfully'
        });
      }

      // Enhanced subscription activation with duplicate validation
      if (paymentRecord && paymentRecord.subscriptionId) {
        console.log('=== SUBSCRIPTION ACTIVATION WITH VALIDATION START ===');
        console.log('Activating subscription:', paymentRecord.subscriptionId);
        try {
          // Get the subscription details before activation
          const subscription = await storage.getSubscription(paymentRecord.subscriptionId);
          if (!subscription) {
            console.error('Subscription not found:', paymentRecord.subscriptionId);
            throw new Error('Subscription not found');
          }

          // Check for duplicate plans before activation
          const existingSubscriptions = await storage.getActiveSubscriptions(subscription.freelancerId);
          const hasDuplicate = existingSubscriptions.some(existingSub => 
            existingSub.id !== subscription.id && // Not the same subscription
            existingSub.type === subscription.type && 
            existingSub.status === 'active' && 
            new Date(existingSub.endDate) > new Date()
          );

          if (hasDuplicate) {
            console.log('❌ DUPLICATE PLAN DETECTED during payment verification - preventing activation');
            const duplicateSub = existingSubscriptions.find(existingSub => 
              existingSub.id !== subscription.id && 
              existingSub.type === subscription.type
            );
            
            // Return error response instead of activating
            return res.status(409).json({
              success: false,
              message: "You have already taken this plan.",
              errorType: 'DUPLICATE_PLAN_DURING_PAYMENT',
              existingSubscription: duplicateSub,
              details: {
                planType: subscription.type,
                expiryDate: duplicateSub?.endDate,
                daysRemaining: duplicateSub ? Math.ceil((new Date(duplicateSub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
              }
            });
          }

          // No duplicates found, proceed with activation
          await storage.activateSubscription(paymentRecord.subscriptionId);
          console.log('✅ Subscription activated successfully');
        } catch (subscriptionError) {
          console.error('Subscription activation failed:', subscriptionError);
          // Don't fail the verification if subscription activation fails
          // But log it for debugging
        }
        console.log('=== SUBSCRIPTION ACTIVATION WITH VALIDATION END ===');
      } else if (paymentRecord && !paymentRecord.subscriptionId) {
        // If payment exists but no subscription ID, try to find subscription by user
        console.log('No subscription ID in payment, checking for user subscriptions...');
        try {
          const user = await storage.getUser(userId);
          if (user && user.role === 'freelancer') {
            const freelancerProfile = await storage.getFreelancerProfile(userId);
            if (freelancerProfile) {
              // Get the most recent subscription for this freelancer
              const activeSubscriptions = await storage.getActiveSubscriptions(freelancerProfile.id);
              if (activeSubscriptions.length > 0) {
                const latestSubscription = activeSubscriptions[0]; // Assuming first is latest
                console.log('Found active subscription, activating:', latestSubscription.id);
                await storage.activateSubscription(latestSubscription.id);
                console.log('Subscription activated successfully');
              }
            }
          }
        } catch (subscriptionError) {
          console.error('Error finding and activating subscription:', subscriptionError);
          // Don't fail the verification
        }
      }

      // Handle position plan creation for position plan payments
      if (paymentRecord && paymentRecord.metadata && paymentRecord.metadata.paymentType === 'position' && paymentRecord.metadata.positionPlanDetails) {
        console.log('=== POSITION PLAN CREATION START ===');
        console.log('Payment record metadata:', paymentRecord.metadata);
        console.log('Position plan details:', paymentRecord.metadata.positionPlanDetails);
        
        try {
          const user = await storage.getUser(userId);
          console.log('User found:', user);
          
          if (user && user.role === 'freelancer') {
            const freelancerProfile = await storage.getFreelancerProfile(userId);
            console.log('Freelancer profile found:', freelancerProfile);
            
            if (freelancerProfile) {
              const positionPlanDetails = paymentRecord.metadata.positionPlanDetails;
              console.log('Creating position plan subscription for freelancer profile ID:', freelancerProfile.id);
              console.log('User ID:', userId);
              console.log('Position plan details:', positionPlanDetails);
              
              // Check for duplicate position plans
              const existingPositions = await storage.getPositionSubscriptions(positionPlanDetails.categoryId, positionPlanDetails.area);
              console.log('Existing positions:', existingPositions);
              
              const currentPosition = existingPositions.find(sub => sub.freelancerId === freelancerProfile.id);
              
              if (currentPosition) {
                console.log('❌ DUPLICATE POSITION PLAN - User already has position plan for this category+area');
                console.log('Current position:', currentPosition);
                // Don't create duplicate, but don't fail the payment
              } else {
                // Create position subscription
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 1); // Position plans are monthly
                
                const subscriptionData = {
                  freelancerId: freelancerProfile.id,
                  type: 'position' as const,
                  status: 'active' as const,
                  amount: paymentRecord.amount,
                  endDate,
                  categoryId: positionPlanDetails.categoryId,
                  area: positionPlanDetails.area,
                  position: positionPlanDetails.position
                };
                
                console.log('Creating position subscription with data:', subscriptionData);
                const subscription = await storage.createSubscription(subscriptionData);
                console.log('✅ Position subscription created and activated:', subscription);
                
                // Verify the subscription was created by fetching it back
                try {
                  const verifySubscription = await storage.getActiveSubscriptions(freelancerProfile.id);
                  console.log('✅ Verification - Active subscriptions after creation:', verifySubscription);
                } catch (verifyError) {
                  console.error('❌ Verification failed:', verifyError);
                }
                
                // Update payment record with subscription ID
                if (subscription && subscription.id) {
                  await storage.updatePayment(paymentRecord.id, { subscriptionId: subscription.id });
                  console.log('✅ Payment record updated with subscription ID:', subscription.id);
                }
              }
            } else {
              console.log('❌ No freelancer profile found for user:', userId);
            }
          } else {
            console.log('❌ User is not a freelancer or user not found:', user);
          }
        } catch (error) {
          console.error('❌ Error creating position plan subscription:', error);
          console.error('Error stack:', error.stack);
          // Don't fail the payment verification if position plan creation fails
        }
        console.log('=== POSITION PLAN CREATION END ===');
      } else {
        console.log('❌ Position plan creation skipped - conditions not met:');
        console.log('- Payment record exists:', !!paymentRecord);
        console.log('- Payment metadata exists:', !!(paymentRecord && paymentRecord.metadata));
        console.log('- Payment type is position:', !!(paymentRecord && paymentRecord.metadata && paymentRecord.metadata.paymentType === 'position'));
        console.log('- Position plan details exist:', !!(paymentRecord && paymentRecord.metadata && paymentRecord.metadata.positionPlanDetails));
      }

      // Determine subscription type for response
      let subscriptionType = 'lead'; // default
      
      // First check payment metadata for position plan details
      if (paymentRecord && paymentRecord.metadata && paymentRecord.metadata.paymentType) {
        subscriptionType = paymentRecord.metadata.paymentType;
        console.log('Subscription type from payment metadata:', subscriptionType);
      } else if (paymentRecord && paymentRecord.subscriptionId) {
        try {
          const subscription = await storage.getSubscription(paymentRecord.subscriptionId);
          if (subscription) {
            subscriptionType = subscription.type;
            console.log('Subscription type from subscription record:', subscriptionType);
          }
        } catch (error) {
          console.error('Error fetching subscription type:', error);
        }
      }

      console.log('=== PAYMENT VERIFICATION SUCCESS ===');
      res.json({
        success: true,
        paymentId: paymentRecord ? paymentRecord.id : 'verified',
        status: 'success',
        message: 'Payment verified successfully',
        subscriptionType: subscriptionType
      });
      
    } catch (error) {
      console.error("=== PAYMENT VERIFICATION ERROR ===");
      console.error("Error verifying payment:", error);
      
      // Return a more specific error message
      let errorMessage = "Payment verification failed";
      
      if (error.message) {
        if (error.message.includes('database') || error.message.includes('connection')) {
          errorMessage = "Database connection issue - payment may still be processed";
        } else if (error.message.includes('signature')) {
          errorMessage = "Payment signature verification failed";
        } else if (error.message.includes('razorpay')) {
          errorMessage = "Payment gateway error - please contact support";
        } else {
          errorMessage = error.message;
        }
      }
      
      res.status(500).json({ 
        success: false,
        message: errorMessage
      });
    }
  });

  app.get('/api/payments/:paymentId', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user.claims.sub;

      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  app.get('/api/payments/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.claims.sub;

      // Users can only view their own payments
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const payments = await storage.getUserPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching user payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Cleanup endpoint - Remove all active subscriptions
  app.delete('/api/admin/cleanup-subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('=== SUBSCRIPTION CLEANUP START ===');
      console.log('User requesting cleanup:', userId);
      
      // Get user to check if they have admin privileges
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        console.log('User does not have admin privileges:', user?.role);
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get all active subscriptions before deletion
      const activeSubscriptions = await storage.getActiveSubscriptions('all'); // Get all users' subscriptions
      console.log(`Found ${activeSubscriptions.length} active subscriptions to delete`);
      
      if (activeSubscriptions.length === 0) {
        console.log('No active subscriptions found');
        return res.json({ message: "No active subscriptions found", deletedCount: 0 });
      }
      
      // Delete all active subscriptions
      const deleteResult = await db.delete(subscriptions).where(eq(subscriptions.status, 'active'));
      console.log(`✅ Successfully deleted ${activeSubscriptions.length} active subscriptions`);
      
      // List the deleted subscriptions
      const deletedSubscriptions = activeSubscriptions.map((sub, index) => ({
        id: sub.id,
        type: sub.type,
        amount: sub.amount,
        endDate: sub.endDate,
        freelancerId: sub.freelancerId
      }));
      
      console.log('=== SUBSCRIPTION CLEANUP SUCCESS ===');
      
      res.json({
        message: "All active subscriptions deleted successfully",
        deletedCount: activeSubscriptions.length,
        deletedSubscriptions: deletedSubscriptions
      });
      
    } catch (error) {
      console.error('=== SUBSCRIPTION CLEANUP ERROR ===');
      console.error('Error during subscription cleanup:', error);
      res.status(500).json({ message: "Failed to cleanup subscriptions", error: error.message });
    }
  });

  // Serve cleanup page
  app.get('/cleanup-subscriptions', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/cleanup-subscriptions.html'));
  });

  // Development cleanup endpoint - Remove all active subscriptions (for development only)
  app.delete('/api/dev/cleanup-subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('=== DEVELOPMENT SUBSCRIPTION CLEANUP START ===');
      console.log('User requesting cleanup:', userId);
      
      // Get all active subscriptions before deletion
      const activeSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.status, 'active'));
      console.log(`Found ${activeSubscriptions.length} active subscriptions to delete`);
      
      if (activeSubscriptions.length === 0) {
        console.log('No active subscriptions found');
        return res.json({ message: "No active subscriptions found", deletedCount: 0 });
      }
      
      // Delete all active subscriptions
      const deleteResult = await db.delete(subscriptions).where(eq(subscriptions.status, 'active'));
      console.log(`✅ Successfully deleted ${activeSubscriptions.length} active subscriptions`);
      
      // List the deleted subscriptions
      const deletedSubscriptions = activeSubscriptions.map((sub, index) => ({
        id: sub.id,
        type: sub.type,
        amount: sub.amount,
        endDate: sub.endDate,
        freelancerId: sub.freelancerId
      }));
      
      console.log('=== DEVELOPMENT SUBSCRIPTION CLEANUP SUCCESS ===');
      
      res.json({
        message: "All active subscriptions deleted successfully",
        deletedCount: activeSubscriptions.length,
        deletedSubscriptions: deletedSubscriptions
      });
      
    } catch (error) {
      console.error('=== DEVELOPMENT SUBSCRIPTION CLEANUP ERROR ===');
      console.error('Error during subscription cleanup:', error);
      res.status(500).json({ message: "Failed to cleanup subscriptions", error: error.message });
    }
  });

  // Razorpay webhook endpoint for server-side payment confirmation
  app.post('/api/payments/webhook', async (req: any, res) => {
    try {
      console.log('=== RAZORPAY WEBHOOK RECEIVED ===');
      console.log('Webhook body:', req.body);
      
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        event,
        payload 
      } = req.body;

      // Verify webhook signature
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || getRazorpayConfig().KEY_SECRET;
      const signature = req.headers['x-razorpay-signature'];
      
      if (signature && webhookSecret) {
        try {
          const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');
          
          if (signature !== expectedSignature) {
            console.error('Webhook signature verification failed');
            console.error('Expected:', expectedSignature);
            console.error('Received:', signature);
            return res.status(400).json({ error: 'Invalid webhook signature' });
          }
          console.log('Webhook signature verified successfully');
        } catch (sigError) {
          console.error('Error in webhook signature verification:', sigError);
          return res.status(400).json({ error: 'Signature verification failed' });
        }
      } else {
        console.log('Webhook signature verification skipped - no secret or signature provided');
      }

      // Handle payment success event
      if (event === 'payment.captured' || event === 'payment.authorized') {
        console.log('Payment success event received:', event);
        
        // Verify payment status with Razorpay API
        try {
          const payment = await razorpay.payments.fetch(razorpay_payment_id);
          console.log('Razorpay payment details from webhook:', payment);
          
          if (payment.status !== 'captured' && payment.status !== 'authorized') {
            console.log('Payment status is not successful in webhook:', payment.status);
            return res.status(400).json({ error: 'Payment status verification failed' });
          }
          
          console.log('Payment status verified as successful in webhook:', payment.status);
        } catch (razorpayError) {
          console.error('Error fetching payment from Razorpay in webhook:', razorpayError);
          // Continue processing even if we can't reach Razorpay
          console.log('Proceeding with webhook processing despite Razorpay API error');
        }
        
        // Find payment by order ID
        let payment = await storage.getPaymentByOrderId(razorpay_order_id);
        
        if (payment) {
          // Update payment status
          payment = await storage.updatePaymentStatus(
            razorpay_order_id,
            'success',
            razorpay_payment_id,
            razorpay_signature
          );
          console.log('Payment status updated to success:', payment.id);
          
          // Activate subscription if exists
          if (payment.subscriptionId) {
            try {
              await storage.activateSubscription(payment.subscriptionId);
              console.log('Subscription activated via webhook:', payment.subscriptionId);
            } catch (subscriptionError) {
              console.error('Failed to activate subscription via webhook:', subscriptionError);
            }
          } else {
            // Try to find and activate subscription by user
            try {
              const user = await storage.getUser(payment.userId);
              if (user && user.role === 'freelancer') {
                const freelancerProfile = await storage.getFreelancerProfile(payment.userId);
                if (freelancerProfile) {
                  const activeSubscriptions = await storage.getActiveSubscriptions(freelancerProfile.id);
                  if (activeSubscriptions.length > 0) {
                    const latestSubscription = activeSubscriptions[0];
                    console.log('Found active subscription via webhook, activating:', latestSubscription.id);
                    await storage.activateSubscription(latestSubscription.id);
                    console.log('Subscription activated via webhook successfully');
                  }
                }
              }
            } catch (subscriptionError) {
              console.error('Error finding and activating subscription via webhook:', subscriptionError);
            }
          }
        } else {
          console.log('Payment record not found for order:', razorpay_order_id);
        }
      }
      
      // Handle payment failure event
      if (event === 'payment.failed') {
        console.log('Payment failure event received');
        
        let payment = await storage.getPaymentByOrderId(razorpay_order_id);
        if (payment) {
          payment = await storage.updatePaymentStatus(
            razorpay_order_id,
            'failed',
            razorpay_payment_id,
            razorpay_signature
          );
          console.log('Payment status updated to failed:', payment.id);
        }
      }

      res.json({ received: true });
      
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Notification endpoints
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log(`🔔 Fetching notifications for user: ${userId}`);
      
      const notifications = await storage.getNotifications(userId);
      const unreadCount = await storage.getUnreadNotificationsCount(userId);
      
      console.log(`✅ Found ${notifications.length} notifications, ${unreadCount} unread`);
      
      res.json({
        notifications,
        unreadCount
      });
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const unreadCount = await storage.getUnreadNotificationsCount(userId);
      
      res.json({ unreadCount });
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      console.log(`📖 Marking notification ${id} as read for user ${userId}`);
      
      await storage.markNotificationAsRead(id);
      
      // Get updated unread count
      const unreadCount = await storage.getUnreadNotificationsCount(userId);
      
      res.json({ 
        success: true, 
        unreadCount 
      });
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      console.log(`📖 Marking all notifications as read for user ${userId}`);
      
      await storage.markAllNotificationsAsRead(userId);
      
      res.json({ 
        success: true, 
        unreadCount: 0 
      });
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      console.log(`🗑️ Deleting notification ${id} for user ${userId}`);
      
      await storage.deleteNotification(id);
      
      // Get updated unread count
      const unreadCount = await storage.getUnreadNotificationsCount(userId);
      
      res.json({ 
        success: true, 
        unreadCount 
      });
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Test endpoint to create a sample lead
  app.post('/api/test/create-lead', async (req: any, res) => {
    try {
      console.log('🧪 Test: Creating sample lead');
      
      // Get a random category
      const categories = await db.select().from(categories).limit(1);
      if (categories.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No categories found in database' 
        });
      }
      
      const category = categories[0];
      console.log(`📋 Using category: ${category.name} (${category.id})`);
      
      // Create a test customer if needed
      let customer = await db.select().from(users).where(eq(users.role, 'customer')).limit(1);
      if (customer.length === 0) {
        // Create a test customer
        const newCustomer = await db.insert(users).values({
          id: 'test-customer-' + Date.now(),
          email: 'testcustomer@example.com',
          firstName: 'Test',
          lastName: 'Customer',
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        customer = newCustomer;
      }
      
      // Create a test lead
      const testLead = await db.insert(leads).values({
        customerId: customer[0].id,
        title: 'Test Lead - Need Professional Service',
        description: 'This is a test lead to verify the lead delivery system is working correctly.',
        budgetMin: 1000,
        budgetMax: 5000,
        location: 'Jaipur', // Common area
        categoryId: category.id,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log(`✅ Test lead created: ${testLead[0].id}`);
      
      // Check if any freelancers match this lead
      const matchingFreelancers = await db.select()
        .from(freelancerProfiles)
        .where(
          and(
            eq(freelancerProfiles.categoryId, category.id),
            sql`LOWER(${freelancerProfiles.area}) = LOWER('Jaipur')`,
            eq(freelancerProfiles.verificationStatus, 'approved'),
            eq(freelancerProfiles.isAvailable, true)
          )
        );
      
      console.log(`👷 Found ${matchingFreelancers.length} matching freelancers`);
      
      res.json({
        success: true,
        message: 'Test lead created successfully',
        lead: testLead[0],
        matchingFreelancers: matchingFreelancers.length,
        category: category.name,
        location: 'Jaipur'
      });
      
    } catch (error) {
      console.error('❌ Test lead creation error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Test lead creation failed', 
        error: error.message 
      });
    }
  });
  app.get('/api/debug/lead-system', async (req: any, res) => {
    try {
      console.log('🔍 Debug: Checking lead delivery system');
      
      // Check if there are any categories
      const categories = await db.select().from(categories).limit(5);
      console.log(`📋 Found ${categories.length} categories`);
      
      // Check if there are any freelancer profiles
      const freelancerProfiles = await db.select().from(freelancerProfiles).limit(5);
      console.log(`👷 Found ${freelancerProfiles.length} freelancer profiles`);
      
      // Check if there are any leads
      const allLeads = await db.select().from(leads).limit(5);
      console.log(`📝 Found ${allLeads.length} leads total`);
      
      // Check pending leads
      const pendingLeads = await db.select().from(leads).where(eq(leads.status, 'pending')).limit(5);
      console.log(`⏳ Found ${pendingLeads.length} pending leads`);
      
      // Sample data for testing
      const sampleData = {
        categories: categories.map(c => ({ id: c.id, name: c.name })),
        freelancerProfiles: freelancerProfiles.map(f => ({ 
          id: f.id, 
          categoryId: f.categoryId, 
          area: f.area, 
          verificationStatus: f.verificationStatus,
          isAvailable: f.isAvailable 
        })),
        leads: allLeads.map(l => ({ 
          id: l.id, 
          categoryId: l.categoryId, 
          location: l.location, 
          status: l.status 
        }))
      };
      
      res.json({
        success: true,
        message: 'Lead delivery system debug info',
        data: sampleData,
        counts: {
          categories: categories.length,
          freelancerProfiles: freelancerProfiles.length,
          totalLeads: allLeads.length,
          pendingLeads: pendingLeads.length
        }
      });
    } catch (error) {
      console.error('❌ Debug error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Debug failed', 
        error: error.message 
      });
    }
  });

  return httpServer;
}

// Helper function for Levenshtein distance calculation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}
