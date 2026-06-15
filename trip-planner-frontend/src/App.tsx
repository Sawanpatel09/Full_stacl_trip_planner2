import { useCallback, useMemo, useState } from 'react';
import { planTrip, TripPlanError } from './api/tripApi';
import { TripForm } from './components/TripForm';
import { RouteMap } from './components/RouteMap';
import { TripSummary } from './components/TripSummary';
import { ELDLogsPanel } from './components/ELDLogsPanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorAlert, EmptyState } from './components/Feedback';
import { AppHeader } from './components/AppHeader';
import { DocumentIcon, RouteIcon } from './components/Icons';
import type { TripFormInput, TripPlanResponse, FuelStop } from './types';
import { buildTimelines } from './utils/eldTimeline';
import { useFuelStopLocations } from './hooks/useFuelStopLocations';
import { metersToMiles } from './utils/formatters';
import { delay, MIN_LOADING_DISPLAY_MS } from './utils/loadingTiming';

const EMPTY_FUEL_STOPS: FuelStop[] = [];

const DEFAULT_FORM: TripFormInput = {
  currentLocation: '',
  pickupLocation: '',
  dropoffLocation: '',
  currentCoords: null,
  pickupCoords: null,
  dropoffCoords: null,
  currentCycleUsed: 10,
  driverName: '',
  driverId: '',
  unitNumber: '',
};

export default function App() {
  const [form, setForm] = useState<TripFormInput>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details?: Record<string, unknown> } | null>(null);
  const [result, setResult] = useState<TripPlanResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'logs'>('map');
  const [tripStartDate] = useState(() => new Date());

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);

    const minDisplay = delay(MIN_LOADING_DISPLAY_MS);

    try {
      const data = await planTrip({
        current_location: form.currentLocation.trim(),
        pickup_location: form.pickupLocation.trim(),
        dropoff_location: form.dropoffLocation.trim(),
        current_cycle_used: form.currentCycleUsed,
        current_coords: form.currentCoords,
        pickup_coords: form.pickupCoords,
        dropoff_coords: form.dropoffCoords,
      });
      await minDisplay;
      setResult(data);
      setActiveTab('map');
    } catch (err) {
      await minDisplay;
      setResult(null);
      if (err instanceof TripPlanError) {
        setError({ message: err.message, details: err.details as Record<string, unknown> });
      } else {
        setError({
          message: err instanceof Error ? err.message : 'Could not reach the server.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [form]);

  const handleReset = useCallback(() => {
    setForm(DEFAULT_FORM);
    setResult(null);
    setError(null);
  }, []);

  const timelines = useMemo(() => {
    if (!result) return [];
    const totalMiles = metersToMiles(result.distance_meters);
    const totalDrivingHours = result.eld_logs.reduce((s, l) => s + l.driving_hours, 0);
    return buildTimelines(result.eld_logs, tripStartDate, {
      currentLocation: form.currentLocation,
      pickupLocation: form.pickupLocation,
      dropoffLocation: form.dropoffLocation,
      totalMiles,
      totalDrivingHours,
    });
  }, [result, tripStartDate, form]);

  const fuelStops = useMemo(
    () => result?.fuel_stops ?? EMPTY_FUEL_STOPS,
    [result],
  );
  const fuelStopLocations = useFuelStopLocations(fuelStops);

  return (
    <div className="flex min-h-full flex-col lg:h-full lg:overflow-hidden">
      <AppHeader />

      <div className="app-panels flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <aside className="panel-form no-print flex flex-col border-b lg:min-h-0 lg:overflow-hidden">
          <div className="panel-header shrink-0">
            <h2 className="text-base font-semibold text-slate-800">Trip details</h2>
            <p className="mt-0.5 text-sm text-slate-500">Enter route and driver info</p>
          </div>
          <div className="scroll-pane flex-1 px-5 py-6 sm:px-6 lg:overflow-y-auto lg:px-7">
            <TripForm
              values={form}
              onChange={setForm}
              onSubmit={handleSubmit}
              onReset={handleReset}
              loading={loading}
            />
          </div>
        </aside>

        <section className="panel-dashboard flex min-w-0 flex-1 flex-col lg:min-h-0 lg:overflow-hidden">
          <div className="panel-header no-print hidden shrink-0 lg:block">
            <h2 className="text-sm font-semibold text-slate-800">Dashboard</h2>
            <p className="mt-0.5 text-xs text-slate-500">Route, fuel stops, map and driver logs</p>
          </div>
          <div className="scroll-pane flex-1 space-y-5 px-4 py-5 sm:px-6 lg:overflow-y-auto">
            {loading && <LoadingOverlay />}

            {!loading && error && (
              <ErrorAlert message={error.message} details={error.details} />
            )}

            {!loading && !error && !result && <EmptyState />}

            {!loading && result && (
              <>
                <div className="no-print">
                  <TripSummary
                    result={result}
                    formInput={form}
                    fuelStopLocations={fuelStopLocations}
                  />
                </div>

                <div className="no-print flex border-b border-slate-200 bg-white lg:hidden">
                  <button
                    type="button"
                    onClick={() => setActiveTab('map')}
                    className={`tab-btn flex-1 ${activeTab === 'map' ? 'active' : ''}`}
                  >
                    <RouteIcon className="h-4 w-4" />
                    Map
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('logs')}
                    className={`tab-btn flex-1 ${activeTab === 'logs' ? 'active' : ''}`}
                  >
                    <DocumentIcon className="h-4 w-4" />
                    Logs
                    <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {timelines.length}
                    </span>
                  </button>
                </div>

                <div
                  className={`card overflow-hidden p-4 no-print ${activeTab === 'map' ? 'block' : 'hidden lg:block'}`}
                >
                  <h2 className="mb-3 hidden text-sm font-semibold text-slate-800 lg:block">Route map</h2>
                  <RouteMap
                    segments={result.segments}
                    fuelStops={fuelStopLocations}
                    labels={{
                      current: form.currentLocation,
                      pickup: form.pickupLocation,
                      dropoff: form.dropoffLocation,
                    }}
                  />
                </div>

                <div
                  id="eld-logs-print"
                  className={`print-logs card p-4 ${activeTab === 'logs' ? 'block' : 'hidden lg:block'}`}
                >
                  <h2 className="mb-3 hidden text-sm font-semibold text-slate-800 lg:block no-print">
                    Driver logs
                  </h2>
                  <ELDLogsPanel
                    timelines={timelines}
                    totalMiles={Math.round(metersToMiles(result.distance_meters))}
                    logInfo={{
                      driverName: form.driverName,
                      driverId: form.driverId,
                      unitNumber: form.unitNumber,
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
