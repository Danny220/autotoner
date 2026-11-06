import io
import wave
import numpy as np
import pytest
from app.services.audio_analyzer import AudioAnalyzer


def _generate_wav(duration: float = 0.5, sample_rate: int = 22050, freq: float = 440.0) -> bytes:
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    # Sine wave scaled to 16-bit integer range
    audio = (np.sin(2 * np.pi * freq * t) * 20000).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio.tobytes())
    return buf.getvalue()


def test_extract_features_valid_wav():
    wav_bytes = _generate_wav()
    features = AudioAnalyzer.extract_features(wav_bytes)

    assert "mean_spectral_centroid_hz" in features
    assert "mean_spectral_rolloff_hz" in features
    assert "zero_crossing_rate" in features
    assert "harmonic_energy_ratio" in features or "harmonic_energy§_ratio" in features
    assert "dynamic_range_db" in features
    assert isinstance(features["mean_spectral_centroid_hz"], (float, int))


def test_extract_features_silent_audio():
    silence = np.zeros(22050, dtype=np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(22050)
        wf.writeframes(silence.tobytes())
    wav_bytes = buf.getvalue()

    features = AudioAnalyzer.extract_features(wav_bytes)
    assert not np.isnan(features["dynamic_range_db"])
    assert not np.isinf(features["dynamic_range_db"])


def test_extract_features_invalid_bytes():
    with pytest.raises(Exception):
        AudioAnalyzer.extract_features(b"corrupted-non-audio-bytes")
