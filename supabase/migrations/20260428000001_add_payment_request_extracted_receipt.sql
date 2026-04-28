-- Migration: 20260428000001_add_payment_request_extracted_receipt.sql
-- Description: Adds optional `extracted_receipt` JSONB column to payment_requests
--              storing the audit data returned from receipt OCR (Claude vision).
-- Rollback: ALTER TABLE public.payment_requests DROP COLUMN extracted_receipt;

ALTER TABLE public.payment_requests
    ADD COLUMN extracted_receipt JSONB;

COMMENT ON COLUMN public.payment_requests.extracted_receipt IS 'Audit JSON from receipt OCR: merchant, dates, raw amounts, model used, etc. Null when payment was created manually.';
