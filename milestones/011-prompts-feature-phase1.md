# Milestone 011: Prompts Feature Phase 1 - Cleanup, Realtime, Type Safety

**Completed:** 2026-02-09

## Summary
Stabilized the Daily Conversation Prompts feature (Phase 1 of 2). Removed debug artifacts, added real-time feed updates via Supabase Realtime subscription, and tightened message type safety across the full stack. The prompts feature was ~80% built; this milestone closes cleanup and realtime gaps.

## Key Changes
- `frontend/src/pages/HomePage.tsx` - Removed debug console.log statements, wired in useRealtimePromptResponses hook
- `frontend/src/hooks/useRealtimePromptResponses.ts` - NEW: Supabase Realtime subscription for prompt_responses table, invalidates feed + todo caches on INSERT
- `backend/libs/shared/src/dto/messages.dto.ts` - Changed `type` from generic `string` to `'message' | 'system'` union
- `frontend/src/types/messages.ts` - Made `type` field required (was optional)
- `backend/apps/api/src/messages/messages.service.ts` - Fixed type cast to match stricter union type
- `frontend/src/hooks/useSendMessage.ts` - Added `type: 'message'` to optimistic update object

## Decisions
- Subscribed to ALL prompt_responses inserts (no groupId filter) because HomePage shows feed across all user's groups
- Made message `type` required on frontend since backend always provides a default value — this surfaced two latent type bugs that we fixed

## Next Steps (Phase 2)
- Post system message when someone answers a prompt
- Add feed pagination (currently hardcoded to 50 items)
- Handle 409 "already answered" error gracefully in UI
