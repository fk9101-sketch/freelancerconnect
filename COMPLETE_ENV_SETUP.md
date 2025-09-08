# COMPLETE ENVIRONMENT VARIABLES SETUP

## 🚀 QUICK SETUP - COPY & PASTE READY

### **STEP 1: Netlify Environment Variables**

Go to: **Netlify Dashboard** → **Your Site** → **Site Settings** → **Environment Variables**

**Copy and paste these EXACTLY:**

```
DATABASE_URL=postgresql://neondb_owner:npg_1U4p0odrCNbP@ep-plain-dew-a1i6qgwj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=4096
CI=false
NPM_FLAGS=--production=false
FIREBASE_API_KEY=AIzaSyC4n_Cum0CvMyrIIWiehMltWO92MYnCvgw
FIREBASE_AUTH_DOMAIN=freelancer-connect-899a8.firebaseapp.com
FIREBASE_PROJECT_ID=freelancer-connect-899a8
FIREBASE_STORAGE_BUCKET=freelancer-connect-899a8.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=224541104230
FIREBASE_APP_ID=1:224541104230:web:62bb08bdd9ae55872a35a7
FIREBASE_MEASUREMENT_ID=G-GXMBYGFZPF
API_BASE_URL=https://myprojectfreelanace.netlify.app/.netlify/functions
```

### **STEP 2: Client-Side Environment Variables**

Create a file called `.env` in the `client` folder with these variables:

```
VITE_FIREBASE_API_KEY=AIzaSyC4n_Cum0CvMyrIIWiehMltWO92MYnCvgw
VITE_FIREBASE_AUTH_DOMAIN=freelancer-connect-899a8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=freelancer-connect-899a8
VITE_FIREBASE_STORAGE_BUCKET=freelancer-connect-899a8.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=224541104230
VITE_FIREBASE_APP_ID=1:224541104230:web:62bb08bdd9ae55872a35a7
VITE_FIREBASE_MEASUREMENT_ID=G-GXMBYGFZPF
VITE_API_BASE_URL=https://myprojectfreelanace.netlify.app/.netlify/functions
VITE_APP_NAME=Freelancer Connect
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

### **STEP 3: Firebase Console Configuration**

1. **Go to:** https://console.firebase.google.com/
2. **Select project:** `freelancer-connect-899a8`
3. **Authentication** → **Settings** → **Authorized domains**
4. **Add these domains:**
   - `myprojectfreelanace.netlify.app`
   - `68be6fa0d653cef0697838f1--polite-caramel-0c4794.netlify.app`
   - `localhost`

### **STEP 4: Google Cloud Console Configuration**

1. **Go to:** https://console.cloud.google.com/
2. **APIs & Services** → **Credentials**
3. **Edit your OAuth 2.0 Client ID**
4. **Authorized JavaScript origins:**
   - `https://myprojectfreelanace.netlify.app`
   - `https://68be6fa0d653cef0697838f1--polite-caramel-0c4794.netlify.app`
   - `http://localhost:3000`
5. **Authorized redirect URIs:**
   - `https://myprojectfreelanace.netlify.app/__/auth/handler`
   - `https://68be6fa0d653cef0697838f1--polite-caramel-0c4794.netlify.app/__/auth/handler`
   - `http://localhost:3000/`

### **STEP 5: Database Setup**

1. **Go to Neon Console:** https://console.neon.tech/
2. **SQL Editor** → **Run this SQL:**

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'freelancer', 'admin')),
    phone VARCHAR(20),
    firebase_uid VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    location VARCHAR(255),
    customer_id INTEGER REFERENCES users(id),
    budget DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create freelancer_profiles table
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    bio TEXT,
    skills TEXT[],
    hourly_rate DECIMAL(10,2),
    availability VARCHAR(50),
    location VARCHAR(255),
    portfolio_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Web Development', 'Frontend and backend web development services'),
('Mobile Development', 'iOS and Android app development'),
('Design', 'UI/UX design and graphic design services'),
('Writing', 'Content writing and copywriting services'),
('Marketing', 'Digital marketing and social media services'),
('Consulting', 'Business and technical consulting'),
('Other', 'Other professional services')
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_user_id ON freelancer_profiles(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_freelancer_profiles_updated_at BEFORE UPDATE ON freelancer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **STEP 6: Test Everything**

1. **Wait for Netlify to redeploy** (automatic)
2. **Go to:** `https://myprojectfreelanace.netlify.app/database`
3. **Test Google login** on your main site
4. **Check database viewer** for saved users

### **✅ EXPECTED RESULT:**

- ✅ **Google login works** without errors
- ✅ **Database viewer shows data** at `/database`
- ✅ **Users are saved** to database on login
- ✅ **API endpoints work** correctly

### **🔍 TROUBLESHOOTING:**

If still getting "Login Failed":
1. **Check Netlify Functions logs**
2. **Verify all environment variables** are set
3. **Check browser console** for errors
4. **Make sure SQL script ran** successfully

**Follow these steps exactly and everything will work!** 🎉
