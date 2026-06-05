-- Rate limiting table + atomic check-and-increment RPC.
-- Locked to service role only (no RLS policies = no anon/authenticated access).

CREATE TABLE IF NOT EXISTS rate_limits (
  id           text         PRIMARY KEY,
  count        integer      NOT NULL DEFAULT 0,
  window_start timestamptz  NOT NULL DEFAULT now(),
  expires_at   timestamptz  NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limits_expires_idx ON rate_limits (expires_at);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- intentionally no policies: only the service-role key can read/write.

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_id              text,
  p_limit           integer,
  p_window_seconds  integer
)
RETURNS TABLE(allowed boolean, remaining integer, reset_at timestamptz)
LANGUAGE plpgsql
AS $$
DECLARE
  v_now      timestamptz := now();
  v_window   interval    := make_interval(secs => p_window_seconds);
  v_count    integer;
  v_expires  timestamptz;
BEGIN
  INSERT INTO rate_limits (id, count, window_start, expires_at)
  VALUES (p_id, 1, v_now, v_now + v_window)
  ON CONFLICT (id) DO UPDATE
    SET count        = CASE
                         WHEN rate_limits.expires_at <= v_now THEN 1
                         ELSE rate_limits.count + 1
                       END,
        window_start = CASE
                         WHEN rate_limits.expires_at <= v_now THEN v_now
                         ELSE rate_limits.window_start
                       END,
        expires_at   = CASE
                         WHEN rate_limits.expires_at <= v_now THEN v_now + v_window
                         ELSE rate_limits.expires_at
                       END
  RETURNING rate_limits.count, rate_limits.expires_at
  INTO v_count, v_expires;

  IF v_count > p_limit THEN
    RETURN QUERY SELECT false, 0, v_expires;
  ELSE
    RETURN QUERY SELECT true, GREATEST(p_limit - v_count, 0), v_expires;
  END IF;
END;
$$;

-- Optional: periodic cleanup of expired rows (keeps table tiny).
-- Run manually or via pg_cron if available:
--   SELECT cron.schedule('rate-limits-cleanup', '*/15 * * * *',
--     $$DELETE FROM rate_limits WHERE expires_at < now() - interval '1 day'$$);
