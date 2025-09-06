# PostgreSQL Database Setup Guide

This guide will help you set up and configure the PostgreSQL database for the HireLocal application.

## Prerequisites

1. **PostgreSQL Server**: Make sure PostgreSQL is installed and running on your system
2. **Node.js**: Ensure Node.js is installed (version 16 or higher)
3. **npm**: Package manager for Node.js

## Database Configuration

The application is configured to connect to a PostgreSQL database with the following default settings:

- **Host**: localhost
- **Port**: 5000
- **Database**: hirelocal
- **Username**: postgres
- **Password**: Jhotwara#321

## Environment Variables

You can customize the database connection by setting the following environment variables:

```bash
DB_HOST=localhost
DB_PORT=5000
DB_NAME=hirelocal
DB_USER=postgres
DB_PASSWORD=Jhotwara#321
```

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create PostgreSQL Database

Connect to your PostgreSQL server and create the database:

```sql
CREATE DATABASE hirelocal;
```

### 3. Generate Database Migrations

```bash
npm run db:generate
```

This will create migration files in the `./migrations` directory based on your schema.

### 4. Initialize Database

```bash
npm run db:init
```

This command will:
- Connect to the PostgreSQL database
- Run all migrations to create tables
- Insert initial categories (Electrical, Plumbing, Carpentry, etc.)

### 5. Start the Application

```bash
npm run dev
```

The application will now use PostgreSQL as the main database for all operations.

## Database Schema

The application includes the following main tables:

### Users Table
- Stores customer and freelancer user accounts
- Includes role-based access (customer, freelancer, admin)
- Tracks user profiles and areas

### Categories Table
- Service categories (Electrical, Plumbing, etc.)
- Includes icons and colors for UI display

### Freelancer Profiles Table
- Detailed freelancer information
- Skills, experience, portfolio, certifications
- Verification status and working areas

### Leads Table
- Job requests from customers
- Status tracking and assignment to freelancers

### Subscriptions Table
- Premium plans for freelancers
- Lead access, position ranking, badges

### Payments Table
- Payment tracking and Razorpay integration
- Order and payment status management

### Sessions Table
- User session management
- Express session storage

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. **Check PostgreSQL Service**: Ensure PostgreSQL is running
   ```bash
   # Windows
   net start postgresql-x64-16
   
   # Linux/Mac
   sudo systemctl start postgresql
   ```

2. **Verify Credentials**: Check your database credentials in the environment variables

3. **Check Port**: Ensure PostgreSQL is running on port 5000 (or update DB_PORT)

4. **Database Exists**: Make sure the 'hirelocal' database exists

### Migration Issues

If migrations fail:

1. **Check Schema**: Verify the schema file (`shared/schema.ts`) is correct
2. **Reset Database**: Drop and recreate the database if needed
3. **Manual Migration**: Run migrations manually if automatic migration fails

### Common Errors

1. **"Database connection failed"**
   - Check if PostgreSQL is running
   - Verify connection credentials
   - Ensure database exists

2. **"Table already exists"**
   - Drop existing tables or use `npm run db:push` instead

3. **"Permission denied"**
   - Check PostgreSQL user permissions
   - Ensure user has access to the database

## Development vs Production

### Development
- Uses local PostgreSQL instance
- Mock data fallbacks removed
- Full database integration

### Production
- Set environment variables for production database
- Enable SSL connections
- Use proper session secrets

## Database Commands

```bash
# Generate new migrations
npm run db:generate

# Push schema changes (development)
npm run db:push

# Run migrations
npm run db:migrate

# Initialize database with sample data
npm run db:init
```

## Backup and Restore

### Backup Database
```bash
pg_dump -h localhost -p 5000 -U postgres hirelocal > backup.sql
```

### Restore Database
```bash
psql -h localhost -p 5000 -U postgres hirelocal < backup.sql
```

## Security Notes

1. **Change Default Password**: Update the default PostgreSQL password
2. **Environment Variables**: Use environment variables for sensitive data
3. **SSL**: Enable SSL in production environments
4. **Firewall**: Configure firewall rules appropriately

## Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify database connectivity
3. Ensure all dependencies are installed
4. Check the PostgreSQL server logs

The application is now fully integrated with PostgreSQL and will persist all user data, profiles, leads, subscriptions, and payments in the database.
