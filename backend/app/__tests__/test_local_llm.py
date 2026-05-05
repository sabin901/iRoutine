import os

os.environ.setdefault("SUPABASE_URL", "https://placeholder.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "placeholder")
os.environ.setdefault("SUPABASE_ANON_KEY", "placeholder")

from app.services.local_llm import build_insight_snapshot  # noqa: E402


def test_build_insight_snapshot_condenses_logs():
    activities = [
        {
            "category": "Coding",
            "start_time": "2026-05-01T09:00:00Z",
            "end_time": "2026-05-01T10:30:00Z",
        },
        {
            "category": "Rest",
            "start_time": "2026-05-01T10:30:00Z",
            "end_time": "2026-05-01T11:00:00Z",
        },
    ]
    interruptions = [
        {"type": "Phone", "time": "2026-05-01T09:20:00Z"},
        {"type": "Noise", "time": "2026-05-01T09:40:00Z"},
    ]

    snapshot = build_insight_snapshot(activities, interruptions)

    assert snapshot["activity_count"] == 2
    assert snapshot["interruption_count"] == 2
    assert snapshot["focus_hours"] == 1.5
    assert "deterministic_insights" in snapshot
    assert snapshot["recent_activity_categories"] == ["Coding", "Rest"]
