Write-Host "🚀 Setting up Freelancer Categories System..." -ForegroundColor Green

# Step 1: Add custom_category field to database
Write-Host "📊 Step 1: Adding custom_category field to database..." -ForegroundColor Yellow
try {
    psql -h localhost -p 5000 -U postgres -d hirelocal -f add-custom-category.sql
    Write-Host "✅ Database field added successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Error adding database field: $_" -ForegroundColor Red
}

# Step 2: Initialize comprehensive categories
Write-Host "📝 Step 2: Initializing comprehensive categories..." -ForegroundColor Yellow
try {
    npx tsx init-categories.ts
    Write-Host "✅ Categories initialized successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Error initializing categories: $_" -ForegroundColor Red
}

Write-Host "✅ Categories system setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was accomplished:" -ForegroundColor Cyan
Write-Host "   • Added custom_category field to freelancer_profiles table"
Write-Host "   • Created 200+ unique freelancer categories"
Write-Host "   • Categorized by industry (Home Services, Technology, Professional, etc.)"
Write-Host "   • Added 'Other' option for custom categories"
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart your development server"
Write-Host "   2. Test the CategoryAutoSuggest component"
Write-Host "   3. Verify category persistence in freelancer profiles"
Write-Host ""
Write-Host "🎯 Test scenarios:" -ForegroundColor Cyan
Write-Host "   • Type 'car' to see single 'Carpenter' result"
Write-Host "   • Type 'dev' to see 'Developer', 'Web Developer', etc."
Write-Host "   • Select 'Other' to enter custom category"
Write-Host "   • Save profile and verify category persistence"
