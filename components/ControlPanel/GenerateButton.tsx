import React from 'react';
import { Sparkles, RotateCw, Briefcase } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  isDisabled: boolean;
  isConsultantMode: boolean;
  hasExistingApp: boolean;
  hasFile: boolean;
  hasPrompt: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  isGenerating,
  isDisabled,
  isConsultantMode,
  hasExistingApp,
  hasFile,
  hasPrompt
}) => {
  const canGenerate = !isDisabled && (hasFile || (hasExistingApp && hasPrompt));

  return (
    <>
      <button
        onClick={onClick}
        disabled={isGenerating || isDisabled}
        className={`
          group relative w-full py-3 font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3 transition-all overflow-hidden
          ${
            isGenerating || isDisabled
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              : isConsultantMode
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient text-white hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] active:scale-[0.98]'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] animate-gradient text-white hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-[0.98]'
          }
        `}
        aria-busy={isGenerating}
      >
        {/* Shine Effect */}
        {!isGenerating && canGenerate && (
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] z-0 pointer-events-none">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
          </div>
        )}

        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm tracking-wide">
              {isConsultantMode ? 'Analyzing...' : 'Building...'}
            </span>
          </>
        ) : (
          <>
            {isConsultantMode ? (
              <Briefcase className="w-5 h-5 relative z-10 text-indigo-100" />
            ) : hasExistingApp ? (
              <RotateCw className="w-5 h-5 relative z-10 text-blue-100" />
            ) : (
              <Sparkles className="w-5 h-5 relative z-10 text-blue-100" />
            )}
            <span className="relative z-10 text-sm tracking-wide uppercase">
              {isConsultantMode
                ? 'Identify Gaps'
                : hasExistingApp
                ? 'Update App'
                : 'Generate App'}
            </span>
          </>
        )}
      </button>

      {/* CSS Animation for Gradient Button - Using static CSS string (safe, no user input) */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </>
  );
};
