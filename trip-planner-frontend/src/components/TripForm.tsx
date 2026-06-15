import { useState } from 'react';
import type { TripFormInput } from '../types';
import { capitalizeInput } from '../utils/formatters';
import { geocodeToCoords, getCurrentPosition, reverseGeocodeCoords } from '../utils/geocoding';
import { MapPinIcon } from './Icons';
import { LocationField } from './LocationField';
import { LocationPickerModal, type PickerKind } from './LocationPickerModal';

interface TripFormProps {
  values: TripFormInput;
  onChange: (values: TripFormInput) => void;
  onSubmit: () => void;
  onReset: () => void;
  loading: boolean;
}

type LocationKey = 'currentLocation' | 'pickupLocation' | 'dropoffLocation';
type CoordsKey = 'currentCoords' | 'pickupCoords' | 'dropoffCoords';

const locationFields: {
  key: LocationKey;
  coordsKey: CoordsKey;
  kind: PickerKind;
  label: string;
  placeholder: string;
  dot: string;
  ring: string;
  showGps: boolean;
}[] = [
  {
    key: 'currentLocation',
    coordsKey: 'currentCoords',
    kind: 'current',
    label: 'Current location',
    placeholder: 'Pin your location on map',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-100',
    showGps: true,
  },
  {
    key: 'pickupLocation',
    coordsKey: 'pickupCoords',
    kind: 'pickup',
    label: 'Pickup',
    placeholder: 'Pin pickup on map',
    dot: 'bg-blue-500',
    ring: 'ring-blue-100',
    showGps: false,
  },
  {
    key: 'dropoffLocation',
    coordsKey: 'dropoffCoords',
    kind: 'dropoff',
    label: 'Dropoff',
    placeholder: 'Pin dropoff on map',
    dot: 'bg-red-500',
    ring: 'ring-red-100',
    showGps: false,
  },
];

const driverFields = [
  { key: 'driverName' as const, label: 'Driver name', placeholder: 'e.g. Mukesh Kumar', required: true },
  { key: 'driverId' as const, label: 'Driver ID', placeholder: 'e.g. A001', required: true },
  { key: 'unitNumber' as const, label: 'Truck No.', placeholder: 'e.g. TRK-7421', required: true },
];

const capitalizeFields = new Set<keyof TripFormInput>([
  'currentLocation',
  'pickupLocation',
  'dropoffLocation',
  'driverName',
]);

export function TripForm({ values, onChange, onSubmit, onReset, loading }: TripFormProps) {
  const [pickerKind, setPickerKind] = useState<PickerKind | null>(null);
  const [pickerInitialCoords, setPickerInitialCoords] = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const activeField = locationFields.find((f) => f.kind === pickerKind);

  const handleTextChange = (key: keyof TripFormInput, raw: string) => {
    let value = raw;
    if (key === 'driverId') value = raw.toUpperCase();
    else if (capitalizeFields.has(key)) value = capitalizeInput(raw);
    onChange({ ...values, [key]: value });
  };

  const handleGpsCurrent = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const name = await reverseGeocodeCoords(lat, lng);
      onChange({
        ...values,
        currentLocation: capitalizeInput(name),
        currentCoords: [lat, lng],
      });
    } catch (err) {
      const message =
        err instanceof GeolocationPositionError
          ? err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Allow GPS or pin on map.'
            : 'Could not get GPS. Pin your location on the map instead.'
          : err instanceof Error
            ? err.message
            : 'Could not get your location.';
      setGpsError(message);
    } finally {
      setGpsLoading(false);
    }
  };

  const openPicker = async (field: (typeof locationFields)[number]) => {
    setGpsError(null);
    let coords = values[field.coordsKey];
    if (!coords && values[field.key].trim()) {
      coords = await geocodeToCoords(values[field.key]);
    }
    setPickerInitialCoords(coords);
    setPickerKind(field.kind);
  };

  const handlePickerConfirm = (address: string, coords: [number, number]) => {
    if (!activeField) return;
    onChange({
      ...values,
      [activeField.key]: address,
      [activeField.coordsKey]: coords,
    });
    setPickerKind(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const allLocationsPinned =
    values.currentCoords !== null &&
    values.pickupCoords !== null &&
    values.dropoffCoords !== null;

  const isValid =
    values.currentLocation.trim() &&
    values.pickupLocation.trim() &&
    values.dropoffLocation.trim() &&
    allLocationsPinned &&
    values.driverName.trim() &&
    values.driverId.trim() &&
    values.unitNumber.trim() &&
    values.currentCycleUsed >= 0 &&
    values.currentCycleUsed <= 70;

  const cycleUsed = values.currentCycleUsed;
  const cycleRemaining = 70 - cycleUsed;
  const cyclePercent = (cycleUsed / 70) * 100;

  const handleCycleChange = (raw: string) => {
    onChange({ ...values, currentCycleUsed: parseFloat(raw) });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative space-y-0">
          <div
            className="absolute left-[1.125rem] top-8 bottom-8 w-px bg-slate-200"
            aria-hidden
          />
          {locationFields.map(({ key, label, placeholder, dot, ring, showGps }, index) => (
            <div key={key} className={`relative flex gap-3 ${index > 0 ? 'mt-4' : ''}`}>
              <div
                className={`relative z-10 mt-2.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ${ring} ${dot}`}
              >
                <MapPinIcon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <LocationField
                  id={key}
                  label={label}
                  value={values[key]}
                  placeholder={placeholder}
                  disabled={loading}
                  onOpenMap={() => openPicker(locationFields[index])}
                  onGps={showGps ? handleGpsCurrent : undefined}
                  gpsLoading={showGps && gpsLoading}
                />
                {showGps && gpsError && (
                  <p className="mt-1 text-xs text-red-600">{gpsError}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {!allLocationsPinned && (
          <p className="text-xs text-amber-600">
            Pin all three stops on the map (or use GPS for current location) before planning.
          </p>
        )}
        <p className="text-xs text-slate-400">
          Use <strong className="text-slate-500">Pin on map</strong> for each stop to set exact
          locations for your route, fuel stops, and driver log sheets.
        </p>

        <div className="rounded-lg bg-slate-50 p-3">
          <label htmlFor="cycle" className="mb-2 block text-xs font-medium text-slate-600">
            70-hour cycle
          </label>
          <div className="mb-2 flex items-baseline justify-between gap-3 text-xs tabular-nums">
            <span className="text-slate-600">
              <span className="text-sm font-bold text-blue-600">{cycleUsed}</span>
              {' h used'}
            </span>
            <span className="text-slate-600">
              <span className="text-sm font-bold text-slate-800">{cycleRemaining.toFixed(1)}</span>
              {' h remaining'}
            </span>
          </div>
          <input
            id="cycle"
            type="range"
            min={0}
            max={70}
            step={0.5}
            value={cycleUsed}
            onInput={(e) => handleCycleChange(e.currentTarget.value)}
            onChange={(e) => handleCycleChange(e.target.value)}
            disabled={loading}
            className="cycle-slider"
            style={{ '--cycle-fill': `${cyclePercent}%` } as React.CSSProperties}
            aria-valuemin={0}
            aria-valuemax={70}
            aria-valuenow={cycleUsed}
            aria-valuetext={`${cycleUsed} hours used, ${cycleRemaining.toFixed(1)} hours remaining`}
          />
        </div>

        <fieldset className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          <legend className="px-1 text-xs font-medium text-slate-500">Log sheet details</legend>
          <div className="mt-2 space-y-3">
          {driverFields.map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label htmlFor={key} className="mb-1 block text-xs font-medium text-slate-600">
                {label}
                {required && <span className="text-red-500"> *</span>}
              </label>
              <input
                id={key}
                type="text"
                value={values[key]}
                onChange={(e) => handleTextChange(key, e.target.value)}
                placeholder={placeholder}
                disabled={loading}
                required={required}
                className="input-field"
              />
              </div>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={!isValid || loading}
            className="btn-primary flex flex-1 items-center justify-center gap-2"
          >
            {loading ? 'Planning trip…' : 'Plan trip'}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="btn-secondary"
          >
            Reset
          </button>
        </div>
      </form>

      {activeField && (
        <LocationPickerModal
          open={pickerKind !== null}
          kind={activeField.kind}
          initialCoords={pickerInitialCoords ?? values[activeField.coordsKey]}
          onClose={() => setPickerKind(null)}
          onConfirm={handlePickerConfirm}
        />
      )}
    </>
  );
}
