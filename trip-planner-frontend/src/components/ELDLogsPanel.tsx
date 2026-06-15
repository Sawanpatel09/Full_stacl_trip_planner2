import { useEffect, useState } from 'react';
import type { DayTimeline } from '../types';
import { ELDLogSheet } from './ELDLogSheet';
import { DocumentIcon } from './Icons';

interface LogSheetInfo {
  driverName: string;
  driverId: string;
  unitNumber: string;
}

interface ELDLogsPanelProps {
  timelines: DayTimeline[];
  totalMiles: number;
  logInfo: LogSheetInfo;
}

export function ELDLogsPanel({ timelines, totalMiles, logInfo }: ELDLogsPanelProps) {
  const [remarksBySheet, setRemarksBySheet] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const t of timelines) {
      initial[t.sheetId] = t.remarks.join('\n');
    }
    setRemarksBySheet(initial);
  }, [timelines]);

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <DocumentIcon className="h-4 w-4 text-slate-400" />
          <span>
            <strong className="font-semibold text-slate-800">{timelines.length}</strong>
            {' daily log sheet'}
            {timelines.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          Print all
        </button>
      </div>

      <div className="space-y-6">
        {timelines.map((timeline, index) => (
          <div key={timeline.sheetId}>
            {index > 0 && (
              <div className="no-print mb-4 border-t border-dashed border-slate-200" />
            )}
            <ELDLogSheet
              timeline={timeline}
              info={{ ...logInfo, totalMiles }}
              remarks={remarksBySheet[timeline.sheetId] ?? ''}
              onRemarksChange={(value) =>
                setRemarksBySheet((prev) => ({ ...prev, [timeline.sheetId]: value }))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
