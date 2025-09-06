# Categories Database Cleanup

This directory contains scripts to clean and normalize the categories table in the HireLocal database.

## Overview

The cleanup process will:
1. **Remove duplicate categories** (e.g., 'Plumber', 'plumber', 'Plumbing')
2. **Normalize category names** (convert to lowercase, trim spaces)
3. **Update all references** (freelancer profiles, leads, subscriptions)
4. **Add missing common categories** (web developer, mobile developer, etc.)

## Scripts

### 1. `backup-categories.js`
Creates a backup of the current categories and related data before cleanup.

**Usage:**
```bash
node backup-categories.js
```

**Output:**
- Creates a backup file in `server/backups/categories-backup-{timestamp}.json`
- Shows current categories and their relationships

### 2. `clean-categories.js`
Performs the main cleanup operation.

**Usage:**
```bash
node clean-categories.js
```

**What it does:**
- Normalizes all category names (lowercase, trimmed)
- Identifies and removes duplicates
- Updates all freelancer profiles, leads, and subscriptions to point to the correct category
- Adds missing common freelance categories
- Provides detailed logging of all changes

### 3. `restore-categories.js`
Restores categories from a backup file (rollback functionality).

**Usage:**
```bash
node restore-categories.js <backup-file-path>
```

**Example:**
```bash
node restore-categories.js ./backups/categories-backup-1703123456789.json
```

## Recommended Process

1. **First, create a backup:**
   ```bash
   node backup-categories.js
   ```

2. **Review the backup output** to understand current state

3. **Run the cleanup:**
   ```bash
   node clean-categories.js
   ```

4. **Review the cleanup output** to verify changes

5. **If needed, restore from backup:**
   ```bash
   node restore-categories.js ./backups/categories-backup-{timestamp}.json
   ```

## Common Categories Added

The cleanup script ensures these common freelance categories exist:

### Technology
- Web Developer 💻
- Mobile Developer 📱
- UI/UX Designer 🎯
- Data Analyst 📊
- DevOps Engineer ⚙️
- QA Tester 🧪
- Cybersecurity Expert 🔒
- Blockchain Developer ⛓️
- Machine Learning Engineer 🤖

### Creative & Design
- Graphic Designer 🎨
- Content Writer ✍️
- Video Editor 🎬
- Photographer 📸
- Illustrator ✏️
- 3D Artist 🎭
- Game Developer 🎮

### Marketing & Business
- Digital Marketer 📈
- Social Media Manager 📱
- SEO Specialist 🔍
- Business Analyst 📊
- Project Manager 📋
- Virtual Assistant 👩‍💼

### Services
- Plumber 🔧
- Electrician ⚡
- Carpenter 🔨
- Painter 🎨
- Cleaner 🧹
- Driver 🚗
- Delivery Person 📦

### Professional Services
- Legal Consultant ⚖️
- Accountant 💰
- Tax Consultant 📋
- HR Consultant 👥
- Real Estate Agent 🏘️
- Insurance Agent 🛡️

### Health & Wellness
- Personal Trainer 💪
- Nutritionist 🥗
- Life Coach 🎯
- Yoga Instructor 🧘
- Massage Therapist 💆

### Education & Training
- Language Tutor 📚
- Music Teacher 🎵
- Dance Instructor 💃

## Database Schema

The cleanup affects these tables:
- `categories` - Main categories table
- `freelancer_profiles` - References categories via `category_id`
- `leads` - References categories via `category_id`
- `subscriptions` - References categories via `category_id`

## Safety Features

- **Transaction-based**: All changes are wrapped in a database transaction
- **Backup before cleanup**: Always create a backup first
- **Rollback capability**: Can restore from backup if needed
- **Detailed logging**: Shows exactly what changes are made
- **Reference preservation**: Updates all related records before deleting duplicates

## Troubleshooting

### Connection Issues
Make sure your database connection settings are correct in the scripts:
- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 5000)
- `DB_NAME` (default: hirelocal)
- `DB_USER` (default: postgres)
- `DB_PASSWORD` (default: Jhotwara#321)

### Permission Issues
Ensure the database user has:
- SELECT, INSERT, UPDATE, DELETE permissions on all affected tables
- Ability to create transactions

### Restore Issues
If restore fails:
1. Check that the backup file exists and is valid JSON
2. Ensure no other processes are using the database
3. Verify database connection settings

## Notes

- The cleanup is **idempotent** - running it multiple times won't cause issues
- All category names are normalized to lowercase with trimmed spaces
- Duplicate detection is case-insensitive and space-insensitive
- The script preserves the oldest category when duplicates are found
- All related records are updated to maintain referential integrity
