-- Add reply_to_id FK for general message replies (iMessage-style)
ALTER TABLE public.messages
  ADD COLUMN reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;

CREATE INDEX idx_messages_reply_to_id
  ON public.messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
