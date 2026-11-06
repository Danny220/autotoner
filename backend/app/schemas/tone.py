from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.core.config import settings


class AmpSettings(BaseModel):
    amp_model: str = Field(description="Ex. Fender Twin Reverb, Marshall JCM800, Vox AC30")
    gain: float = Field(ge=0.0, le=10.0, description="Level of gain from 0 to 10")
    bass: float = Field(ge=0.0, le=10.0)
    middle: float = Field(ge=0.0, le=10.0)
    treble: float = Field(ge=0.0, le=10.0)
    presence: Optional[float] = Field(default=5.0, ge=0.0, le=10.0)
    master_volume: Optional[float] = Field(default=5.0, ge=0.0, le=10.0)


class PedalSetting(BaseModel):
    name: str = Field(description="Name or type of pedal. Ex. Tube Screamer, Boss DD-3")
    type: str = Field(description="Overdrive, Distortion, Delay, Reverb, Modulation, EQ")
    settings: dict[str, str | float] = Field(description="Key parameters, ex. {'Drive': 6.5, 'Tone': 5.0}")


class ToneAnalysisResponse(BaseModel):
    detected_genre: str
    tone_character: str = Field(description="Brief description of the tone character (ex. 'Bright Vintage Crunch')")
    amp: AmpSettings
    pedals: list[PedalSetting] = Field(default_factory=list)
    tips: list[str] = Field(default_factory=list)


# --- User Rig Specification ---

class GearKnob(BaseModel):
    name: str = Field(description="Knob label, e.g. 'Gain', 'Speed', 'Tone'")
    min_value: float = 0.0
    max_value: float = 10.0
    step: float = 0.5
    default_value: float = 5.0


class UserPedal(BaseModel):
    id: str
    name: str = Field(description="e.g. 'Ibanez TS9', 'Boss DD-7'")
    type: str = Field(description="Overdrive, Delay, Reverb, Fuzz, Chorus, etc.")
    controls: list[GearKnob] = Field(default_factory=list)


class UserAmp(BaseModel):
    model: str = Field(description="e.g. 'Fender Mustang LT25', 'Marshall DSL40CR'")
    channel_or_preset: Optional[str] = Field(default=None, description="Active channel or amp model preset")
    controls: list[GearKnob] = Field(default_factory=list)


class UserGuitar(BaseModel):
    model: str = Field(description="e.g. 'Squier Stratocaster Affinity HSS'")
    pickup_type: str = Field(description="e.g. 'Single-coil neck', 'Bridge Humbucker'")


class UserRig(BaseModel):
    guitar: UserGuitar
    amp: UserAmp
    pedals: list[UserPedal] = Field(default_factory=list)


# --- Request & Tone Preset Response ---

class SongMatchRequest(BaseModel):
    song_title: str
    artist: Optional[str] = None
    additional_notes: Optional[str] = None
    user_rig: UserRig
    ai_model_chain: list[str] = Field(
        default_factory=lambda: list(settings.DEFAULT_AI_MODELS),
        description="Ordered list of Gemini models to try (fallback mechanism)"
    )

    @field_validator("ai_model_chain")
    @classmethod
    def validate_ai_model_chain(cls, v: list[str]) -> list[str]:
        cleaned = [m.strip() for m in v if m.strip()]
        return cleaned if cleaned else list(settings.DEFAULT_AI_MODELS)


class ConfiguredKnob(BaseModel):
    name: str
    target_value: float


class ConfiguredPedal(BaseModel):
    name: str
    type: str
    is_active: bool
    knob_settings: list[ConfiguredKnob]
    signal_position: int


class GuitarSettings(BaseModel):
    pickup_selector: str = Field(description="e.g. 'Bridge Humbucker', 'Neck Single-Coil', 'Position 4 (Neck + Middle)'")
    volume_pot: float = Field(default=10.0, description="Volume knob from 0 to 10")
    tone_pot: float = Field(default=10.0, description="Tone knob from 0 to 10")
    notes: Optional[str] = Field(default=None, description="Coil-split or tone roll-off notes")


class TonePresetResponse(BaseModel):
    song_title: str
    artist: str
    target_sound_summary: str = Field(description="Brief breakdown of the original tone and guitar used")
    guitar_settings: GuitarSettings
    amp_channel: Optional[str] = None
    amp_knobs: list[ConfiguredKnob]
    pedals: list[ConfiguredPedal]
    key_techniques_and_tips: list[str]