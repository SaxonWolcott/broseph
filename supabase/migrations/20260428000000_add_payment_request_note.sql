-- Migration: 20260428000000_add_payment_request_note.sql
-- Description: Adds optional `note` field to payment_requests for free-form context
--              (e.g., "Tax and tip distributed across items").
-- Rollback: ALTER TABLE public.payment_requests DROP COLUMN note;

ALTER TABLE public.payment_requests
    ADD COLUMN note VARCHAR(500);

COMMENT ON COLUMN public.payment_requests.note IS 'Optional free-text note shown on the payment card; used for context like tax/tip distribution.';
