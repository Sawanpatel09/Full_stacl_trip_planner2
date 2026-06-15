class ELDService:
    MAX_DRIVING_HOURS_PER_DAY = 11
    MAX_CYCLE_HOURS = 70

    @staticmethod
    def generate_logs(total_driving_hours, current_cycle_used):
        remaining_cycle = (
            ELDService.MAX_CYCLE_HOURS - current_cycle_used
        )

        if total_driving_hours > remaining_cycle:
            return {
                "status": "cycle_exceeded",
                "remaining_cycle_hours": remaining_cycle,
                "required_hours": round(total_driving_hours, 2),
                "message": "Trip cannot be completed legally."
            }

        logs = []

        day = 1
        remaining_hours = total_driving_hours

        while remaining_hours > 0:

            driving_today = min(
                remaining_hours,
                ELDService.MAX_DRIVING_HOURS_PER_DAY
            )

            logs.append({
                "day": day,
                "driving_hours": round(driving_today, 2),
                "pickup_hours": 0,
                "dropoff_hours": 0,
                "duty_hours": round(driving_today,2)
            })

            remaining_hours -= driving_today
            day += 1

        # pickup on first day
        logs[0]["pickup_hours"] = 1
        logs[0]["duty_hours"] += 1

        # dropoff on last day
        logs[-1]["dropoff_hours"] = 1
        logs[-1]["duty_hours"] += 1

        return {
            "status": "success",
            "eld_logs": logs,
            "trip_driving_hours": round(total_driving_hours, 2)
        }