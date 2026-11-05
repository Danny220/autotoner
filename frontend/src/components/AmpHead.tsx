import React from "react";
import type {AmpSettings} from "../types/ampSettings.ts";
import {Knob} from "./Knob.tsx";
import { Volume2 } from 'lucide-react';

interface AmpHeadProps {
    settings: AmpSettings;
    onSettingChange?: (key: keyof AmpSettings, val: number) => void;
}

export const AmpHead: React.FC<AmpHeadProps> = ({settings, onSettingChange}) => {
    return (
        <div className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-zinc-950 px-6 py-3 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold tracking-widest uppercase text-sm text-zinc-300">
                        {settings.amp_model}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] tracking-wider uppercase text-zinc-500 font-mono">Pilot Lamp</span>
                    <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.9)] animate-pulse" />
                </div>
            </div>

            <div className="bg-gradient-to-r from-zinc-900 via-neutral-800 to-zinc-900 p-6 flex flex-wrap justify-around items-center gap-4">
                <Knob
                    label="Gain"
                    value={settings.gain}
                    onChange={(v) => onSettingChange?.('gain', v)}
                />
                <div className="h-10 w-[1px] bg-zinc-700/40 hidden sm:block" />
                <Knob
                    label="Bass"
                    value={settings.bass}
                    onChange={(v) => onSettingChange?.('bass', v)}
                />
                <Knob
                    label="Middle"
                    value={settings.middle}
                    onChange={(v) => onSettingChange?.('middle', v)}
                />
                <Knob
                    label="Treble"
                    value={settings.treble}
                    onChange={(v) => onSettingChange?.('treble', v)}
                />
                <div className="h-10 w-[1px] bg-zinc-700/40 hidden sm:block" />
                {settings.presence !== undefined && (
                    <Knob
                        label="Presence"
                        value={settings.presence}
                        onChange={(v) => onSettingChange?.('presence', v)}
                    />
                )}
                {settings.master_volume !== undefined && (
                    <Knob
                        label="Master"
                        value={settings.master_volume}
                        onChange={(v) => onSettingChange?.('master_volume', v)}
                    />
                )}
            </div>
        </div>
    );
}