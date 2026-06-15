import type { CycleExceededError, LocationNotFoundError, NoRouteError, TripPlanApiError } from '../types';
import { formatHours } from '../utils/formatters';
import { AlertIcon, DocumentIcon, MapPinIcon, RouteIcon } from './Icons';

interface ErrorAlertProps {
  message: string;
  details?: TripPlanApiError | Record<string, unknown>;
}

const FIELD_LABELS: Record<string, string> = {
  current_location: 'Current location',
  pickup_location: 'Pickup',
  dropoff_location: 'Dropoff',
};

export function ErrorAlert({ message, details }: ErrorAlertProps) {
  const apiError = details as TripPlanApiError | undefined;

  if (apiError?.status === 'cycle_exceeded') {
    return <CycleExceededAlert details={apiError} message={message} />;
  }

  if (apiError?.status === 'no_route') {
    return <NoRouteAlert details={apiError} message={message} />;
  }

  if (apiError?.status === 'location_not_found') {
    return <LocationNotFoundAlert details={apiError} message={message} />;
  }

  return (
    <div role="alert" className="card flex w-full gap-3 border-red-200 bg-red-50 p-5">
      <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div className="text-sm">
        <p className="font-semibold text-red-900">{message}</p>
      </div>
    </div>
  );
}

function NoRouteAlert({ message, details }: { message: string; details: NoRouteError }) {
  return (
    <div role="alert" className="card w-full overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-7 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <RouteIcon className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No drivable route</h2>
        </div>
      </div>

      <div className="space-y-4 px-7 py-6 text-base text-slate-600">
        <p className="leading-relaxed">{message || details.message}</p>
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3.5 text-sm text-slate-700">
          Routes follow real roads. Each stop must be a specific place on a connected road network
          — pin a town, village, or street, not a whole state like &quot;Uttar Pradesh, India&quot;.
        </p>
        <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
          Update your locations on the left, or use <span className="font-medium text-slate-700">Pin on map</span>{' '}
          to place stops on reachable roads.
        </p>
      </div>
    </div>
  );
}

function LocationNotFoundAlert({
  message,
  details,
}: {
  message: string;
  details: LocationNotFoundError;
}) {
  const fieldLabel = details.field ? FIELD_LABELS[details.field] : null;

  return (
    <div role="alert" className="card w-full overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-7 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <MapPinIcon className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            {fieldLabel ? `${fieldLabel} not found` : 'Location not found'}
          </h2>
        </div>
      </div>

      <div className="space-y-4 px-7 py-6 text-base text-slate-600">
        <p className="leading-relaxed">{message || details.message}</p>
        <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
          Use <span className="font-medium text-slate-700">Pin on map</span> to place the exact spot,
          or search for a nearby city or address.
        </p>
      </div>
    </div>
  );
}

function CycleExceededAlert({
  message,
  details,
}: {
  message: string;
  details: CycleExceededError;
}) {
  const remaining = details.remaining_cycle_hours;
  const required = details.required_hours;
  const shortfall = Math.max(0, required - remaining);

  return (
    <div role="alert" className="card w-full overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-7 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-red-600">
            <AlertIcon className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{message}</h2>
        </div>
      </div>

      <div className="space-y-4 px-7 py-6 text-base text-slate-600">
        <p className="leading-relaxed">
          You have{' '}
          <strong className="font-semibold text-slate-900">{formatHours(remaining)}</strong> left on
          your 70-hour cycle.
        </p>
        <p className="leading-relaxed">
          This trip needs{' '}
          <strong className="font-semibold text-slate-900">{formatHours(required)}</strong> of
          driving.
        </p>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3.5 text-base font-semibold text-slate-800">
          You are {formatHours(shortfall)} short.
        </div>

        <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
          Lower <span className="font-medium text-slate-700">hours used this cycle</span> in the
          form, or pick a shorter route.
        </p>
      </div>
    </div>
  );
}

const steps = [
  { icon: MapPinIcon, text: 'Enter your current location, pickup, and dropoff' },
  { icon: RouteIcon, text: 'Set how many hours you have already used this cycle' },
  { icon: DocumentIcon, text: 'View the route map, fuel stops, and daily log sheets' },
];

export function EmptyState() {
  return (
    <div className="card flex w-full flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <RouteIcon className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Plan your next trip</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Enter route details on the left to calculate distance, fuel stops, and driver log sheets.
      </p>

      <ol className="mt-8 w-full max-w-md space-y-3 text-left">
        {steps.map(({ icon: Icon, text }, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
              <Icon className="h-4 w-4" />
            </span>
            <span className="pt-0.5">
              <span className="font-medium text-slate-700">Step {i + 1}. </span>
              {text}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
