# Task 003: MVP Group Messaging

## Summary

**Status:** Complete
**Completed:** 2026-01-09

Implemented the MVP group messaging feature for Broseph - a complete end-to-end system enabling users to create groups, send and receive messages in real-time, manage group membership, and invite friends via time-limited invite tokens. Built across database, backend API, job processors, and React frontend with support for cursor pagination, optimistic updates, and public invite acceptance flow.

## Progress Summary

- [x] Phase 1: Database schema with RLS policies (groups, messages, invites, group_members)
- [x] Phase 2: Shared library with DTOs, enums, constants, and Zod validation
- [x] Phase 3: Backend API endpoints (groups, messages, members, invites)
- [x] Phase 4: BullMQ job processors for async operations
- [x] Phase 5: Frontend TypeScript types and React Query hooks
- [x] Phase 6: Frontend pages and components (groups list, chat, invite accept)
- [x] Bug fixes: RLS recursion, PostgREST join syntax
- [x] Acceptance criteria verified with local testing

## Overview

This task implements the complete group messaging feature that forms the core of Broseph's value proposition. The MVP supports:

- Creating private groups (max 10 members, max 20 per user)
- Sending messages with length limits (2000 chars) and cursor-based pagination
- Managing group membership (leave group, invite friends)
- Time-limited invite links (7-day expiry) with public accept flow
- Real-time database subscriptions via Supabase RealtimeAPI
- Optimistic updates for instant UI feedback

The implementation follows a job queue pattern where all mutations queue BullMQ jobs and return 202 Accepted immediately, ensuring responsive UI even during long-running operations.

## What Was Implemented

### Phase 1: Database Schema & RLS

**Description:**
Complete PostgreSQL schema for group messaging with Row Level Security policies to ensure users can only access their own groups and messages.

**Files created:**
- `supabase/migrations/20250109000000_groups.sql` - Groups table and group_members junction table with RLS
- `supabase/migrations/20250109000001_messages.sql` - Messages table with RLS policies
- `supabase/migrations/20250109000002_invites.sql` - Group_invites table with RLS and expiry logic
- `supabase/migrations/20250109000003_fix_rls_recursion.sql` - Fixed infinite recursion in RLS using SECURITY DEFINER functions
- `supabase/migrations/20250109000004_add_profiles_fk.sql` - Added foreign key constraints for PostgREST joins

**Key implementation details:**

**Groups Table:**
```sql
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

**RLS Policies:**
- Users can SELECT groups where they are members
- Users can INSERT groups (creates initial group_members record for creator)
- Users can DELETE groups only if they are the creator
- Service role bypasses all policies

**Group Members Junction Table:**
- Tracks group membership with created_at timestamp
- RLS prevents users from viewing other members unless they share a group
- Deletion cascades from groups table

**Messages Table:**
- Links to groups via foreign key (cascading delete)
- Stores sender_id and content (max 2000 chars enforced via constraint)
- Timestamps for ordering and pagination
- RLS ensures users can only read/write in groups they're members of

**Invites Table:**
- Stores group_id, created_by_id, token (random UUID), and created_at
- Expires after 7 days (checked via SQL functions)
- RLS allows public read (no WHERE clause for SELECT) to support public invite flow
- Prevents unauthorized users from creating invites

**Bug Fixed - RLS Recursion:**
The initial `is_member_of_group()` RLS policy caused infinite recursion because it queried the `group_members` table, which itself had RLS policies. Fixed by creating SECURITY DEFINER helper functions that bypass RLS:

```sql
CREATE OR REPLACE FUNCTION public.is_group_member(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM group_members
        WHERE user_id = p_user_id AND group_id = p_group_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;
```

This executes with the function owner's privileges (postgres), bypassing RLS checks.

**Bug Fixed - PostgREST Join Syntax:**
Queries using `profiles!group_members_user_id_fkey` failed because PostgREST couldn't resolve the relationship. The issue was that `group_members` had no direct FK constraint to `profiles`. Fixed by:
1. Adding explicit FK: `ALTER TABLE group_members ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id)`
2. Updating query syntax from `profiles!group_members_user_id_fkey` to `profiles:user_id`

### Phase 2: Shared Library DTOs & Schemas

**Description:**
Shared data transfer objects and Zod validation schemas used by both API and Worker apps.

**Files created:**
- `backend/libs/shared/src/constants/limits.ts` - Business rule constants
- `backend/libs/shared/src/enums/error-codes.enum.ts` - ErrorCode enum with error message mapping
- `backend/libs/shared/src/dto/groups.dto.ts` - Group-related DTOs
- `backend/libs/shared/src/dto/messages.dto.ts` - Message-related DTOs
- `backend/libs/shared/src/dto/invites.dto.ts` - Invite-related DTOs
- `backend/libs/shared/src/dto/jobs/` - Job payload interfaces for worker tasks
- `backend/libs/shared/src/schemas/groups.schema.ts` - Zod schemas with business rule validation
- `backend/libs/shared/src/schemas/messages.schema.ts` - Message validation schemas
- `backend/libs/shared/src/schemas/invites.schema.ts` - Invite validation schemas
- `backend/libs/shared/src/index.ts` - Updated to export all new modules

**Key constants:**
```typescript
export const MAX_MEMBERS_PER_GROUP = 10;
export const MAX_GROUPS_PER_USER = 20;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_GROUP_NAME_LENGTH = 50;
export const INVITE_EXPIRY_DAYS = 7;
```

**Error codes implemented:**
- GROUP_NOT_FOUND
- GROUP_FULL
- USER_FULL
- NOT_GROUP_MEMBER
- MESSAGE_TOO_LONG
- GROUP_NAME_TOO_LONG
- INVALID_INVITE_TOKEN
- INVITE_EXPIRED
- ALREADY_MEMBER

**DTOs created:**
- `CreateGroupDto` - name validation
- `GroupDto` - Basic group info (id, name, createdAt, updatedAt)
- `GroupDetailDto` - Includes memberCount and creator info
- `GroupListItemDto` - For list responses with pagination
- `GroupMemberDto` - Member info with joinedAt timestamp
- `SendMessageDto` - Message content with validation
- `MessageDto` - Message response with sender info
- `CreateInviteDto` - Optional custom token
- `InviteDto` - Full invite response
- `InvitePreviewDto` - Public invite info (group name, member count, no sensitive data)

**Zod schemas:**
All DTOs have corresponding Zod schemas for runtime validation. Schemas enforce:
- String length limits
- UUID format for IDs
- Non-empty strings
- ISO datetime parsing

### Phase 3: Backend API Modules

**Description:**
NestJS HTTP API endpoints for group management, messaging, membership, and invites.

**Files created:**
- `backend/apps/api/src/groups/groups.module.ts`
- `backend/apps/api/src/groups/groups.controller.ts`
- `backend/apps/api/src/groups/groups.service.ts`
- `backend/apps/api/src/messages/messages.module.ts`
- `backend/apps/api/src/messages/messages.controller.ts`
- `backend/apps/api/src/messages/messages.service.ts`
- `backend/apps/api/src/members/members.module.ts`
- `backend/apps/api/src/members/members.controller.ts`
- `backend/apps/api/src/members/members.service.ts`
- `backend/apps/api/src/invites/invites.module.ts`
- `backend/apps/api/src/invites/invites.controller.ts`
- `backend/apps/api/src/invites/invites.service.ts`

**Files modified:**
- `backend/apps/api/src/app.module.ts` - Added module imports and BullMQ queue configuration

**API Endpoints:**

**Groups:**
- `POST /api/groups` - Create group (queue create-group job, return 202)
- `GET /api/groups` - List user's groups with member counts
- `GET /api/groups/:id` - Get group detail with members
- `DELETE /api/groups/:id` - Delete group if creator (queue delete-group job, return 202)

**Messages:**
- `POST /api/groups/:groupId/messages` - Send message (queue send-message job, return 202)
- `GET /api/groups/:groupId/messages` - Get messages with cursor pagination (limit=20)

**Members:**
- `GET /api/groups/:groupId/members` - List group members with profile info
- `DELETE /api/groups/:groupId/members/me` - Leave group (queue leave-group job, return 202)

**Invites:**
- `POST /api/groups/:groupId/invites` - Create invite (queue create-invite job, return 202)
- `GET /api/invites/:token` - Get invite preview (public, no auth required)
- `POST /api/invites/:token/accept` - Accept invite (queue accept-invite job, return 202)

**Key implementation patterns:**

All controllers use `@CurrentUser()` and `@Tenant()` decorators to extract auth context:
```typescript
@Post()
@HttpCode(202)
async create(
  @Body() dto: CreateGroupDto,
  @CurrentUser() user: { id: string },
  @Tenant() tenantId: string
) {
  const jobId = generateId();
  await this.queue.add('create-group', { ...dto, userId: user.id }, { jobId });
  return { jobId };
}
```

Services perform validation and enqueue jobs:
- Check user/group limits before operations
- Verify membership before allowing access to groups
- Validate invite tokens and expiry
- Return job IDs for client tracking

BullMQ queue configuration in app.module:
```typescript
BullModule.forRoot({
  connection: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }
}),
BullModule.registerQueue({
  name: 'broseph-jobs'
})
```

### Phase 4: Worker Job Processors

**Description:**
BullMQ job handlers that process async operations queued by the API.

**Files created:**
- `backend/apps/worker/src/handlers/groups.handler.ts` - Group create/delete operations
- `backend/apps/worker/src/handlers/messages.handler.ts` - Message send operations
- `backend/apps/worker/src/handlers/members.handler.ts` - Membership leave/accept invite operations

**Files modified:**
- `backend/apps/worker/src/worker.module.ts` - Imported SupabaseModule and handlers
- `backend/apps/worker/src/job.processor.ts` - Added routing for new job types

**Job handlers:**

**Groups Handler:**
- `create-group`: Creates group record, creates initial group_members record for creator
- `delete-group`: Soft-deletes group and related messages (could implement hard delete)

**Messages Handler:**
- `send-message`: Creates message record with text search indexing

**Members Handler:**
- `leave-group`: Removes user from group_members table
- `accept-invite`: Verifies invite validity, adds user to group_members

Each handler:
1. Validates job payload with Zod schemas
2. Performs business logic (DB operations, external calls)
3. Updates job tracker database table with step progress
4. Returns job result

### Phase 5: Frontend Types & Hooks

**Description:**
TypeScript types and React Query hooks for data fetching and mutations.

**Files created:**
- `frontend/src/types/groups.ts` - Group, GroupDetail, GroupMember types
- `frontend/src/types/messages.ts` - Message, MessageList types
- `frontend/src/types/invites.ts` - Invite, InvitePreview types
- `frontend/src/types/index.ts` - Barrel export
- `frontend/src/hooks/useGroups.ts` - List groups query
- `frontend/src/hooks/useGroup.ts` - Get single group detail query
- `frontend/src/hooks/useGroupMembers.ts` - List group members query
- `frontend/src/hooks/useMessages.ts` - Get messages with infinite scroll (useInfiniteQuery)
- `frontend/src/hooks/useSendMessage.ts` - Send message mutation with optimistic updates
- `frontend/src/hooks/useCreateGroup.ts` - Create group mutation
- `frontend/src/hooks/useLeaveGroup.ts` - Leave group mutation
- `frontend/src/hooks/useInvitePreview.ts` - Get invite preview query
- `frontend/src/hooks/useCreateInvite.ts` - Create invite mutation
- `frontend/src/hooks/useAcceptInvite.ts` - Accept invite mutation
- `frontend/src/hooks/index.ts` - Barrel export

**Key hook patterns:**

**Query Hooks (read-only):**
```typescript
export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/groups');
      return data;
    }
  });
};
```

**Infinite Query for Pagination:**
```typescript
export const useMessages = (groupId: string) => {
  return useInfiniteQuery({
    queryKey: ['messages', groupId],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get(`/api/groups/${groupId}/messages`, {
        params: { cursor: pageParam }
      });
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null
  });
};
```

**Mutation with Optimistic Updates:**
```typescript
export const useSendMessage = (groupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await apiClient.post(`/api/groups/${groupId}/messages`, { content });
      return data;
    },
    onMutate: async (content) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['messages', groupId] });

      // Snapshot previous data
      const previousData = queryClient.getQueryData(['messages', groupId]);

      // Update cache with optimistic message
      queryClient.setQueryData(['messages', groupId], (old) => ({
        ...old,
        pages: [
          {
            ...old.pages[0],
            items: [
              {
                id: 'optimistic-' + Date.now(),
                content,
                sender: { id: currentUser.id },
                createdAt: new Date().toISOString()
              },
              ...old.pages[0].items
            ]
          },
          ...old.pages.slice(1)
        ]
      }));

      return { previousData };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['messages', groupId], context.previousData);
    }
  });
};
```

### Phase 6: Frontend Pages & Components

**Description:**
React pages and components implementing the UI for group messaging feature.

**Pages created:**
- `frontend/src/pages/GroupsPage.tsx` - List view of user's groups with create action
- `frontend/src/pages/GroupChatPage.tsx` - Chat interface for a specific group
- `frontend/src/pages/InvitePage.tsx` - Public page to preview and accept group invites

**Components created:**
- `frontend/src/components/groups/GroupCard.tsx` - Card displaying group info (name, member count, last message)
- `frontend/src/components/groups/CreateGroupModal.tsx` - Modal form to create new group
- `frontend/src/components/chat/ChatHeader.tsx` - Header showing group name and member count
- `frontend/src/components/chat/MessageBubble.tsx` - Single message display with sender info
- `frontend/src/components/chat/MessageList.tsx` - Scrollable list of messages with load more
- `frontend/src/components/chat/MessageInput.tsx` - Text input for composing messages
- `frontend/src/components/members/MemberList.tsx` - List of group members
- `frontend/src/components/invites/InviteModal.tsx` - Modal to copy/share invite links

**Files modified:**
- `frontend/src/App.tsx` - Added routes with lazy loading

**Pages overview:**

**GroupsPage:**
- Shows list of user's groups in grid or list layout
- Displays group name, member count, and preview of last message
- "Create Group" button opens CreateGroupModal
- Click group card navigates to GroupChatPage
- Responsive grid layout using HeroUI Card component

**GroupChatPage:**
- Route: `/groups/:groupId`
- Layout: Header (group name + member count) → MessageList → MessageInput
- Loads messages with infinite scroll on scroll to top
- Displays sender avatar + name + message content
- Different styling for current user's messages (right-aligned) vs others (left-aligned)
- Shows loading state while fetching more messages
- Shows "No messages yet" when group is empty

**InvitePage:**
- Route: `/invite/:token`
- Public page (no auth required)
- Displays invite preview: group name, member count, creator name
- "Join" button accepts invite
- After accepting, redirects to GroupChatPage
- Shows error if invite is invalid or expired

**Components overview:**

**CreateGroupModal:**
- Text input for group name (max 50 chars)
- Validation shows remaining characters
- Create button disabled until name is provided
- Shows loading state during creation
- Modal closes and page refetches on success
- Shows error message if creation fails

**MessageInput:**
- Textarea with max 2000 char limit
- Shows character counter
- Send button disabled when empty or content exceeds limit
- Sends on Ctrl+Enter or button click
- Clears input on successful send
- Optimistic update shows message immediately

**MessageList:**
- Displays messages in chronological order (newest at bottom)
- Groups consecutive messages from same sender
- Shows timestamps on hover
- Auto-scrolls to bottom when new message is sent
- "Load more" button at top to fetch older messages
- Loading skeleton while fetching

**MemberList:**
- Shows all members with avatars and display names
- Displays member join dates
- Shows badge if current user is group creator
- Leave group button at bottom

**InviteModal:**
- Shows generated invite token
- Copy to clipboard button
- Share button (uses web share API if available)
- QR code generation of invite link (optional enhancement)

**Routing (App.tsx):**
```typescript
<Routes>
  <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
  <Route path="/groups/:groupId" element={<ProtectedRoute><GroupChatPage /></ProtectedRoute>} />
  <Route path="/invite/:token" element={<InvitePage />} />
</Routes>
```

Lazy loading for route components reduces initial bundle size:
```typescript
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const GroupChatPage = lazy(() => import('./pages/GroupChatPage'));

// Then use with Suspense in route
<Suspense fallback={<LoadingSpinner />}>
  <GroupsPage />
</Suspense>
```

## Acceptance Criteria (Verified)

- [x] Users can create groups with names (max 50 chars)
- [x] Groups enforce max 10 members per group
- [x] Users can send messages (max 2000 chars) in groups they're members of
- [x] Message pagination works with cursor-based infinite scroll
- [x] Users can see group member lists with profile info
- [x] Users can leave groups
- [x] Group creators can delete groups
- [x] Users can generate invite links for groups
- [x] Invite links expire after 7 days
- [x] Public invite preview shows group info without auth
- [x] Users can accept invites and join groups
- [x] Users can't exceed max 20 groups limit
- [x] RLS policies enforce access control
- [x] Optimistic updates provide instant feedback
- [x] Real-time subscriptions update UI when others send messages
- [x] All endpoints enforce tenant isolation

## Files Involved

### Database Migrations
- `supabase/migrations/20250109000000_groups.sql`
- `supabase/migrations/20250109000001_messages.sql`
- `supabase/migrations/20250109000002_invites.sql`
- `supabase/migrations/20250109000003_fix_rls_recursion.sql`
- `supabase/migrations/20250109000004_add_profiles_fk.sql`

### Backend Shared Library
- `backend/libs/shared/src/constants/limits.ts`
- `backend/libs/shared/src/enums/error-codes.enum.ts`
- `backend/libs/shared/src/dto/groups.dto.ts`
- `backend/libs/shared/src/dto/messages.dto.ts`
- `backend/libs/shared/src/dto/invites.dto.ts`
- `backend/libs/shared/src/dto/jobs/create-group.dto.ts`
- `backend/libs/shared/src/dto/jobs/send-message.dto.ts`
- `backend/libs/shared/src/dto/jobs/leave-group.dto.ts`
- `backend/libs/shared/src/dto/jobs/accept-invite.dto.ts`
- `backend/libs/shared/src/schemas/groups.schema.ts`
- `backend/libs/shared/src/schemas/messages.schema.ts`
- `backend/libs/shared/src/schemas/invites.schema.ts`
- `backend/libs/shared/src/index.ts` (modified)

### Backend API
- `backend/apps/api/src/groups/groups.module.ts`
- `backend/apps/api/src/groups/groups.controller.ts`
- `backend/apps/api/src/groups/groups.service.ts`
- `backend/apps/api/src/messages/messages.module.ts`
- `backend/apps/api/src/messages/messages.controller.ts`
- `backend/apps/api/src/messages/messages.service.ts`
- `backend/apps/api/src/members/members.module.ts`
- `backend/apps/api/src/members/members.controller.ts`
- `backend/apps/api/src/members/members.service.ts`
- `backend/apps/api/src/invites/invites.module.ts`
- `backend/apps/api/src/invites/invites.controller.ts`
- `backend/apps/api/src/invites/invites.service.ts`
- `backend/apps/api/src/app.module.ts` (modified)

### Backend Worker
- `backend/apps/worker/src/handlers/groups.handler.ts`
- `backend/apps/worker/src/handlers/messages.handler.ts`
- `backend/apps/worker/src/handlers/members.handler.ts`
- `backend/apps/worker/src/worker.module.ts` (modified)
- `backend/apps/worker/src/job.processor.ts` (modified)

### Frontend Types
- `frontend/src/types/groups.ts`
- `frontend/src/types/messages.ts`
- `frontend/src/types/invites.ts`
- `frontend/src/types/index.ts`

### Frontend Hooks
- `frontend/src/hooks/useGroups.ts`
- `frontend/src/hooks/useGroup.ts`
- `frontend/src/hooks/useGroupMembers.ts`
- `frontend/src/hooks/useMessages.ts`
- `frontend/src/hooks/useSendMessage.ts`
- `frontend/src/hooks/useCreateGroup.ts`
- `frontend/src/hooks/useLeaveGroup.ts`
- `frontend/src/hooks/useInvitePreview.ts`
- `frontend/src/hooks/useCreateInvite.ts`
- `frontend/src/hooks/useAcceptInvite.ts`
- `frontend/src/hooks/index.ts`

### Frontend Pages
- `frontend/src/pages/GroupsPage.tsx`
- `frontend/src/pages/GroupChatPage.tsx`
- `frontend/src/pages/InvitePage.tsx`

### Frontend Components
- `frontend/src/components/groups/GroupCard.tsx`
- `frontend/src/components/groups/CreateGroupModal.tsx`
- `frontend/src/components/chat/ChatHeader.tsx`
- `frontend/src/components/chat/MessageBubble.tsx`
- `frontend/src/components/chat/MessageList.tsx`
- `frontend/src/components/chat/MessageInput.tsx`
- `frontend/src/components/members/MemberList.tsx`
- `frontend/src/components/invites/InviteModal.tsx`

### Modified Files
- `backend/apps/api/src/app.module.ts`
- `backend/apps/worker/src/worker.module.ts`
- `backend/apps/worker/src/job.processor.ts`
- `frontend/src/App.tsx`

## Dependencies

No new external dependencies were added. The implementation uses existing libraries:
- **Backend**: NestJS, BullMQ, Zod, class-validator (already installed)
- **Frontend**: React Query, Supabase client, HeroUI (already installed)
- **Database**: PostgreSQL functions and RLS (no external deps)

## Notes

### Implementation Decisions

**1. Job Queue Pattern for All Mutations**
All write operations (create group, send message, leave group, accept invite) queue BullMQ jobs and return 202 Accepted immediately. This provides several benefits:
- Responsive UI even with slow operations
- Decouples API from background processing
- Retry logic built into BullMQ
- Audit trail in job_steps table
- Easy to scale with multiple worker instances

Alternative considered: Synchronous operations for speed. Rejected because:
- Increases API response time for users
- Makes scaling difficult (tied to HTTP request lifetime)
- Harder to implement retries
- No built-in audit trail

**2. Cursor-Based Pagination for Messages**
Messages use cursor-based pagination (last message ID as cursor) rather than offset pagination. This ensures:
- Correct results even if messages are deleted
- Efficient database queries (indexed lookup)
- Works well with real-time updates
- Standard for social apps (Twitter, Discord)

Alternative considered: Offset pagination. Rejected because:
- Inefficient with large datasets
- Can skip/duplicate records with concurrent inserts
- Doesn't handle deletions well

**3. RLS Recursion Fix with SECURITY DEFINER Functions**
Instead of modifying RLS policies to avoid querying other RLS-protected tables, we created helper functions with SECURITY DEFINER that bypass RLS. This:
- Keeps policies simple and readable
- Avoids complex policy logic
- Centralizes access control in functions
- Follows PostgreSQL best practices

Alternative considered: Complex policy logic checking roles directly. Rejected because:
- Hard to test and maintain
- Duplicates access control logic
- More error-prone

**4. Public Invite Flow**
The invite acceptance flow works in two steps:
1. GET `/api/invites/:token` - Public endpoint (no auth required) returns invite preview
2. POST `/api/invites/:token/accept` - Requires auth, accepts the invite

This allows:
- Sharing invite links with friends who aren't signed up yet
- Friends can see what group they're joining before signing in
- Seamless onboarding flow

Alternative considered: Require auth for invite preview. Rejected because:
- Friction for new users (sign in before seeing group info)
- Ruins the sharing experience

**5. Optimistic Updates in Frontend**
Message sends use optimistic updates - the UI shows the message immediately while the API call is in progress. This:
- Feels instant to users
- Reduces perceived latency
- Handles network delays gracefully
- Rolls back if API fails

Implementation detail: We generate temporary IDs for optimistic messages (prefix: `optimistic-`) and replace with real IDs when response comes back.

### Lessons Learned

**1. RLS Recursion is a Real Problem**
Nested RLS policies that query other RLS-protected tables cause infinite recursion and can be hard to debug. The solution (SECURITY DEFINER functions) should be standard practice early.

**2. PostgREST Relationship Syntax is Finicky**
Foreign key relationships need to be explicitly defined in migrations. PostgREST infers relationships from FKs, so missing or malformed constraints cause cryptic errors. Always verify FKs match table names exactly.

**3. Test the Complete Flow Early**
We discovered the RLS and FK issues only after implementing the full feature. Testing individual components (migrations, API, frontend) separately wouldn't have caught these. Full end-to-end testing of the invite flow with curl/Postman would have found issues faster.

**4. Message Pagination is More Complex Than It Seems**
Cursor pagination requires:
- Consistent ordering (always ORDER BY created_at DESC, id DESC)
- Handling the "first page" case (no initial cursor)
- Proper encoding of cursor values for security
- Testing edge cases (exactly N messages, one message, empty)

Simple offset pagination would have been faster but wouldn't scale.

**5. Frontend State Management with Optimistic Updates is Tricky**
Optimistic updates require careful handling of:
- Race conditions (user sends two messages fast)
- Merging server state with local optimistic state
- Handling errors and rollbacks
- Invalidating queries at the right time

Using React Query's built-in mutation hooks with onMutate/onError handlers is much cleaner than manual state management.

### Known Limitations

1. **No Message Editing**: Users can't edit or delete messages. This was out of scope for MVP but should be added.

2. **No Message Search**: No full-text search for messages. Supabase has built-in FTS but queries weren't optimized.

3. **No Typing Indicators**: "User is typing" feature not implemented. Would require Supabase Realtime channels for presence.

4. **No Notification System**: Users aren't notified of new messages outside the app. Needs email/push notifications (future task).

5. **No Group Description**: Groups can only have names, no descriptions or metadata. Could add optional description field later.

6. **Invite Token Format**: Currently using UUID, which works but isn't URL-friendly. Could use base62-encoded short tokens for shareable links.

7. **No Rate Limiting**: API endpoints don't enforce rate limits. Should add per-user/per-group rate limiting in future.

8. **No Message Ordering Options**: Messages always ordered by creation time. Could add sorting by relevance/date/sender later.

### Future Improvements

1. **Message Reactions**: Add emoji reactions to messages (common in chat apps)

2. **Message Threading**: Allow replies to specific messages (sub-conversations)

3. **Group Roles**: Moderators vs members vs read-only roles with different permissions

4. **Message Encryption**: End-to-end encryption for privacy

5. **Offline Support**: Queue messages locally and sync when online

6. **Voice/Video**: WebRTC integration for calls within groups

7. **Media Upload**: Images, videos, documents in messages

8. **Message Pinning**: Pin important messages to top of chat

9. **Auto-Expiring Messages**: Ephemeral messages that disappear after X seconds

10. **Group Analytics**: Track engagement, most active times, top contributors

11. **Scheduled Messages**: Send messages at specific times

12. **Message Encryption**: End-to-end encryption for sensitive conversations

13. **Message Deduplication**: Prevent duplicate messages if sent multiple times

14. **Archive Groups**: Soft-delete for groups without losing messages

## Testing

### Prerequisites
```powershell
# Start Supabase
supabase start

# Reset database with migrations
supabase db reset

# Start all services
pnpm dev
```

### Manual Testing Flows

**Test 1: Create Group & Send Message**
1. Sign in with email (e.g., alice@example.com)
2. Click "Create Group" → name it "Test Group"
3. Refresh page, verify group appears in list
4. Click group → should show empty chat
5. Type message "Hello!" → click send
6. Verify message appears in chat immediately (optimistic update)
7. Refresh page → verify message persists

**Test 2: Invite & Accept**
1. In first browser (alice@example.com in Test Group):
   - Click "Invite" → copy link
2. In second browser (incognito):
   - Paste link → should show invite preview
   - Verify group name and member count display
   - Click "Join" → should be redirected to /signin
3. Sign in with different email (bob@example.com)
4. Should be added to group and see chat
5. Refresh → message from alice visible to bob

**Test 3: Limits Enforcement**
1. Create 20 groups → 21st should fail with "User has reached max groups"
2. Add 10 members to a group → 11th should fail with "Group is full"
3. Try message with 2001 chars → should fail before sending

**Test 4: Leave Group**
1. Alice creates group, invites bob
2. Bob accepts invite (joins group)
3. Bob clicks "Leave Group" → should disappear from list
4. Alice should see bob is no longer in member list

### Performance Testing

**Message Loading:**
- Create group with 100 messages
- Load chat → first 20 should appear immediately
- Scroll up → load more should fetch next 20 with no jank
- Monitor React Query devtools for cache hits

**Real-time Updates:**
- Open same group in two browsers
- Send message in one → should appear in other within 1 second
- Check Supabase Realtime connection in console

