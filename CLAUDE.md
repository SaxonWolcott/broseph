# Claude Code Context - Broseph

This file provides context for Claude Code sessions working on this project.

## Environment

- **Shell**: PowerShell (Windows) - use `;` not `&&` to chain commands
- **Package Manager**: pnpm (not npm/yarn) - installed via `npm install -g pnpm`
- **Node.js**: 20+

**PowerShell command syntax:**
```powershell
# Chain commands with semicolon
pnpm install; pnpm dev

# Or run separately
pnpm install
pnpm dev
```

**pnpm commands:**
```powershell
pnpm install              # Install all dependencies
pnpm dev                  # Start all services
pnpm dev:api              # Start API only
pnpm dev:worker           # Start worker only
pnpm dev:web              # Start frontend only
pnpm add <pkg>            # Add package to root
pnpm --filter backend add <pkg>    # Add to backend workspace
pnpm --filter frontend add <pkg>   # Add to frontend workspace
```

## Project Overview

**Broseph** is a group messaging app designed to help friends stay in touch. The system:

1. **Connects** groups of friends through real-time messaging
2. **Prompts** users with AI-generated conversation starters
3. **Encourages** engagement with smart notifications and reminders

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   API App   │────▶│   BullMQ    │
│   (React)   │     │  (NestJS)   │     │   (Redis)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                           │                    │
                    ┌──────▼──────┐      ┌──────▼──────┐
                    │  Supabase   │◀─────│   Worker    │
                    │ (PostgreSQL)│      │  (NestJS)   │
                    └─────────────┘      └─────────────┘
```

- **API App** (`backend/apps/api/`): HTTP API - receives requests, publishes to BullMQ
- **Worker App** (`backend/apps/worker/`): Processes background jobs from the queue
- **Shared Libs** (`backend/libs/`): Shared DTOs, Zod schemas, utilities
- **Frontend** (`frontend/`): React + HeroUI for the user interface (mobile-optimized)
- **Database** (`supabase/`): PostgreSQL via Supabase with migrations

## Key Directories

| Path | Purpose |
|------|---------|
| `backend/apps/api/` | NestJS HTTP API |
| `backend/apps/worker/` | BullMQ job processors |
| `backend/libs/shared/` | DTOs, Zod schemas, utilities |
| `frontend/src/` | React app with pages, hooks, components |
| `supabase/migrations/` | PostgreSQL schema migrations |
| `tasks/` | Completed task documentation |
| `reference/` | Reference materials |

## Important Patterns

### NestJS Monorepo
- Apps in `backend/apps/`, libs in `backend/libs/`
- Path aliases: `@app/shared`
- Configured in `backend/tsconfig.json` and `backend/nest-cli.json`

### BullMQ Job Processing
- Queue name: `broseph-jobs`
- Jobs published by API, consumed by Worker

### Authentication
- Supabase Auth with magic link / email OTP
- JWT tokens validated via Supabase
- User context via `@CurrentUser()` decorator

### Database
- Supabase PostgreSQL with Row Level Security
- Key tables: `profiles` (linked to auth.users)
- Never edit DB directly; always use migrations

## Development Commands

```bash
pnpm dev           # Start all services
pnpm dev:api       # API only (port 3000)
pnpm dev:worker    # Worker only
pnpm dev:web       # Frontend only (port 5173)
pnpm test          # Run tests
pnpm typecheck     # TypeScript check
pnpm lint          # ESLint
```

## Infrastructure

```bash
docker-compose up -d    # Start Redis
supabase start          # Start local Supabase
supabase db reset       # Reset DB with migrations + seed
supabase studio         # Open DB UI (port 54323)
```

## Environment Variables

Required in `.env`:
- `SUPABASE_URL` - Database URL (local: `http://localhost:54321`)
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `REDIS_URL` - Redis connection (local: `redis://localhost:6379`)

**Rule**: Any environment variable referenced in code MUST be added to `.env.example` with a sensible default or placeholder value.

## File Naming Conventions

- DTOs: `*.dto.ts` (e.g., `create-message.dto.ts`)
- Schemas: `*.schema.ts` (e.g., `message.schema.ts`)
- Services: `*.service.ts`
- Controllers: `*.controller.ts`
- Processors: `*.processor.ts`
- Tests: `*.spec.ts`
- React hooks: `use*.ts` (e.g., `useMessages.ts`)
- React pages: `*Page.tsx`

## Specialized Subagents

This project includes specialized subagents in `.claude/agents/` for different domains:

| Agent | Purpose |
|-------|---------|
| `api-designer` | Design API contracts BEFORE implementation |
| `nestjs-specialist` | HTTP API controllers, services, DTOs |
| `bullmq-worker` | Background job processors |
| `database-migrator` | Supabase migrations (never edit DB manually) |
| `react-data-specialist` | React Query hooks and data fetching |
| `heroui-designer` | HeroUI components (mobile-first, dark mode) |
| `frontend-tester` | React component tests with Vitest |
| `backend-tester` | NestJS tests with Jest/Supertest |
| `typescript-validator` | Type checking across workspaces |
| `code-reviewer` | Code quality and security review |
| `task-documenter` | Document completed work in `/tasks/` |

## Task Workflow

When the user says **"Let's start a new task"** or similar at the beginning of a conversation:

1. **Create a task file immediately** by spawning the `task-documenter` agent with:
   - Task number (next sequential number in `/tasks/`)
   - Brief description of the task from the user's request
   - Initial status: "In Progress"

2. **Update the task file throughout the session** as you:
   - Complete major steps
   - Make implementation decisions
   - Encounter and resolve issues
   - Finish the task

3. **At the end of the task**, ensure the task file includes:
   - All files created/modified
   - Key implementation details
   - Acceptance criteria verification
   - Lessons learned

**Example:**
```
User: "Let's start a new task. I want to add push notifications."
Assistant: [Spawns task-documenter to create tasks/006-push-notifications.md]
           [Proceeds with implementation]
           [Updates task file as work progresses]
```

The task file serves as documentation for future sessions and helps maintain project history.

## Gotchas

- Supabase local uses port 54321 (API) and 54323 (Studio)
- Use `;` not `&&` to chain PowerShell commands
- Frontend is mobile-optimized - test on small viewports
