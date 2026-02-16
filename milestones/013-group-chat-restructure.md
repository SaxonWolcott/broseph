# Milestone 013: Group Chat Restructure

**Completed:** 2026-02-12

## Summary

Pivoted Broseph from a two-tab social-media-style layout (Home feed + Groups list) to a group-chat-centric design. Prompts now live inside group chats as a collapsible header banner instead of on a separate home page. Removed the home page, bottom tab navigation, and all feed-related prompt code.

## Key Changes

- `reference/ROADMAP.md` — Rewrote with group-chat-first vision and updated upcoming work
- `reference/prompt-ui-playground.html` — Interactive playground comparing 4 prompt UI approaches (chose Header Banner)
- `frontend/src/App.tsx` — Removed `/home` route, removed MainLayout wrapper, redirect `/` to `/groups`
- `frontend/src/pages/GroupChatPage.tsx` — Integrated PromptBanner with useGroupPrompt hook
- `frontend/src/components/chat/PromptBanner.tsx` — New collapsible header banner for daily prompts
- `frontend/src/hooks/useGroupPrompt.ts` — New React Query hook for group-specific prompt data
- `frontend/src/hooks/useSubmitPromptResponse.ts` — Updated to invalidate group prompt query
- `frontend/src/types/prompts.ts` — Simplified to GroupPromptTodayResponse, removed feed types
- `backend/libs/shared/src/dto/prompts.dto.ts` — Added GroupPromptTodayDto, GroupPromptRespondentDto
- `backend/apps/api/src/prompts/prompts.controller.ts` — Added `GET /api/prompts/group/:groupId/today`
- `backend/apps/api/src/prompts/prompts.service.ts` — Added getGroupPromptToday(), system message on response
- Deleted: HomePage, BottomTabNav, MainLayout, PromptsToDo, PromptCard, PromptFeed, FeedItem, AnswerPromptModal, usePromptsToDo, usePromptFeed, useRealtimePromptResponses

## Decisions

- Chose Header Banner (Approach B) over inline card, bot message, and floating bar — best balance of visibility without disrupting chat flow
- System messages posted directly in submitResponse rather than via BullMQ — simpler for a single insert
- Kept old `/todo` and `/feed` endpoints in backend for now (can remove later) — avoids breaking changes if anything else references them
