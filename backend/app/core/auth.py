"""Authentication dependency for protected API routes."""

from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import supabase

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> str:
    """Validate a Supabase JWT and return the authenticated user's id."""
    token = credentials.credentials

    try:
        # Supabase verifies signature, expiry, and user existence.
        user = supabase.auth.get_user(token)

        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid authentication")

        return user.user.id
    except Exception:
        # Keep auth failures generic so token details never leak to clients.
        raise HTTPException(status_code=401, detail="Invalid authentication")
