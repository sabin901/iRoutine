"""
Main FastAPI Application Entry Point
====================================

This file sets up the FastAPI application with:
- CORS middleware for cross-origin requests
- Rate limiting to prevent abuse
- All API routers for different features
- Health check endpoints

The app serves as the Personal Life Operating System API, handling:
- Time & Focus tracking (activities, interruptions)
- Financial management (transactions, budgets, savings)
- Energy & Mood tracking
- Planning (tasks, goals, habits)
- Reflections (daily, weekly, monthly)
- Cross-domain analytics and insights
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.routers import (
    activities,
    interruptions,
    insights,
    export,
    finances,
    planner,
    energy,
    reflections,
    cross_domain,
)
from app.core.config import settings

# Initialize rate limiter
# Uses client IP address to track and limit requests per user
# Prevents API abuse and ensures fair resource usage
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI application instance
# This is the main application object that handles all HTTP requests
app = FastAPI(
    title="Routine API",
    description="A calm system for understanding how you spend your time",
    version="1.0.0",
)

# Configure rate limiting
# Attach limiter to app state so it's available to all routes
# Set up error handler to return proper HTTP 429 (Too Many Requests) responses
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS (Cross-Origin Resource Sharing)
# Allows frontend (running on different domain/port) to make API requests
# - allow_origins: List of allowed frontend URLs (from .env CORS_ORIGINS)
# - allow_credentials: Allows cookies/auth headers in cross-origin requests
# - allow_methods: HTTP methods allowed (GET, POST, PUT, DELETE)
# - allow_headers: All headers allowed (needed for Authorization Bearer tokens)
# - max_age: Cache preflight requests for 1 hour
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    max_age=3600,
)

# Register all API routers
# Each router handles a specific domain of functionality
# All routes are prefixed with "/api" for consistency
# Tags are used for API documentation grouping

# Core Time & Focus tracking
app.include_router(activities.router, prefix="/api", tags=["activities"])
app.include_router(interruptions.router, prefix="/api", tags=["interruptions"])

# Analytics and Insights
app.include_router(insights.router, prefix="/api", tags=["insights"])

# Import analytics router (separate import for clarity)
from app.routers import analytics

app.include_router(analytics.router, prefix="/api", tags=["analytics"])

# Data export functionality
app.include_router(export.router, prefix="/api", tags=["export"])

# Financial management
app.include_router(finances.router, prefix="/api", tags=["finances"])

# Planning and task management
app.include_router(planner.router, prefix="/api", tags=["planner"])

# Energy and mood tracking
app.include_router(energy.router, prefix="/api", tags=["energy"])

# Reflection system
app.include_router(reflections.router, prefix="/api", tags=["reflections"])

# Cross-domain analytics (correlating time, money, energy, etc.)
app.include_router(cross_domain.router, prefix="/api", tags=["cross-domain"])


@app.get("/")
@limiter.limit("100/minute")
async def root(request: Request):
    """
    Root endpoint - API information

    Returns basic API information.
    Rate limited to 100 requests per minute.
    """
    return {"message": "Routine API"}


@app.get("/health")
@limiter.limit("100/minute")
async def health(request: Request):
    """
    Health check endpoint

    Used by deployment platforms and monitoring tools to verify the API is running.
    Returns {"status": "ok"} if the server is healthy.
    Rate limited to 100 requests per minute.
    """
    return {"status": "ok"}
