from fastapi import APIRouter
from app.api.v1.endpoints.tone import router as tone_router

api_router = APIRouter()
api_router.include_router(tone_router, prefix="/tone", tags=["Tone"])
