-- Migration 009: Add phone number and coaching consent fields
-- Required for LGPD-compliant personalized coaching follow-up (WhatsApp/SMS)
-- The NeuroForge coach uses phone contact to send study incentives,
-- streak reminders, and personalized learning guidance.
-- Consent is granular per Art. 8 LGPD — separate from general LGPD acceptance

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_consent_at TIMESTAMP;

-- Index for querying users who consented to receive messages
CREATE INDEX IF NOT EXISTS idx_users_phone_consent ON users(phone_consent) WHERE phone_consent = TRUE;

COMMENT ON COLUMN users.phone IS 'Phone number in international format (+55XXXXXXXXXXX)';
COMMENT ON COLUMN users.phone_consent IS 'Explicit LGPD consent to receive personalized coaching follow-up via WhatsApp/SMS';
COMMENT ON COLUMN users.phone_consent_at IS 'Timestamp of when user granted/revoked phone messaging consent';
