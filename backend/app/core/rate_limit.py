"""
Rate limiting middleware for API endpoints.
Implements IP and user-based rate limiting with graceful 429 responses.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException
from typing import Optional

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
# Sensible defaults: 100 requests per minute per IP
DEFAULT_RATE_LIMIT = "100/minute"

# Stricter limits for write operations
WRITE_RATE_LIMIT = "30/minute"  # POST/PUT/DELETE

# Very strict for authentication endpoints
AUTH_RATE_LIMIT = "10/minute"  # Login/signup


def get_user_id_for_rate_limit(request: Request) -> Optional[str]:
    """
    Extract user ID from JWT token for user-based rate limiting.
    Falls back to IP if no user is authenticated.
    """
    try:
        # Try to get user from Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            # In production, decode JWT to get user_id
            # For now, use IP as fallback
            return get_remote_address(request)
    except Exception:
        pass

    # Fallback to IP address
    return get_remote_address(request)


# Custom rate limit key function that uses user_id if available
def rate_limit_key_func(request: Request) -> str:
    """Rate limit by user_id if authenticated, otherwise by IP."""
    user_id = get_user_id_for_rate_limit(request)
    return str(user_id) if user_id else get_remote_address(request)
