-- Group invites table for magic link invitations
CREATE TABLE public.group_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_token VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT invites_expiry_valid CHECK (expires_at > created_at)
);

-- Index for token lookup (primary query path)
CREATE INDEX idx_invites_token ON public.group_invites(invite_token);

-- Index for finding invites by group
CREATE INDEX idx_invites_group_id ON public.group_invites(group_id);

-- Partial index for finding valid (unexpired, unused) invites
CREATE INDEX idx_invites_valid ON public.group_invites(expires_at)
    WHERE used_at IS NULL;

-- Enable Row Level Security
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view valid invites by token (for accept flow preview)
-- This allows unauthenticated users to see invite details before signing in
CREATE POLICY "Anyone can view valid invites" ON public.group_invites
    FOR SELECT USING (
        used_at IS NULL AND expires_at > NOW()
    );

-- RLS Policy: Group members can view all invites for their groups
CREATE POLICY "Members can view group invites" ON public.group_invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_invites.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- RLS Policy: Service role has full access for worker operations
CREATE POLICY "Service role can manage invites" ON public.group_invites
    FOR ALL USING (auth.role() = 'service_role');
