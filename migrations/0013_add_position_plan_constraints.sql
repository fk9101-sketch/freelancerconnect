-- Add unique constraint to ensure only one freelancer per position per category+area
-- This ensures that for each category and area combination, only 3 freelancers can hold positions (1, 2, 3)

-- First, remove any duplicate position subscriptions that might exist
DELETE FROM subscriptions 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY category_id, area, position 
      ORDER BY created_at DESC
    ) as rn
    FROM subscriptions 
    WHERE type = 'position' 
    AND position IS NOT NULL 
    AND category_id IS NOT NULL 
    AND area IS NOT NULL
  ) t WHERE rn > 1
);

-- Add unique constraint to prevent duplicate positions
ALTER TABLE subscriptions 
ADD CONSTRAINT unique_position_per_category_area 
UNIQUE (category_id, area, position) 
WHERE type = 'position' AND position IS NOT NULL AND category_id IS NOT NULL AND area IS NOT NULL;

-- Add check constraint to ensure position values are only 1, 2, or 3
ALTER TABLE subscriptions 
ADD CONSTRAINT check_position_values 
CHECK (
  (type = 'position' AND position IN (1, 2, 3)) OR 
  (type != 'position' AND position IS NULL)
);

-- Add index for better performance on position queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_position_lookup 
ON subscriptions (category_id, area, position) 
WHERE type = 'position' AND position IS NOT NULL;
