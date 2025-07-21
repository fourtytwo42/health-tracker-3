@echo off
echo 🚀 Setting up Health Tracker 3 on new server...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Copy environment file if it doesn't exist
if not exist .env.local (
    echo 📋 Creating .env.local from template...
    copy env.example .env.local
    echo ⚠️  Please edit .env.local with your configuration before continuing
    echo    - Set DATABASE_URL for your database
    echo    - Set LLM provider API keys
    echo    - Set JWT_SECRET
    pause
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npx prisma generate

REM Push database schema
echo 🗄️  Setting up database schema...
npx prisma db push

REM Run comprehensive seed script
echo 🌱 Seeding database with initial data...
npx tsx scripts/seed.ts

REM Check if ingredients need seeding
echo 📦 Checking ingredients...
for /f %%i in ('npx tsx -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.ingredient.count().then(count => { console.log(count); prisma.$disconnect(); });"') do set INGREDIENT_COUNT=%%i

if %INGREDIENT_COUNT%==0 (
    echo 📦 Seeding basic ingredients...
    node scripts/seed-ingredients-simple.js
) else (
    echo ✅ Found %INGREDIENT_COUNT% ingredients, skipping ingredient seeding
)

REM Check if exercises need seeding
echo 🏃 Checking exercises...
for /f %%i in ('npx tsx -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.exercise.count().then(count => { console.log(count); prisma.$disconnect(); });"') do set EXERCISE_COUNT=%%i

if %EXERCISE_COUNT%==0 (
    echo 📦 Seeding exercises...
    node scripts/seed-exercises.js
) else (
    echo ✅ Found %EXERCISE_COUNT% exercises, skipping exercise seeding
)

REM Verify ingredient mappings
echo 🔗 Verifying ingredient mappings...
for /f %%i in ('npx tsx -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.ingredientMapping.count().then(count => { console.log(count); prisma.$disconnect(); });"') do set MAPPING_COUNT=%%i

echo ✅ Found %MAPPING_COUNT% ingredient mappings

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo    1. Start the development server: npm run dev
echo    2. Access the application at: http://localhost:3000
echo    3. Login with admin credentials: admin/demo
echo    4. Visit /admin to manage settings and ingredient mappings
echo.
echo 🔧 For production deployment:
echo    - Set NODE_ENV=production
echo    - Configure your production database
echo    - Set up environment variables
echo    - Run: npm run build ^&^& npm start

pause 