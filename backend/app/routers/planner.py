"""
Planner API endpoints
Handles tasks, goals, habits, and habit logs
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Any
from datetime import date, time, datetime
from app.core.auth import get_current_user
from app.core.database import supabase
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# =============================================
# TASKS
# =============================================


class TaskCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    due_date: Optional[date] = None
    due_time: Optional[str] = None  # HH:MM format
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    category: str = "Personal"
    estimated_minutes: Optional[int] = Field(None, gt=0)
    is_recurring: bool = False
    recurring_pattern: Optional[Literal["daily", "weekdays", "weekly", "monthly"]] = (
        None
    )


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    due_date: Optional[date] = None
    due_time: Optional[str] = None
    priority: Optional[Literal["low", "medium", "high", "urgent"]] = None
    status: Optional[Literal["pending", "in_progress", "completed", "cancelled"]] = None
    category: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None


class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    due_date: Optional[str]
    due_time: Optional[str]
    priority: str
    status: str
    category: str
    estimated_minutes: Optional[int]
    actual_minutes: Optional[int]
    completed_at: Optional[str]
    is_recurring: bool
    recurring_pattern: Optional[str]
    created_at: str


@router.post("/planner/tasks", response_model=TaskResponse)
@limiter.limit("60/minute")
async def create_task(
    request: Request,
    task: TaskCreate,
    user_id: str = Depends(get_current_user),
):
    """Create a new task."""
    data = {
        "user_id": user_id,
        "title": task.title,
        "description": task.description,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "due_time": task.due_time,
        "priority": task.priority,
        "category": task.category,
        "estimated_minutes": task.estimated_minutes,
        "is_recurring": task.is_recurring,
        "recurring_pattern": task.recurring_pattern,
    }

    try:
        result = supabase.table("tasks").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create task")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/planner/tasks", response_model=List[TaskResponse])
@limiter.limit("100/minute")
async def get_tasks(
    request: Request,
    due_date: Optional[date] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    user_id: str = Depends(get_current_user),
):
    """Get tasks with optional filters."""
    query = supabase.table("tasks").select("*").eq("user_id", user_id)

    if due_date:
        query = query.eq("due_date", due_date.isoformat())
    if start_date:
        query = query.gte("due_date", start_date.isoformat())
    if end_date:
        query = query.lte("due_date", end_date.isoformat())
    if status:
        query = query.eq("status", status)
    if priority:
        query = query.eq("priority", priority)
    if category:
        query = query.eq("category", category)

    try:
        result = (
            query.order("due_date", desc=False).order("priority", desc=True).execute()
        )
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/planner/tasks/{task_id}", response_model=TaskResponse)
@limiter.limit("60/minute")
async def update_task(
    request: Request,
    task_id: str,
    task: TaskUpdate,
    user_id: str = Depends(get_current_user),
):
    """Update a task."""
    data = {k: v for k, v in task.model_dump().items() if v is not None}

    # Handle date conversion
    if "due_date" in data and data["due_date"]:
        data["due_date"] = data["due_date"].isoformat()

    # If marking as completed, set completed_at
    if data.get("status") == "completed":
        data["completed_at"] = datetime.utcnow().isoformat()

    try:
        result = (
            supabase.table("tasks")
            .update(data)
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Task not found")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/planner/tasks/{task_id}")
@limiter.limit("30/minute")
async def delete_task(
    request: Request,
    task_id: str,
    user_id: str = Depends(get_current_user),
):
    """Delete a task."""
    try:
        supabase.table("tasks").delete().eq("id", task_id).eq(
            "user_id", user_id
        ).execute()
        return {"message": "Task deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
# GOALS
# =============================================


class GoalCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Literal[
        "Career",
        "Health",
        "Learning",
        "Financial",
        "Personal",
        "Relationships",
        "Other",
    ] = "Personal"
    target_date: Optional[date] = None
    milestones: List[dict] = []
    color: str = "#6172f3"


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[date] = None
    status: Optional[Literal["active", "completed", "paused", "abandoned"]] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    milestones: Optional[List[dict]] = None


class GoalResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    category: str
    target_date: Optional[str]
    status: str
    progress: int
    milestones: Any
    color: str
    created_at: str


@router.post("/planner/goals", response_model=GoalResponse)
@limiter.limit("30/minute")
async def create_goal(
    request: Request,
    goal: GoalCreate,
    user_id: str = Depends(get_current_user),
):
    """Create a new goal."""
    data = {
        "user_id": user_id,
        "title": goal.title,
        "description": goal.description,
        "category": goal.category,
        "target_date": goal.target_date.isoformat() if goal.target_date else None,
        "milestones": goal.milestones,
        "color": goal.color,
    }

    try:
        result = supabase.table("goals").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create goal")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/planner/goals", response_model=List[GoalResponse])
@limiter.limit("100/minute")
async def get_goals(
    request: Request,
    status: Optional[str] = None,
    category: Optional[str] = None,
    user_id: str = Depends(get_current_user),
):
    """Get goals with optional filters."""
    query = supabase.table("goals").select("*").eq("user_id", user_id)

    if status:
        query = query.eq("status", status)
    if category:
        query = query.eq("category", category)

    try:
        result = query.order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/planner/goals/{goal_id}", response_model=GoalResponse)
@limiter.limit("30/minute")
async def update_goal(
    request: Request,
    goal_id: str,
    goal: GoalUpdate,
    user_id: str = Depends(get_current_user),
):
    """Update a goal."""
    data = {k: v for k, v in goal.model_dump().items() if v is not None}

    if "target_date" in data and data["target_date"]:
        data["target_date"] = data["target_date"].isoformat()

    try:
        result = (
            supabase.table("goals")
            .update(data)
            .eq("id", goal_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Goal not found")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/planner/goals/{goal_id}")
@limiter.limit("30/minute")
async def delete_goal(
    request: Request,
    goal_id: str,
    user_id: str = Depends(get_current_user),
):
    """Delete a goal."""
    try:
        supabase.table("goals").delete().eq("id", goal_id).eq(
            "user_id", user_id
        ).execute()
        return {"message": "Goal deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
# HABITS
# =============================================


class HabitCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    frequency: Literal["daily", "weekdays", "weekly"] = "daily"
    target_count: int = Field(default=1, gt=0)
    color: str = "#6172f3"
    icon: str = "✓"


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[Literal["daily", "weekdays", "weekly"]] = None
    target_count: Optional[int] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None


class HabitResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    frequency: str
    target_count: int
    color: str
    icon: str
    is_active: bool
    current_streak: int
    best_streak: int
    created_at: str


@router.post("/planner/habits", response_model=HabitResponse)
@limiter.limit("30/minute")
async def create_habit(
    request: Request,
    habit: HabitCreate,
    user_id: str = Depends(get_current_user),
):
    """Create a new habit."""
    data = {
        "user_id": user_id,
        "name": habit.name,
        "description": habit.description,
        "frequency": habit.frequency,
        "target_count": habit.target_count,
        "color": habit.color,
        "icon": habit.icon,
    }

    try:
        result = supabase.table("habits").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create habit")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/planner/habits", response_model=List[HabitResponse])
@limiter.limit("100/minute")
async def get_habits(
    request: Request,
    active_only: bool = True,
    user_id: str = Depends(get_current_user),
):
    """Get habits."""
    query = supabase.table("habits").select("*").eq("user_id", user_id)

    if active_only:
        query = query.eq("is_active", True)

    try:
        result = query.order("created_at", desc=False).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/planner/habits/{habit_id}", response_model=HabitResponse)
@limiter.limit("30/minute")
async def update_habit(
    request: Request,
    habit_id: str,
    habit: HabitUpdate,
    user_id: str = Depends(get_current_user),
):
    """Update a habit."""
    data = {k: v for k, v in habit.model_dump().items() if v is not None}

    try:
        result = (
            supabase.table("habits")
            .update(data)
            .eq("id", habit_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Habit not found")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/planner/habits/{habit_id}")
@limiter.limit("30/minute")
async def delete_habit(
    request: Request,
    habit_id: str,
    user_id: str = Depends(get_current_user),
):
    """Delete a habit."""
    try:
        supabase.table("habits").delete().eq("id", habit_id).eq(
            "user_id", user_id
        ).execute()
        return {"message": "Habit deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
# HABIT LOGS
# =============================================


class HabitLogCreate(BaseModel):
    habit_id: str
    date: date
    completed: bool = True
    count: int = 1
    note: Optional[str] = None


class HabitLogResponse(BaseModel):
    id: str
    habit_id: str
    user_id: str
    date: str
    completed: bool
    count: int
    note: Optional[str]
    created_at: str


@router.post("/planner/habits/log", response_model=HabitLogResponse)
@limiter.limit("100/minute")
async def log_habit(
    request: Request,
    log: HabitLogCreate,
    user_id: str = Depends(get_current_user),
):
    """Log a habit completion."""
    data = {
        "user_id": user_id,
        "habit_id": log.habit_id,
        "date": log.date.isoformat(),
        "completed": log.completed,
        "count": log.count,
        "note": log.note,
    }

    try:
        # Upsert to handle duplicate dates
        result = (
            supabase.table("habit_logs")
            .upsert(data, on_conflict="habit_id,date")
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to log habit")

        # Update streak if completed
        if log.completed:
            await update_habit_streak(log.habit_id, user_id)

        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/planner/habits/{habit_id}/logs", response_model=List[HabitLogResponse])
@limiter.limit("100/minute")
async def get_habit_logs(
    request: Request,
    habit_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    user_id: str = Depends(get_current_user),
):
    """Get logs for a habit."""
    query = (
        supabase.table("habit_logs")
        .select("*")
        .eq("habit_id", habit_id)
        .eq("user_id", user_id)
    )

    if start_date:
        query = query.gte("date", start_date.isoformat())
    if end_date:
        query = query.lte("date", end_date.isoformat())

    try:
        result = query.order("date", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def update_habit_streak(habit_id: str, user_id: str):
    """Update streak for a habit."""
    from datetime import timedelta

    try:
        # Get all logs for this habit ordered by date
        logs = (
            supabase.table("habit_logs")
            .select("date, completed")
            .eq("habit_id", habit_id)
            .eq("user_id", user_id)
            .eq("completed", True)
            .order("date", desc=True)
            .execute()
        ).data

        if not logs:
            return

        # Calculate current streak
        current_streak = 0
        today = date.today()

        for i, log in enumerate(logs):
            log_date = date.fromisoformat(log["date"])
            expected_date = today - timedelta(days=i)

            if log_date == expected_date:
                current_streak += 1
            else:
                break

        # Get current best streak
        habit = (
            supabase.table("habits")
            .select("best_streak")
            .eq("id", habit_id)
            .single()
            .execute()
        ).data

        best_streak = max(habit.get("best_streak", 0), current_streak)

        # Update habit
        supabase.table("habits").update(
            {"current_streak": current_streak, "best_streak": best_streak}
        ).eq("id", habit_id).execute()

    except Exception:
        pass  # Don't fail the main request if streak update fails


# =============================================
# PLANNER SUMMARY
# =============================================


@router.get("/planner/today")
@limiter.limit("100/minute")
async def get_today_summary(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Get today's planner summary."""
    today = date.today()

    try:
        # Get today's tasks
        tasks = (
            supabase.table("tasks")
            .select("*")
            .eq("user_id", user_id)
            .eq("due_date", today.isoformat())
            .execute()
        ).data

        # Get overdue tasks
        overdue = (
            supabase.table("tasks")
            .select("*")
            .eq("user_id", user_id)
            .lt("due_date", today.isoformat())
            .neq("status", "completed")
            .neq("status", "cancelled")
            .execute()
        ).data

        # Get active habits
        habits = (
            supabase.table("habits")
            .select("*")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .execute()
        ).data

        # Get today's habit logs
        habit_logs = (
            supabase.table("habit_logs")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", today.isoformat())
            .execute()
        ).data

        completed_habit_ids = {
            log["habit_id"] for log in habit_logs if log["completed"]
        }

        # Get active goals
        goals = (
            supabase.table("goals")
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "active")
            .execute()
        ).data

        # Calculate stats
        tasks_completed = len([t for t in tasks if t["status"] == "completed"])
        tasks_total = len(tasks)
        habits_completed = len(completed_habit_ids)
        habits_total = len(habits)

        return {
            "date": today.isoformat(),
            "tasks": tasks,
            "overdue_tasks": overdue,
            "habits": habits,
            "habit_logs": habit_logs,
            "goals": goals[:5],  # Top 5 active goals
            "stats": {
                "tasks_completed": tasks_completed,
                "tasks_total": tasks_total,
                "tasks_completion_rate": round(
                    tasks_completed / tasks_total * 100 if tasks_total > 0 else 0, 1
                ),
                "habits_completed": habits_completed,
                "habits_total": habits_total,
                "habits_completion_rate": round(
                    habits_completed / habits_total * 100 if habits_total > 0 else 0, 1
                ),
                "overdue_count": len(overdue),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
