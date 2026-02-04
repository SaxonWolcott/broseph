# Task 006: Display Name Collection During Sign-Up

**Status:** Complete
**Created:** 2026-01-12
**Completed:** 2026-01-12

## Objective
Add display name collection during sign-up and show it throughout the app (chat messages, members list).

## Requirements
1. Modify sign-up form to collect display name + email
2. Store display name when magic link is confirmed
3. Display name appears next to messages in group chats
4. Display name appears in the "members" tab of each group

## Implementation Approach

### Key Insight
The `display_name` column already exists in the `profiles` table, and the UI components (`MessageBubble.tsx`, `MemberList.tsx`) already render display names. We just need to collect and save the data during sign-up.

### Strategy: localStorage Bridge
1. User enters display name + email on sign-up form
2. Display name stored in `localStorage` before sending magic link
3. After magic link callback, read from localStorage and call `/api/auth/onboard`
4. Chat and members UI automatically show the name

## Files Modified
- [x] `frontend/src/pages/SignInPage.tsx` - Add display name input, store in localStorage
- [x] `frontend/src/pages/AuthCallbackPage.tsx` - Read localStorage, call onboard API

## Acceptance Criteria
- [x] Sign-up form has required display name field
- [x] Display name saved to profile after magic link confirmation
- [x] Display name shows next to messages from other users
- [x] Display name shows in group members list

## Lessons Learned

### sessionStorage vs localStorage
Initially used `sessionStorage` but this failed because magic links open in a new browser tab, which has its own isolated sessionStorage. Switched to `localStorage` which persists across all tabs in the same browser.

| Storage Type | Scope | Use Case |
|--------------|-------|----------|
| `sessionStorage` | Per-tab | Single-tab workflows |
| `localStorage` | Per-browser | Cross-tab workflows (like magic links) |

### fetch() Error Handling
JavaScript's `fetch()` API doesn't throw on HTTP errors (400, 401, 500). Must check `response.ok` to detect API failures.

## Notes
- Display name is required (2-100 characters)
- Uses existing `/api/auth/onboard` endpoint - no backend changes needed
- Limitation: If user opens magic link on different device/browser, name won't be saved (acceptable for MVP)
