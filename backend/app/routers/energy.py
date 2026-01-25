"""
Energy & Mood Tracking API Router
==================================

Handles daily energy, stress, mood, and sleep tracking.

This module enables users to track their daily state:
- Energy level (1-5 scale): How energetic do you feel?
- Stress level (1-5 scale): How stressed are you?
- Mood: Optional emotional state (excited, happy, tired, etc.)
- Sleep hours: How many hours did you sleep?

Key Features:
- One log per day per user (upsert behavior)
- Correlates with activities and spending for insights
- Used for energy-aware task suggestions
- Helps identify patterns (e.g., low energy = more spending?)

The energy data is used in cross-domain analytics to understand
how energy levels affect productivity, spending, and task completion.
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List
from app.core.auth import get_current_user
from app.core.database import supabase
from slowapi import Limiter
from slowapi.util import get_remote_address

# Create router instance for this module
router = APIRouter()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


class EnergyLogCreate(BaseModel):
    """
    Request model for creating/updating an energy log.

    Represents a user's daily energy, stress, mood, and sleep state.
    If date is not provided, defaults to today.
    """

    # Date defaults to today if not provided
    date: Optional[date] = None

    # Energy level: 1 (very low) to 5 (very high)
    # Required field - core metric for energy tracking
    energy_level: int = Field(..., ge=1, le=5, description="Energy level from 1-5")

    # Stress level: 1 (very low) to 5 (very high)
    # Required field - important for understanding burnout patterns
    stress_level: int = Field(..., ge=1, le=5, description="Stress level from 1-5")

    # Optional mood tracking
    # Uses regex pattern to ensure only valid mood values
    mood: Optional[str] = Field(
        None,
        pattern="^(excited|happy|neutral|tired|stressed|anxious|calm|focused|other)$",
        description="Emotional state/mood",
    )

    # Sleep hours: 0 to 24 (allows decimal values like 7.5)
    # Used to correlate sleep with energy levels
    sleep_hours: Optional[float] = Field(
        None, ge=0, le=24, description="Hours of sleep"
    )

    # Optional note for additional context
    note: Optional[str] = None


class EnergyLogResponse(BaseModel):
    id: str
    user_id: str
    date: str
    energy_level: int
    stress_level: int
    mood: Optional[str]
    sleep_hours: Optional[float]
    note: Optional[str]
    created_at: str
    updated_at: str


class EnergyLogUpdate(BaseModel):
    energy_level: Optional[int] = Field(None, ge=1, le=5)
    stress_level: Optional[int] = Field(None, ge=1, le=5)
    mood: Optional[str] = Field(
        None,
        pattern="^(excited|happy|neutral|tired|stressed|anxious|calm|focused|other)$",
    )
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    note: Optional[str] = None


@router.post("/energy", response_model=EnergyLogResponse)
@limiter.limit("30/minute")
async def create_energy_log(
    request: Request,
    log: EnergyLogCreate,
    user_id: str = Depends(get_current_user),
):
    """Create or update energy log for a date."""
    try:
        log_date = log.date or date.today()

        # Check if log exists for this date
        existing = (
            supabase.table("energy_logs")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", log_date.isoformat())
            .execute()
        )

        if existing.data:
            # Update existing
            result = (
                supabase.table("energy_logs")
                .update(log.dict(exclude_none=True, exclude={"date": True}))
                .eq("user_id", user_id)
                .eq("date", log_date.isoformat())
                .execute()
            )
        else:
            # Create new
            result = (
                supabase.table("energy_logs")
                .insert(
                    {
                        "user_id": user_id,
                        "date": log_date.isoformat(),
                        **log.dict(exclude_none=True, exclude={"date": True}),
                    }
                )
                .execute()
            )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save energy log")

        return EnergyLogResponse(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error saving energy log: {str(e)}"
        )


@router.get("/energy", response_model=List[EnergyLogResponse])
@limiter.limit("100/minute")
async def get_energy_logs(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user),
):
    """Get energy logs for a date range."""
    try:
        query = supabase.table("energy_logs").select("*").eq("user_id", user_id)

        if start_date:
            query = query.gte("date", start_date)
        if end_date:
            query = query.lte("date", end_date)

        result = query.order("date", desc=True).execute()

        return [EnergyLogResponse(**log) for log in result.data or []]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching energy logs: {str(e)}"
        )


@router.get("/energy/today", response_model=Optional[EnergyLogResponse])
@limiter.limit("100/minute")
async def get_today_energy_log(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """
    Get today's energy log for the authenticated user.

    Convenience endpoint to quickly fetch today's energy state.
    Returns None if no log exists for today (user hasn't logged yet).

    This is commonly used by the frontend to:
    - Pre-fill the energy tracker form if data exists
    - Show current energy state on dashboard
    - Allow updating today's log

    Args:
        request: FastAPI request object (needed for rate limiting)
        user_id: Authenticated user's ID (from JWT token)

    Returns:
        Optional[EnergyLogResponse]: Today's energy log, or None if not found

    Raises:
        HTTPException: 500 if database error occurs
    """
    try:
        # Query for today's log specifically
        # Uses date.today() to get current date in server's timezone
        result = (
            supabase.table("energy_logs")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", date.today().isoformat())
            .execute()
        )

        # Return the log if found, None if not found
        # This allows frontend to distinguish between "no data" and "error"
        if result.data:
            return EnergyLogResponse(**result.data[0])
        return None
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching energy log: {str(e)}"
        )


@router.patch("/energy/{log_id}", response_model=EnergyLogResponse)
@limiter.limit("30/minute")
async def update_energy_log(
    request: Request,
    log_id: str,
    log: EnergyLogUpdate,
    user_id: str = Depends(get_current_user),
):
    """Update an energy log."""
    try:
        result = (
            supabase.table("energy_logs")
            .update(log.dict(exclude_none=True))
            .eq("id", log_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Energy log not found")

        return EnergyLogResponse(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error updating energy log: {str(e)}"
        )
