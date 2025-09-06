CREATE TYPE "public"."badge_type" AS ENUM('verified', 'trusted');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('pending', 'accepted', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('razorpay', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'success', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_type" AS ENUM('lead', 'position', 'badge');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'freelancer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"icon" varchar NOT NULL,
	"color" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "freelancer_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"full_name" varchar NOT NULL,
	"professional_title" varchar,
	"profile_photo_url" varchar,
	"area" varchar,
	"working_areas" text[],
	"bio" text,
	"experience" varchar,
	"experience_description" text,
	"skills" text[],
	"portfolio_images" text[],
	"certifications" text[],
	"id_proof_url" varchar,
	"hourly_rate" varchar,
	"availability_schedule" jsonb,
	"is_available" boolean DEFAULT true,
	"rating" numeric(3, 2) DEFAULT '0',
	"total_jobs" integer DEFAULT 0,
	"verification_status" "verification_status" DEFAULT 'pending',
	"verification_docs" text[],
	"profile_completion_score" integer DEFAULT 0,
	"is_online" boolean DEFAULT false,
	"last_seen" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_interests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"freelancer_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"budget_min" integer,
	"budget_max" integer,
	"location" varchar NOT NULL,
	"pincode" varchar,
	"preferred_time" varchar,
	"photos" text[],
	"status" "lead_status" DEFAULT 'pending',
	"accepted_by" varchar,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subscription_id" varchar,
	"amount" integer NOT NULL,
	"currency" varchar DEFAULT 'INR',
	"status" "payment_status" DEFAULT 'pending',
	"payment_method" "payment_method" DEFAULT 'razorpay',
	"razorpay_order_id" varchar,
	"razorpay_payment_id" varchar,
	"razorpay_signature" varchar,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"freelancer_id" varchar NOT NULL,
	"type" "subscription_type" NOT NULL,
	"status" "subscription_status" DEFAULT 'active',
	"amount" integer NOT NULL,
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp NOT NULL,
	"category_id" varchar,
	"area" varchar,
	"position" integer,
	"badge_type" "badge_type",
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"area" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_interests" ADD CONSTRAINT "lead_interests_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_interests" ADD CONSTRAINT "lead_interests_freelancer_id_freelancer_profiles_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_accepted_by_freelancer_profiles_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."freelancer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_freelancer_id_freelancer_profiles_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");