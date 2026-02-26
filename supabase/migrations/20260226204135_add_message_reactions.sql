-- Migration: 20260226204135_add_message_reactions.sql
-- Description: Creates message_reactions table with RLS policies and realtime support
-- Rollback: DROP TABLE IF EXISTS public.message_reactions CASCADE;

-- ============================================
-- MESSAGE REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT message_reactions_unique UNIQUE (message_id, user_id, emoji)
);

-- Index for fast lookups by message
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- SELECT: users can read reactions on messages in groups they are members of
-- Uses the existing is_group_member() SECURITY DEFINER function to avoid RLS recursion
CREATE POLICY "Members can view message reactions" ON public.message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messages
            WHERE messages.id = message_reactions.message_id
            AND public.is_group_member(messages.group_id)
        )
    );

-- INSERT: users can add reactions to messages in groups they are members of
-- user_id must match the authenticated user
CREATE POLICY "Members can insert message reactions" ON public.message_reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.messages
            WHERE messages.id = message_reactions.message_id
            AND public.is_group_member(messages.group_id)
        )
    );

-- DELETE: users can only delete their own reactions
CREATE POLICY "Users can delete own message reactions" ON public.message_reactions
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- Service role has full access for worker operations
CREATE POLICY "Service role can manage message reactions" ON public.message_reactions
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.message_reactions IS 'Emoji reactions on messages within group chats';
COMMENT ON COLUMN public.message_reactions.emoji IS 'Unicode emoji string representing the reaction';
