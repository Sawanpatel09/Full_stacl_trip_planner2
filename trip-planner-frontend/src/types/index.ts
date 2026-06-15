export interface TripRequest {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
  current_coords?: [number, number] | null;
  pickup_coords?: [number, number] | null;
  dropoff_coords?: [number, number] | null;
}

export interface FuelStop {
  type: string;
  coordinates: [number, number];
}

export interface ELDLogDay {
  day: number;
  driving_hours: number;
  pickup_hours: number;
  dropoff_hours: number;
  duty_hours: number;
}

export interface RouteSegment {
  distance: number;
  duration: number;
  geometry: string;
}

export interface TripPlanResponse {
  distance_meters: number;
  duration_seconds: number;
  fuel_stops: FuelStop[];
  eld_logs: ELDLogDay[];
  segments: RouteSegment[];
}

export interface CycleExceededError {
  status: 'cycle_exceeded';
  remaining_cycle_hours: number;
  required_hours: number;
  message: string;
}

export interface NoRouteError {
  status: 'no_route';
  message: string;
  segment?: 'current_to_pickup' | 'pickup_to_dropoff';
}

export interface LocationNotFoundError {
  status: 'location_not_found';
  message: string;
  field?: 'current_location' | 'pickup_location' | 'dropoff_location';
}

export type TripPlanApiError = CycleExceededError | NoRouteError | LocationNotFoundError;

export interface TripFormInput {
  currentLocation: string;
  pickupLocation: string;
  dropoffLocation: string;
  currentCoords: [number, number] | null;
  pickupCoords: [number, number] | null;
  dropoffCoords: [number, number] | null;
  currentCycleUsed: number;
  driverName: string;
  driverId: string;
  unitNumber: string;
}

export type DutyStatus = 'off_duty' | 'sleeper' | 'driving' | 'on_duty';

export interface TimelineSegment {
  status: DutyStatus;
  startHour: number;
  endHour: number;
}

export interface DayTimeline {
  sheetId: string;
  day: number;
  tripDay: number;
  date: string;
  segments: TimelineSegment[];
  remarks: string[];
  milesToday: number;
  /** From API eld_logs.driving_hours */
  drivingHours: number;
  /** From API eld_logs.duty_hours */
  dutyHours: number;
  /** From API eld_logs.pickup_hours */
  pickupHours: number;
  /** From API eld_logs.dropoff_hours */
  dropoffHours: number;
}

export interface TripContext {
  currentLocation: string;
  pickupLocation: string;
  dropoffLocation: string;
  totalMiles: number;
  totalDrivingHours: number;
}

export interface RouteMarkers {
  start: [number, number];
  pickup: [number, number];
  dropoff: [number, number];
}
