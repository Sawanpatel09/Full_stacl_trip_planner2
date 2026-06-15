from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import TripPlanSerializer
from .services.route_service import RouteService, RoutePlanningError, check_vague_locations
from .services.fuel_service import FuelService
from .services.fuel_mapper import FuelMapper
from .services.eld_service import ELDService
import polyline


class HealthAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class TripPlanAPIView(APIView):

    def post(self, request):
        serializer = TripPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            check_vague_locations(data)

            start = RouteService.resolve_coords(
                data["current_location"],
                coords=data.get("current_coords"),
                field="current_location",
            )
            pickup = RouteService.resolve_coords(
                data["pickup_location"],
                coords=data.get("pickup_coords"),
                field="pickup_location",
            )
            dropoff = RouteService.resolve_coords(
                data["dropoff_location"],
                coords=data.get("dropoff_coords"),
                field="dropoff_location",
            )

            route1 = RouteService.get_route(
                start,
                pickup,
                segment="current_to_pickup",
                from_name=data["current_location"],
                to_name=data["pickup_location"],
            )
            route2 = RouteService.get_route(
                pickup,
                dropoff,
                segment="pickup_to_dropoff",
                from_name=data["pickup_location"],
                to_name=data["dropoff_location"],
            )
        except RoutePlanningError as exc:
            return Response(exc.to_dict(), status=400)

        total_distance = route1["distance"] + route2["distance"]
        total_duration = route1["duration"] + route2["duration"]


        route_points = polyline.decode(route1["geometry"]) + polyline.decode(route2["geometry"])


        fuel_stops = FuelService.calculate_fuel_stops(total_distance)


        fuel_mapped = FuelMapper.map_stops(route_points, fuel_stops, total_distance)

        total_driving_hours = total_duration / 3600

        eld_result = ELDService.generate_logs(
            total_driving_hours,
            data["current_cycle_used"]
        )

        if eld_result["status"] == "cycle_exceeded":
            return Response(eld_result, status=400)
        


        return Response({
            "distance_meters": total_distance,
            "duration_seconds": total_duration,
            "fuel_stops": fuel_mapped,
            "eld_logs": eld_result["eld_logs"],
            "segments": [route1, route2]
        })