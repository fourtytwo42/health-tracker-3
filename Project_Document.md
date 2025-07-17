
---

# Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tech Stack & Libraries](#tech-stack--libraries)
3. [Architecture & Directory Layout](#architecture--directory-layout)
4. [Authentication & Security](#authentication--security)
5. [PWA & Offline Behavior](#pwa--offline-behavior)
6. [Chat & Component JSON](#chat--component-json)
7. [LLM Router & In‑Mem Cache](#llm-router--in-mem-cache)
8. [Core Features](#core-features)

   * Leaderboard
   * Grocery List
   * Biomarker Logging
   * Plans Generator
   * Goals & Certificates
9. [APIs & Contracts](#apis--contracts)
10. [Database Schema (Prisma)](#database-schema-prisma)
11. [UI Components & Theming](#ui-components--theming)
12. [Testing Strategy](#testing-strategy)
13. [CI/CD Pipeline](#cicd-pipeline)
14. [Deployment & Infrastructure](#deployment--infrastructure)
15. [Coding Standards & Conventions](#coding-standards--conventions)
16. [Branching & Release Process](#branching--release-process)
17. [Developer Onboarding](#developer-onboarding)
18. [Operations, Monitoring & Observability](#operations-monitoring--observability)
19. [Accessibility & Internationalization](#accessibility--internationalization)
20. [Security & Compliance](#security--compliance)
21. [Feature Flags & Configuration](#feature-flags--configuration)
22. [Glossary](#glossary)

---

## Executive Summary

**AI Health Companion** is a Next.js 14 monorepo (App Router) delivering an AI‑driven health platform:

* **Chat‑First**: Conversational intake, planning & tracking using MCP tools and rich “Component JSON” embeds.
* **PWA**: Mobile‑first, offline‑capable, desktop‑polished.
* **JWT Auth**: Username/password only, tokens in localStorage.
* **Features**: Meal & activity plans, grocery lists, leaderboard, biomarker logging, goal certificates, PDF/Docx exports.
* **LLM Router**: Pluggable providers (Ollama, Groq, OpenAI, Anthropic, AWS Bedrock, Azure), weighted by latency/cost.
* **In‑Memory Cache**: quick‑lru, no Redis.
* **PostgreSQL 16** (Docker) via Prisma; **Minio** for files; **Puppeteer** for PDF.
* **100 % Test Coverage**: Unit, API, DB, UI snapshots, E2E, Lighthouse.

Each section below is self‑contained—pick your specialty and go.

---

## Tech Stack & Libraries

| Layer             | Library & Version                                                                                                         | Purpose                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Framework**     | Next.js 14, TypeScript                                                                                                    | SSR/ISR, API routes, PWA support |
| **UI**            | MUI v6, @emotion/react/styled                                                                                             | Material 3 theming, components   |
| **Icons**         | material‑symbols\@4, @tabler/icons-react\@2                                                                               | UI iconography                   |
| **State**         | Zustand 4                                                                                                                 | Global store                     |
| **Forms**         | react‑hook‑form 8, zod 3                                                                                                  | Form state + validation          |
| **Data Fetching** | SWR 2                                                                                                                     | Stale‑while‑revalidate hooks     |
| **Charts**        | Recharts 3                                                                                                                | SVG charts                       |
| **Animation**     | framer‑motion 11                                                                                                          | Micro‑interactions               |
| **PWA**           | next‑pwa, workbox‑window 7                                                                                                | Offline caching, installable app |
| **Auth**          | jsonwebtoken 9, bcrypt 5                                                                                                  | JWTs, password hashing           |
| **ORM**           | Prisma 5                                                                                                                  | DB schema & migrations           |
| **DB**            | Postgres 16 (Docker)                                                                                                      | Primary datastore                |
| **Cache**         | quick‑lru 7                                                                                                               | In‑process LRU                   |
| **File Storage**  | @aws‑sdk/client‑s3 3                                                                                                      | Minio S3                         |
| **PDF**           | puppeteer 22                                                                                                              | SSR React → PDF                  |
| **LLM MCP**       | mcp-handler 1, @modelcontextprotocol/sdk, zod 3                                                                           | MCP server adapter               |
| **Testing**       | Vitest 1, supertest 8, testcontainers 9, react‑testing‑library 14, react‑test‑renderer 19, Playwright 1.44, lighthouse‑ci | Full test suite                  |
| **Lint & Format** | eslint 9 (Airbnb + Next), prettier 3                                                                                      | Code quality                     |
| **CI/CD**         | GitHub Actions                                                                                                            | Multi‑matrix pipelines           |

---

## Architecture & Directory Layout

```
/ (root)
├─ /app                  # Next.js App Router
│   ├─ /api              # API route handlers
│   │   ├─ auth          # register, login, refresh
│   │   ├─ chat          # WebSocket + MCP transport route
│   │   ├─ meals         # plan, log
│   │   ├─ activities    # plan, log
│   │   ├─ biomarkers    # log
│   │   ├─ leaderboard   # top, me, around-me
│   │   ├─ grocery-list  # generate
│   │   ├─ reports       # PDF/Docx endpoints
│   │   └─ settings      # admin site-wide settings
│   ├─ /components       # shared React components
│   ├─ /context          # Zustand stores, Auth context
│   ├─ /hooks            # custom React hooks
│   ├─ /styles           # global MUI theme + CSS resets
│   ├─ /lib              # business logic services (planService, mealService, etc.)
│   └─ page.tsx / layout.tsx  # root layout & pages
├─ /public               # static assets, PWA icons, manifest
├─ /prisma               # schema.prisma, migrations
├─ /scripts              # CI scripts, db seeders
├─ /tests                # integration & unit test fixtures
├─ next.config.js        # Next.js config + next-pwa plugin
├─ tsconfig.json         # TypeScript config
├─ package.json
└─ Dockerfile / docker-compose.yml
```

Each folder is autonomous: front‑enders don’t need to know server details, and vice versa.

---

## Authentication & Security

1. **JWT‑Based**

   * Access token 15 min; refresh 7 days.
   * Stored in `localStorage` (no cookies).
   * Axios interceptor attaches `Authorization: Bearer <token>`.

2. **Password Hashing**

   * `bcrypt` with 12 salt rounds.

3. **MCP Authorization**

   * `withMcpAuth` wrapper validates access token, injects `authInfo`.
   * Tools guarded by scopes if needed.

4. **OWASP Best Practices**

   * HTTP headers via `helmet`.
   * Rate‑limit `/api/*` to 100 req/min per user.
   * CORS strictly whitelisted to same‑origin.

---

## PWA & Offline Behavior

* **next-pwa** caches JS/CSS, images, static HTML at build time.
* **Dynamic** assets (`/api/…`) use network‑first, with a fallback message if offline.
* **IndexedDB** queue (idb-keyval) for MCP tool calls when offline, flush on reconnect.
* **Web App Manifest** includes install‑shortcuts: “Log Meal,” “Open Chat”.

---

## Chat & Component JSON

* **MCP Server** at `/app/api/mcp/[transport]/route.ts` via `mcp-handler`.
* **Component JSON** `<RecipeCard>`, `<PlanSummary>`, `<LeaderboardSnippet>`, etc., injected via fenced blocks.
* **Chat UI** in `/app/chat/page.tsx` streams messages; client parses JSON blocks into React components.
* **QuickReplies** chips auto‑send user messages when clicked.

---

## LLM Router & In‑Mem Cache

* **LLMRouter** singleton in `/lib/llmRouter.ts`
* **Providers**: Ollama (local), Groq, OpenAI, Anthropic, AWS Bedrock, Azure AI
* **CacheLRU** in `/lib/cache.ts`: key = `<user>|<tool>|hash(args)`, TTL=6 h.
* **Latency/Cost** scored via normalized metrics; weights 0.7/0.3 default.

---

## Core Features

### Leaderboard

* Points model (meals, biomarkers, workouts, weight loss).
* API `/api/leaderboard/*`, component `<LeaderboardSnippet>`, page `/leaderboard`.

### Grocery List

* From plan JSON, grouped by aisle taxonomy.
* API `/api/grocery-list`, component `<GroceryListCard>`, PDF export.

### Biomarker Logging

* Camera/photo upload via `<input capture>`; stored in Minio.
* API `/api/biomarkers`, chart `<BiomarkerChart metric="weight" />`.

### Plans Generator

* Tools `generate_plan({type,span})` → plan JSON.
* Components `<PlanSummary>`, `<RecipeCard>`.

### Goals & Certificates

* User sets goals via chat or `/dashboard`.
* API `/api/goals`, component `<GoalBadge>`, PDF certificate generator.

---

## APIs & Contracts

Each `/app/api/*/route.ts` exports REST handlers:

```ts
// Example: POST /api/meals/plan
export async function POST(req: Request) {
  const { type, span, date } = await req.json();
  const plan = await generatePlan(userId, type, span, date);
  return NextResponse.json(plan);
}
```

All request/response schemas validated by Zod.

---

## Database Schema (Prisma)

```prisma
model User { ... }
model Profile { ... }
model Biomarker { ... }
model Meal { ... }
model Activity { ... }
model Goal { ... }
model Leaderboard { userId Int @id ... }
model GroceryList { ... }
```

Migrations live in `/prisma/migrations`.

---

## UI Components & Theming

* **Global Theme** in `/styles/theme.ts`: palette (primary #0057FF, secondary #00C4B3), typography “Inter Variable”, shape radius 8 px.
* **Component Registry** in `/components/registry.tsx` maps JSON → React.
* **Accessible**: ARIA roles, keyboard focus, high‑contrast support.

---

## Testing Strategy

* **Unit** (Vitest): functions, hooks, services.
* **API** (Vitest + supertest): route handlers with mocked Prisma.
* **DB‐integration**: testcontainers spins Postgres, runs migrations & seeds.
* **UI Snapshots**: react‑test‑renderer snapshots of components.
* **E2E** (Playwright): core flows in headless Chromium, mobile+desktop viewports.
* **PWA** (lighthouse‑ci): ≥ 90 in PWA, Performance, Accessibility.

Coverage threshold: 90 %.

---

## CI/CD Pipeline

**GitHub Actions** with matrix:

1. Install dependencies
2. `pnpm prisma:migrate:dev`
3. Run all test scripts
4. Build Next.js (`next build`)
5. Run `lighthouse-ci`
6. On `main` merge: deploy to Vercel or Docker registry

---

## Deployment & Infrastructure

* **Production**: Docker container for Next.js server + managed Postgres (or self‑hosted via Docker).
* **Environment Variables** stored in hosting platform: DB URL, JWT secrets, LLM keys.
* **Minio**: optional container or managed S3.
* **Puppeteer**: headless Chrome binary bundled in container.

---

## Coding Standards & Conventions

* **TypeScript** strict mode on.
* **ESLint**: Airbnb + Next.js plugin.
* **Prettier** for formatting; hook via `husky` pre‑commit.
* **Commit Messages**: Conventional Commits.

---

## Branching & Release Process

* **main**: production; protected.
* **develop**: integration; merges via PR.
* **feature/**\* branches: one feature per branch; PR to develop.
* **release/**\* branches: from develop; QA → merge to main + tag.
* **hotfix/**\* for urgent fixes on main.

---

## Developer Onboarding

1. Clone repo & `pnpm install`.
2. Copy `.env.example` → `.env.local`.
3. `docker-compose up db`
4. `pnpm prisma:migrate dev --name init`
5. `pnpm dev` → [http://localhost:3000](http://localhost:3000)
6. Run tests: `pnpm test:unit`, `pnpm test:api`, etc.
7. See `/docs/contributing.md` for detailed guide & code style.

---

## Operations, Monitoring & Observability

* **Prometheus** via `prom-client` on `/api/metrics`.
* **Grafana** dashboards: caching stats, API latency, errors.
* **Sentry** for runtime errors (browser & Node).
* **LogRocket** optional for session replay.

---

## Accessibility & Internationalization

* **WCAG 2.1 AA** compliance: semantic HTML, ARIA labels.
* **i18n** setup via `next‑translate` or `react‑intl`; initial locale en-US.

---

## Security & Compliance

* **HTTPS only** in prod.
* **Rate‑limiting**, **CSRF** checks on form posts.
* **GDPR**: user data export & deletion endpoints.
* **Data Encryption** at rest (DB encryption) & in‑transit.

---

## Feature Flags & Configuration

* **Unleash** or simple `featureFlags` table in DB.
* Toggle new experiences (like “Leaderboard” or “Grocery PDF”) per user or globally.

---

## Glossary

* **MCP**: Model Context Protocol—tool‑calling interface for AI.
* **Component JSON**: embedded JSON that the chat client renders as rich UI.
* **Plan**: structured meal or activity schedule.
* **Biomarker**: metric like weight, BP, glucose with optional photo.
* **Leaderboard**: gamification ranking.
* **Grocery List**: aggregated ingredient list.

---
