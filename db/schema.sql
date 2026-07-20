PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS actors (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  username TEXT,
  avatar_r2_key TEXT,
  avatar_content_type TEXT,
  is_anonymous INTEGER NOT NULL DEFAULT 1 CHECK (is_anonymous IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_actors_username
  ON actors(username COLLATE NOCASE) WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL UNIQUE REFERENCES actors(id) ON DELETE CASCADE,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_window ON auth_rate_limits(window_started_at);

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

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  created_by TEXT REFERENCES actors(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  direction_degrees REAL CHECK (direction_degrees BETWEEN 0 AND 360),
  created_by TEXT REFERENCES actors(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  client_request_id TEXT NOT NULL UNIQUE,
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  scene_id TEXT REFERENCES scenes(id) ON DELETE SET NULL,
  actor_id TEXT NOT NULL REFERENCES actors(id),
  note TEXT NOT NULL CHECK (length(note) BETWEEN 1 AND 2000),
  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  captured_at TEXT,
  weather TEXT,
  temperature REAL,
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('self', 'participants', 'link', 'public')),
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('exif', 'manual', 'location')),
  gps_accuracy REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  r2_key TEXT UNIQUE,
  url TEXT NOT NULL,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL DEFAULT 0 CHECK (byte_size >= 0),
  width INTEGER,
  height INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES actors(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_places_coordinates ON places(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_scenes_place ON scenes(place_id, created_at);
CREATE INDEX IF NOT EXISTS idx_memories_place_time
  ON memories(place_id, deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_scene_time
  ON memories(scene_id, deleted_at, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_actor ON memories(actor_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_assets_memory ON media_assets(memory_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON audit_events(entity_type, entity_id, created_at DESC);
