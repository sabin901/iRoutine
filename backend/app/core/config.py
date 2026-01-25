"""
Application Configuration
==========================

This module handles all environment variable configuration using Pydantic Settings.
All sensitive configuration (API keys, URLs) should be loaded from .env file.

Environment Variables Required:
- SUPABASE_URL: Your Supabase project URL
- SUPABASE_SERVICE_ROLE_KEY: Service role key (has admin privileges, keep secret!)
- SUPABASE_ANON_KEY: Anonymous/public key (safe for frontend)
- CORS_ORIGINS: Comma-separated list of allowed frontend URLs
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Uses Pydantic BaseSettings to automatically load from .env file
    and validate types. All fields are required unless they have defaults.
    """

    # Supabase configuration
    SUPABASE_URL: str  # e.g., "https://your-project.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY: str  # Secret key - never expose to frontend!
    SUPABASE_ANON_KEY: str  # Public key - safe for frontend use

    # CORS configuration
    # Default allows local development frontend
    # In production, set to your actual frontend URL(s)
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """
        Convert comma-separated CORS_ORIGINS string to list.

        Example: "http://localhost:3000,https://app.example.com"
        Returns: ["http://localhost:3000", "https://app.example.com"]

        This is used by CORS middleware to allow requests from these origins.
        """
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        """
        Pydantic configuration.

        Tells Pydantic to load environment variables from .env file
        in the project root directory.
        """

        env_file = ".env"


# Create global settings instance
# This is imported throughout the app to access configuration
settings = Settings()
