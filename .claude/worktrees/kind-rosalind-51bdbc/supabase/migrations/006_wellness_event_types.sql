-- Migration 006: extend wellness_event_type with new values
-- If using a PostgreSQL enum, add values here.
-- If using a CHECK constraint (as in the initial schema), this is handled via types only.
-- Run in Supabase SQL Editor if your schema uses the enum type.

-- For schemas using text + CHECK constraint (our approach), no SQL change needed —
-- the new values are permitted by the existing open-text column.
-- This migration is a no-op placeholder kept for migration numbering continuity.

-- If you later switch to a strict enum type, run:
-- ALTER TYPE wellness_event_type_enum ADD VALUE IF NOT EXISTS 'discovery_impression';
-- ALTER TYPE wellness_event_type_enum ADD VALUE IF NOT EXISTS 'companion_message';

SELECT 1; -- no-op
