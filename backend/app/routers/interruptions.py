from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
from app.core.auth import get_current_user
from app.core.database import supabase
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Valid interruption types
VALID_INTERRUPTION_TYPES = ["Phone", "Social Media", "Noise", "Other"]


class InterruptionCreate(BaseModel):
    activity_id: Optional[str] = Field(None, description="Associated activity ID")
    time: datetime = Field(..., description="Interruption time (UTC)")
    end_time: Optional[datetime] = Field(
        None, description="Interruption end time (UTC)"
    )
    duration_minutes: Optional[int] = Field(
        None, ge=1, le=480, description="Duration in minutes (1-480)"
    )
    type: Literal["Phone", "Social Media", "Noise", "Other"] = Field(
        ..., description="Interruption type"
    )
    note: Optional[str] = Field(
        None, max_length=500, description="Optional note (max 500 chars)"
    )

    @field_validator("note")
    @classmethod
    def validate_note(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize and validate note field."""
        if v is None:
            return None
        v = v.strip()
        if len(v) > 500:
            raise ValueError("Note must be 500 characters or less")
        return v

    class Config:
        # Reject unexpected fields
        extra = "forbid"


class InterruptionResponse(BaseModel):
    id: str
    user_id: str
    activity_id: Optional[str]
    time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    type: str
    note: Optional[str]
    created_at: datetime


@router.post("/interruptions", response_model=InterruptionResponse)
@limiter.limit("30/minute")  # Stricter limit for write operations
async def create_interruption(
    request: Request,
    interruption: InterruptionCreate,
    user_id: str = Depends(get_current_user),
):
    """Create a new interruption. Rate limited to 30 requests per minute."""
    # Sanitize note field
    note = interruption.note.strip() if interruption.note else None

    data = {
        "user_id": user_id,
        "activity_id": interruption.activity_id,
        "time": interruption.time.isoformat(),
        "type": interruption.type,
        "note": note,
    }

    # Add optional fields if provided
    if interruption.end_time:
        data["end_time"] = interruption.end_time.isoformat()
    if interruption.duration_minutes:
        data["duration_minutes"] = interruption.duration_minutes

    try:
        result = supabase.table("interruptions").insert(data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create interruption")

        return InterruptionResponse(**result.data[0])
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while creating the interruption"
        )


@router.get("/interruptions", response_model=list[InterruptionResponse])
@limiter.limit("100/minute")  # More lenient for read operations
async def get_interruptions(
    request: Request,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: str = Depends(get_current_user),
):
    """Get interruptions for the current user. Rate limited to 100 requests per minute."""
    query = supabase.table("interruptions").select("*").eq("user_id", user_id)

    if start_date:
        query = query.gte("time", start_date.isoformat())
    if end_date:
        query = query.lte("time", end_date.isoformat())

    try:
        result = query.order("time", desc=False).execute()
        return [InterruptionResponse(**item) for item in result.data]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching interruptions"
        )
