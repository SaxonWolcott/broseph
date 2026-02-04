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
| `milestones/` | Completed milestone documentation |
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

## Plan Mode Workflow

**Every plan MUST include a task decomposition.** When writing a plan to `~/.claude/plans/`:

1. Write the plan overview and approach
2. **Always include a "## Tasks" section** that breaks down the work into discrete steps
3. Include "Document as milestone XXX" as the final task (if significant work)
4. On execution (even after context clear), read the plan and create native tasks from the Tasks section

### Plan File Format

```markdown
# Plan: Feature Name

## Overview
What we're building and why.

## Approach
How we'll implement it.

## Tasks
- [ ] 1. First discrete piece of work
- [ ] 2. Second piece of work
- [ ] 3. Third piece of work
- [ ] 4. Document as milestone XXX (if applicable)
```

### Milestone Documentation

Significant completed work is documented in `/milestones/XXX-name.md` files:
- Use `/milestone` skill after completing significant work
- Milestones are lightweight retrospective docs
- Track progress in `/reference/ROADMAP.md`

**Milestone numbering:**
- Milestones are numbered sequentially: 001, 002, 003...
- Check `/milestones/` directory for the highest existing number

**Simplified milestone format:**
```markdown
# Milestone XXX: Name

**Completed:** YYYY-MM-DD

## Summary
2-3 sentences on what was accomplished.

## Key Changes
- `path/to/file.ts` - what changed

## Decisions
- Chose X over Y because Z (if significant)
```

## Gotchas

- Supabase local uses port 54321 (API) and 54323 (Studio)
- Use `;` not `&&` to chain PowerShell commands
- Frontend is mobile-optimized - test on small viewports
