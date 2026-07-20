"use client";

import Map, {
  Marker,
  NavigationControl,
  GeolocateControl,
  type MapMouseEvent,
  type MarkerDragEvent,
} from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type Props = {
  value: Coordinates;
  onChange: (coordinates: Coordinates) => void;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function LocationPickerMap({ value, onChange }: Props) {
  const updateFromMap = (event: MapMouseEvent) => {
    onChange({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
  };

  const updateFromMarker = (event: MarkerDragEvent) => {
    onChange({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
  };

  return (
    <Map
      initialViewState={{
        longitude: value.longitude,
        latitude: value.latitude,
        zoom: 15,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      language="zh-Hans"
      onClick={updateFromMap}
      attributionControl={false}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <GeolocateControl position="top-right" trackUserLocation />
      <Marker
        longitude={value.longitude}
        latitude={value.latitude}
        anchor="bottom"
        draggable
        onDragEnd={updateFromMarker}
      >
        <div className="grid h-9 w-9 cursor-grab place-items-center rounded-full border-2 border-background bg-accent text-accent-foreground shadow-md active:cursor-grabbing">
          <MapPin size={18} />
        </div>
      </Marker>
    </Map>
  );
}
