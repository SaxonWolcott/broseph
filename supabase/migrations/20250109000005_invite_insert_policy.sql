-- Add INSERT policy for group_invites table
-- Allows group members to create invites for their groups
-- Uses the is_group_member() function from 20250109000003_fix_rls_recursion.sql

CREATE POLICY "Members can create invites" ON public.group_invites
    FOR INSERT WITH CHECK (
        public.is_group_member(group_id)
        AND invited_by = auth.uid()
    );
