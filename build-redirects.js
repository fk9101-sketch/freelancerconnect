import fs from 'fs';

// Create _redirects file for Netlify SPA routing
const redirectsContent = `/*    /index.html   200`;
fs.writeFileSync('dist/_redirects', redirectsContent);
console.log('✅ Created _redirects file for SPA routing');
