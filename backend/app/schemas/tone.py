from pydantic import BaseModel, Field
from typing import List, Optional

class AmpSettings(BaseModel):
    amp_model: str = Field(description="Ex. Fender Twin Reverb, Marshall JCM800, Voc AC30")
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
    pedals: List[PedalSetting] = []
    tips: List[str] = []