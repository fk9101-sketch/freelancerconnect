-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add reviews table
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" varchar NOT NULL REFERENCES "users"("id"),
  "freelancer_id" varchar NOT NULL REFERENCES "freelancer_profiles"("id"),
  "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  "review_text" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "IDX_reviews_freelancer_id" ON "reviews"("freelancer_id");
CREATE INDEX IF NOT EXISTS "IDX_reviews_customer_id" ON "reviews"("customer_id");
CREATE INDEX IF NOT EXISTS "IDX_reviews_created_at" ON "reviews"("created_at");

-- Add unique constraint to prevent multiple reviews from same customer to same freelancer
ALTER TABLE "reviews" ADD CONSTRAINT "unique_customer_freelancer_review" UNIQUE ("customer_id", "freelancer_id");
