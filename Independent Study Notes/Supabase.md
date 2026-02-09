Supabase is an open-source BaaS (Backend-as-a-Service) platform built on top of [[PostgreSQL]]. It is an alternative to Firebase which uses Google's NoSQL database. Supabase wraps standard Postgres with a set of services:

| Service        | What is does                                           | How it's used in Project           |
| -------------- | ------------------------------------------------------ | ---------------------------------- |
| Databse        | Postgres with REST API auto-generated from schema      | Core data store                    |
| Auth           | User signup, login, magic links, OAuth, [[JWT]] tokens | All authentication                 |
| Realtime       | [[WebSocket]] subscriptions to database changes        | Live messages                      |
| Storage        | File storage (images, documents) with access policies  | Avatar uploads                     |
| Edge Functions | Serverless functions (like AWS Lamda)                  | Not used — uses [[NestJS]] instead |
The idea is that Supabase gives you a full BaaS but you're not locked into using it since it's all just Postgres. If you want to leave, can take your database with you

### Local Development with Supabase CLI 
To run Supabase locally, we can use the CLI (Command-Line Interface) to run the entire stack locally in [[Docker]] containers. Let's look at the config file:

supabase/config.toml:
```
project_id = "broseph"

  [api]
  enabled = true
  port = 54321          # ← The Supabase API lives here
  // other params...

  [db]
  port = 54322          # ← Raw Postgres connection
  // other params...

  [studio]
  port = 54323          # ← Web UI for browsing your database
  // other params...

  [inbucket]
  port = 54324          # ← Fake email inbox (catches magic links locally)
  smtp_port = 54325     # ← SMTP server for sending test emails
  // other params...
```

Here are a few key CLI commands:
- `supabase start` -> boots full local stack
- `supabase stop` -> shuts it down
- `supabase db reset` -> wipes database and replays all migrations
- `supabase studio` -> opens web UI


### Anon Key vs Service Role Key
The **anon key** is a public key intended for frontend/client-side code that respects Row Level Security (RLS). This means data access is restricted based on user permissions. In contrast, the **service role key** is a secret key used only for backend/server-side which bypasses RLS for administrative access to the database.

|                 | Anon Key                                      | Service Role Key               |
| --------------- | --------------------------------------------- | ------------------------------ |
| Who uses it     | Frontend (browser), user-scoped backend calls | Backend server only            |
| RLS             | Does respect RLS                              | Bypasses RLS                   |
| Safe to expose? | Yes — it's in the browser JS bundle           | NEVER — database password      |
| Can do          | Only what RLS policies all for current user   | Everything — full admin access |
Let's look at some examples in the Project:

frontend/src/lib/supabase.ts:
```
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ...

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,    // Refreshes JWT before it expires
    persistSession: true,      // Saves session to localStorage
    detectSessionInUrl: true,  // Reads token from magic link URL
  },
});
```
This client uses the anon key. It's safe in browser since RLS protects the data. When a user logs in, Supabase attaches their [[JWT]] to their requests which the [[PostgreSQL#RLS Policies|RLS Policies]] can check to decide what to return.
	Note: `VITE_` prefix is [[Vite]] convention, only environment variables withe `VITE_` are exposed to frontend bundle. This is a safety rail for if you accidentally do something like put `SUPABASE_SERVICE_KEY` in frontend.

### Backend Service — Both Keys, Two Modes
The backend has two different clients. The **admin client** and the **user-scoped client**.

backend/libs/shared/src/supabase/supabase.service.ts (lines 11-21, 27-29):
```
onModuleInit() {
	const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
	const serviceKey = this.configService.getOrThrow<string>
		('SUPABASE_SERVICE_KEY');

	this.adminClient = createClient(supabaseUrl, serviceKey, {
	  auth: {
		autoRefreshToken: false,
		persistSession: false,
	  },
	});
}

getAdminClient(): SupabaseClient {
return this.adminClient;
}
```
This uses the service role key. The backend uses this when it needs to do things no user should be able to do — sending magic link emails, admin operations, or when the [[Worker]] processes background jobs (no "logged in user" in background job).
	Note: Notice autoRefreshToken: false and `persisteSession: false` — server has no browser session to refresh since it's stateless.

(Lines 35-50):
```
getClientForUser(accessToken: string): SupabaseClient {
    const supabaseUrl = this.configService.getOrThrow<string>
         ('SUPABASE_URL');
    const anonKey =
          this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');

return createClient(supabaseUrl, anonKey, {
  auth: {
	autoRefreshToken: false,
	persistSession: false,
  },
  global: {
	headers: {
	  Authorization: `Bearer ${accessToken}`,
	},
  },
});
}
```
This uses the anon key but injects the user's [[JWT]] token. The result is a client that respects RLS as that specific user. The backend uses this for database-level permission checks - the query only return rows the user is allowed to see.

The backend chooses which of these clients to use on a per-operation basis. If it's reading a user's own groups, it would use the user client. If it was performing a background job modifying multiple groups, it would use the user client.


### Token Validation
This is how [[Authentication|auth guard]] checks if a request's [[JWT]] is valid. It uses the admin client because only the admin client can call auth.getUser() to verify tokens.


### How all the pieces connect
Browser (React)
    │
    ├─ supabase client (anon key) ─── Auth (login, magic links)
    │                                  Realtime (WebSocket subscriptions)
    │
    └─ fetch() to NestJS API ───────── API validates JWT
                                         │
                                         ├─ getAdminClient() → bypasses RLS
                                         └─ getClientForUser() → respects RLS
                                         │
                                      Worker (background jobs)
                                         └─ getAdminClient() only → no user