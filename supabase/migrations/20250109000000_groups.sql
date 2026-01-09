-- Groups table for chat groups
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT groups_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 50)
);

-- Index for finding groups by owner
CREATE INDEX idx_groups_owner_id ON public.groups(owner_id);

-- Trigger for updated_at
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Group members junction table
CREATE TABLE public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT group_members_unique UNIQUE (group_id, user_id),
    CONSTRAINT group_members_role_check CHECK (role IN ('owner', 'member'))
);

-- Indexes for efficient queries
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view groups they are members of
CREATE POLICY "Members can view groups" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

-- RLS Policy: Service role has full access for worker operations
CREATE POLICY "Service role can manage groups" ON public.groups
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policy: Users can view members of groups they belong to
CREATE POLICY "Members can view group members" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

-- RLS Policy: Service role has full access for worker operations
CREATE POLICY "Service role can manage group members" ON public.group_members
    FOR ALL USING (auth.role() = 'service_role');

-- Add policy to allow users to view profiles of group members (for display names)
CREATE POLICY "Users can view profiles of group members" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm1
            JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
            WHERE gm1.user_id = auth.uid()
            AND gm2.user_id = profiles.id
        )
    );
