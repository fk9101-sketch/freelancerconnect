-- =====================================================
-- COMPREHENSIVE DUPLICATE CATEGORIES REMOVAL
-- PostgreSQL Script for pgAdmin 4
-- =====================================================
-- This script will remove ALL duplicate categories
-- while maintaining data integrity
-- =====================================================

-- Step 1: Create backup table (SAFETY FIRST!)
CREATE TABLE IF NOT EXISTS categories_backup AS 
SELECT * FROM categories;

-- Step 2: Show current state
SELECT 
    'CURRENT STATE' as status,
    COUNT(*) as total_categories
FROM categories;

-- Step 3: Identify duplicates
SELECT 
    'DUPLICATES ANALYSIS' as analysis_type,
    name,
    LOWER(TRIM(name)) as normalized_name,
    COUNT(*) as count,
    ARRAY_AGG(id ORDER BY id) as all_ids,
    MIN(id) as keep_id,
    MIN(created_at) as oldest_created
FROM categories 
GROUP BY name, LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY count DESC, name;

-- Step 4: Show tables that reference categories
SELECT 
    'REFERENCING TABLES' as info,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.referenced_table_name = 'categories'
ORDER BY tc.table_name;

-- Step 5: Update freelancer_profiles references
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

-- Step 6: Update leads references
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

-- Step 7: Update subscriptions references
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

-- Step 8: Show how many categories will be deleted
SELECT 
    'CATEGORIES TO DELETE' as status,
    COUNT(*) as count
FROM categories 
WHERE id NOT IN (
    SELECT MIN(id)
    FROM categories
    GROUP BY LOWER(TRIM(name))
);

-- Step 9: Remove duplicate categories (keep the oldest one)
DELETE FROM categories 
WHERE id NOT IN (
    SELECT MIN(id)
    FROM categories
    GROUP BY LOWER(TRIM(name))
);

-- Step 10: Normalize remaining category names
UPDATE categories 
SET name = TRIM(name)
WHERE name != TRIM(name);

-- Step 11: Verify results
SELECT 
    'FINAL RESULTS' as status,
    COUNT(*) as total_categories
FROM categories;

-- Step 12: Show final categories list
SELECT 
    'FINAL CATEGORIES' as status,
    id,
    name,
    icon,
    color,
    is_active,
    created_at
FROM categories 
ORDER BY LOWER(TRIM(name)), created_at;

-- Step 13: Verify no duplicates remain
SELECT 
    'DUPLICATE CHECK' as check_type,
    name,
    COUNT(*) as count
FROM categories 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Step 14: Verify referential integrity
SELECT 
    'REFERENTIAL INTEGRITY CHECK' as check_type,
    'freelancer_profiles' as table_name,
    COUNT(*) as orphaned_references
FROM freelancer_profiles fp
LEFT JOIN categories c ON fp.category_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 
    'REFERENTIAL INTEGRITY CHECK' as check_type,
    'leads' as table_name,
    COUNT(*) as orphaned_references
FROM leads l
LEFT JOIN categories c ON l.category_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 
    'REFERENTIAL INTEGRITY CHECK' as check_type,
    'subscriptions' as table_name,
    COUNT(*) as orphaned_references
FROM subscriptions s
LEFT JOIN categories c ON s.category_id = c.id
WHERE c.id IS NULL;

-- Step 15: Show cleanup summary
SELECT 
    'CLEANUP SUMMARY' as summary_type,
    (SELECT COUNT(*) FROM categories_backup) as original_count,
    (SELECT COUNT(*) FROM categories) as final_count,
    (SELECT COUNT(*) FROM categories_backup) - (SELECT COUNT(*) FROM categories) as duplicates_removed,
    ROUND(
        ((SELECT COUNT(*) FROM categories_backup) - (SELECT COUNT(*) FROM categories))::numeric / 
        (SELECT COUNT(*) FROM categories_backup) * 100, 1
    ) as reduction_percentage;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================
-- If you need to restore from backup, run:
-- DROP TABLE categories;
-- ALTER TABLE categories_backup RENAME TO categories;
-- =====================================================
