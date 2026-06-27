-- Add DELETE and UPDATE policies for community_posts and community_replies.
-- The original schema only had INSERT and SELECT policies, so users couldn't
-- actually delete or edit their own content — the queries returned success
-- but RLS silently blocked them, affecting 0 rows.

DROP POLICY IF EXISTS "delete own post" ON community_posts;
CREATE POLICY "delete own post" ON community_posts FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update own post" ON community_posts;
CREATE POLICY "update own post" ON community_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete own reply" ON community_replies;
CREATE POLICY "delete own reply" ON community_replies FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update own reply" ON community_replies;
CREATE POLICY "update own reply" ON community_replies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
