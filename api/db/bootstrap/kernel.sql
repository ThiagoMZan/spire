CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS kernel;

CREATE TABLE IF NOT EXISTS kernel.login_limit (
  key varchar(64) PRIMARY KEY,
  attempts bigint NOT NULL,
  window_started_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kernel."user" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL,
  display_name varchar(250) NOT NULL,
  password_hash text NOT NULL,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_email_normalized CHECK (
    email = lower(btrim(email)) AND email <> ''
  ),
  CONSTRAINT user_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS kernel.session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES kernel."user"(id),
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CONSTRAINT session_expiration CHECK (expires_at > created_at),
  CONSTRAINT session_activity CHECK (last_seen_at >= created_at)
);

CREATE INDEX IF NOT EXISTS ix_session_user_active
  ON kernel.session (user_id, created_at, id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_session_expires_at
  ON kernel.session (expires_at);

CREATE TABLE IF NOT EXISTS kernel.event_outbox (
  id uuid PRIMARY KEY,
  event_name varchar(200) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_module varchar(150),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kernel.event_delivery (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES kernel.event_outbox(id) ON DELETE CASCADE,
  subscriber_key varchar(250) NOT NULL,
  module_key varchar(150),
  status varchar(30) NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by varchar(250),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, subscriber_key)
);

CREATE INDEX IF NOT EXISTS ix_event_delivery_pending
  ON kernel.event_delivery (status, available_at, created_at);

CREATE TABLE IF NOT EXISTS kernel.file (
  id uuid PRIMARY KEY,
  file_name varchar(500) NOT NULL,
  content_type varchar(250),
  size_bytes bigint NOT NULL,
  extension varchar(30),
  storage_driver varchar(50) NOT NULL,
  storage_path text NOT NULL,
  uploaded_by varchar(150),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_file_created_at
  ON kernel.file (created_at);
