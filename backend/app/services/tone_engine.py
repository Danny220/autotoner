import json
import logging
import random
import time
from builtins import Exception, range, RuntimeError
from google import genai
from google.genai import types
from app.schemas.tone import SongMatchRequest, TonePresetResponse
from app.core.config import settings
from pydantic import BaseModel

logger = logging.getLogger("autotoner.tone_engine")

client = genai.Client(api_key=settings.GEMINI_API_KEY)

CANDIDATE_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.8-flash-lite"
]

SYSTEM_PROMPT = """You are an elite guitar technician, audio engineer, and gear historian.
Your mission is to accurately replicate the guitar tone of a specific song using STRICTLY and ONLY the gear that the guitarist owns (their amp, guitar pickups, and available pedals).

Rules:
1. Match the exact controls (knobs) defined on the user's amp and pedals. Do not invent knobs that don't exist in their rig.
2. If the user's rig lacks a critical effect present in the original track (e.g. fuzz or phaser), select the closest alternative with their gear and add a note in tips.
3. Determine the optimal pickup selector position (Bridge, Middle, Neck, Split) based on the user's guitar.
4. Output strict JSON conforming to the schema.
"""

def _execute_generation(model_name: str, prompt: str) -> TonePresetResponse:
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=TonePresetResponse,
            temperature=0.1,
        ),
    )
    return TonePresetResponse.model_validate_json(response.text)

def generate_preset_from_song(request: SongMatchRequest, max_retries_per_model: int = 3) -> TonePresetResponse:
    prompt = f"""Target Song: "{request.song_title}" by {request.artist or 'Unknown Artist'}
User Context/Notes: {request.additional_notes or 'None'}

User Gear Profile:
{request.user_rig.model_dump_json(indent=2)}

Calculate the exact settings to dial in to match this record as closely as possible."""

    last_error: Exception | None = None

    for model_name in CANDIDATE_MODELS:
        for attempt in range(1, max_retries_per_model + 1):
            try:
                logger.info(
                    f"Invoking {model_name} (attempt {attempt}/{max_retries_per_model})..."
                )
                return _execute_generation(model_name, prompt)

            except APIError as e:
                last_error = e
                # Intercept temporary errors
                if e.code in (503, 429) or "high demand" in str(e).lower():
                    if attempt < max_retries_per_model:
                        sleep_time = (1.5**attempt) + random.uniform(0.1, 0.6)
                        logger.warning(
                            f"Model {model_name} returned {e.code}. Retrying in {sleep_time:.2f} seconds..."
                        )
                        time.sleep(sleep_time)
                        continue
                    else:
                        logger.warning(
                            f"Model {model_name} returned {e.code} after {max_retries_per_model} attempts. All attempts exhausted. Trying next candidate model..."
                        )
                        break

                raise e # if error is not temporary or max retries reached

            except Exception as e:
                last_error = e
                logger.error(
                    f"Unexpected error with {model_name} on attempt {attempt}: {str(e)}"
                )
                if attempt < max_retries_per_model:
                    time.sleep(1.0)
                    continue
                break

    raise RuntimeError(f"Failed to generate content after {max_retries_per_model} attempts. Last error: {str(last_error)}")