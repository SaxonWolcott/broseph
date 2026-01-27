# Task 010: Fix Invite Flow — Display Name Guard & Correct Navigation

## Summary

**Status:** Complete
**Completed:** 2026-01-27

Fixed a critical race condition in the invite flow where new users clicking magic links were immediately redirected to the home page without completing their profile. The root cause was using `useEffect` to derive state needed for synchronous render decisions, creating a window where incorrect redirects would fire before the effect could run. Implemented a solution using React Query's `useMe()` hook to fetch profile data as part of the render cycle, and added a display name guard in ProtectedRoute to ensure no user can access the app without completing their profile.

## Progress Summary

- [x] Identified race condition in SignUpPage where `isCompletingProfile` state derived from useEffect
- [x] Replaced localStorage-based `isCompletingProfile` with server-side profile check via `useMe()` hook
- [x] Updated SignUpPage routing logic to wait for both auth and profile loading
- [x] Changed post-profile-completion redirect from `/groups` to `/home`
- [x] Added display name guard in ProtectedRoute to prevent profile-incomplete users from accessing app
- [x] Verified all user flows: new user invite, existing user invite, direct navigation, signup
- [x] Confirmed TypeScript compilation successful

## Overview

When a new user clicked an invite magic link, they encountered a timing bug that caused immediate redirect to the home page without completing their profile setup. The issue stemmed from using React's `useEffect` hook to manage state (`isCompletingProfile`) that was needed for synchronous redirect logic on the first render. Since effects run after the initial paint, there was a frame where the redirect executed before the effect could signal that profile completion was needed.

The fix moves profile data fetching into React Query's loading state (which is synchronous with the render cycle) and adds a safety-net display name guard in ProtectedRoute to catch any users without a display name.

## What Was Implemented

### Fix 1: Race Condition Elimination in SignUpPage

**Description:**
Replaced the asynchronous `isCompletingProfile` state (derived in a useEffect) with the synchronous `useMe()` hook that fetches profile data from the server. This ensures routing decisions wait for both authentication AND profile loading before deciding which view to show.

**File Modified:**
- `frontend/src/pages/SignUpPage.tsx`

**Changes:**
- Removed `isCompletingProfile` state variable
- Removed `useEffect` that set `isCompletingProfile` on auth state change (the race condition source)
- Added `useMe()` hook to fetch user profile from server
- Updated routing logic to use `isLoading` from both `useAuth()` and `useMe()` hooks
- New routing:
  - If loading auth or profile: show spinner
  - If user exists + displayName: redirect to `/`
  - If user exists + no displayName: show profile completion form
  - If no user: show signup form
- Removed unused `useEffect` import
- Added `Spinner` import from HeroUI
- Updated imports from `useOnboard` to also include `useMe`

**Key Implementation Detail:**
The critical insight is that React Query's `isLoading` state is part of the render cycle itself—it updates synchronously with the query state. This is different from `useEffect` which runs asynchronously after the paint. By waiting for `!isLoading` from both hooks before making routing decisions, we eliminate the one-frame window where incorrect redirects could fire.

### Fix 2: Correct Navigation Target After Profile Completion

**Description:**
Changed the redirect destination after successful profile completion from `/groups` to `/home` so users land on the correct page with the "You've joined the group!" toast message.

**File Modified:**
- `frontend/src/pages/SignUpPage.tsx`

**Changes:**
- Changed `navigate('/groups')` to `navigate('/home')` in the profile completion handler
- This ensures new users who joined via invite see their group on the home page with the welcome toast

### Fix 3: Display Name Guard in ProtectedRoute

**Description:**
Added a safety-net check in the ProtectedRoute component to prevent any authenticated user without a display name from accessing the app. This catches edge cases where a user might somehow bypass the profile completion form.

**File Modified:**
- `frontend/src/components/ProtectedRoute.tsx`

**Changes:**
- Added `useMe()` hook to fetch user profile
- Added guard condition: if user is authenticated but `profile.displayName` is falsy, redirect to `/signup`
- This ensures the profile form will be shown and completed
- Uses React Query's 5-minute `staleTime` on the `useMe()` query, adding zero overhead on subsequent navigations

**Key Implementation Detail:**
This is a defensive pattern—it shouldn't trigger in normal flows (since SignUpPage enforces profile completion), but it provides a safety net if any edge case or future code allows a user without a display name to be marked as authenticated.

## Acceptance Criteria (Verified)

- [x] New user clicking invite magic link → SignUpPage shows profile form
- [x] New user completes profile → Toast shows + redirected to /home (not /groups or /)
- [x] User is now in the group (verified via group membership)
- [x] Existing user clicking invite magic link → Auto-accepts + /groups with toast
- [x] Direct navigation to /home without display name → Redirected to /signup
- [x] Normal signup flow (no invite) → Still works correctly
- [x] Authenticated user WITH display name visiting /signup → Redirected to /
- [x] TypeScript compiles without errors

## Files Involved

### Modified Files

- `frontend/src/pages/SignUpPage.tsx`
  - Removed race condition by replacing `isCompletingProfile` state with `useMe()` hook
  - Updated routing logic to wait for profile loading
  - Changed post-completion redirect to `/home`
  - Updated imports

- `frontend/src/components/ProtectedRoute.tsx`
  - Added `useMe()` hook for profile fetching
  - Added display name guard redirect

## Dependencies

- **React Query** (`useMe()` hook) — Already in use, no new dependencies
- **HeroUI** (`Spinner` component) — Already in use, no new dependencies

## Notes

### Implementation Decisions

1. **Chose `useMe()` over localStorage**: The previous approach tried to use localStorage to track `isCompletingProfile`, but this created a race condition because the state wasn't synchronous with the render cycle. React Query's `isLoading` state is part of the render cycle, eliminating the timing issue.

2. **Added ProtectedRoute guard**: Even though SignUpPage enforces profile completion, adding a guard in ProtectedRoute provides defense-in-depth. It ensures that no matter what code path is used, an incomplete profile can't access the app.

3. **Kept 5-minute staleTime**: The `useMe()` hook already uses a 5-minute cache, so the ProtectedRoute check adds zero network overhead for users navigating back to protected routes.

4. **Redirect to /home not /groups**: After joining via invite, users should see their home page (which shows groups and messages) rather than the groups listing page. This gives them the welcome toast and better orientation.

### Lessons Learned

1. **useEffect for state derivation is a code smell**: When you need state that depends on other state to make synchronous render decisions, that's a sign the state derivation should happen synchronously (e.g., via React Query's query state) rather than in a useEffect.

2. **Race conditions in auth flows are subtle**: The bug didn't manifest in obvious ways—it only appeared when magic link auth happened during the signup flow. This is because the timing of when the auth state updates relative to component mount is hard to predict without understanding React's render cycle in detail.

3. **Loading states are underrated**: Properly handling loading states (showing a spinner) during async operations isn't just for UX—it's also correctness. By waiting for loading to complete before making routing decisions, we eliminate many potential race conditions.

### Known Limitations

- The display name guard in ProtectedRoute will show a brief loading spinner before redirect. This is acceptable since it should only occur in edge cases, not normal flows.
- If `useMe()` errors, the user is still blocked. This is safe (doesn't allow incomplete profiles through) but could be improved with explicit error handling in a future task.

### Future Improvements

1. **Explicit error handling in ProtectedRoute**: Currently if `useMe()` errors, we show nothing. Could improve by showing an error message or retry button.

2. **Profile completion modal**: Instead of redirecting to /signup, could show a modal overlay on top of the current page to complete profile. Less disruptive UX.

3. **Prevent profile-incomplete users at the API level**: Add a middleware or guard that checks display_name before allowing any non-auth API calls. This would be defense-in-depth at the backend.

4. **Analytics on profile completion**: Track where users drop off in the profile completion flow to identify friction points.
