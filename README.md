# Trip Planner

A full-stack truck trip planning app for drivers and dispatchers. Enter a current location, pickup, and dropoff to get a drivable route, fuel stop suggestions, and daily ELD (Electronic Logging Device) log sheets — all in one place.

## What it does

| Feature | Description |
|--------|-------------|
| **Route planning** | Calculates a two-leg route: current → pickup → dropoff using [OpenRouteService](https://openrouteservice.org/) |
| **Interactive map** | Pin exact stops on OpenStreetMap, search addresses, or use GPS for current location |
| **Fuel stops** | Suggests refuel points every ~200 miles along the route |
| **ELD log sheets** | Builds daily driving logs with 11-hour driving limits and a 70-hour cycle check |
| **Driver details** | Capture driver name, ID, and truck number for log sheet output |

The backend geocodes and routes via OpenRouteService. The frontend sends map coordinates with each request so rural and Indian addresses route reliably when pins are placed on actual roads.

## Architecture

```
Browser  →  nginx (frontend container)  →  static React app
                    │
                    └─ /api/*  →  Gunicorn + Django (backend container)  →  OpenRouteService API
```

| Layer | Stack |
|-------|--------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Leaflet |
| Backend | Django 5, Django REST Framework, Gunicorn |
| Deployment | Docker Compose, nginx reverse proxy |
| External APIs | OpenRouteService (routing/geocoding), Nominatim (map search/reverse geocode) |

## Project structure

```
fullstack-trip-planner/
├── .env                    # Single env file for the whole project (not committed)
├── .env.example            # Template — copy and fill in your keys
├── docker-compose.yml      # Production-style stack (backend + frontend)
├── trip-planner-backend/   # Django API
│   ├── config/             # Settings, URLs, WSGI
│   └── trip_planner/       # Views, serializers, route/fuel/ELD services
└── trip-planner-frontend/  # React SPA
    ├── src/                # Components, API client, map utilities
    ├── nginx.conf          # Serves SPA and proxies /api to backend
    └── Dockerfile
```

## Prerequisites

- **Docker & Docker Compose** (recommended), or
- **Node.js 22+** and **Python 3.12+** for local development
- An **OpenRouteService API key** — [sign up free](https://openrouteservice.org/dev/#/signup)

## Quick start (Docker)

1. **Clone and configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set at minimum:

   - `ORS_API_KEY` — your OpenRouteService key
   - `DJANGO_SECRET_KEY` — a long random string for production

2. **Build and run**

   ```bash
   docker compose up -d --build
   ```

3. **Open the app**

   Visit [http://localhost:8080](http://localhost:8080) (or the port set in `FRONTEND_PORT`).

4. **Stop the stack**

   ```bash
   docker compose down
   ```

### Docker services

| Service | Role | Exposed port |
|---------|------|----------------|
| `frontend` | nginx — React build + `/api` proxy | `FRONTEND_PORT` (default `80`, example uses `8080`) |
| `backend` | Django + Gunicorn | Internal only (`8000`) |

Health check: `GET /api/health/` returns `{"status":"ok"}`.

## Local development (without Docker)

All environment variables live in the **repo root** `.env` file. Both apps read from there.

### Backend

```bash
cd trip-planner-backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver 8003
```

API base: `http://127.0.0.1:8003/api/`

### Frontend

```bash
cd trip-planner-frontend
npm install
npm run dev
```

Vite proxies `/api` to `VITE_BACKEND_TARGET` from root `.env` (default `http://127.0.0.1:8003`).

Dev server: typically [http://localhost:5173](http://localhost:5173)

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ORS_API_KEY` | Yes | OpenRouteService API key |
| `DJANGO_SECRET_KEY` | Yes (prod) | Django secret; use a strong value in production |
| `DEBUG` | No | `true` or `false` (default `false` in Docker) |
| `ALLOWED_HOSTS` | No | Comma-separated hosts for Django (default includes `backend` for Docker) |
| `VITE_API_URL` | No | API path baked into frontend build (default `/api`) |
| `VITE_BACKEND_TARGET` | Dev only | Django URL for Vite dev proxy |
| `FRONTEND_PORT` | No | Host port mapped to nginx (e.g. `8080`) |

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health/` | Health check |
| `POST` | `/api/plan-trip/` | Plan a trip |

**Example request**

```json
{
  "current_location": "Sukhakheri, Madhya Pradesh, India",
  "pickup_location": "Kanpur, Uttar Pradesh, India",
  "dropoff_location": "Bhopal, Madhya Pradesh, India",
  "current_cycle_used": 10,
  "current_coords": [22.815, 78.802],
  "pickup_coords": [26.45, 80.33],
  "dropoff_coords": [23.26, 77.41]
}
```

Coordinates are `[latitude, longitude]` from map pins. They are strongly recommended for accurate routing.

**Example success fields:** `distance_meters`, `duration_seconds`, `fuel_stops`, `eld_logs`, `segments`

**Example error statuses:** `no_route`, `location_not_found`, `cycle_exceeded`

## Using the app

1. **Pin all three stops** on the map (or use GPS for current location). Search for a **town, village, or street** — not a whole state like “Uttar Pradesh, India”.
2. Zoom in until you see roads and place the pin on a **main road**.
3. Set **hours used this cycle** (0–70 h) and fill in driver / truck details.
4. Click **Plan trip** to view the route map, fuel stops, and ELD log sheets.

## Production notes

- Set `DEBUG=false` and a strong `DJANGO_SECRET_KEY`.
- Put TLS termination (e.g. Caddy, Traefik, or a cloud load balancer) in front of the `frontend` service.
- Add your public domain to `ALLOWED_HOSTS` if Django is reached directly; with the included nginx setup, the backend uses an internal `Host: backend` header.
- Never commit `.env` — it is listed in `.gitignore`.

## Scripts reference

**Frontend** (`trip-planner-frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

**Backend** (`trip-planner-backend/`)

| Command | Description |
|---------|-------------|
| `python manage.py runserver 8003` | Dev server |
| `gunicorn config.wsgi:application --bind 0.0.0.0:8000` | Production server (used in Docker) |

## License

Private / educational use — add a license file if you plan to open-source this project.


.env.example setup

# Django
DJANGO_SECRET_KEY=change-me-to-a-long-random-string-at-least-50-chars
DEBUG=false
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# OpenRouteService — required for geocoding and routing
# Get a free key at https://openrouteservice.org/dev/#/signup
ORS_API_KEY=your-openrouteservice-api-key

# Frontend — use /api when nginx proxies to Django (Docker production)
VITE_API_URL=/api

# Local Vite dev only — Django URL for the dev proxy (ignored in Docker)
VITE_BACKEND_TARGET=http://127.0.0.1:8003

# Host port for the web UI when using Docker Compose
FRONTEND_PORT=8080
