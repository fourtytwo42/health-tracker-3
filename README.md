# AI Health Companion

A Next.js 14 PWA monorepo offering a chat-first health management platform with AI integration.

## Features

### 🤖 Chat-First AI Interface
- **Conversational Health Management**: Interact with an AI assistant through natural conversation
- **MCP Integration**: Model Context Protocol for tool calling and structured responses
- **Component JSON Rendering**: Rich UI components embedded in chat responses
- **Quick Replies**: Clickable response options for seamless interaction

### 🍽️ Meal Planning & Tracking
- AI-generated personalized meal plans
- Meal logging with nutritional information
- Recipe cards with ingredients and instructions
- Grocery list generation

### 🏃‍♂️ Activity & Fitness
- Workout planning and logging
- Progress tracking with visual charts
- Goal setting and achievement tracking

### 📊 Health Monitoring
- Biomarker logging (weight, blood pressure, glucose, etc.)
- Trend analysis and visualization
- Target range monitoring

### 🏆 Gamification
- Leaderboard system with points
- Achievement badges and certificates
- Social features and challenges

### 📱 PWA Features
- Offline-capable progressive web app
- Mobile-first responsive design
- Installable on mobile devices

## Chat & MCP Integration

The chat interface is powered by a comprehensive MCP (Model Context Protocol) system that enables:

### Available Tools
- `chat` - General conversation with AI
- `generate_meal_plan` - Create personalized meal plans
- `log_meal` - Log meals with nutritional data
- `get_leaderboard` - View leaderboard standings
- `log_biomarker` - Log health measurements
- `create_goal` - Set health and fitness goals
- `generate_grocery_list` - Create shopping lists

### Component Types
- `RecipeCard` - Display recipe information
- `PlanSummary` - Show meal/activity plans
- `LeaderboardSnippet` - Display rankings
- `GroceryListCard` - Shopping list with aisle grouping
- `GoalBadge` - Goal progress visualization
- `BiomarkerChart` - Health data trends
- `MealCard` - Meal information display

### Quick Replies
Each tool response can include quick reply options for seamless user interaction, allowing users to:
- Follow up on generated content
- Navigate to related actions
- Continue conversations naturally

## Getting Started

### Prerequisites
- Node.js 20+
- SQLite (for local development)
- Ollama (for local LLM) - Optional, other providers available

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd health-tracker-3
```

2. **Quick Setup (Recommended):**
   
   **For Linux/Mac:**
   ```bash
   chmod +x setup-new-server.sh
   ./setup-new-server.sh
   ```
   
   **For Windows:**
   ```cmd
   setup-new-server.bat
   ```

3. **Manual Setup (Alternative):**
   
   Install dependencies:
   ```bash
   npm install
   ```
   
   Set up environment variables:
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```
   
   Set up the database and seed data:
   ```bash
   npx prisma generate
   npx prisma db push
   npx tsx scripts/seed.ts
   ```
   
   Seed additional data (if needed):
   ```bash
   # Basic ingredients
   node scripts/seed-ingredients-simple.js
   
   # Exercises
   node scripts/seed-exercises.js
   ```

4. Start the development server:
```bash
npm run dev
```

5. Access the application:
   - **Application**: http://localhost:3000
   - **Admin Dashboard**: http://localhost:3000/admin
   - **Login Credentials**: 
     - Admin: `admin/demo`
     - Demo: `demo/demo`
     - Test: `test/test`

### Default Users
- **Admin**: `admin` / `demo`
- **Demo**: `demo` / `demo`
- **Test**: `test` / `test`

### Database Seeding

The application comes with comprehensive seeding scripts that populate the database with:

- **3 Demo Users** with complete profiles and health data
- **19 Basic Ingredients** with full nutrition information
- **1,110 Exercises** from the MET database
- **Sample Data** including meals, activities, biomarkers, and goals
- **System Messages** for AI interactions
- **LLM Provider Configurations** for AI features

For detailed seeding information, see [SEEDING.md](./SEEDING.md).

## Usage

### Chat Interface
1. Log in to the application
2. Navigate to the Chat page
3. Start a conversation with the AI assistant
4. Use quick replies or type natural language requests
5. View rich component responses for structured data

### Example Conversations
- "I want to create a meal plan for this week"
- "Log my lunch: grilled chicken salad, 350 calories"
- "Show me my health progress and leaderboard"
- "I want to set a new fitness goal"
- "Create a grocery list for my meal plan"

### LLM Provider Management

The admin dashboard (`/admin`) provides comprehensive LLM provider management:

#### API Key Management
- **Add/Update API Keys**: Securely store API keys for each provider in the database
- **Key Status**: View masked API keys and availability status
- **Remove Keys**: Safely remove API keys when no longer needed

#### Model Management
- **Fetch Available Models**: Automatically retrieve available models from each provider's API
- **Model Selection**: Choose from available models for each provider
- **Model Caching**: Models are cached locally to reduce API calls

#### Provider Configuration
- **Enable/Disable Providers**: Toggle providers on/off in the router
- **Priority Settings**: Set provider priority for routing decisions
- **Health Monitoring**: Real-time status and latency monitoring
- **Testing**: Test provider connectivity and response quality

#### Setup Instructions

1. **Access Admin Dashboard**: Navigate to `/admin` as an admin user
2. **Add API Keys**: Click "Add API Key" for each provider you want to use
3. **Fetch Models**: Click "Change Model" to fetch available models from the provider
4. **Configure Router**: Set latency/cost weights and provider priorities
5. **Test Providers**: Use the "Test Provider" button to verify connectivity

## 🥗 USDA Nutrition Data Integration

This application includes comprehensive USDA FoodData Central nutrition data integration. The system automatically seeds the database with official USDA nutrition information for hundreds of ingredients.

### Data Sources

- **USDA Foundation Foods**: Comprehensive nutrition data from the USDA FoodData Central database
- **Automatic Detection**: Any JSON files placed in the `Data/` folder will be automatically processed and seeded
- **Real-time Updates**: When USDA releases new data, simply replace the JSON files and re-seed

### Features

- **340+ Ingredients**: Pre-loaded with USDA foundation foods
- **Comprehensive Nutrition**: Complete nutritional profiles including:
  - Macronutrients (protein, carbs, fat)
  - Micronutrients (vitamins, minerals)
  - Fatty acid breakdown (saturated, monounsaturated, polyunsaturated, trans)
  - Fiber, sugar, sodium, cholesterol
  - Net carbs calculation
  - Dietary flags and allergen information

- **Smart Categorization**: Automatic mapping to comprehensive ingredient categories
- **Aisle Organization**: Intelligent store aisle placement
- **Dietary Intelligence**: Automatic detection of dietary restrictions and allergens

### Seeding Commands

```bash
# Seed only USDA data
npm run db:seed-usda

# Seed all data (USDA + demo users + settings)
npm run db:seed-all

# Reset database and seed everything
npm run db:reset-and-seed
```

### Adding New USDA Data

1. Download new USDA JSON files from [FoodData Central](https://fdc.nal.usda.gov/download-datasets.html)
2. Place JSON files in the `Data/` folder
3. Run `npm run db:seed-all` to process and seed the new data

### Data Structure

The system automatically converts USDA data to our comprehensive ingredient format:

```json
{
  "name": "Chicken Breast, raw",
  "description": "USDA Foundation Food - FinalFood (Source: FoodData_Central_foundation_food_json_2025-04-24.json)",
  "servingSize": "100g",
  "calories": 165,
  "protein": 31.0,
  "carbs": 0.0,
  "fat": 3.6,
  "fiber": 0.0,
  "sugar": 0.0,
  "sodium": 74,
  "cholesterol": 85,
  "saturatedFat": 1.1,
  "monounsaturatedFat": 1.2,
  "polyunsaturatedFat": 0.8,
  "transFat": 0.0,
  "netCarbs": 0.0,
  "dietaryFlags": "Gluten-Free, Dairy-Free, Nut-Free, Seafood-Free, Egg-Free, Soy-Free",
  "allergens": "",
  "category": "Proteins - Poultry (chicken, turkey, duck)",
  "aisle": "meat"
}
```

### Categories Available

The system includes comprehensive ingredient categories:

- **Proteins**: Meats, Poultry, Seafood, Eggs, Plant Proteins
- **Vegetables**: Leafy Greens, Cruciferous, Root, Alliums, Nightshades, Gourds
- **Fruits**: Berries, Citrus, Stone Fruits, Pomes, Tropical, Melons
- **Grains & Starches**: Whole Grains, Refined Grains, Ancient Grains, Tubers
- **Legumes & Pulses**: Beans, Lentils, Peas, Chickpeas
- **Dairy & Alternatives**: Milk/Yogurt/Cheese, Plant Alternatives
- **Nuts & Seeds**: Tree Nuts, Seeds
- **Fats & Oils**: Cooking Oils, Animal Fats
- **Condiments & Sauces**: Mustards/Ketchups, Marinades/Dressings
- **Herbs & Spices**: Fresh Herbs, Dried Spices
- **Beverages**: Water/Tea/Coffee, Juices/Sodas/Alcohol
- **Sweets & Snacks**: Chocolate/Candy, Chips/Crackers
- **Pantry & Canned Goods**: Canned Items, Stocks/Broths
- **Frozen Foods**: Vegetables, Fruits, Prepared Meals
- **Bakery**: Breads, Tortillas, Pastries

### Admin Interface

The admin dashboard includes a comprehensive ingredient management interface:

- **Browse Ingredients**: View all USDA ingredients with detailed nutrition
- **Search & Filter**: Find ingredients by name, category, or nutritional content
- **Add Custom Ingredients**: Supplement USDA data with custom ingredients
- **Bulk Operations**: Import/export ingredients via CSV
- **Nutritional Analysis**: View detailed breakdowns of all nutritional components

This integration provides a solid foundation of scientifically accurate nutrition data while maintaining flexibility for custom additions and updates.

## Architecture

### Frontend
- **Next.js 14** with App Router
- **Material-UI (MUI)** for components
- **TypeScript** for type safety
- **PWA** with offline support

### Backend
- **Next.js API Routes** for REST endpoints
- **MCP Handler** for AI tool integration
- **LLM Router** for provider selection
- **Prisma ORM** for database access
- **SQLite** for data storage

### AI Integration
- **Multiple LLM Providers** (Ollama, Groq, OpenAI, Anthropic, AWS Bedrock, Azure OpenAI)
- **LLM Router** with latency/cost optimization
- **MCP Protocol** for structured tool calling
- **Component JSON** for rich UI responses
- **Quick Replies** for conversational flow

## Development

### Project Structure
```
/app
├── /api/mcp          # MCP protocol endpoints
├── /chat             # Chat interface
├── /components       # React components
│   ├── /cards        # Component JSON renderers
│   └── ComponentRenderer.tsx
└── /lib
    ├── mcp.ts        # MCP handler
    └── llmRouter.ts  # LLM provider router
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:api
npm run test:ui
npm run test:e2e
```

### Database
```bash
# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 