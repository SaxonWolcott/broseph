-- Fix infinite recursion in group_members RLS policy
-- The original policy queried group_members within itself, causing recursion.
-- Solution: Use SECURITY DEFINER functions that bypass RLS.

-- Drop the problematic policies
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Members can view groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view profiles of group members" ON public.profiles;
DROP POLICY IF EXISTS "Members can view messages" ON public.messages;

-- Create a SECURITY DEFINER function to check group membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_group_member(check_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = check_group_id
        AND user_id = auth.uid()
    );
$$;

-- Create a SECURITY DEFINER function to get user's group IDs
CREATE OR REPLACE FUNCTION public.get_user_group_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid();
$$;

-- Re-create group_members policy using the function
CREATE POLICY "Members can view group members" ON public.group_members
    FOR SELECT USING (public.is_group_member(group_id));

-- Re-create groups policy using the function
CREATE POLICY "Members can view groups" ON public.groups
    FOR SELECT USING (public.is_group_member(id));

-- Re-create messages policy using the function
CREATE POLICY "Members can view messages" ON public.messages
    FOR SELECT USING (public.is_group_member(group_id));

-- Re-create profiles policy - users can see profiles of people in their groups
CREATE POLICY "Users can view profiles of group members" ON public.profiles
    FOR SELECT USING (
        id IN (
            SELECT user_id FROM public.group_members
            WHERE group_id IN (SELECT public.get_user_group_ids())
        )
        OR id = auth.uid()  -- Always can see own profile
    );
