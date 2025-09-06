# 🚀 HireLocal Deployment Guide

This guide will help you deploy your HireLocal application live for the first time.

## 📋 Prerequisites

- GitHub account
- Firebase project set up
- Razorpay account (for payments)
- PostgreSQL database (or use Railway's managed database)

## 🎯 Deployment Options

### Option 1: Railway (Recommended - Easiest)

Railway is perfect for full-stack apps with databases.

#### Steps:

1. **Sign up at [railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Add PostgreSQL database:**
   - Click "New Project" → "Database" → "PostgreSQL"
   - Railway will provide connection details

4. **Deploy your app:**
   - Click "New Project" → "GitHub Repo"
   - Select your HireLocal repository
   - Railway will auto-detect it's a Node.js app

5. **Set Environment Variables:**
   ```
   DB_HOST=your_railway_db_host
   DB_PORT=5432
   DB_NAME=railway
   DB_USER=postgres
   DB_PASSWORD=your_railway_db_password
   SESSION_SECRET=your_random_secret_key
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   NODE_ENV=production
   PORT=3000
   ```

6. **Deploy!** Railway will automatically build and deploy your app.

---

### Option 2: Vercel + Railway Database

#### Frontend (Vercel):
1. **Sign up at [vercel.com](https://vercel.com)**
2. **Connect your GitHub repository**
3. **Set build settings:**
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm install`

#### Backend + Database (Railway):
1. **Deploy backend to Railway** (same as Option 1)
2. **Use Railway's PostgreSQL database**
3. **Update frontend API URLs** to point to Railway backend

---

### Option 3: DigitalOcean App Platform

1. **Sign up at [DigitalOcean](https://digitalocean.com)**
2. **Create new app from GitHub**
3. **Add PostgreSQL database**
4. **Set environment variables**
5. **Deploy**

---

### Option 4: Heroku

1. **Sign up at [heroku.com](https://heroku.com)**
2. **Install Heroku CLI**
3. **Create new app:**
   ```bash
   heroku create your-app-name
   ```
4. **Add PostgreSQL addon:**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```
5. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your_secret
   # ... add all other variables
   ```
6. **Deploy:**
   ```bash
   git push heroku main
   ```

---

## 🔧 Pre-Deployment Setup

### 1. Create Environment File

Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

### 2. Test Build Locally

```bash
# Windows
deploy.bat

# Mac/Linux
chmod +x deploy.sh
./deploy.sh
```

### 3. Database Setup

Your app uses Drizzle ORM with PostgreSQL. The database will be automatically set up when you first run the app.

### 4. Firebase Configuration

1. **Create Firebase project** at [console.firebase.google.com](https://console.firebase.google.com)
2. **Enable Authentication** → Sign-in methods → Email/Password
3. **Generate service account key** for backend
4. **Add web app** for frontend configuration

### 5. Razorpay Setup

1. **Create account** at [razorpay.com](https://razorpay.com)
2. **Get API keys** from dashboard
3. **Set up webhook** (optional but recommended)

---

## 🌐 Domain and SSL

### Custom Domain (Optional)

1. **Buy domain** from any registrar (Namecheap, GoDaddy, etc.)
2. **Point DNS** to your deployment platform
3. **Enable SSL** (most platforms do this automatically)

### Free Subdomain

Most platforms provide free subdomains:
- Railway: `your-app.railway.app`
- Vercel: `your-app.vercel.app`
- Heroku: `your-app.herokuapp.com`

---

## 🔍 Post-Deployment Checklist

- [ ] App loads without errors
- [ ] Database connection works
- [ ] User registration works
- [ ] User login works
- [ ] Payment integration works
- [ ] File uploads work
- [ ] All API endpoints respond
- [ ] Mobile responsiveness works
- [ ] SSL certificate is active

---

## 🚨 Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check Node.js version (use 18+)
   - Ensure all dependencies are installed
   - Check for TypeScript errors

2. **Database connection fails:**
   - Verify environment variables
   - Check database is running
   - Ensure network access is allowed

3. **Environment variables not working:**
   - Double-check variable names
   - Ensure no extra spaces
   - Restart the application

4. **Firebase errors:**
   - Verify service account key
   - Check Firebase project ID
   - Ensure authentication is enabled

### Getting Help:

- Check platform-specific documentation
- Look at deployment logs
- Test locally first
- Use browser developer tools

---

## 🎉 Success!

Once deployed, your HireLocal application will be live and accessible to users worldwide!

**Next steps:**
- Monitor performance
- Set up analytics
- Configure backups
- Plan for scaling

---

## 📞 Support

If you need help with deployment, check:
- Platform documentation
- GitHub issues
- Stack Overflow
- Community forums
