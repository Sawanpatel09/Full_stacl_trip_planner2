import { useEffect, useState } from 'react';
import {
  LOADING_ALL_COMPLETE_MS,
  LOADING_STEP_INTERVAL_MS,
} from '../utils/loadingTiming';
import { CheckIcon } from './Icons';
import { TruckLoader } from './TruckLoader';

const STEPS = [
  'Geocoding locations',
  'Calculating route',
  'Building log sheets',
] as const;

type StepStatus = 'pending' | 'active' | 'complete';

function stepStatus(index: number, activeIndex: number): StepStatus {
  if (activeIndex >= STEPS.length || index < activeIndex) return 'complete';
  if (index === activeIndex) return 'active';
  return 'pending';
}

export function LoadingOverlay() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    const timers = [
      window.setTimeout(() => setActiveIndex(1), LOADING_STEP_INTERVAL_MS),
      window.setTimeout(() => setActiveIndex(2), LOADING_STEP_INTERVAL_MS * 2),
      window.setTimeout(() => setActiveIndex(STEPS.length), LOADING_ALL_COMPLETE_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const progressPercent =
    activeIndex >= STEPS.length ? 100 : (activeIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="card w-full px-6 py-16 text-center">
      <TruckLoader />
      <p className="text-base font-semibold text-slate-800">Planning your trip…</p>
      <p className="mt-2 text-sm text-slate-500">
        Long routes can take a little longer while we look up locations.
      </p>

      <div className="mx-auto mt-8 max-w-xs text-left">
        <div className="relative">
          <div
            className="absolute left-[0.6875rem] top-3 bottom-3 w-0.5 overflow-hidden bg-slate-200"
            aria-hidden
          >
            <div
              className="w-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ height: `${progressPercent}%` }}
            />
          </div>

          <ol className="relative space-y-5">
            {STEPS.map((label, index) => {
              const status = stepStatus(index, activeIndex);
              return (
                <li key={label} className="flex items-center gap-3">
                  <StepIndicator status={status} />
                  <span
                    className={`text-sm transition-colors duration-300 ${
                      status === 'complete'
                        ? 'font-medium text-emerald-700'
                        : status === 'active'
                          ? 'font-semibold text-blue-700'
                          : 'text-slate-400'
                    }`}
                  >
                    {label}
                    {status === 'active' && (
                      <span className="ml-1.5 inline-block animate-pulse-soft text-blue-500">
                        …
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ status }: { status: StepStatus }) {
  if (status === 'complete') {
    return (
      <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]">
        <CheckIcon />
      </span>
    );
  }

  if (status === 'active') {
    return (
      <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center">
        <span className="absolute h-6 w-6 animate-ping rounded-full bg-blue-400 opacity-40" />
        <span className="relative h-4 w-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.7)]" />
      </span>
    );
  }

  return (
    <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center">
      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
    </span>
  );
}
