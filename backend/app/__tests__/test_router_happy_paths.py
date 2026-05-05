import asyncio
import os
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

FAKE_SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9."
    "signature"
)

os.environ.setdefault("SUPABASE_URL", "https://placeholder.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", FAKE_SUPABASE_KEY)
os.environ.setdefault("SUPABASE_ANON_KEY", FAKE_SUPABASE_KEY)

from app.routers import activities, analytics, cross_domain, energy, export
from app.routers import feedback, finances, insights
from app.routers import interruptions, planner, reflections


USER_ID = "00000000-0000-0000-0000-000000000001"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, table, rows):
        self.table = table
        self.rows = rows
        self.payload = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def gte(self, *_args, **_kwargs):
        return self

    def lte(self, *_args, **_kwargs):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def single(self):
        return self

    def insert(self, payload):
        row = self.table.make_row(payload)
        self.rows.append(row)
        self.payload = [row]
        return self

    def upsert(self, payload, **_kwargs):
        return self.insert(payload)

    def update(self, payload):
        row = self.table.make_row(payload)
        if self.rows:
            self.rows[0].update(row)
            row = self.rows[0]
        else:
            self.rows.append(row)
        self.payload = [row]
        return self

    def delete(self):
        self.payload = [{"deleted": True}]
        return self

    def execute(self):
        return FakeResult(self.payload if self.payload is not None else self.rows)


class FakeTable:
    def __init__(self, name, store):
        self.name = name
        self.store = store

    def make_row(self, payload):
        now = utc_now().isoformat()
        row = {
            "id": f"{self.name}-1",
            "user_id": USER_ID,
            "created_at": now,
            "updated_at": now,
        }
        row.update(payload)
        return row

    def select(self, *args, **kwargs):
        return FakeQuery(self, self.store.setdefault(self.name, [])).select(
            *args, **kwargs
        )

    def insert(self, payload):
        return FakeQuery(self, self.store.setdefault(self.name, [])).insert(payload)

    def upsert(self, payload, **kwargs):
        return FakeQuery(self, self.store.setdefault(self.name, [])).upsert(
            payload, **kwargs
        )

    def update(self, payload):
        return FakeQuery(self, self.store.setdefault(self.name, [])).update(payload)

    def delete(self):
        return FakeQuery(self, self.store.setdefault(self.name, [])).delete()


class FakeSupabase:
    def __init__(self):
        now = utc_now()
        self.store = {
            "activities": [
                {
                    "id": "activity-1",
                    "user_id": USER_ID,
                    "category": "Work",
                    "start_time": (now - timedelta(hours=2)).isoformat(),
                    "end_time": (now - timedelta(hours=1)).isoformat(),
                    "note": "Focus block",
                    "energy_cost": "medium",
                    "work_type": "deep",
                    "planned_start_time": None,
                    "planned_end_time": None,
                    "task_id": None,
                    "created_at": now.isoformat(),
                }
            ],
            "interruptions": [
                {
                    "id": "interruption-1",
                    "user_id": USER_ID,
                    "activity_id": None,
                    "time": (now - timedelta(hours=1, minutes=30)).isoformat(),
                    "end_time": (now - timedelta(hours=1, minutes=20)).isoformat(),
                    "duration_minutes": 10,
                    "type": "Phone",
                    "note": "Call",
                    "created_at": now.isoformat(),
                }
            ],
            "tasks": [
                {
                    "id": "task-1",
                    "user_id": USER_ID,
                    "title": "Finish beta",
                    "description": None,
                    "due_date": date.today().isoformat(),
                    "due_time": None,
                    "priority": "high",
                    "status": "completed",
                    "category": "Product",
                    "estimated_minutes": 60,
                    "actual_minutes": 45,
                    "completed_at": now.isoformat(),
                    "is_recurring": False,
                    "recurring_pattern": None,
                    "energy_required": "medium",
                    "avoidance_count": 0,
                    "last_postponed_at": None,
                    "breakdown_suggested": False,
                    "created_at": now.isoformat(),
                }
            ],
            "goals": [],
            "habits": [],
            "habit_logs": [],
            "energy_logs": [
                {
                    "id": "energy-1",
                    "user_id": USER_ID,
                    "date": date.today().isoformat(),
                    "energy_level": 2,
                    "stress_level": 4,
                    "mood": "stressed",
                    "sleep_hours": 6,
                    "note": "Low energy",
                    "created_at": now.isoformat(),
                    "updated_at": now.isoformat(),
                },
                {
                    "id": "energy-2",
                    "user_id": USER_ID,
                    "date": (date.today() - timedelta(days=1)).isoformat(),
                    "energy_level": 5,
                    "stress_level": 1,
                    "mood": "focused",
                    "sleep_hours": 8,
                    "note": "High energy",
                    "created_at": now.isoformat(),
                    "updated_at": now.isoformat(),
                },
            ],
            "daily_reflections": [],
            "weekly_reflections": [],
            "monthly_reflections": [],
            "transactions": [
                {
                    "id": "transaction-1",
                    "user_id": USER_ID,
                    "amount": 80,
                    "type": "expense",
                    "category": "Food",
                    "description": None,
                    "date": date.today().isoformat(),
                    "is_recurring": False,
                    "recurring_id": None,
                    "intent": "unplanned",
                    "emotion": "stress",
                    "worth_it": False,
                    "created_at": now.isoformat(),
                },
                {
                    "id": "transaction-2",
                    "user_id": USER_ID,
                    "amount": 20,
                    "type": "expense",
                    "category": "Food",
                    "description": None,
                    "date": (date.today() - timedelta(days=1)).isoformat(),
                    "is_recurring": False,
                    "recurring_id": None,
                    "intent": "planned",
                    "emotion": "neutral",
                    "worth_it": True,
                    "created_at": now.isoformat(),
                },
            ],
            "budgets": [],
            "savings_goals": [],
            "recurring_transactions": [],
            "product_feedback": [],
        }

    def table(self, name):
        return FakeTable(name, self.store)


def request():
    return SimpleNamespace(client=SimpleNamespace(host="testclient"))


def run(coro):
    return asyncio.run(coro)


def patch_supabase(monkeypatch, *modules):
    fake = FakeSupabase()
    for module in modules:
        monkeypatch.setattr(module, "supabase", fake)
    return fake


def test_activity_and_interruption_routes(monkeypatch):
    patch_supabase(monkeypatch, activities, interruptions)

    activity = activities.ActivityCreate(
        category="Work",
        start_time=utc_now(),
        end_time=utc_now() + timedelta(hours=1),
        note="Route test",
    )
    created = run(activities.create_activity.__wrapped__(request(), activity, USER_ID))
    listed = run(activities.get_activities.__wrapped__(request(), None, None, USER_ID))

    interruption = interruptions.InterruptionCreate(
        type="Phone",
        time=utc_now(),
        end_time=utc_now() + timedelta(minutes=10),
        duration_minutes=10,
    )
    logged = run(
        interruptions.create_interruption.__wrapped__(request(), interruption, USER_ID)
    )
    interruptions_list = run(
        interruptions.get_interruptions.__wrapped__(request(), None, None, USER_ID)
    )

    assert created.category == "Work"
    assert len(listed) >= 1
    assert logged.type == "Phone"
    assert len(interruptions_list) >= 1


def test_insights_and_analytics_routes(monkeypatch):
    patch_supabase(monkeypatch, insights, analytics)

    insight = run(insights.get_insights.__wrapped__(request(), USER_ID))
    streaks = run(analytics.get_streaks.__wrapped__(request(), USER_ID))
    summary = run(analytics.get_analytics_summary.__wrapped__(request(), 30, USER_ID))

    assert insight.consistency_score >= 0
    assert streaks.current_streak >= 0
    assert summary.total_focus_hours >= 0


def test_energy_feedback_and_reflection_routes(monkeypatch):
    patch_supabase(monkeypatch, energy, feedback, reflections)

    energy_log = energy.EnergyLogCreate(
        energy_level=4,
        stress_level=2,
        mood="focused",
        sleep_hours=7.5,
        note="Good day",
    )
    created_energy = run(
        energy.create_energy_log.__wrapped__(request(), energy_log, USER_ID)
    )
    feedback_body = feedback.FeedbackCreate(
        product_area="overall", rating=5, message="Useful"
    )
    created_feedback = run(
        feedback.create_feedback.__wrapped__(request(), feedback_body, USER_ID)
    )
    daily = reflections.DailyReflectionCreate(
        what_worked="Focus",
        what_didnt="Nothing major",
        why="Protected calendar",
        adjustment="Repeat it",
    )
    created_reflection = run(
        reflections.create_daily_reflection.__wrapped__(request(), daily, USER_ID)
    )

    assert created_energy.energy_level == 4
    assert created_feedback.rating == 5
    assert created_reflection.what_worked == "Focus"


def test_finance_and_planner_routes(monkeypatch):
    patch_supabase(monkeypatch, finances, planner)

    transaction = finances.TransactionCreate(
        amount=20,
        type="expense",
        category="Food",
        date=date.today(),
    )
    created_transaction = run(
        finances.create_transaction.__wrapped__(request(), transaction, USER_ID)
    )
    budget = finances.BudgetCreate(category="Food", amount=300, month=date.today())
    created_budget = run(
        finances.create_or_update_budget.__wrapped__(request(), budget, USER_ID)
    )
    task = planner.TaskCreate(title="Ship activation", priority="high")
    created_task = run(planner.create_task.__wrapped__(request(), task, USER_ID))
    goal = planner.GoalCreate(title="Launch beta", category="Career")
    created_goal = run(planner.create_goal.__wrapped__(request(), goal, USER_ID))

    assert created_transaction["amount"] == 20
    assert created_budget["category"] == "Food"
    assert created_task["title"] == "Ship activation"
    assert created_goal["title"] == "Launch beta"


def test_cross_domain_and_export_routes(monkeypatch):
    patch_supabase(monkeypatch, cross_domain, export)

    time_money = run(
        cross_domain.get_time_money_correlation.__wrapped__(request(), 30, USER_ID)
    )
    energy_spending = run(
        cross_domain.get_energy_spending_correlation.__wrapped__(request(), 30, USER_ID)
    )
    task_correlation = run(
        cross_domain.get_interruption_task_correlation.__wrapped__(
            request(), 30, USER_ID
        )
    )
    generated_insights = run(
        cross_domain.get_cross_domain_insights.__wrapped__(request(), 30, USER_ID)
    )
    response = run(export.export_data.__wrapped__(request(), USER_ID))

    assert len(time_money) >= 1
    assert len(energy_spending) >= 1
    assert len(task_correlation) >= 1
    assert any(item.type == "focus_quality" for item in generated_insights)
    assert response.media_type == "text/csv"
