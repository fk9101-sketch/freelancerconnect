# Netlify Deployment Guide

## Quick Fix for "Page not found" Error

The "Page not found" error occurs because Netlify doesn't know how to handle client-side routing for React Single Page Applications (SPAs).

## Solution Applied

1. **Created `netlify.toml`** - Main configuration file for Netlify
2. **Created `client/public/_redirects`** - Redirects file for SPA routing
3. **Updated build process** - Ensures redirects file is included in build output

## Files Created/Modified

### `netlify.toml`
```toml
[build]
  base = "."
  publish = "dist/public"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### `client/public/_redirects`
```
/*    /index.html   200
```

## Deployment Steps

1. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist/public`
   - Node version: `18`

3. **Deploy:**
   - Netlify will automatically build and deploy
   - The redirects will handle SPA routing

## Alternative: Manual Deploy

If you prefer to deploy manually:

1. Run `npm run build`
2. Upload the contents of `dist/public/` to Netlify
3. The `_redirects` file will handle routing

## Verification

After deployment, test these URLs:
- `https://your-site.netlify.app/` (should work)
- `https://your-site.netlify.app/customer-dashboard` (should work)
- `https://your-site.netlify.app/freelancer-dashboard` (should work)

All routes should now work correctly without showing "Page not found" errors.
