from builtins import RuntimeError
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.schemas.tone import ToneAnalysisResponse
from app.schemas.tone import TonePresetResponse
from app.schemas.tone import SongMatchRequest
from app.services.audio_analyzer import AudioAnalyzer
from app.services.ai_engine import infer_tone_preset
from app.services.tone_engine import generate_preset_from_song

from app.services.audio_analyzer import AudioAnalyzer

router = APIRouter()

ALLOWED_EXTENSIONS = {"wav", "mp3", "flac", "ogg", "m4a"}

@router.post("/analyze", response_model=ToneAnalysisResponse)
async def analyze_tone(
    file: UploadFile = File(...),
    notes: str | None = Form(None)
):
    extension = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File format not supported. Supported formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file.")

    try:
        # Extract DSP feature
        features = AudioAnalyzer.extract_features(contents)

        # AI
        result = infer_tone_preset(features, notes)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Exception during elaboration: {str(e)}")

@router.post("/match-song", response_model=TonePresetResponse)
async def match_tone_by_song(payload: SongMatchRequest):
    if not payload.song_title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Song title cannot be empty."
        )
    try:
        preset = generate_preset_from_song(payload)
        return preset
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service is temporarily unavailable for high traffic. Try again later."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute tone preset: {str(e)}"
        )