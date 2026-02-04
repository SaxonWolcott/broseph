# Task 002: Initial Auth Setup

## Overview

Implemented Supabase Auth with magic link (passwordless email) authentication. The system is designed to support future addition of phone OTP and Apple/Google sign-in without creating duplicate users.

## Core Design Decisions

### 1. Canonical User Identity

The stable user identifier is `auth.users.id` (UUID), stored in `public.profiles.id`:

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ...
);
```

**Why this matters:**
- One person = one UUID, regardless of auth method
- Email/phone/provider are credentials, not identity
- Future auth methods link to the same user
- No duplication when adding new login methods

### 2. What's NOT in the profiles table

- `email` - Comes from `auth.users`, not stored in profiles
- `phone` - Same reason
- `provider` - Managed by Supabase auth, not app tables

**Future:** When we need multiple verified emails/phones per user (e.g., "add recovery email"), we'll create separate `user_emails` / `user_phones` tables referencing `profiles.id`.

### 3. Auth Flow Architecture

```
Frontend (React + Supabase ANON key)    Backend (NestJS + SERVICE ROLE)
    │                                           │
    │  1. User enters email                     │
    │  2. POST /api/auth/magic-link ───────────▶│
    │                                           │── signInWithOtp()
    │                                           │
    │  3. User clicks link in email             │
    │  4. Supabase redirects with tokens        │
    │  5. onAuthStateChange detects session     │
    │                                           │
    │  6. GET /api/auth/me (Bearer token) ─────▶│
    │                                           │── validateToken()
    │  7. Profile returned                      │── SELECT profile (RLS)
```

## Files Created/Modified

### Database Migration

- `supabase/migrations/20240102000000_profiles.sql` - Profiles table, RLS, auto-create trigger

### Backend Shared Library

- `backend/libs/shared/src/supabase/supabase.module.ts` - Global Supabase module
- `backend/libs/shared/src/supabase/supabase.service.ts` - Admin + user client factory
- `backend/libs/shared/src/supabase/index.ts` - Exports
- `backend/libs/shared/src/dto/auth.dto.ts` - DTOs with class-validator
- `backend/libs/shared/src/schemas/auth.schema.ts` - Zod schemas
- `backend/libs/shared/src/index.ts` - Updated exports

### Backend Auth Module

- `backend/apps/api/src/auth/auth.module.ts` - Auth feature module
- `backend/apps/api/src/auth/auth.controller.ts` - Endpoints
- `backend/apps/api/src/auth/auth.service.ts` - Business logic
- `backend/apps/api/src/auth/guards/supabase-auth.guard.ts` - JWT guard
- `backend/apps/api/src/auth/decorators/current-user.decorator.ts` - @CurrentUser, @AccessToken
- `backend/apps/api/src/app.module.ts` - Added SupabaseModule, AuthModule

### Frontend

- `frontend/src/lib/supabase.ts` - Supabase client singleton
- `frontend/src/contexts/AuthContext.tsx` - Auth state provider
- `frontend/src/types/auth.ts` - TypeScript types
- `frontend/src/hooks/useMagicLink.ts` - Magic link mutation
- `frontend/src/hooks/useMe.ts` - Profile query + onboard mutation
- `frontend/src/pages/SignInPage.tsx` - Sign-in form
- `frontend/src/pages/AuthCallbackPage.tsx` - Magic link callback
- `frontend/src/components/ProtectedRoute.tsx` - Route guard
- `frontend/src/App.tsx` - Added routes
- `frontend/src/main.tsx` - Added AuthProvider

### Environment

- `.env` - Added SITE_URL
- `.env.example` - Added SITE_URL
- `frontend/.env` - Created with VITE_SUPABASE_* vars
- `frontend/.env.example` - Created

## API Endpoints

### POST /api/auth/magic-link

Send magic link to email (no auth required).

```typescript
// Request
{ email: string, redirectTo?: string }

// Response
{ success: true, message: "Magic link sent to email" }
```

### GET /api/auth/me

Get current user profile (auth required).

```typescript
// Headers: Authorization: Bearer <access_token>

// Response
{
  id: string,           // UUID = auth.users.id
  displayName: string | null,
  handle: string | null,
  avatarUrl: string | null,
  email: string | null, // From auth.users, not stored in profiles
  createdAt: string,
  updatedAt: string
}
```

### POST /api/auth/onboard

Update profile (auth required).

```typescript
// Request
{ displayName?: string, handle?: string }

// Response: ProfileDto (same as /me)
```

## Running Locally

### Prerequisites

1. Docker (for Supabase local)
2. Node.js 20+
3. pnpm

### Setup Steps

```powershell
# 1. Start Supabase local
supabase start

# 2. Apply migrations (reset will run migrations + seed)
supabase db reset

# 3. Copy env vars (if not done already)
# The actual keys are in .env, which should match supabase start output

# 4. Start all services
pnpm dev
```

### Testing Magic Link Flow

1. Open http://localhost:5173
2. You should be redirected to `/signin`
3. Enter any email (e.g., `test@example.com`)
4. Click "Send magic link"
5. Open Inbucket (Supabase's local email catcher):
   - URL: http://localhost:54324 (check `supabase status` for exact port)
6. Find the email and click the magic link
7. You should be redirected to `/auth/callback` then to `/`
8. The profile is automatically created by the database trigger

### Checking Supabase Studio

1. Open http://localhost:54323
2. Navigate to **Table Editor** → **profiles**
3. You should see your profile row with matching `id` from `auth.users`

## RLS Policies

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Service role has full access (backend admin operations)
CREATE POLICY "Service role can manage profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');
```

## Future: Adding Phone/Apple/Google

When adding additional auth methods:

### 1. Enable Provider in Supabase

```toml
# supabase/config.toml
[auth.external.apple]
enabled = true
client_id = "..."
secret = "..."
```

### 2. Account Linking Flow

```
User is signed in with email
  │
  ▼
Clicks "Add phone number"
  │
  ▼
Enters phone, receives OTP
  │
  ▼
Supabase links phone identity to existing auth.users row
  │
  ▼
profiles.id remains unchanged (same UUID)
```

### 3. What NOT to Do

- Don't create a new profiles row for each auth method
- Don't use email/phone as foreign keys
- Don't assume "every user has email" (some may sign up with phone only)
- Don't store provider name in profiles table

## Configuring Real SMTP (Production)

For production, configure SMTP in Supabase Dashboard or via environment:

```toml
# supabase/config.toml (or Dashboard settings)
[auth.smtp]
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "your-api-key"
sender_name = "Broseph"
admin_email = "admin@yourdomain.com"
```

Then update the email templates in Supabase Dashboard → Auth → Email Templates.
