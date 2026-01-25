from datetime import datetime, timedelta
from typing import List, Dict
from collections import defaultdict


def generate_insights(
    activities: List[Dict], interruptions: List[Dict]
) -> Dict[str, any]:
    """Generate explainable insights from user data."""

    if not activities:
        return {
            "peak_focus_window": "Not enough data yet",
            "distraction_hotspot": "Not enough data yet",
            "consistency_score": 0.0,
            "balance_ratio": 0.5,
            "suggestion": "Start logging your activities to see insights.",
        }

    # Parse activities
    focus_activities = [
        a for a in activities if a["category"] in ["Study", "Coding", "Work", "Reading"]
    ]
    rest_activities = [a for a in activities if a["category"] == "Rest"]

    # Calculate peak focus window
    hour_focus = defaultdict(float)
    for activity in focus_activities:
        start = datetime.fromisoformat(activity["start_time"].replace("Z", "+00:00"))
        end = datetime.fromisoformat(activity["end_time"].replace("Z", "+00:00"))
        duration = (end - start).total_seconds() / 60  # minutes

        hour = start.hour
        hour_focus[hour] += duration

    if hour_focus:
        peak_hour = max(hour_focus.items(), key=lambda x: x[1])[0]
        peak_window = f"{peak_hour:02d}:00 - {(peak_hour + 1) % 24:02d}:00"
    else:
        peak_window = "No focus time logged yet"

    # Calculate distraction hotspot
    hour_interruptions = defaultdict(int)
    for interruption in interruptions:
        time = datetime.fromisoformat(interruption["time"].replace("Z", "+00:00"))
        hour_interruptions[time.hour] += 1

    if hour_interruptions:
        hotspot_hour = max(hour_interruptions.items(), key=lambda x: x[1])[0]
        distraction_hotspot = f"Most interruptions around {hotspot_hour:02d}:00"
    else:
        distraction_hotspot = "No interruptions logged"

    # Calculate consistency score (how similar are daily patterns)
    daily_focus = defaultdict(float)
    for activity in focus_activities:
        start = datetime.fromisoformat(activity["start_time"].replace("Z", "+00:00"))
        end = datetime.fromisoformat(activity["end_time"].replace("Z", "+00:00"))
        duration = (end - start).total_seconds() / 60

        day = start.date()
        daily_focus[day] += duration

    if len(daily_focus) > 1:
        focus_values = list(daily_focus.values())
        avg_focus = sum(focus_values) / len(focus_values)
        variance = sum((v - avg_focus) ** 2 for v in focus_values) / len(focus_values)
        std_dev = variance**0.5
        consistency_score = max(0, 1 - (std_dev / (avg_focus + 1)))
    else:
        consistency_score = 0.5

    # Calculate balance ratio
    total_focus = sum(
        (
            datetime.fromisoformat(a["end_time"].replace("Z", "+00:00"))
            - datetime.fromisoformat(a["start_time"].replace("Z", "+00:00"))
        ).total_seconds()
        / 60
        for a in focus_activities
    )
    total_rest = sum(
        (
            datetime.fromisoformat(a["end_time"].replace("Z", "+00:00"))
            - datetime.fromisoformat(a["start_time"].replace("Z", "+00:00"))
        ).total_seconds()
        / 60
        for a in rest_activities
    )
    total_time = total_focus + total_rest
    balance_ratio = total_focus / total_time if total_time > 0 else 0.5

    # Generate suggestion
    suggestions = []
    if balance_ratio > 0.8:
        suggestions.append("Consider adding more rest time to your schedule.")
    elif balance_ratio < 0.3:
        suggestions.append("You might benefit from more focused work blocks.")
    if hour_interruptions and max(hour_interruptions.values()) > 3:
        suggestions.append(
            "Try scheduling deep work during hours with fewer interruptions."
        )
    if consistency_score < 0.5:
        suggestions.append(
            "A more consistent schedule might help you find better focus."
        )
    if not suggestions:
        suggestions.append("Keep tracking to discover more patterns.")

    suggestion = (
        " ".join(suggestions) if suggestions else "Keep logging your activities."
    )

    return {
        "peak_focus_window": f"Your focus is strongest between {peak_window}",
        "distraction_hotspot": distraction_hotspot,
        "consistency_score": round(consistency_score, 2),
        "balance_ratio": round(balance_ratio, 2),
        "suggestion": suggestion,
    }
