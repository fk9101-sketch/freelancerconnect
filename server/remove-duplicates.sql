-- =====================================================
-- REMOVE DUPLICATE CATEGORIES - PostgreSQL Script
-- =====================================================
-- This script will safely remove duplicate categories
-- while keeping only unique category names
-- =====================================================

-- Step 1: Create backup table (recommended)
CREATE TABLE IF NOT EXISTS categories_backup AS 
SELECT * FROM categories;

-- Step 2: Show current duplicates
SELECT 
    'EXACT DUPLICATES' as duplicate_type,
    name,
    COUNT(*) as count,
    ARRAY_AGG(id ORDER BY id) as all_ids,
    MIN(id) as keep_id
FROM categories 
GROUP BY name 
HAVING COUNT(*) > 1

UNION ALL

SELECT 
    'CASE-INSENSITIVE DUPLICATES' as duplicate_type,
    LOWER(TRIM(name)) as name,
    COUNT(*) as count,
    ARRAY_AGG(id ORDER BY id) as all_ids,
    MIN(id) as keep_id
FROM categories 
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1

ORDER BY duplicate_type, name;

-- Step 3: Update references to point to the kept categories
-- Update freelancer profiles
UPDATE freelancer_profiles 
SET category_id = (
    SELECT MIN(c2.id) 
    FROM categories c2 
    WHERE LOWER(TRIM(c2.name)) = LOWER(TRIM(categories.name))
)
WHERE category_id IN (
    SELECT c1.id 
    FROM categories c1 
    WHERE c1.id NOT IN (
        SELECT MIN(c2.id) 
        FROM categories c2 
        GROUP BY LOWER(TRIM(c2.name))
    )
);

-- Update leads table (if it exists)
-- Uncomment if you have a leads table
/*
UPDATE leads 
SET category_id = (
    SELECT MIN(c2.id) 
    FROM categories c2 
    WHERE LOWER(TRIM(c2.name)) = LOWER(TRIM(categories.name))
)
WHERE category_id IN (
    SELECT c1.id 
    FROM categories c1 
    WHERE c1.id NOT IN (
        SELECT MIN(c2.id) 
        FROM categories c2 
        GROUP BY LOWER(TRIM(c2.name))
    )
);
*/

-- Update subscriptions table (if it exists)
-- Uncomment if you have a subscriptions table
/*
UPDATE subscriptions 
SET category_id = (
    SELECT MIN(c2.id) 
    FROM categories c2 
    WHERE LOWER(TRIM(c2.name)) = LOWER(TRIM(categories.name))
)
WHERE category_id IN (
    SELECT c1.id 
    FROM categories c1 
    WHERE c1.id NOT IN (
        SELECT MIN(c2.id) 
        FROM categories c2 
        GROUP BY LOWER(TRIM(c2.name))
    )
);
*/

-- Step 4: Remove duplicate categories (keep the one with lowest ID)
DELETE FROM categories 
WHERE id NOT IN (
    SELECT MIN(id)
    FROM categories
    GROUP BY LOWER(TRIM(name))
);

-- Step 5: Normalize remaining category names to lowercase
UPDATE categories 
SET name = LOWER(TRIM(name))
WHERE name != LOWER(TRIM(name));

-- Step 6: Verify results
SELECT 
    'FINAL CATEGORIES' as status,
    COUNT(*) as total_categories
FROM categories;

-- Show final categories list
SELECT 
    id,
    name,
    icon,
    color,
    created_at
FROM categories 
ORDER BY LOWER(TRIM(name)), created_at;

-- Step 7: Verify no duplicates remain
SELECT 
    'DUPLICATE CHECK' as check_type,
    name,
    COUNT(*) as count
FROM categories 
GROUP BY name 
HAVING COUNT(*) > 1;

-- If you want to restore from backup (in case of issues):
-- DROP TABLE categories;
-- ALTER TABLE categories_backup RENAME TO categories;
