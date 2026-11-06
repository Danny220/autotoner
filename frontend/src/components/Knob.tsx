import React, { useRef, useState } from "react";

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(value);

  const dragStartYRef = useRef<number>(0);
  const startValRef = useRef<number>(0);

  const displayValue = isDragging ? dragValue : value;
  // Map value to 270 degree rotation (-135deg to +135deg)
  const range = max - min || 1;
  const angle = ((displayValue - min) / range) * 270 - 135;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) return;
    dragStartYRef.current = e.clientY;
    startValRef.current = value;
    setDragValue(value);
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || readOnly || !onChange) return;
    const deltaY = dragStartYRef.current - e.clientY;
    const sensitivity = 0.05;
    const nextVal = Math.min(max, Math.max(min, startValRef.current + deltaY * sensitivity));
    const rounded = Math.round(nextVal * 10) / 10;
    setDragValue(rounded);
    onChange(rounded);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="flex flex-col items-center select-none group touch-none">
      <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase mb-1.5">
        {label}
      </span>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-14 h-14 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 border-2 border-zinc-800 shadow-lg flex items-center justify-center ${
          readOnly ? "cursor-default" : "cursor-ns-resize hover:border-amber-500/50"
        }`}
      >
        {/* Metallic center */}
        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center relative shadow-inner">
          {/* Rotative visual indicator */}
          <div
            className="absolute w-full h-full pointer-events-none transition-transform duration-75"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div className="w-1 h-3 bg-amber-400 mx-auto rounded-full mt-0.5 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
          </div>
        </div>
      </div>
      <span className="text-xs font-mono font-medium text-amber-400 mt-1.5">
        {displayValue.toFixed(1)}
      </span>
    </div>
  );
};