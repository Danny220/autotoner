import React from "react";
import type {PedalSetting} from "../types/pedalSetting.ts";
import {ArrowRight, SlidersHorizontal} from "lucide-react";

interface PedalboardProps {
    pedals: PedalSetting[]
}

const getPedalColor = (type: string) => {
    const t = type.toLowerCase();

    const getColor = (color: string) => `border-${color}-600/50 bg-${color}-950/20 text-${color}-400`;

    if (t.includes('overdrive') || t.includes('distortion') || t.includes('fuzz')) {
        return getColor('amber');
    }
    if (t.includes('delay') || t.includes('reverb')) {
        return getColor('cyan');
    }
    if (t.includes('modulation') || t.includes('chorus') || t.includes('flanger')) {
        return getColor('purple');
    }
    return getColor('emerald');
}

export const Pedalboard: React.FC<PedalboardProps> = ({ pedals }) => {
    if (!pedals || pedals.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                Nessun pedale inserito nella catena (segnale diretto all'ampli).
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-400 text-sm font-semibold tracking-wide uppercase">
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                <span>Catena Pedali (Signal Flow)</span>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-1">
                {pedals.map((pedal, index) => (
                    <React.Fragment key={index}>
                        <div className={`min-w-[190px] p-4 rounded-xl border bg-zinc-900 shadow-md ${getPedalColor(pedal.type)}`}>
                            <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">{pedal.type}</div>
                            <h4 className="font-bold text-sm text-zinc-200 truncate mt-0.5">{pedal.name}</h4>

                            {/* Pedal controls */}
                            <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-1.5">
                                {Object.entries(pedal.settings).map(([param, val]) => (
                                    <div key={param} className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-400">{param}</span>
                                        <span className="font-mono text-zinc-200 font-medium">{String(val)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Footswitch */}
                            <div className="mt-4 flex justify-center">
                                <div className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-zinc-500 shadow-inner" />
                            </div>
                        </div>

                        {index < pedals.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};