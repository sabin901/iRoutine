"""
Advanced analytics endpoints
Provides deeper insights and aggregated data
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.core.auth import get_current_user
from app.core.database import supabase
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    days_with_activity: int


class CategoryBreakdown(BaseModel):
    category: str
    total_minutes: float
    session_count: int
    avg_duration: float
    percentage: float


class AnalyticsResponse(BaseModel):
    total_focus_hours: float
    total_interruption_minutes: float
    avg_daily_focus: float
    category_breakdown: List[CategoryBreakdown]
    streaks: StreakResponse
    quality_score: float


@router.get("/analytics/streaks", response_model=StreakResponse)
@limiter.limit("100/minute")
async def get_streaks(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Calculate user's activity streaks."""
    try:
        # Get last year of activities
        one_year_ago = datetime.utcnow() - timedelta(days=365)

        result = (
            supabase.table("activities")
            .select("start_time")
            .eq("user_id", user_id)
            .gte("start_time", one_year_ago.isoformat())
            .order("start_time", desc=False)
            .execute()
        )

        activities = result.data or []

        # Calculate streaks
        days_with_activity = set()
        for activity in activities:
            date = datetime.fromisoformat(activity["start_time"].replace("Z", "+00:00"))
            days_with_activity.add(date.date())

        sorted_days = sorted(days_with_activity, reverse=True)

        # Current streak
        current_streak = 0
        today = datetime.utcnow().date()

        for i, day in enumerate(sorted_days):
            expected_day = today - timedelta(days=i)
            if day == expected_day:
                current_streak += 1
            else:
                break

        # Longest streak
        longest_streak = 1
        temp_streak = 1

        for i in range(1, len(sorted_days)):
            days_diff = (sorted_days[i - 1] - sorted_days[i]).days
            if days_diff == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
        longest_streak = max(longest_streak, temp_streak)

        return StreakResponse(
            current_streak=current_streak,
            longest_streak=longest_streak,
            days_with_activity=len(days_with_activity),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while calculating streaks"
        )


@router.get("/analytics/category-breakdown", response_model=List[CategoryBreakdown])
@limiter.limit("100/minute")
async def get_category_breakdown(
    request: Request,
    days: int = 30,
    user_id: str = Depends(get_current_user),
):
    """Get breakdown of time spent by category."""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)

        result = (
            supabase.table("activities")
            .select("*")
            .eq("user_id", user_id)
            .gte("start_time", start_date.isoformat())
            .execute()
        )

        activities = result.data or []

        # Calculate by category
        category_data: Dict[str, Dict] = {}
        total_minutes = 0

        for activity in activities:
            category = activity["category"]
            start = datetime.fromisoformat(
                activity["start_time"].replace("Z", "+00:00")
            )
            end = datetime.fromisoformat(activity["end_time"].replace("Z", "+00:00"))
            duration = (end - start).total_seconds() / 60

            if category not in category_data:
                category_data[category] = {
                    "total_minutes": 0,
                    "session_count": 0,
                }

            category_data[category]["total_minutes"] += duration
            category_data[category]["session_count"] += 1
            total_minutes += duration

        # Build response
        breakdown = []
        for category, data in category_data.items():
            avg_duration = (
                data["total_minutes"] / data["session_count"]
                if data["session_count"] > 0
                else 0
            )
            percentage = (
                (data["total_minutes"] / total_minutes * 100)
                if total_minutes > 0
                else 0
            )

            breakdown.append(
                CategoryBreakdown(
                    category=category,
                    total_minutes=round(data["total_minutes"], 1),
                    session_count=data["session_count"],
                    avg_duration=round(avg_duration, 1),
                    percentage=round(percentage, 1),
                )
            )

        # Sort by total minutes
        breakdown.sort(key=lambda x: x.total_minutes, reverse=True)

        return breakdown
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="An error occurred while calculating category breakdown",
        )


@router.get("/analytics/summary", response_model=AnalyticsResponse)
@limiter.limit("100/minute")
async def get_analytics_summary(
    request: Request,
    days: int = 30,
    user_id: str = Depends(get_current_user),
):
    """Get comprehensive analytics summary."""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)

        # Get activities
        activities_result = (
            supabase.table("activities")
            .select("*")
            .eq("user_id", user_id)
            .gte("start_time", start_date.isoformat())
            .execute()
        )

        # Get interruptions
        interruptions_result = (
            supabase.table("interruptions")
            .select("*")
            .eq("user_id", user_id)
            .gte("time", start_date.isoformat())
            .execute()
        )

        activities = activities_result.data or []
        interruptions = interruptions_result.data or []

        # Calculate metrics
        focus_categories = ["Study", "Coding", "Work", "Reading"]
        focus_activities = [a for a in activities if a["category"] in focus_categories]

        total_focus_minutes = sum(
            (
                datetime.fromisoformat(a["end_time"].replace("Z", "+00:00"))
                - datetime.fromisoformat(a["start_time"].replace("Z", "+00:00"))
            ).total_seconds()
            / 60
            for a in focus_activities
        )

        total_interruption_minutes = sum(
            i.get("duration_minutes", 5) for i in interruptions
        )

        days_with_activity = len(
            set(
                datetime.fromisoformat(a["start_time"].replace("Z", "+00:00")).date()
                for a in activities
            )
        )

        avg_daily_focus = (
            total_focus_minutes / days_with_activity if days_with_activity > 0 else 0
        )

        # Category breakdown
        category_data: Dict[str, Dict] = {}
        for activity in activities:
            category = activity["category"]
            start = datetime.fromisoformat(
                activity["start_time"].replace("Z", "+00:00")
            )
            end = datetime.fromisoformat(activity["end_time"].replace("Z", "+00:00"))
            duration = (end - start).total_seconds() / 60

            if category not in category_data:
                category_data[category] = {"total_minutes": 0, "session_count": 0}

            category_data[category]["total_minutes"] += duration
            category_data[category]["session_count"] += 1

        total_all_minutes = sum(d["total_minutes"] for d in category_data.values())

        category_breakdown = [
            CategoryBreakdown(
                category=cat,
                total_minutes=round(data["total_minutes"], 1),
                session_count=data["session_count"],
                avg_duration=(
                    round(data["total_minutes"] / data["session_count"], 1)
                    if data["session_count"] > 0
                    else 0
                ),
                percentage=(
                    round((data["total_minutes"] / total_all_minutes * 100), 1)
                    if total_all_minutes > 0
                    else 0
                ),
            )
            for cat, data in category_data.items()
        ]
        category_breakdown.sort(key=lambda x: x.total_minutes, reverse=True)

        # Streaks (simplified)
        sorted_days = sorted(
            set(
                datetime.fromisoformat(a["start_time"].replace("Z", "+00:00")).date()
                for a in activities
            ),
            reverse=True,
        )

        current_streak = 0
        today = datetime.utcnow().date()
        for i, day in enumerate(sorted_days):
            if day == today - timedelta(days=i):
                current_streak += 1
            else:
                break

        longest_streak = 1
        temp_streak = 1
        for i in range(1, len(sorted_days)):
            if (sorted_days[i - 1] - sorted_days[i]).days == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
        longest_streak = max(longest_streak, temp_streak)

        # Quality score (simplified)
        from app.services.insights import generate_insights

        insights = generate_insights(activities, interruptions)
        quality_score = insights.get("consistency_score", 0.5) * 100

        return AnalyticsResponse(
            total_focus_hours=round(total_focus_minutes / 60, 1),
            total_interruption_minutes=round(total_interruption_minutes, 1),
            avg_daily_focus=round(avg_daily_focus / 60, 1),
            category_breakdown=category_breakdown,
            streaks=StreakResponse(
                current_streak=current_streak,
                longest_streak=longest_streak,
                days_with_activity=days_with_activity,
            ),
            quality_score=round(quality_score, 1),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while generating analytics"
        )
