#!/bin/bash

echo "🚀 Setting up Health Tracker 3 on new server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📋 Creating .env.local from template..."
    cp env.example .env.local
    echo "⚠️  Please edit .env.local with your configuration before continuing"
    echo "   - Set DATABASE_URL for your database"
    echo "   - Set LLM provider API keys"
    echo "   - Set JWT_SECRET"
    read -p "Press Enter after editing .env.local..."
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️  Setting up database schema..."
npx prisma db push

# Run comprehensive seed script
echo "🌱 Seeding database with initial data..."
npx tsx scripts/seed.ts

# Check if ingredients need seeding
echo "📦 Checking ingredients..."
INGREDIENT_COUNT=$(npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.ingredient.count().then(count => {
  console.log(count);
  prisma.\$disconnect();
});
")

if [ "$INGREDIENT_COUNT" -eq 0 ]; then
    echo "📦 Seeding basic ingredients..."
    node scripts/seed-ingredients-simple.js
else
    echo "✅ Found $INGREDIENT_COUNT ingredients, skipping ingredient seeding"
fi

# Check if exercises need seeding
echo "🏃 Checking exercises..."
EXERCISE_COUNT=$(npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.exercise.count().then(count => {
  console.log(count);
  prisma.\$disconnect();
});
")

if [ "$EXERCISE_COUNT" -eq 0 ]; then
    echo "📦 Seeding exercises..."
    node scripts/seed-exercises.js
else
    echo "✅ Found $EXERCISE_COUNT exercises, skipping exercise seeding"
fi

# Verify ingredient mappings
echo "🔗 Verifying ingredient mappings..."
MAPPING_COUNT=$(npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.ingredientMapping.count().then(count => {
  console.log(count);
  prisma.\$disconnect();
});
")

echo "✅ Found $MAPPING_COUNT ingredient mappings"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Start the development server: npm run dev"
echo "   2. Access the application at: http://localhost:3000"
echo "   3. Login with admin credentials: admin/demo"
echo "   4. Visit /admin to manage settings and ingredient mappings"
echo ""
echo "🔧 For production deployment:"
echo "   - Set NODE_ENV=production"
echo "   - Configure your production database"
echo "   - Set up environment variables"
echo "   - Run: npm run build && npm start" 