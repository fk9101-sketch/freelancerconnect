import {
  users,
  categories,
  freelancerProfiles,
  leads,
  subscriptions,
  leadInterests,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type FreelancerProfile,
  type InsertFreelancerProfile,
  type Lead,
  type InsertLead,
  type Subscription,
  type InsertSubscription,
  type LeadInterest,
  type InsertLeadInterest,
  type LeadWithRelations,
  type FreelancerWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: 'customer' | 'freelancer' | 'admin'): Promise<void>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Freelancer operations
  getFreelancerProfile(userId: string): Promise<FreelancerProfile | undefined>;
  createFreelancerProfile(profile: InsertFreelancerProfile): Promise<FreelancerProfile>;
  updateFreelancerProfile(id: string, updates: Partial<FreelancerProfile>): Promise<void>;
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
  getPositionPlanFreelancers(categoryId: string, area: string): Promise<FreelancerWithRelations[]>;
  
  // Lead interest operations
  expressInterest(leadInterest: InsertLeadInterest): Promise<LeadInterest>;
  getLeadInterests(leadId: string): Promise<LeadInterest[]>;
  
  // Admin operations
  getPendingVerifications(): Promise<FreelancerWithRelations[]>;
  updateVerificationStatus(freelancerId: string, status: 'approved' | 'rejected'): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getAllLeads(): Promise<LeadWithRelations[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: 'customer' | 'freelancer' | 'admin'): Promise<void> {
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Freelancer operations
  async getFreelancerProfile(userId: string): Promise<FreelancerProfile | undefined> {
    const [profile] = await db.select().from(freelancerProfiles).where(eq(freelancerProfiles.userId, userId));
    return profile;
  }

  async createFreelancerProfile(profile: InsertFreelancerProfile): Promise<FreelancerProfile> {
    const [newProfile] = await db.insert(freelancerProfiles).values(profile).returning();
    return newProfile;
  }

  async updateFreelancerProfile(id: string, updates: Partial<FreelancerProfile>): Promise<void> {
    await db.update(freelancerProfiles).set({ ...updates, updatedAt: new Date() }).where(eq(freelancerProfiles.id, id));
  }

  async getFreelancersByCategory(categoryId: string, area?: string): Promise<FreelancerWithRelations[]> {
    const query = db
      .select()
      .from(freelancerProfiles)
      .leftJoin(users, eq(freelancerProfiles.userId, users.id))
      .leftJoin(categories, eq(freelancerProfiles.categoryId, categories.id))
      .leftJoin(subscriptions, eq(freelancerProfiles.id, subscriptions.freelancerId))
      .where(
        and(
          eq(freelancerProfiles.categoryId, categoryId),
          eq(freelancerProfiles.verificationStatus, 'approved'),
          area ? sql`${area} = ANY(${freelancerProfiles.workingAreas})` : undefined
        )
      )
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
    // Get freelancer's profile to determine category and working areas
    const [freelancer] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.id, freelancerId));

    if (!freelancer) return [];

    const results = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.customerId, users.id))
      .leftJoin(categories, eq(leads.categoryId, categories.id))
      .where(
        and(
          eq(leads.status, 'pending'),
          eq(leads.categoryId, freelancer.categoryId),
          freelancer.workingAreas ? sql`${leads.pincode} = ANY(${freelancer.workingAreas}) OR ${leads.location} = ANY(${freelancer.workingAreas})` : undefined
        )
      )
      .orderBy(desc(leads.createdAt));

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
      } : undefined
    };
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async getActiveSubscriptions(freelancerId: string): Promise<Subscription[]> {
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
          sql`${area} = ANY(${freelancerProfiles.workingAreas})`
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
    
    return Array.from(freelancersMap.values());
  }

  // Lead interest operations
  async expressInterest(leadInterest: InsertLeadInterest): Promise<LeadInterest> {
    const [newInterest] = await db.insert(leadInterests).values(leadInterest).returning();
    return newInterest;
  }

  async getLeadInterests(leadId: string): Promise<LeadInterest[]> {
    return await db.select().from(leadInterests).where(eq(leadInterests.leadId, leadId));
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
      } : undefined
    }));
  }
}

export const storage = new DatabaseStorage();
