import pytest
from pydantic import ValidationError
from app.schemas.tone import (
    AmpSettings,
    PedalSetting,
    ToneAnalysisResponse,
    GearKnob,
    UserPedal,
    UserAmp,
    UserGuitar,
    UserRig,
    SongMatchRequest,
    ConfiguredKnob,
    ConfiguredPedal,
    GuitarSettings,
    TonePresetResponse,
)


def test_amp_settings_valid():
    amp = AmpSettings(
        amp_model="Fender Twin Reverb",
        gain=5.0,
        bass=6.0,
        middle=5.0,
        treble=7.0,
    )
    assert amp.amp_model == "Fender Twin Reverb"
    assert amp.gain == 5.0
    assert amp.presence == 5.0  # default
    assert amp.master_volume == 5.0  # default


def test_amp_settings_invalid_range():
    with pytest.raises(ValidationError):
        AmpSettings(
            amp_model="Marshall JCM800",
            gain=11.0,  # exceeds max 10.0
            bass=5.0,
            middle=5.0,
            treble=5.0,
        )


def test_song_match_request_defaults():
    rig = UserRig(
        guitar=UserGuitar(model="Fender Strat", pickup_type="SSS"),
        amp=UserAmp(model="Fender Deluxe", controls=[GearKnob(name="Gain")]),
        pedals=[
            UserPedal(
                id="pedal-1",
                name="TS9",
                type="Overdrive",
                controls=[GearKnob(name="Drive", default_value=5.0)],
            )
        ],
    )
    req = SongMatchRequest(song_title="Little Wing", user_rig=rig)
    assert req.song_title == "Little Wing"
    assert req.artist is None
    assert len(req.ai_model_chain) >= 1
    assert "gemini-3.8-flash" in req.ai_model_chain


def test_tone_preset_response_serialization():
    data = {
        "song_title": "Comfortably Numb",
        "artist": "Pink Floyd",
        "target_sound_summary": "Lush, sustain-rich Big Muff solo tone",
        "guitar_settings": {
            "pickup_selector": "Bridge Single-Coil",
            "volume_pot": 10.0,
            "tone_pot": 8.0,
        },
        "amp_channel": "Clean",
        "amp_knobs": [{"name": "Bass", "target_value": 6.0}],
        "pedals": [
            {
                "name": "Big Muff",
                "type": "Fuzz",
                "is_active": True,
                "knob_settings": [{"name": "Sustain", "target_value": 7.5}],
                "signal_position": 1,
            }
        ],
        "key_techniques_and_tips": ["Use vibrato on long sustained bends"],
    }
    response = TonePresetResponse.model_validate(data)
    assert response.song_title == "Comfortably Numb"
    assert response.pedals[0].is_active is True
    assert response.guitar_settings.volume_pot == 10.0
