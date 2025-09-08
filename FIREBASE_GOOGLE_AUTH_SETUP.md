# FIREBASE GOOGLE AUTH SETUP FOR NETLIFY

## Current Issue
Google login is not working on the deployed Netlify site because:
1. Firebase authorized domains don't include the Netlify domain
2. Redirect URIs are not configured for the production domain
3. Environment variables are not set up for production

## STEP-BY-STEP FIX

### Step 1: Update Firebase Console Settings

#### 1.1 Add Authorized Domains
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `freelancer-connect-899a8`
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add these domains:
   - `68be6fa0d653cef0697838f1--polite-caramel-0c4794.netlify.app`
   - `polite-caramel-0c4794.netlify.app` (if you have a custom domain)
   - `localhost` (for development)

#### 1.2 Configure OAuth Redirect URIs
1. Go to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. In **Authorized redirect URIs**, add:
   - `https://68be6fa0d653cef0697838f1--polite-caramel-0c4794.netlify.app/__/auth/handler`
   - `https://68be6fa0d653cef0697838f1--polite-caramel-0c4794.netlify.app/`
   - `http://localhost:3000/` (for development)

### Step 2: Set Up Netlify Environment Variables

#### 2.1 Go to Netlify Dashboard
1. Go to your site dashboard
2. Go to **Site Settings** → **Environment Variables**
3. Add these variables:

```
VITE_FIREBASE_API_KEY=AIzaSyC4n_Cum0CvMyrIIWiehMltWO92MYnCvgw
VITE_FIREBASE_AUTH_DOMAIN=freelancer-connect-899a8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=freelancer-connect-899a8
VITE_FIREBASE_STORAGE_BUCKET=freelancer-connect-899a8.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=224541104230
VITE_FIREBASE_APP_ID=1:224541104230:web:62bb08bdd9ae55872a35a7
VITE_FIREBASE_MEASUREMENT_ID=G-GXMBYGFZPF
```

### Step 3: Update Google OAuth Settings

#### 3.1 Go to Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `freelancer-connect-899a8`
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Click **Edit**

#### 3.2 Update Authorized JavaScript Origins
Add these origins:
- `https://68be6fa0d653cef0697838f1--polite-caramel-0c4794.netlify.app`
- `http://localhost:3000` (for development)

#### 3.3 Update Authorized Redirect URIs
Add these URIs:
- `https://68be6fa0d653cef0697838f1--polite-caramel-0c4794.netlify.app/__/auth/handler`
- `https://68be6fa0d653cef0697838f1--polite-caramel-0c4794.netlify.app/`
- `http://localhost:3000/` (for development)

### Step 4: Test the Configuration

#### 4.1 Redeploy
1. Go to Netlify Dashboard → **Deploys**
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete

#### 4.2 Test Google Login
1. Go to your deployed site
2. Try to sign in with Google
3. Check browser console for any errors

## TROUBLESHOOTING

### Common Issues:
1. **"This app is not verified"** - This is normal for development, click "Advanced" → "Go to site"
2. **"Error 400: redirect_uri_mismatch"** - Check that redirect URIs are exactly correct
3. **"Error 403: access_denied"** - Check that authorized domains are added
4. **"Error 400: invalid_request"** - Check that OAuth client ID is correct

### Debug Steps:
1. Check browser console for errors
2. Verify environment variables are set in Netlify
3. Check Firebase console for authentication logs
4. Verify all domains and URIs are exactly correct

## EXPECTED RESULT

After completing these steps:
- ✅ Google login will work on the deployed site
- ✅ Users can authenticate with Google
- ✅ No console errors related to authentication
- ✅ Proper redirect after successful login

## CURRENT FIREBASE CONFIG

Your Firebase project details:
- **Project ID:** freelancer-connect-899a8
- **Auth Domain:** freelancer-connect-899a8.firebaseapp.com
- **API Key:** AIzaSyC4n_Cum0CvMyrIIWiehMltWO92MYnCvgw
- **App ID:** 1:224541104230:web:62bb08bdd9ae55872a35a7

## NEXT STEPS

1. Complete the Firebase Console configuration
2. Set up Netlify environment variables
3. Redeploy the site
4. Test Google authentication
