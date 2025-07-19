# Database Seeding Guide

This guide explains how to seed the database with all necessary data for the Health Tracker application.

## Quick Start

After cloning the repository and setting up the environment, run these commands in order:

```bash
# 1. Install dependencies
npm install

# 2. Set up the database and seed everything (RECOMMENDED)
node scripts/setup-db.js

# OR manual setup:
# 2a. Set up the database
npx prisma generate
npx prisma db push

# 2b. Run complete seeding (all data in one command)
node scripts/seed-complete.js

# OR run individual seeding scripts:
# 2c. Seed users and settings
node scripts/seed-modules/seed-users.js
node scripts/seed-modules/seed-settings.js
node scripts/seed-modules/seed-sample-data.js

# 2d. Seed ingredients and exercises
node scripts/seed-ingredients-simple.js
node scripts/seed-usda-ingredients.js
node scripts/seed-all.js
```

## Available Seeding Scripts

### 1. Complete Seeding (`scripts/seed-complete.js`) - **RECOMMENDED**
**What it seeds:**
- All users, settings, sample data, ingredients, and exercises
- Automatically detects and processes USDA ingredient files
- Provides detailed progress and error reporting
- Modular design with individual step tracking

### 2. Modular Seeding Scripts

#### Users (`scripts/seed-modules/seed-users.js`)
**What it seeds:**
- 3 demo users (admin, demo, test)
- User profiles and details
- User health information and preferences

**Login Credentials:**
- **Admin:** `admin/demo`
- **Demo:** `demo/demo`
- **Test:** `test/test`

#### Settings (`scripts/seed-modules/seed-settings.js`)
**What it seeds:**
- System messages for AI interactions
- LLM provider configurations
- Application settings

#### Sample Data (`scripts/seed-modules/seed-sample-data.js`)
**What it seeds:**
- Sample meals, activities, biomarkers, and goals
- Demo data for testing all features

### 3. Ingredients Seeding

#### Basic Ingredients (`scripts/seed-ingredients-simple.js`)
**What it seeds:**
- 19 common food ingredients with complete nutrition data
- Categories: Proteins, Grains, Vegetables, Fruits, Nuts & Seeds, Oils & Fats, Dairy

**Included ingredients:**
- Chicken Breast, Salmon, Eggs, Greek Yogurt
- Oats, Brown Rice, Quinoa
- Broccoli, Spinach, Sweet Potato
- Banana, Blueberries, Apple
- Almonds, Chia Seeds
- Olive Oil, Coconut Oil
- Milk, Cheese

#### USDA Ingredients (`scripts/seed-usda-ingredients.js`)
**What it seeds:**
- All 4 USDA JSON files from `ingredientData/` folder
- Foundation foods, legacy foods, branded foods, and survey data
- Comprehensive nutrition information for thousands of ingredients

### 4. Exercises (`scripts/seed-all.js`)
**What it seeds:**
- 1,110 exercises from the MET (Metabolic Equivalent of Task) database
- Exercise categories, intensities, and calorie calculations

## Data Sources

### Exercises
The exercise data comes from the MET database, which provides:
- Exercise names and descriptions
- MET values for calorie calculation
- Exercise categories and intensity levels
- 1,110 unique exercises

### Ingredients
- **Basic ingredients:** Manually curated list of 19 common foods
- **USDA ingredients:** Full USDA database (requires data files in `ingredientData/` directory)

## File Structure

```
scripts/
├── seed-complete.js              # Complete seeding orchestrator (RECOMMENDED)
├── setup-db.js                   # Database setup and seeding
├── seed-modules/                 # Modular seeding scripts
│   ├── seed-users.js            # Users and user details
│   ├── seed-settings.js         # System messages and LLM settings
│   └── seed-sample-data.js      # Sample meals, activities, etc.
├── seed-usda-ingredients.js     # USDA ingredients from JSON files
├── seed-ingredients-simple.js   # Basic ingredients (19 foods)
├── seed-all.js                  # Exercises and basic data
├── create-admin-user.js         # Admin user creation only
└── simple-admin.js              # Simple admin user script

ingredientData/                   # USDA data files (optional)
├── FoodData_Central_foundation_food_json_2025-04-24.json
├── FoodData_Central_sr_legacy_food_json_2018-04.json
├── FoodData_Central_branded_food_json_2025-04-24.json
└── surveyDownload.json

excerciseData/                    # Exercise data files
└── met.csv                      # MET database
```

## Environment Variables

Make sure these environment variables are set in your `.env.local` file:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secrets
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# LLM API Keys (optional)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
```

## Troubleshooting

### Common Issues

1. **Prisma Client not generated:**
   ```bash
   npx prisma generate
   ```

2. **Database schema out of sync:**
   ```bash
   npx prisma db push
   ```

3. **TypeScript compilation errors:**
   ```bash
   # Use JavaScript versions instead
   node scripts/seed-complete.js
   ```

4. **Permission errors:**
   ```bash
   # On Windows, run PowerShell as Administrator
   # On Linux/Mac, use sudo if needed
   ```

### Reset Database

To completely reset and reseed the database:

```bash
# 1. Delete the database file
rm prisma/dev.db

# 2. Reset Prisma
npx prisma db push

# 3. Run complete seeding
node scripts/seed-complete.js
```

## Verification

After seeding, you can verify the data by:

1. **Starting the application:**
   ```bash
   npm run dev
   ```

2. **Logging in with demo credentials:**
   - Go to `http://localhost:3001`
   - Login with `admin/demo`

3. **Checking data in the UI:**
   - Navigate to "Health Profile" to see user details
   - Check "Food Preferences" for ingredients
   - Check "Exercise Preferences" for exercises
   - View sample meals and activities in the dashboard

## Data Counts

After successful seeding, you should have:

- **Users:** 3 (admin, demo, test)
- **Ingredients:** 19 (basic) or 8,000+ (with USDA data)
- **Exercises:** 1,110
- **System Messages:** 5
- **LLM Providers:** 3
- **Sample Data:** 6 meals, 6 activities, 6 biomarkers, 6 goals per user

## Next Steps

After seeding, you can:

1. **Customize the data:** Edit the seeding scripts to add your own data
2. **Add more ingredients:** Import USDA data or add custom ingredients
3. **Configure LLM providers:** Set up your API keys for AI features
4. **Test the application:** Explore all features with the demo data

## Support

If you encounter issues with seeding:

1. Check the console output for specific error messages
2. Verify your environment variables are set correctly
3. Ensure the database file has proper permissions
4. Try running individual seeding scripts to isolate issues 