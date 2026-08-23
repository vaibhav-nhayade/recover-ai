from fastapi import FastAPI

app = FastAPI(
    title="RecoverAI API",
    description="AI-powered revenue recovery platform",
    version="0.1.0",
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "recoverai-api",
    }