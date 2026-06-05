-- Pathway reminders. Mirrors the localStorage reminders so the server can send
-- email notifications even when the user's browser is closed.

CREATE TABLE IF NOT EXISTS reminders (
  id              uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id         text         NOT NULL,
  task_title      text,
  fire_at         timestamptz  NOT NULL,
  note            text,
  email_sent      boolean      NOT NULL DEFAULT false,
  email_sent_at   timestamptz,
  created_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reminders_due_idx
  ON reminders (fire_at)
  WHERE email_sent = false;

CREATE INDEX IF NOT EXISTS reminders_user_idx ON reminders (user_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- A user can read and manage only their own reminders.
DROP POLICY IF EXISTS "own reminders" ON reminders;
CREATE POLICY "own reminders" ON reminders
  FOR ALL USING (auth.uid() = user_id);
