import os

import pytest
from pydantic import ValidationError

os.environ.setdefault("SUPABASE_URL", "https://placeholder.supabase.co")
FAKE_SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9."
    "signature"
)

os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", FAKE_SUPABASE_KEY)
os.environ.setdefault("SUPABASE_ANON_KEY", FAKE_SUPABASE_KEY)

from app.routers.feedback import FeedbackCreate  # noqa: E402


def test_feedback_accepts_valid_beta_signal():
    feedback = FeedbackCreate(
        product_area="insights",
        rating=5,
        message="The local AI coach makes the insight page much clearer.",
    )

    assert feedback.product_area == "insights"
    assert feedback.rating == 5


def test_feedback_rejects_unhelpful_rating_and_short_message():
    with pytest.raises(ValidationError):
        FeedbackCreate(product_area="overall", rating=6, message="bad")
