-- Safe migration: Add notifications table only
-- Date: 2024-01-XX

-- Only add the notifications table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE "notifications" (
          "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          "user_id" varchar NOT NULL REFERENCES "users"("id"),
          "type" varchar NOT NULL,
          "title" varchar NOT NULL,
          "message" text NOT NULL,
          "link" varchar,
          "is_read" boolean DEFAULT false,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );

        -- Create indexes for faster queries
        CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
        CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");
        CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");
        
        RAISE NOTICE 'Notifications table created successfully';
    ELSE
        RAISE NOTICE 'Notifications table already exists';
    END IF;
END $$;
