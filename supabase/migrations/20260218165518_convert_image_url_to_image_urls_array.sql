-- Convert image_url TEXT to image_urls TEXT[]
ALTER TABLE public.messages ADD COLUMN image_urls TEXT[];

-- Migrate existing data
UPDATE public.messages SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL;

-- Drop old constraint and column
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_content_or_image;
ALTER TABLE public.messages DROP COLUMN image_url;

-- Add new constraints
ALTER TABLE public.messages ADD CONSTRAINT messages_content_or_images
  CHECK (
    (char_length(content) >= 1 AND char_length(content) <= 2000)
    OR (image_urls IS NOT NULL AND array_length(image_urls, 1) > 0)
  );

ALTER TABLE public.messages ADD CONSTRAINT messages_max_images
  CHECK (image_urls IS NULL OR array_length(image_urls, 1) <= 10);
