# Developer Onboarding Guide

Welcome to the AI Health Companion development team! This guide will help you get up and running quickly.

## Quick Start

### 1. Prerequisites Check

Ensure you have the following installed:

```bash
# Check Node.js version (requires 20.x+)
node --version

# Check npm version (requires 10.x+)
npm --version

# Check Docker
docker --version
docker-compose --version

# Check Git
git --version
```

### 2. Repository Setup

```bash
# Clone the repository
git clone https://github.com/your-org/healthTracker.git
cd healthTracker

# Install dependencies
npm install

# Copy environment file
cp env.example .env.local
```

### 3. Environment Configuration

Edit `.env.local` with your local configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/healthtracker"

# JWT Secrets
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# LLM Providers (optional for development)
OPENAI_API_KEY="your-openai-key"
GROQ_API_KEY="your-groq-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# File Storage
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="healthtracker"
```

### 4. Database Setup

```bash
# Start PostgreSQL and Minio
npm run docker:up

# Wait for services to be ready (check with docker-compose ps)
# Then run migrations
npm run db:migrate

# Seed the database
npm run db:seed
npm run db:seed:flags
```

### 5. Start Development

```bash
# Start the development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
healthTracker/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # Shared React components
│   ├── context/          # React contexts
│   ├── hooks/            # Custom hooks
│   ├── styles/           # Global styles and themes
│   └── [pages]/          # Page components
├── lib/                   # Business logic
│   ├── services/         # Service layer
│   ├── middleware/       # API middleware
│   └── utils/            # Utility functions
├── prisma/               # Database schema and migrations
├── tests/                # Test suites
├── docs/                 # Documentation
├── scripts/              # Build and utility scripts
└── public/               # Static assets
```

## Key Technologies

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Material-UI (MUI)** - Component library
- **Zustand** - State management
- **React Hook Form** - Form handling
- **SWR** - Data fetching

### Backend
- **Next.js API Routes** - Server-side API
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **JWT** - Authentication
- **MCP Handler** - AI tool integration

### Testing
- **Vitest** - Unit and integration testing
- **Playwright** - E2E testing
- **React Testing Library** - Component testing

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Vercel** - Deployment platform

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### 2. Testing Your Changes

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:api
npm run test:e2e

# Check code quality
npm run lint
npm run type-check
```

### 3. Database Changes

```bash
# Create migration
npm run db:migrate

# Reset database (development only)
npm run db:reset

# View database in Prisma Studio
npm run db:studio
```

## Common Tasks

### Adding a New API Route

1. Create file in `app/api/[route]/route.ts`
2. Export HTTP methods (GET, POST, PUT, DELETE)
3. Add validation with Zod
4. Write tests in `tests/api/`

### Adding a New Component

1. Create file in `app/components/`
2. Add TypeScript interfaces
3. Include accessibility attributes
4. Write tests in `tests/ui/`

### Adding a New Service

1. Create file in `lib/services/`
2. Extend BaseService if needed
3. Add to service registry
4. Write tests in `tests/unit/`

### Database Schema Changes

1. Modify `prisma/schema.prisma`
2. Generate migration: `npm run db:migrate`
3. Update seed data if needed
4. Test with `npm run test:db`

## Debugging

### Common Issues

**Database Connection Issues**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart services
docker-compose restart db
```

**Port Conflicts**
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process or change port in .env.local
PORT=3001 npm run dev
```

**TypeScript Errors**
```bash
# Check for type errors
npm run type-check

# Regenerate Prisma client
npm run db:generate
```

### Debug Tools

- **React DevTools** - Browser extension for React debugging
- **Prisma Studio** - Database GUI: `npm run db:studio`
- **Docker Desktop** - Container management
- **VS Code Extensions** - Recommended extensions in `.vscode/extensions.json`

## Testing Strategy

### Unit Tests
- Test individual functions and components
- Mock external dependencies
- Focus on business logic

### Integration Tests
- Test API endpoints
- Use test database
- Test database operations

### E2E Tests
- Test complete user workflows
- Run in headless browser
- Test PWA functionality

### Accessibility Tests
- Ensure WCAG 2.1 AA compliance
- Test keyboard navigation
- Verify screen reader compatibility

## Performance Monitoring

### Lighthouse Audits
```bash
# Run performance audit
npm run lighthouse
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
# Check .next/analyze/ for bundle report
```

### Database Performance
```bash
# Check slow queries
npm run db:studio
# Use Prisma query logging
```

## Deployment

### Staging Deployment
- Automatic deployment from `develop` branch
- Available at `staging.healthtracker.com`
- Test new features before production

### Production Deployment
- Manual deployment from `main` branch
- Available at `healthtracker.com`
- Requires approval and testing

## Getting Help

### Documentation
- **API Documentation** - `/docs/api.md`
- **Architecture Guide** - `/docs/architecture.md`
- **Deployment Guide** - `/docs/deployment.md`

### Team Resources
- **Slack Channel** - #healthtracker-dev
- **GitHub Issues** - For bug reports
- **GitHub Discussions** - For questions
- **Code Review** - Ask in PR comments

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Material-UI Documentation](https://mui.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Next Steps

1. **Complete Setup** - Ensure everything is working
2. **Read Architecture** - Understand the system design
3. **Pick First Task** - Start with a good first issue
4. **Join Team Chat** - Connect with the team
5. **Ask Questions** - Don't hesitate to ask for help

Welcome to the team! 🎉 