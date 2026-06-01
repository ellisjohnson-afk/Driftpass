-- Add pin_shard column to subscriptions for fast PIN lookup
-- First 2 digits of a user's PIN are stable (derived from userId only, not time)
-- This allows pre-filtering subscriptions to ~1% before verifying the full PIN

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pin_shard VARCHAR(2);

-- Index for fast lookup by shard + status
CREATE INDEX IF NOT EXISTS subscriptions_pin_shard_status_idx
  ON subscriptions (pin_shard, status)
  WHERE status = 'active';
