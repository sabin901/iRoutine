"""FastAPI entrypoint for the iRoutine backend."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.routers import (
    activities,
    analytics,
    interruptions,
    insights,
    export,
    finances,
    planner,
    energy,
    reflections,
    cross_domain,
    feedback,
)
from app.core.config import settings

# Rate limit by client IP to protect public endpoints.
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Routine API",
    description="A calm system for understanding how you spend your time",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS is configured from env so production can restrict allowed frontends.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    max_age=3600,
)

# Keep routers grouped by product domain; all user data routes live under /api.
app.include_router(activities.router, prefix="/api", tags=["activities"])
app.include_router(interruptions.router, prefix="/api", tags=["interruptions"])
app.include_router(insights.router, prefix="/api", tags=["insights"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])
app.include_router(export.router, prefix="/api", tags=["export"])
app.include_router(finances.router, prefix="/api", tags=["finances"])
app.include_router(planner.router, prefix="/api", tags=["planner"])
app.include_router(energy.router, prefix="/api", tags=["energy"])
app.include_router(reflections.router, prefix="/api", tags=["reflections"])
app.include_router(cross_domain.router, prefix="/api", tags=["cross-domain"])
app.include_router(feedback.router, prefix="/api", tags=["feedback"])


@app.get("/")
@limiter.limit("100/minute")
async def root(request: Request):
    """Basic API information."""
    return {"message": "Routine API"}


@app.get("/health")
@limiter.limit("100/minute")
async def health(request: Request):
    """Health check used by hosts and uptime monitors."""
    return {"status": "ok"}
