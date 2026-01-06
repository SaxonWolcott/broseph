-- Seed data for development

-- Test tenant
INSERT INTO tenants (id, name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Test Tenant');

-- Test API key (the actual key is: test-api-key-12345)
-- SHA-256 hash of 'test-api-key-12345'
INSERT INTO api_keys (id, tenant_id, key_hash, name) VALUES
    ('22222222-2222-2222-2222-222222222222',
     '11111111-1111-1111-1111-111111111111',
     '7c6a180b36896a65c3b4ab77f51b7e02f0c0a1f7f7d8f8e9e8f7f6f5f4f3f2f1',
     'Development API Key');
