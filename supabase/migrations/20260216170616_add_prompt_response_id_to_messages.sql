-- Add prompt_response_id FK to messages for linking prompt responses and replies
ALTER TABLE public.messages
  ADD COLUMN prompt_response_id UUID REFERENCES public.prompt_responses(id) ON DELETE SET NULL;

-- Partial index for efficient lookups of messages linked to prompt responses
CREATE INDEX idx_messages_prompt_response_id
  ON public.messages(prompt_response_id) WHERE prompt_response_id IS NOT NULL;
