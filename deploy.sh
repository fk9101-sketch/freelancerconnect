#!/bin/bash

# HireLocal Deployment Script
echo "🚀 Starting HireLocal deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one from env.example"
    echo "📝 Copy env.example to .env and fill in your values:"
    echo "   cp env.example .env"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🌐 Your application is ready to deploy!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push your code to GitHub"
    echo "2. Connect to your deployment platform (Railway, Vercel, etc.)"
    echo "3. Set environment variables in your platform"
    echo "4. Deploy!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
