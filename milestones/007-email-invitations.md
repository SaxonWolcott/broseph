# Task 007: Email-Based Group Invitations

**Status:** Complete
**Created:** 2026-01-13
**Completed:** 2026-01-13

## Objective
Replace the "generate link" invite flow with direct email invitations, and fix the pending invite persistence issue.

## Requirements
1. Replace "Generate Link" popup with "Enter Email" input field
2. Send invite email directly to the entered email address
3. Fix issue where pending invites are forgotten after sign-in

## Implementation Approach

### Key Changes:
1. **Fix pending invite storage**: Change `sessionStorage` → `localStorage` (same fix as display name)
2. **Add email service**: Use nodemailer with Supabase's Inbucket for local dev
3. **Update invite flow**: Email input → Send email → Success message
4. **Make email required**: Update DTO validation

## Files Modified
- [x] `frontend/src/pages/InvitePage.tsx` - Fix sessionStorage → localStorage
- [x] `frontend/src/pages/AuthCallbackPage.tsx` - Fix sessionStorage → localStorage
- [x] `frontend/src/components/invites/InviteModal.tsx` - Replace UI with email input
- [x] `frontend/src/hooks/useCreateInvite.ts` - Pass email in request
- [x] `backend/apps/api/src/email/email.service.ts` - NEW: Email sending service
- [x] `backend/apps/api/src/email/email.module.ts` - NEW: Email module
- [x] `backend/apps/api/src/app.module.ts` - Import EmailModule
- [x] `backend/apps/api/src/invites/invites.service.ts` - Send email after creating invite
- [x] `backend/libs/shared/src/dto/invites.dto.ts` - Make email required
- [x] `.env.example` - Add SMTP configuration

## Acceptance Criteria (Verified)
- [x] Invite modal shows email input instead of generate link button
- [x] Email is sent to the entered address with Supabase magic link
- [x] One-click join: clicking invite link authenticates AND auto-accepts group invite
- [x] Pending invites persist across browser tabs using localStorage
- [x] Groups appear immediately after creation (polling race condition fixed)
- [x] TypeScript validation passing

## Implementation Summary

### Backend Changes

**1. Email Service** (`backend/apps/api/src/email/email.service.ts`)
- New EmailService using nodemailer for SMTP
- Configured for Supabase's Inbucket (localhost:54325) for local development
- sendInviteEmail method available for fallback emails
- Structured logging for debugging

**2. Email Module** (`backend/apps/api/src/email/email.module.ts`)
- Global module exporting EmailService for use across the application

**3. Invites Service** (`backend/apps/api/src/invites/invites.service.ts`)
- Modified createInvite to send Supabase magic link using signInWithOtp
- Magic link redirect URL includes autoAcceptInvite query parameter for one-click join
- Added sendMagicLinkForInvite method for resending links to users
- Magic link expires in 24 hours per Supabase defaults

**4. Invites Controller** (`backend/apps/api/src/invites/invites.controller.ts`)
- Added POST /api/invites/:token/send-magic-link endpoint for resending links

**5. DTOs** (`backend/libs/shared/src/dto/invites.dto.ts`)
- Made email field required in CreateInviteDto
- Added MagicLinkSentDto for response validation

### Frontend Changes

**1. Invite Modal** (`frontend/src/components/invites/InviteModal.tsx`)
- Replaced "Generate Link" button with email input form
- Shows success state and spinner during submission
- Email input with validation
- Retry capability if sending fails

**2. Invite Page** (`frontend/src/pages/InvitePage.tsx`)
- Changed sessionStorage to localStorage for pending invite persistence
- Updated UI for one-click join flow
- Added "Send me a link to join" option in the invite flow

**3. Auth Callback Page** (`frontend/src/pages/AuthCallbackPage.tsx`)
- Handles autoAcceptInvite query parameter for one-click join
- Auto-accepts invite after authentication
- User is added to group without additional clicks

**4. Magic Link Hook** (`frontend/src/hooks/useSendInviteMagicLink.ts` - NEW)
- React Query hook for sending magic link invites
- Handles email validation and submission
- Loading and error states

**5. Group Creation Hook** (`frontend/src/hooks/useCreateGroup.ts`)
- Added waitForNewGroup polling to fix race condition
- Groups now appear immediately after creation in the sidebar
- Prevents redirect-before-sync issues

### Configuration
- `.env.example` updated with SMTP_HOST, SMTP_PORT, SMTP_FROM variables

## Key Features Implemented

1. **One-Click Join Flow**
   - User receives email with magic link
   - Clicking link authenticates user (if not already signed in)
   - User is automatically added to the group
   - No additional accept/confirm step needed

2. **Persistent Pending Invites**
   - Uses localStorage instead of sessionStorage
   - Pending invites survive across browser tabs
   - Same approach as display name storage

3. **Immediate Group Visibility**
   - Fixed race condition where group appears after redirect
   - Polling ensures group is synced before user sees the page
   - Better UX for newly created groups

4. **Email Fallback Capability**
   - emailService.sendInviteEmail available if needed
   - Uses nodemailer for SMTP delivery
   - Configurable via environment variables

## Notes
- Using Supabase's magic link OTP for authentication + invite link (two-in-one)
- Local dev uses Supabase's Inbucket (port 54325 for SMTP, 54324 for web UI)
- Magic links expire in 24 hours per Supabase defaults
- Email addresses are case-insensitive in invites
- Invite tokens remain valid across multiple resend requests
