import React, { useState, useEffect } from 'react';
import {
  Guitar,
  Sliders,
  Music,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Power,
} from 'lucide-react';
import {
  DEFAULT_RIG,
  DEFAULT_SETTINGS,
  type AppSettings,
  type TonePresetResponse,
  type UserPedal,
  type UserRig,
} from './types';
import { matchSongTone, ApiError } from './services/api';
import { loadFromStorage, saveToStorage } from './utils/storage';
import { Knob } from './components/Knob';

const STORAGE_KEYS = {
  RIG: 'autotoner_rig',
  SETTINGS: 'autotoner_settings',
} as const;

type ActiveTab = 'match' | 'rig' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('match');
  const [rig, setRig] = useState<UserRig>(() =>
    loadFromStorage(STORAGE_KEYS.RIG, DEFAULT_RIG)
  );

  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<TonePresetResponse | null>(null);

  const [appSettings, setAppSettings] = useState<AppSettings>(() =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RIG, rig);
  }, [rig]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, appSettings);
  }, [appSettings]);

  const handleMatch = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = songTitle.trim();
    if (!trimmedTitle) return;

    setLoading(true);
    setError(null);

    try {
      const data = await matchSongTone({
        song_title: trimmedTitle,
        artist: artist.trim() || undefined,
        additional_notes: notes.trim() || undefined,
        user_rig: rig,
        ai_model_chain: appSettings.ai_model_chain,
      });
      setPreset(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to match tone preset.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPedal = () => {
    const newPedal: UserPedal = {
      id: `pedal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: 'New Pedal',
      type: 'Overdrive',
      controls: [
        { name: 'Level', min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
      ],
    };
    setRig((prev) => ({ ...prev, pedals: [...prev.pedals, newPedal] }));
  };

  const handleDeletePedal = (pedalId: string) => {
    setRig((prev) => ({
      ...prev,
      pedals: prev.pedals.filter((p) => p.id !== pedalId),
    }));
  };

  const handleUpdatePedalName = (pedalId: string, name: string) => {
    setRig((prev) => ({
      ...prev,
      pedals: prev.pedals.map((p) => (p.id === pedalId ? { ...p, name } : p)),
    }));
  };

  const handleUpdatePedalKnobs = (pedalId: string, knobNamesString: string) => {
    const names = knobNamesString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setRig((prev) => ({
      ...prev,
      pedals: prev.pedals.map((p) =>
        p.id === pedalId
          ? {
              ...p,
              controls: names.map((n) => ({
                name: n,
                min_value: 0,
                max_value: 10,
                step: 0.5,
                default_value: 5,
              })),
            }
          : p
      ),
    }));
  };

  const handleUpdateAmpKnobs = (knobNamesString: string) => {
    const names = knobNamesString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setRig((prev) => ({
      ...prev,
      amp: {
        ...prev.amp,
        controls: names.map((n) => ({
          name: n,
          min_value: 0,
          max_value: 10,
          step: 0.5,
          default_value: 5,
        })),
      },
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8 max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Music className="w-7 h-7 text-amber-500" />
            AUTOTONER
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            AI-Powered Guitar Tone Matching Tailored to Your Rig
          </p>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('match')}
            className={`px-4 py-1.5 rounded-md transition ${
              activeTab === 'match'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Match Song
          </button>
          <button
            onClick={() => setActiveTab('rig')}
            className={`px-4 py-1.5 rounded-md transition ${
              activeTab === 'rig'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            My Rig Profile
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Settings
          </button>
        </div>
      </header>

      {/* Tab: Song Match */}
      {activeTab === 'match' && (
        <div className="space-y-6">
          <form
            onSubmit={handleMatch}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Song Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master of Puppets, Comfortably Numb"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Artist / Band (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Metallica, Pink Floyd"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Specific Solo, Tuning or Sound Preference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Outro solo tone, drop D tuning, live Pompeii version"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition"
            >
              {loading ? (
                <span>Synthesizing tone parameters...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Rig Preset
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

          {/* Preset Display */}
          {preset && (
            <div className="space-y-6 pt-2 animate-in fade-in duration-300">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-800 pb-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {preset.song_title}{' '}
                      <span className="text-zinc-500 font-normal">by</span>{' '}
                      {preset.artist}
                    </h2>
                    <p className="text-xs text-amber-400 font-mono mt-0.5">
                      {preset.target_sound_summary}
                    </p>
                  </div>
                </div>

                {/* Guitar Config */}
                <div className="mt-4 pt-2">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Guitar className="w-4 h-4 text-amber-500" />
                    <span>Guitar Configuration</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    {Object.entries(preset.guitar_settings).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-zinc-500 capitalize">
                          {key.replace('_', ' ')}:{' '}
                        </span>
                        <span className="text-zinc-200 font-medium">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Amp Head Display */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-zinc-950 px-5 py-3 border-b border-zinc-800 flex justify-between items-center">
                  <div className="font-bold text-sm tracking-widest uppercase text-zinc-300">
                    {rig.amp.model}
                    {preset.amp_channel && (
                      <span className="ml-2 text-xs text-amber-500 font-normal">
                        ({preset.amp_channel})
                      </span>
                    )}
                  </div>
                  <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.9)] animate-pulse" />
                </div>
                <div className="p-6 flex flex-wrap justify-around gap-4 bg-gradient-to-r from-zinc-900 via-neutral-900 to-zinc-900">
                  {preset.amp_knobs.map((knob) => (
                    <Knob
                      key={knob.name}
                      label={knob.name}
                      value={knob.target_value}
                      readOnly
                    />
                  ))}
                </div>
              </div>

              {/* Pedals Display */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span>Pedalboard Chain</span>
                </div>
                <div className="flex items-center gap-4 overflow-x-auto pb-3">
                  {preset.pedals.map((pedal, pedalIdx) => (
                    <div
                      key={`${pedal.name}-${pedal.signal_position}-${pedalIdx}`}
                      className={`min-w-[190px] p-4 rounded-xl border bg-zinc-900 shadow-md ${
                        pedal.is_active
                          ? 'border-amber-500/60'
                          : 'border-zinc-800 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                          {pedal.type}
                        </span>
                        <Power
                          className={`w-3.5 h-3.5 ${
                            pedal.is_active ? 'text-amber-400' : 'text-zinc-600'
                          }`}
                        />
                      </div>
                      <h4 className="font-bold text-sm text-zinc-200 mt-1 truncate">
                        {pedal.name}
                      </h4>
                      <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1.5">
                        {pedal.knob_settings.map((k) => (
                          <div key={k.name} className="flex justify-between text-xs">
                            <span className="text-zinc-400">{k.name}</span>
                            <span className="font-mono text-zinc-200 font-semibold">
                              {k.target_value.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips & Techniques */}
              {preset.key_techniques_and_tips &&
                preset.key_techniques_and_tips.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Playing Tips & Rig Nuances
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
                      {preset.key_techniques_and_tips.map((tip, idx) => (
                        <li key={`${idx}-${tip.slice(0, 16)}`}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Tab: My Rig Profile */}
      {activeTab === 'rig' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Your Equipment Profile</h2>
            <p className="text-xs text-zinc-400">
              Autotoner restricts and calculates tone settings strictly based on the knobs and capabilities of this gear.
            </p>
          </div>

          {/* Guitar */}
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Guitar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Guitar Model</label>
                <input
                  type="text"
                  value={rig.guitar.model}
                  onChange={(e) =>
                    setRig((prev) => ({
                      ...prev,
                      guitar: { ...prev.guitar, model: e.target.value },
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Pickups / Config
                </label>
                <input
                  type="text"
                  value={rig.guitar.pickup_type}
                  onChange={(e) =>
                    setRig((prev) => ({
                      ...prev,
                      guitar: { ...prev.guitar, pickup_type: e.target.value },
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Amp */}
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Amplifier
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Amp Model</label>
                <input
                  type="text"
                  value={rig.amp.model}
                  onChange={(e) =>
                    setRig((prev) => ({
                      ...prev,
                      amp: { ...prev.amp, model: e.target.value },
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Channels / Notes
                </label>
                <input
                  type="text"
                  value={rig.amp.channel_or_preset || ''}
                  onChange={(e) =>
                    setRig((prev) => ({
                      ...prev,
                      amp: { ...prev.amp, channel_or_preset: e.target.value },
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Available Amp Knobs (comma separated)
              </label>
              <input
                type="text"
                value={rig.amp.controls.map((c) => c.name).join(', ')}
                onChange={(e) => handleUpdateAmpKnobs(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono"
              />
            </div>
          </div>

          {/* Pedals */}
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                Pedals
              </h3>
              <button
                type="button"
                onClick={handleAddPedal}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Pedal
              </button>
            </div>

            <div className="space-y-3">
              {rig.pedals.map((pedal) => (
                <div
                  key={pedal.id}
                  className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={pedal.name}
                      onChange={(e) => handleUpdatePedalName(pedal.id, e.target.value)}
                      className="bg-transparent border-b border-zinc-700 text-sm font-semibold text-white focus:outline-none focus:border-amber-500 px-1 py-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePedal(pedal.id)}
                      className="text-zinc-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1">
                      Knobs (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={pedal.controls.map((c) => c.name).join(', ')}
                      onChange={(e) => handleUpdatePedalKnobs(pedal.id, e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              Application Settings
            </h2>
            <p className="text-xs text-zinc-400">
              Configure the AI models and fallback order. Autotoner will try the first model and fallback to the next ones if the API is overloaded.
            </p>
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              AI Model Fallback Chain
            </h3>
            <div>
              <label className="block text-xs text-zinc-400 mb-2">
                Models (comma-separated, in order of priority)
              </label>
              <input
                type="text"
                value={appSettings.ai_model_chain.join(', ')}
                onChange={(e) => {
                  const models = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setAppSettings({ ...appSettings, ai_model_chain: models });
                }}
                placeholder="gemini-3.8-flash, gemini-3.8-flash-lite, gemini-2.5-pro"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-zinc-500 mt-2">
                Recommended:{' '}
                <span className="font-mono text-zinc-400">
                  gemini-3.8-flash, gemini-3.8-flash-lite
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}