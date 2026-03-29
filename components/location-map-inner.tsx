"use client";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});
L.Marker.mergeOptions({ icon: defaultIcon });

function MapInvalidateSize({ enabled }: { enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    const id = requestAnimationFrame(() => {
      map.invalidateSize();
      setTimeout(() => map.invalidateSize(), 200);
    });
    return () => cancelAnimationFrame(id);
  }, [enabled, map]);
  return null;
}

export type LocationMapInnerProps = {
  lat: number;
  lng: number;
  height: number;
  zoom: number;
  interactive: boolean;
  /** After opening in a dialog, Leaflet needs a size refresh */
  invalidateAfterMount?: boolean;
};

export function LocationMapInner({
  lat,
  lng,
  height,
  zoom,
  interactive,
  invalidateAfterMount = false,
}: LocationMapInnerProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      style={{ height, width: "100%" }}
      className="z-0 [&_.leaflet-control-attribution]:text-[10px]"
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
      zoomControl={interactive}
    >
      <MapInvalidateSize enabled={invalidateAfterMount} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} />
    </MapContainer>
  );
}
