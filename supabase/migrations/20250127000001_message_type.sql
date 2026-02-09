-- Add message type column to distinguish regular messages from system messages
ALTER TABLE public.messages ADD COLUMN type VARCHAR(20) DEFAULT 'message' NOT NULL;

-- Allow system messages to have no sender
ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;
