-- Profiles table (canonical user identity linked to auth.users)
-- The id column IS the auth.users.id - this is the stable user identifier across all auth methods
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    handle VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Unique index on handle (ignores nulls - users can have null handle until onboarding)
CREATE UNIQUE INDEX idx_profiles_handle ON public.profiles(handle) WHERE handle IS NOT NULL;

-- Reuse existing updated_at trigger function from initial_schema migration
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: User can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- RLS Policy: User can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policy: Service role has full access (for backend admin operations)
CREATE POLICY "Service role can manage profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Function to auto-create profile when a new user signs up
-- SECURITY DEFINER runs with owner privileges (bypasses RLS)
-- This ensures profile is created even from auth context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Trigger on auth.users to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- NOTE: Future tables for multiple verified emails/phones (user_emails, user_phones)
-- are NOT implemented in this migration. When we add phone OTP or Apple/Google auth,
-- those methods will be linked to the same auth.users row via Supabase's identity linking.
-- The profiles.id will remain stable across all auth methods for a given user.
