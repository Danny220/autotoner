from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints.tone import router as tone_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autotoner backend - AI guitar tone extraction and matching.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tone_router, prefix=f"{settings.API_V1_STR}/tone", tags=["Tone"])


@app.get("/health")
def health_check():
    return {"status": "ok", "version": settings.VERSION}