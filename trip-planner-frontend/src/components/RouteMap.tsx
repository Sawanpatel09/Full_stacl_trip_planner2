import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FuelStopLocation } from '../hooks/useFuelStopLocations';
import type { RouteSegment, RouteMarkers } from '../types';
import { decodeRouteSegments, extractMarkers, formatCoordinates } from '../utils/formatters';
import {
  currentLocationIcon,
  dropoffLocationIcon,
  fuelStopIcon,
  MAP_LEGEND,
  pickupLocationIcon,
} from '../utils/mapIcons';

interface RouteMapProps {
  segments: RouteSegment[];
  fuelStops: FuelStopLocation[];
  labels: {
    current: string;
    pickup: string;
    dropoff: string;
  };
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map(([lat, lng]) => [lat, lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [map, points]);

  return null;
}

export function RouteMap({ segments, fuelStops, labels }: RouteMapProps) {
  const routePoints = useMemo(() => decodeRouteSegments(segments), [segments]);
  const markers: RouteMarkers | null = useMemo(
    () => extractMarkers(segments, routePoints),
    [segments, routePoints],
  );

  const center = routePoints.length
    ? routePoints[Math.floor(routePoints.length / 2)]
    : ([39.8283, -98.5795] as [number, number]);

  if (routePoints.length === 0) {
    return (
      <div className="flex h-[28rem] items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
        No route data
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <MapContainer center={center} zoom={5} scrollWheelZoom className="h-[28rem] w-full z-0 sm:h-[32rem]">
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={routePoints} />
        <Polyline
          positions={routePoints}
          pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.85 }}
        />

        {markers && (
          <>
            <Marker position={markers.start} icon={currentLocationIcon}>
              <Popup>
                <strong>Current location</strong>
                <br />
                {labels.current}
              </Popup>
            </Marker>
            <Marker position={markers.pickup} icon={pickupLocationIcon}>
              <Popup>
                <strong>Pickup</strong>
                <br />
                {labels.pickup}
              </Popup>
            </Marker>
            <Marker position={markers.dropoff} icon={dropoffLocationIcon}>
              <Popup>
                <strong>Dropoff</strong>
                <br />
                {labels.dropoff}
              </Popup>
            </Marker>
          </>
        )}

        {fuelStops.map((stop) => (
          <Marker key={`fuel-${stop.index}`} position={stop.coordinates} icon={fuelStopIcon}>
            <Popup>
              <strong>Fuel stop {stop.index}</strong> (~{stop.mileMarker.toLocaleString()} mi)
              <br />
              {stop.placeName && <>{stop.placeName}<br /></>}
              <span style={{ fontSize: '11px', color: '#666' }}>
                {formatCoordinates(stop.coordinates)}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 bg-slate-50/80 px-4 py-2.5">
        {MAP_LEGEND.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shadow-sm ring-2 ring-white"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
