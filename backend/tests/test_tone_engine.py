from unittest.mock import patch, MagicMock
import pytest
from app.schemas.tone import (
    SongMatchRequest,
    UserRig,
    UserGuitar,
    UserAmp,
    GearKnob,
    TonePresetResponse,
)
from app.services.tone_engine import generate_preset_from_song


@pytest.fixture
def sample_request() -> SongMatchRequest:
    return SongMatchRequest(
        song_title="Black Dog",
        artist="Led Zeppelin",
        user_rig=UserRig(
            guitar=UserGuitar(model="Gibson Les Paul", pickup_type="Humbuckers"),
            amp=UserAmp(
                model="Marshall Plexi",
                controls=[
                    GearKnob(name="Gain", default_value=6.0),
                    GearKnob(name="Treble", default_value=7.0),
                ],
            ),
            pedals=[],
        ),
        ai_model_chain=["gemini-3.8-flash", "gemini-3.8-flash-lite"],
    )


@pytest.fixture
def mock_preset_response_json() -> str:
    return """{
        "song_title": "Black Dog",
        "artist": "Led Zeppelin",
        "target_sound_summary": "Direct-to-board compression crunch",
        "guitar_settings": {
            "pickup_selector": "Bridge Humbucker",
            "volume_pot": 10.0,
            "tone_pot": 8.0
        },
        "amp_channel": "Lead",
        "amp_knobs": [{"name": "Gain", "target_value": 7.5}],
        "pedals": [],
        "key_techniques_and_tips": ["Pick hard near the bridge"]
    }"""


def test_generate_preset_first_model_success(sample_request, mock_preset_response_json):
    mock_resp = MagicMock()
    mock_resp.text = mock_preset_response_json

    with patch("app.services.tone_engine._execute_generation") as mock_exec:
        mock_exec.return_value = TonePresetResponse.model_validate_json(mock_preset_response_json)
        preset = generate_preset_from_song(sample_request)

        assert preset.song_title == "Black Dog"
        assert preset.artist == "Led Zeppelin"
        assert mock_exec.call_count == 1
        assert mock_exec.call_args[0][0] == "gemini-3.8-flash"


def test_generate_preset_fallback_to_second_model(sample_request, mock_preset_response_json):
    from google.genai import errors

    mock_resp = MagicMock()
    mock_resp.text = mock_preset_response_json

    call_count = 0

    def side_effect(model_name, prompt):
        nonlocal call_count
        call_count += 1
        if model_name == "gemini-3.8-flash":
            # Simulate a 503 high demand error
            raise errors.APIError(503, "High demand / overloaded", None)
        return TonePresetResponse.model_validate_json(mock_preset_response_json)

    with patch("app.services.tone_engine._execute_generation", side_effect=side_effect), \
         patch("time.sleep"):  # Mock sleep so tests run instantly
        preset = generate_preset_from_song(sample_request, max_retries_per_model=2)

        assert preset.song_title == "Black Dog"
        # Should have tried flash twice, then flash-lite once
        assert call_count == 3


def test_generate_preset_all_models_fail(sample_request):
    from google.genai import errors

    with patch("app.services.tone_engine._execute_generation") as mock_exec, \
         patch("time.sleep"):
        mock_exec.side_effect = errors.APIError(503, "Overloaded", None)

        with pytest.raises(RuntimeError) as exc_info:
            generate_preset_from_song(sample_request, max_retries_per_model=1)

        assert "All models in the chain" in str(exc_info.value)


def test_generate_preset_empty_chain_uses_default_models(sample_request, mock_preset_response_json):
    from app.core.config import settings

    sample_request.ai_model_chain = []
    with patch("app.services.tone_engine._execute_generation") as mock_exec:
        mock_exec.return_value = TonePresetResponse.model_validate_json(mock_preset_response_json)
        preset = generate_preset_from_song(sample_request)
        assert preset.song_title == "Black Dog"
        assert mock_exec.call_args[0][0] in settings.DEFAULT_AI_MODELS

