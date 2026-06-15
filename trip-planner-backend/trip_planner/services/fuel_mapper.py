import math

from .fuel_service import FuelService


def haversine(p1, p2):
    lat1, lon1 = p1
    lat2, lon2 = p2

    R = 6371000  

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return R * c


class FuelMapper:

    @staticmethod
    def map_stops(route_points, fuel_stops, total_distance):
        mapped = []

        interval = FuelService.FUEL_INTERVAL
        stop_distance = interval

        i = 0
        n = len(route_points)
        for stop in range(len(fuel_stops)):
            ratio = stop_distance / total_distance
            index = int(ratio * (n - 1))

            mapped.append({
                "type": "fuel_stop",
                "coordinates": route_points[min(index, n-1)]
            })

            stop_distance += interval

        return mapped