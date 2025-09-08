# Neon PostgreSQL Migration Guide

This guide will help you migrate your local PostgreSQL database to Neon PostgreSQL.

## Prerequisites

1. **Neon Account**: Sign up at [console.neon.tech](https://console.neon.tech/)
2. **Node.js**: Ensure you have Node.js installed
3. **Local PostgreSQL**: Your current database should be running

## Step 1: Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Note down your connection details:
   - Host
   - Database name
   - Username
   - Password
   - Port (usually 5432)

## Step 2: Configure Environment

Run the setup script to create environment files:

```bash
node setup-neon-env.js
```

This will create:
- `.env` - Main environment file
- `.env.neon` - Neon-specific configuration
- Updated `drizzle.config.ts` for Neon support

## Step 3: Update Environment Variables

Edit the `.env` file and replace the placeholder values with your actual Neon credentials:

```env
# Neon PostgreSQL Configuration
NEON_HOST=ep-cool-darkness-123456.us-east-2.aws.neon.tech
NEON_PORT=5432
NEON_DATABASE=neondb
NEON_USER=neondb_owner
NEON_PASSWORD=your_actual_password_here
```

## Step 4: Backup Current Data (Optional but Recommended)

Before migration, create a backup of your current data:

```bash
node export-local-data.js
```

This will create a backup in the `backups/` directory with:
- Complete JSON export
- Individual table files
- SQL dump file

## Step 5: Run Migration

Execute the migration script:

```bash
node migrate-to-neon.js
```

This script will:
1. Test connections to both databases
2. Create enums in Neon
3. Create tables with proper schema
4. Export data from local PostgreSQL
5. Import data to Neon
6. Create indexes
7. Verify the migration

## Step 6: Verify Migration

After migration, verify the data integrity:

```bash
node verify-neon-migration.js
```

This will:
1. Compare row counts between databases
2. Verify schema (enums, indexes)
3. Compare sample data
4. Generate a verification report

## Step 7: Update Application Configuration

Once migration is successful, update your application to use Neon:

1. **Update environment variables** in your deployment platform
2. **Test the application** with the new database
3. **Update drizzle config** to use Neon by default

## Migration Scripts

The following scripts are available:

- `setup-neon-env.js` - Set up environment configuration
- `export-local-data.js` - Backup current data
- `migrate-to-neon.js` - Perform the migration
- `verify-neon-migration.js` - Verify migration success

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. **Check credentials**: Verify your Neon credentials are correct
2. **Check network**: Ensure your IP is whitelisted in Neon
3. **Check SSL**: Neon requires SSL connections

### Data Issues

If data doesn't match:

1. **Check logs**: Review the migration logs for errors
2. **Re-run migration**: Some tables might need to be re-migrated
3. **Manual verification**: Compare specific tables manually

### Schema Issues

If schema creation fails:

1. **Check enums**: Ensure all enums are created first
2. **Check dependencies**: Tables with foreign keys need to be created in order
3. **Check constraints**: Some constraints might need adjustment

## Rollback Plan

If you need to rollback:

1. **Keep local database running** during initial testing
2. **Use backup data** to restore if needed
3. **Update environment variables** back to local database

## Post-Migration

After successful migration:

1. **Update production environment** with Neon credentials
2. **Test all functionality** thoroughly
3. **Monitor performance** and adjust if needed
4. **Consider removing local database** after confirmation

## Support

If you encounter issues:

1. Check the verification report in `backups/`
2. Review migration logs
3. Compare data manually if needed
4. Contact support if problems persist

## Files Created

- `.env` - Environment configuration
- `.env.neon` - Neon-specific configuration
- `backups/` - Backup directory with exports
- `migrate-to-neon.js` - Migration script
- `verify-neon-migration.js` - Verification script
- `export-local-data.js` - Data export script
- `setup-neon-env.js` - Environment setup script
