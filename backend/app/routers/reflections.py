"""
Daily, Weekly, and Monthly Reflection endpoints
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from typing import Optional, List
from app.core.auth import get_current_user
from app.core.database import supabase
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# Daily Reflection Models
class DailyReflectionCreate(BaseModel):
    date: Optional[date] = None
    what_worked: Optional[str] = None
    what_didnt: Optional[str] = None
    why: Optional[str] = None
    adjustment: Optional[str] = None


class DailyReflectionResponse(BaseModel):
    id: str
    user_id: str
    date: str
    what_worked: Optional[str]
    what_didnt: Optional[str]
    why: Optional[str]
    adjustment: Optional[str]
    created_at: str
    updated_at: str


# Weekly Reflection Models
class WeeklyReflectionCreate(BaseModel):
    week_start: Optional[date] = None
    time_vs_plan: Optional[str] = None
    money_vs_budget: Optional[str] = None
    energy_vs_workload: Optional[str] = None
    adjustment: Optional[str] = None


class WeeklyReflectionResponse(BaseModel):
    id: str
    user_id: str
    week_start: str
    time_vs_plan: Optional[str]
    money_vs_budget: Optional[str]
    energy_vs_workload: Optional[str]
    adjustment: Optional[str]
    created_at: str
    updated_at: str


# Monthly Reflection Models
class MonthlyReflectionCreate(BaseModel):
    month: Optional[date] = None
    trends: Optional[str] = None
    stability: Optional[str] = None
    burnout_signals: Optional[str] = None
    financial_safety_progress: Optional[str] = None


class MonthlyReflectionResponse(BaseModel):
    id: str
    user_id: str
    month: str
    trends: Optional[str]
    stability: Optional[str]
    burnout_signals: Optional[str]
    financial_safety_progress: Optional[str]
    created_at: str
    updated_at: str


def get_week_start(d: date) -> date:
    """Get Monday of the week for a given date."""
    days_since_monday = d.weekday()
    return d - timedelta(days=days_since_monday)


def get_month_start(d: date) -> date:
    """Get first day of month."""
    return date(d.year, d.month, 1)


# Daily Reflection Endpoints
@router.post("/reflections/daily", response_model=DailyReflectionResponse)
@limiter.limit("30/minute")
async def create_daily_reflection(
    request: Request,
    reflection: DailyReflectionCreate,
    user_id: str = Depends(get_current_user),
):
    """Create or update daily reflection."""
    try:
        reflection_date = reflection.date or date.today()

        existing = (
            supabase.table("daily_reflections")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", reflection_date.isoformat())
            .execute()
        )

        if existing.data:
            result = (
                supabase.table("daily_reflections")
                .update(reflection.dict(exclude_none=True, exclude={"date": True}))
                .eq("user_id", user_id)
                .eq("date", reflection_date.isoformat())
                .execute()
            )
        else:
            result = (
                supabase.table("daily_reflections")
                .insert(
                    {
                        "user_id": user_id,
                        "date": reflection_date.isoformat(),
                        **reflection.dict(exclude_none=True, exclude={"date": True}),
                    }
                )
                .execute()
            )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save reflection")

        return DailyReflectionResponse(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error saving reflection: {str(e)}"
        )


@router.get("/reflections/daily", response_model=List[DailyReflectionResponse])
@limiter.limit("100/minute")
async def get_daily_reflections(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user),
):
    """Get daily reflections."""
    try:
        query = supabase.table("daily_reflections").select("*").eq("user_id", user_id)

        if start_date:
            query = query.gte("date", start_date)
        if end_date:
            query = query.lte("date", end_date)

        result = query.order("date", desc=True).execute()
        return [DailyReflectionResponse(**r) for r in result.data or []]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching reflections: {str(e)}"
        )


@router.get(
    "/reflections/daily/today", response_model=Optional[DailyReflectionResponse]
)
@limiter.limit("100/minute")
async def get_today_reflection(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Get today's reflection."""
    try:
        result = (
            supabase.table("daily_reflections")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", date.today().isoformat())
            .execute()
        )

        if result.data:
            return DailyReflectionResponse(**result.data[0])
        return None
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching reflection: {str(e)}"
        )


# Weekly Reflection Endpoints
@router.post("/reflections/weekly", response_model=WeeklyReflectionResponse)
@limiter.limit("30/minute")
async def create_weekly_reflection(
    request: Request,
    reflection: WeeklyReflectionCreate,
    user_id: str = Depends(get_current_user),
):
    """Create or update weekly reflection."""
    try:
        week_start = reflection.week_start or get_week_start(date.today())

        existing = (
            supabase.table("weekly_reflections")
            .select("*")
            .eq("user_id", user_id)
            .eq("week_start", week_start.isoformat())
            .execute()
        )

        if existing.data:
            result = (
                supabase.table("weekly_reflections")
                .update(
                    reflection.dict(exclude_none=True, exclude={"week_start": True})
                )
                .eq("user_id", user_id)
                .eq("week_start", week_start.isoformat())
                .execute()
            )
        else:
            result = (
                supabase.table("weekly_reflections")
                .insert(
                    {
                        "user_id": user_id,
                        "week_start": week_start.isoformat(),
                        **reflection.dict(
                            exclude_none=True, exclude={"week_start": True}
                        ),
                    }
                )
                .execute()
            )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save reflection")

        return WeeklyReflectionResponse(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error saving reflection: {str(e)}"
        )


@router.get("/reflections/weekly", response_model=List[WeeklyReflectionResponse])
@limiter.limit("100/minute")
async def get_weekly_reflections(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Get all weekly reflections."""
    try:
        result = (
            supabase.table("weekly_reflections")
            .select("*")
            .eq("user_id", user_id)
            .order("week_start", desc=True)
            .execute()
        )
        return [WeeklyReflectionResponse(**r) for r in result.data or []]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching reflections: {str(e)}"
        )


# Monthly Reflection Endpoints
@router.post("/reflections/monthly", response_model=MonthlyReflectionResponse)
@limiter.limit("30/minute")
async def create_monthly_reflection(
    request: Request,
    reflection: MonthlyReflectionCreate,
    user_id: str = Depends(get_current_user),
):
    """Create or update monthly reflection."""
    try:
        month_start = reflection.month or get_month_start(date.today())

        existing = (
            supabase.table("monthly_reflections")
            .select("*")
            .eq("user_id", user_id)
            .eq("month", month_start.isoformat())
            .execute()
        )

        if existing.data:
            result = (
                supabase.table("monthly_reflections")
                .update(reflection.dict(exclude_none=True, exclude={"month": True}))
                .eq("user_id", user_id)
                .eq("month", month_start.isoformat())
                .execute()
            )
        else:
            result = (
                supabase.table("monthly_reflections")
                .insert(
                    {
                        "user_id": user_id,
                        "month": month_start.isoformat(),
                        **reflection.dict(exclude_none=True, exclude={"month": True}),
                    }
                )
                .execute()
            )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save reflection")

        return MonthlyReflectionResponse(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error saving reflection: {str(e)}"
        )


@router.get("/reflections/monthly", response_model=List[MonthlyReflectionResponse])
@limiter.limit("100/minute")
async def get_monthly_reflections(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Get all monthly reflections."""
    try:
        result = (
            supabase.table("monthly_reflections")
            .select("*")
            .eq("user_id", user_id)
            .order("month", desc=True)
            .execute()
        )
        return [MonthlyReflectionResponse(**r) for r in result.data or []]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching reflections: {str(e)}"
        )
