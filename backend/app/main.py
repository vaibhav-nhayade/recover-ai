from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.api.v1.auth import router as auth_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.recovery_cases import router as recovery_cases_router
from app.api.v1.recovery_attempts import router as recovery_attempts_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.recovery_scoring import router as recovery_scoring_router
from app.api.v1.recovery_batch import router as recovery_batch_router
from app.api.v1.recovery_agent import router as recovery_agent_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    description="AI-powered revenue recovery platform",
    version=settings.app_version,
)


# Frontend runs on localhost:3000 while the API runs on localhost:8000.
# Allow the frontend to call the FastAPI API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(
    recovery_scoring_router,
    prefix="/api/v1",
)
app.include_router(
    recovery_batch_router,
    prefix="/api/v1",
)
app.include_router(
    recovery_agent_router,
    prefix="/api/v1",
)

@app.get("/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "recoverai-api",
    }