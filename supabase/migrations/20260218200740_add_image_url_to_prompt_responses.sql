-- Add image_url column for image prompt responses
ALTER TABLE public.prompt_responses ADD COLUMN image_url TEXT;

-- Make content nullable (image responses may have no text)
ALTER TABLE public.prompt_responses ALTER COLUMN content DROP NOT NULL;
ALTER TABLE public.prompt_responses ALTER COLUMN content SET DEFAULT '';

-- Ensure every response has either content or an image
ALTER TABLE public.prompt_responses ADD CONSTRAINT prompt_responses_content_or_image
  CHECK (
    (content IS NOT NULL AND char_length(content) >= 1)
    OR (image_url IS NOT NULL)
  );
