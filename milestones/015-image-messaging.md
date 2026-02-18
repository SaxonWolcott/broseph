# Milestone 015: Image Messaging

**Completed:** 2026-02-18

## Summary
Added image attachment support to group chat messages. Users can now share images via a `+` menu on the message input bar, preview selected images before sending, and view images inline in chat bubbles with full-screen expand on click. Images support all existing messaging features including replies and optimistic updates.

## Key Changes
- `supabase/migrations/*_message_images.sql` - Added `image_url` column to messages, relaxed content constraint to allow image-only messages, created `message-images` storage bucket with RLS policies
- `backend/libs/shared/src/constants/limits.ts` - Added `MAX_IMAGE_SIZE_BYTES` constant (5MB)
- `backend/libs/shared/src/dto/messages.dto.ts` - Made `content` optional in `SendMessageDto`, added `imageUrl` to DTOs and reply preview
- `backend/libs/shared/src/dto/jobs/message-jobs.dto.ts` - Added `imageUrl` to job DTO
- `backend/apps/api/src/messages/messages.controller.ts` - Pass `imageUrl` through job payload
- `backend/apps/worker/src/handlers/messages.handler.ts` - Accept image-only messages, insert `image_url`
- `backend/apps/api/src/messages/messages.service.ts` - Select/map `image_url` in read path, image thumbnails in reply previews
- `frontend/src/types/messages.ts` - Added `imageUrl` to Message, ReplyToPreview, SendMessageRequest
- `frontend/src/hooks/useImageUpload.ts` - New hook for uploading images to Supabase Storage
- `frontend/src/hooks/useSendMessage.ts` - Support image upload, dual-message send (image + text), optimistic blob URLs
- `frontend/src/components/chat/MessageInput.tsx` - Added `+` button with popover menu, file picker, image preview bar
- `frontend/src/components/chat/MessageBubble.tsx` - Render images in bubbles with click-to-expand
- `frontend/src/components/chat/MessageList.tsx` - Image thumbnails in reply ghost previews, `onImageExpand` prop
- `frontend/src/pages/GroupChatPage.tsx` - Full-screen image modal, updated reply handler for image messages

## Decisions
- Kept message type as `'message'` (no new type) to avoid breaking the type union — images are just messages with an `image_url` field
- Frontend-direct upload to Supabase Storage (matching avatar upload pattern) rather than proxying through the API
- When sending image + text, two separate messages are created (image first, then text) to keep the data model simple
- Storage path `{groupId}/{userId}/{uuid}.{ext}` enables group membership RLS for uploads and per-user deletion policies
