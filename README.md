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
- Ollama (for local LLM)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd health-tracker-3
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma db seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Users
- **Admin**: `admin` / `demo123`
- **User**: `user` / `demo123`

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
- **Ollama** for local LLM processing
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