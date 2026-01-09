-- Messages table for group chat messages
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT messages_content_length CHECK (
        char_length(content) >= 1 AND char_length(content) <= 2000
    )
);

-- Composite index for cursor pagination (group_id + created_at DESC)
CREATE INDEX idx_messages_group_created ON public.messages(group_id, created_at DESC);

-- Index for finding messages by sender
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view messages in groups they are members of
CREATE POLICY "Members can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = messages.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- RLS Policy: Service role has full access for worker operations
CREATE POLICY "Service role can manage messages" ON public.messages
    FOR ALL USING (auth.role() = 'service_role');
