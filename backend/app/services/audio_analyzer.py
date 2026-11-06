import io
import logging
import librosa
import numpy as np
from app.core.config import settings

logger = logging.getLogger("autotoner.audio_analyzer")


class AudioAnalysisError(Exception):
    """Raised when audio feature extraction fails due to invalid, corrupt, or unsupported audio data."""
    pass


class AudioAnalyzer:
    @staticmethod
    def extract_features(file_bytes: bytes) -> dict[str, float]:
        """Extract acoustic DSP features (spectral centroid, rolloff, zero-crossing rate,

        harmonic ratio, dynamic range) from raw audio bytes.

        Raises:
            AudioAnalysisError: If the audio bytes cannot be loaded or processed.
        """
        if not file_bytes or len(file_bytes) < 44:  # Minimum header size for standard WAV
            raise AudioAnalysisError("Audio data is empty or too short to decode.")

        try:
            # Load up to configured duration at standard 22,050 Hz sampling rate
            y, sr = librosa.load(
                io.BytesIO(file_bytes),
                sr=22050,
                duration=settings.AUDIO_ANALYSIS_DURATION_SECONDS,
            )
        except Exception as exc:
            logger.error(f"Failed to decode audio bytes with librosa: {exc}")
            raise AudioAnalysisError(f"Could not decode audio: {exc}") from exc

        if y is None or len(y) == 0:
            raise AudioAnalysisError("Decoded audio signal is empty.")

        # RMS Energy & Dynamic Range
        rms = librosa.feature.rms(y=y)[0]
        db_rms = librosa.amplitude_to_db(rms, ref=np.max)
        if len(db_rms) > 0 and np.all(np.isfinite(db_rms)):
            dynamic_range_db = float(np.max(db_rms) - np.min(db_rms))
        else:
            dynamic_range_db = 0.0

        # Spectral Centroid
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        mean_centroid = float(np.nanmean(centroid)) if len(centroid) > 0 else 0.0

        # Spectral Rolloff
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        mean_rolloff = float(np.nanmean(rolloff)) if len(rolloff) > 0 else 0.0

        # Zero Crossing Rate
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        mean_zcr = float(np.nanmean(zcr)) if len(zcr) > 0 else 0.0

        # Harmonic vs percussive components
        total_energy = float(np.sum(y**2))
        if total_energy > 1e-9:
            y_harmonic, _ = librosa.effects.hpss(y)
            harmonic_ratio = float(np.sum(y_harmonic**2) / (total_energy + 1e-9))
        else:
            harmonic_ratio = 0.0

        rounded_harmonic_ratio = round(harmonic_ratio, 3)

        return {
            "mean_spectral_centroid_hz": round(mean_centroid, 2),
            "mean_spectral_rolloff_hz": round(mean_rolloff, 2),
            "zero_crossing_rate": round(mean_zcr, 4),
            # Standardized clean key
            "harmonic_energy_ratio": rounded_harmonic_ratio,
            # Preserved for backward compatibility if any legacy consumer looks for it
            "harmonic_energy§_ratio": rounded_harmonic_ratio,
            "dynamic_range_db": round(dynamic_range_db, 2),
        }