import React from 'react';
import { Briefcase, Code2, Check, Info } from 'lucide-react';

interface ModeToggleProps {
  isConsultantMode: boolean;
  onToggle: () => void;
  autoAcceptChanges?: boolean;
  onAutoAcceptChange?: (value: boolean) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  isConsultantMode,
  onToggle,
  autoAcceptChanges = false,
  onAutoAcceptChange
}) => {
  return (
    <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
      {/* Mode Toggle - Left side */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
            isConsultantMode
              ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
              : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
          }`}
          title={`Switch to ${isConsultantMode ? 'Engineer' : 'Consultant'} mode`}
        >
          {isConsultantMode ? (
            <>
              <Briefcase className="w-3 h-3" />
              <span>Consultant</span>
            </>
          ) : (
            <>
              <Code2 className="w-3 h-3" />
              <span>Engineer</span>
            </>
          )}
        </button>
      </div>

      {/* Auto-Accept Toggle - Right side (only in Engineer mode) */}
      {!isConsultantMode && onAutoAcceptChange && (
        <div className="flex items-center gap-1.5 group relative">
          <button
            onClick={() => onAutoAcceptChange(!autoAcceptChanges)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
              autoAcceptChanges
                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700/70 hover:text-slate-300'
            }`}
            title={autoAcceptChanges ? 'Auto-accept is ON - changes apply immediately' : 'Auto-accept is OFF - review changes before applying'}
          >
            <Check className={`w-3 h-3 ${autoAcceptChanges ? 'opacity-100' : 'opacity-50'}`} />
            <span>Auto</span>
          </button>

          {/* Tooltip on hover */}
          <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-slate-800 border border-white/10 rounded-lg text-[10px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3 text-blue-400" />
              {autoAcceptChanges ? 'Changes apply immediately' : 'Review changes before applying'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
