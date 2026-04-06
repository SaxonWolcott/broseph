-- Migration: 20260406000000_payment_requests.sql
-- Description: Creates payment_requests and payment_items tables for Stripe-backed group payments
-- Rollback: DROP TABLE IF EXISTS public.payment_items CASCADE; DROP TABLE IF EXISTS public.payment_requests CASCADE;

-- ============================================
-- PAYMENT REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('per_item', 'per_person', 'direct')),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_amount_cents INTEGER NOT NULL CHECK (total_amount_cents > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_payment_message UNIQUE (message_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_group ON public.payment_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_message ON public.payment_requests(message_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(group_id, status);

-- ============================================
-- PAYMENT ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID NOT NULL REFERENCES public.payment_requests(id) ON DELETE CASCADE,
    description VARCHAR(200) NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'processing', 'paid', 'failed')),
    paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    stripe_checkout_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_items_request ON public.payment_items(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_items_assigned ON public.payment_items(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_items_stripe_session ON public.payment_items(stripe_checkout_session_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_items ENABLE ROW LEVEL SECURITY;

-- payment_requests: members can view requests in their groups
CREATE POLICY "Members can view payment requests" ON public.payment_requests
    FOR SELECT USING (public.is_group_member(group_id));

-- payment_requests: service role has full access for worker operations
CREATE POLICY "Service role can manage payment requests" ON public.payment_requests
    FOR ALL USING (auth.role() = 'service_role');

-- payment_items: members can view items via group membership
CREATE POLICY "Members can view payment items" ON public.payment_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.payment_requests pr
            WHERE pr.id = payment_items.payment_request_id
            AND public.is_group_member(pr.group_id)
        )
    );

-- payment_items: service role has full access for worker operations
CREATE POLICY "Service role can manage payment items" ON public.payment_items
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_items;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.payment_requests IS 'Payment requests within group chats, backed by Stripe Checkout Sessions';
COMMENT ON COLUMN public.payment_requests.mode IS 'per_item: anyone can pay an item; per_person: assigned members pay their share; direct: creator pays recipient';
COMMENT ON COLUMN public.payment_requests.recipient_id IS 'Only set for direct mode - the person receiving the payment';
COMMENT ON COLUMN public.payment_requests.total_amount_cents IS 'Total amount in cents (sum of all items)';
COMMENT ON TABLE public.payment_items IS 'Individual line items within a payment request';
COMMENT ON COLUMN public.payment_items.assigned_user_id IS 'For per_person mode: the specific user who should pay this item';
COMMENT ON COLUMN public.payment_items.stripe_checkout_session_id IS 'Stripe Checkout Session ID when payment is in progress';
