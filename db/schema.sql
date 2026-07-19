-- D1 数据库 Schema：地点记忆地图

-- 地点表
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 记忆表
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  author_initial TEXT NOT NULL,
  content TEXT NOT NULL,
  photo_url TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  captured_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  weather TEXT,
  temperature TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_memories_place_id ON memories(place_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
