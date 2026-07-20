"use client";

import { useEffect, useRef } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

type SceneMarker = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  momentCount: number;
};

type Props = {
  center: { latitude: number; longitude: number };
  scenes: SceneMarker[];
  activeSceneId: string;
  onSceneChange: (id: string) => void;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function SceneMapboxMap({ center, scenes, activeSceneId, onSceneChange }: Props) {
  const mapRef = useRef<MapRef>(null);
  const activeScene = scenes.find((scene) => scene.id === activeSceneId);
  const activeLatitude = activeScene?.latitude;
  const activeLongitude = activeScene?.longitude;

  useEffect(() => {
    if (activeLatitude === undefined || activeLongitude === undefined) return;

    mapRef.current?.flyTo({
      center: [activeLongitude, activeLatitude],
      zoom: 16,
      duration: 800,
    });
  }, [activeLatitude, activeLongitude]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: center.longitude,
        latitude: center.latitude,
        zoom: 15.5,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      language="zh-Hans"
      attributionControl={false}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {scenes.map((scene) => {
        const active = scene.id === activeSceneId;
        return (
          <Marker
            key={scene.id}
            longitude={scene.longitude}
            latitude={scene.latitude}
            anchor="bottom"
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSceneChange(scene.id);
              }}
              aria-label={`切换到视角：${scene.title}`}
              aria-pressed={active}
              className="flex cursor-pointer flex-col items-center transition-transform hover:scale-105"
            >
              <span
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[8px] border bg-background px-2 py-1 text-[11px] shadow-sm ${
                  active ? "border-accent text-foreground" : "border-border text-muted-foreground"
                }`}
              >
                <MapPin size={11} className={active ? "text-accent" : ""} />
                {scene.title}
                <span className="text-muted-foreground">· {scene.momentCount}</span>
              </span>
              <span
                className={`mt-0.5 h-2 w-2 rotate-45 ${
                  active ? "bg-accent" : "bg-muted-foreground"
                }`}
              />
            </button>
          </Marker>
        );
      })}
    </Map>
  );
}
