from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.schemas.tone import ToneAnalysisResponse
from app.services.audio_analyzer import AudioAnalyzer
from app.services.ai_engine import infer_tone_preset

from backend.app.services.audio_analyzer import AudioAnalyzer

router = APIRouter()

ALLOWED_EXTENSIONS = {"wav", "mp3", "flac", "ogg", "m4a"}

@router.post("/analyze", response_model=ToneAnalysisResponse)
async def analyze_tone(
    file: UploadFile = File(...),
    notes: str | None = Form(none)
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