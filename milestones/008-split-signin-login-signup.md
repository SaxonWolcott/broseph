# Task 008: Split Sign-In into Login and Sign Up Pages

## Summary

**Status:** Completed
**Created:** 2026-01-21
**Completed:** 2026-01-21

Refactored the authentication flow to split the unified sign-in screen into two separate pages: a Login page (default) for existing users and a Sign Up page for new users. Added a new backend endpoint to check if an email exists.

## Progress Summary

- [x] Step 1: Analyze current authentication flow and pages
- [x] Step 2: Create backend check-email endpoint
- [x] Step 3: Create Login page with email-only input
- [x] Step 4: Create Sign Up page with email and display name inputs
- [x] Step 5: Update navigation and routing
- [x] Step 6: Update ProtectedRoute and AuthCallbackPage redirects
- [x] Step 7: Delete old SignInPage
- [x] Step 8: Verify TypeScript validation
- [x] Step 9: Fix invite email flow (custom branded emails)
- [x] Step 10: Auto-join flow for invite links
- [x] Step 11: Custom signup email template

## Overview

The authentication flow was using a single unified sign-in page. This task split it into two focused pages:

1. **Login Page** (`/login`) - Email input only
   - Default landing page for sign-in
   - Shows "Don't have an account? Sign up" link
   - Checks if email exists before sending magic link
   - If email doesn't exist → shows warning with link to Sign Up
   - If email exists → sends magic link and shows success message

2. **Sign Up Page** (`/signup`) - Email + display name
   - Shows "Already have an account? Log in" link
   - Checks if email exists before proceeding
   - If email already exists → shows warning with link to Login
   - If new email → stores display name in localStorage, sends magic link

## Files Changed

### Created
- `frontend/src/pages/LoginPage.tsx` - Login page with email-only input
- `frontend/src/pages/SignUpPage.tsx` - Sign up page with email + display name
- `frontend/src/hooks/useCheckEmail.ts` - React Query hook for email check
- `frontend/src/types/auth.ts` - Added CheckEmailRequest/Response types

### Modified
- `backend/apps/api/src/auth/auth.controller.ts` - Added `POST /api/auth/check-email` endpoint
- `backend/apps/api/src/auth/auth.service.ts` - Added `checkEmail()` method
- `backend/libs/shared/src/dto/auth.dto.ts` - Added CheckEmailDto and CheckEmailResponseDto
- `frontend/src/App.tsx` - Updated routing with `/login`, `/signup`, and `/signin` redirect
- `frontend/src/components/ProtectedRoute.tsx` - Changed redirect from `/signin` to `/login`
- `frontend/src/pages/AuthCallbackPage.tsx` - Changed redirects from `/signin` to `/login`

### Deleted
- `frontend/src/pages/SignInPage.tsx` - Replaced by LoginPage and SignUpPage

## Implementation Notes

### Backend API

New endpoint: `POST /api/auth/check-email`
- Input: `{ email: string }`
- Output: `{ exists: boolean }`
- Uses Supabase admin client to check if email exists in auth.users
- Public endpoint (no authentication required)

### Frontend Flow

**Login Flow:**
1. User enters email on Login page
2. `useCheckEmail` hook calls `/api/auth/check-email`
3. If `exists: false` → show warning with "Sign up instead?" link
4. If `exists: true` → call `useMagicLink` to send magic link, show success

**Sign Up Flow:**
1. User enters display name and email on Sign Up page
2. `useCheckEmail` hook calls `/api/auth/check-email`
3. If `exists: true` → show warning with "Log in instead?" link
4. If `exists: false` → store displayName in localStorage, send magic link, show success
5. AuthCallbackPage reads localStorage and calls `/api/auth/onboard` with display name

### Backwards Compatibility

- `/signin` route redirects to `/login` for any existing bookmarks/links
- AuthCallbackPage's `pendingDisplayName` logic unchanged (works for both flows)

### Invite Flow Fix (Bug Fix)

Fixed a critical bug where new users invited via email would be logged in without a profile, causing foreign key constraint errors.

**Problem:** When a new user clicked an invite magic link:
1. Supabase created an `auth.users` record
2. The database trigger should create a `profiles` record, but there was a race condition
3. User was logged in and redirected to groups without a display name
4. Accepting the invite failed because `group_members.user_id` has a FK to `profiles.id`

**Solution:**
1. **AuthCallbackPage**: For `autoAcceptInvite` flow, check if user has a display name. If not, redirect to signup with `pendingInviteAccept` stored in localStorage.
2. **SignUpPage**: Added "complete your profile" mode for authenticated users without display names. After setting display name, auto-accepts any pending invite.
3. **Worker Handler**: Added safety check to ensure profile exists before inserting into `group_members`. Creates profile if missing.

**Files additionally modified:**
- `frontend/src/pages/AuthCallbackPage.tsx` - Check profile before accepting invite, redirect new users to signup
- `frontend/src/pages/SignUpPage.tsx` - Added `isCompletingProfile` mode with `useOnboard` hook
- `backend/apps/worker/src/handlers/members.handler.ts` - Profile existence check and creation before group join

### Invite Link Auto-Flow

Completely rewrote `InvitePage.tsx` to provide a seamless one-click join experience:

**Flow based on user state:**
1. **Authenticated user** → Auto-join group immediately, redirect to `/groups`
2. **Unauthenticated, has account** → Auto-send magic link, show "Check your email" message
3. **Unauthenticated, no account** → Redirect to `/signup` with `pendingInviteAccept` in localStorage

**New backend endpoints:**
- `GET /api/invites/:token/check-account` - Checks if invited email has an existing account
- `POST /api/invites/:token/send-magic-link` - Sends magic link to existing user

**Files:**
- `frontend/src/pages/InvitePage.tsx` - Complete rewrite with auto-flow logic
- `frontend/src/hooks/useCheckInviteAccount.ts` - New hook for account check
- `frontend/src/hooks/useSendInviteMagicLink.ts` - New hook for sending magic link
- `backend/apps/api/src/invites/invites.controller.ts` - New endpoints
- `backend/apps/api/src/invites/invites.service.ts` - New methods

### Custom Signup Email

Added a separate email template for new user signups, distinct from the login email:

| Flow | Email Subject | CTA Button |
|------|--------------|------------|
| Login (existing) | Supabase default | "Log In" |
| Signup (new) | "Finish creating your Broseph account" | "Finish Creating Account" |

**Implementation:**
- Uses Supabase's `generateLink` API to get magic link URL without sending email
- Sends custom email via nodemailer with branded template
- Same auth flow - user is logged in automatically

**Files:**
- `backend/apps/api/src/auth/auth.service.ts` - Added `sendSignupMagicLink()` method
- `backend/apps/api/src/auth/auth.controller.ts` - Added `POST /api/auth/signup-magic-link` endpoint
- `backend/apps/api/src/email/email.service.ts` - Added `sendSignupEmail()` with template
- `frontend/src/hooks/useSignupMagicLink.ts` - New hook for signup endpoint
- `frontend/src/pages/SignUpPage.tsx` - Uses `useSignupMagicLink` instead of `useMagicLink`

### Design Decisions

- Used `localStorage` for `pendingDisplayName` (not `sessionStorage`) so it persists when magic link opens in a new tab
- Email check happens before sending magic link for better UX feedback
- Warning messages use HeroUI's `text-warning` color with inline links
- `pendingInviteAccept` stored in localStorage to survive the signup flow for invited new users

## Acceptance Criteria

- [x] Login page displays with email-only input by default
- [x] Login page shows "Don't have an account? Sign up" link
- [x] Entering non-existent email shows warning with link to sign up
- [x] Entering existing email sends magic link and shows success
- [x] Sign Up page displays with email and display name inputs
- [x] Sign Up page shows warning if email already registered with link to login
- [x] Sign Up page sends magic link if email is new
- [x] "Check your email" message appears after sending magic link
- [x] Routing between Login and Sign Up pages works correctly
- [x] `/signin` redirects to `/login` for backwards compatibility
- [x] TypeScript type checking passes
- [x] Lint passes on new files
- [x] Invite links auto-join for authenticated users
- [x] Invite links auto-send magic link for existing users
- [x] Invite links redirect new users to signup
- [x] Custom signup email with "Finish creating your account" messaging

## Future Improvements

- Add rate limiting to `/api/auth/check-email` to prevent email enumeration
- Consider more efficient email lookup (current implementation lists all users)
- Social login options (Google, GitHub) could be added to both pages
