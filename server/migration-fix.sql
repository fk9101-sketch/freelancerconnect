-- Migration to fix freelancer profile foreign key constraint issues
-- This migration ensures proper user creation before profile creation

-- Step 1: Drop existing foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'freelancer_profiles_user_id_users_id_fk'
    ) THEN
        ALTER TABLE freelancer_profiles DROP CONSTRAINT freelancer_profiles_user_id_users_id_fk;
    END IF;
END $$;

-- Step 2: Ensure users table has proper structure
-- Add any missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Step 3: Create index on users.id for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- Step 4: Create index on freelancer_profiles.user_id for better performance
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_user_id ON freelancer_profiles(user_id);

-- Step 5: Create index on freelancer_profiles.category_id for better performance
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_category_id ON freelancer_profiles(category_id);

-- Step 6: Recreate the foreign key constraint with proper options
ALTER TABLE freelancer_profiles 
ADD CONSTRAINT freelancer_profiles_user_id_users_id_fk 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Step 7: Add foreign key constraint for category_id
ALTER TABLE freelancer_profiles 
ADD CONSTRAINT freelancer_profiles_category_id_categories_id_fk 
FOREIGN KEY (category_id) REFERENCES categories(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Step 8: Create a function to ensure user exists before profile creation
CREATE OR REPLACE FUNCTION ensure_user_exists(user_id VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        -- Create a minimal user if it doesn't exist
        INSERT INTO users (id, email, firstName, lastName, role, created_at, updated_at)
        VALUES (
            user_id, 
            'user_' || user_id || '@example.com',
            'User',
            '',
            'freelancer',
            NOW(),
            NOW()
        );
        RETURN TRUE;
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create a trigger to automatically ensure user exists before profile creation
CREATE OR REPLACE FUNCTION trigger_ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure user exists before creating profile
    PERFORM ensure_user_exists(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create the trigger
DROP TRIGGER IF EXISTS ensure_user_exists_trigger ON freelancer_profiles;
CREATE TRIGGER ensure_user_exists_trigger
    BEFORE INSERT ON freelancer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_ensure_user_exists();

-- Step 11: Create a view for easier profile management
CREATE OR REPLACE VIEW freelancer_profiles_with_users AS
SELECT 
    fp.*,
    u.email,
    u.firstName,
    u.lastName,
    u.role,
    u.area as user_area,
    u.phone,
    c.name as category_name,
    c.icon as category_icon,
    c.color as category_color
FROM freelancer_profiles fp
LEFT JOIN users u ON fp.user_id = u.id
LEFT JOIN categories c ON fp.category_id = c.id;

-- Step 12: Create a function to safely create freelancer profile
CREATE OR REPLACE FUNCTION create_freelancer_profile_safe(
    p_user_id VARCHAR,
    p_category_id VARCHAR DEFAULT NULL,
    p_full_name VARCHAR DEFAULT 'User',
    p_professional_title VARCHAR DEFAULT NULL,
    p_area VARCHAR DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_experience VARCHAR DEFAULT NULL,
    p_skills TEXT[] DEFAULT NULL,
    p_custom_category VARCHAR DEFAULT NULL
)
RETURNS VARCHAR AS $$
DECLARE
    profile_id VARCHAR;
BEGIN
    -- Ensure user exists
    PERFORM ensure_user_exists(p_user_id);
    
    -- Create or update profile
    INSERT INTO freelancer_profiles (
        user_id,
        category_id,
        full_name,
        professional_title,
        area,
        bio,
        experience,
        skills,
        custom_category,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_category_id,
        p_full_name,
        p_professional_title,
        p_area,
        p_bio,
        p_experience,
        p_skills,
        p_custom_category,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        category_id = EXCLUDED.category_id,
        full_name = EXCLUDED.full_name,
        professional_title = EXCLUDED.professional_title,
        area = EXCLUDED.area,
        bio = EXCLUDED.bio,
        experience = EXCLUDED.experience,
        skills = EXCLUDED.skills,
        custom_category = EXCLUDED.custom_category,
        updated_at = NOW()
    RETURNING id INTO profile_id;
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql;

-- Migration completed successfully
SELECT 'Migration completed successfully' as status;
