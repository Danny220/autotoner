import json
from google import genai
from google.genai import types
from app.schemas.tone import ToneAnalysisResponse
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """You are an expert audio engineer and professional guitarist. Your task is to analyze the acoustic data extracted from an audio file and deduce the ideal amplifier and guitar pedal setup (tone settings, circuit type, saturation, modulations) to faithfully replicate that tone."""

def infer_tone_preset(audio_features: dict, user_notes: str | None = None) -> ToneAnalysisResponse:
    prompt = f"""Acoustic data extracted from the track: {json.dumps(audio_features, indent=2)}

Additional user notes (if provided): {user_notes or 'None'}

Determine:

1. Most consistent amplifier model (e.g., Marshall, Fender, Vox, Mesa Boogie, Soldano).
2. EQ and Gain settings (from 0.0 to 10.0).
3. Pedal chain (drive, delay, reverb, modulations with relative parameters).
4. Practical playing suggestions or pickup settings."""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=ToneAnalysisResponse,
            temperature=0.2
        )
    )

    return ToneAnalysisResponse.model_validate_json(response.text)