-- Migration to make category_id nullable in freelancer_profiles table
-- This allows for custom categories when no predefined category is selected

-- Drop the existing foreign key constraint
ALTER TABLE "freelancer_profiles" DROP CONSTRAINT IF EXISTS "freelancer_profiles_category_id_categories_id_fk";

-- Modify the column to allow NULL values
ALTER TABLE "freelancer_profiles" ALTER COLUMN "category_id" DROP NOT NULL;

-- Re-add the foreign key constraint (now allowing NULL)
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_category_id_categories_id_fk" 
FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
