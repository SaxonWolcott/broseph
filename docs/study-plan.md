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

### 2.3 — Row Level Security (RLS) ✅
- [x] What RLS is (database enforces who can see/modify which rows)
- [x] How policies work (USING clause for SELECT, WITH CHECK for INSERT/UPDATE)
- [x] Why this is more secure than app-level checks alone
- [x] The two client types: **user client** (respects RLS) vs **admin/service client** (bypasses RLS)
- [x] `SECURITY DEFINER` functions (run with the function creator's permissions)
- [x] **Bonus:** `auth.uid()` and `auth.role()` — Supabase helpers that extract identity from JWTs inside PostgreSQL
- [x] **Bonus:** Self-referential recursion pitfall (policy on `group_members` querying `group_members`) and transitive recursion
- [x] **Bonus:** `FOR UPDATE` implicit behavior — `USING` is reused as `WITH CHECK` if only `USING` is specified
- [x] **Bonus:** Unauthenticated access pattern (invite preview policy with no `auth.uid()` check)
- **Obsidian note:** `Row Level Security.md`
- **Link to:** `[[Supabase]]`, `[[Authentication]]`, `[[PostgreSQL]]`
- **Key files studied:** `20250109000000_groups.sql`, `20250109000002_invites.sql`, `20250109000003_fix_rls_recursion.sql`, `20250109000005_invite_insert_policy.sql`

### 2.4 — Database Migrations ✅
- [x] What a migration is (versioned SQL scripts that evolve your schema)
- [x] Why you never edit the database directly in production
- [x] Migration naming convention (timestamp prefix)
- [x] How `supabase db reset` replays all migrations from scratch
- [x] **Bonus:** Three categories of migrations: creation, bug fix/refactor, and evolution (data migrations)
- [x] **Bonus:** Migrations are immutable and append-only — enforced by consequences (tooling silently ignores edits to already-applied migrations), not hard guardrails
- [x] **Bonus:** `supabase_migrations.schema_migrations` tracking table — how Supabase knows which migrations have been applied
- [x] **Bonus:** Hand-written round timestamps vs CLI-generated real timestamps (`supabase migration new`)
- **Obsidian note:** `Database Migrations.md`
- **Link to:** `[[Supabase]]`, `[[SQL and Relational Databases]]`
- **Key files studied:** `supabase/migrations/` (all 18 files), especially `20240101000000_initial_schema.sql`, `20250109000003_fix_rls_recursion.sql`, `20260218155516_message_images.sql`, `20260218165518_convert_image_url_to_image_urls_array.sql`

### 2.5 — Supabase Realtime ✅
- [x] What Realtime is (live database change notifications over WebSockets)
- [x] PostgreSQL `LISTEN/NOTIFY` under the hood
- [x] How the frontend subscribes to table changes
- [x] Why only certain tables are published to Realtime
- [x] **Bonus:** WebSockets explained (persistent full-duplex connections vs HTTP request-response)
- [x] **Bonus:** The three-layer architecture: PostgreSQL publications → Supabase Realtime server (Elixir) → frontend WebSocket channels
- [x] **Bonus:** Server-side filtering (`filter: group_id=eq.${groupId}`) vs unfiltered subscriptions (when the table lacks the filter column)
- [x] **Bonus:** The "invalidate, don't use" pattern — Realtime as a signal to refetch, not a data source (consistency, completeness, simplicity)
- [x] **Bonus:** Multiple `.on()` listeners on a single channel (e.g., polls hook watches 3 tables on one connection)
- **Obsidian note:** `Supabase Realtime.md`
- **Link to:** `[[Supabase]]`, `[[WebSockets]]`, `[[React Query]]`
- **Key files studied:** `20250109000006_enable_realtime.sql`, `useRealtimeMessages.ts`, `useRealtimeMembers.ts`, `useRealtimeReactions.ts`, `useRealtimePolls.ts`, `GroupChatPage.tsx` (lines 60-63)

---

## Module 3: The Backend — NestJS & Job Queues

### 3.1 — NestJS Framework ✅
- [x] What NestJS is (opinionated Node.js framework inspired by Angular)
- [x] Core concepts: **Modules**, **Controllers**, **Services** (the "MCS" pattern)
- [x] Dependency Injection — how NestJS wires things together automatically
- [x] Decorators (`@Controller`, `@Get`, `@Post`, `@Injectable`, etc.)
- [x] The request lifecycle (middleware → guards → interceptors → pipes → handler)
- [x] **Bonus:** Module encapsulation — providers are private by default, `exports` makes them available to importing modules
- [x] **Bonus:** Why not re-declare providers in each module (duplicate instances, broken dependency chains, no single source of truth)
- [x] **Bonus:** `isGlobal: true` as an escape hatch for universal services like `ConfigModule`
- [x] **Bonus:** Custom parameter decorators (`@CurrentUser()`, `@AccessToken()`) via `createParamDecorator`
- [x] **Bonus:** Guards attach data to the request object; parameter decorators extract it — that's how data flows through the lifecycle
- **Obsidian note:** `NestJS.md`
- **Link to:** `[[TypeScript]]`, `[[REST APIs]]`, `[[Dependency Injection]]`
- **Key files studied:** `app.module.ts`, `groups.service.ts`, `auth.service.ts`, `supabase-auth.guard.ts`, `current-user.decorator.ts`, `main.ts`, `auth.module.ts`

### 3.2 — DTOs & Validation ✅
- [x] What a DTO is (Data Transfer Object — shapes data crossing boundaries)
- [x] `class-validator` decorators (`@IsString()`, `@IsNotEmpty()`, `@MaxLength()`, `@IsArray()`, `@ArrayMaxSize()`, `@IsUrl({ each: true })`)
- [x] `class-transformer` for serialization (`@Type(() => Number)` for query param coercion, `@Transform` for custom transforms)
- [x] `ValidationPipe` — where validation actually runs (`whitelist`, `forbidNonWhitelisted`, `transform`)
- [x] Zod schemas — defined in project but unused (dead code); primarily a framework-agnostic alternative to class-validator
- [x] Request DTOs (validated, decorated) vs Response DTOs (for Swagger docs only) vs Job DTOs (plain interfaces, internal boundary)
- [x] DTO inheritance (`GroupDetailDto extends GroupDto`)
- [x] Shared `LIMITS` constants (`as const`) as single source of truth across all layers
- [x] Defense in depth: frontend validation → backend `ValidationPipe` → database constraints
- [x] `ParseUUIDPipe` for inline URL parameter validation
- **Obsidian note:** `DTOs and Validation.md`
- **Link to:** `[[NestJS]]`, `[[TypeScript]]`
- **Key files studied:** `messages.dto.ts`, `groups.dto.ts`, `base.dto.ts`, `message-jobs.dto.ts`, `messages.schema.ts`, `groups.schema.ts`, `limits.ts`, `main.ts` (ValidationPipe config), `messages.controller.ts`

### 3.3 — Authentication & JWTs ✅
- [x] What a JWT is (JSON Web Token — self-contained signed token)
- [x] How magic link / email OTP auth works (passwordless)
- [x] The auth flow: email → magic link → callback → session → JWT
- [x] How the backend validates JWTs on every request
- [x] The `@CurrentUser()` custom decorator
- [x] **Bonus:** JWT structure (header, payload, signature) — signature is a cryptographic hash (one-way), not encryption (reversible)
- [x] **Bonus:** URL anatomy — hash fragment (`#`) vs query string (`?`) and why tokens go in the fragment (never sent to server, avoids log/proxy/Referer leaks)
- [x] **Bonus:** Why the guard saves the raw token (not just user object) — needed to create RLS-scoped Supabase clients via `getClientForUser(accessToken)`
- [x] **Bonus:** Token refresh lifecycle — JWTs expire (~1hr), Supabase client auto-refreshes via refresh token, `onAuthStateChange` keeps React state in sync
- [x] **Bonus:** Redirect URL allowlist validation in `sendMagicLink()` — prevents open redirect attacks
- **Obsidian note:** `Authentication.md`
- **Link to:** `[[Supabase]]`, `[[NestJS]]`, `[[Row Level Security]]`
- **Key files studied:** `supabase-auth.guard.ts`, `current-user.decorator.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.module.ts`, `supabase.service.ts` (validateToken), `AuthContext.tsx`, `AuthCallbackPage.tsx`

### 3.4 — Docker
- [x] What containers are (isolated, reproducible environments)
- [x] Images vs. containers
- [x] `docker-compose.yml` — defining multi-container setups
- [x] Why we use Docker for Redis (consistent local dev environment)
- **Obsidian note:** `Docker.md`
- **Link to:** `[[Redis]]`
- **In the codebase:** `docker-compose.yml`

### 3.5 — Redis
- [x] What Redis is (in-memory key-value data store)
- [x] Why it's fast (data lives in RAM, not on disk)
- [x] Common use cases: caching, session storage, **job queues**
- [x] How Docker runs Redis locally for this project
- **Obsidian note:** `Redis.md`
- **Link to:** `[[BullMQ]]`, `[[Docker]]`
- **In the codebase:** `docker-compose.yml`, `.env.example` (`REDIS_URL`)

### 3.6 — BullMQ (Job Queue)
- [x] What a job/message queue is (producer publishes tasks, consumer processes them)
- [x] Why use a queue instead of doing everything synchronously
- [x] BullMQ concepts: **Queue**, **Worker/Processor**, **Job** (with data payload)
- [x] The producer-consumer pattern in this project (API produces → Worker consumes)
- [x] Job types in Broseph: `create-group`, `send-message`, `accept-invite`, etc.
- **Obsidian note:** `BullMQ.md`
- **Link to:** `[[Redis]]`, `[[NestJS]]`, `[[Architecture Patterns]]`
- **In the codebase:** `backend/apps/worker/src/job.processor.ts`, `backend/apps/worker/src/handlers/`

### 3.7 — Swagger / OpenAPI
- [x] What OpenAPI/Swagger is (standard for describing REST APIs)
- [x] How NestJS auto-generates docs from decorators
- [x] How to access the docs locally (`http://localhost:3000/api/docs`)
- **Obsidian note:** `Swagger.md`
- **Link to:** `[[NestJS]]`, `[[REST APIs]]`
- **In the codebase:** `backend/apps/api/src/main.ts`

---

## Module 4: The Frontend — React & Data Fetching

### 4.1 — React Fundamentals ✅
- [x] Components, JSX, props, state
- [x] Hooks (`useState`, `useEffect`, `useContext`, `useCallback`, `useMemo`)
- [x] Component lifecycle and re-rendering
- [x] Context API for global state (e.g., `AuthContext`)
- [x] **Bonus:** JSX syntax differences from HTML (`className`, `onClick`, curly braces for expressions)
- [x] **Bonus:** Two kinds of props: data props (what to display) and callback props (what to do)
- [x] **Bonus:** Controlled components — React owns the state, not the DOM (`value` + `onChange`)
- [x] **Bonus:** Derived state — values computed from state/props on each render, no need for `useState`
- [x] **Bonus:** `useRef` as an escape hatch for direct DOM access (focus, file pickers, measurements)
- [x] **Bonus:** `useEffect` patterns: dependency-driven re-run, cleanup functions, empty array for mount-only
- [x] **Bonus:** Context's three steps: `createContext` → `Provider` wrapper → `useContext` consumer hook
- [x] **Bonus:** Rendering lists with `.map()` and why `key` is required (efficient reconciliation)
- [x] **Bonus:** Conditional rendering patterns: early return, ternary in JSX, `&&` short-circuit
- **Obsidian note:** `React.md`
- **Key files studied:** `ProfileIcon.tsx` (props, destructuring), `ReactionPills.tsx` (lists, conditional styling), `MessageInput.tsx` (useState, useEffect, useRef, controlled inputs, derived state), `AuthContext.tsx` (createContext, Provider, useContext, custom useAuth hook)

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

### 5.1 — Environment Variables
- [ ] What env vars are (configuration outside of code)
- [ ] Why secrets must never be committed to git
- [ ] `.env` vs `.env.example`
- [ ] How NestJS `@nestjs/config` reads them
- **Obsidian note:** `Environment Variables.md`
- **Link to:** `[[NestJS]]`, `[[Docker]]`
- **In the codebase:** `.env.example`, `backend/apps/api/src/app.module.ts`

### 5.2 — Git & Version Control
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

### Session 4 — 2026-02-12
- Completed **2.3 Row Level Security (RLS)**
- **2.3 RLS:** Covered deny-by-default model (`ENABLE ROW LEVEL SECURITY` makes table invisible until policies grant access). Walked through real policies on `groups`, `messages`, `group_members`, `group_invites`, and `profiles`. `USING` filters existing rows (pre-operation), `WITH CHECK` validates new row data (post-operation); SELECT/DELETE use only USING, INSERT uses only WITH CHECK, UPDATE uses both. `auth.uid()` extracts user ID from JWT inside PostgreSQL; `auth.role()` returns `'authenticated'` or `'service_role'`. Deep-dived into the recursion bug — `group_members` policy queried itself, causing infinite recursion; fix was `SECURITY DEFINER` helper functions (`is_group_member()`, `get_user_group_ids()`) that bypass RLS. Recursion is transitive — `profiles` policy querying `group_members` also hit the bug because `group_members` had the recursive policy. Covered unauthenticated access pattern on invites (no `auth.uid()` check so users can preview before login). Practiced writing policies: direct comparison (`sender_id = auth.uid()`) vs `EXISTS` subquery (when checking another table). Key insight: RLS is the deepest layer of defense — even if the API has a bug, the database cannot leak data.
- **Next step:** Module 2.4 — Database Migrations

### Session 5 — 2026-03-01
- Completed **2.4 Database Migrations**
- **2.4 Database Migrations:** Covered what migrations are (versioned SQL scripts replayed in order to build a database from scratch). Three categories: creation (new tables/extensions), bug fix/refactor (drop and re-create broken policies), and evolution/data migrations (add column, migrate data, drop old column). Naming convention is `YYYYMMDDHHMMSS_description.sql` — timestamp ensures ordering and uniqueness. `supabase db reset` destroys the DB, replays all migrations in order, then optionally runs seed data. Supabase tracks applied migrations in `supabase_migrations.schema_migrations` so production only runs new ones. Migrations are immutable and append-only — never edit, delete, or reorder applied migrations. This is enforced by consequences (tooling silently ignores edits) rather than hard guardrails. Exception: un-applied, un-pushed migrations can be safely edited. Key insight: migration files are the single source of truth for what the database looks like — if it's not in a migration, it doesn't exist.
- **Next step:** Module 2.5 — Supabase Realtime

### Session 6 — 2026-03-23
- Completed **2.5 Supabase Realtime** — Module 2 now fully complete
- **2.5 Supabase Realtime:** Started with the fundamental problem: HTTP is request-response, so a server can't proactively notify clients (only option is wasteful polling). WebSockets solve this — a persistent, full-duplex connection where either side can send at any time (analogy: texting vs phone call). Supabase Realtime has three layers: (1) PostgreSQL publications (`ALTER PUBLICATION supabase_realtime ADD TABLE`) opt tables into broadcasting changes, (2) Supabase Realtime server (Elixir app) subscribes to the publication, filters events, and pushes to connected clients over WebSocket, (3) Frontend creates named channels with `.channel()`, adds listeners with `.on('postgres_changes', ...)`, and activates with `.subscribe()`. Server-side filters (`filter: group_id=eq.${groupId}`) reduce traffic so clients only receive relevant events. Compared all four realtime hooks: `useRealtimeMessages` (INSERT only, filtered), `useRealtimeMembers` (`*` events, filtered), `useRealtimeReactions` (INSERT+DELETE, **unfiltered** because `message_reactions` has no `group_id` column), `useRealtimePolls` (3 tables on one channel, unfiltered). All hooks follow the "invalidate, don't use" pattern — event data is discarded, React Query cache is invalidated to trigger a fresh fetch. Reasons: consistency with existing fetch logic, completeness (events lack JOINed data), simplicity. Key insight: Realtime is a notification mechanism ("something changed"), not a data delivery mechanism — the actual data still comes through normal API fetches.
- **Next step:** Module 3.1 — NestJS Framework

### Session 7 — 2026-03-24
- Completed **3.1 NestJS Framework** — started Module 3
- **3.1 NestJS:** Built on existing notes covering Modules and Controllers. Added Services — classes marked `@Injectable()` that contain all business logic (controllers never touch the database). Studied `GroupsService` (validation, DB queries, data mapping) and `AuthService` (three injected dependencies: SupabaseService, ConfigService, EmailService). Dependency Injection deep dive: NestJS reads constructor type annotations and automatically provides singleton instances; contrast with Express where you manually wire everything. Module scoping: providers are **private by default** — the `exports` array controls what's visible to other modules. Re-declaring a provider in another module creates a duplicate instance (breaks singletons, breaks dependency chains, loses single source of truth). `isGlobal: true` is the escape hatch for universal services. Request lifecycle: Middleware (CORS, body parsing) → Guards (`SupabaseAuthGuard` validates JWT, attaches `user` and `accessToken` to request) → Interceptors (not used yet) → Pipes (`ValidationPipe` with whitelist/transform) → Route Handler. Custom parameter decorators (`@CurrentUser()`, `@AccessToken()`) use `createParamDecorator` to extract data that guards attached to the request. Decorator taxonomy: class decorators (`@Module`, `@Controller`, `@Injectable`), method decorators (`@Get`, `@HttpCode`, `@UseGuards`), parameter decorators (`@Body`, `@Param`, `@CurrentUser`). Key insight: decorators are metadata, not logic — NestJS reads them at startup to build its internal wiring map.
- **Next step:** Module 3.2 — DTOs & Validation

### Session 8 — 2026-03-24
- Completed **3.2 DTOs & Validation**
- **3.2 DTOs & Validation:** DTOs are classes that define the shape of data crossing boundaries — they're contracts, not business logic. `class-validator` decorators (`@IsString`, `@MaxLength`, `@IsArray`, `@IsUrl({ each: true })`) define rules as metadata; `ValidationPipe` in `main.ts` enforces them on every request. Three critical pipe options: `whitelist` (strips unknown fields), `forbidNonWhitelisted` (rejects unknown fields with 400), `transform` (converts raw JSON to class instances and handles type coercion). `class-transformer`'s `@Type(() => Number)` solves the query-params-are-always-strings problem. Three levels of DTO formality in the project: (1) class-validator DTO classes for external boundaries (client → API), (2) plain TypeScript interfaces for internal boundaries (API → Worker via Redis), (3) Zod schemas exist but are dead code — exported but never imported anywhere. Request DTOs have validation decorators; Response DTOs only have `@ApiProperty` for Swagger docs. `ParseUUIDPipe` validates URL params inline. Shared `LIMITS` constant (`as const` for literal types) ensures frontend, backend, and database all enforce the same constraints. Key insight: the `whitelist` option is a security feature — even if an attacker crafts a request with extra fields like `isAdmin: true`, those fields get stripped before your code ever sees them.
- **Next step:** Module 3.3 — Authentication & JWTs

### Session 9 — 2026-03-24
- Completed **3.3 Authentication & JWTs**
- **3.3 Auth & JWTs:** JWT has three parts: header (algorithm), payload (claims like `sub`, `role`, `exp`), signature (cryptographic hash using a secret key only Supabase knows). Signature is a hash (one-way), not encryption (reversible) — you can't forge a token without the secret. The `sub` claim is the same value `auth.uid()` reads in RLS policies — the JWT is the thread connecting frontend auth to database security. Magic link flow: frontend POSTs to `/api/auth/magic-link` (unauthenticated endpoint), backend uses admin client to `generateLink()` then sends a custom branded email, user clicks link → Supabase verifies → redirects to `/auth/callback` with tokens in the **URL hash fragment** (`#access_token=...`). Hash fragment chosen because data after `#` never leaves the browser (not sent in requests, logs, proxies, or `Referer` headers), unlike query strings. `AuthCallbackPage` waits for Supabase client to parse the hash, then checks session — also handles pending invite acceptance and onboarding for new users. `SupabaseAuthGuard` extracts `Bearer` token from header, calls `validateToken()` (which calls `adminClient.auth.getUser(token)` to verify signature and expiry), then attaches **both** `user` and `accessToken` to the request. Raw token is kept because services need it for `getClientForUser(accessToken)` to create RLS-scoped database clients — the user object says *who* they are, the token lets you *act as* them. `AuthContext` does two things on mount: gets initial session and subscribes to `onAuthStateChange` for token refresh events. Without the refresh listener, the app would enter a broken state after ~1hr (expired token, 401 errors, but React still thinks user is logged in). Key insight: the JWT is used at every layer — issued by Supabase Auth, stored by the browser, sent on every request, validated by the guard, and interpreted by PostgreSQL RLS via `auth.uid()`.
- **Next step:** Module 3.4 — Redis

### Session 10 — 2026-03-30
- Completed **Understanding Check — Life Cycle of a Poll**
- Traced poll creation: modal (two-screen UI) → `useCreatePoll` mutation (no optimistic update — can't fake 3-table creation) → controller applies setting defaults, queues job (202) → worker inserts into messages/polls/poll_options sequentially, optionally schedules delayed close job with predictable `jobId` for cancellation
- Traced vote casting: `PollCard` → `useCastVote` with optimistic update (`voteCount + (isNowVoted ? 1 : 0) - (wasVoted ? 1 : 0)` handles all four cases) → synchronous API (not queued — simple operation, needs immediate confirmation) → delete-then-insert pattern on `poll_votes` → `checkAllVoted()` trigger
- Traced three close paths: creator manual (synchronous, cancels delayed job), time limit (delayed BullMQ job with idempotency guard via read-then-check), all-voted (database-level race condition guard via `.eq('closed', false)` on the UPDATE)
- Learned: modals (UI overlays), `useCallback` (memoized function references to prevent child re-renders), message enrichment pattern (`batchFetchPollData` piggybacks on messages fetch), `poll_options` as separate table (each option is its own entity referenced by vote rows), deliberate tie handling (return `null`, let users see tied counts)
- Key contrasts with messages: polls use sync endpoints for interactions (not just async creation), optimistic updates only on voting (not creation), 3-table unfiltered Realtime (vs 1-table filtered), delayed job scheduling is a new BullMQ pattern

---

## Understanding Check — Life Cycle of a Message

> **Purpose:** Practice explaining how the system works end-to-end, as preparation for professor meetings. This traces a message from the moment a user hits "send" through every layer of the stack until it appears on other users' screens.

### The Exercise

Trace the full journey of a message through the system:

**Frontend → API → Redis/BullMQ → Worker → Database → Realtime → Frontend**

Key things to be able to explain at each step:
1. What triggers the request? (user action, React hook, mutation)
2. How does it reach the API? (HTTP method, endpoint, auth)
3. What does the API do with it? (validate, queue, respond)
4. How does the job get processed? (BullMQ, Worker, handler)
5. How does the data get persisted? (Supabase, RLS, which client?)
6. How do other users see it? (Realtime, React Query cache update)

### Session Notes — 2026-03-23

Traced the full life cycle of a message end-to-end:

**1. Frontend — User sends (MessageInput.tsx → GroupChatPage.tsx → useSendMessage.ts)**
- `MessageInput` component manages text state, calls `onSend` (a **prop**) on submit
- `GroupChatPage` passes `handleSendMessage` as that prop, which calls `sendMessage.mutate()`
- `useSendMessage` is a custom hook wrapping React Query's `useMutation`:
  - **Before the request (`onMutate`):** creates an optimistic message with a temp ID, injects it into the React Query cache so it appears instantly
  - **Mutation function:** uploads images to Supabase Storage first (if any), then POSTs JSON to `/api/groups/:groupId/messages`
  - **On error:** rolls back cache to the snapshot
  - **On settled:** invalidates cache so a fresh fetch replaces the optimistic message with the real one

**2. API Controller (messages.controller.ts)**
- `@Controller('api/groups/:groupId/messages')` routes the POST here
- `@UseGuards(SupabaseAuthGuard)` validates the JWT; `@CurrentUser()` and `@AccessToken()` are **custom decorators** (not built-in)
- Validates group membership, generates a job ID, adds a `'send-message'` job to the `broseph-jobs` BullMQ queue
- Returns **202 Accepted** immediately — work is queued, not done
- `@InjectQueue('broseph-jobs')` is **dependency injection** — the module registers the queue (`BullModule.registerQueue`), the controller asks for it

**3. Worker — Job Processor (job.processor.ts)**
- Separate NestJS app, same Redis, watching `broseph-jobs` queue
- `@Processor('broseph-jobs')` is the mirror of `@InjectQueue` — API produces, Worker consumes
- `process(job)` is called automatically by BullMQ; switch statement routes by `job.name` to the correct handler
- This is our routing logic extending BullMQ's `WorkerHost`, not BullMQ itself

**4. Worker — Message Handler (messages.handler.ts)**
- Uses `getAdminClient()` (service-role, bypasses RLS) since the worker is a trusted backend process
- Defense in depth: re-validates membership and message content even though API already checked
- Inserts into `messages` table; `.select('id')` after `.insert()` is like SQL `RETURNING id` — gets back the UUID that PostgreSQL generated
- `.single()` tells Supabase to return an object instead of an array

**5. Realtime — Other users receive it (useRealtimeMessages.ts)**
- `useEffect` opens a Supabase Realtime WebSocket channel filtered to `INSERT` events on `messages` where `group_id` matches
- PostgreSQL `LISTEN/NOTIFY` detects the insert → Supabase Realtime pushes to all connected browsers
- The callback doesn't use the event data — just calls `queryClient.invalidateQueries()` to trigger a fresh GET
- Cleanup function unsubscribes when user leaves the page

## Understanding Check — Life Cycle of a Poll

> **Purpose:** Same exercise as the message lifecycle, but for polls — a more complex feature that introduces **delayed BullMQ jobs**, **optimistic updates**, **multi-table realtime subscriptions**, and **synchronous vs. asynchronous API patterns**. Being able to contrast polls with messages shows you understand *why* different features use different patterns.

### The Exercise

Trace two journeys through the system:

**A. Poll creation:** User creates a poll → Frontend → API → BullMQ → Worker → Database (3 tables) → Realtime → other users see it

**B. Vote casting:** User votes → Frontend (optimistic update) → API (synchronous) → Database → Realtime → other users see updated results

Key things to be able to explain at each step:
1. Why is poll creation async (queued) but voting synchronous (direct)? What's the tradeoff?
2. How does a single poll touch THREE database tables (messages, polls, poll_options) during creation?
3. What are optimistic updates, and why are they used for voting but NOT for poll creation?
4. How does the frontend learn about poll changes made by other users (multi-table realtime)?
5. What is a delayed BullMQ job, and how does it enable time-based auto-close?
6. What are the three ways a poll can close, and which layers of the stack trigger each one?

### Session Notes — 2026-03-30

Traced the full life cycle of a poll end-to-end:

#### Part A — Poll Creation (Async, Queued)

**1. Frontend — User creates a poll (MessageInput.tsx → CreatePollModal.tsx → useCreatePoll.ts)**
- `MessageInput` has a "+" button that opens a popover; selecting "Poll" calls `onCreatePoll` prop
- `GroupChatPage` passes `setIsPollModalOpen(true)` as that prop — a state update that makes `CreatePollModal` visible (a **modal** is a UI overlay/dialog that appears on top of the page)
- `CreatePollModal` is a two-screen modal: screen 1 collects title + options (min 2, max 20), screen 2 collects settings (allowMultiple, showVotes, allowAddOptions, declareWinnerOnAllVoted, closesAt)
- On submit, calls `createPoll.mutate()` — a `useMutation` hook that POSTs to `/api/groups/:groupId/polls`
- **Key difference from messages:** NO `onMutate` optimistic update. A poll requires the server to create rows in three tables and generate real UUIDs — the frontend can't meaningfully fake that. Only invalidates on `onSettled`
- Response is `{ jobId, status: 'queued' }` — **202 Accepted**, poll doesn't exist yet

**2. API Controller (polls.controller.ts)**
- `@Controller('api/groups/:groupId/polls')` routes the POST; `@UseGuards(SupabaseAuthGuard)` validates JWT
- Validates group membership by reusing `messagesService.validateMembership()` (imported via module system, not duplicated)
- Applies settings defaults using `??` (nullish coalescing): `allowMultiple ?? false`, `showVotes ?? true`, etc.
- Queues a `'create-poll'` job on BullMQ with a generated job ID, returns 202

**3. Worker — Job Processor (job.processor.ts)**
- `@Processor('broseph-jobs')` switch statement routes `'create-poll'` to `pollsHandler.handleCreatePoll(job)`
- Also routes `'close-poll'` — a new job type that doesn't exist for messages

**4. Worker — Polls Handler (polls.handler.ts) — Four steps**
- Uses `getAdminClient()` (service-role, bypasses RLS); re-validates membership (defense in depth)
- **Step 1:** Insert into `messages` with `type: 'poll'`, `content: title` — the poll IS a message, making it appear in the chat stream
- **Step 2:** Insert into `polls` with `message_id` linking back to step 1, plus all settings
- **Step 3:** Bulk-insert into `poll_options` — array `.map()` gives each option a `position` (array index) and `added_by`
- **Step 4 (conditional):** If `closesAt` is set, schedule a delayed BullMQ job: `this.jobQueue.add('close-poll', { pollId, reason: 'time_limit' }, { delay, jobId: 'close-poll-${poll.id}' })`. The `delay` option makes the job invisible to workers until it expires. The predictable `jobId` lets the job be **cancelled by ID** if the poll closes early

**5. Realtime — Other users see the poll (useRealtimePolls.ts)**
- `useRealtimePolls(id)` is called in `GroupChatPage` alongside the other Realtime hooks
- Subscribes to **THREE tables** on one channel: `poll_votes` (all events), `polls` (all events), `poll_options` (INSERT only)
- **Key difference from messages:** no server-side `group_id` filter (because `poll_votes` and `poll_options` don't have that column) — receives events for ALL polls globally, but the "invalidate, don't use" pattern makes this safe (irrelevant events just cause a no-op refetch)

**6. Message enrichment — How poll data gets attached (messages.service.ts:203-210)**
- `MessagesService.getMessages()` filters messages with `type === 'poll'`, collects their IDs
- Calls `pollsService.batchFetchPollData(messageIds, userId)` — fetches polls, options, and votes in parallel with `Promise.all`, builds `PollDto` objects with vote counts, voter profiles, and `hasVoted` flags
- The enriched `pollData` is attached to each message DTO — polls piggyback on the existing messages fetch, not a separate endpoint
- `MessageList` renders `PollCard` instead of a regular message bubble when `message.type === 'poll'`

#### Part B — Vote Casting (Synchronous, with Optimistic Updates)

**1. Frontend — User votes (PollCard.tsx → GroupChatPage.tsx → useCastVote.ts)**
- `PollCard` calls `onVote(pollId, optionIds)` → `MessageList` passes it through → `GroupChatPage` wires it to `handlePollVote` (wrapped in `useCallback` for memoization — prevents unnecessary child re-renders by keeping the same function reference across renders)
- `handlePollVote` calls `castVote.mutate()`
- `useCastVote` has a full **optimistic update** cycle in `onMutate`:
  - `cancelQueries` — cancels in-flight fetches so stale data doesn't overwrite the optimistic state
  - `getQueryData` — snapshots current cache as a rollback point for `onError`
  - `setQueryData` — walks through all pages of the infinite query, finds the matching poll, and for each option calculates: `voteCount + (isNowVoted ? 1 : 0) - (wasVoted ? 1 : 0)` — handles all four cases (new vote: +1, removed vote: -1, unchanged: +0, swapped: +1-1=0) in one expression
- `onError` restores the snapshot; `onSettled` invalidates to fetch real server state
- **Why optimistic works here but not for creation:** voting modifies existing data with known IDs — the frontend can predict the outcome. Creation produces new data with server-generated IDs across three tables

**2. API — Synchronous, not queued (polls.controller.ts → polls.service.ts)**
- POST to `/api/groups/:groupId/polls/:pollId/vote` calls `PollsService.castVote()` directly
- **Why synchronous?** Voting is a simple, fast, single-table operation and the user needs immediate confirmation (the optimistic update is just a preview — the real response must confirm or trigger rollback quickly)
- Service logic:
  - Validates poll is not closed, validates option count matches `allow_multiple` setting, validates option IDs belong to this poll
  - **Delete-then-insert pattern:** deletes ALL existing votes by this user on this poll, then inserts new votes — simpler than diffing old vs. new (two operations regardless of what changed, same end result)
  - If `declare_winner_on_all_voted` is enabled, calls `checkAllVoted()` (see Part C)

**3. Realtime — Other users see updated votes**
- `poll_votes` table receives DELETE + INSERT → `useRealtimePolls` fires (subscribed to `poll_votes` with `event: '*'`) → invalidates messages → refetch with updated vote counts via `batchFetchPollData`
- Note: the `messages` table row doesn't change when someone votes — it's the `poll_votes` subscription that detects this, not `useRealtimeMessages`

#### Part C — Three Ways a Poll Can Close

**1. Creator closes manually** — `PollsService.closePoll()` (synchronous, API layer)
- `PollCard` shows a close button to the creator → `onClose` → `handlePollClose` → `closePoll.mutate()`
- Service verifies `poll.creator_id === userId` (throws `ForbiddenException` otherwise)
- Calls `determineWinner(pollId)` then updates with `closed: true, closed_reason: 'creator'`
- Cancels the delayed close job via `this.jobQueue.remove('close-poll-${pollId}')` — wrapped in try/catch because the job might not exist

**2. Time limit expires** — `PollsHandler.handleClosePoll()` (async, Worker layer)
- The delayed BullMQ job from creation step 4 becomes processable after the delay
- **Idempotency guard:** checks `poll.closed` before proceeding — the creator might have closed it manually first. If already closed, logs and returns
- If still open: determines winner, updates with `closed_reason: 'time_limit'`

**3. All members voted** — `PollsService.checkAllVoted()` (triggered during vote casting)
- Counts group members (`{ count: 'exact', head: true }` — returns just the count, no rows), counts unique voters using a `Set` for deduplication
- If `uniqueVoters.size >= memberCount`: auto-closes with `closed_reason: 'all_voted'`
- **Race condition guard:** the UPDATE includes `.eq('closed', false)` — if two simultaneous votes both trigger this, only one matches the WHERE clause. This is a database-level guard, not an application-level read-then-check, because concurrent requests can sneak between a read and a write
- Also cancels the delayed close job (same try/catch pattern)

**Winner determination (`determineWinner`):** Fetches all vote rows, accumulates counts per option using a `Map` (same `option_id` appears multiple times for multiple voters — the `|| 0` initializes the count, then increments). Tracks the max count and `tieCount`. If exactly one option has the highest count, it wins. If tied (multiple options share max), returns `null` — the frontend simply doesn't highlight a winner, letting users see the tied counts and interpret it themselves.

### Key Contrasts: Polls vs. Messages

| Aspect | Messages | Polls |
|--------|----------|-------|
| **Creation** | Async (BullMQ), 1 table insert | Async (BullMQ), 3 table inserts + optional delayed job |
| **User interactions after send** | None | Synchronous: voting, adding options, closing |
| **Optimistic updates** | On send (fake message in cache) | On vote only (adjust counts), NOT on creation |
| **Realtime subscriptions** | 1 table (`messages`), filtered by group_id | 3 tables (`polls`, `poll_options`, `poll_votes`), unfiltered |
| **Delayed jobs** | None | `close-poll` job with BullMQ `delay` option |
| **New patterns** | — | Delete-then-insert voting, multi-reason close, winner determination with tie handling, race condition guard on auto-close |

### Session 11 — 2026-04-07
- Completed **4.1 React Fundamentals** — started Module 4
- **4.1 React:** Core idea: UI is a function of state (`UI = f(state)`). When state changes, React re-runs the component function, compares old and new output (reconciliation), and applies minimal DOM updates. Studied three real components at increasing complexity:
  - **`ProfileIcon`** — simplest case: a pure function of props. Two kinds of props: data (`profile`) and callbacks (`onPress`). Component doesn't know or care what `onPress` does — the parent decides behavior, enabling reusability. TypeScript interface defines the contract.
  - **`ReactionPills`** — rendering lists with `.map()` and `key` (required for efficient reconciliation). Conditional rendering: early return (`return null`), ternary in JSX for style toggling. Callback props again: `onToggle(emoji)` passes data back to parent.
  - **`MessageInput`** — full state management: five `useState` calls for content, images, popover, emoji picker. Controlled component pattern (`value={content}` + `onChange={setContent}`) means React owns the state. Derived state (`isOverLimit`, `canSend`) computed on every render from existing state — no need for separate `useState`. Three `useRef`s for direct DOM access (focus, file picker trigger, click-outside detection). Four `useEffect` patterns: dependency-driven resize (`[content]`), conditional setup/cleanup for outside-click listener (`[isEmojiPickerOpen]`), focus on reply context change (`[replyContext]`), mount-only cleanup for blob URLs (`[]`).
  - **`AuthContext`** — Context API solves prop drilling (passing state through intermediate components that don't use it). Three steps: `createContext` (channel), `Provider` (wraps app, publishes value), `useContext` (any descendant subscribes). Custom `useAuth()` hook wraps `useContext` with an error check for developer safety. `useEffect` with empty deps gets initial session and subscribes to auth changes; cleanup unsubscribes.
- Covered `useCallback`/`useMemo` as performance optimizations (memoize function references / computed values to prevent unnecessary child re-renders) — already encountered `useCallback` in poll lifecycle.
- **Key insight:** The component function runs top-to-bottom on every render. State changes trigger re-renders. Effects run after render. The core loop: user action → state change → re-render → DOM update → effects run.
- **Next step:** Module 4.2 — Vite

---

*This is a living document. We'll update it as you progress through the study plan.*
