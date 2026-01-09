-- Add foreign key from group_members to profiles to enable PostgREST joins
-- This is safe because profiles.id always equals auth.users.id (same user)

-- Add FK constraint (this enables the join syntax in Supabase queries)
ALTER TABLE public.group_members
ADD CONSTRAINT group_members_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also add FK from messages.sender_id to profiles for the same reason
ALTER TABLE public.messages
ADD CONSTRAINT messages_sender_id_profiles_fkey
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- And from group_invites.invited_by to profiles
ALTER TABLE public.group_invites
ADD CONSTRAINT group_invites_invited_by_profiles_fkey
FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
