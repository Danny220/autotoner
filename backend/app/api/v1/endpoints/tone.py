import logging
import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from starlette.concurrency import run_in_threadpool
from app.schemas.tone import (
    SongMatchRequest,
    ToneAnalysisResponse,
    TonePresetResponse,
)
from app.services.audio_analyzer import AudioAnalyzer, AudioAnalysisError
from app.services.ai_engine import infer_tone_preset
from app.services.tone_engine import generate_preset_from_song
from app.core.config import settings

logger = logging.getLogger("autotoner.endpoints.tone")
router = APIRouter()

ALLOWED_EXTENSIONS = frozenset({"wav", "mp3", "flac", "ogg", "m4a"})


def _get_extension(filename: str | None) -> str:
    """Safely extract lowercase file extension from filename."""
    if not filename:
        return ""
    _, ext = os.path.splitext(filename)
    return ext.lstrip(".").lower()


@router.post("/analyze", response_model=ToneAnalysisResponse)
async def analyze_tone(
    file: UploadFile = File(...),
    notes: str | None = Form(None),
) -> ToneAnalysisResponse:
    """Analyze an uploaded audio sample to extract DSP features and infer tone presets."""
    extension = _get_extension(file.filename)
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File format not supported. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Read uploaded file content with safety size guard
    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file.",
        )

    if len(contents) > settings.MAX_AUDIO_UPLOAD_BYTES:
        max_mb = settings.MAX_AUDIO_UPLOAD_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_mb} MB.",
        )

    try:
        # Offload CPU-bound DSP feature extraction to worker thread
        features = await run_in_threadpool(AudioAnalyzer.extract_features, contents)
        # Offload synchronous AI inference to worker thread
        result = await run_in_threadpool(infer_tone_preset, features, notes)
        return result

    except AudioAnalysisError as exc:
        logger.warning(f"Audio analysis validation error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process audio file: {exc}",
        )
    except Exception as exc:
        logger.exception(f"Unexpected error during tone analysis: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while analyzing the audio file.",
        )


@router.post("/match-song", response_model=TonePresetResponse)
async def match_tone_by_song(payload: SongMatchRequest) -> TonePresetResponse:
    """Generate tone preset for a given song title matched against the user's rig profile."""
    if not payload.song_title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Song title cannot be empty.",
        )

    try:
        # Offload synchronous fallback chain execution to worker thread
        preset = await run_in_threadpool(generate_preset_from_song, payload)
        return preset

    except RuntimeError as exc:
        logger.warning(f"AI service temporarily unavailable: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service is temporarily unavailable due to high demand. Please try again later.",
        )
    except Exception as exc:
        logger.exception(f"Unexpected error during tone preset matching: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compute tone preset. Please check input parameters or try again later.",
        )