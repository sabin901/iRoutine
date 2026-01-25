"""
Unit tests for interruption metrics calculations
Tests core business logic for reliability
"""

import pytest
from datetime import datetime, timedelta
from typing import Dict, List


def calculate_interruption_cost(
    interruption: Dict, is_early_focus: bool = False
) -> float:
    """Calculate cost score for an interruption"""
    type_weights = {
        "Phone": 1.2,
        "Social Media": 1.4,
        "Noise": 1.0,
        "Other": 1.1,
    }

    duration = interruption.get("duration_minutes", 5)
    type_weight = type_weights.get(interruption.get("type", "Other"), 1.0)
    context_weight = 1.3 if is_early_focus else 1.0

    return duration * type_weight * context_weight


def calculate_recovery_time(
    interruption_time: datetime, next_focus_time: datetime = None
) -> int:
    """Calculate recovery time in minutes"""
    if next_focus_time is None:
        return None

    if next_focus_time <= interruption_time:
        return None

    delta = next_focus_time - interruption_time
    return int(delta.total_seconds() / 60)


def test_interruption_cost_calculation():
    """Test cost score calculation with type and context weights"""
    interruption = {
        "duration_minutes": 15,
        "type": "Social Media",
        "time": datetime.now(),
    }

    cost = calculate_interruption_cost(interruption, is_early_focus=True)

    assert cost > 0
    assert cost == 15 * 1.4 * 1.3  # duration × type_weight × context_weight


def test_interruption_cost_by_type():
    """Test different interruption types have correct weights"""
    base_interruption = {"duration_minutes": 10, "time": datetime.now()}

    phone_cost = calculate_interruption_cost({**base_interruption, "type": "Phone"})
    social_cost = calculate_interruption_cost(
        {**base_interruption, "type": "Social Media"}
    )
    noise_cost = calculate_interruption_cost({**base_interruption, "type": "Noise"})

    assert social_cost > phone_cost > noise_cost


def test_recovery_time_calculation():
    """Test recovery time calculation"""
    interruption_time = datetime.now()
    next_focus_time = interruption_time + timedelta(minutes=30)

    recovery = calculate_recovery_time(interruption_time, next_focus_time)

    assert recovery == 30


def test_recovery_time_handles_end_of_day():
    """Test recovery time handles edge case of no next focus"""
    interruption_time = datetime.now().replace(hour=23, minute=0)

    recovery = calculate_recovery_time(interruption_time, None)

    # Should return None, not crash
    assert recovery is None


def test_recovery_time_handles_invalid_times():
    """Test recovery time handles invalid time ordering"""
    interruption_time = datetime.now()
    next_focus_time = interruption_time - timedelta(minutes=10)  # Before interruption

    recovery = calculate_recovery_time(interruption_time, next_focus_time)

    assert recovery is None
