import requests
from django.conf import settings
import polyline

ORS_API_KEY = settings.ORS_API_KEY

FIELD_LABELS = {
    "current_location": "current location",
    "pickup_location": "pickup",
    "dropoff_location": "dropoff",
}

SEGMENT_LABELS = {
    "current_to_pickup": "current location and pickup",
    "pickup_to_dropoff": "pickup and dropoff",
}


class RoutePlanningError(Exception):
    def __init__(self, status, message, field=None, segment=None):
        self.status = status
        self.message = message
        self.field = field
        self.segment = segment

    def to_dict(self):
        payload = {"status": self.status, "message": self.message}
        if self.field:
            payload["field"] = self.field
        if self.segment:
            payload["segment"] = self.segment
        return payload


class RouteService:

    @staticmethod
    def resolve_coords(location, coords=None, field=None):
        """Use map-pinned [lat, lng] when provided; otherwise geocode the address text."""
        if coords and len(coords) == 2:
            lat, lng = coords[0], coords[1]
            return [lng, lat]

        return RouteService.geocode(location, field=field)

    @staticmethod
    def geocode(location, field=None):
        url = "https://api.openrouteservice.org/geocode/search"
        params = {
            "api_key": ORS_API_KEY,
            "text": location,
            "size": 1,
        }
        if "india" in location.lower():
            params["boundary.country"] = "IN"

        try:
            response = requests.get(url, params=params, timeout=30)
            data = response.json()
        except (requests.RequestException, ValueError) as exc:
            label = FIELD_LABELS.get(field, "location") if field else "location"
            raise RoutePlanningError(
                "location_not_found",
                f"Could not look up your {label}. Check the address or pin it on the map.",
                field=field,
            ) from exc

        if not response.ok:
            label = FIELD_LABELS.get(field, "location") if field else "location"
            raise RoutePlanningError(
                "location_not_found",
                f"Could not find your {label}: \"{location}\". Try pinning it on the map.",
                field=field,
            )

        features = data.get("features", [])
        if not features:
            label = FIELD_LABELS.get(field, "location") if field else "location"
            raise RoutePlanningError(
                "location_not_found",
                f"Could not find your {label}: \"{location}\". Try pinning it on the map.",
                field=field,
            )

        coords = features[0]["geometry"]["coordinates"]
        return coords

    @staticmethod
    def get_route(start_coords, end_coords, segment=None, from_name=None, to_name=None):
        url = "https://api.openrouteservice.org/v2/directions/driving-car"

        headers = {
            "Authorization": ORS_API_KEY,
            "Content-Type": "application/json",
        }

        body = {
            "coordinates": [
                start_coords,
                end_coords,
            ],
            # Snap pins to the nearest drivable road (critical for rural India map clicks)
            "radiuses": [-1, -1],
        }

        try:
            response = requests.post(url, json=body, headers=headers, timeout=60)
            data = response.json()
        except (requests.RequestException, ValueError) as exc:
            raise RoutePlanningError(
                "no_route",
                _no_route_message(segment, from_name, to_name),
                segment=segment,
            ) from exc

        routes = data.get("routes", []) if isinstance(data, dict) else []
        if not response.ok or not routes:
            raise RoutePlanningError(
                "no_route",
                _no_route_message(
                    segment,
                    from_name,
                    to_name,
                    ors_detail=_ors_error_detail(data),
                ),
                segment=segment,
            )

        route = routes[0]

        return {
            "distance": route["summary"]["distance"],
            "duration": route["summary"]["duration"],
            "geometry": route["geometry"],
        }


def _ors_error_detail(data):
    if not isinstance(data, dict):
        return None
    error = data.get("error")
    if isinstance(error, dict):
        return error.get("message") or error.get("code")
    return None


INDIAN_STATES_AND_UTS = {
    "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
    "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
    "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
    "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
    "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
    "andaman and nicobar islands", "chandigarh", "dadra and nagar haveli and daman and diu",
    "delhi", "jammu and kashmir", "ladakh", "lakshadweep", "puducherry",
}


def _is_vague_label(name):
    if not name:
        return False
    parts = [part.strip() for part in name.split(",") if part.strip()]
    if len(parts) >= 3:
        return False
    if not parts:
        return True
    if parts[-1].lower() not in {"india", "in"}:
        return False

    locality = parts[0].lower()
    if any(char.isdigit() for char in locality):
        return False

    specific_keywords = (
        "road", "street", "nagar", "colony", "village", "ward", "lane",
        "highway", "marg", "chowk", "bazar", "bazaar", "taluka", "tehsil",
    )
    if any(keyword in locality for keyword in specific_keywords):
        return False

    return locality in INDIAN_STATES_AND_UTS


def _no_route_message(segment=None, from_name=None, to_name=None, ors_detail=None):
    if _is_vague_label(from_name) or _is_vague_label(to_name):
        vague_name = from_name if _is_vague_label(from_name) else to_name
        return (
            f"\"{vague_name}\" is too broad (for example a whole state). "
            "Zoom in on the map and pin an exact town, village, or street — not a state or region."
        )

    if from_name and to_name:
        message = (
            f"No drivable truck route found between {from_name} and {to_name}. "
            "Pin each stop on a main road and zoom in until you see street-level detail."
        )
    elif segment and segment in SEGMENT_LABELS:
        places = SEGMENT_LABELS[segment]
        message = (
            f"No drivable truck route found between {places}. "
            "Pin each stop on a main road and zoom in until you see street-level detail."
        )
    else:
        message = (
            "No drivable truck route found between these stops. "
            "Pin each stop on a main road and zoom in until you see street-level detail."
        )

    if ors_detail:
        if "routable point" in str(ors_detail).lower():
            message = (
                "One of your pins is too far from a drivable road. "
                "Zoom in on the map and place it directly on a highway or main road."
            )
        else:
            message = f"{message} ({ors_detail})"
    return message


def check_vague_locations(data):
    """Reject state/region-only labels before calling the routing API."""
    fields = (
        ("current_location", "current location"),
        ("pickup_location", "pickup"),
        ("dropoff_location", "dropoff"),
    )
    for field, label in fields:
        name = data.get(field, "")
        if _is_vague_label(name):
            raise RoutePlanningError(
                "no_route",
                (
                    f"Your {label} \"{name}\" is too broad — it looks like a whole state or region. "
                    "Open Pin on map, zoom in to street level, and select a specific town, village, or road."
                ),
                field=field,
            )


def decode_geometry(geometry):
    return polyline.decode(geometry)
