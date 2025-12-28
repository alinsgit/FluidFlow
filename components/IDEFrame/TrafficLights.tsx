/**
 * TrafficLights - macOS-style window controls
 */
import React, { memo } from 'react';

interface TrafficLightsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

// macOS-authentic colors (intentionally matching OS design)
const MACOS_COLORS = {
  close: '#ff5f57',
  minimize: '#febc2e',
  maximize: '#28c840',
  iconColor: 'rgba(0, 0, 0, 0.4)' // Dark semi-transparent for icon glyphs
} as const;

export const TrafficLights = memo(function TrafficLights({
  onClose,
  onMinimize,
  onMaximize,
}: TrafficLightsProps) {
  return (
    <div className="flex gap-2 group">
      <button
        onClick={onClose}
        className="w-3 h-3 rounded-full relative overflow-hidden flex items-center justify-center hover:brightness-90 transition-all"
        style={{ backgroundColor: MACOS_COLORS.close }}
        title="Close"
      >
        <span
          className="text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute"
          style={{ color: MACOS_COLORS.iconColor }}
        >
          x
        </span>
      </button>
      <button
        onClick={onMinimize}
        className="w-3 h-3 rounded-full relative overflow-hidden flex items-center justify-center hover:brightness-90 transition-all"
        style={{ backgroundColor: MACOS_COLORS.minimize }}
        title="Minimize"
      >
        <span
          className="text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute"
          style={{ color: MACOS_COLORS.iconColor }}
        >
          -
        </span>
      </button>
      <button
        onClick={onMaximize}
        className="w-3 h-3 rounded-full relative overflow-hidden flex items-center justify-center hover:brightness-90 transition-all"
        style={{ backgroundColor: MACOS_COLORS.maximize }}
        title="Maximize"
      >
        <span
          className="text-[6px] font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute"
          style={{ color: MACOS_COLORS.iconColor }}
        >
          +
        </span>
      </button>
    </div>
  );
});

export default TrafficLights;
