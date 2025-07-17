# Requirements Document

## Introduction

The **AI Health Companion** is a comprehensive health‑optimization PWA built with Next.js 14, combining a chat‑first AI interface, offline capabilities, and rich component‑based UI elements. It empowers users to:

* Converse with an AI assistant to intake preferences, goals, and constraints
* Generate personalized meal and activity plans with macro‑ and fiber‑tracking
* Log meals, biomarkers (weight, blood pressure, glucose, ketones), and progress photos
* Create grocery lists, export PDFs/docx reports, and earn gamified certificates
* Compete via leaderboards and adjust plans dynamically as data updates

This document enumerates every functional and non‑functional requirement, each with user stories and detailed acceptance criteria, so that any team member can implement their piece independently.

---

## Requirement 1: Authentication & User Management

**User Story:**
As a user, I want to securely register and log in with a username and password, so that my health data is private and personalized to me.

### Acceptance Criteria

1. **Registration**

   * WHEN a new user submits a unique username and password
     THEN the system SHALL create a user record, hash the password with bcrypt (≥12 rounds), and initialize an empty profile.

2. **Login**

   * WHEN a user provides valid credentials
     THEN the system SHALL return an **access token** (JWT, 15 min expiry) and a **refresh token** (JWT, 7 d expiry), stored in localStorage.

3. **Token Refresh**

   * WHEN the access token is expired and the refresh token is valid
     THEN the system SHALL issue a new access token without requiring re‑login.

4. **Protected Routes**

   * WHEN requests hit any `/api/*` endpoint (except `/auth/*`)
     THEN the system SHALL reject unauthorized requests with HTTP 401 if no valid access token is provided.

5. **Password Reset** (Optional MVP)

   * WHEN a user requests a password reset
     THEN the system SHALL send a secure, single‑use link via email (on future roadmap).

---

## Requirement 2: Chat‑First AI Interface

**User Story:**
As a user, I want to interact with an AI assistant via natural conversation so I can seamlessly convey my preferences, log data, and receive recommendations.

### Acceptance Criteria

1. **Message Handling**

   * WHEN a user sends a chat message
     THEN the system SHALL forward it to the MCP server via WebSocket or HTTP SSE.

2. **LLM Processing**

   * WHEN a message arrives at the MCP server
     THEN the system SHALL route it to the selected LLM provider according to latency‑cost weighting.

3. **Component JSON Embeds**

   * WHEN the AI response includes a JSON‑fenced block with `"type": "...”`
     THEN the client SHALL parse and render the corresponding React component (e.g., `RecipeCard`, `PlanSummary`, `LeaderboardSnippet`).

4. **Quick‑Reply Chips**

   * WHEN the AI offers selectable options
     THEN the client SHALL display them as clickable chips that send the associated text back to the AI.

5. **Streaming Responses**

   * WHEN the AI is generating output
     THEN the client SHALL stream partial responses in real‑time to the chat window.

6. **Tool Calling**

   * WHEN the AI invocation includes a tool call (e.g., `generate_plan`, `log_meal`)
     THEN the MCP server SHALL validate scopes, execute the underlying service, and return structured JSON for rendering.

---

## Requirement 3: Rich UI via Component JSON

**User Story:**
As a user, I want key information presented in interactive cards and tables rather than plain text, so I can quickly understand and act on it.

### Acceptance Criteria

1. **Component Registry**

   * The client SHALL maintain a registry mapping JSON `type` fields to React components.

2. **RecipeCard**

   * WHEN the AI emits a `RecipeCard` JSON
     THEN the client SHALL render dish name, macros, ingredients list, instructions, and “Save,” “PDF,” “Swap” buttons.

3. **PlanSummary**

   * WHEN the AI emits `PlanSummary` JSON
     THEN the client SHALL render a calendar grid showing daily macro totals and links to individual recipes.

4. **LeaderboardSnippet**

   * WHEN the AI emits `LeaderboardSnippet` JSON
     THEN the client SHALL render current rank, points, and a “View Full Leaderboard” link.

5. **GroceryListCard**

   * WHEN the AI emits `GroceryListCard` JSON
     THEN the client SHALL render grouped check‑off lists by aisle with an “Export PDF” button.

---

## Requirement 4: Meal & Activity Plan Generation

**User Story:**
As a user, I want to generate daily, weekly, or monthly meal and activity plans tailored to my calorie and macro targets, so I can follow a structured regimen.

### Acceptance Criteria

1. **Generate Plan Tool**

   * WHEN the AI calls `generate_plan({type, span})`
     THEN the server SHALL compute a plan, store it under the user’s record, and return structured JSON.

2. **Plan JSON Schema**

   * The JSON SHALL include:

     * `days[]` with date, meals or workouts, titles, macro totals, and recipe IDs.

3. **Re‑roll / Edit**

   * WHEN the user requests changes (“swap Tuesday dinner”)
     THEN the AI SHALL call the tool again with the modified parameters and update the stored plan.

4. **Dashboard View**

   * WHEN a plan exists
     THEN `/dashboard` SHALL display the plan in a user‑friendly timetable with clickable recipe cards.

5. **Macro Calculations**

   * Macros & fiber totals in each plan SHALL match user’s profile targets within ±5 %.

---

## Requirement 5: Biomarker Logging & Dashboard

**User Story:**
As a user, I want to log weight, blood pressure, glucose, ketones, and photos, so I can monitor my progress over time.

### Acceptance Criteria

1. **Logging Endpoint**

   * WHEN the AI or user calls `log_biomarker({…})`
     THEN the server SHALL validate and store the entry with timestamp and optional photo URL.

2. **Photo Upload**

   * WHEN a user points the camera at a form or scale
     THEN the client SHALL upload the file via presigned S3 URL and pass back the `photo_url`.

3. **Historical Charts**

   * `/dashboard` SHALL display interactive `BiomarkerChart` components (weight, BP, glucose, ketones) over selectable date ranges.

4. **Data Validation**

   * BP values SHALL be within human physiological ranges; glucose/ketones between 0–500 mg/dL and 0–10 mmol/L, respectively—or the server rejects with HTTP 400.

---

## Requirement 6: Leaderboard & Gamification

**User Story:**
As a user, I want to earn points for healthy actions and compare my progress to others, so I stay motivated.

### Acceptance Criteria

1. **Points Model**

   * The server SHALL award points per logged meal, biomarker entry, completed workout, chat engagement, and weight lost.

2. **Leaderboard Endpoints**

   * `/api/leaderboard/top?limit=N`
   * `/api/leaderboard/me`
   * `/api/leaderboard/around-me`

3. **Real‑Time Updates**

   * WHEN a user earns points
     THEN the AI chat or dashboard SHALL reflect the new score without full page reload.

4. **Privacy Controls**

   * Users can opt out of global leaderboard visibility in profile settings.

---

## Requirement 7: Offline & PWA Capabilities

**User Story:**
As a user, I want the app to work offline and be installable on my device, so I can log meals and view plans without reliable internet.

### Acceptance Criteria

1. **Service Worker**

   * The system SHALL cache static assets, API shell responses, and the last viewed chat history.

2. **Read/Write Queue**

   * When offline, MCP tool calls SHALL be queued locally (IndexedDB) and retried when back online.

3. **Installable**

   * The Web App Manifest SHALL provide icons, theme color, and “Add to Home Screen” prompts on supported browsers.

---

## Requirement 8: LLM Router & In‑Memory Cache

**User Story:**
As a developer, I want to route LLM calls through multiple providers based on latency and cost, and cache recent results, so the system is performant and cost‑efficient.

### Acceptance Criteria

1. **Provider Probes**

   * On server startup, probe each LLM endpoint for latency and record cost per 1 k tokens.

2. **Scoring Function**

   * Calculate `score = latencyWeight × (latency_norm) + costWeight × (cost_norm)` using normalized metrics.

3. **Provider Selection**

   * The router SHALL pick the provider with the lowest score that is operational.

4. **In‑Mem Cache**

   * Implement `quick-lru` with TTL=6 h; tool calls check the cache key before invoking LLM.

---

## Requirement 9: Grocery List Generation

**User Story:**
As a user, I want to generate a consolidated grocery list from my meal plan, so I can shop efficiently.

### Acceptance Criteria

1. **API Endpoint**

   * `POST /api/grocery-list { plan_id }` returns grouped ingredient list JSON and PDF URL.

2. **Taxonomy Mapping**

   * Ingredients SHALL be mapped to one of seven aisles (Produce, Meat & Seafood, Dairy & Eggs, Pantry, Spices & Condiments, Frozen, Snacks).

3. **Component & PDF**

   * The client SHALL render `GroceryListCard` with checkboxes and provide “Export PDF” that downloads a print‑ready list.

---

## Requirement 10: PDF & Docx Export

**User Story:**
As a user, I want to export recipes, plans, and certificates as PDFs or Docx, so I can print or share them.

### Acceptance Criteria

1. **PDF Service**

   * `/api/reports/:type` generates on‑the‑fly PDFs using Puppeteer, caches for 24 h.

2. **Docx Option**

   * Provide `?format=docx` query to return a .docx file for Word.

3. **Content Consistency**

   * On‑screen and PDF layouts SHALL match MUI theme exactly (colors, fonts, spacing).

---

## Requirement 11: Admin & Site‑Wide Settings

**User Story:**
As an admin, I want to configure LLM providers, feature flags, and view system health, so I can manage the platform.

### Acceptance Criteria

1. **Admin UI**

   * `/app/dashboard/admin` protected by role; lists detected LLMs, latency/cost metrics, toggle switches for features.

2. **Settings Persistence**

   * Settings stored in `/api/settings` backed by a `settings` table; immediate effect without redeploy.

3. **Demo Accounts**

   * Seed `admin/demo` and `user/demo` accounts on first migration.

---

## Requirement 12: Testing & Quality Assurance

**User Story:**
As a developer, I want automated tests covering all layers, so I can safely refactor and deploy.

### Acceptance Criteria

1. **Unit Tests**

   * 90 %+ coverage for business logic, hooks, components.

2. **API Tests**

   * supertest coverage for all REST routes with mocked auth.

3. **DB Integration**

   * testcontainers runs a real Postgres; migrations & seeders applied; data assertions.

4. **UI Snapshots**

   * react‑test‑renderer snapshots for all key components.

5. **E2E Tests**

   * Playwright scripts covering chat flow, plan gen, logging, PWA install, offline logging.

6. **Lighthouse**

   * lighthouse‑ci configured; PWA, Accessibility, Performance ≥ 90.

---

## Requirement 13: CI/CD & Deployment

**User Story:**
As DevOps, I want CI pipelines that build, test, and deploy the app reliably.

### Acceptance Criteria

1. **GitHub Actions**

   * Multi‑matrix jobs for Node 20 + OS Ubuntu Latest.

2. **Pipeline Steps**

   * Install → lint → test\:unit → test\:api → test\:db → test\:ui → build → test\:e2e → lighthouse.

3. **Protected Branches**

   * `main` requires passing CI and 2 approvals; `develop` requires passing CI.

4. **Deployment**

   * On merge to `main`, deploy to Vercel or Docker registry with environment variables.

---

## Requirement 14: Observability & Monitoring

**User Story:**
As an operator, I want real‑time metrics and error tracking, so I can maintain uptime and performance.

### Acceptance Criteria

1. **Metrics**

   * `/api/metrics` exposes Prometheus metrics: request latencies, cache hits/misses, error counts.

2. **Sentry**

   * Browser & Node SDK capture unhandled exceptions & performance spans.

3. **LogRocket** (Optional)

   * Session replay for front‑end incidents.

---

## Requirement 15: Accessibility & Internationalization

**User Story:**
As a user with different needs, I want accessible UI and multiple languages, so I can use the app comfortably.

### Acceptance Criteria

1. **WCAG 2.1 AA**

   * All components pass automated a11y checks (axe) and keyboard navigation.

2. **i18n**

   * All UI strings externalized; initial support for English; framework ready for locales.

---

## Requirement 16: Security & Compliance

**User Story:**
As a stakeholder, I want data secured and compliant with regulations, so user trust is maintained.

### Acceptance Criteria

1. **Encryption**

   * TLS for all endpoints; database at‑rest encryption.

2. **Rate Limiting**

   * 100 req/min per user on `/api/*`.

3. **GDPR**

   * `/api/export-data` and `/api/delete-account` endpoints to comply with data portability and erasure.

4. **Penetration Testing**

   * Pre‑production pentest conducted annually.

---

# End of Requirements Document

This fully detailed requirements specification ensures any team member—frontend, backend, QA, DevOps, or design—can independently implement their scope with no missing context.
