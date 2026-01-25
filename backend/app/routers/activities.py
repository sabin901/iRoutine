"""
Activities API Router
====================

Handles activity tracking - creating, retrieving, and managing user activities.

Activities represent time blocks where users were engaged in specific tasks.
Each activity has:
- Start and end time (required)
- Category (Study, Coding, Work, etc.)
- Optional metadata: energy_cost, work_type, planned vs actual times
- Can be linked to a task via task_id

Key Features:
- Track actual time spent vs planned time
- Classify work as deep/shallow/mixed/rest
- Track energy cost (light/medium/heavy)
- Link activities to tasks for better planning insights
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
from app.core.auth import get_current_user
from app.core.database import supabase
from slowapi import Limiter
from slowapi.util import get_remote_address

# Create router instance for this module
router = APIRouter()

# Initialize rate limiter for this router
# Uses client IP to track request rates
limiter = Limiter(key_func=get_remote_address)

# Valid activity categories
# These match the CHECK constraint in the database schema
VALID_CATEGORIES = ["Study", "Coding", "Work", "Reading", "Rest", "Social", "Other"]


class ActivityCreate(BaseModel):
    """
    Request model for creating a new activity.
    
    This defines what data the API expects when creating an activity.
    Pydantic automatically validates the data types and constraints.
    """
    # Required fields
    category: Literal[
        "Study", "Coding", "Work", "Reading", "Rest", "Social", "Other"
    ] = Field(..., description="Activity category")
    start_time: datetime = Field(..., description="Activity start time (UTC)")
    end_time: datetime = Field(..., description="Activity end time (UTC)")
    
    # Optional basic fields
    note: Optional[str] = Field(
        None, max_length=1000, description="Optional note (max 1000 chars)"
    )
    
    # Enhanced fields for Personal Life OS features
    # Energy cost: How much energy did this activity require?
    # Used for energy-aware planning and insights
    energy_cost: Optional[Literal["light", "medium", "heavy"]] = Field(
        None, description="Energy cost of the activity"
    )
    
    # Work type: Deep work vs shallow work classification
    # Deep = focused, uninterrupted work
    # Shallow = administrative, reactive work
    # Used for focus quality analysis
    work_type: Optional[Literal["deep", "shallow", "mixed", "rest"]] = Field(
        None, description="Type of work (deep vs shallow)"
    )
    
    # Planned vs actual time tracking
    # Compare what you planned to do vs what actually happened
    # Used for planning accuracy insights
    planned_start_time: Optional[datetime] = Field(
        None, description="Planned start time (for planning vs actual comparison)"
    )
    planned_end_time: Optional[datetime] = Field(
        None, description="Planned end time (for planning vs actual comparison)"
    )
    
    # Link to task if this activity is completing a specific task
    # Allows tracking which activities contribute to which tasks
    task_id: Optional[str] = Field(
        None, description="Link to a task if this activity is for a task"
    )

    @field_validator("note")
    @classmethod
    def validate_note(cls, v: Optional[str]) -> Optional[str]:
        """
        Sanitize and validate note field.
        
        Ensures note is safe and within length limits.
        Strips whitespace to prevent empty strings with spaces.
        """
        if v is None:
            return None
        # Remove any potential script tags or dangerous content
        # Strip whitespace to prevent empty strings
        v = v.strip()
        if len(v) > 1000:
            raise ValueError("Note must be 1000 characters or less")
        return v

    @field_validator("end_time")
    @classmethod
    def validate_times(cls, v: datetime, info) -> datetime:
        """
        Validate that end_time is after start_time and duration is reasonable.
        
        Business rules:
        1. End time must be after start time (can't have negative duration)
        2. Duration cannot exceed 24 hours (prevents data entry errors)
        3. Duration must be positive (prevents invalid time ranges)
        """
        if "start_time" in info.data and v <= info.data["start_time"]:
            raise ValueError("End time must be after start time")
        
        # Validate duration is reasonable (max 24 hours)
        # This prevents accidental data entry errors (e.g., selecting wrong date)
        if "start_time" in info.data:
            duration = (v - info.data["start_time"]).total_seconds() / 3600
            if duration > 24:
                raise ValueError("Activity duration cannot exceed 24 hours")
            if duration < 0:
                raise ValueError("Invalid time range")
        return v

    class Config:
        # Reject unexpected fields
        extra = "forbid"


class ActivityResponse(BaseModel):
    id: str
    user_id: str
    category: str
    start_time: datetime
    end_time: datetime
    note: Optional[str]
    energy_cost: Optional[str] = None
    work_type: Optional[str] = None
    planned_start_time: Optional[datetime] = None
    planned_end_time: Optional[datetime] = None
    task_id: Optional[str] = None
    created_at: datetime


@router.post("/activities", response_model=ActivityResponse)
@limiter.limit("30/minute")  # Stricter limit for write operations
async def create_activity(
    request: Request,
    activity: ActivityCreate,
    user_id: str = Depends(get_current_user),
):
    """
    Create a new activity for the authenticated user.
    
    This endpoint allows users to log their activities with optional metadata:
    - energy_cost: How much energy the activity required (light/medium/heavy)
    - work_type: Type of work performed (deep/shallow/mixed/rest)
    - planned vs actual: Compare planned time with actual time spent
    - task_id: Link activity to a specific task
    
    Rate limited to 30 requests per minute (write operations are more expensive).
    
    Args:
        request: FastAPI request object (needed for rate limiting)
        activity: ActivityCreate model with activity details
        user_id: Authenticated user's ID (from JWT token)
    
    Returns:
        ActivityResponse: Created activity with generated ID and timestamps
    
    Raises:
        HTTPException: 400 if validation fails, 500 if database error
    """
    # Additional server-side validation (double-check)
    # Even though Pydantic validates, we add this as a safety check
    if activity.end_time <= activity.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    # Sanitize note field - remove leading/trailing whitespace
    note = activity.note.strip() if activity.note else None

    # Build data dictionary for database insert
    # Start with required fields
    data = {
        "user_id": user_id,  # Always set from authenticated user
        "category": activity.category,
        "start_time": activity.start_time.isoformat(),  # Convert datetime to ISO string
        "end_time": activity.end_time.isoformat(),
        "note": note,
    }

    # Add optional enhanced fields if provided
    # These fields enable advanced features like energy-aware planning
    if activity.energy_cost:
        data["energy_cost"] = activity.energy_cost
    if activity.work_type:
        data["work_type"] = activity.work_type
    if activity.planned_start_time:
        data["planned_start_time"] = activity.planned_start_time.isoformat()
    if activity.planned_end_time:
        data["planned_end_time"] = activity.planned_end_time.isoformat()
    if activity.task_id:
        data["task_id"] = activity.task_id

    try:
        # Insert activity into database
        # Supabase automatically handles:
        # - UUID generation for id
        # - created_at timestamp
        # - Row Level Security (RLS) ensures user can only insert their own data
        result = supabase.table("activities").insert(data).execute()

        # Check if insert was successful
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create activity")

        # Return the created activity as ActivityResponse model
        # This includes the generated ID and timestamps
        return ActivityResponse(**result.data[0])
    except Exception as e:
        # Don't expose internal errors to prevent information leakage
        # Log the actual error server-side, but return generic message to client
        raise HTTPException(
            status_code=500, detail="An error occurred while creating the activity"
        )


@router.get("/activities", response_model=list[ActivityResponse])
@limiter.limit("100/minute")  # More lenient for read operations
async def get_activities(
    request: Request,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: str = Depends(get_current_user),
):
    """
    Get activities for the authenticated user, optionally filtered by date range.
    
    This endpoint retrieves all activities for the user, with optional filtering:
    - start_date: Only return activities on or after this date
    - end_date: Only return activities on or before this date
    - If no dates provided, returns all activities
    
    Results are ordered chronologically (oldest first).
    Rate limited to 100 requests per minute (read operations are cheaper).
    
    Args:
        request: FastAPI request object (needed for rate limiting)
        start_date: Optional start date filter (inclusive)
        end_date: Optional end date filter (inclusive)
        user_id: Authenticated user's ID (from JWT token)
    
    Returns:
        List[ActivityResponse]: List of activities matching the filters
    
    Raises:
        HTTPException: 500 if database error occurs
    """
    # Start building query - always filter by user_id for security
    # RLS also enforces this, but we do it explicitly for clarity
    query = supabase.table("activities").select("*").eq("user_id", user_id)

    # Add date filters if provided
    # gte = greater than or equal (start_date inclusive)
    if start_date:
        query = query.gte("start_time", start_date.isoformat())
    # lte = less than or equal (end_date inclusive)
    if end_date:
        query = query.lte("start_time", end_date.isoformat())

    try:
        # Execute query and order by start_time (oldest first)
        # desc=False means ascending order (earliest activities first)
        result = query.order("start_time", desc=False).execute()
        
        # Convert each database record to ActivityResponse model
        # This ensures consistent response format and validates data
        return [ActivityResponse(**item) for item in result.data]
    except Exception as e:
        # Don't expose internal errors
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching activities"
        )
