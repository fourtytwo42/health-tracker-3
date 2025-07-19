@echo off
REM Health Tracker - Data Setup Script (Windows)
REM This script sets up the pre-seeded ingredients and exercises database

echo 🏥 Setting up Health Tracker Data...

REM Copy the pre-seeded database
copy data\health-tracker-data.db prisma\dev.db

echo ✅ Data setup complete!
echo.
echo 🚀 You can now start the application:
echo    npm run dev
echo    Then visit: http://localhost:3001
echo.
echo 📋 The database includes:
echo    - ALL USDA ingredients (foundation, legacy, branded foods)
echo    - ALL exercise data (1,000+ activities with MET values)
echo    - Complete nutrition data for all ingredients
echo    - Exercise MET values and calorie burn rates
pause
