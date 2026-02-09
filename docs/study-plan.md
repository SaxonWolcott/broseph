# Broseph Study Plan — Understanding the Full Stack

> **Goal:** Be able to explain every technology, pattern, and architectural decision in this project to a professor.
>
> **Method:** Study each topic below, take notes in Obsidian, and link concepts together as you learn how they interact.

---

## How to Use This Document

1. Work through the modules **in order** — each builds on the previous
2. For each topic, create an **Obsidian note** (suggested filenames given below)
3. Use **`[[double brackets]]`** in Obsidian to link related concepts together
4. After studying each topic, revisit the Broseph codebase to find where that concept is used — file paths are provided
5. Check off each item as you complete it

---

## Module 1: Foundations (Start Here)

These are the building blocks everything else sits on.

### 1.1 — TypeScript ✅
- [x] What TypeScript adds to JavaScript (static types, interfaces, generics)
- [x] Type inference vs. explicit typing
- [x] Decorators (used heavily in NestJS) — preview only, deep dive in Module 3
- [x] `tsconfig.json` — what the compiler options mean
- [x] **Bonus:** ES Modules (`export`/`import`), barrel files (`index.ts`), re-exports
- [x] **Bonus:** Interface inheritance (`extends`), literal union types, type narrowing, definite assignment (`!`)
- **Obsidian note:** `TypeScript.md`
- **Key files studied:** `frontend/src/types/groups.ts`, `frontend/src/utils/formatTime.ts`, `backend/tsconfig.json`, `backend/libs/shared/src/index.ts`

### 1.2 — Node.js & npm/pnpm ✅
- [x] What Node.js is (JavaScript runtime outside the browser — V8 engine)
- [x] What a package manager does (npm vs. pnpm — global cache, hard links)
- [x] `package.json` — scripts, dependencies, devDependencies
- [x] Workspaces / monorepo concept (one repo, multiple packages sharing code)
- [x] `--filter` for targeting specific workspaces; `concurrently` for parallel dev
- **Obsidian note:** `Node and pnpm.md`
- **Key files studied:** Root `package.json`

### 1.3 — REST APIs & HTTP ✅
- [x] HTTP methods (GET, POST, PUT, DELETE) and when to use each
- [x] Request/response cycle (headers, body, status codes)
- [x] What a REST API is (resource-oriented endpoints)
- [x] JSON as the data exchange format
- [x] URL parameters (`:groupId`), nested resources (`/groups/:id/messages`)
- [x] Status code 202 Accepted for async/queued operations
- [x] **Bonus:** Hook → Controller → Service relationship and file naming conventions
- **Obsidian note:** `REST APIs.md`
- **Key files studied:** `groups.controller.ts`, `groups.service.ts`, `useGroups.ts`, `messages.controller.ts`

### 1.4 — SQL & Relational Databases ✅
- [x] Tables, rows, columns, primary keys, foreign keys
- [x] Relationships (one-to-one, one-to-many, many-to-many)
- [ ] JOIN queries and why they matter *(not yet covered — comes up in Module 2 with Supabase queries)*
- [x] Indexes and why they improve performance (composite indexes)
- [x] Constraints (`NOT NULL`, `UNIQUE`, `CHECK`, `ON DELETE CASCADE`)
- [x] Junction tables for many-to-many relationships (`group_members`)
- [x] Defense in depth — validation at frontend, backend, AND database layers
- **Obsidian note:** `SQL and Relational Databases.md`
- **Key files studied:** `20250109000000_groups.sql`, `20250109000001_messages.sql`, `docs/er-diagram.md`

---

## Module 2: The Database Layer — Supabase & PostgreSQL

### 2.1 — PostgreSQL ✅
- [x] What PostgreSQL is (open-source relational database)
- [x] How it differs from MySQL, SQLite
- [x] UUID primary keys (why this project uses UUIDs instead of auto-increment integers)
- [x] Triggers and functions (e.g., auto-creating a profile on signup)
- [x] **Bonus:** `TIMESTAMPTZ` vs `TIMESTAMP` (timezone-aware storage)
- [x] **Bonus:** Partial unique indexes (`WHERE` clause on index)
- [x] **Bonus:** Identifying relationships (FK as PK for 1-to-1, profiles pattern)
- [x] **Bonus:** `BEFORE` vs `AFTER` triggers and when to use each
- [x] **Bonus:** `SECURITY DEFINER` for privilege escalation in trigger functions
- [x] **Bonus:** `ON CONFLICT DO NOTHING` for idempotent inserts
- **Obsidian note:** `PostgreSQL.md`
- **Key files studied:** `20240101000000_initial_schema.sql`, `20240102000000_profiles.sql`, `20250109000000_groups.sql`

### 2.2 — Supabase ✅
- [x] What Supabase is (open-source Firebase alternative, built on PostgreSQL)
- [x] What it provides: database, auth, realtime, storage, edge functions
- [x] Supabase CLI for local development (`supabase start`, `supabase db reset`)
- [x] Supabase Studio (web UI for browsing your database)
- [x] The difference between the **anon key** (public, limited) and **service role key** (full access, secret)
- [x] **Bonus:** `config.toml` — local project settings (JWT expiry, ports, auth config)
- [x] **Bonus:** Inbucket for capturing emails in local development (port 54324)
- [x] **Bonus:** Frontend vs backend Supabase client configuration (`persistSession`, `autoRefreshToken`)
- [x] **Bonus:** Two-client backend pattern: `getAdminClient()` vs `getClientForUser(token)`
- [x] **Bonus:** `VITE_` prefix as a safety rail for frontend env vars
- [x] **Bonus:** Stateful (browser) vs stateless (server) session management
- **Obsidian note:** `Supabase.md`
- **Link to:** `[[PostgreSQL]]`, `[[Authentication]]`, `[[Row Level Security]]`, `[[Environment Variables]]`
- **Key files studied:** `supabase/config.toml`, `.env.example`, `frontend/src/lib/supabase.ts`, `backend/libs/shared/src/supabase/supabase.service.ts`

### 2.3 — Row Level Security (RLS)
- [ ] What RLS is (database enforces who can see/modify which rows)
- [ ] How policies work (USING clause for SELECT, WITH CHECK for INSERT/UPDATE)
- [ ] Why this is more secure than app-level checks alone
- [ ] The two client types: **user client** (respects RLS) vs **admin/service client** (bypasses RLS)
- [ ] `SECURITY DEFINER` functions (run with the function creator's permissions)
- **Obsidian note:** `Row Level Security.md`
- **Link to:** `[[Supabase]]`, `[[Authentication]]`
- **In the codebase:** `supabase/migrations/20250109000000_groups.sql`, `20250109000003_fix_rls_recursion.sql`

### 2.4 — Database Migrations
- [ ] What a migration is (versioned SQL scripts that evolve your schema)
- [ ] Why you never edit the database directly in production
- [ ] Migration naming convention (timestamp prefix)
- [ ] How `supabase db reset` replays all migrations from scratch
- **Obsidian note:** `Database Migrations.md`
- **Link to:** `[[Supabase]]`, `[[SQL and Relational Databases]]`
- **In the codebase:** `supabase/migrations/` (all 12 files, in order)

### 2.5 — Supabase Realtime
- [ ] What Realtime is (live database change notifications over WebSockets)
- [ ] PostgreSQL `LISTEN/NOTIFY` under the hood
- [ ] How the frontend subscribes to table changes
- [ ] Why only certain tables are published to Realtime
- **Obsidian note:** `Supabase Realtime.md`
- **Link to:** `[[Supabase]]`, `[[WebSockets]]`, `[[React Query]]`
- **In the codebase:** `supabase/migrations/20250109000006_enable_realtime.sql`, `frontend/src/hooks/useRealtimeMessages.ts`

---

## Module 3: The Backend — NestJS & Job Queues

### 3.1 — NestJS Framework
- [ ] What NestJS is (opinionated Node.js framework inspired by Angular)
- [ ] Core concepts: **Modules**, **Controllers**, **Services** (the "MCS" pattern)
- [ ] Dependency Injection — how NestJS wires things together automatically
- [ ] Decorators (`@Controller`, `@Get`, `@Post`, `@Injectable`, etc.)
- [ ] The request lifecycle (middleware → guards → interceptors → pipes → handler)
- **Obsidian note:** `NestJS.md`
- **Link to:** `[[TypeScript]]`, `[[REST APIs]]`, `[[Dependency Injection]]`
- **In the codebase:** `backend/apps/api/src/app.module.ts` (root module), any controller/service pair

### 3.2 — DTOs & Validation
- [ ] What a DTO is (Data Transfer Object — shapes data crossing boundaries)
- [ ] `class-validator` decorators (`@IsString()`, `@IsNotEmpty()`, `@MaxLength()`)
- [ ] `class-transformer` for serialization
- [ ] Zod schemas as an alternative/complement for runtime validation
- [ ] Why validate on both frontend and backend
- **Obsidian note:** `DTOs and Validation.md`
- **Link to:** `[[NestJS]]`, `[[TypeScript]]`
- **In the codebase:** `backend/libs/shared/src/dto/`, `backend/libs/shared/src/schemas/`

### 3.3 — Authentication & JWTs
- [ ] What a JWT is (JSON Web Token — self-contained signed token)
- [ ] How magic link / email OTP auth works (passwordless)
- [ ] The auth flow: email → magic link → callback → session → JWT
- [ ] How the backend validates JWTs on every request
- [ ] The `@CurrentUser()` custom decorator
- **Obsidian note:** `Authentication.md`
- **Link to:** `[[Supabase]]`, `[[NestJS]]`, `[[Row Level Security]]`
- **In the codebase:** `backend/apps/api/src/auth/`, `frontend/src/contexts/AuthContext.tsx`

### 3.4 — Redis
- [ ] What Redis is (in-memory key-value data store)
- [ ] Why it's fast (data lives in RAM, not on disk)
- [ ] Common use cases: caching, session storage, **job queues**
- [ ] How Docker runs Redis locally for this project
- **Obsidian note:** `Redis.md`
- **Link to:** `[[BullMQ]]`, `[[Docker]]`
- **In the codebase:** `docker-compose.yml`, `.env.example` (`REDIS_URL`)

### 3.5 — BullMQ (Job Queue)
- [ ] What a job/message queue is (producer publishes tasks, consumer processes them)
- [ ] Why use a queue instead of doing everything synchronously
- [ ] BullMQ concepts: **Queue**, **Worker/Processor**, **Job** (with data payload)
- [ ] The producer-consumer pattern in this project (API produces → Worker consumes)
- [ ] Job types in Broseph: `create-group`, `send-message`, `accept-invite`, etc.
- **Obsidian note:** `BullMQ.md`
- **Link to:** `[[Redis]]`, `[[NestJS]]`, `[[Architecture Patterns]]`
- **In the codebase:** `backend/apps/worker/src/job.processor.ts`, `backend/apps/worker/src/handlers/`

### 3.6 — Swagger / OpenAPI
- [ ] What OpenAPI/Swagger is (standard for describing REST APIs)
- [ ] How NestJS auto-generates docs from decorators
- [ ] How to access the docs locally (`http://localhost:3000/api/docs`)
- **Obsidian note:** `Swagger.md`
- **Link to:** `[[NestJS]]`, `[[REST APIs]]`
- **In the codebase:** `backend/apps/api/src/main.ts`

---

## Module 4: The Frontend — React & Data Fetching

### 4.1 — React Fundamentals
- [ ] Components, JSX, props, state
- [ ] Hooks (`useState`, `useEffect`, `useContext`, `useCallback`, `useMemo`)
- [ ] Component lifecycle and re-rendering
- [ ] Context API for global state (e.g., `AuthContext`)
- **Obsidian note:** `React.md`
- **In the codebase:** `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/contexts/`

### 4.2 — Vite
- [ ] What Vite is (next-gen frontend build tool)
- [ ] How it differs from older tools like Webpack (native ES modules, fast HMR)
- [ ] Dev server with Hot Module Replacement
- [ ] The dev proxy (frontend at :5173 proxies API calls to :3000)
- **Obsidian note:** `Vite.md`
- **Link to:** `[[React]]`, `[[Node and pnpm]]`
- **In the codebase:** `frontend/vite.config.ts`

### 4.3 — React Router
- [ ] Client-side routing (no page reloads)
- [ ] Route definitions, nested routes, URL parameters
- [ ] Protected routes (redirect unauthenticated users)
- **Obsidian note:** `React Router.md`
- **Link to:** `[[React]]`, `[[Authentication]]`
- **In the codebase:** `frontend/src/App.tsx`

### 4.4 — React Query (TanStack Query)
- [ ] What "server state" is vs "client state"
- [ ] Query keys and caching — how React Query avoids redundant fetches
- [ ] `useQuery` for fetching, `useMutation` for writing
- [ ] `useInfiniteQuery` for paginated/infinite scroll data
- [ ] Cache invalidation (how new data triggers refetches)
- [ ] Optimistic updates (show changes before server confirms)
- **Obsidian note:** `React Query.md`
- **Link to:** `[[React]]`, `[[REST APIs]]`, `[[Supabase Realtime]]`
- **In the codebase:** `frontend/src/hooks/` (all `use*.ts` files)

### 4.5 — TailwindCSS & HeroUI
- [ ] What utility-first CSS is (classes like `bg-blue-500`, `p-4`, `flex`)
- [ ] How Tailwind differs from traditional CSS or CSS-in-JS
- [ ] HeroUI as a component library built on Tailwind
- [ ] Dark mode and mobile-first responsive design
- **Obsidian note:** `TailwindCSS and HeroUI.md`
- **Link to:** `[[React]]`
- **In the codebase:** `frontend/tailwind.config.js`, any component file

---

## Module 5: Infrastructure & DevOps

### 5.1 — Docker
- [ ] What containers are (isolated, reproducible environments)
- [ ] Images vs. containers
- [ ] `docker-compose.yml` — defining multi-container setups
- [ ] Why we use Docker for Redis (consistent local dev environment)
- **Obsidian note:** `Docker.md`
- **Link to:** `[[Redis]]`
- **In the codebase:** `docker-compose.yml`

### 5.2 — Environment Variables
- [ ] What env vars are (configuration outside of code)
- [ ] Why secrets must never be committed to git
- [ ] `.env` vs `.env.example`
- [ ] How NestJS `@nestjs/config` reads them
- **Obsidian note:** `Environment Variables.md`
- **Link to:** `[[NestJS]]`, `[[Docker]]`
- **In the codebase:** `.env.example`, `backend/apps/api/src/app.module.ts`

### 5.3 — Git & Version Control
- [ ] Branching, committing, merging
- [ ] Why migrations are version-controlled
- [ ] `.gitignore` — what gets excluded and why
- **Obsidian note:** `Git.md`
- **In the codebase:** `.gitignore`

---

## Module 6: Architecture & Patterns (Tie It All Together)

### 6.1 — The Full Architecture Diagram
- [ ] Draw the complete system diagram: Frontend → API → BullMQ/Redis → Worker → Supabase
- [ ] Explain each arrow (what protocol, what data)
- [ ] Why the API and Worker are separate processes
- **Obsidian note:** `Architecture Overview.md`
- **Link to:** Every other note!

### 6.2 — Key Architectural Patterns
- [ ] **Producer-Consumer** (API queues jobs, Worker processes them)
- [ ] **Monorepo** (shared code between API and Worker)
- [ ] **Cursor Pagination** (efficient scrolling through large datasets)
- [ ] **Optimistic Updates** (show changes before server confirms)
- [ ] **Dependency Injection** (NestJS wires services automatically)
- [ ] **Context Provider** (React shares auth state globally)
- **Obsidian note:** `Architecture Patterns.md`
- **Link to:** `[[BullMQ]]`, `[[NestJS]]`, `[[React Query]]`, `[[React]]`

### 6.3 — Data Flow Walkthroughs
- [ ] Trace "user sends a message" end-to-end (UI → API → Redis → Worker → DB → Realtime → UI)
- [ ] Trace "user accepts an invite" end-to-end
- [ ] Trace "user logs in with magic link" end-to-end
- **Obsidian note:** `Data Flow Walkthroughs.md`
- **Link to:** `[[Architecture Overview]]`

---

## Suggested Study Schedule

| Week | Focus | Modules |
|------|-------|---------|
| 1 | Foundations | 1.1–1.4 (TypeScript, Node, REST, SQL) |
| 2 | Database Layer | 2.1–2.5 (PostgreSQL, Supabase, RLS, Migrations, Realtime) |
| 3 | Backend | 3.1–3.6 (NestJS, DTOs, Auth, Redis, BullMQ, Swagger) |
| 4 | Frontend | 4.1–4.5 (React, Vite, Router, React Query, Tailwind) |
| 5 | Infrastructure & Big Picture | 5.1–5.3, 6.1–6.3 (Docker, Env, Git, Architecture) |

---

## Obsidian Vault Structure

```
Broseph-Notes/
├── TypeScript.md
├── Node and pnpm.md
├── REST APIs.md
├── SQL and Relational Databases.md
├── PostgreSQL.md
├── Supabase.md
├── Row Level Security.md
├── Database Migrations.md
├── Supabase Realtime.md
├── NestJS.md
├── DTOs and Validation.md
├── Authentication.md
├── Redis.md
├── BullMQ.md
├── Swagger.md
├── React.md
├── Vite.md
├── React Router.md
├── React Query.md
├── TailwindCSS and HeroUI.md
├── Docker.md
├── Environment Variables.md
├── Git.md
├── Architecture Overview.md
├── Architecture Patterns.md
└── Data Flow Walkthroughs.md
```

> **Tip:** In Obsidian, use the **Graph View** to visualize how all these concepts connect. Your professor will be impressed by a web of interlinked knowledge.

---

## How We'll Work Together

When you're ready to study a topic:
1. Tell me which module/topic you're starting
2. I'll explain the concept and show you exactly where it appears in your codebase
3. You take notes in Obsidian as we go
4. I'll quiz you or ask you to trace through code to solidify understanding
5. We'll update this document with session notes below

---

## Session Log

### Session 1 — 2026-02-03
- Created this study plan
- Cataloged all technologies in the project

### Session 2 — 2026-02-03
- Completed **Module 1: Foundations** (all 4 subsections)
- **1.1 TypeScript:** Covered interfaces, union types, optional properties, decorators (preview), `tsconfig.json`. Deep-dived into ES Modules (`export`/`import`), barrel files (`index.ts`), re-exports, interface inheritance, literal union types, type narrowing. Key insight: TypeScript erases at compile time — runtime validation needs separate tools.
- **1.2 Node.js & pnpm:** Covered Node.js as V8 outside the browser, pnpm vs npm, `package.json` scripts, workspaces/monorepo pattern, `--filter` and `concurrently`. Key insight: monorepo keeps API and Worker type definitions in sync via shared library.
- **1.3 REST APIs & HTTP:** Covered HTTP methods, status codes (including 202 Accepted for async work), URL parameters, nested resources, JSON. Deep-dived into the Hook → Controller → Service chain and file naming conventions. Key insight: REST URLs mirror database relationships.
- **1.4 SQL & Relational Databases:** Covered tables, primary/foreign keys, `ON DELETE CASCADE`, constraints, many-to-many via junction tables, indexes (composite), defense in depth. Key insight: validation exists at three layers (frontend, backend, database).
- **Remaining from Module 1:** JOIN queries (will cover in Module 2 with Supabase)
- **Next step:** Module 2 — Supabase & PostgreSQL (start with 2.1)

### Session 3 — 2026-02-04
- Completed **2.1 PostgreSQL** and **2.2 Supabase**
- **2.1 PostgreSQL:** Covered what Postgres is, comparison to MySQL/SQLite (MVCC, extensibility, rich types). UUID primary keys via `uuid-ossp` extension and why they're better than auto-increment (no central coordinator, security, merging). Deep-dived into PL/pgSQL triggers and functions — `BEFORE UPDATE` for modifying data (auto `updated_at`), `AFTER INSERT` for reacting to events (auto profile creation). Covered `SECURITY DEFINER`, `TIMESTAMPTZ`, partial indexes, identifying relationships (FK as PK). Key insight: the database can react to its own events through triggers, removing the need for application code to handle cascading operations.
- **2.2 Supabase:** Covered what Supabase provides (DB, Auth, Realtime, Storage, Edge Functions). `config.toml` and local CLI (`supabase start` spins up full stack on ports 54321-54326). Inbucket for capturing magic link emails locally. Deep-dived into anon key vs service role key — power levels, who uses each, and why anon key is safe in the browser. Traced the two-client backend pattern in `supabase.service.ts`: `getAdminClient()` (bypasses RLS, for server/worker ops) vs `getClientForUser()` (respects RLS, for user-scoped queries). Frontend client uses `persistSession`/`autoRefreshToken` because browsers are stateful; backend doesn't because servers are stateless. Key insight: `VITE_` prefix is a safety rail preventing accidental exposure of server secrets to the frontend bundle.
- **Next step:** Module 2.3 — Row Level Security (RLS)

---

*This is a living document. We'll update it as you progress through the study plan.*
