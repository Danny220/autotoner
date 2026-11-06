import logging
import random
import time
from google.genai import errors, types
from app.schemas.tone import SongMatchRequest, TonePresetResponse
from app.services.gemini_client import get_gemini_client
from app.core.config import settings

logger = logging.getLogger("autotoner.tone_engine")

SYSTEM_PROMPT = """You are an elite guitar technician, audio engineer, and gear historian.
Your mission is to accurately replicate the guitar tone of a specific song using STRICTLY and ONLY the gear that the guitarist owns (their amp, guitar pickups, and available pedals).

Rules:
1. Match the exact controls (knobs) defined on the user's amp and pedals. Do not invent knobs that don't exist in their rig.
2. If the user's rig lacks a critical effect present in the original track (e.g. fuzz or phaser), select the closest alternative with their gear and add a note in tips.
3. Determine the optimal pickup selector position (Bridge, Middle, Neck, Split) based on the user's guitar.
4. Output strict JSON conforming to the schema.
"""


def _build_prompt(request: SongMatchRequest) -> str:
    """Build the prompt describing the target song and user gear profile."""
    artist_display = request.artist or "Unknown Artist"
    notes_display = request.additional_notes or "None"
    rig_json = request.user_rig.model_dump_json(indent=2)

    return (
        f'Target Song: "{request.song_title}" by {artist_display}\n'
        f"User Context/Notes: {notes_display}\n\n"
        f"User Gear Profile:\n{rig_json}\n\n"
        "Calculate the exact settings to dial in to match this record as closely as possible."
    )


def _execute_generation(model_name: str, prompt: str) -> TonePresetResponse:
    """Execute content generation with a specific Gemini model."""
    client = get_gemini_client()
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

    if not response or not response.text:
        raise RuntimeError(f"Model {model_name} returned an empty response or was filtered.")

    return TonePresetResponse.model_validate_json(response.text)


def generate_preset_from_song(
    request: SongMatchRequest,
    max_retries_per_model: int = 3,
) -> TonePresetResponse:
    """Generate tone preset from song title and rig profile using a fallback chain of models."""
    prompt = _build_prompt(request)
    candidate_models = request.ai_model_chain or list(settings.DEFAULT_AI_MODELS)
    last_error: Exception | None = None

    for model_name in candidate_models:
        for attempt in range(1, max_retries_per_model + 1):
            try:
                logger.info(
                    f"Invoking {model_name} (attempt {attempt}/{max_retries_per_model})..."
                )
                return _execute_generation(model_name, prompt)

            except errors.APIError as exc:
                last_error = exc
                # Intercept temporary rate-limiting or high-demand errors
                is_rate_limit = exc.code in (429, 503) or "high demand" in str(exc).lower()
                if is_rate_limit:
                    if attempt < max_retries_per_model:
                        backoff = (1.5**attempt) + random.uniform(0.1, 0.5)
                        logger.warning(
                            f"Model {model_name} returned {exc.code}. Retrying in {backoff:.2f}s..."
                        )
                        time.sleep(backoff)
                        continue
                    logger.warning(
                        f"Model {model_name} exhausted all {max_retries_per_model} attempts. Trying next model..."
                    )
                    break

                logger.error(f"Permanent API Error with {model_name}: {exc}")
                break

            except Exception as exc:
                last_error = exc
                logger.error(
                    f"Unexpected error with {model_name} on attempt {attempt}: {exc}"
                )
                break

    model_chain_str = ", ".join(candidate_models)
    raise RuntimeError(
        f"All models in the chain ({model_chain_str}) failed. Last error: {last_error}"
    )