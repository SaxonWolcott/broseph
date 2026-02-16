# Milestone 014: Prompt Responses in Chat, Comments, Replies & Timestamps

**Completed:** 2026-02-16

## Summary
Made prompt responses first-class citizens of the chat stream with special cards, a tap-to-expand bottom sheet modal, and threaded comments. Added two distinct interaction modes: "Comment" (popup-only, visible in modal/banner) and "Reply in chat" (iMessage-style ghost preview in the stream). Extended reply-in-chat to all messages with scroll-to-original behavior. Replaced per-message timestamps with smart conversation-start markers and click-to-reveal individual times.

## Key Changes

### Database
- `supabase/migrations/` - Added `prompt_response_id` and `reply_to_id` FK columns to messages table with partial indexes

### Backend DTOs
- `backend/libs/shared/src/dto/messages.dto.ts` - Expanded MessageDto with `prompt_response` type, promptResponseId, promptData, replyCount, replyToId, replyToPreview; added promptResponseId, replyInChat, replyToId to SendMessageDto
- `backend/libs/shared/src/dto/prompts.dto.ts` - Expanded GroupPromptRespondentDto with avatarUrl, responseId, content, createdAt, replyCount; added PromptResponseReplyDto + PromptResponseRepliesListDto
- `backend/libs/shared/src/dto/jobs/message-jobs.dto.ts` - Added promptResponseId, replyInChat, replyToId to SendMessageJobDto

### Backend Services
- `backend/apps/api/src/prompts/prompts.service.ts` - submitResponse creates prompt_response message; getGroupPromptToday returns full response data + comment counts; new getResponseReplies method
- `backend/apps/api/src/prompts/prompts.controller.ts` - New `GET /api/prompts/responses/:responseId/replies` endpoint
- `backend/apps/api/src/messages/messages.service.ts` - getMessages enriches prompt_response messages with prompt text/category/reply counts, enriches reply-to messages with sender preview data, filters out prompt_reply type from stream
- `backend/apps/api/src/messages/messages.controller.ts` - Passes promptResponseId, replyInChat, replyToId to BullMQ job
- `backend/apps/worker/src/handlers/messages.handler.ts` - Sets message type based on replyInChat flag (`prompt_reply` vs `message`), includes prompt_response_id and reply_to_id in insert

### Frontend Components
- `frontend/src/components/chat/PromptResponseCard.tsx` - NEW: bubble-style gradient card with "Comment" and "Reply in chat" buttons
- `frontend/src/components/chat/PromptResponseModal.tsx` - NEW: bottom sheet modal with full response, threaded comments via usePromptResponseReplies
- `frontend/src/components/chat/MessageList.tsx` - Prompt response rendering branch, ReplyGhost + MessageReplyGhost components for iMessage-style quoted replies, scroll-to-original on ghost click, conversation-start markers (1hr gap), selected message state for click-to-reveal timestamps
- `frontend/src/components/chat/MessageBubble.tsx` - Reply button on hover, click-to-reveal timestamp (one at a time), removed always-visible time
- `frontend/src/components/chat/PromptBanner.tsx` - Scrollable respondent list with content preview, inline comments display via "Show comments" toggle
- `frontend/src/components/chat/MessageInput.tsx` - Reply context bar supporting prompt comments, reply-in-chat, and general message replies

### Frontend Hooks & Types
- `frontend/src/types/messages.ts` - Added PromptData, ReplyToPreview interfaces; expanded Message and SendMessageRequest
- `frontend/src/types/prompts.ts` - Expanded PromptRespondent, added PromptResponseReply types
- `frontend/src/hooks/usePromptResponseReplies.ts` - NEW: fetches comments for a prompt response
- `frontend/src/hooks/useSendMessage.ts` - Supports promptResponseId, replyInChat, replyToId
- `frontend/src/hooks/useSubmitPromptResponse.ts` - Invalidates messages cache on success
- `frontend/src/pages/GroupChatPage.tsx` - Reply context state wiring for all reply types

### Reference
- `reference/prompt-response-playground.html` - NEW: design playground with card/popup/banner variations

## Decisions
- **Comment vs Reply-in-chat split**: "Comment" creates a `prompt_reply` message type (hidden from chat stream, visible only in popup/banner). "Reply in chat" creates a regular `message` with `prompt_response_id` (visible in stream with ghost preview).
- **Bubble-style card + bottom sheet**: Chose gradient bubble card and bottom sheet modal over alternatives from the design playground.
- **Conversation-start markers**: Replaced per-message timestamps with smart markers at 1hr gaps (Today/Yesterday/Weekday/Full date + time). Individual times revealed on tap.
- **Reply to any message**: `reply_to_id` FK on messages table enables replying to any message type, not just prompt responses. Ghost previews are clickable to scroll to the original.
