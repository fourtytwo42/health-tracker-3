# Health Tracker 3 - Server Setup Guide

This guide provides comprehensive instructions for setting up Health Tracker 3 on a new server.

## 🚀 Quick Setup (Recommended)

### For Linux/Mac:
```bash
chmod +x setup-new-server.sh
./setup-new-server.sh
```

### For Windows:
```cmd
setup-new-server.bat
```

### Using npm:
```bash
npm run setup:quick
```

## 📋 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** - Usually comes with Node.js
- **Git** - For cloning the repository

## 🔧 Manual Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd health-tracker-3
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (generate a random string)
JWT_SECRET="your-secret-key-here"

# LLM Providers (optional)
GROQ_API_KEY="your-groq-api-key"
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Ollama (optional, for local LLM)
OLLAMA_ENDPOINT="http://localhost:11434"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 5. Seed Initial Data
```bash
# Run comprehensive seed script (includes ingredient mappings)
npx tsx scripts/seed.ts
```

### 6. Seed Additional Data (Optional)
```bash
# Basic ingredients (if needed)
node scripts/seed-ingredients-simple.js

# Exercises (if needed)
node scripts/seed-exercises.js

# Full USDA ingredients (large dataset)
node scripts/seed-all-data.js
```

### 7. Start the Application
```bash
npm run dev
```

## 🌐 Access the Application

- **Application**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin

### Default Login Credentials
- **Admin**: `admin/demo`
- **Demo**: `demo/demo`
- **Test**: `test/test`

## 🗄️ Database Schema

The application uses the following main database tables:

### Core Tables
- `users` - User accounts and authentication
- `profiles` - User profile information
- `ingredients` - Food ingredients with nutrition data
- `ingredient_mappings` - Keyword-to-ingredient mappings
- `recipes` - Generated and saved recipes
- `meals` - Logged meals
- `activities` - Exercise activities
- `biomarkers` - Health measurements
- `goals` - User health goals

### Configuration Tables
- `llm_usage` - LLM API usage tracking
- `system_messages` - AI prompt templates
- `settings` - Application settings

## 🔗 Ingredient Mappings

The system includes 117 pre-configured ingredient mappings that map common ingredient names to database ingredients:

### Examples:
- `salt` → `salt, table, iodized`
- `black pepper` → `spices, pepper, black`
- `cheddar cheese` → `cheese, cheddar`
- `bell peppers` → `peppers, sweet, green, raw`
- `eggs` → `eggs, grade a, large, egg white`

### Managing Mappings
1. Go to Admin Dashboard: http://localhost:3000/admin
2. Click "Ingredient Mappings" tab
3. Add, edit, or delete mappings as needed

## 🏗️ Production Deployment

### Environment Variables
```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-secret"
# Add other production-specific variables
```

### Build and Start
```bash
npm run build
npm start
```

### Database Migration (Production)
```bash
npx prisma migrate deploy
```

## 🔍 Troubleshooting

### Common Issues

1. **Prisma Client Not Generated**
   ```bash
   npx prisma generate
   ```

2. **Database Schema Out of Sync**
   ```bash
   npx prisma db push
   ```

3. **Missing Dependencies**
   ```bash
   npm install
   ```

4. **Port Already in Use**
   - The app will automatically try ports 3000, 3001, 3002, etc.
   - Check the console output for the actual port

5. **Ingredient Mappings Not Working**
   - Verify mappings exist: `npx tsx scripts/seed.ts`
   - Check admin dashboard for mapping status

### Reset Database (Development Only)
```bash
npx prisma migrate reset --force
npx tsx scripts/seed.ts
```

## 📊 Monitoring

### Database Health
```bash
npx prisma studio
```

### Application Logs
Check the console output for:
- Database connection status
- LLM provider status
- Ingredient mapping counts
- Error messages

## 🆘 Support

If you encounter issues:

1. Check the console output for error messages
2. Verify all environment variables are set correctly
3. Ensure the database is accessible
4. Check that all dependencies are installed
5. Review the troubleshooting section above

## 📝 Notes

- The application uses SQLite by default for development
- For production, consider using PostgreSQL or MySQL
- Ingredient mappings are essential for recipe generation
- The admin dashboard provides full system management capabilities
- All data is seeded automatically during setup 