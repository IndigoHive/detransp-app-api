CREATE TABLE IF NOT EXISTS sessions (
  id                          TEXT        PRIMARY KEY,
  cpf                         TEXT        NOT NULL UNIQUE,
  platform                    TEXT        NOT NULL,
  encrypted_access_token      TEXT        NOT NULL,
  encrypted_access_token_iv   VARCHAR(32) NOT NULL,
  encrypted_refresh_token     TEXT,
  encrypted_refresh_token_iv  VARCHAR(32),
  user_info                   JSONB       NOT NULL,
  expires_at                  TIMESTAMPTZ NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
