# Dev Notes - Getting Broseph Up and Running

## Prerequisites

- Node.js 20+
- Docker Desktop (for Redis and Supabase)
- pnpm (`npm install -g pnpm`)

## Setup Steps

### 1. Install Dependencies

```powershell
pnpm install
```

### 2. Start Infrastructure

Start Docker Desktop first, then run these in separate terminals:

```powershell
# Start Redis (required for BullMQ job queue)
docker-compose up -d

# Start local Supabase (PostgreSQL + Auth)
supabase start
```

After `supabase start`, you'll see output with your local credentials. Note the `API URL` and `service_role key`.

### 3. Configure Environment

Copy the example env file and fill in your local values:

```powershell
copy .env.example .env
```

Update `.env` with:
- `SUPABASE_URL=http://localhost:54321`
- `SUPABASE_SERVICE_KEY=<service_role key from supabase start>`
- `REDIS_URL=redis://localhost:6379`

### 4. Reset Database (Optional but Recommended)

This runs all migrations and seeds the database:

```powershell
supabase db reset
```

### 5. Start the App

Run all services together:

```powershell
pnpm dev
```

Or run them separately in different terminals:

```powershell
pnpm dev:api      # Backend API on port 3000
pnpm dev:worker   # Background job processor
pnpm dev:web      # Frontend on port 5173
```

## Accessing the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Supabase Studio (DB UI) | http://localhost:54323 |

## Useful Commands

```powershell
# Check TypeScript types
pnpm typecheck

# Run tests
pnpm test

# Run linting
pnpm lint

# View Supabase database UI
supabase studio

# Stop all infrastructure
docker-compose down
supabase stop
```

## Troubleshooting

### Port already in use
Kill the process using the port or change the port in the respective config.

### Supabase won't start
Make sure Docker Desktop is running first.

### Redis connection errors
Verify Docker is running: `docker ps` should show the Redis container.

---

*Last updated: January 2025*
