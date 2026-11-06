import React, { useState, useEffect } from 'react';
import { Guitar, Sliders, Music, Sparkles, AlertCircle, Plus, Trash2, Power } from 'lucide-react';
import type {GuitarSettings} from "./types/guitarSettings.ts";

interface KnobDef {
  name: string;
  min_value: number;
  max_value: number;
  step: number;
  default_value: number;
}

interface UserPedal {
  id: string;
  name: string;
  type: string;
  controls: KnobDef[];
}

interface UserRig {
  guitar: { model: string; pickup_type: string };
  amp: { model: string; channel_or_preset?: string; controls: KnobDef[] };
  pedals: UserPedal[];
}

interface ConfiguredKnob {
  name: string;
  target_value: number;
}

interface TonePresetResponse {
  song_title: string;
  artist: string;
  target_sound_summary: string;
  guitar_settings: GuitarSettings;
  amp_channel?: string;
  amp_knobs: ConfiguredKnob[];
  pedals: {
    name: string;
    type: string;
    is_active: boolean;
    knob_settings: ConfiguredKnob[];
    signal_position: number;
  }[];
  key_techniques_and_tips: string[];
}

const DEFAULT_RIG: UserRig = {
  guitar: {
    model: 'Squier Stratocaster Affinity HSS',
    pickup_type: 'HSS (Bridge Humbucker, Middle & Neck Single-Coil)',
  },
  amp: {
    model: 'Fender Mustang LT25',
    channel_or_preset: 'Clean / Crunch',
    controls: [
      { name: 'Gain', min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
      { name: 'Volume', min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
      { name: 'Treble', min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
      { name: 'Middle', min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
      { name: 'Bass', min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
    ],
  },
  pedals: [
    {
      id: 'pedal-1',
      name: 'Ibanez TS9 Tube Screamer',
      type: 'Overdrive',
      controls: [
        { name: 'Drive', min_value: 0, max_value: 10, step: 0.5, default_value: 4 },
        { name: 'Tone', min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
        { name: 'Level', min_value: 0, max_value: 10, step: 0.5, default_value: 6 },
      ],
    },
  ],
};

// noinspection D
export default function App() {
  const [activeTab, setActiveTab] = useState<'match' | 'rig'>('match');
  const [rig, setRig] = useState<UserRig>(() => {
    const saved = localStorage.getItem('autotoner_rig');
    return saved ? JSON.parse(saved) : DEFAULT_RIG;
  });

  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<TonePresetResponse | null>(null);

  useEffect(() => {
    localStorage.setItem('autotoner_rig', JSON.stringify(rig));
  }, [rig]);

  const handleMatch = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!songTitle.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/tone/match-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_title: songTitle,
          artist: artist || undefined,
          additional_notes: notes || undefined,
          user_rig: rig,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      const data: TonePresetResponse = await response.json();
      setPreset(data);
    } catch (err: any) {
      setError(err.message || 'Failed to match tone.');
    } finally {
      setLoading(false);
    }
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
                    activeTab === 'match' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              Match Song
            </button>
            <button
                onClick={() => setActiveTab('rig')}
                className={`px-4 py-1.5 rounded-md transition ${
                    activeTab === 'rig' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              My Rig Profile
            </button>
          </div>
        </header>

        {/* Tab: Song Match */}
        {activeTab === 'match' && (
            <div className="space-y-6">
              <form onSubmit={handleMatch} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
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
                            {preset.song_title} <span className="text-zinc-500 font-normal">by</span> {preset.artist}
                          </h2>
                          <p className="text-xs text-amber-400 font-mono mt-0.5">{preset.target_sound_summary}</p>
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
                                <span className="text-zinc-500 capitalize">{key.replace('_', ' ')}: </span>
                                <span className="text-zinc-200 font-medium">{val}</span>
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
                              <span className="ml-2 text-xs text-amber-500 font-normal">({preset.amp_channel})</span>
                          )}
                        </div>
                        <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.9)] animate-pulse" />
                      </div>
                      <div className="p-6 flex flex-wrap justify-around gap-4 bg-gradient-to-r from-zinc-900 via-neutral-900 to-zinc-900">
                        {preset.amp_knobs.map((knob) => (
                            <div key={knob.name} className="flex flex-col items-center">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        {knob.name}
                      </span>
                              <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center shadow-inner relative">
                                <div
                                    className="w-full h-full absolute transition-transform"
                                    style={{ transform: `rotate(${(knob.target_value / 10) * 270 - 135}deg)` }}
                                >
                                  <div className="w-1 h-3 bg-amber-400 mx-auto rounded-full mt-1 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                                </div>
                              </div>
                              <span className="text-xs font-mono font-bold text-amber-400 mt-1">
                        {knob.target_value.toFixed(1)}
                      </span>
                            </div>
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
                        {preset.pedals.map((pedal) => (
                            <div
                                key={pedal.name}
                                className={`min-w-[190px] p-4 rounded-xl border bg-zinc-900 shadow-md ${
                                    pedal.is_active ? 'border-amber-500/60' : 'border-zinc-800 opacity-60'
                                }`}
                            >
                              <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                          {pedal.type}
                        </span>
                                <Power className={`w-3.5 h-3.5 ${pedal.is_active ? 'text-amber-400' : 'text-zinc-600'}`} />
                              </div>
                              <h4 className="font-bold text-sm text-zinc-200 mt-1">{pedal.name}</h4>
                              <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1.5">
                                {pedal.knob_settings.map((k) => (
                                    <div key={k.name} className="flex justify-between text-xs">
                                      <span className="text-zinc-400">{k.name}</span>
                                      <span className="font-mono text-zinc-200 font-semibold">{k.target_value.toFixed(1)}</span>
                                    </div>
                                ))}
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips & Techniques */}
                    {preset.key_techniques_and_tips?.length > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                            Playing Tips & Rig Nuances
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
                            {preset.key_techniques_and_tips.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">Guitar</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Guitar Model</label>
                    <input
                        type="text"
                        value={rig.guitar.model}
                        onChange={(e) => setRig({ ...rig, guitar: { ...rig.guitar, model: e.target.value } })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Pickups / Config</label>
                    <input
                        type="text"
                        value={rig.guitar.pickup_type}
                        onChange={(e) => setRig({ ...rig, guitar: { ...rig.guitar, pickup_type: e.target.value } })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Amp */}
              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">Amplifier</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Amp Model</label>
                    <input
                        type="text"
                        value={rig.amp.model}
                        onChange={(e) => setRig({ ...rig, amp: { ...rig.amp, model: e.target.value } })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Channels / Notes</label>
                    <input
                        type="text"
                        value={rig.amp.channel_or_preset || ''}
                        onChange={(e) => setRig({ ...rig, amp: { ...rig.amp, channel_or_preset: e.target.value } })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Available Amp Knobs (comma separated)</label>
                  <input
                      type="text"
                      value={rig.amp.controls.map((c) => c.name).join(', ')}
                      onChange={(e) => {
                        const names = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setRig({
                          ...rig,
                          amp: {
                            ...rig.amp,
                            controls: names.map((n) => ({
                              name: n,
                              min_value: 0,
                              max_value: 10,
                              step: 0.5,
                              default_value: 5,
                            })),
                          },
                        });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 font-mono"
                  />
                </div>
              </div>

              {/* Pedals */}
              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">Pedals</h3>
                  <button
                      type="button"
                      onClick={() => {
                        const newPedal: UserPedal = {
                          id: `pedal-${Date.now()}`,
                          name: 'New Pedal',
                          type: 'Overdrive',
                          controls: [{ name: 'Level', min_value: 0, max_value: 10, step: 0.5, default_value: 5 }],
                        };
                        setRig({ ...rig, pedals: [...rig.pedals, newPedal] });
                      }}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Pedal
                  </button>
                </div>

                <div className="space-y-3">
                  {rig.pedals.map((pedal, idx) => (
                      <div key={pedal.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <input
                              type="text"
                              value={pedal.name}
                              onChange={(e) => {
                                const updated = [...rig.pedals];
                                updated[idx].name = e.target.value;
                                setRig({ ...rig, pedals: updated });
                              }}
                              className="bg-transparent border-b border-zinc-700 text-sm font-semibold text-white focus:outline-none focus:border-amber-500 px-1 py-0.5"
                          />
                          <button
                              type="button"
                              onClick={() => {
                                setRig({ ...rig, pedals: rig.pedals.filter((p) => p.id !== pedal.id) });
                              }}
                              className="text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-500 mb-1">Knobs (comma-separated)</label>
                          <input
                              type="text"
                              value={pedal.controls.map((c) => c.name).join(', ')}
                              onChange={(e) => {
                                const knobNames = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                const updated = [...rig.pedals];
                                updated[idx].controls = knobNames.map((n) => ({
                                  name: n,
                                  min_value: 0,
                                  max_value: 10,
                                  step: 0.5,
                                  default_value: 5,
                                }));
                                setRig({ ...rig, pedals: updated });
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 font-mono"
                          />
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            </div>
        )}
      </div>
  );
}