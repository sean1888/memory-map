"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Map, {
  Marker,
  NavigationControl,
  GeolocateControl,
  Popup,
  type MapMouseEvent,
  type MapRef,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type PlaceMarker = {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  memoryCount: number;
};

type Props = {
  places: PlaceMarker[];
  onPlaceClick: (placeId: string) => void;
  onMapDblClick: (lng: number, lat: number) => void;
  selectedPlaceId?: string | null;
};

const DEFAULT_CENTER: [number, number] = [121.4737, 31.2304]; // 上海

export default function MapboxMap({ places, onPlaceClick, onMapDblClick, selectedPlaceId }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [geolocated, setGeolocated] = useState(false);
  const [popup, setPopup] = useState<{
    place: PlaceMarker;
    lng: number;
    lat: number;
  } | null>(null);

  // 地理定位
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeolocated(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setTimeout(() => {
          mapRef.current?.flyTo({
            center: coords,
            zoom: 12,
            duration: 2000,
          });
        }, 800);
        setGeolocated(true);
      },
      () => setGeolocated(true),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // 侧边栏点击 → flyTo
  useEffect(() => {
    if (!selectedPlaceId || !mapRef.current) return;
    const place = places.find((p) => p.id === selectedPlaceId);
    if (place) {
      mapRef.current.flyTo({
        center: [place.longitude, place.latitude],
        zoom: 14,
        duration: 1500,
      });
      setPopup({ place, lng: place.longitude, lat: place.latitude });
    }
  }, [selectedPlaceId, places]);

  const handleMarkerClick = useCallback(
    (e: { originalEvent: globalThis.MouseEvent }, place: PlaceMarker) => {
      e.originalEvent.stopPropagation();
      setPopup({ place, lng: place.longitude, lat: place.latitude });
    },
    [],
  );

  const handleMapDblClick = useCallback(
    (e: MapMouseEvent) => {
      e.preventDefault();
      onMapDblClick(e.lngLat.lng, e.lngLat.lat);
    },
    [onMapDblClick],
  );

  return (
    <div
      className="relative overflow-hidden rounded-[8px] border border-border"
      style={{ minHeight: 480 }}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: DEFAULT_CENTER[0],
          latitude: DEFAULT_CENTER[1],
          zoom: 5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        language="zh-Hans"
        onDblClick={handleMapDblClick}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <GeolocateControl position="top-right" trackUserLocation />

        {places.map((place) => (
          <Marker
            key={place.id}
            longitude={place.longitude}
            latitude={place.latitude}
            anchor="bottom"
            onClick={(e) => handleMarkerClick(e, place)}
          >
            <div className="flex flex-col items-center cursor-pointer group">
              <span className="inline-flex items-center gap-1 rounded-[8px] bg-background px-2 py-1 text-[11px] shadow-sm border border-border whitespace-nowrap group-hover:border-accent transition-colors">
                <span className="text-accent">●</span>
                {place.name}
                <span className="text-muted-foreground">· {place.memoryCount}</span>
              </span>
              <span className="mt-0.5 h-2 w-2 rotate-45 bg-accent" />
            </div>
          </Marker>
        ))}

        {popup && (
          <Popup
            longitude={popup.lng}
            latitude={popup.lat}
            anchor="bottom"
            onClose={() => setPopup(null)}
            closeOnClick={false}
            maxWidth="260px"
            className="memory-popup"
          >
            <div className="p-3 min-w-[180px]">
              <h3 className="font-editorial text-[15px] font-medium">{popup.place.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {popup.place.memoryCount} 段记忆
              </p>
              <button
                onClick={() => {
                  setPopup(null);
                  onPlaceClick(popup.place.id);
                }}
                className="mt-2 text-[12px] text-accent hover:underline"
              >
                查看记录 →
              </button>
            </div>
          </Popup>
        )}
      </Map>

      {/* 地图底部提示 */}
      <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-[8px] bg-background/85 px-2 py-1 text-[11px] text-muted-foreground">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        记忆点位 · 双击地图可打卡
      </div>
    </div>
  );
}
