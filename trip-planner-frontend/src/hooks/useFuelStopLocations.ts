import { useEffect, useState } from 'react';
import type { FuelStop } from '../types';

export interface FuelStopLocation extends FuelStop {
  index: number;
  mileMarker: number;
  placeName: string | null;
  loading: boolean;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en',
        },
      },
    );
    if (!response.ok) return null;
    const data = await response.json();
    const name = data.display_name as string | undefined;
    if (!name) return null;
    return name.split(',').slice(0, 3).join(',').trim();
  } catch {
    return null;
  }
}

function fuelStopsKey(stops: FuelStop[]): string {
  if (stops.length === 0) return '';
  return stops
    .map((s) => `${s.coordinates[0].toFixed(5)},${s.coordinates[1].toFixed(5)}`)
    .join('|');
}

export function useFuelStopLocations(fuelStops: FuelStop[]): FuelStopLocation[] {
  const [locations, setLocations] = useState<FuelStopLocation[]>([]);
  const stopsKey = fuelStopsKey(fuelStops);

  useEffect(() => {
    if (fuelStops.length === 0) {
      setLocations((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const initial: FuelStopLocation[] = fuelStops.map((stop, index) => ({
      ...stop,
      index: index + 1,
      mileMarker: (index + 1) * 200,
      placeName: null,
      loading: true,
    }));
    setLocations(initial);

    let cancelled = false;

    async function loadNames() {
      for (let i = 0; i < fuelStops.length; i++) {
        if (cancelled) return;
        const [lat, lng] = fuelStops[i].coordinates;
        const placeName = await reverseGeocode(lat, lng);
        if (cancelled) return;
        setLocations((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, placeName, loading: false } : item,
          ),
        );
        if (i < fuelStops.length - 1) {
          await new Promise((r) => setTimeout(r, 1100));
        }
      }
    }

    loadNames();
    return () => {
      cancelled = true;
    };
    // stopsKey is a stable string derived from coordinates — avoids infinite loop
    // when parent passes a new [] reference each render (result?.fuel_stops ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey]);

  return locations;
}
