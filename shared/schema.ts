import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum('user_role', ['customer', 'freelancer', 'admin']);
export const leadStatusEnum = pgEnum('lead_status', ['pending', 'accepted', 'completed', 'cancelled']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'expired', 'cancelled']);
export const subscriptionTypeEnum = pgEnum('subscription_type', ['lead', 'position', 'badge']);
export const badgeTypeEnum = pgEnum('badge_type', ['verified', 'trusted']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('customer'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  icon: varchar("icon").notNull(),
  color: varchar("color").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Freelancer profiles
export const freelancerProfiles = pgTable("freelancer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  
  // Enhanced profile fields
  professionalTitle: varchar("professional_title"),
  profilePhotoUrl: varchar("profile_photo_url"),
  workingAreas: text("working_areas").array(), // pincodes or area names
  bio: text("bio"),
  experience: varchar("experience"), // years
  experienceDescription: text("experience_description"),
  skills: text("skills").array(),
  portfolioImages: text("portfolio_images").array(),
  certifications: text("certifications").array(),
  idProofUrl: varchar("id_proof_url"),
  hourlyRate: varchar("hourly_rate"),
  
  // Availability schedule (JSON format)
  availabilitySchedule: jsonb("availability_schedule"),
  isAvailable: boolean("is_available").default(true),
  
  // System fields
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0'),
  totalJobs: integer("total_jobs").default(0),
  verificationStatus: verificationStatusEnum("verification_status").default('pending'),
  verificationDocs: text("verification_docs").array(),
  profileCompletionScore: integer("profile_completion_score").default(0),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leads/Job requests
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  location: varchar("location").notNull(),
  pincode: varchar("pincode"),
  preferredTime: varchar("preferred_time"),
  photos: text("photos").array(),
  status: leadStatusEnum("status").default('pending'),
  acceptedBy: varchar("accepted_by").references(() => freelancerProfiles.id),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  freelancerId: varchar("freelancer_id").notNull().references(() => freelancerProfiles.id),
  type: subscriptionTypeEnum("type").notNull(),
  status: subscriptionStatusEnum("status").default('active'),
  amount: integer("amount").notNull(),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  categoryId: varchar("category_id").references(() => categories.id), // for position plans
  area: varchar("area"), // for position plans
  position: integer("position"), // 1, 2, or 3 for position plans
  badgeType: badgeTypeEnum("badge_type"), // for badge plans
  createdAt: timestamp("created_at").defaultNow(),
});

// Lead interests (for free freelancers)
export const leadInterests = pgTable("lead_interests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  freelancerId: varchar("freelancer_id").notNull().references(() => freelancerProfiles.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  freelancerProfile: one(freelancerProfiles, {
    fields: [users.id],
    references: [freelancerProfiles.userId],
  }),
}));

export const freelancerProfilesRelations = relations(freelancerProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [freelancerProfiles.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [freelancerProfiles.categoryId],
    references: [categories.id],
  }),
  subscriptions: many(subscriptions),
  acceptedLeads: many(leads),
  leadInterests: many(leadInterests),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  customer: one(users, {
    fields: [leads.customerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [leads.categoryId],
    references: [categories.id],
  }),
  acceptedByFreelancer: one(freelancerProfiles, {
    fields: [leads.acceptedBy],
    references: [freelancerProfiles.id],
  }),
  interests: many(leadInterests),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  freelancers: many(freelancerProfiles),
  leads: many(leads),
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  freelancer: one(freelancerProfiles, {
    fields: [subscriptions.freelancerId],
    references: [freelancerProfiles.id],
  }),
  category: one(categories, {
    fields: [subscriptions.categoryId],
    references: [categories.id],
  }),
}));

export const leadInterestsRelations = relations(leadInterests, ({ one }) => ({
  lead: one(leads, {
    fields: [leadInterests.leadId],
    references: [leads.id],
  }),
  freelancer: one(freelancerProfiles, {
    fields: [leadInterests.freelancerId],
    references: [freelancerProfiles.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertFreelancerProfileSchema = createInsertSchema(freelancerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  totalJobs: true,
  profileCompletionScore: true,
  isOnline: true,
  lastSeen: true,
}).extend({
  skills: z.array(z.string()).optional(),
  portfolioImages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  workingAreas: z.array(z.string()).optional(),
  verificationDocs: z.array(z.string()).optional(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  acceptedBy: true,
  acceptedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertLeadInterestSchema = createInsertSchema(leadInterests).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type FreelancerProfile = typeof freelancerProfiles.$inferSelect;
export type InsertFreelancerProfile = z.infer<typeof insertFreelancerProfileSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type LeadInterest = typeof leadInterests.$inferSelect;
export type InsertLeadInterest = z.infer<typeof insertLeadInterestSchema>;

// Extended types with relations
export type LeadWithRelations = Lead & {
  customer: User;
  category: Category;
  acceptedByFreelancer?: FreelancerProfile & { user: User };
};

export type FreelancerWithRelations = FreelancerProfile & {
  user: User;
  category: Category;
  subscriptions: Subscription[];
};

// Form type for enhanced freelancer profile
export type InsertFreelancerProfileForm = z.infer<typeof insertFreelancerProfileSchema>;
