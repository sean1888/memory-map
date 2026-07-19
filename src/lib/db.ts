// D1 数据库类型定义

export interface PlaceRow {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface MemoryRow {
  id: string;
  place_id: string;
  author: string;
  author_initial: string;
  content: string;
  photo_url: string | null;
  latitude: number;
  longitude: number;
  captured_at: string;
  weather: string | null;
  temperature: string | null;
  created_at: string;
}

export interface PlaceWithMemories extends PlaceRow {
  memories: MemoryRow[];
  memory_count: number;
}
