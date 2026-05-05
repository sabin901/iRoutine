"""Product feedback endpoints for early user learning."""

from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.auth import get_current_user
from app.core.database import supabase

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class FeedbackCreate(BaseModel):
    product_area: Literal[
        "today", "finances", "planner", "insights", "settings", "overall"
    ] = "overall"
    rating: int = Field(..., ge=1, le=5)
    message: str = Field(..., min_length=5, max_length=2000)
    email: Optional[str] = Field(None, max_length=320)


class FeedbackResponse(BaseModel):
    id: str
    user_id: str
    product_area: str
    rating: int
    message: str
    email: Optional[str]
    created_at: datetime


@router.post("/feedback", response_model=FeedbackResponse)
@limiter.limit("10/minute")
async def create_feedback(
    request: Request,
    feedback: FeedbackCreate,
    user_id: str = Depends(get_current_user),
):
    """Save user feedback so product decisions are based on real users."""
    try:
        result = (
            supabase.table("product_feedback")
            .insert({"user_id": user_id, **feedback.model_dump()})
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save feedback")

        return FeedbackResponse(**result.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Error saving feedback") from exc
