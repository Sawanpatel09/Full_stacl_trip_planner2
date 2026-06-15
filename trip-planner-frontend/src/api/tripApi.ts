import type {
  TripRequest,
  TripPlanResponse,
  TripPlanApiError,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';
const TIMEOUT_MS = 120_000;

export class TripPlanError extends Error {
  readonly details?: TripPlanApiError | Record<string, unknown>;

  constructor(message: string, details?: TripPlanApiError | Record<string, unknown>) {
    super(message);
    this.name = 'TripPlanError';
    this.details = details;
  }
}

export async function planTrip(payload: TripRequest): Promise<TripPlanResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/plan-trip/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      const hint =
        response.status === 400 && text.includes('Bad Request')
          ? 'The API rejected the request (often ALLOWED_HOSTS when not using Docker/nginx). Rebuild with docker compose up -d --build, or open the app via http://localhost:8080.'
          : `Backend returned a non-JSON response (${response.status}). Check that Django is running.`;
      throw new TripPlanError(hint);
    }

    if (!response.ok) {
      const err = data as TripPlanApiError & Record<string, unknown>;
      if (
        err?.status === 'cycle_exceeded' ||
        err?.status === 'no_route' ||
        err?.status === 'location_not_found'
      ) {
        throw new TripPlanError(err.message, err);
      }

      const fieldErrors =
        data && typeof data === 'object'
          ? Object.entries(data as Record<string, unknown>)
              .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
              .join('; ')
          : '';

      throw new TripPlanError(
        fieldErrors || `Request failed (${response.status})`,
        data as Record<string, unknown>,
      );
    }

    return data as TripPlanResponse;
  } catch (err) {
    if (err instanceof TripPlanError) throw err;

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new TripPlanError(
        'Request timed out after 2 minutes. Long routes can be slow — try again, or check if the backend is stuck.',
      );
    }

    if (err instanceof TypeError) {
      throw new TripPlanError(
        'Cannot reach the backend. Start Django (e.g. python manage.py runserver 8002) and restart the frontend.',
      );
    }

    throw err;
  } finally {
    clearTimeout(timer);
  }
}
