# Task 004: Fix Invite Links

## Summary

**Status:** Complete
**Completed:** 2026-01-09

Fixed the 400 error when generating invite links by adding a missing RLS INSERT policy. Also implemented the complete invite flow with automatic authentication handling, pending invite redirects, and toast notifications for successful group joins.

## Progress Summary

- [x] Diagnosed 400 error on POST `/api/groups/:id/invites`
- [x] Created RLS INSERT policy for `group_invites` table
- [x] Added `sonner` toast library for notifications
- [x] Modified `AuthCallbackPage` to handle pending invite redirects
- [x] Updated `InvitePage` to show success toast and navigate to groups
- [x] Verified invite generation and acceptance flows

## Overview

The invite link feature was broken - users couldn't generate invite links for their groups. Investigation revealed that while SELECT policies existed on the `group_invites` table, no INSERT policy was defined. This meant the Supabase client (using RLS) was blocked from creating invite records even for valid group members.

Additionally, the user experience needed improvement: after accepting an invite, users should see a confirmation and be redirected appropriately.

## What Was Implemented

### RLS Policy Fix

**Description:**
Added the missing INSERT policy to allow group members to create invites.

**Files created:**
- `supabase/migrations/20250109000005_invite_insert_policy.sql` - RLS INSERT policy

**Key implementation:**
```sql
CREATE POLICY "Members can create invites" ON public.group_invites
    FOR INSERT WITH CHECK (
        public.is_group_member(group_id)
        AND invited_by = auth.uid()
    );
```

The policy uses the existing `is_group_member()` SECURITY DEFINER function to avoid RLS recursion while verifying the user is a member of the group they're creating an invite for.

### Pending Invite Redirect

**Description:**
When a user clicks an invite link without being authenticated, they're redirected to sign in. After authentication, they should be sent back to the invite page to complete joining.

**Files modified:**
- `frontend/src/pages/AuthCallbackPage.tsx` - Handle pending invite from sessionStorage

**Key implementation:**
```typescript
if (data.session) {
  const pendingInvite = sessionStorage.getItem('pendingInvite');
  if (pendingInvite) {
    sessionStorage.removeItem('pendingInvite');
    navigate(`/invite/${pendingInvite}`, { replace: true });
  } else {
    navigate('/', { replace: true });
  }
}
```

### Toast Notifications

**Description:**
Added toast notifications to provide feedback when a user successfully joins a group.

**Files modified:**
- `frontend/src/main.tsx` - Added `<Toaster>` provider
- `frontend/src/pages/InvitePage.tsx` - Show success toast and navigate

**Dependencies added:**
- `sonner` - Lightweight toast notification library

**Key implementation:**
```typescript
// main.tsx
import { Toaster } from 'sonner';
// ...
<AuthProvider>
  <App />
  <Toaster richColors position="top-center" />
</AuthProvider>

// InvitePage.tsx
const handleAcceptInvite = async () => {
  try {
    await acceptInvite.mutateAsync(token);
    toast.success(`You've joined ${invite.groupName}!`);
    navigate('/groups', { replace: true });
  } catch (error) {
    // Error handled by mutation
  }
};
```

## Acceptance Criteria (Verified)

- [x] Users can generate invite links for groups they're members of
- [x] Clicking invite link with valid auth → shows invite preview
- [x] Clicking invite link without auth → redirects to sign in, then back to invite
- [x] Accepting invite → shows success toast with group name
- [x] After accepting → redirects to groups page
- [x] "Already a member" error displays correctly if user re-clicks invite

## Files Involved

### New Files
- `supabase/migrations/20250109000005_invite_insert_policy.sql` - RLS INSERT policy

### Modified Files
- `frontend/src/main.tsx` - Added Toaster provider
- `frontend/src/pages/AuthCallbackPage.tsx` - Pending invite redirect logic
- `frontend/src/pages/InvitePage.tsx` - Success toast and navigation

## Dependencies

- **Task 003:** Uses the invite infrastructure (group_invites table, invite endpoints)
- **Libraries:** Added `sonner` for toast notifications

## Notes

### Root Cause Analysis

The 400 error was caused by Supabase RLS blocking the INSERT operation. The invite service uses `userClient` (which respects RLS) rather than `adminClient` (which bypasses RLS). This is intentional - we want RLS to validate that users can only create invites for their own groups.

The fix was to add the appropriate INSERT policy rather than switching to adminClient, maintaining proper access control.

### Implementation Decisions

**Why `sonner` for toasts?**
- Lightweight (~4KB gzipped)
- Works well with React 18
- Simple API (just call `toast.success()`)
- Supports rich colors that match HeroUI's design system
- No complex setup required

**Why `sessionStorage` for pending invites?**
- Survives page refreshes during OAuth flow
- Automatically cleared when browser closes
- Simpler than URL parameters which can get lost in redirects

### Known Limitations

1. **Single pending invite:** Only one pending invite is stored. If a user clicks multiple invite links before signing in, only the last one is preserved.

2. **No invite cancellation:** If a user signs in via magic link but closes the tab before the callback, the pending invite is lost.

### Future Improvements

1. **Multiple pending invites:** Store array of pending invites in sessionStorage
2. **Invite link in email:** Include invite token in magic link email for seamless flow
3. **Invite notifications:** Show in-app notification when invited to a group
