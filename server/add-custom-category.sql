-- Add custom_category field to freelancer_profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'freelancer_profiles' 
        AND column_name = 'custom_category'
    ) THEN
        ALTER TABLE freelancer_profiles ADD COLUMN custom_category VARCHAR;
        RAISE NOTICE 'Added custom_category column to freelancer_profiles table';
    ELSE
        RAISE NOTICE 'custom_category column already exists in freelancer_profiles table';
    END IF;
END $$;
