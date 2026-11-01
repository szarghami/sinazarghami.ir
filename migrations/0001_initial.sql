CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_credentials (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  salt TEXT NOT NULL,
  passcode_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS analytics_events_session_id ON analytics_events(session_id);

CREATE TABLE IF NOT EXISTS api_limits (
  ip_hash TEXT PRIMARY KEY NOT NULL,
  window_started INTEGER NOT NULL,
  request_count INTEGER NOT NULL
);
