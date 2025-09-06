-- Add phone field to users table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE "users" ADD COLUMN "phone" varchar;
        COMMENT ON COLUMN "users"."phone" IS 'Phone number with country code (e.g., +91XXXXXXXXXX)';
    END IF;
END $$;

