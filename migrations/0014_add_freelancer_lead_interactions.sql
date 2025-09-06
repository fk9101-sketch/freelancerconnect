-- Add new lead statuses to existing enum (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'missed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_status')) THEN
        ALTER TYPE lead_status ADD VALUE 'missed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ignored' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_status')) THEN
        ALTER TYPE lead_status ADD VALUE 'ignored';
    END IF;
END $$;

-- Create freelancer_lead_interactions table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS freelancer_lead_interactions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id VARCHAR NOT NULL REFERENCES freelancer_profiles(id),
    lead_id VARCHAR NOT NULL REFERENCES leads(id),
    status VARCHAR NOT NULL, -- 'notified', 'viewed', 'accepted', 'missed', 'ignored'
    missed_reason VARCHAR, -- 'expired', 'no_response', 'busy', 'not_interested'
    notes TEXT, -- Additional notes about why the lead was missed
    notified_at TIMESTAMP DEFAULT NOW(),
    viewed_at TIMESTAMP,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_freelancer_lead_interactions_freelancer_id ON freelancer_lead_interactions(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_lead_interactions_lead_id ON freelancer_lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_lead_interactions_status ON freelancer_lead_interactions(status);
CREATE INDEX IF NOT EXISTS idx_freelancer_lead_interactions_notified_at ON freelancer_lead_interactions(notified_at);

-- Create unique constraint to prevent duplicate interactions (if it doesn't exist)
CREATE UNIQUE INDEX IF NOT EXISTS idx_freelancer_lead_interactions_unique ON freelancer_lead_interactions(freelancer_id, lead_id);
