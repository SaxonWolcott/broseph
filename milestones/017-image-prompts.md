# Milestone 017: Image Prompts

**Completed:** 2026-02-18

## Summary

Added image prompt support to Broseph. Prompts can now have a `responseType` of `'text'` or `'image'`, with image prompts showing a photo picker instead of a textarea. Image responses display as thumbnails in the respondent list, inline images in chat cards, and expandable images in the response modal.

## Key Changes

- `backend/libs/shared/src/constants/sample-prompts.ts` - Added `responseType` to `SamplePrompt` interface, added 10 image-specific prompts (p21-p30), original text prompts keep `responseType: 'text'`
- `supabase/migrations/*_add_image_url_to_prompt_responses.sql` - Added `image_url TEXT` column, relaxed `content NOT NULL`, added CHECK constraint requiring content or image
- `backend/libs/shared/src/dto/prompts.dto.ts` - Added `imageUrl` to `SubmitPromptResponseDto`, `FeedItemDto`, `GroupPromptRespondentDto`; added `responseType` to `PromptDto`; used `@IsUrl({ require_tld: false })` for localhost compatibility
- `backend/apps/api/src/prompts/prompts.service.ts` - Handle `imageUrl` in submit (stores in `prompt_responses.image_url` + `messages.image_urls`), include in read paths
- `backend/apps/api/src/prompts/prompts.controller.ts` - Pass `imageUrl` through to service
- `frontend/src/types/prompts.ts` - Added `responseType` to `Prompt`, `imageUrl` to `PromptRespondent` + `SubmitPromptRequest`
- `frontend/src/components/chat/PromptBanner.tsx` - Image picker UI for image prompts, image thumbnails in respondent list, camera icon; keeps preview visible during upload
- `frontend/src/components/chat/PromptResponseCard.tsx` - Renders image instead of text for image responses
- `frontend/src/components/chat/PromptResponseModal.tsx` - Renders image instead of text in modal view
- `frontend/src/pages/GroupChatPage.tsx` - Uploads image via `useImageUpload` before submitting prompt response, `isSubmitting` includes upload state

## Decisions

- Reused existing `useImageUpload` hook and `message-images` storage bucket rather than creating separate storage
- Image prompt responses store the URL in both `prompt_responses.image_url` and `messages.image_urls` array for consistent rendering in chat
- `content` column relaxed to nullable with CHECK constraint ensuring either content or image_url is present
- Used `@IsUrl({ require_tld: false })` to support localhost Supabase URLs in development
- Image preview stays visible during async upload+submit rather than clearing eagerly, preventing the image from vanishing before the operation completes
