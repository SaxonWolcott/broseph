-- Enable Supabase Realtime for messages and group_members tables
-- This allows real-time subscriptions to INSERT/UPDATE/DELETE events

-- Enable realtime for messages table (for instant message delivery)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for group_members table (for instant member updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
