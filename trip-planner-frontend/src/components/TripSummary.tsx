import type { TripPlanResponse, TripFormInput } from '../types';
import type { FuelStopLocation } from '../hooks/useFuelStopLocations';
import { FuelStopsList } from './FuelStopsList';
import { ClockIcon, DocumentIcon, FuelIcon, RouteIcon } from './Icons';
import { formatHours, formatMiles } from '../utils/formatters';

interface TripSummaryProps {
  result: TripPlanResponse;
  formInput: TripFormInput;
  fuelStopLocations: FuelStopLocation[];
}

const stopStyles = [
  { label: 'From', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  { label: 'Pickup', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  { label: 'Dropoff', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
];

export function TripSummary({ result, formInput, fuelStopLocations }: TripSummaryProps) {
  const totalDrivingHours = result.eld_logs.reduce((sum, log) => sum + log.driving_hours, 0);
  const totalDutyHours = result.eld_logs.reduce((sum, log) => sum + log.duty_hours, 0);
  const logDays = result.eld_logs.length;

  const stops = [
    { label: 'From', location: formInput.currentLocation },
    { label: 'Pickup', location: formInput.pickupLocation },
    { label: 'Dropoff', location: formInput.dropoffLocation },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={<RouteIcon className="h-4 w-4" />}
          label="Distance"
          value={`${formatMiles(result.distance_meters)} mi`}
          accent="text-blue-600 bg-blue-50"
        />
        <Stat
          icon={<ClockIcon className="h-4 w-4" />}
          label="Drive time"
          value={formatHours(totalDrivingHours)}
          accent="text-violet-600 bg-violet-50"
        />
        <Stat
          icon={<FuelIcon className="h-4 w-4" />}
          label="Fuel stops"
          value={String(result.fuel_stops.length)}
          accent="text-amber-600 bg-amber-50"
        />
        <Stat
          icon={<DocumentIcon className="h-4 w-4" />}
          label="Log days"
          value={String(logDays)}
          accent="text-slate-600 bg-slate-100"
        />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Route overview</h3>
        </div>

        <div className="px-4 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
            {stops.map(({ label, location }, i) => {
              const style = stopStyles[i];
              return (
                <div key={label} className="flex min-w-0 flex-1 items-stretch">
                  {i > 0 && (
                    <div
                      className="mx-3 hidden w-px shrink-0 self-stretch bg-slate-200 sm:block"
                      aria-hidden
                    />
                  )}
                  <div className={`w-full min-w-0 rounded-lg p-3 ${style.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${style.color}`} />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${style.text}`}>
                        {label}
                      </span>
                    </div>
                    <p className="mt-1.5 break-words text-sm font-medium text-slate-900">
                      {location || '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <FuelStopsList stops={fuelStopLocations} />
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Duty summary: </span>
          Driving {formatHours(totalDrivingHours)}
          <span className="mx-1.5 text-slate-300">·</span>
          On duty {formatHours(totalDutyHours)}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="card p-3 transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <div className={`mb-2 inline-flex rounded-md p-1.5 ${accent}`}>{icon}</div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
