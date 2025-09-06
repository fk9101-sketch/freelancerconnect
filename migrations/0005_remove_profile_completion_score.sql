-- Migration to remove profile_completion_score column from freelancer_profiles table
-- This removes the profile completion tracking feature

-- Remove the profile_completion_score column
ALTER TABLE "freelancer_profiles" DROP COLUMN IF EXISTS "profile_completion_score";
