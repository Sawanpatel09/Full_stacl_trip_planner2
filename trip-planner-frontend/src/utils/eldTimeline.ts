import type { DutyStatus, DayTimeline, ELDLogDay, TimelineSegment, TripContext } from '../types';
import { addDays } from './formatters';

const REST_HOURS = 10;
const TRIP_START_HOUR = 6;

function cityOnly(location: string): string {
  return location.split(',')[0].trim();
}

export function mergeSegments(segments: TimelineSegment[]): TimelineSegment[] {
  const sorted = [...segments].sort((a, b) => a.startHour - b.startHour);
  const merged: TimelineSegment[] = [];

  for (const seg of sorted) {
    const last = merged[merged.length - 1];
    if (last && last.status === seg.status && Math.abs(last.endHour - seg.startHour) < 0.01) {
      last.endHour = seg.endHour;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

/**
 * One sheet per API eld_logs[] entry.
 * All hour totals come from the API — graph is visual layout only.
 */
export function buildTimelines(
  logs: ELDLogDay[],
  tripStartDate: Date,
  context: TripContext,
): DayTimeline[] {
  const pickupCity = cityOnly(context.pickupLocation);
  const dropoffCity = cityOnly(context.dropoffLocation);
  const originCity = cityOnly(context.currentLocation);

  return logs.map((log, index) => {
    const segments: TimelineSegment[] = [];
    let hour = index === 0 ? TRIP_START_HOUR : REST_HOURS;

    if (index === 0 && TRIP_START_HOUR > 0) {
      segments.push({ status: 'off_duty', startHour: 0, endHour: TRIP_START_HOUR });
    } else if (index > 0) {
      segments.push({ status: 'off_duty', startHour: 0, endHour: REST_HOURS });
    }

    if (log.pickup_hours > 0) {
      segments.push({
        status: 'on_duty',
        startHour: hour,
        endHour: hour + log.pickup_hours,
      });
      hour += log.pickup_hours;
    }

    segments.push({
      status: 'driving',
      startHour: hour,
      endHour: hour + log.driving_hours,
    });
    hour += log.driving_hours;

    if (log.dropoff_hours > 0) {
      segments.push({
        status: 'on_duty',
        startHour: hour,
        endHour: hour + log.dropoff_hours,
      });
      hour += log.dropoff_hours;
    }

    if (hour < 24) {
      segments.push({ status: 'off_duty', startHour: hour, endHour: 24 });
    }

    const remarks: string[] = [];
    if (index === 0) remarks.push(`Left ${originCity}`);
    if (log.pickup_hours > 0) remarks.push(`Loaded at ${pickupCity}`);
    if (log.dropoff_hours > 0) remarks.push(`Unloaded at ${dropoffCity}`);

    const d = addDays(tripStartDate, log.day - 1);

    const milesToday =
      context.totalDrivingHours > 0
        ? Math.round((log.driving_hours / context.totalDrivingHours) * context.totalMiles)
        : 0;

    return {
      sheetId: `eld-log-day-${log.day}`,
      day: log.day,
      tripDay: log.day,
      date: d.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      }),
      segments,
      remarks,
      milesToday,
      drivingHours: log.driving_hours,
      dutyHours: log.duty_hours,
      pickupHours: log.pickup_hours,
      dropoffHours: log.dropoff_hours,
    };
  });
}

export function buildLogLinePath(
  segments: TimelineSegment[],
  gridLeft: number,
  gridTop: number,
  cellW: number,
  rowH: number,
): string {
  const merged = mergeSegments(segments).filter((s) => s.endHour > s.startHour);
  if (merged.length === 0) return '';

  const rowY = (status: DutyStatus) => {
    const idx = DUTY_ROWS.findIndex((r) => r.status === status);
    return gridTop + idx * rowH + rowH / 2;
  };

  let d = '';

  for (let i = 0; i < merged.length; i++) {
    const seg = merged[i];
    const start = Math.max(0, Math.min(24, seg.startHour));
    const end = Math.max(0, Math.min(24, seg.endHour));
    if (end <= start) continue;

    const y = rowY(seg.status);
    const x1 = gridLeft + start * cellW;
    const x2 = gridLeft + end * cellW;

    if (i === 0 || d === '') {
      d += `M ${x1} ${y}`;
    } else {
      const prev = merged[i - 1];
      const prevEnd = Math.min(24, prev.endHour);
      const prevY = rowY(prev.status);
      if (prevY !== y) {
        d += ` L ${gridLeft + prevEnd * cellW} ${prevY} L ${x1} ${y}`;
      } else if (Math.abs(x1 - (gridLeft + prevEnd * cellW)) > 0.5) {
        d += ` M ${x1} ${y}`;
      }
    }

    d += ` L ${x2} ${y}`;
  }

  return d;
}

export const DUTY_ROWS: { status: DutyStatus; label: string }[] = [
  { status: 'off_duty', label: 'Off duty' },
  { status: 'sleeper', label: 'Sleeper' },
  { status: 'driving', label: 'Driving' },
  { status: 'on_duty', label: 'On duty (ND)' },
];

export const HOUR_LABELS = [
  'M', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
  'N', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
];

export function formatLogTime(hour: number): string {
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return m > 0 ? `${display}:${String(m).padStart(2, '0')} ${suffix}` : `${display} ${suffix}`;
}

export function formatHoursShort(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatApiHours(hours: number): string {
  if (hours === 0) return '0h';
  return formatHoursShort(hours);
}
