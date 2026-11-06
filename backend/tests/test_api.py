import io
import wave
import numpy as np
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.tone import TonePresetResponse
from app.core.config import settings

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "1.0.0"}


def test_match_song_empty_title():
    payload = {
        "song_title": "   ",
        "user_rig": {
            "guitar": {"model": "Strat", "pickup_type": "SSS"},
            "amp": {"model": "Deluxe", "controls": []},
            "pedals": [],
        },
    }
    response = client.post("/api/v1/tone/match-song", json=payload)
    assert response.status_code == 400
    assert "Song title cannot be empty" in response.json()["detail"]


def test_match_song_success():
    payload = {
        "song_title": "Sultans of Swing",
        "artist": "Dire Straits",
        "user_rig": {
            "guitar": {"model": "Stratocaster", "pickup_type": "Single-coil"},
            "amp": {"model": "Twin Reverb", "controls": []},
            "pedals": [],
        },
    }
    mock_preset = TonePresetResponse(
        song_title="Sultans of Swing",
        artist="Dire Straits",
        target_sound_summary="Clean, snappy out-of-phase Strat tone",
        guitar_settings={
            "pickup_selector": "Position 2 (Bridge + Middle)",
            "volume_pot": 10.0,
            "tone_pot": 9.0,
        },
        amp_knobs=[],
        pedals=[],
        key_techniques_and_tips=["Fingerpicking technique"],
    )

    with patch("app.api.v1.endpoints.tone.generate_preset_from_song", return_value=mock_preset):
        response = client.post("/api/v1/tone/match-song", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["song_title"] == "Sultans of Swing"
        assert data["artist"] == "Dire Straits"


def test_analyze_unsupported_file_format():
    files = {"file": ("test.txt", b"plain text", "text/plain")}
    response = client.post("/api/v1/tone/analyze", files=files)
    assert response.status_code == 400
    assert "File format not supported" in response.json()["detail"]


def test_analyze_empty_file():
    files = {"file": ("test.wav", b"", "audio/wav")}
    response = client.post("/api/v1/tone/analyze", files=files)
    assert response.status_code == 400
    assert "Empty file" in response.json()["detail"]


def test_analyze_file_too_large():
    # Construct a payload exceeding configured limit
    large_size = settings.MAX_AUDIO_UPLOAD_BYTES + 1024
    fake_large_audio = b"\x00" * large_size
    files = {"file": ("large_sample.wav", fake_large_audio, "audio/wav")}
    response = client.post("/api/v1/tone/analyze", files=files)
    assert response.status_code == 413
    assert "exceeds maximum allowed size" in response.json()["detail"]
