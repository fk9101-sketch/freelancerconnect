@echo off
echo ========================================
echo   DUPLICATE CATEGORIES CLEANUP
echo ========================================
echo.
echo This script will remove ALL duplicate categories
echo from your PostgreSQL database.
echo.
echo Make sure you have:
echo 1. Node.js installed
echo 2. PostgreSQL running
echo 3. Database credentials configured
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo 🚀 Starting cleanup process...
echo.

node remove-all-duplicates.js

echo.
echo ========================================
echo   CLEANUP COMPLETED
echo ========================================
echo.
echo Check the output above for results.
echo A backup file has been created for safety.
echo.
pause
