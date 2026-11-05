import io
import librosa
import numpy as np

class AudioAnalyzer:
    @staticmethod
    def extract_features(file_bytes: bytes) -> dict:
        # Load the first 30 seconds at 22,050 Hz
        y, sr = librosa.load(io.BytesIO(file_bytes), sr=22050, duration=30.0)

        # RMS Energy (dynamic)
        rms = librosa.feature.rms(y=y)[0]
        dynamic_range_db = float(np.max(librosa.amplitude_to_db(rms, ref=np.max)) - np.min(librosa.amplitude_to_db(rms, ref=np.max)))

        # Spectral Centroid
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        mean_centroid = float(np.mean(centroid))

        # Spectral Rolloff
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        mean_rolloff = float(np.mean(rolloff))

        # Zero Crossing Rate
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        mean_zcr = float(np.mean(zcr))

        # Harmonic vs percussive components
        y_harmonic, _ = librosa.effects.hpss(y)
        harmonic_ratio = float(np.sum(y_harmonic**2) / (np.sum(y**2) + 1e-9))

        return {
            "mean_spectral_centroid_hz": round(mean_centroid, 2),
            "mean_spectral_rolloff_hz": round(mean_rolloff, 2),
            "zero_crossing_rate": round(mean_zcr, 4),
            "harmonic_energy§_ratio": round(harmonic_ratio, 3),
            "dynamic_range_db": round(dynamic_range_db, 2)
        }