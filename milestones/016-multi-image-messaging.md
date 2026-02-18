# Milestone 016: Multi-Image Messaging

**Completed:** 2026-02-18

## Summary
Upgraded from single-image to multi-image messaging (up to 10 images per message). Images and text are now sent as a single unified message. Added an iMessage-style card stack component with hover navigation arrows, dot indicators, and framer-motion transitions. Full-screen gallery modal supports left/right navigation across all images.

## Key Changes
- `supabase/migrations/` - New migration converting `image_url TEXT` to `image_urls TEXT[]` with max-10 constraint
- `backend/libs/shared/src/constants/limits.ts` - Added `MAX_IMAGES_PER_MESSAGE: 10`
- `backend/libs/shared/src/dto/messages.dto.ts` - `imageUrl` -> `imageUrls` (string array) with `@IsArray` + `@ArrayMaxSize` validators
- `backend/libs/shared/src/dto/jobs/message-jobs.dto.ts` - `imageUrl` -> `imageUrls` array
- `backend/apps/api/src/messages/messages.controller.ts` - Pass `imageUrls` array to job queue
- `backend/apps/worker/src/handlers/messages.handler.ts` - Insert `image_urls` array column
- `backend/apps/api/src/messages/messages.service.ts` - Select/map `image_urls`, multi-image reply previews
- `frontend/src/types/messages.ts` - All types updated to `imageUrls: string[] | null`
- `frontend/src/hooks/useImageUpload.ts` - Added `uploadImages` batch method with `Promise.all`
- `frontend/src/hooks/useSendMessage.ts` - Single message with `imageFiles[]`, unified optimistic update
- `frontend/src/components/chat/MessageInput.tsx` - Multi-select file input, horizontal scroll preview row
- `frontend/src/components/chat/ImageCardStack.tsx` - **New** card stack component with framer-motion
- `frontend/src/components/chat/MessageBubble.tsx` - Uses `ImageCardStack` instead of single `<img>`
- `frontend/src/components/chat/MessageList.tsx` - Multi-image reply ghost with thumbnail + "+N" badge
- `frontend/src/pages/GroupChatPage.tsx` - Full-screen gallery modal with left/right navigation

## Decisions
- Chose PostgreSQL `TEXT[]` over a separate `message_images` junction table for simplicity — array is sufficient for a max of 10 URLs
- Images + text are ONE message (not split into separate messages) for cleaner UX
- Card stack uses CSS transforms for decorative back-cards rather than rendering actual images, keeping DOM lightweight
