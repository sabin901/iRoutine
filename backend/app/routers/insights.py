from typing import Any

from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from app.core.auth import get_current_user
from app.core.database import supabase
from app.services.insights import generate_insights
from app.services.local_llm import generate_local_llm_insight
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def utc_now() -> datetime:
    """Return a timezone-aware UTC timestamp for recent insight windows."""
    return datetime.now(timezone.utc)


class InsightResponse(BaseModel):
    peak_focus_window: str
    distraction_hotspot: str
    consistency_score: float
    balance_ratio: float
    suggestion: str


class LocalLlmInsightResponse(BaseModel):
    enabled: bool
    provider: str
    model: str
    summary: str
    actions: list[str]
    snapshot: dict[str, Any]


@router.get("/insights", response_model=InsightResponse)
@limiter.limit("100/minute")  # Read operation
async def get_insights(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Generate insights for the current user. Rate limited to 100 requests per minute."""
    try:
        # Get last 7 days of data
        end_date = utc_now()
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


@router.get("/insights/llm", response_model=LocalLlmInsightResponse)
@limiter.limit("20/minute")
async def get_llm_insights(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Use a configured local LLM to narrate recent routine patterns."""
    try:
        end_date = utc_now()
        start_date = end_date - timedelta(days=14)

        activities_result = (
            supabase.table("activities")
            .select("*")
            .eq("user_id", user_id)
            .gte("start_time", start_date.isoformat())
            .lte("start_time", end_date.isoformat())
            .execute()
        )
        interruptions_result = (
            supabase.table("interruptions")
            .select("*")
            .eq("user_id", user_id)
            .gte("time", start_date.isoformat())
            .lte("time", end_date.isoformat())
            .execute()
        )

        return await generate_local_llm_insight(
            activities_result.data or [],
            interruptions_result.data or [],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Local LLM insight generation is unavailable. "
                "Check LOCAL_LLM_* settings and your local model server."
            ),
        ) from exc
