"""
Finances API Router
==================

Handles all financial management features:
- Transactions (income and expenses)
- Budgets (monthly spending limits by category)
- Savings goals (track progress toward financial targets)
- Recurring transactions (subscriptions, bills, etc.)

Key Features:
- Emotional Money Layer: Track intent (planned/unplanned/impulse), 
  emotion (joy, stress, guilt, etc.), and "worth it?" rating
- Category-based budgeting
- Recurring transaction automation
- Financial summaries and insights

The emotional layer helps users understand their spending patterns
and make more mindful financial decisions.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, List
from datetime import date, datetime
from decimal import Decimal
from app.core.auth import get_current_user
from app.core.database import supabase
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Valid categories
EXPENSE_CATEGORIES = [
    "Food",
    "Transport",
    "Entertainment",
    "Shopping",
    "Bills",
    "Health",
    "Education",
    "Rent",
    "Utilities",
    "Subscriptions",
    "Other",
]
INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Gift", "Refund", "Other"]


# =============================================
# TRANSACTIONS
# =============================================


class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount")
    type: Literal["income", "expense"] = Field(..., description="Transaction type")
    category: str = Field(..., description="Category")
    description: Optional[str] = Field(None, max_length=500)
    date: date = Field(default_factory=date.today)
    is_recurring: bool = False
    recurring_id: Optional[str] = None
    intent: Optional[Literal["planned", "unplanned", "impulse"]] = Field(
        None, description="Was this transaction planned?"
    )
    emotion: Optional[
        Literal[
            "joy", "convenience", "stress", "necessity", "guilt", "neutral", "other"
        ]
    ] = Field(None, description="Emotional state when making transaction")
    worth_it: Optional[bool] = Field(None, description="Was this purchase worth it?")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return round(v, 2)


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    type: str
    category: str
    description: Optional[str]
    date: str
    is_recurring: bool
    recurring_id: Optional[str]
    intent: Optional[str] = None
    emotion: Optional[str] = None
    worth_it: Optional[bool] = None
    created_at: str


@router.post("/finances/transactions", response_model=TransactionResponse)
@limiter.limit("60/minute")
async def create_transaction(
    request: Request,
    transaction: TransactionCreate,
    user_id: str = Depends(get_current_user),
):
    """
    Create a new financial transaction (income or expense).
    
    Supports the "Emotional Money Layer" by allowing users to track:
    - Intent: Was this planned, unplanned, or impulse?
    - Emotion: How did they feel (joy, stress, guilt, etc.)?
    - Worth it: After the fact, was it worth it?
    
    This data enables insights like:
    - "You spend more when stressed"
    - "Impulse purchases are rarely worth it"
    - "Planned purchases bring more joy"
    
    Args:
        request: FastAPI request object (needed for rate limiting)
        transaction: TransactionCreate with amount, type, category, etc.
        user_id: Authenticated user's ID (from JWT token)
    
    Returns:
        TransactionResponse: Created transaction with generated ID
    
    Raises:
        HTTPException: 500 if database error occurs
    """
    # Build data dictionary with required fields
    data = {
        "user_id": user_id,
        "amount": transaction.amount,
        "type": transaction.type,  # "income" or "expense"
        "category": transaction.category,
        "description": transaction.description,
        "date": transaction.date.isoformat(),
        "is_recurring": transaction.is_recurring,
        "recurring_id": transaction.recurring_id,
    }

    # Add optional emotional/intent fields if provided
    # These fields enable the "Emotional Money Layer" feature
    if transaction.intent:
        data["intent"] = transaction.intent
    if transaction.emotion:
        data["emotion"] = transaction.emotion
    if transaction.worth_it is not None:  # Check for None, not falsy (False is valid)
        data["worth_it"] = transaction.worth_it

    try:
        result = supabase.table("transactions").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create transaction")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/finances/transactions", response_model=List[TransactionResponse])
@limiter.limit("100/minute")
async def get_transactions(
    request: Request,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    type: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 100,
    user_id: str = Depends(get_current_user),
):
    """Get transactions with optional filters."""
    query = supabase.table("transactions").select("*").eq("user_id", user_id)

    if start_date:
        query = query.gte("date", start_date.isoformat())
    if end_date:
        query = query.lte("date", end_date.isoformat())
    if type:
        query = query.eq("type", type)
    if category:
        query = query.eq("category", category)

    try:
        result = query.order("date", desc=True).limit(limit).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/finances/transactions/{transaction_id}")
@limiter.limit("30/minute")
async def delete_transaction(
    request: Request,
    transaction_id: str,
    user_id: str = Depends(get_current_user),
):
    """Delete a transaction."""
    try:
        result = (
            supabase.table("transactions")
            .delete()
            .eq("id", transaction_id)
            .eq("user_id", user_id)
            .execute()
        )
        return {"message": "Transaction deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
# BUDGETS
# =============================================


class BudgetCreate(BaseModel):
    category: str = Field(..., description="Budget category")
    amount: float = Field(..., gt=0, description="Monthly budget amount")
    month: date = Field(..., description="First day of month")


class BudgetResponse(BaseModel):
    id: str
    user_id: str
    category: str
    amount: float
    month: str
    created_at: str


@router.post("/finances/budgets", response_model=BudgetResponse)
@limiter.limit("30/minute")
async def create_or_update_budget(
    request: Request,
    budget: BudgetCreate,
    user_id: str = Depends(get_current_user),
):
    """Create or update a budget for a category/month."""
    data = {
        "user_id": user_id,
        "category": budget.category,
        "amount": budget.amount,
        "month": budget.month.isoformat(),
    }

    try:
        result = (
            supabase.table("budgets")
            .upsert(data, on_conflict="user_id,category,month")
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save budget")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/finances/budgets", response_model=List[BudgetResponse])
@limiter.limit("100/minute")
async def get_budgets(
    request: Request,
    month: Optional[date] = None,
    user_id: str = Depends(get_current_user),
):
    """Get budgets for a month."""
    query = supabase.table("budgets").select("*").eq("user_id", user_id)

    if month:
        query = query.eq("month", month.isoformat())

    try:
        result = query.execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
# SAVINGS GOALS
# =============================================


class SavingsGoalCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0, ge=0)
    deadline: Optional[date] = None
    color: str = "#6172f3"


class SavingsGoalResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    target_amount: float
    current_amount: float
    deadline: Optional[str]
    color: str
    status: str
    created_at: str


@router.post("/finances/goals", response_model=SavingsGoalResponse)
@limiter.limit("30/minute")
async def create_savings_goal(
    request: Request,
    goal: SavingsGoalCreate,
    user_id: str = Depends(get_current_user),
):
    """Create a savings goal."""
    data = {
        "user_id": user_id,
        "name": goal.name,
        "description": goal.description,
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "deadline": goal.deadline.isoformat() if goal.deadline else None,
        "color": goal.color,
    }

    try:
        result = supabase.table("savings_goals").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create goal")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/finances/goals", response_model=List[SavingsGoalResponse])
@limiter.limit("100/minute")
async def get_savings_goals(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Get all savings goals."""
    try:
        result = (
            supabase.table("savings_goals")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/finances/goals/{goal_id}")
@limiter.limit("30/minute")
async def update_savings_goal(
    request: Request,
    goal_id: str,
    current_amount: Optional[float] = None,
    status: Optional[str] = None,
    user_id: str = Depends(get_current_user),
):
    """Update a savings goal."""
    data = {}
    if current_amount is not None:
        data["current_amount"] = current_amount
    if status is not None:
        data["status"] = status

    try:
        result = (
            supabase.table("savings_goals")
            .update(data)
            .eq("id", goal_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else {"message": "Updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
# RECURRING TRANSACTIONS
# =============================================


class RecurringTransactionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    type: Literal["income", "expense"]
    category: str
    description: str = Field(..., max_length=200)
    frequency: Literal["daily", "weekly", "biweekly", "monthly", "yearly"]
    start_date: date
    next_date: date


class RecurringTransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    type: str
    category: str
    description: str
    frequency: str
    start_date: str
    next_date: str
    is_active: bool
    created_at: str


@router.post("/finances/recurring", response_model=RecurringTransactionResponse)
@limiter.limit("30/minute")
async def create_recurring_transaction(
    request: Request,
    recurring: RecurringTransactionCreate,
    user_id: str = Depends(get_current_user),
):
    """Create a recurring transaction."""
    data = {
        "user_id": user_id,
        "amount": recurring.amount,
        "type": recurring.type,
        "category": recurring.category,
        "description": recurring.description,
        "frequency": recurring.frequency,
        "start_date": recurring.start_date.isoformat(),
        "next_date": recurring.next_date.isoformat(),
    }

    try:
        result = supabase.table("recurring_transactions").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create recurring")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/finances/recurring", response_model=List[RecurringTransactionResponse])
@limiter.limit("100/minute")
async def get_recurring_transactions(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Get all recurring transactions."""
    try:
        result = (
            supabase.table("recurring_transactions")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/finances/recurring/{recurring_id}")
@limiter.limit("30/minute")
async def delete_recurring_transaction(
    request: Request,
    recurring_id: str,
    user_id: str = Depends(get_current_user),
):
    """Delete a recurring transaction."""
    try:
        supabase.table("recurring_transactions").delete().eq("id", recurring_id).eq(
            "user_id", user_id
        ).execute()
        return {"message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
# ANALYTICS
# =============================================


@router.get("/finances/summary")
@limiter.limit("100/minute")
async def get_financial_summary(
    request: Request,
    month: Optional[date] = None,
    user_id: str = Depends(get_current_user),
):
    """Get financial summary for a month."""
    if not month:
        month = date.today().replace(day=1)

    # Get start and end of month
    if month.month == 12:
        end_month = month.replace(year=month.year + 1, month=1)
    else:
        end_month = month.replace(month=month.month + 1)

    try:
        # Get transactions for the month
        transactions = (
            supabase.table("transactions")
            .select("*")
            .eq("user_id", user_id)
            .gte("date", month.isoformat())
            .lt("date", end_month.isoformat())
            .execute()
        ).data

        # Calculate totals
        total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
        total_expenses = sum(
            t["amount"] for t in transactions if t["type"] == "expense"
        )

        # Group by category
        expense_by_category = {}
        income_by_category = {}

        for t in transactions:
            if t["type"] == "expense":
                expense_by_category[t["category"]] = (
                    expense_by_category.get(t["category"], 0) + t["amount"]
                )
            else:
                income_by_category[t["category"]] = (
                    income_by_category.get(t["category"], 0) + t["amount"]
                )

        # Get budgets
        budgets = (
            supabase.table("budgets")
            .select("*")
            .eq("user_id", user_id)
            .eq("month", month.isoformat())
            .execute()
        ).data

        budget_status = []
        for b in budgets:
            spent = expense_by_category.get(b["category"], 0)
            budget_status.append(
                {
                    "category": b["category"],
                    "budget": b["amount"],
                    "spent": spent,
                    "remaining": b["amount"] - spent,
                    "percentage": (
                        round((spent / b["amount"]) * 100, 1) if b["amount"] > 0 else 0
                    ),
                }
            )

        return {
            "month": month.isoformat(),
            "total_income": round(total_income, 2),
            "total_expenses": round(total_expenses, 2),
            "net_savings": round(total_income - total_expenses, 2),
            "expense_by_category": expense_by_category,
            "income_by_category": income_by_category,
            "budget_status": budget_status,
            "transaction_count": len(transactions),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
