import json
import logging
from google.genai import types
from app.schemas.tone import ToneAnalysisResponse
from app.services.gemini_client import get_gemini_client
from app.core.config import settings

logger = logging.getLogger("autotoner.ai_engine")

SYSTEM_PROMPT = """You are an expert audio engineer and professional guitarist. Your task is to analyze the acoustic data extracted from an audio file and deduce the ideal amplifier and guitar pedal setup (tone settings, circuit type, saturation, modulations) to faithfully replicate that tone."""


def infer_tone_preset(
    audio_features: dict[str, float],
    user_notes: str | None = None,
    model_name: str | None = None,
) -> ToneAnalysisResponse:
    """Infer amplifier and pedal settings from extracted acoustic features using Gemini."""
    client = get_gemini_client()
    selected_model = model_name or (settings.DEFAULT_AI_MODELS[0] if settings.DEFAULT_AI_MODELS else "gemini-3.8-flash")

    prompt = (
        f"Acoustic data extracted from the track: {json.dumps(audio_features, indent=2)}\n\n"
        f"Additional user notes (if provided): {user_notes or 'None'}\n\n"
        "Determine:\n"
        "1. Most consistent amplifier model (e.g., Marshall, Fender, Vox, Mesa Boogie, Soldano).\n"
        "2. EQ and Gain settings (from 0.0 to 10.0).\n"
        "3. Pedal chain (drive, delay, reverb, modulations with relative parameters).\n"
        "4. Practical playing suggestions or pickup settings."
    )

    logger.info(f"Inferring tone preset using model {selected_model}...")
    response = client.models.generate_content(
        model=selected_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=ToneAnalysisResponse,
            temperature=0.2,
        ),
    )

    if not response or not response.text:
        raise RuntimeError("Model response is empty or was blocked by safety filters.")

    return ToneAnalysisResponse.model_validate_json(response.text)