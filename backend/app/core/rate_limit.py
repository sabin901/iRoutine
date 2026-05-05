"""Shared rate limit constants and IP key helpers."""

from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
# Sensible defaults: 100 requests per minute per IP
DEFAULT_RATE_LIMIT = "100/minute"

# Stricter limits for write operations
WRITE_RATE_LIMIT = "30/minute"  # POST/PUT/DELETE

# Very strict for authentication endpoints
AUTH_RATE_LIMIT = "10/minute"  # Login/signup


def rate_limit_key_func(request: Request) -> str:
    """Rate limit by client IP; safe default for public API routes."""
    return get_remote_address(request)
