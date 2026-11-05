// noinspection D

import React, {useState} from "react";
import type {ToneAnalysisResponse} from "./types/toneAnalysisResponse.ts";
import {AlertCircle, Music, Sparkles} from "lucide-react";
import {AmpHead} from "./components/AmpHead.tsx";
import {Pedalboard} from "./components/Pedalboard.tsx";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToneAnalysisResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (notes.trim()) {
      formData.append('notes', notes);
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/tone/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data: ToneAnalysisResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Error during analysis of tune')
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="min-h-screen bg-zinc-950 px-4 py-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-zinc-800 pb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Music className="w-7 h-7 text-amber-500" />
              AUTOTONER
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Audio Feature Extraction & Tone Matching AI Engine
            </p>
          </div>
        </header>

        {/* Upload section */}
        <form onSubmit={handleAnalyze} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Guitar Audio Track (WAV, MP3, FLAC)
            </label>
            <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Note or Context (Optional, ex. type of guitar or pickup used)
            </label>
            <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex. Fender Stratocaster single-coil bridge"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
              type="submit"
              disabled={!file || loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition"
          >
            {loading ? (
                <>Spectral analysis and preset calculating...</>
            ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extract Tone and Configure Setup
                </>
            )}
          </button>
        </form>

        {error && (
            <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl flex items-center gap-3 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
        )}

        {/* Result */}
        {result && (
            <div className="space-y-6 pt-4 animate-in fade-in duration-300">
              <div className="flex flex-wrap gap-3 items-center justify-between border-b border-zinc-800/80 pb-4">
                <div>
                  <span className="text-xs text-zinc-500 uppercase font-mono">Detected Genre</span>
                  <p className="text-lg font-bold text-amber-400">{result.detected_genre}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase font-mono">Tone</span>
                  <p className="text-sm font-medium text-zinc-300">{result.tone_character}</p>
                </div>
              </div>

              <AmpHead settings={result.amp} />
              <Pedalboard pedals={result.pedals} />

              {result.tips?.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Regulation Tips
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
                      {result.tips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
              )}
            </div>
        )}
      </div>
  );
}