import React, {useRef, useState, useCallback, useEffect} from "react";

interface KnobProps {
    label: string;
    value: number; // 0.0 - 10.0
    min?: number;
    max?: number;
    onChange?: (value: number) => void;
    readOnly?: boolean;
}

export const Knob: React.FC<KnobProps> = ({
    label,
    value,
    min = 0,
    max = 10,
    onChange,
    readOnly = false,
}) => {
    const [internalValue, setInternalValue] = useState(value);
    const knobRef = useRef<HTMLDivElement>(null);
    const dragStartY = useRef<number>(0);
    const startVal = useRef<number>(0);

    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    // Total 270
    const angle = ((internalValue - min) / (max - min)) * 270 - 135;

    const handleMouseDown = (e: React.MouseEvent) => {
        if (readOnly) return;
        dragStartY.current = e.clientY;
        startVal.current = internalValue;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const deltaY = dragStartY.current - e.clientY;
        const sensitivity = 0.05;
        const nextVal = Math.min(max, Math.max(min, startVal.current + deltaY * sensitivity));
        const rounded = Math.round(nextVal * 10) / 10;
        setInternalValue(rounded);
        onChange?.(rounded);
    }, [min, max, onChange]);

    // noinspection com.intellij.reactbuddy.ExhaustiveDepsInspection
    const handleMouseUp = useCallback(() => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    return (
        <div className="flex flex-col items-center select-none group">
            <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase mb-1.5">
                {label}
            </span>
            <div
                ref={knobRef}
                onMouseDown={handleMouseDown}
                className={`relative w-14 h-14 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 border-2 border-zinc-800 shadow-lg flex items-center justify-center ${
                    readOnly ? 'cursor-default' : 'cursor-ns-resize hover:border-amber-500/50'
                }`}
            >
                {/* Metallic center */}
                <div className="w-10 h-10 rounded-full bg-zing-800 border border-zinc-700/60 flex items-center justify-center relative shadow-inner">
                    {/* Rotative visual indicator */}
                    <div
                        className="absolute w-full h-full pointer-events-none transition-transform duration-75"
                        style={{transform: `rotate(${angle}deg)`}}
                    >
                        <div className="w-1 h-3 bg-amber-400 mx-auto rounded-full mt-0.5 shadow-[0_0_6px_rgba(251,191,36,0.8)]"></div>
                    </div>
                </div>
            </div>
            <span className="text-xs font-mono font-medium text-amber-400 mt-1.5">
                {internalValue.toFixed(1)}
            </span>
        </div>
    );
}