# Milestone 018: Emoji Reactions

**Completed:** 2026-02-26

## Summary

Added Slack/Discord-style emoji reactions to messages. Users can react with any emoji via a quick-reaction bar (6 presets) or a full emoji picker (emoji-mart). Reactions display as pills below message bubbles with counts and highlighted state. Optimistic updates and Supabase Realtime keep the UI instant and synchronized across clients.

## Key Changes

- `supabase/migrations/20260226..._add_message_reactions.sql` - New `message_reactions` table with unique constraint on (message_id, user_id, emoji), RLS policies, and realtime enabled
- `backend/libs/shared/src/dto/messages.dto.ts` - Added `ToggleReactionDto`, `ReactionDto`, `ToggleReactionResponseDto`; added `reactions` field to `MessageDto`
- `backend/apps/api/src/messages/reactions.service.ts` - New service with `toggleReaction` (upsert/delete) and `batchFetchReactions` (enrichment for getMessages)
- `backend/apps/api/src/messages/messages.controller.ts` - Added `PUT :messageId/reactions` endpoint; threaded `userId` to `getMessages`
- `backend/apps/api/src/messages/messages.service.ts` - Integrated `batchFetchReactions` into message enrichment pipeline
- `frontend/src/types/messages.ts` - Added `Reaction` and `ToggleReactionResponse` interfaces
- `frontend/src/hooks/useToggleReaction.ts` - Mutation hook with optimistic cache updates
- `frontend/src/hooks/useRealtimeReactions.ts` - Realtime subscription for reaction INSERT/DELETE events
- `frontend/src/components/chat/ReactionPills.tsx` - Pill row below messages (emoji + count, highlighted if user reacted)
- `frontend/src/components/chat/QuickReactionMenu.tsx` - Floating horizontal bar with 6 preset emojis + search icon
- `frontend/src/components/chat/EmojiPickerPopover.tsx` - Full emoji picker wrapping @emoji-mart/react
- `frontend/src/components/chat/MessageBubble.tsx` - Added smiley face button, wired menus and pills
- `frontend/src/components/chat/MessageList.tsx` - Threaded `onReactToMessage` prop
- `frontend/src/components/chat/MessageInput.tsx` - Added emoji picker button next to send button for desktop emoji input
- `frontend/src/pages/GroupChatPage.tsx` - Wired `useToggleReaction` and `useRealtimeReactions`

## Decisions

- Used direct API call (PUT toggle) instead of BullMQ queue since reactions are simple upserts with no background processing needed
- Realtime listens globally on `message_reactions` table (can't filter by group_id since column doesn't exist on reactions table) — acceptable since users are only on one chat page at a time
- Chose emoji-mart for the full picker (widely used, searchable, dark theme support)
