import type { GuitarSettings } from './guitarSettings';

export interface ConfiguredKnob {
  name: string;
  target_value: number;
}

export interface ConfiguredPedal {
  name: string;
  type: string;
  is_active: boolean;
  knob_settings: ConfiguredKnob[];
  signal_position: number;
}

export interface TonePresetResponse {
  song_title: string;
  artist: string;
  target_sound_summary: string;
  guitar_settings: GuitarSettings;
  amp_channel?: string;
  amp_knobs: ConfiguredKnob[];
  pedals: ConfiguredPedal[];
  key_techniques_and_tips: string[];
}
