import {
  users,
  categories,
  areas,
  freelancerProfiles,
  leads,
  subscriptions,
  leadInterests,
  payments,
  inquiries,
  reviews,
  notifications,
  freelancerLeadInteractions,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Area,
  type InsertArea,
  type FreelancerProfile,
  type InsertFreelancerProfile,
  type Lead,
  type InsertLead,
  type Subscription,
  type InsertSubscription,
  type LeadInterest,
  type InsertLeadInterest,
  type Payment,
  type InsertPayment,
  type LeadWithRelations,
  type FreelancerWithRelations,
  type Inquiry,
  type InsertInquiry,
  type Review,
  type InsertReview,
  type Notification,
  type InsertNotification,
  type FreelancerLeadInteraction,
  type InsertFreelancerLeadInteraction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, inArray, sql, or } from "drizzle-orm";

// Utility function to ensure user exists before creating/updating freelancer profile
export async function ensureUserExists(userId: string, userData?: Partial<UpsertUser>): Promise<User> {
  try {
    console.log('=== ENSURE USER EXISTS START ===');
    console.log('Storage: Ensuring user exists for ID:', userId);
    console.log('User data provided:', userData);
    
    // Validate userId
    if (!userId || userId.trim() === '') {
      console.error('ERROR: User ID is required and cannot be null or empty');
      throw new Error('User ID is required and cannot be null or empty');
    }
    
    // First, try to get the existing user
    console.log('Checking if user already exists...');
    const existingUsers = await db.select().from(users).where(eq(users.id, userId));
    
    if (existingUsers.length > 0) {
      console.log('✅ User found:', existingUsers[0]);
      console.log('=== ENSURE USER EXISTS SUCCESS (EXISTING) ===');
      return existingUsers[0];
    }
    
    // User doesn't exist, create a new one with proper error handling
    console.log('❌ User not found, creating new user with ID:', userId);
    
    // Prepare user data with fallbacks
    const defaultUserData: UpsertUser = {
      id: userId,
      email: userData?.email || `user_${userId}@example.com`,
      firstName: userData?.firstName || 'User',
      lastName: userData?.lastName || '',
      role: userData?.role || 'freelancer',
      profileImageUrl: userData?.profileImageUrl || null,
      area: userData?.area || null,
      phone: userData?.phone || null
    };
    
    console.log('Prepared user data for creation:', defaultUserData);
    
    // Use a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      try {
        console.log('Starting transaction for user creation...');
        
        // Double-check if user was created by another process during this transaction
        const checkUsers = await tx.select().from(users).where(eq(users.id, userId));
        if (checkUsers.length > 0) {
          console.log('✅ User was created by another process during transaction:', checkUsers[0]);
          console.log('=== ENSURE USER EXISTS SUCCESS (RACE CONDITION) ===');
          return checkUsers[0];
        }
        
        // Create the user
        console.log('Creating new user in transaction...');
        const [newUser] = await tx
          .insert(users)
          .values(defaultUserData)
          .returning();
        
        console.log('✅ New user created successfully:', newUser);
        console.log('=== ENSURE USER EXISTS SUCCESS (NEW USER) ===');
        return newUser;
      } catch (insertError: any) {
        console.error('❌ Error creating user in transaction:', insertError);
        console.error('Error code:', insertError.code);
        console.error('Error message:', insertError.message);
        
        // Handle specific database errors
        if (insertError.code === '23505') { // Unique violation - user was created by another process
          console.log('🔄 User already exists (race condition), fetching again...');
          const existingUser = await tx.select().from(users).where(eq(users.id, userId));
          if (existingUser.length > 0) {
            console.log('✅ User found after race condition:', existingUser[0]);
            console.log('=== ENSURE USER EXISTS SUCCESS (RACE CONDITION RESOLVED) ===');
            return existingUser[0];
          }
        }
        
        // If it's a foreign key constraint error, try with minimal data
        if (insertError.code === '23503') {
          console.log('🔄 Foreign key constraint error, trying with minimal data...');
          const minimalUserData = {
            id: userId,
            email: `user_${userId}@example.com`,
            firstName: 'User',
            lastName: '',
            role: 'freelancer' as const
          };
          
          const [minimalUser] = await tx
            .insert(users)
            .values(minimalUserData)
            .returning();
          
          console.log('✅ Minimal user created successfully:', minimalUser);
          console.log('=== ENSURE USER EXISTS SUCCESS (MINIMAL USER) ===');
          return minimalUser;
        }
        
        // If it's a not null constraint error, try with even more minimal data
        if (insertError.code === '23502') {
          console.log('🔄 Not null constraint error, trying with required fields only...');
          const requiredUserData = {
            id: userId,
            email: `user_${userId}@example.com`,
            role: 'freelancer' as const
          };
          
          const [requiredUser] = await tx
            .insert(users)
            .values(requiredUserData)
            .returning();
          
          console.log('✅ Required fields user created successfully:', requiredUser);
          console.log('=== ENSURE USER EXISTS SUCCESS (REQUIRED FIELDS USER) ===');
          return requiredUser;
        }
        
        throw new Error(`Failed to create user: ${insertError.message}`);
      }
    });
  } catch (error) {
    console.error('=== ENSURE USER EXISTS ERROR ===');
    console.error('Storage: Error ensuring user exists:', error);
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('User ID is required')) {
        throw new Error('User ID is required and cannot be null or empty');
      }
      if (error.message.includes('Failed to create user')) {
        throw new Error('Failed to create user account. Please try again or contact support.');
      }
      throw new Error(`Failed to ensure user exists: ${error.message}`);
    }
    
    throw new Error('Failed to ensure user exists due to an unexpected error');
  }
}


export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  updateUserRole(id: string, role: 'customer' | 'freelancer' | 'admin'): Promise<void>;
  updateUserArea(id: string, area: string): Promise<void>;
  updateUserProfile(id: string, updates: { firstName?: string; lastName?: string; email?: string; area?: string; phone?: string }): Promise<void>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Area operations
  getAreas(): Promise<Area[]>;
  getAreasByQuery(query: string, limit?: number): Promise<Area[]>;
  createArea(area: InsertArea): Promise<Area>;
  updateArea(id: string, updates: Partial<Area>): Promise<void>;
  deleteArea(id: string): Promise<void>;
  
  // Freelancer operations
  getFreelancerProfile(userId: string): Promise<FreelancerProfile | undefined>;
  createFreelancerProfile(profile: InsertFreelancerProfile, userData?: Partial<UpsertUser>): Promise<FreelancerProfile>;
  updateFreelancerProfile(id: string, updates: Partial<FreelancerProfile>, userData?: Partial<UpsertUser>): Promise<void>;
  upsertFreelancerProfile(userId: string, profileData: Partial<InsertFreelancerProfile>, userData?: Partial<UpsertUser>): Promise<FreelancerProfile>;
  getFreelancersByCategory(categoryId: string, area?: string): Promise<FreelancerWithRelations[]>;
  updateFreelancerOnlineStatus(freelancerId: string, isOnline: boolean): Promise<void>;
  
  // Lead operations
  createLead(lead: InsertLead): Promise<Lead>;
  getLeadsByFreelancer(freelancerId: string): Promise<LeadWithRelations[]>;
  getLeadsByCustomer(customerId: string): Promise<LeadWithRelations[]>;
  getAvailableLeads(freelancerId: string): Promise<LeadWithRelations[]>;
  acceptLead(leadId: string, freelancerId: string): Promise<void>;
  getLeadById(id: string): Promise<LeadWithRelations | undefined>;
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getActiveSubscriptions(freelancerId: string): Promise<Subscription[]>;
  hasActiveLeadPlan(freelancerId: string): Promise<boolean>;
  hasActiveSubscription(freelancerId: string): Promise<boolean>;
  getPositionSubscriptions(categoryId: string, area: string): Promise<Subscription[]>;
  getPositionPlanFreelancers(categoryId: string, area: string): Promise<FreelancerWithRelations[]>;
  getAvailableFreelancersForCustomer(customerArea: string): Promise<FreelancerWithRelations[]>;
  getSubscription(subscriptionId: string): Promise<Subscription | null>;
  getSubscriptionByFreelancerAndType(freelancerId: string, type: string): Promise<Subscription | null>;
  hasDuplicatePlan(freelancerId: string, type: string, categoryId?: string, area?: string): Promise<boolean>;
  
  // Lead interest operations
  expressInterest(leadInterest: InsertLeadInterest): Promise<LeadInterest>;
  getLeadInterests(leadId: string): Promise<LeadInterest[]>;
  
  // Inquiry operations
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiriesByFreelancer(freelancerId: string): Promise<Inquiry[]>;
  getInquiryById(inquiryId: string): Promise<Inquiry | undefined>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(paymentId: string, updates: Partial<InsertPayment>): Promise<Payment>;
  updatePaymentStatus(orderId: string, status: 'success' | 'failed' | 'cancelled', paymentId?: string, signature?: string): Promise<Payment>;
  getPayment(paymentId: string): Promise<Payment | undefined>;
  getPaymentByOrderId(orderId: string): Promise<Payment | undefined>;
  getUserPayments(userId: string): Promise<Payment[]>;
  activateSubscription(subscriptionId: string): Promise<void>;
  
  // Admin operations
  getPendingVerifications(): Promise<FreelancerWithRelations[]>;
  updateVerificationStatus(freelancerId: string, status: 'approved' | 'rejected'): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getAllLeads(): Promise<LeadWithRelations[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      console.log('Storage: Getting user with ID:', id);
      const [user] = await db.select().from(users).where(eq(users.id, id));
      console.log('Storage: Retrieved user data:', user);
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      console.log('=== UPSERT USER START ===');
      console.log('User data to upsert:', userData);
      
      // First, try to get the existing user
      const existingUsers = await db.select().from(users).where(eq(users.id, userData.id));
      
      if (existingUsers.length > 0) {
        console.log('✅ User exists, updating...');
        // User exists, update it
        const [updatedUser] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userData.id))
          .returning();
        console.log('✅ User updated successfully:', updatedUser.id);
        return updatedUser;
      } else {
        console.log('❌ User does not exist, creating new user...');
        // User doesn't exist, create it
        const [newUser] = await db
          .insert(users)
          .values(userData)
          .returning();
        console.log('✅ New user created successfully:', newUser.id);
        return newUser;
      }
    } catch (error) {
      console.error('=== UPSERT USER ERROR ===');
      console.error('Error upserting user:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    try {
      console.log('Storage: Updating user with ID:', id, 'with updates:', updates);
      const updateData = { ...updates, updatedAt: new Date() };
      await db.update(users).set(updateData).where(eq(users.id, id));
      console.log('Storage: User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserRole(id: string, role: 'customer' | 'freelancer' | 'admin'): Promise<void> {
    try {
      await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async updateUserArea(id: string, area: string): Promise<void> {
    try {
      await db.update(users).set({ area, updatedAt: new Date() }).where(eq(users.id, id));
    } catch (error) {
      console.error('Error updating user area:', error);
      throw error;
    }
  }

  async updateUserProfile(id: string, updates: { firstName?: string; lastName?: string; email?: string; area?: string; phone?: string }): Promise<void> {
    try {
      console.log('Storage: Updating user profile for ID:', id, 'with updates:', updates);
      const updateData: any = { updatedAt: new Date() };
      if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
      if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.area !== undefined) updateData.area = updates.area;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      
      console.log('Storage: Final update data:', updateData);
      await db.update(users).set(updateData).where(eq(users.id, id));
      console.log('Storage: User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.id, id));
      return category;
    } catch (error) {
      console.error('Error getting category by ID:', error);
      return undefined;
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    try {
      const [updatedCategory] = await db
        .update(categories)
        .set({ ...category, updatedAt: new Date() })
        .where(eq(categories.id, id))
        .returning();
      return updatedCategory;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await db.delete(categories).where(eq(categories.id, id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Area operations
  async getAreas(): Promise<Area[]> {
    try {
      return await db.select().from(areas).where(eq(areas.isActive, true)).orderBy(asc(areas.name));
    } catch (error) {
      console.error('Error getting areas:', error);
      return [];
    }
  }

  async getAreasByQuery(query: string, limit: number = 8): Promise<Area[]> {
    try {
      const lowerQuery = query.toLowerCase();
      const allAreas = await this.getAreas();
      
      // Simple case-insensitive partial matching
      const filteredAreas = allAreas
        .filter(area => area.name.toLowerCase().includes(lowerQuery))
        .slice(0, limit);
      
      return filteredAreas;
    } catch (error) {
      console.error('Error getting areas by query:', error);
      return [];
    }
  }

  async createArea(area: InsertArea): Promise<Area> {
    const [newArea] = await db.insert(areas).values(area).returning();
    return newArea;
  }

  async updateArea(id: string, updates: Partial<Area>): Promise<void> {
    try {
      await db.update(areas)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(areas.id, id));
    } catch (error) {
      console.error('Error updating area:', error);
      throw error;
    }
  }

  async deleteArea(id: string): Promise<void> {
    try {
      await db.delete(areas).where(eq(areas.id, id));
    } catch (error) {
      console.error('Error deleting area:', error);
      throw error;
    }
  }

  // Freelancer operations
  async getFreelancerProfile(userId: string): Promise<FreelancerProfile | undefined> {
    try {
      const [profile] = await db.select().from(freelancerProfiles).where(eq(freelancerProfiles.userId, userId));
      return profile;
    } catch (error) {
      console.error('Error getting freelancer profile:', error);
      return undefined;
    }
  }

  async getFreelancerProfileWithCategory(userId: string): Promise<(FreelancerProfile & { category?: Category }) | undefined> {
    try {
      const [profile] = await db
        .select({
          ...freelancerProfiles,
          category: {
            id: categories.id,
            name: categories.name,
            icon: categories.icon,
            color: categories.color,
            isActive: categories.isActive,
            createdAt: categories.createdAt
          }
        })
        .from(freelancerProfiles)
        .leftJoin(categories, eq(freelancerProfiles.categoryId, categories.id))
        .where(eq(freelancerProfiles.userId, userId));
      
      return profile;
    } catch (error) {
      console.error('Error getting freelancer profile with category:', error);
      return undefined;
    }
  }

  async createFreelancerProfile(profile: InsertFreelancerProfile, userData?: Partial<UpsertUser>): Promise<FreelancerProfile> {
    try {
      console.log('Storage: Creating freelancer profile for user:', profile.userId);
      
      // Validate that the user_id is not null or empty
      if (!profile.userId || profile.userId.trim() === '') {
        throw new Error('User ID is required and cannot be null or empty');
      }
      
      // Ensure the user exists before creating the profile
      await ensureUserExists(profile.userId, userData);
      
      // Use transaction to ensure atomicity
      return await db.transaction(async (tx) => {
        // Double-check if profile already exists
        const existingProfiles = await tx.select().from(freelancerProfiles).where(eq(freelancerProfiles.userId, profile.userId));
        if (existingProfiles.length > 0) {
          throw new Error('A profile already exists for this user. Use update instead.');
        }
        
        // Create the freelancer profile
        const [newProfile] = await tx.insert(freelancerProfiles).values(profile).returning();
        console.log('Storage: Freelancer profile created successfully:', newProfile);
        return newProfile;
      });
    } catch (error) {
      console.error('Storage: Error creating freelancer profile:', error);
      
      // Provide specific error messages for different failure scenarios
      if (error instanceof Error) {
        if (error.message.includes('foreign key constraint')) {
          throw new Error('Failed to save freelancer profile because user account could not be linked.');
        }
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
          throw new Error('A profile already exists for this user.');
        }
        if (error.message.includes('User ID is required')) {
          throw new Error('Invalid user session. Please log in again.');
        }
        if (error.message.includes('Failed to ensure user exists')) {
          throw new Error('Failed to save freelancer profile because user account could not be linked.');
        }
        throw new Error(`Failed to create freelancer profile: ${error.message}`);
      }
      
      throw new Error('Failed to create freelancer profile due to an unexpected error');
    }
  }

  async updateFreelancerProfile(id: string, updates: Partial<FreelancerProfile>, userData?: Partial<UpsertUser>): Promise<void> {
    try {
      console.log('Storage: Updating freelancer profile with ID:', id);
      
      // Validate that the user_id is not null or empty if it's being updated
      if (updates.userId && (!updates.userId || updates.userId.trim() === '')) {
        throw new Error('User ID is required and cannot be null or empty');
      }
      
      // If userId is being updated, ensure the user exists
      if (updates.userId) {
        await ensureUserExists(updates.userId, userData);
      }
      
      // Use transaction to ensure atomicity
      await db.transaction(async (tx) => {
        // Check if profile exists
        const existingProfiles = await tx.select().from(freelancerProfiles).where(eq(freelancerProfiles.id, id));
        if (existingProfiles.length === 0) {
          throw new Error(`Freelancer profile with id ${id} not found`);
        }
        
        // If userId is being updated, check for conflicts
        if (updates.userId && updates.userId !== existingProfiles[0].userId) {
          const conflictingProfiles = await tx.select().from(freelancerProfiles).where(eq(freelancerProfiles.userId, updates.userId));
          if (conflictingProfiles.length > 0) {
            throw new Error('Another profile already exists for this user ID');
          }
        }
        
        // Update the profile
        const result = await tx.update(freelancerProfiles)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(freelancerProfiles.id, id))
          .returning();
        
        if (result.length === 0) {
          throw new Error(`Freelancer profile with id ${id} not found`);
        }
        
        console.log('Storage: Freelancer profile updated successfully');
      });
    } catch (error) {
      console.error('Storage: Error updating freelancer profile:', error);
      
      // Provide specific error messages for different failure scenarios
      if (error instanceof Error) {
        if (error.message.includes('foreign key constraint')) {
          throw new Error('Failed to save freelancer profile because user account could not be linked.');
        }
        if (error.message.includes('User ID is required')) {
          throw new Error('Invalid user session. Please log in again.');
        }
        if (error.message.includes('Failed to ensure user exists')) {
          throw new Error('Failed to save freelancer profile because user account could not be linked.');
        }
        if (error.message.includes('Another profile already exists')) {
          throw new Error('Another profile already exists for this user ID.');
        }
        throw new Error(`Failed to update freelancer profile: ${error.message}`);
      }
      
      throw new Error('Failed to update freelancer profile due to an unexpected error');
    }
  }

  async getFreelancersByCategory(categoryId: string, area?: string): Promise<FreelancerWithRelations[]> {
    const conditions = [
      eq(freelancerProfiles.categoryId, categoryId),
      eq(freelancerProfiles.verificationStatus, 'approved'),
      eq(freelancerProfiles.isAvailable, true)
    ];
    
    // Add area filtering if area is provided
    if (area && area.trim()) {
      conditions.push(sql`LOWER(${freelancerProfiles.area}) = LOWER(${area})`);
    }
    
    const query = db
      .select()
      .from(freelancerProfiles)
      .leftJoin(users, eq(freelancerProfiles.userId, users.id))
      .leftJoin(categories, eq(freelancerProfiles.categoryId, categories.id))
      .leftJoin(subscriptions, eq(freelancerProfiles.id, subscriptions.freelancerId))
      .where(and(...conditions))
      .orderBy(desc(freelancerProfiles.rating));

    const results = await query;
    
    // Transform results to match FreelancerWithRelations type
    const freelancersMap = new Map<string, FreelancerWithRelations>();
    
    for (const row of results) {
      const freelancerId = row.freelancer_profiles.id;
      if (!freelancersMap.has(freelancerId)) {
        freelancersMap.set(freelancerId, {
          ...row.freelancer_profiles,
          user: row.users!,
          category: row.categories!,
          subscriptions: []
        });
      }
      
      if (row.subscriptions) {
        freelancersMap.get(freelancerId)!.subscriptions.push(row.subscriptions);
      }
    }
    
    return Array.from(freelancersMap.values());
  }

  async upsertFreelancerProfile(userId: string, profileData: Partial<InsertFreelancerProfile>, userData?: Partial<UpsertUser>): Promise<FreelancerProfile> {
    try {
      console.log('=== UPSERT FREELANCER PROFILE START ===');
      console.log('Storage: Upserting freelancer profile for user:', userId);
      console.log('Profile data received:', profileData);
      console.log('User data received:', userData);
      
      // Validate userId
      if (!userId || userId.trim() === '') {
        console.error('ERROR: User ID is required and cannot be null or empty');
        throw new Error('User ID is required and cannot be null or empty');
      }
      
      // Ensure the user exists first
      console.log('Calling ensureUserExists...');
      await ensureUserExists(userId, userData);
      console.log('✅ User existence ensured');
      
      // Use transaction to ensure atomicity
      console.log('Starting transaction for profile upsert...');
      return await db.transaction(async (tx) => {
        // Check if profile already exists within the transaction
        console.log('Checking if profile already exists...');
        const existingProfiles = await tx.select().from(freelancerProfiles).where(eq(freelancerProfiles.userId, userId));
        
        if (existingProfiles.length > 0) {
          console.log('✅ Profile exists, updating...');
          const existingProfile = existingProfiles[0];
          console.log('Existing profile:', existingProfile);
          
          // Update the profile
          console.log('Updating existing profile...');
          const result = await tx.update(freelancerProfiles)
            .set({ 
              ...profileData, 
              updatedAt: new Date() 
            })
            .where(eq(freelancerProfiles.id, existingProfile.id))
            .returning();
          
          if (result.length === 0) {
            console.error('❌ Failed to update existing profile');
            throw new Error('Failed to update existing profile');
          }
          
          console.log('✅ Profile updated successfully:', result[0]);
          console.log('=== UPSERT FREELANCER PROFILE SUCCESS (UPDATE) ===');
          return result[0];
        } else {
          console.log('❌ Profile does not exist, creating new one...');
          const completeProfileData: InsertFreelancerProfile = {
            userId,
            categoryId: profileData.categoryId || null, // Allow null for custom categories
            fullName: profileData.fullName || 'User', // This should be provided
            ...profileData
          };
          
          console.log('Complete profile data for creation:', completeProfileData);
          
          const [newProfile] = await tx.insert(freelancerProfiles).values(completeProfileData).returning();
          console.log('✅ Profile created successfully:', newProfile);
          console.log('=== UPSERT FREELANCER PROFILE SUCCESS (CREATE) ===');
          return newProfile;
        }
      });
    } catch (error) {
      console.error('=== UPSERT FREELANCER PROFILE ERROR ===');
      console.error('Storage: Error upserting freelancer profile:', error);
      console.error('Error stack:', error.stack);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes('foreign key constraint')) {
          throw new Error('Failed to save freelancer profile because user account could not be linked.');
        }
        if (error.message.includes('User ID is required')) {
          throw new Error('Invalid user session. Please log in again.');
        }
        if (error.message.includes('Failed to ensure user exists')) {
          throw new Error('Failed to save freelancer profile because user account could not be linked.');
        }
        throw new Error(`Failed to save freelancer profile: ${error.message}`);
      }
      
      throw new Error('Failed to save freelancer profile due to an unexpected error');
    }
  }

  async updateFreelancerOnlineStatus(freelancerId: string, isOnline: boolean): Promise<void> {
    await db.update(freelancerProfiles).set({ 
      isOnline, 
      lastSeen: new Date(),
      updatedAt: new Date() 
    }).where(eq(freelancerProfiles.id, freelancerId));
  }

  // Lead operations
  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async getLeadsByFreelancer(freelancerId: string): Promise<LeadWithRelations[]> {
    const results = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.customerId, users.id))
      .leftJoin(categories, eq(leads.categoryId, categories.id))
      .leftJoin(freelancerProfiles, eq(leads.acceptedBy, freelancerProfiles.id))
      .where(eq(leads.acceptedBy, freelancerId))
      .orderBy(desc(leads.createdAt));

    return results.map(row => ({
      ...row.leads,
      customer: row.users!,
      category: row.categories!,
      acceptedByFreelancer: row.freelancer_profiles ? {
        ...row.freelancer_profiles,
        user: row.users!,
        category: row.categories!,
        subscriptions: []
      } : undefined
    }));
  }

  async getLeadsByCustomer(customerId: string): Promise<LeadWithRelations[]> {
    const results = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.customerId, users.id))
      .leftJoin(categories, eq(leads.categoryId, categories.id))
      .leftJoin(freelancerProfiles, eq(leads.acceptedBy, freelancerProfiles.id))
      .where(eq(leads.customerId, customerId))
      .orderBy(desc(leads.createdAt));

    return results.map(row => ({
      ...row.leads,
      customer: row.users!,
      category: row.categories!,
      acceptedByFreelancer: row.freelancer_profiles ? {
        ...row.freelancer_profiles,
        user: row.users!,
        category: row.categories!,
        subscriptions: []
      } : undefined
    }));
  }

  async getAvailableLeads(freelancerId: string): Promise<LeadWithRelations[]> {
    // Get freelancer's profile to determine category and area
    const [freelancer] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.id, freelancerId));

    if (!freelancer) return [];

    // Return leads for ALL freelancers (both free and paid) - plan validation happens during acceptance
    let results;
    
    // First try with area matching
    results = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.customerId, users.id))
      .leftJoin(categories, eq(leads.categoryId, categories.id))
      .where(
        and(
          eq(leads.status, 'pending'),
          eq(leads.categoryId, freelancer.categoryId),
          // Filter leads by area - case insensitive matching
          sql`LOWER(${leads.location}) LIKE LOWER(${`%${freelancer.area}%`})`
        )
      )
      .orderBy(desc(leads.createdAt));

    // If no results, try without area filter (for testing)
    if (results.length === 0) {
      results = await db
        .select()
        .from(leads)
        .leftJoin(users, eq(leads.customerId, users.id))
        .leftJoin(categories, eq(leads.categoryId, categories.id))
        .where(
          and(
            eq(leads.status, 'pending'),
            eq(leads.categoryId, freelancer.categoryId)
          )
        )
        .orderBy(desc(leads.createdAt));
    }

    return results.map(row => ({
      ...row.leads,
      customer: row.users!,
      category: row.categories!
    }));
  }

  async acceptLead(leadId: string, freelancerId: string): Promise<void> {
    await db.update(leads).set({ 
      acceptedBy: freelancerId, 
      acceptedAt: new Date(),
      status: 'accepted',
      updatedAt: new Date()
    }).where(eq(leads.id, leadId));
  }

  async getLeadById(id: string): Promise<LeadWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.customerId, users.id))
      .leftJoin(categories, eq(leads.categoryId, categories.id))
      .leftJoin(freelancerProfiles, eq(leads.acceptedBy, freelancerProfiles.id))
      .where(eq(leads.id, id));

    if (!result) return undefined;

    return {
      ...result.leads,
      customer: result.users!,
      category: result.categories!,
      acceptedByFreelancer: result.freelancer_profiles ? {
        ...result.freelancer_profiles,
        user: result.users!,
        category: result.categories!,
        subscriptions: []
      } as FreelancerWithRelations : undefined
    };
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    try {
      console.log('=== CREATE SUBSCRIPTION START ===');
      console.log('Subscription data to insert:', subscription);
      console.log('Database connection status:', db ? 'Connected' : 'Not connected');
      
      const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
      console.log('✅ Subscription created successfully:', newSubscription);
      console.log('=== CREATE SUBSCRIPTION SUCCESS ===');
      return newSubscription;
    } catch (error) {
      console.error('=== CREATE SUBSCRIPTION ERROR ===');
      console.error('Error creating subscription:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack
      });
      throw error;
    }
  }

  async getActiveSubscriptions(freelancerId: string): Promise<Subscription[]> {
    if (!db || !db.select) {
      // Return empty array for development
      return [];
    }
    
    return await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.freelancerId, freelancerId),
          eq(subscriptions.status, 'active'),
          sql`${subscriptions.endDate} > NOW()`
        )
      );
  }

  async hasActiveLeadPlan(freelancerId: string): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.freelancerId, freelancerId),
          eq(subscriptions.type, 'lead'),
          eq(subscriptions.status, 'active'),
          sql`${subscriptions.endDate} > NOW()`
        )
      );

    return (result?.count || 0) > 0;
  }

  async hasActiveSubscription(freelancerId: string): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.freelancerId, freelancerId),
          eq(subscriptions.status, 'active'),
          sql`${subscriptions.endDate} > NOW()`
        )
      );

    return (result?.count || 0) > 0;
  }

  async getPositionSubscriptions(categoryId: string, area: string): Promise<Subscription[]> {
    if (!db || !db.select) {
      return [];
    }
    
    return await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.type, 'position'),
          eq(subscriptions.categoryId, categoryId),
          eq(subscriptions.area, area),
          eq(subscriptions.status, 'active'),
          sql`${subscriptions.endDate} > NOW()`
        )
      )
      .orderBy(asc(subscriptions.position));
  }

  async getPositionPlanFreelancers(categoryId: string, area: string): Promise<FreelancerWithRelations[]> {
    const results = await db
      .select()
      .from(freelancerProfiles)
      .leftJoin(users, eq(freelancerProfiles.userId, users.id))
      .leftJoin(categories, eq(freelancerProfiles.categoryId, categories.id))
      .leftJoin(subscriptions, and(
        eq(freelancerProfiles.id, subscriptions.freelancerId),
        eq(subscriptions.type, 'position'),
        eq(subscriptions.status, 'active'),
        eq(subscriptions.categoryId, categoryId),
        eq(subscriptions.area, area),
        sql`${subscriptions.endDate} > NOW()`
      ))
      .where(
        and(
          eq(freelancerProfiles.categoryId, categoryId),
          eq(freelancerProfiles.verificationStatus, 'approved'),
          eq(freelancerProfiles.isAvailable, true),
          // Filter by area - only show freelancers from the same area
          sql`LOWER(${freelancerProfiles.area}) = LOWER(${area})`
        )
      )
      .orderBy(asc(subscriptions.position));

    const freelancersMap = new Map<string, FreelancerWithRelations>();
    
    for (const row of results) {
      const freelancerId = row.freelancer_profiles.id;
      if (!freelancersMap.has(freelancerId)) {
        freelancersMap.set(freelancerId, {
          ...row.freelancer_profiles,
          user: row.users!,
          category: row.categories!,
          subscriptions: []
        });
      }
      
      if (row.subscriptions) {
        freelancersMap.get(freelancerId)!.subscriptions.push(row.subscriptions);
      }
    }
    
    // Sort by position (1, 2, 3) and then by rating for freelancers without position plans
    const sortedFreelancers = Array.from(freelancersMap.values()).sort((a, b) => {
      const aPosition = a.subscriptions.find(s => s.type === 'position' && s.status === 'active')?.position || 999;
      const bPosition = b.subscriptions.find(s => s.type === 'position' && s.status === 'active')?.position || 999;
      
      if (aPosition !== bPosition) {
        return aPosition - bPosition;
      }
      
      // If same position or no position, sort by rating
      const aRating = parseFloat(a.rating?.toString() || '0');
      const bRating = parseFloat(b.rating?.toString() || '0');
      return bRating - aRating;
    });
    
    return sortedFreelancers;
  }

  async getAvailableFreelancersForCustomer(customerArea: string): Promise<FreelancerWithRelations[]> {
    try {
      console.log(`🔍 Searching for freelancers in area: ${customerArea}`);

      // First, get all freelancers in the area with basic info
      const freelancerResults = await db
        .select()
        .from(freelancerProfiles)
        .leftJoin(users, eq(freelancerProfiles.userId, users.id))
        .leftJoin(categories, eq(freelancerProfiles.categoryId, categories.id))
        .where(
          and(
            eq(freelancerProfiles.verificationStatus, 'approved'),
            eq(freelancerProfiles.isAvailable, true),
            sql`LOWER(${freelancerProfiles.area}) = LOWER(${customerArea})`
          )
        );

      console.log(`📊 Found ${freelancerResults.length} freelancers in area ${customerArea}`);

      // Get active subscriptions for these freelancers
      const freelancerIds = freelancerResults.map(row => row.freelancer_profiles.id);
      
      let activeSubscriptions: any[] = [];
      if (freelancerIds.length > 0) {
        activeSubscriptions = await db
          .select()
          .from(subscriptions)
          .where(
            and(
              inArray(subscriptions.freelancerId, freelancerIds),
              eq(subscriptions.status, 'active'),
              sql`${subscriptions.endDate} > NOW()`
            )
          );
      }

      console.log(`💳 Found ${activeSubscriptions.length} active subscriptions`);

      // Create a map of freelancer ID to active subscriptions
      const subscriptionMap = new Map();
      activeSubscriptions.forEach(sub => {
        if (!subscriptionMap.has(sub.freelancerId)) {
          subscriptionMap.set(sub.freelancerId, []);
        }
        subscriptionMap.get(sub.freelancerId).push(sub);
      });

      // Build the final result
      const freelancersWithRelations: FreelancerWithRelations[] = freelancerResults
        .filter(row => {
          // Only include freelancers who have at least one active subscription
          const hasActiveSubscription = subscriptionMap.has(row.freelancer_profiles.id);
          if (!hasActiveSubscription) {
            console.log(`❌ Freelancer ${row.freelancer_profiles.fullName} (${row.freelancer_profiles.id}) has no active subscription`);
          }
          return hasActiveSubscription;
        })
        .map(row => ({
          ...row.freelancer_profiles,
          user: row.users!,
          category: row.categories!,
          subscriptions: subscriptionMap.get(row.freelancer_profiles.id) || []
        }))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));

      console.log(`✅ Returning ${freelancersWithRelations.length} freelancers with active subscriptions`);
      return freelancersWithRelations;
    } catch (error) {
      console.error('Error getting available freelancers for customer:', error);
      return [];
    }
  }

  // Get all freelancers for customer dashboard - NO VISIBILITY RESTRICTIONS
  async getAllFreelancers(): Promise<FreelancerWithRelations[]> {
    try {
      // Remove all visibility restrictions - show ALL freelancers regardless of status
      const results = await db
        .select()
        .from(freelancerProfiles)
        .leftJoin(users, eq(freelancerProfiles.userId, users.id))
        .leftJoin(categories, eq(freelancerProfiles.categoryId, categories.id))
        .leftJoin(subscriptions, and(
          eq(freelancerProfiles.id, subscriptions.freelancerId),
          eq(subscriptions.status, 'active'),
          sql`${subscriptions.endDate} > NOW()`
        ))
        .orderBy(desc(freelancerProfiles.createdAt));

      const freelancersMap = new Map<string, FreelancerWithRelations>();

      for (const row of results) {
        const freelancerId = row.freelancer_profiles.id;
        
        if (!freelancersMap.has(freelancerId)) {
          freelancersMap.set(freelancerId, {
            ...row.freelancer_profiles,
            user: row.users!,
            category: row.categories!,
            subscriptions: []
          });
        }

        if (row.subscriptions) {
          freelancersMap.get(freelancerId)!.subscriptions.push(row.subscriptions);
        }
      }
      
      const allFreelancers = Array.from(freelancersMap.values());
      console.log(`✅ getAllFreelancers: Returning ${allFreelancers.length} freelancers with NO visibility restrictions`);
      return allFreelancers;
    } catch (error) {
      console.error('Error getting all freelancers:', error);
      return [];
    }
  }

  // Lead interest operations
  async expressInterest(leadInterest: InsertLeadInterest): Promise<LeadInterest> {
    const [newInterest] = await db.insert(leadInterests).values(leadInterest).returning();
    return newInterest;
  }

  async getLeadInterests(leadId: string): Promise<LeadInterest[]> {
    return await db.select().from(leadInterests).where(eq(leadInterests.leadId, leadId));
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
      const [newPayment] = await db.insert(payments).values(payment).returning();
      return newPayment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  async updatePayment(paymentId: string, updates: Partial<InsertPayment>): Promise<Payment> {
    try {
      const [updatedPayment] = await db
        .update(payments)
        .set({ 
          ...updates,
          updatedAt: new Date() 
        })
        .where(eq(payments.id, paymentId))
        .returning();
      
      if (!updatedPayment) {
        throw new Error('Payment not found');
      }
      
      return updatedPayment;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw new Error(`Failed to update payment: ${error.message}`);
    }
  }

  async updatePaymentStatus(orderId: string, status: 'success' | 'failed' | 'cancelled', paymentId?: string, signature?: string): Promise<Payment> {
    try {
      const [updatedPayment] = await db
        .update(payments)
        .set({ 
          status, 
          razorpayPaymentId: paymentId, 
          razorpaySignature: signature, 
          updatedAt: new Date() 
        })
        .where(eq(payments.razorpayOrderId, orderId))
        .returning();
      
      if (!updatedPayment) {
        throw new Error(`No payment found with order ID: ${orderId}`);
      }
      
      return updatedPayment;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  async getPayment(paymentId: string): Promise<Payment | undefined> {
    try {
      const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
      return payment;
    } catch (error) {
      console.error('Error getting payment:', error);
      return undefined;
    }
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | undefined> {
    try {
      const [payment] = await db.select().from(payments).where(eq(payments.razorpayOrderId, orderId));
      return payment;
    } catch (error) {
      console.error('Error getting payment by order ID:', error);
      return undefined;
    }
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, subscriptionId));
      
      return subscription || null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  async getSubscriptionByFreelancerAndType(freelancerId: string, type: string): Promise<Subscription | null> {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.freelancerId, freelancerId),
            eq(subscriptions.type, type),
            eq(subscriptions.status, 'active'),
            sql`${subscriptions.endDate} > NOW()`
          )
        );
      
      return subscription || null;
    } catch (error) {
      console.error('Error fetching subscription by freelancer and type:', error);
      return null;
    }
  }

  async hasDuplicatePlan(freelancerId: string, type: string, categoryId?: string, area?: string): Promise<boolean> {
    try {
      let whereConditions = [
        eq(subscriptions.freelancerId, freelancerId),
        eq(subscriptions.type, type),
        eq(subscriptions.status, 'active'),
        sql`${subscriptions.endDate} > NOW()`
      ];

      // For position plans, also check category and area
      if (type === 'position' && categoryId && area) {
        whereConditions.push(eq(subscriptions.categoryId, categoryId));
        whereConditions.push(eq(subscriptions.area, area));
      }

      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(subscriptions)
        .where(and(...whereConditions));

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking for duplicate plan:', error);
      return false;
    }
  }

  async activateSubscription(subscriptionId: string): Promise<void> {
    try {
      const [updatedSubscription] = await db
        .update(subscriptions)
        .set({ 
          status: 'active',
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, subscriptionId))
        .returning();
      
      if (!updatedSubscription) {
        throw new Error(`No subscription found with ID: ${subscriptionId}`);
      }
      
      console.log('Subscription activated successfully:', subscriptionId);
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw new Error(`Failed to activate subscription: ${error.message}`);
    }
  }

  // Admin operations
  async getPendingVerifications(): Promise<FreelancerWithRelations[]> {
    const results = await db
      .select()
      .from(freelancerProfiles)
      .leftJoin(users, eq(freelancerProfiles.userId, users.id))
      .leftJoin(categories, eq(freelancerProfiles.categoryId, categories.id))
      .where(eq(freelancerProfiles.verificationStatus, 'pending'))
      .orderBy(desc(freelancerProfiles.createdAt));

    return results.map(row => ({
      ...row.freelancer_profiles,
      user: row.users!,
      category: row.categories!,
      subscriptions: []
    }));
  }

  async updateVerificationStatus(freelancerId: string, status: 'approved' | 'rejected'): Promise<void> {
    await db.update(freelancerProfiles).set({ 
      verificationStatus: status,
      updatedAt: new Date()
    }).where(eq(freelancerProfiles.id, freelancerId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllLeads(): Promise<LeadWithRelations[]> {
    const results = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.customerId, users.id))
      .leftJoin(categories, eq(leads.categoryId, categories.id))
      .leftJoin(freelancerProfiles, eq(leads.acceptedBy, freelancerProfiles.id))
      .orderBy(desc(leads.createdAt));

    return results.map(row => ({
      ...row.leads,
      customer: row.users!,
      category: row.categories!,
      acceptedByFreelancer: row.freelancer_profiles ? {
        ...row.freelancer_profiles,
        user: row.users!,
        category: row.categories!,
        subscriptions: []
      } as FreelancerWithRelations : undefined
    }));
  }

  // Inquiry methods
  async createInquiry(inquiryData: InsertInquiry): Promise<Inquiry> {
    try {
      console.log('🔍 Storage: Creating inquiry with data:', inquiryData);
      
      const [inquiry] = await db
        .insert(inquiries)
        .values(inquiryData)
        .returning();
      
      console.log('✅ Storage: Inquiry created successfully:', inquiry);
      return inquiry;
    } catch (error) {
      console.error('❌ Storage: Error creating inquiry:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        stack: error.stack
      });
      throw new Error(`Failed to create inquiry: ${error.message}`);
    }
  }

  async getInquiriesByFreelancer(freelancerId: string): Promise<Inquiry[]> {
    try {
      return await db
        .select()
        .from(inquiries)
        .where(eq(inquiries.freelancerId, freelancerId))
        .orderBy(desc(inquiries.createdAt));
    } catch (error) {
      console.error('Error fetching inquiries by freelancer:', error);
      throw new Error(`Failed to fetch inquiries: ${error.message}`);
    }
  }

  async getInquiryById(inquiryId: string): Promise<Inquiry | undefined> {
    try {
      const [inquiry] = await db
        .select()
        .from(inquiries)
        .where(eq(inquiries.id, inquiryId));
      
      return inquiry;
    } catch (error) {
      console.error('Error fetching inquiry by ID:', error);
      throw new Error(`Failed to fetch inquiry: ${error.message}`);
    }
  }

  async getInquiriesByCustomer(customerId: string): Promise<Inquiry[]> {
    try {
      return await db
        .select()
        .from(inquiries)
        .where(eq(inquiries.customerId, customerId))
        .orderBy(desc(inquiries.createdAt));
    } catch (error) {
      console.error('Error fetching inquiries by customer:', error);
      throw new Error(`Failed to fetch inquiries: ${error.message}`);
    }
  }

  async updateInquiryStatus(inquiryId: string, status: string): Promise<void> {
    try {
      await db
        .update(inquiries)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(inquiries.id, inquiryId));
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      throw new Error(`Failed to update inquiry status: ${error.message}`);
    }
  }

  // Review methods
  async createReview(reviewData: InsertReview): Promise<Review> {
    try {
      console.log('🔍 Storage: Creating review with data:', reviewData);
      
      const [review] = await db
        .insert(reviews)
        .values(reviewData)
        .returning();
      
      console.log('✅ Storage: Review created successfully:', review);
      return review;
    } catch (error) {
      console.error('❌ Storage: Error creating review:', error);
      throw new Error(`Failed to create review: ${error.message}`);
    }
  }

  async getFreelancerReviews(freelancerId: string): Promise<Review[]> {
    try {
      const results = await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          reviewText: reviews.reviewText,
          createdAt: reviews.createdAt,
          customer: {
            firstName: users.firstName,
            lastName: users.lastName,
          }
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.customerId, users.id))
        .where(eq(reviews.freelancerId, freelancerId))
        .orderBy(desc(reviews.createdAt));
      
      return results.map(row => ({
        id: row.id,
        rating: row.rating,
        reviewText: row.reviewText,
        createdAt: row.createdAt.toISOString(),
        customer: row.customer!
      }));
    } catch (error) {
      console.error('Error fetching freelancer reviews:', error);
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }
  }

  async getCustomerReview(customerId: string, freelancerId: string): Promise<Review | null> {
    try {
      const results = await db
        .select()
        .from(reviews)
        .where(and(
          eq(reviews.customerId, customerId),
          eq(reviews.freelancerId, freelancerId)
        ));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error fetching customer review:', error);
      throw new Error(`Failed to fetch customer review: ${error.message}`);
    }
  }

  async updateFreelancerRating(freelancerId: string): Promise<void> {
    try {
      // Calculate average rating
      const result = await db
        .select({
          avgRating: sql<number>`ROUND(AVG(${reviews.rating})::numeric, 2)`
        })
        .from(reviews)
        .where(eq(reviews.freelancerId, freelancerId));
      
      const avgRating = result[0]?.avgRating || 0;
      
      // Update freelancer profile with new rating
      await db
        .update(freelancerProfiles)
        .set({ 
          rating: avgRating,
          updatedAt: new Date()
        })
        .where(eq(freelancerProfiles.id, freelancerId));
      
      console.log(`Updated freelancer ${freelancerId} rating to ${avgRating}`);
    } catch (error) {
      console.error('Error updating freelancer rating:', error);
      throw new Error(`Failed to update freelancer rating: ${error.message}`);
    }
  }

  // Notification functions
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    try {
      console.log('Creating notification:', notificationData);
      
      const [notification] = await db
        .insert(notifications)
        .values(notificationData)
        .returning();
      
      console.log('✅ Notification created:', notification.id);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const results = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
      
      return results;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      throw new Error(`Failed to fetch unread notifications count: ${error.message}`);
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ 
          isRead: true,
          updatedAt: new Date()
        })
        .where(eq(notifications.id, notificationId));
      
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ 
          isRead: true,
          updatedAt: new Date()
        })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
      
      console.log('✅ All notifications marked as read for user:', userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await db
        .delete(notifications)
        .where(eq(notifications.id, notificationId));
      
      console.log('✅ Notification deleted:', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  async getFreelancerById(id: string): Promise<FreelancerWithRelations | null> {
    try {
      // Use raw SQL query to avoid schema mismatch issues
      const freelancerResult = await db.execute(sql`
        SELECT * FROM freelancer_profiles 
        WHERE id = ${id}
        LIMIT 1
      `);
      
      if (freelancerResult.rows.length === 0) {
        return null;
      }
      
      const freelancer = freelancerResult.rows[0];
      
      // Get user data separately
      let user = null;
      if (freelancer.user_id) {
        const userResult = await db.execute(sql`
          SELECT * FROM users 
          WHERE id = ${freelancer.user_id}
          LIMIT 1
        `);
        user = userResult.rows.length > 0 ? userResult.rows[0] : null;
      }
      
      // Get category data separately
      let category = null;
      if (freelancer.category_id) {
        const categoryResult = await db.execute(sql`
          SELECT * FROM categories 
          WHERE id = ${freelancer.category_id}
          LIMIT 1
        `);
        category = categoryResult.rows.length > 0 ? categoryResult.rows[0] : null;
      }
      
      // Get subscriptions separately
      const subscriptionsResult = await db.execute(sql`
        SELECT * FROM subscriptions 
        WHERE freelancer_id = ${id}
      `);
      const subscriptions = subscriptionsResult.rows;
      
      // Get reviews separately
      const reviewsResult = await db.execute(sql`
        SELECT * FROM reviews 
        WHERE freelancer_id = ${id}
      `);
      const reviews = reviewsResult.rows;
      
      const result = {
        ...freelancer,
        user,
        category,
        subscriptions,
        reviews
      };
      
      return result;
    } catch (error) {
      console.error('Error fetching freelancer by ID:', error);
      throw new Error(`Failed to fetch freelancer: ${error.message}`);
    }
  }

  // Freelancer Lead Interactions Functions
  async createFreelancerLeadInteraction(data: InsertFreelancerLeadInteraction): Promise<FreelancerLeadInteraction> {
    try {
      console.log('Creating freelancer lead interaction:', data);
      
      const result = await db.insert(freelancerLeadInteractions).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating freelancer lead interaction:', error);
      throw new Error(`Failed to create interaction: ${error.message}`);
    }
  }

  async updateFreelancerLeadInteraction(
    freelancerId: string, 
    leadId: string, 
    updates: Partial<InsertFreelancerLeadInteraction>
  ): Promise<FreelancerLeadInteraction | null> {
    try {
      console.log('Updating freelancer lead interaction:', { freelancerId, leadId, updates });
      
      const result = await db
        .update(freelancerLeadInteractions)
        .set({ ...updates, updatedAt: new Date() })
        .where(
          and(
            eq(freelancerLeadInteractions.freelancerId, freelancerId),
            eq(freelancerLeadInteractions.leadId, leadId)
          )
        )
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error updating freelancer lead interaction:', error);
      throw new Error(`Failed to update interaction: ${error.message}`);
    }
  }

  async getFreelancerLeadInteraction(
    freelancerId: string, 
    leadId: string
  ): Promise<FreelancerLeadInteraction | null> {
    try {
      const result = await db
        .select()
        .from(freelancerLeadInteractions)
        .where(
          and(
            eq(freelancerLeadInteractions.freelancerId, freelancerId),
            eq(freelancerLeadInteractions.leadId, leadId)
          )
        )
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching freelancer lead interaction:', error);
      throw new Error(`Failed to fetch interaction: ${error.message}`);
    }
  }

  async getFreelancerLeadInteractions(freelancerId: string): Promise<FreelancerLeadInteraction[]> {
    try {
      const result = await db
        .select()
        .from(freelancerLeadInteractions)
        .where(eq(freelancerLeadInteractions.freelancerId, freelancerId))
        .orderBy(desc(freelancerLeadInteractions.notifiedAt));
      
      return result;
    } catch (error) {
      console.error('Error fetching freelancer lead interactions:', error);
      throw new Error(`Failed to fetch interactions: ${error.message}`);
    }
  }

  async getLeadsWithInteractionsForFreelancer(freelancerId: string): Promise<LeadWithRelations[]> {
    try {
      console.log('Fetching leads with interactions for freelancer:', freelancerId);
      
      // Get all leads that this freelancer has interacted with OR accepted
      const interactionsResult = await db.execute(sql`
        SELECT DISTINCT l.*, 
               u.first_name, u.last_name, u.email, u.phone,
               c.name as category_name, c.icon as category_icon, c.color as category_color,
               fp.id as accepted_by_id, fp.full_name as accepted_by_name,
               fli.status as interaction_status, fli.missed_reason, fli.notes,
               fli.notified_at, fli.viewed_at, fli.responded_at,
               CASE 
                 WHEN l.accepted_by = ${freelancerId} THEN 'accepted'
                 WHEN fli.status IS NOT NULL THEN fli.status
                 ELSE 'notified'
               END as final_status
        FROM leads l
        LEFT JOIN users u ON l.customer_id = u.id
        LEFT JOIN categories c ON l.category_id = c.id
        LEFT JOIN freelancer_profiles fp ON l.accepted_by = fp.id
        LEFT JOIN freelancer_lead_interactions fli ON l.id = fli.lead_id AND fli.freelancer_id = ${freelancerId}
        WHERE (fli.freelancer_id = ${freelancerId} OR l.accepted_by = ${freelancerId})
        ORDER BY 
          CASE 
            WHEN l.accepted_by = ${freelancerId} THEN l.accepted_at
            WHEN fli.notified_at IS NOT NULL THEN fli.notified_at
            ELSE l.created_at
          END DESC
      `);
      
      const leads = interactionsResult.rows.map((row: any) => ({
        id: row.id,
        customerId: row.customer_id,
        categoryId: row.category_id,
        title: row.title,
        description: row.description,
        budgetMin: row.budget_min,
        budgetMax: row.budget_max,
        location: row.location,
        mobileNumber: row.mobile_number,
        pincode: row.pincode,
        preferredTime: row.preferred_time,
        photos: row.photos,
        status: row.status,
        acceptedBy: row.accepted_by,
        acceptedAt: row.accepted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        customer: {
          id: row.customer_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone
        },
        category: {
          id: row.category_id,
          name: row.category_name,
          icon: row.category_icon,
          color: row.category_color
        },
        acceptedByFreelancer: row.accepted_by_id ? {
          id: row.accepted_by_id,
          fullName: row.accepted_by_name
        } : null,
        interests: [],
        freelancerInteractions: row.interaction_status ? [{
          status: row.final_status,
          missedReason: row.missed_reason,
          notes: row.notes,
          notifiedAt: row.notified_at,
          viewedAt: row.viewed_at,
          respondedAt: row.responded_at
        }] : [{
          status: row.final_status,
          notifiedAt: row.accepted_at || row.created_at,
          respondedAt: row.accepted_at
        }]
      }));
      
      console.log(`Found ${leads.length} leads with interactions for freelancer ${freelancerId}`);
      return leads;
    } catch (error) {
      console.error('Error fetching leads with interactions:', error);
      throw new Error(`Failed to fetch leads with interactions: ${error.message}`);
    }
  }

  async markLeadAsMissed(
    freelancerId: string, 
    leadId: string, 
    reason: string, 
    notes?: string
  ): Promise<void> {
    try {
      console.log('Marking lead as missed:', { freelancerId, leadId, reason, notes });
      
      // Update or create interaction record
      const existingInteraction = await this.getFreelancerLeadInteraction(freelancerId, leadId);
      
      if (existingInteraction) {
        await this.updateFreelancerLeadInteraction(freelancerId, leadId, {
          status: 'missed',
          missedReason: reason,
          notes: notes,
          respondedAt: new Date()
        });
      } else {
        await this.createFreelancerLeadInteraction({
          freelancerId,
          leadId,
          status: 'missed',
          missedReason: reason,
          notes: notes,
          notifiedAt: new Date(),
          respondedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error marking lead as missed:', error);
      throw new Error(`Failed to mark lead as missed: ${error.message}`);
    }
  }

  async markLeadAsIgnored(
    freelancerId: string, 
    leadId: string, 
    notes?: string
  ): Promise<void> {
    try {
      console.log('Marking lead as ignored:', { freelancerId, leadId, notes });
      
      // Update or create interaction record
      const existingInteraction = await this.getFreelancerLeadInteraction(freelancerId, leadId);
      
      if (existingInteraction) {
        await this.updateFreelancerLeadInteraction(freelancerId, leadId, {
          status: 'ignored',
          notes: notes,
          respondedAt: new Date()
        });
      } else {
        await this.createFreelancerLeadInteraction({
          freelancerId,
          leadId,
          status: 'ignored',
          notes: notes,
          notifiedAt: new Date(),
          respondedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error marking lead as ignored:', error);
      throw new Error(`Failed to mark lead as ignored: ${error.message}`);
    }
  }
}

export const storage = new DatabaseStorage();
