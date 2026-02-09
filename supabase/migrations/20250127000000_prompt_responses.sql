-- Prompt responses table for daily group prompts
CREATE TABLE public.prompt_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_id VARCHAR(10) NOT NULL,
    response_date DATE NOT NULL DEFAULT CURRENT_DATE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (group_id, user_id, response_date)
);

-- Index for fetching user's responses on a given date
CREATE INDEX idx_prompt_responses_user_date ON public.prompt_responses(user_id, response_date);

-- Index for fetching group feed (newest first)
CREATE INDEX idx_prompt_responses_group_created ON public.prompt_responses(group_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.prompt_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view prompt responses in groups they are members of
CREATE POLICY "Members can view prompt responses" ON public.prompt_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = prompt_responses.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can insert their own prompt responses in groups they are members of
CREATE POLICY "Members can insert own prompt responses" ON public.prompt_responses
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = prompt_responses.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- RLS Policy: Service role has full access for API operations
CREATE POLICY "Service role can manage prompt responses" ON public.prompt_responses
    FOR ALL USING (auth.role() = 'service_role');
