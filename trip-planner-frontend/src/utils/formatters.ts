import polyline from '@mapbox/polyline';
import type { RouteSegment, RouteMarkers } from '../types';

/** First letter of each word uppercase, rest lowercase (e.g. "chicago, il" → "Chicago, Il"). */
export function capitalizeInput(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase()).replace(/\B\w/g, (char) => char.toLowerCase());
}

export function decodeRouteSegments(segments: RouteSegment[]): [number, number][] {
  const points: [number, number][] = [];

  for (const segment of segments) {
    const decoded = polyline.decode(segment.geometry) as [number, number][];
    if (points.length > 0 && decoded.length > 0) {
      const last = points[points.length - 1];
      const first = decoded[0];
      if (last[0] === first[0] && last[1] === first[1]) {
        points.push(...decoded.slice(1));
        continue;
      }
    }
    points.push(...decoded);
  }

  return points;
}

export function extractMarkers(
  segments: RouteSegment[],
  routePoints: [number, number][],
): RouteMarkers | null {
  if (routePoints.length < 2 || segments.length < 2) return null;

  const seg1Points = polyline.decode(segments[0].geometry) as [number, number][];
  const pickup = seg1Points[seg1Points.length - 1];
  const start = routePoints[0];
  const dropoff = routePoints[routePoints.length - 1];

  return { start, pickup, dropoff };
}

export function metersToMiles(meters: number): number {
  return meters / 1609.344;
}

export function secondsToHoursMinutes(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatMiles(meters: number): string {
  return metersToMiles(meters).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatHourLabel(hour: number): string {
  const h = Math.floor(hour) % 24;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${suffix}`;
}

export function formatCoordinates([lat, lng]: [number, number]): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

export function mapsUrl([lat, lng]: [number, number]): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`;
}
