"""
Cross-Domain Analytics - Correlating Time, Money, Energy, and Focus
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional
from app.core.auth import get_current_user
from app.core.database import supabase
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class TimeMoneyCorrelation(BaseModel):
    date: str
    activity_count: int
    total_hours: float
    interruption_count: int
    daily_expenses: float
    daily_income: float
    correlation_score: Optional[float] = None


class EnergySpendingCorrelation(BaseModel):
    date: str
    energy_level: int
    stress_level: int
    daily_expenses: float
    expense_count: int
    correlation_score: Optional[float] = None


class InterruptionTaskCorrelation(BaseModel):
    task_date: str
    total_tasks: int
    completed_tasks: int
    interruption_count: int
    completion_rate: float
    correlation_score: Optional[float] = None


class CrossDomainInsight(BaseModel):
    type: str
    title: str
    description: str
    data: Dict
    recommendation: Optional[str] = None


@router.get("/cross-domain/time-money", response_model=List[TimeMoneyCorrelation])
@limiter.limit("100/minute")
async def get_time_money_correlation(
    request: Request,
    days: int = 30,
    user_id: str = Depends(get_current_user),
):
    """Analyze correlation between time spent and money spent."""
    try:
        start_date = (date.today() - timedelta(days=days)).isoformat()

        # Get activities
        activities_result = (
            supabase.table("activities")
            .select("*")
            .eq("user_id", user_id)
            .gte("start_time", start_date)
            .execute()
        )

        # Get interruptions
        interruptions_result = (
            supabase.table("interruptions")
            .select("*")
            .eq("user_id", user_id)
            .gte("time", start_date)
            .execute()
        )

        # Get transactions
        transactions_result = (
            supabase.table("transactions")
            .select("*")
            .eq("user_id", user_id)
            .gte("date", start_date)
            .execute()
        )

        activities = activities_result.data or []
        interruptions = interruptions_result.data or []
        transactions = transactions_result.data or []

        # Group by date
        daily_data: Dict[str, Dict] = {}

        for activity in activities:
            activity_date = (
                datetime.fromisoformat(activity["start_time"].replace("Z", "+00:00"))
                .date()
                .isoformat()
            )

            if activity_date not in daily_data:
                daily_data[activity_date] = {
                    "activity_count": 0,
                    "total_hours": 0,
                    "interruption_count": 0,
                    "daily_expenses": 0,
                    "daily_income": 0,
                }

            start = datetime.fromisoformat(
                activity["start_time"].replace("Z", "+00:00")
            )
            end = datetime.fromisoformat(activity["end_time"].replace("Z", "+00:00"))
            hours = (end - start).total_seconds() / 3600

            daily_data[activity_date]["activity_count"] += 1
            daily_data[activity_date]["total_hours"] += hours

        for interruption in interruptions:
            interruption_date = (
                datetime.fromisoformat(interruption["time"].replace("Z", "+00:00"))
                .date()
                .isoformat()
            )

            if interruption_date in daily_data:
                daily_data[interruption_date]["interruption_count"] += 1

        for transaction in transactions:
            transaction_date = transaction["date"]

            if transaction_date not in daily_data:
                daily_data[transaction_date] = {
                    "activity_count": 0,
                    "total_hours": 0,
                    "interruption_count": 0,
                    "daily_expenses": 0,
                    "daily_income": 0,
                }

            if transaction["type"] == "expense":
                daily_data[transaction_date]["daily_expenses"] += float(
                    transaction["amount"]
                )
            else:
                daily_data[transaction_date]["daily_income"] += float(
                    transaction["amount"]
                )

        # Build response
        correlations = []
        for day, data in sorted(daily_data.items()):
            correlations.append(
                TimeMoneyCorrelation(
                    date=day,
                    activity_count=data["activity_count"],
                    total_hours=round(data["total_hours"], 2),
                    interruption_count=data["interruption_count"],
                    daily_expenses=round(data["daily_expenses"], 2),
                    daily_income=round(data["daily_income"], 2),
                )
            )

        return correlations
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating time-money correlation: {str(e)}",
        )


@router.get(
    "/cross-domain/energy-spending", response_model=List[EnergySpendingCorrelation]
)
@limiter.limit("100/minute")
async def get_energy_spending_correlation(
    request: Request,
    days: int = 30,
    user_id: str = Depends(get_current_user),
):
    """Analyze correlation between energy levels and spending."""
    try:
        start_date = (date.today() - timedelta(days=days)).isoformat()

        # Get energy logs
        energy_result = (
            supabase.table("energy_logs")
            .select("*")
            .eq("user_id", user_id)
            .gte("date", start_date)
            .execute()
        )

        # Get transactions
        transactions_result = (
            supabase.table("transactions")
            .select("*")
            .eq("user_id", user_id)
            .gte("date", start_date)
            .execute()
        )

        energy_logs = energy_result.data or []
        transactions = transactions_result.data or []

        # Group by date
        daily_data: Dict[str, Dict] = {}

        for log in energy_logs:
            log_date = log["date"]
            daily_data[log_date] = {
                "energy_level": log["energy_level"],
                "stress_level": log["stress_level"],
                "daily_expenses": 0,
                "expense_count": 0,
            }

        for transaction in transactions:
            transaction_date = transaction["date"]

            if transaction_date not in daily_data:
                continue

            if transaction["type"] == "expense":
                daily_data[transaction_date]["daily_expenses"] += float(
                    transaction["amount"]
                )
                daily_data[transaction_date]["expense_count"] += 1

        # Build response
        correlations = []
        for day, data in sorted(daily_data.items()):
            correlations.append(
                EnergySpendingCorrelation(
                    date=day,
                    energy_level=data["energy_level"],
                    stress_level=data["stress_level"],
                    daily_expenses=round(data["daily_expenses"], 2),
                    expense_count=data["expense_count"],
                )
            )

        return correlations
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating energy-spending correlation: {str(e)}",
        )


@router.get(
    "/cross-domain/interruption-tasks", response_model=List[InterruptionTaskCorrelation]
)
@limiter.limit("100/minute")
async def get_interruption_task_correlation(
    request: Request,
    days: int = 30,
    user_id: str = Depends(get_current_user),
):
    """Analyze correlation between interruptions and task completion."""
    try:
        start_date = (date.today() - timedelta(days=days)).isoformat()

        # Get tasks
        tasks_result = (
            supabase.table("tasks")
            .select("*")
            .eq("user_id", user_id)
            .gte("due_date", start_date)
            .execute()
        )

        # Get interruptions
        interruptions_result = (
            supabase.table("interruptions")
            .select("*")
            .eq("user_id", user_id)
            .gte("time", start_date)
            .execute()
        )

        tasks = tasks_result.data or []
        interruptions = interruptions_result.data or []

        # Group by date
        daily_data: Dict[str, Dict] = {}

        for task in tasks:
            if not task.get("due_date"):
                continue

            task_date = task["due_date"]

            if task_date not in daily_data:
                daily_data[task_date] = {
                    "total_tasks": 0,
                    "completed_tasks": 0,
                    "interruption_count": 0,
                }

            daily_data[task_date]["total_tasks"] += 1
            if task["status"] == "completed":
                daily_data[task_date]["completed_tasks"] += 1

        for interruption in interruptions:
            interruption_date = (
                datetime.fromisoformat(interruption["time"].replace("Z", "+00:00"))
                .date()
                .isoformat()
            )

            if interruption_date in daily_data:
                daily_data[interruption_date]["interruption_count"] += 1

        # Build response
        correlations = []
        for day, data in sorted(daily_data.items()):
            completion_rate = (
                (data["completed_tasks"] / data["total_tasks"] * 100)
                if data["total_tasks"] > 0
                else 0
            )

            correlations.append(
                InterruptionTaskCorrelation(
                    task_date=day,
                    total_tasks=data["total_tasks"],
                    completed_tasks=data["completed_tasks"],
                    interruption_count=data["interruption_count"],
                    completion_rate=round(completion_rate, 1),
                )
            )

        return correlations
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating interruption-task correlation: {str(e)}",
        )


@router.get("/cross-domain/insights", response_model=List[CrossDomainInsight])
@limiter.limit("100/minute")
async def get_cross_domain_insights(
    request: Request,
    days: int = 30,
    user_id: str = Depends(get_current_user),
):
    """Generate cross-domain insights."""
    try:
        insights = []
        start_date = (date.today() - timedelta(days=days)).isoformat()

        # Get data
        energy_result = (
            supabase.table("energy_logs")
            .select("*")
            .eq("user_id", user_id)
            .gte("date", start_date)
            .execute()
        )

        transactions_result = (
            supabase.table("transactions")
            .select("*")
            .eq("user_id", user_id)
            .gte("date", start_date)
            .execute()
        )

        activities_result = (
            supabase.table("activities")
            .select("*")
            .eq("user_id", user_id)
            .gte("start_time", start_date)
            .execute()
        )

        tasks_result = (
            supabase.table("tasks")
            .select("*")
            .eq("user_id", user_id)
            .gte("due_date", start_date)
            .execute()
        )

        energy_logs = energy_result.data or []
        transactions = transactions_result.data or []
        activities = activities_result.data or []
        tasks = tasks_result.data or []

        # Insight 1: Low energy → Higher spending
        low_energy_days = [e for e in energy_logs if e["energy_level"] <= 2]
        high_energy_days = [e for e in energy_logs if e["energy_level"] >= 4]

        if low_energy_days and high_energy_days:
            low_energy_dates = {e["date"] for e in low_energy_days}
            high_energy_dates = {e["date"] for e in high_energy_days}

            low_energy_spending = sum(
                float(t["amount"])
                for t in transactions
                if t["type"] == "expense" and t["date"] in low_energy_dates
            )
            high_energy_spending = sum(
                float(t["amount"])
                for t in transactions
                if t["type"] == "expense" and t["date"] in high_energy_dates
            )

            if len(low_energy_days) > 0 and len(high_energy_days) > 0:
                avg_low = low_energy_spending / len(low_energy_days)
                avg_high = high_energy_spending / len(high_energy_days)

                if avg_low > avg_high * 1.2:
                    insights.append(
                        CrossDomainInsight(
                            type="energy_spending",
                            title="Low Energy Days → Higher Spending",
                            description=f"On low-energy days, you spend ${avg_low:.2f} on average vs ${avg_high:.2f} on high-energy days.",
                            data={
                                "low_energy_avg": round(avg_low, 2),
                                "high_energy_avg": round(avg_high, 2),
                                "difference_percent": round(
                                    ((avg_low - avg_high) / avg_high * 100), 1
                                ),
                            },
                            recommendation="Consider planning lighter tasks on low-energy days to reduce impulse spending.",
                        )
                    )

        # Insight 2: Deep work → Fewer interruptions
        deep_work_activities = [a for a in activities if a.get("work_type") == "deep"]
        shallow_work_activities = [
            a for a in activities if a.get("work_type") == "shallow"
        ]

        if deep_work_activities:
            insights.append(
                CrossDomainInsight(
                    type="focus_quality",
                    title="Deep Work Sessions",
                    description=f"You've logged {len(deep_work_activities)} deep work sessions in the last {days} days.",
                    data={
                        "deep_work_count": len(deep_work_activities),
                        "shallow_work_count": len(shallow_work_activities),
                    },
                    recommendation="Schedule more deep work blocks during your peak energy hours.",
                )
            )

        # Insight 3: Task completion vs interruptions
        completed_tasks = [t for t in tasks if t["status"] == "completed"]
        if tasks:
            completion_rate = len(completed_tasks) / len(tasks) * 100

            if completion_rate < 60:
                insights.append(
                    CrossDomainInsight(
                        type="task_completion",
                        title="Task Completion Rate",
                        description=f"Your task completion rate is {completion_rate:.1f}%.",
                        data={
                            "completion_rate": round(completion_rate, 1),
                            "total_tasks": len(tasks),
                            "completed": len(completed_tasks),
                        },
                        recommendation="Consider breaking down large tasks or scheduling them during high-energy periods.",
                    )
                )

        return insights
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating insights: {str(e)}"
        )
