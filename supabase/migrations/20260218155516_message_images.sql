-- Add image_url column
ALTER TABLE public.messages ADD COLUMN image_url TEXT;

-- Drop old content constraint (requires content 1-2000 chars)
ALTER TABLE public.messages DROP CONSTRAINT messages_content_length;

-- New constraint: must have content OR image_url (or both)
ALTER TABLE public.messages ADD CONSTRAINT messages_content_or_image
  CHECK (
    (char_length(content) >= 1 AND char_length(content) <= 2000)
    OR image_url IS NOT NULL
  );

-- Create message-images storage bucket (public read, 5MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('message-images', 'message-images', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

-- Storage policies: public read, group members can upload, users can delete own
CREATE POLICY "Public read access for message images"
  ON storage.objects FOR SELECT USING (bucket_id = 'message-images');

CREATE POLICY "Group members can upload message images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'message-images'
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = (storage.foldername(name))[1]::uuid
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own message images"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'message-images'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );
