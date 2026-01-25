"""
Authentication Module
=====================

Handles JWT token validation and user authentication for protected API endpoints.

This module provides a dependency function that:
1. Extracts JWT token from Authorization header
2. Validates token with Supabase Auth
3. Returns the authenticated user's ID
4. Raises 401 error if token is invalid or missing

All protected endpoints use this as a dependency to ensure only
authenticated users can access their data.
"""

from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings
from app.core.database import supabase

# HTTPBearer extracts "Bearer <token>" from Authorization header
# This is the standard way to send JWT tokens in HTTP requests
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> str:
    """
    Extract and validate user ID from JWT token.
    
    This is a FastAPI dependency that can be used in any endpoint.
    It automatically:
    1. Extracts the Bearer token from the Authorization header
    2. Validates the token with Supabase Auth service
    3. Returns the user ID if valid
    4. Raises 401 Unauthorized if token is invalid/missing
    
    Usage in endpoints:
        @router.get("/protected")
        async def protected_endpoint(user_id: str = Depends(get_current_user)):
            # user_id is guaranteed to be a valid authenticated user
            ...
    
    Args:
        credentials: HTTPAuthorizationCredentials from Authorization header
                    Automatically extracted by FastAPI Security dependency
    
    Returns:
        str: The authenticated user's UUID
        
    Raises:
        HTTPException: 401 if token is invalid, expired, or missing
    """
    token = credentials.credentials

    try:
        # Verify token with Supabase Auth
        # Supabase handles JWT validation, signature checking, expiration, etc.
        user = supabase.auth.get_user(token)
        
        # Check if user object is valid
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        # Return the user's unique ID (UUID)
        # This ID is used throughout the app to filter data by user
        return user.user.id
    except Exception:
        # Catch any errors (invalid token, network issues, etc.)
        # Return generic error to avoid leaking information about why auth failed
        raise HTTPException(status_code=401, detail="Invalid authentication")
