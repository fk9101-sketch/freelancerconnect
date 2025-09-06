-- Migration to fix constraint conflict
-- This migration safely handles existing constraints

-- Step 1: Drop existing foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'freelancer_profiles_category_id_categories_id_fk'
    ) THEN
        ALTER TABLE freelancer_profiles DROP CONSTRAINT freelancer_profiles_category_id_categories_id_fk;
    END IF;
END $$;

-- Step 2: Recreate the foreign key constraint safely
ALTER TABLE freelancer_profiles 
ADD CONSTRAINT freelancer_profiles_category_id_categories_id_fk 
FOREIGN KEY (category_id) REFERENCES categories(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Migration completed successfully
SELECT 'Migration 0010_fix_constraint_conflict completed successfully' as status;
