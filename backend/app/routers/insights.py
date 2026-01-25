from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.core.auth import get_current_user
from app.core.database import supabase
from app.services.insights import generate_insights
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class InsightResponse(BaseModel):
    peak_focus_window: str
    distraction_hotspot: str
    consistency_score: float
    balance_ratio: float
    suggestion: str


@router.get("/insights", response_model=InsightResponse)
@limiter.limit("100/minute")  # Read operation
async def get_insights(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Generate insights for the current user. Rate limited to 100 requests per minute."""
    try:
        # Get last 7 days of data
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)

        # Fetch activities
        activities_result = (
            supabase.table("activities")
            .select("*")
            .eq("user_id", user_id)
            .gte("start_time", start_date.isoformat())
            .lte("start_time", end_date.isoformat())
            .execute()
        )

        # Fetch interruptions
        interruptions_result = (
            supabase.table("interruptions")
            .select("*")
            .eq("user_id", user_id)
            .gte("time", start_date.isoformat())
            .lte("time", end_date.isoformat())
            .execute()
        )

        activities = activities_result.data or []
        interruptions = interruptions_result.data or []

        insights = generate_insights(activities, interruptions)

        return InsightResponse(**insights)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while generating insights"
        )
