"""
Database Connection Module
==========================

Creates and exports the Supabase client instance for database operations.

This module:
- Initializes the Supabase client with service role key
- Service role key bypasses Row Level Security (RLS) - use carefully!
- The client is used throughout the app to query/update the database

Important: We use SERVICE_ROLE_KEY (not anon key) because:
1. Backend needs to perform operations that may bypass RLS when needed
2. Service role has full database access (but we still filter by user_id)
3. This key is NEVER exposed to frontend - only backend has it

All queries should still filter by user_id to ensure data isolation,
even though service role could technically access all data.
"""

from supabase import create_client, Client
from app.core.config import settings

# Create Supabase client with service role key
# Service role key has admin privileges and bypasses Row Level Security
# This is safe because:
# 1. This code only runs on the backend (never exposed to frontend)
# 2. All endpoints validate user authentication first
# 3. All queries filter by user_id to ensure data isolation
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)
