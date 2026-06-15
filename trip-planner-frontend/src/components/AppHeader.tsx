import { DocumentIcon, FuelIcon, RouteIcon, TruckIcon } from './Icons';

const features = [
  { icon: RouteIcon, label: 'Routes', accent: 'text-blue-600' },
  { icon: FuelIcon, label: 'Fuel stops', accent: 'text-amber-600' },
  { icon: DocumentIcon, label: 'Driver logs', accent: 'text-slate-600' },
];

export function AppHeader() {
  return (
    <header className="app-header no-print shrink-0 border-b border-slate-200 bg-white">
      <div className="app-header-inner flex flex-col sm:flex-row">
        <div className="app-header-brand flex items-center gap-3.5 px-5 py-4 sm:px-6 lg:px-7">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100/80">
            <TruckIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Trip Planner</h1>
            <p className="text-xs text-slate-500">Plan your route and daily log sheets</p>
          </div>
        </div>

        <div className="app-header-nav flex flex-1 items-center gap-2 border-t border-slate-200 px-5 py-3 sm:border-t-0 sm:px-6 sm:py-4">
          {features.map(({ icon: Icon, label, accent }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${accent}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
