from fastapi import FastAPI

from app.api.v1.auth import router as auth_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.recovery_cases import router as recovery_cases_router
from app.api.v1.recovery_attempts import router as recovery_attempts_router
from app.api.v1.dashboard import router as dashboard_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    description="AI-powered revenue recovery platform",
    version=settings.app_version,
)


app.include_router(
    auth_router,
    prefix="/api/v1",
)

app.include_router(
    transactions_router,
    prefix="/api/v1",
)

app.include_router(
    recovery_cases_router,
    prefix="/api/v1",
)

app.include_router(
    recovery_attempts_router,
    prefix="/api/v1",
)

app.include_router(
    dashboard_router,
    prefix="/api/v1",
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "recoverai-api",
    }