import type { DayTimeline } from '../types';
import {
  buildLogLinePath,
  DUTY_ROWS,
  formatApiHours,
  HOUR_LABELS,
  mergeSegments,
} from '../utils/eldTimeline';

interface LogSheetInfo {
  driverName: string;
  driverId: string;
  unitNumber: string;
  totalMiles: number;
}

interface ELDLogSheetProps {
  timeline: DayTimeline;
  info: LogSheetInfo;
  remarks: string;
  onRemarksChange?: (value: string) => void;
}

const GRID_LEFT = 112;
const GRID_TOP = 0;
const CELL_W = 26;
const ROW_H = 26;
const GRID_W = 24 * CELL_W;
const GRID_H = 4 * ROW_H;

export function ELDLogSheet({
  timeline,
  info,
  remarks,
  onRemarksChange,
}: ELDLogSheetProps) {
  const merged = mergeSegments(timeline.segments);
  const svgHeight = GRID_H + 16;

  return (
    <div className="eld-log-sheet overflow-hidden rounded border border-slate-300 bg-white shadow-sm">
      {onRemarksChange && (
        <div className="no-print border-b border-slate-200 bg-slate-50 px-4 py-3">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Remarks — {timeline.date}
          </label>
          <textarea
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            rows={2}
            className="w-full resize-y rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Driver&apos;s Daily Log</h3>
            <p className="text-xs text-slate-500">Trip day {timeline.tripDay}</p>
          </div>
          <p className="text-sm font-medium tabular-nums text-slate-800">{timeline.date}</p>
        </div>

        {/* Stats straight from API eld_logs */}
        <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <MetaField label="Driver" value={info.driverName} />
          <MetaField label="Driver ID" value={info.driverId} />
          <MetaField label="Truck #" value={info.unitNumber} />
          <MetaField label="Total miles" value={String(info.totalMiles)} />
          <MetaField label="Miles today" value={String(timeline.milesToday)} />
          <MetaField label="Driving" value={formatApiHours(timeline.drivingHours)} />
          <MetaField label="On duty" value={formatApiHours(timeline.dutyHours)} />
          {timeline.pickupHours > 0 && (
            <MetaField label="Pickup" value={formatApiHours(timeline.pickupHours)} />
          )}
          {timeline.dropoffHours > 0 && (
            <MetaField label="Dropoff" value={formatApiHours(timeline.dropoffHours)} />
          )}
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${GRID_LEFT + GRID_W + 8} ${svgHeight + 8}`}
            className="min-w-[640px] w-full"
            role="img"
            aria-label={`Log grid for ${timeline.date}`}
          >
            {HOUR_LABELS.map((label, i) => (
              <text
                key={i}
                x={GRID_LEFT + i * CELL_W + CELL_W / 2}
                y={10}
                fontSize={8}
                fill="#444"
                textAnchor="middle"
              >
                {label}
              </text>
            ))}

            {DUTY_ROWS.map((row, rowIndex) => {
              const y = GRID_TOP + 16 + rowIndex * ROW_H;
              return (
                <g key={row.status}>
                  <text
                    x={GRID_LEFT - 4}
                    y={y + ROW_H / 2 + 3}
                    fontSize={8}
                    fill="#333"
                    textAnchor="end"
                  >
                    {row.label}
                  </text>
                  {Array.from({ length: 24 }).map((_, col) => (
                    <rect
                      key={col}
                      x={GRID_LEFT + col * CELL_W}
                      y={y}
                      width={CELL_W}
                      height={ROW_H}
                      fill="#fff"
                      stroke="#ccc"
                      strokeWidth={0.5}
                    />
                  ))}
                </g>
              );
            })}

            <line
              x1={GRID_LEFT + 12 * CELL_W}
              y1={GRID_TOP + 14}
              x2={GRID_LEFT + 12 * CELL_W}
              y2={GRID_TOP + 16 + GRID_H}
              stroke="#aaa"
              strokeWidth={1}
            />

            {merged.length > 0 && (
              <path
                d={buildLogLinePath(
                  timeline.segments,
                  GRID_LEFT,
                  GRID_TOP + 16,
                  CELL_W,
                  ROW_H,
                )}
                fill="none"
                stroke="#111"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            <rect
              x={GRID_LEFT}
              y={GRID_TOP + 16}
              width={GRID_W}
              height={GRID_H}
              fill="none"
              stroke="#333"
              strokeWidth={1}
            />
          </svg>
        </div>

        <div className="no-print mt-3 rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-medium text-slate-700">Info: </span>
          Driving {formatApiHours(timeline.drivingHours)}
          {timeline.pickupHours > 0 && ` · Pickup ${formatApiHours(timeline.pickupHours)}`}
          {timeline.dropoffHours > 0 && ` · Dropoff ${formatApiHours(timeline.dropoffHours)}`}
          {' · '}On duty {formatApiHours(timeline.dutyHours)}
        </div>

        {remarks.trim() && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="text-xs font-medium text-slate-500">Remarks</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{remarks}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value || '—'}</dd>
    </div>
  );
}
