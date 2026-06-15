import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  DEFAULT_MAP_CENTER,
  getCurrentPosition,
  isVagueAddress,
  minZoomForPin,
  reverseGeocodeCoords,
  searchPlaces,
  type PlaceSuggestion,
} from '../utils/geocoding';
import { capitalizeInput } from '../utils/formatters';
import { currentLocationIcon, dropoffLocationIcon, pickupLocationIcon } from '../utils/mapIcons';

export type PickerKind = 'current' | 'pickup' | 'dropoff';

const PIN_ICONS: Record<PickerKind, L.DivIcon> = {
  current: currentLocationIcon,
  pickup: pickupLocationIcon,
  dropoff: dropoffLocationIcon,
};

const TITLES: Record<PickerKind, string> = {
  current: 'Set current location',
  pickup: 'Set pickup on map',
  dropoff: 'Set dropoff on map',
};

interface LocationPickerModalProps {
  open: boolean;
  kind: PickerKind;
  initialCoords: [number, number] | null;
  onClose: () => void;
  onConfirm: (address: string, coords: [number, number]) => void;
}

function MapCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

function MapClickPin({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPickerModal({
  open,
  kind,
  initialCoords,
  onClose,
  onConfirm,
}: LocationPickerModalProps) {
  const [position, setPosition] = useState<[number, number]>(initialCoords ?? DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(5);
  const [address, setAddress] = useState('');
  const [resolving, setResolving] = useState(false);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const resolveAddress = useCallback(async (lat: number, lng: number) => {
    setResolving(true);
    try {
      const name = await reverseGeocodeCoords(lat, lng);
      setAddress(name);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setResolving(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const coords = initialCoords ?? DEFAULT_MAP_CENTER;
    setPosition(coords);
    setMapZoom(initialCoords ? 16 : 5);
    setSearch('');
    setSuggestions([]);
    setSearchAttempted(false);
    resolveAddress(coords[0], coords[1]);
  }, [open, initialCoords, resolveAddress]);

  useEffect(() => {
    if (!open || search.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      const results = await searchPlaces(search);
      setSuggestions(results);
      setSearchAttempted(true);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, open]);

  const movePin = (lat: number, lng: number, zoom = 17) => {
    setPosition([lat, lng]);
    setMapZoom(zoom);
    resolveAddress(lat, lng);
  };

  const handleGps = async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentPosition();
      movePin(pos.coords.latitude, pos.coords.longitude);
    } finally {
      setGpsLoading(false);
    }
  };

  const pickSuggestion = (item: PlaceSuggestion) => {
    setSearch(item.label);
    setSuggestions([]);
    setSearchAttempted(false);
    movePin(item.lat, item.lng, item.zoom);
  };

  const pinTooBroad = Boolean(address && isVagueAddress(address));
  const pinZoomTooLow = mapZoom < minZoomForPin();
  const canConfirm = Boolean(address) && !resolving && !pinTooBroad && !pinZoomTooLow;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div
        className="flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-picker-title"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id="location-picker-title" className="text-sm font-semibold text-slate-900">
              {TITLES[kind]}
            </h2>
            <button type="button" onClick={onClose} className="btn-secondary px-2.5 py-1 text-xs">
              Cancel
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Search a town or street, zoom in, then place the pin on a road
          </p>

          <div className="relative mt-3">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchAttempted(false);
              }}
              placeholder="Street, city, landmark, or ZIP…"
              className="input-field pr-20"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={handleGps}
              disabled={gpsLoading}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              {gpsLoading ? '…' : 'My GPS'}
            </button>
            {suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {suggestions.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-left hover:bg-blue-50"
                      onClick={() => pickSuggestion(item)}
                    >
                      <span className="block text-sm font-medium text-slate-800">{item.label}</span>
                      {item.detail && (
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {item.detail}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searching && (
              <p className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400">
                Searching…
              </p>
            )}
            {!searching && searchAttempted && search.trim().length >= 2 && suggestions.length === 0 && (
              <p className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                No matches — try a nearby city or drag the pin on the map.
              </p>
            )}
          </div>
        </div>

        <div className="relative h-[50vh] min-h-[280px] w-full">
          <MapContainer
            center={position}
            zoom={mapZoom}
            scrollWheelZoom
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenter center={position} zoom={mapZoom} />
            <MapClickPin onPick={movePin} />
            <Marker
              position={position}
              icon={PIN_ICONS[kind]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  movePin(lat, lng);
                },
              }}
            />
          </MapContainer>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
          <p className="text-xs font-medium text-slate-500">Selected address</p>
          <p className="mt-1 min-h-[2.5rem] text-sm font-medium text-slate-900">
            {resolving ? 'Looking up address…' : address || 'Move the pin on the map'}
          </p>
          {pinTooBroad && (
            <p className="mt-2 text-xs text-amber-700">
              This looks like a whole state or region. Zoom in and pick a specific town, village, or
              street — not &quot;Uttar Pradesh, India&quot;.
            </p>
          )}
          {!pinTooBroad && pinZoomTooLow && (
            <p className="mt-2 text-xs text-amber-700">
              Zoom in closer (street level) so the pin sits on an actual road.
            </p>
          )}
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(capitalizeInput(address), position)}
            className="btn-primary mt-3 w-full"
          >
            Confirm location
          </button>
        </div>
      </div>
    </div>
  );
}
