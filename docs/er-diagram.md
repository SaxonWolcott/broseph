# Broseph ER Diagram

> Auto-generated from Supabase migrations. Update when schema changes.

```mermaid
erDiagram
    %% ─── Supabase Auth (managed) ───
    auth_users {
        UUID id PK
        VARCHAR email
        TIMESTAMPTZ created_at
    }

    %% ─── Application Tables ───
    profiles {
        UUID id PK "FK → auth.users.id"
        VARCHAR(100) display_name
        VARCHAR(50) handle "unique, nullable"
        TEXT avatar_url
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    groups {
        UUID id PK
        VARCHAR(50) name "1-50 chars"
        UUID owner_id FK "→ auth.users.id"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    group_members {
        UUID id PK
        UUID group_id FK "→ groups.id"
        UUID user_id FK "→ profiles.id"
        VARCHAR(20) role "owner | member"
        TIMESTAMPTZ joined_at
    }

    messages {
        UUID id PK
        UUID group_id FK "→ groups.id"
        UUID sender_id FK "→ profiles.id"
        TEXT content "1-2000 chars"
        TIMESTAMPTZ created_at
    }

    group_invites {
        UUID id PK
        UUID group_id FK "→ groups.id"
        UUID invited_by FK "→ profiles.id"
        VARCHAR(64) invite_token "unique"
        VARCHAR(255) email "nullable"
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ used_at "nullable"
        UUID used_by FK "→ auth.users.id, nullable"
        TIMESTAMPTZ created_at
    }

    prompt_responses {
        UUID id PK
        UUID group_id FK "→ groups.id"
        UUID user_id FK "→ auth.users.id"
        VARCHAR(10) prompt_id
        DATE response_date
        TEXT content
        TIMESTAMPTZ created_at
    }

    %% ─── Relationships ───

    auth_users ||--|| profiles : "auto-creates on signup"

    auth_users ||--o{ groups : "owns"
    profiles ||--o{ group_members : "belongs to"
    groups ||--o{ group_members : "has members"

    groups ||--o{ messages : "contains"
    profiles ||--o{ messages : "sends"

    groups ||--o{ group_invites : "has invites"
    profiles ||--o{ group_invites : "invited_by"
    auth_users ||--o{ group_invites : "used_by"

    groups ||--o{ prompt_responses : "has responses"
    auth_users ||--o{ prompt_responses : "responds"
```

## Table Summary

| Table | Purpose | Key Constraints |
|-------|---------|-----------------|
| `profiles` | User identity (linked 1:1 to auth.users) | Auto-created on signup via trigger |
| `groups` | Chat groups | Name 1-50 chars |
| `group_members` | Junction: users ↔ groups | Unique (group_id, user_id); role: owner/member |
| `messages` | Group chat messages | Content 1-2000 chars |
| `group_invites` | Magic link group invitations | Token-based; expires; single-use |
| `prompt_responses` | Daily conversation prompt answers | Unique (group_id, user_id, response_date) |

## Storage Buckets

| Bucket | Purpose | Limits |
|--------|---------|--------|
| `avatars` | User profile pictures | 2 MB; jpeg/png/gif/webp; public read |

## Notes

- All tables use **Row Level Security (RLS)** — access scoped to group membership
- RLS uses `SECURITY DEFINER` helper functions (`is_group_member`, `get_user_group_ids`) to avoid recursive policy checks
- `messages` and `group_members` are published to **Supabase Realtime** for live updates
- `profiles.id` = `auth.users.id` — the same UUID, not a separate sequence
