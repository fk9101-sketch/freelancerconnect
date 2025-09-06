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
export const leadStatusEnum = pgEnum('lead_status', ['pending', 'accepted', 'completed', 'cancelled', 'missed', 'ignored']);
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
  area: varchar("area"), // Customer's area/location
  phone: varchar("phone"), // Phone number with country code
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

// Areas table for storing available areas/locations
export const areas = pgTable("areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  city: varchar("city").notNull().default('Jaipur'),
  state: varchar("state").notNull().default('Rajasthan'),
  country: varchar("country").notNull().default('India'),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Freelancer profiles
export const freelancerProfiles = pgTable("freelancer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryId: varchar("category_id").references(() => categories.id), // Made nullable to support custom categories
  
  // Enhanced profile fields
  fullName: varchar("full_name").notNull(), // Freelancer's full name
  professionalTitle: varchar("professional_title"),
  profilePhotoUrl: varchar("profile_photo_url"),
  area: varchar("area"), // Freelancer's primary area/location
  workingAreas: text("working_areas"), // Freelancer's working areas

  bio: text("bio"),
  experience: varchar("experience"), // years
  experienceDescription: text("experience_description"),
  skills: text("skills").array(),
  portfolioImages: text("portfolio_images").array(),
  certifications: text("certifications").array(),
  idProofUrl: varchar("id_proof_url"),
  hourlyRate: varchar("hourly_rate"),
  customCategory: varchar("custom_category"), // For custom service categories when "Other" is selected
  
  isAvailable: boolean("is_available").default(true),
  
  // System fields
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0'),
  totalJobs: integer("total_jobs").default(0),
  verificationStatus: verificationStatusEnum("verification_status").default('pending'),
  verificationDocs: text("verification_docs").array(),

  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen"),
  profileCompletionScore: integer("profile_completion_score").default(0),
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
  mobileNumber: varchar("mobile_number").notNull(),
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
  message: text("message"),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inquiries table for customer inquiries to freelancers
export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  freelancerId: varchar("freelancer_id").notNull().references(() => freelancerProfiles.id),
  customerName: varchar("customer_name").notNull(),
  requirement: text("requirement").notNull(),
  mobileNumber: varchar("mobile_number").notNull(),
  budget: varchar("budget"),
  area: varchar("area"),
  status: varchar("status").default('new').notNull(), // new, read, replied
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table for customer reviews of freelancers
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  freelancerId: varchar("freelancer_id").notNull().references(() => freelancerProfiles.id),
  rating: integer("rating").notNull(), // 1-5 stars
  reviewText: text("review_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment enums
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'success', 'failed', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['razorpay', 'other']);

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  amount: integer("amount").notNull(),
  currency: varchar("currency").default('INR'),
  status: paymentStatusEnum("status").default('pending'),
  paymentMethod: paymentMethodEnum("payment_method").default('razorpay'),
  razorpayOrderId: varchar("razorpay_order_id"),
  razorpayPaymentId: varchar("razorpay_payment_id"),
  razorpaySignature: varchar("razorpay_signature"),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'lead', 'inquiry', 'system', etc.
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  link: varchar("link"), // URL to redirect to when clicked
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Freelancer lead interactions table - tracks all interactions between freelancers and leads
export const freelancerLeadInteractions = pgTable("freelancer_lead_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  freelancerId: varchar("freelancer_id").notNull().references(() => freelancerProfiles.id),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  status: varchar("status").notNull(), // 'notified', 'viewed', 'accepted', 'missed', 'ignored'
  missedReason: varchar("missed_reason"), // 'expired', 'no_response', 'busy', 'not_interested'
  notes: text("notes"), // Additional notes about why the lead was missed
  notifiedAt: timestamp("notified_at").defaultNow(),
  viewedAt: timestamp("viewed_at"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  freelancerProfile: one(freelancerProfiles, {
    fields: [users.id],
    references: [freelancerProfiles.userId],
  }),
  reviews: many(reviews),
  notifications: many(notifications),
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
  reviews: many(reviews),
  leadInteractions: many(freelancerLeadInteractions),
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
  freelancerInteractions: many(freelancerLeadInteractions),
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

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  customer: one(users, {
    fields: [inquiries.customerId],
    references: [users.id],
  }),
  freelancer: one(freelancerProfiles, {
    fields: [inquiries.freelancerId],
    references: [freelancerProfiles.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  customer: one(users, {
    fields: [reviews.customerId],
    references: [users.id],
  }),
  freelancer: one(freelancerProfiles, {
    fields: [reviews.freelancerId],
    references: [freelancerProfiles.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const freelancerLeadInteractionsRelations = relations(freelancerLeadInteractions, ({ one }) => ({
  freelancer: one(freelancerProfiles, {
    fields: [freelancerLeadInteractions.freelancerId],
    references: [freelancerProfiles.id],
  }),
  lead: one(leads, {
    fields: [freelancerLeadInteractions.leadId],
    references: [leads.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAreaSchema = createInsertSchema(areas).omit({
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

  isOnline: true,
  lastSeen: true,
}).extend({
  skills: z.array(z.string()).optional(),
  portfolioImages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  customCategory: z.string().optional(), // For custom service categories
  verificationDocs: z.array(z.string()).optional(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  acceptedBy: true,
  acceptedAt: true,
});

export const insertSubscriptionSchema = z.object({
  freelancerId: z.string(),
  type: z.enum(['lead', 'position', 'badge']),
  status: z.enum(['active', 'expired', 'cancelled']).optional().default('active'),
  amount: z.number().int().positive(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date(),
  categoryId: z.string().optional(),
  area: z.string().optional(),
  position: z.number().int().min(1).max(3).optional(),
  badgeType: z.enum(['verified', 'trusted']).optional(),
});

export const insertLeadInterestSchema = createInsertSchema(leadInterests).omit({
  id: true,
  createdAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFreelancerLeadInteractionSchema = createInsertSchema(freelancerLeadInteractions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Area = typeof areas.$inferSelect;
export type InsertArea = z.infer<typeof insertAreaSchema>;
export type FreelancerProfile = typeof freelancerProfiles.$inferSelect;
export type InsertFreelancerProfile = z.infer<typeof insertFreelancerProfileSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type LeadWithRelations = Lead & {
  customer: User;
  category: Category;
  acceptedByFreelancer?: FreelancerProfile;
  interests: any[];
  freelancerInteractions?: FreelancerLeadInteraction[];
};

export type InquiryWithRelations = Inquiry & {
  customer: User;
  freelancer: FreelancerProfile;
};

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type LeadInterest = typeof leadInterests.$inferSelect;
export type InsertLeadInterest = z.infer<typeof insertLeadInterestSchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type FreelancerLeadInteraction = typeof freelancerLeadInteractions.$inferSelect;
export type InsertFreelancerLeadInteraction = z.infer<typeof insertFreelancerLeadInteractionSchema>;

// Extended types with relations
export type FreelancerWithRelations = FreelancerProfile & {
  user: User | null;
  category: Category | null;
  subscriptions: Subscription[];
  reviews: Review[];
};

// Form type for enhanced freelancer profile
export type InsertFreelancerProfileForm = z.infer<typeof insertFreelancerProfileSchema>;
