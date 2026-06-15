class FuelService:

    FUEL_INTERVAL = 200 * 1609.34 # miles → meters

    @staticmethod
    def calculate_fuel_stops(distance_meters):
        stops = []

        interval = FuelService.FUEL_INTERVAL
        current = interval

        while current < distance_meters:

            stops.append({
                "mile_marker_meters": current
            })
            current += interval

        return stops