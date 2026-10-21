-- FitLog schema: accounts, sessions and private meal/workout logs.
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext NOT NULL UNIQUE,
  password_hash text   NOT NULL,
  display_name  text   NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Only a SHA-256 hash of each session token is stored; the raw token lives in an httpOnly cookie.
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions(user_id);

CREATE TABLE logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('meal', 'workout')),
  title        text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  notes        text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  calories     integer CHECK (calories IS NULL OR calories BETWEEN 0 AND 20000),
  protein      numeric(6,1) CHECK (protein IS NULL OR protein BETWEEN 0 AND 2000),
  duration_min integer CHECK (duration_min IS NULL OR duration_min BETWEEN 0 AND 1440),
  log_date     date NOT NULL DEFAULT CURRENT_DATE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX logs_user_date_idx ON logs(user_id, log_date DESC);

-- Row-level security: every log query runs with app.user_id set to the signed-in user,
-- so the database itself refuses to return or change another user's rows.
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs FORCE ROW LEVEL SECURITY;
CREATE POLICY logs_owner_only ON logs
  USING (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), '')::uuid);
