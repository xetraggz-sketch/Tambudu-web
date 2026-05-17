'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { SAMARA_CENTER, COLORS } from '@/lib/design-tokens';
import { CATEGORIES } from '@/lib/categories';
import type { EventCategory } from '@/generated/prisma/client';

type Pt = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  category: EventCategory;
  isPromoted?: boolean;
};

function markerIcon(emoji: string, opts: { selected: boolean; promoted: boolean }) {
  const size = opts.selected ? 36 : 28;
  const bg = opts.promoted ? COLORS.summer : COLORS.coal;
  const fg = opts.promoted ? COLORS.coal : COLORS.milk;
  const border = opts.selected ? `box-shadow: 0 0 0 2px ${COLORS.volga};` : '';
  return L.divIcon({
    className: 'tb-marker',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:999px;
      background:${bg};color:${fg};display:flex;align-items:center;justify-content:center;
      font-size:${Math.round(size * 0.55)}px;line-height:1;
      ${border}
    ">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyTo({ point }: { point: Pt | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 14), { duration: 0.4 });
  }, [point?.id, map, point]);
  return null;
}

export function EventsMap({
  events,
  selectedId,
  onSelect,
  center = SAMARA_CENTER,
  zoom = 13,
}: {
  events: Pt[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}) {
  const selected = events.find((e) => e.id === selectedId) ?? null;
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom
      attributionControl={false}
      className="h-full w-full rounded-xl"
      style={{ minHeight: 400 }}
    >
      <TileLayer
        attribution=""
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map((e) => (
        <Marker
          key={e.id}
          position={[e.lat, e.lng]}
          icon={markerIcon((CATEGORIES[e.category] ?? { emoji: '✨' }).emoji, {
            selected: e.id === selectedId,
            promoted: !!e.isPromoted,
          })}
          eventHandlers={{ click: () => onSelect?.(e.id) }}
        >
          {!onSelect && (
            <Popup>
              <div style={{ fontWeight: 600 }}>{e.title}</div>
              <a href={`/events/${e.id}`}>Открыть</a>
            </Popup>
          )}
        </Marker>
      ))}
      <FlyTo point={selected} />
    </MapContainer>
  );
}
