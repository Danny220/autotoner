export interface KnobDef {
  name: string;
  min_value: number;
  max_value: number;
  step: number;
  default_value: number;
}

export interface UserGuitar {
  model: string;
  pickup_type: string;
}

export interface UserAmp {
  model: string;
  channel_or_preset?: string;
  controls: KnobDef[];
}

export interface UserPedal {
  id: string;
  name: string;
  type: string;
  controls: KnobDef[];
}

export interface UserRig {
  guitar: UserGuitar;
  amp: UserAmp;
  pedals: UserPedal[];
}

export const DEFAULT_RIG: UserRig = {
  guitar: {
    model: "Squier Stratocaster Affinity HSS",
    pickup_type: "HSS (Bridge Humbucker, Middle & Neck Single-Coil)",
  },
  amp: {
    model: "Fender Mustang LT25",
    channel_or_preset: "Clean / Crunch",
    controls: [
      { name: "Gain", min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
      { name: "Volume", min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
      { name: "Treble", min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
      { name: "Middle", min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
      { name: "Bass", min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
    ],
  },
  pedals: [
    {
      id: "pedal-1",
      name: "Ibanez TS9 Tube Screamer",
      type: "Overdrive",
      controls: [
        { name: "Drive", min_value: 0, max_value: 10, step: 0.5, default_value: 4 },
        { name: "Tone", min_value: 0, max_value: 10, step: 0.5, default_value: 5 },
        { name: "Level", min_value: 0, max_value: 10, step: 0.5, default_value: 6 },
      ],
    },
  ],
};

