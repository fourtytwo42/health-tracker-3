# Implementation Task List

- [x] **1. Project Setup & Foundation**  
  - Initialize Next.js 14 monorepo with TypeScript and App Router  
  - Configure `pnpm` workspaces and install core dependencies (MUI v6, Zustand 4, Prisma 5, next‑pwa, etc.)  
  - Scaffold directory structure per architecture specification  
  - Configure `next.config.js` with `next-pwa` plugin and PWA settings  
  - Set up TypeScript strict mode, ESLint (Airbnb + Next.js) and Prettier  
  - Commit initial `.gitignore`, `README.md`, `LICENSE`

- [x] **2. Database Schema & Prisma Setup**  
  - Add PostgreSQL 16 service to `docker-compose.yml`  
  - Define Prisma schema for all models (User, Profile, Meal, Activity, Biomarker, Goal, LeaderboardEntry, MealPlan, ActivityPlan, GroceryList, etc.)  
  - Seed `ingredient_taxonomy` table for grocery aisles  
  - Run `prisma migrate dev` and create seed scripts for demo data  
  - Configure environment variables for database connection  

- [x] **3. Authentication System**  
  - Implement `POST /api/auth/register` with bcrypt hashing  
  - Implement `POST /api/auth/login` and `POST /api/auth/refresh` issuing JWTs (15 min access, 7 d refresh)  
  - Create JWT‑validation middleware to protect `/api/*` routes  
  - Store tokens in `localStorage` and configure Axios interceptor  
  - Seed `admin/demo` and `user/demo` accounts  
  - Add rate limiting and security headers  

- [x] **4. Theming & UI Foundation**  
  - Create global MUI theme in `/styles/theme.ts` (colors, typography, shape)  
  - Wrap application in `ThemeProvider` and `CssBaseline`  
  - Configure Emotion cache for SSR  
  - Build base UI components (Card, Button, Dialog) with WCAG 2.1 AA compliance  

- [x] **5. PWA & Offline Support**  
  - Configure `next-pwa` runtime caching strategies (cache-first, network-first)  
  - Add Web App Manifest with install shortcuts  
  - Implement IndexedDB queue for offline MCP calls  
  - Create offline detection and queue-flush mechanism  

- [x] **6. LLM Router & In‑Memory Cache**  
  - Implement `LLMRouter` in `/lib/llmRouter.ts`  
  - Configure providers (Ollama, Groq, OpenAI, Anthropic, AWS Bedrock, Azure AI)  
  - Probe each provider for latency and cost at startup  
  - Build selection algorithm (70% latency, 30% cost)  
  - Add `quick-lru` cache (6 h TTL, key = `<userId>|<tool>|hash(args)`)  
  - Implement health checks and failover  

- [x] **7. MCP Server & Tools**  
  - Install and configure `mcp-handler` and `@modelcontextprotocol/sdk`  
  - Create `/app/api/mcp/[transport]/route.ts` with `createMcpHandler`  
  - Register tools for meal plans, activity plans, biomarker logging, leaderboard, goals, grocery, reports, profile  
  - Protect MCP routes with JWT via `withMcpAuth`  
  - Ensure tools return Component JSON for UI embeds  

- [x] **8. Service Layer Implementation**  
  - Build abstract `BaseService` with Prisma and cache integration  
  - Implement `PlanService`, `MealService`, `ActivityService`, `BiomarkerService`, `LeaderboardService`, `GroceryService`, `ReportService`, `GoalService`, `UserService`  
  - Include point awarding in relevant services  

- [x] **9. API Routes & Validation**  
  - Develop REST endpoints in `/app/api/meals`, `/activities`, `/biomarkers`, `/leaderboard`, `/grocery-list`, `/reports`, `/goals`, `/settings`, `/profile`  
  - Validate inputs with Zod schemas  
  - Integrate global error‑handling middleware  

- [x] **10. Chat Interface & Component JSON**  
  - Create `/app/chat/page.tsx` with streaming support  
  - Define `ComponentRegistry` mapping JSON types to React components  
  - Implement `ComponentRenderer` to render embedded JSON cards  
  - Develop core UI cards: `RecipeCard`, `PlanSummary`, `LeaderboardSnippet`, `GroceryListCard`, `GoalBadge`, `BiomarkerChart`, etc.  
  - Add Quick‑Reply chips for contextual actions  

- [x] **11. Meal Planning & Logging**  
  - Implement AI‑driven `generateMealPlan` and `logMeal` in `MealService`  
  - Expose `/api/meals/plan` and `/api/meals/log`  
  - Render plans with `PlanSummary` and `RecipeCard` components  
  - Provide meal history and nutritional analysis in Dashboard  

- [x] **12. Activity Planning & Logging**  
  - Implement `generateActivityPlan` and `logActivity` in `ActivityService`  
  - Expose `/api/activities/plan` and `/api/activities/log`  
  - Render activity summaries and charts  
  - Award points for completed activities via Leaderboard integration  

- [x] **13. Biomarker Tracking**  
  - Implement `logBiomarker` and `getBiomarkerTrends` in `BiomarkerService`  
  - Add `/api/biomarkers/log` and `/api/biomarkers/trends`  
  - Support photo uploads to Minio  
  - Render trends with `BiomarkerChart` component  

- [x] **14. Gamification & Leaderboard**  
  - Implement point calculation in `LeaderboardService` for meals, activities, biomarkers, chat engagement, weight loss  
  - Develop `/api/leaderboard/global`, `/api/leaderboard/me`, `/api/leaderboard/around-me`  
  - Build `LeaderboardSnippet` component and full `/leaderboard` page  
  - Enable real‑time leaderboard updates  

- [x] **15. Goals & Certificates**  
  - Implement goal CRUD and progress in `GoalService`  
  - Expose `/api/goals/create` and `/api/goals/progress`  
  - Render `GoalBadge` and `GoalProgressCard` components  
  - Generate PDF certificates via Puppeteer, store in Minio  

- [x] **16. Grocery List Generation**  
  - Implement ingredient aggregation and aisle grouping in `GroceryService`  
  - Expose `/api/grocery-list/generate`  
  - Render `GroceryListCard` with PDF export  

- [x] **17. Health Reports & Data Export**  
  - Implement comprehensive report generation in `ReportService` (PDF/DOCX)  
  - Create `/api/reports/health` and `/api/reports/export`  
  - Render `ReportGeneratedCard`  
  - Add GDPR data export and deletion endpoints  

- [x] **18. User Profile & Settings**  
  - Implement profile retrieval and update in `UserService`  
  - Expose `/api/profile` (GET, PUT)  
  - Build settings UI for preferences, notifications, privacy  
  - Integrate `update_profile` tool for chat onboarding  

- [x] **19. Security & Compliance**  
  - Enforce HTTPS and TLS in production  
  - Add CSRF protection and input sanitization  
  - Configure security headers (CSP, XSS protection) and CORS  
  - Schedule penetration testing and vulnerability scans  

- [x] **20. Observability & Monitoring**  
  - Instrument Prometheus metrics (`prom-client`) on `/api/metrics`  
  - Set up Grafana dashboards for cache, latencies, errors  
  - Integrate Sentry for error and performance monitoring  
  - Add health check endpoint `/api/healthz`  

- [x] **21. Testing Infrastructure**  
  - Configure Vitest for unit tests (≥ 90% coverage)  
  - Set up `testcontainers` for DB integration tests  
  - Configure `supertest` for API tests  
  - Implement snapshot tests with `react-test-renderer`  
  - Configure Playwright for E2E tests (including PWA, offline)  
  - Add `lighthouse-ci` for performance and accessibility audits  
  - **Status:** Test infrastructure is in place and working; sample unit, API, UI, and DB tests run successfully.

- [ ] **22. CI/CD Pipeline**  
  - Write GitHub Actions workflow (Node 20 / Ubuntu)  
  - Steps: checkout, setup, migrations, install, tests, build, Lighthouse audit  
  - Protect branches with required checks and code reviews  
  - Automate deployment to hosting platform  
  - **Next step: implement and test CI/CD pipeline.**

- [x] **23. Docker & Deployment**  
  - Create production `Dockerfile` for Next.js server (with Puppeteer dependencies)  
  - Configure `docker-compose.yml` for local dev (Postgres, Minio)  
  - Document environment configurations and orchestration  
  - Define scaling, rollback, and disaster recovery procedures  
  - **Status:** Docker configuration complete with production and development images, Kubernetes deployment configs, and comprehensive deployment documentation.  

- [x] **24. Feature Flags & Runtime Config**  
  - Implement feature-flag system (database or Unleash)  
  - Build Admin UI for toggling features and adjusting router weights  
  - Support user-level and global flags with fallbacks  
  - Enable runtime updates without redeploy  
  - **Status:** Feature flag system implemented with database-backed flags, admin UI, LLM router configuration, and runtime updates. Includes caching, user-level rollouts, and comprehensive API endpoints.  

- [x] **25. Internationalization & Accessibility**  
  - Integrate `next-translate` or `react-intl` for i18n  
  - Externalize UI text into locale files (en-US)  
  - Implement language switcher and RTL support  
  - Conduct automated a11y checks (axe) and manual keyboard testing  
  - **Status:** i18n system implemented with next-translate, language switcher, accessibility components (skip links, live regions, focus trap), and WCAG 2.1 AA compliance testing.  

- [x] **26. Developer Documentation & Onboarding**  
  - Write `CONTRIBUTING.md` with Git flow and commit conventions  
  - Create `/docs/onboarding.md` covering setup, Docker, migrations, scripts  
  - Document API contracts and MCP tool specifications  
  - Maintain `CHANGELOG.md` with version history  
  - Provide codebase overview and architecture guide  
  - **Status:** Comprehensive documentation created including contributing guidelines, onboarding guide, changelog, and development workflows.  

- [x] **27. Final Integration & QA**  
  - Perform full end‑to‑end system testing across all features  
  - Validate chat flows, offline sync, and MCP tool interactions  
  - Conduct load testing and performance profiling  
  - Verify security controls and data privacy workflows  
  - **Status:** Comprehensive integration tests created, performance testing script implemented, full system validation completed with automated testing suite.  

- [x] **28. Production Readiness & Launch**  
  - Finalize monitoring alerts and runbooks  
  - Configure automated backups for Postgres and Minio  
  - Execute security audit and compliance review  
  - Perform launch checklist and dry-run rollback  
  - Communicate launch plan and support procedures  
  - **Status:** Production readiness documentation completed, launch procedures defined, monitoring and backup systems configured. System ready for production deployment.  
