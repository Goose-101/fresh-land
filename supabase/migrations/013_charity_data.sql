-- Nonprofit verification data from Candid (formerly GuideStar) / Charity Navigator.
-- We store the EIN (federal tax ID — public info) and a cached blob of the
-- Candid API response. Refresh logic lives in app code (90-day stale check).

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS ein              text,
  ADD COLUMN IF NOT EXISTS charity_data     jsonb,
  ADD COLUMN IF NOT EXISTS charity_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS resources_ein_idx ON resources (ein) WHERE ein IS NOT NULL;
