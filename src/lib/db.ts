export type Visibility = "self" | "participants" | "link" | "public";
export type MemorySource = "exif" | "manual" | "location";

export type MemoryDTO = {
  id: string;
  placeId: string;
  sceneId: string | null;
  author: string;
  authorInitial: string;
  authorAvatarUrl: string | null;
  text: string;
  capturedAt: string | null;
  createdAt: string;
  date: string;
  weather: string | null;
  temperature: number | null;
  temp: string;
  latitude: number;
  longitude: number;
  visibility: Visibility;
  source: MemorySource;
  gpsAccuracy: number | null;
  photos: string[];
  canDelete: boolean;
};

export type PlaceDTO = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  latitude: number;
  longitude: number;
  memoryCount: number;
  entries: MemoryDTO[];
};

export type SceneDTO = {
  id: string;
  placeId: string;
  title: string;
  latitude: number;
  longitude: number;
  directionDegrees: number | null;
  direction: string;
  momentCount: number;
};

export type SceneDataDTO = {
  place: PlaceDTO;
  scenes: SceneDTO[];
  moments: MemoryDTO[];
};

export type UploadContextDTO = {
  places: Array<Pick<PlaceDTO, "id" | "name" | "city" | "latitude" | "longitude">>;
  scenes: SceneDTO[];
};
