from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
from io import StringIO
import csv
from app.core.auth import get_current_user
from app.core.database import supabase
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/export")
@limiter.limit("30/minute")  # Stricter limit for export (can be resource-intensive)
async def export_data(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Export user data as CSV. Rate limited to 30 requests per minute."""
    try:
        # Get all activities and interruptions
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=365)  # Last year

        activities_result = (
            supabase.table("activities")
            .select("*")
            .eq("user_id", user_id)
            .gte("start_time", start_date.isoformat())
            .order("start_time", desc=False)
            .execute()
        )

        interruptions_result = (
            supabase.table("interruptions")
            .select("*")
            .eq("user_id", user_id)
            .gte("time", start_date.isoformat())
            .order("time", desc=False)
            .execute()
        )

        activities = activities_result.data or []
        interruptions = interruptions_result.data or []

        # Create CSV
        output = StringIO()
        writer = csv.writer(output)

        # Write activities
        writer.writerow(
            ["Type", "Category/Type", "Start Time", "End Time", "Note", "Timezone"]
        )
        for activity in activities:
            writer.writerow(
                [
                    "Activity",
                    activity["category"],
                    activity["start_time"],
                    activity["end_time"],
                    activity.get("note") or "",
                    "UTC",  # All times in UTC
                ]
            )

        # Write interruptions
        for interruption in interruptions:
            writer.writerow(
                [
                    "Interruption",
                    interruption["type"],
                    interruption["time"],
                    interruption.get("end_time") or "",
                    interruption.get("note") or "",
                    "UTC",  # All times in UTC
                ]
            )

        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="routine-export-{datetime.now().strftime("%Y%m%d")}.csv"'
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while exporting data"
        )
