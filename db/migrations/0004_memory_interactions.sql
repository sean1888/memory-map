PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS memory_comments (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES actors(id),
  body TEXT CHECK (body IS NULL OR length(body) BETWEEN 1 AND 500),
  r2_key TEXT UNIQUE,
  content_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  CHECK (body IS NOT NULL OR r2_key IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS memory_likes (
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES actors(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (memory_id, actor_id)
);

CREATE INDEX IF NOT EXISTS idx_comments_memory_time
  ON memory_comments(memory_id, deleted_at, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_actor
  ON memory_comments(actor_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_likes_actor ON memory_likes(actor_id, created_at);
