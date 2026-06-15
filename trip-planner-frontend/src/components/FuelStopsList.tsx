import type { FuelStopLocation } from '../hooks/useFuelStopLocations';
import { formatCoordinates, mapsUrl } from '../utils/formatters';
import { FuelIcon } from './Icons';

interface FuelStopsListProps {
  stops: FuelStopLocation[];
}

export function FuelStopsList({ stops }: FuelStopsListProps) {
  if (stops.length === 0) return null;

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <FuelIcon className="h-4 w-4 text-amber-600" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Fuel stops
        </p>
      </div>
      <ul className="space-y-2">
        {stops.map((stop) => (
          <li
            key={stop.index}
            className="flex items-start justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2.5 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-800">
                Stop {stop.index}
                <span className="ml-2 font-normal text-amber-700">
                  ~{stop.mileMarker.toLocaleString()} mi
                </span>
              </p>
              {stop.loading && (
                <p className="mt-0.5 text-xs text-slate-400">Looking up address…</p>
              )}
              {!stop.loading && stop.placeName && (
                <p className="mt-0.5 text-slate-600">{stop.placeName}</p>
              )}
              <p className="mt-0.5 font-mono text-xs text-slate-400">
                {formatCoordinates(stop.coordinates)}
              </p>
            </div>
            <a
              href={mapsUrl(stop.coordinates)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-md border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-50"
            >
              Open map
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
