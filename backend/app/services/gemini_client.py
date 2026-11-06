import logging
from google import genai
from app.core.config import settings

logger = logging.getLogger("autotoner.gemini_client")

_client: genai.Client | None = None


def get_gemini_client() -> genai.Client:
    """Return a lazily initialized GenAI client instance.
    
    Ensures deterministic initialization and easy override in test environments.
    """
    global _client
    if _client is None:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY is not configured in environment or settings.")
        _client = genai.Client(api_key=api_key or None)
    return _client


def set_gemini_client(client: genai.Client | None) -> None:
    """Set or reset the GenAI client (useful for unit testing and mocks)."""
    global _client
    _client = client
