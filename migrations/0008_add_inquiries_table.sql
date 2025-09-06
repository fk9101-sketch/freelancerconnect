-- Migration: Add inquiries table
-- This table stores customer inquiries sent to freelancers

CREATE TABLE IF NOT EXISTS "inquiries" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" varchar NOT NULL REFERENCES "users"("id"),
  "freelancer_id" varchar NOT NULL REFERENCES "freelancer_profiles"("id"),
  "customer_name" varchar NOT NULL,
  "requirement" text NOT NULL,
  "mobile_number" varchar NOT NULL,
  "budget" varchar,
  "area" varchar,
  "status" varchar NOT NULL DEFAULT 'new',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "idx_inquiries_freelancer_id" ON "inquiries"("freelancer_id");
CREATE INDEX IF NOT EXISTS "idx_inquiries_customer_id" ON "inquiries"("customer_id");
CREATE INDEX IF NOT EXISTS "idx_inquiries_status" ON "inquiries"("status");
CREATE INDEX IF NOT EXISTS "idx_inquiries_created_at" ON "inquiries"("created_at");
