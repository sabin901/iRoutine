"""Optional chat-completions adapter for extended insight narration."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import settings
from app.services.insights import generate_insights


def _activity_minutes(activity: dict[str, Any]) -> float:
    start = datetime.fromisoformat(activity["start_time"].replace("Z", "+00:00"))
    end = datetime.fromisoformat(activity["end_time"].replace("Z", "+00:00"))
    return max(0.0, (end - start).total_seconds() / 60)


def build_insight_snapshot(
    activities: list[dict[str, Any]],
    interruptions: list[dict[str, Any]],
) -> dict[str, Any]:
    """Condense raw logs before optional narration."""
    deterministic = generate_insights(activities, interruptions)
    focus_categories = {"Study", "Coding", "Work", "Reading"}
    focus_minutes = sum(
        _activity_minutes(activity)
        for activity in activities
        if activity.get("category") in focus_categories
    )

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "activity_count": len(activities),
        "interruption_count": len(interruptions),
        "focus_hours": round(focus_minutes / 60, 1),
        "deterministic_insights": deterministic,
        "recent_activity_categories": sorted(
            {activity.get("category", "Other") for activity in activities}
        ),
        "recent_interruption_types": sorted(
            {interruption.get("type", "Other") for interruption in interruptions}
        ),
    }


def build_prompt(snapshot: dict[str, Any]) -> list[dict[str, str]]:
    """Keep model output concise, actionable, and grounded in app data."""
    return [
        {
            "role": "system",
            "content": (
                "You are the private insight coach inside iRoutine. "
                "Use only the provided metrics. Be direct, kind, and specific. "
                "Return 1 short summary and 3 practical actions."
            ),
        },
        {
            "role": "user",
            "content": (
                "Analyze this weekly routine snapshot and respond in plain text:\n"
                f"{snapshot}"
            ),
        },
    ]


async def generate_local_llm_insight(
    activities: list[dict[str, Any]],
    interruptions: list[dict[str, Any]],
) -> dict[str, Any]:
    """Call the configured chat-completions endpoint when enabled."""
    snapshot = build_insight_snapshot(activities, interruptions)

    if not settings.LOCAL_LLM_ENABLED:
        return {
            "enabled": False,
            "provider": "Private analysis endpoint",
            "model": settings.LOCAL_LLM_MODEL,
            "summary": "Extended pattern narration is not enabled on this backend.",
            "actions": [
                "Set LOCAL_LLM_ENABLED=true after your chat-completions server is running and LOCAL_LLM_BASE_URL / LOCAL_LLM_MODEL are correct.",
            ],
            "snapshot": snapshot,
        }

    url = f"{settings.LOCAL_LLM_BASE_URL.rstrip('/')}/chat/completions"
    payload = {
        "model": settings.LOCAL_LLM_MODEL,
        "messages": build_prompt(snapshot),
        "temperature": 0.35,
        "max_tokens": 350,
    }
    headers = {"Authorization": f"Bearer {settings.LOCAL_LLM_API_KEY}"}

    async with httpx.AsyncClient(timeout=settings.LOCAL_LLM_TIMEOUT_SECONDS) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    content = data["choices"][0]["message"]["content"].strip()
    actions = [
        line.strip(" -0123456789.").strip()
        for line in content.splitlines()
        if line.strip()
    ][:4]

    return {
        "enabled": True,
        "provider": settings.LOCAL_LLM_BASE_URL,
        "model": settings.LOCAL_LLM_MODEL,
        "summary": content,
        "actions": actions,
        "snapshot": snapshot,
    }
