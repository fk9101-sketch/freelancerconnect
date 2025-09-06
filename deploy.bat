@echo off
echo 🚀 Starting HireLocal deployment...

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found. Please create one from env.example
    echo 📝 Copy env.example to .env and fill in your values:
    echo    copy env.example .env
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the application
echo 🔨 Building application...
npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Build successful!
    echo 🌐 Your application is ready to deploy!
    echo.
    echo 📋 Next steps:
    echo 1. Push your code to GitHub
    echo 2. Connect to your deployment platform (Railway, Vercel, etc.)
    echo 3. Set environment variables in your platform
    echo 4. Deploy!
) else (
    echo ❌ Build failed. Please check the errors above.
    pause
    exit /b 1
)

pause
