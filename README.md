# AI Health Companion

A Next.js 14 PWA monorepo offering a chat-first health management platform with AI-driven meal planning, activity tracking, biomarker logging, and gamified leaderboards.

## 🚀 Features

- **Chat-First Interface**: Natural conversation with AI for health management
- **PWA Support**: Offline-capable, installable progressive web app
- **AI-Powered Planning**: Personalized meal and activity plans
- **Biomarker Tracking**: Weight, blood pressure, glucose, ketones with photo logging
- **Gamification**: Leaderboards and point-based motivation system
- **Grocery Lists**: AI-generated shopping lists from meal plans
- **Health Reports**: PDF/DOCX exports with comprehensive health data
- **Goal Management**: Set and track health goals with certificates
- **Multi-LLM Support**: Ollama, OpenAI, Anthropic, Groq, AWS Bedrock, Azure AI

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI**: Material-UI v6, Emotion, Framer Motion
- **State**: Zustand, SWR
- **Database**: PostgreSQL 16, Prisma ORM
- **File Storage**: Minio S3-compatible
- **AI**: MCP (Model Context Protocol), multiple LLM providers
- **PWA**: next-pwa, Service Worker
- **Testing**: Vitest, Playwright, Lighthouse CI
- **Deployment**: Docker, Vercel-ready

## 📋 Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-health-companion
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start the development environment**
   ```bash
   npm run setup
   # This will:
   # - Start PostgreSQL and Minio containers
   # - Run database migrations
   # - Seed initial data
   ```

4. **Install dependencies and start development server**
   ```bash
   npm install
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄 Database Setup

The project uses PostgreSQL 16 with Prisma ORM. The setup script will:

- Create the database schema
- Run all migrations
- Seed demo data including:
  - Demo admin account: `admin/demo`
  - Demo user account: `user/demo`
  - Ingredient taxonomy for grocery lists

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:api` - Run API tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with demo data
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services
- `npm run setup` - Complete setup (Docker + DB + Seed)

## 🏗 Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # Shared React components
│   ├── context/          # Zustand stores & Auth context
│   ├── hooks/            # Custom React hooks
│   ├── styles/           # MUI theme & global styles
│   └── lib/              # Business logic services
├── lib/                   # Core utilities & services
├── prisma/               # Database schema & migrations
├── scripts/              # Database seeders & utilities
├── tests/                # Test suites
├── public/               # Static assets & PWA files
└── docker-compose.yml    # Development services
```

## 🔐 Authentication

The app uses JWT-based authentication with:
- Access tokens (15 min expiry)
- Refresh tokens (7 day expiry)
- bcrypt password hashing (12 rounds)
- Protected API routes

Demo accounts:
- **Admin**: `admin` / `demo`
- **User**: `user` / `demo`

## 🤖 AI Integration

The app uses MCP (Model Context Protocol) for AI interactions:
- Multiple LLM provider support
- Intelligent routing based on latency/cost
- In-memory caching for performance
- Tool calling for structured operations

## 📱 PWA Features

- Offline support with service worker
- Installable on mobile and desktop
- Background sync for offline actions
- Push notifications (future)

## 🧪 Testing

- **Unit Tests**: 90%+ coverage with Vitest
- **API Tests**: Integration tests with supertest
- **E2E Tests**: Playwright for full user flows
- **Lighthouse**: Performance and accessibility audits

## 🚀 Deployment

### Development
```bash
npm run setup
npm run dev
```

### Production
```bash
npm run build
npm run start
```

### Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

- Prometheus metrics on `/api/metrics`
- Sentry for error tracking
- Health check endpoints
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@aihealthcompanion.com or create an issue in the repository.

## 🔄 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with wearable devices
- [ ] Social features and challenges
- [ ] AI-powered meal recommendations
- [ ] Voice interface
- [ ] Multi-language support 