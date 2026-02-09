# Task 009: Profile Icon in Groups Menu

## Summary

**Status:** In Progress
**Started:** 2026-01-21

Add a profile icon to the main groups menu that enables users to view and edit their profile information (display name and profile picture). The icon appears in the bottom right corner of the screen and opens a modal overlay when clicked.

## Progress Summary

- [ ] Step 1: Design profile modal component with HeroUI
- [ ] Step 2: Create profile update API endpoints
- [ ] Step 3: Implement Supabase Storage integration for profile pictures
- [ ] Step 4: Add profile icon button to groups menu layout
- [ ] Step 5: Implement modal open/close behavior with overlay
- [ ] Step 6: Add display name editing functionality
- [ ] Step 7: Add profile picture upload functionality
- [ ] Step 8: Test modal closing (X button and click outside)
- [ ] Step 9: Style and position icon in bottom right
- [ ] Step 10: Verify complete end-to-end workflow

## Overview

This task adds user profile management to Broseph's main interface. Users can click a profile icon (located in the bottom right of the groups menu) to open a modal that allows them to:
- View and edit their display name
- Upload and manage a profile picture stored in Supabase Storage
- See a circular profile icon showing their avatar or a default image

The implementation focuses on a clean, mobile-optimized UI using HeroUI components and seamless integration with Supabase for storage and profile updates.

## What Needs to Be Implemented

### 1. Profile Modal Component

**Description:**
A reusable HeroUI Modal component that displays profile editing form. Should include:
- Display name input field
- Profile picture upload area with preview
- X button to close modal (HeroUI provides this)
- Click-outside detection to close

**Files to create:**
- `frontend/src/components/ProfileModal.tsx` - Main modal component
- `frontend/src/hooks/useProfileUpdate.ts` - React Query hook for profile mutations

**Files to modify:**
- `frontend/src/pages/GroupsPage.tsx` - Add profile icon and modal trigger

### 2. Backend Profile Update Endpoints

**Description:**
Extend the API to support profile updates. Need:
- PATCH endpoint to update display name
- Separate handling for profile picture (may use presigned URL approach)

**Files to create:**
- `backend/apps/api/src/profiles/profiles.controller.ts` - Controller for profile endpoints
- `backend/apps/api/src/profiles/profiles.service.ts` - Service for profile operations

**Files to modify:**
- `backend/apps/api/src/app.module.ts` - Register ProfilesModule
- `backend/libs/shared/src/dtos/profile.dto.ts` - Create/update profile DTOs

### 3. Supabase Storage Integration

**Description:**
Set up Supabase Storage bucket for profile pictures:
- Create `profile-pictures` bucket (private, with auth)
- Implement upload function with presigned URL generation
- Delete old picture when new one uploaded

**Files to modify:**
- `backend/apps/api/src/profiles/profiles.service.ts` - Storage operations
- `.env.example` - Add SUPABASE_STORAGE_BUCKET if needed

### 4. Frontend Profile Picture Upload

**Description:**
Implement file upload UI using HeroUI components:
- Drag-and-drop or click-to-upload area
- Image preview before save
- Loading state while uploading
- Error handling and feedback

**Files to modify:**
- `frontend/src/components/ProfileModal.tsx` - Add upload UI

### 5. Profile Icon Display

**Description:**
Create circular avatar component showing:
- Uploaded profile picture if available
- Default avatar/initials if not
- Position in bottom right corner of groups menu
- Hover effect indicating clickability

**Files to create:**
- `frontend/src/components/ProfileIcon.tsx` - Avatar component

**Files to modify:**
- `frontend/src/pages/GroupsPage.tsx` - Add icon to layout

## Acceptance Criteria (To Verify)

- [ ] Profile icon is visible in bottom right corner of groups menu
- [ ] Clicking profile icon opens modal overlay
- [ ] Modal displays user's current display name
- [ ] User can edit display name and save changes
- [ ] Modal shows profile picture upload area
- [ ] User can drag-and-drop or click to upload profile picture
- [ ] Uploaded picture appears in profile icon immediately
- [ ] Uploaded pictures are stored in Supabase Storage
- [ ] Modal closes when clicking X button
- [ ] Modal closes when clicking outside the modal
- [ ] Profile changes persist after page refresh
- [ ] Loading states display while saving
- [ ] Error messages show if upload fails

## Files Involved

### New Files

*Frontend Components:*
- `frontend/src/components/ProfileModal.tsx` - Modal with profile editing form
- `frontend/src/components/ProfileIcon.tsx` - Circular avatar component in bottom right
- `frontend/src/hooks/useProfileUpdate.ts` - React Query hook for profile mutations

*Backend:*
- `backend/apps/api/src/profiles/profiles.controller.ts` - Profile update endpoints
- `backend/apps/api/src/profiles/profiles.service.ts` - Profile business logic
- `backend/apps/api/src/profiles/profiles.module.ts` - Module definition

*Shared:*
- `backend/libs/shared/src/dtos/profile.dto.ts` - Profile update DTOs (if not already exists)

### Modified Files

*Frontend:*
- `frontend/src/pages/GroupsPage.tsx` - Add ProfileIcon and ProfileModal components
- `frontend/src/App.tsx` - Ensure profile routes/context available if needed

*Backend:*
- `backend/apps/api/src/app.module.ts` - Register ProfilesModule
- `.env.example` - Document any new environment variables for storage

## Dependencies

**Frontend:**
- HeroUI (already present) - Modal, Input, Button components
- React Query (already present) - State management for mutations
- Supabase client (already present) - Storage integration

**Backend:**
- NestJS (already present)
- Supabase (already present)

**No new npm packages required** - use existing dependencies.

## Implementation Notes

### Architecture Decisions

1. **Modal over inline editing**: Using a modal keeps the groups menu clean and focuses attention on profile editing
2. **Supabase Storage for pictures**: Leverages existing Supabase integration for secure, scalable image storage
3. **Presigned URLs**: Consider using presigned URLs to allow direct client uploads to Storage with proper auth
4. **Profile icon in bottom right**: Follows mobile-first UI pattern for easy thumb access on mobile devices

### Storage Bucket Setup

The Supabase Storage bucket should be created with:
- Bucket name: `profile-pictures`
- Private access (not public)
- RLS policies allowing users to read/write only their own pictures

Example path structure: `profiles/{user_id}/picture.{ext}`

### Database Considerations

The `profiles` table likely already has:
- `id` (user_id)
- `display_name`
- `profile_picture_url` (field to store Supabase Storage URL)

Verify existing schema before implementation.

## Lessons Learned

*To be updated during implementation*

- [Implementation notes will be captured here as work progresses]

## Known Limitations

*To be updated during implementation*

- Current limitation descriptions will be added here

## Future Improvements

- Profile bio/description field
- Social media links in profile
- Profile visibility settings
- Delete account functionality
- Multiple profile pictures / gallery
