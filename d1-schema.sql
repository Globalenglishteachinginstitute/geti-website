CREATE TABLE IF NOT EXISTS certificate_sync_events (
  request_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL
);
