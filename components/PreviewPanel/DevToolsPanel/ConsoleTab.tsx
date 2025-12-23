/**
 * ConsoleTab - Console log display component
 *
 * Displays console logs with timestamps and error fixing capabilities.
 */

import React, { useRef, useEffect } from 'react';
import { Terminal, Sparkles, Loader2, Check } from 'lucide-react';
import type { ConsoleTabProps } from './types';

export const ConsoleTab: React.FC<ConsoleTabProps> = ({ logs, onFixError }) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    const container = consoleEndRef.current?.parentElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 italic py-10">
        <Terminal className="w-5 h-5 mb-2 opacity-50" />
        <span>Console is clear</span>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1.5">
      {logs.map((log) => (
        <div
          key={log.id}
          className={`flex gap-3 border-b border-white/[0.03] pb-2 last:border-0 items-start group ${
            log.type === 'error' ? 'bg-red-500/5 -mx-3 px-3 py-1' : ''
          }`}
        >
          <span
            className={`flex-none opacity-40 select-none min-w-[50px] pt-0.5 ${
              log.type === 'error' ? 'text-red-300' : 'text-slate-500'
            }`}
          >
            {log.timestamp}
          </span>
          <div className="flex-1 min-w-0">
            <span
              className={`break-all whitespace-pre-wrap ${
                log.type === 'error'
                  ? 'text-red-300 font-semibold'
                  : log.type === 'warn'
                    ? 'text-yellow-400'
                    : 'text-slate-300'
              }`}
            >
              {log.message}
            </span>

            {log.type === 'error' && (
              <div className="mt-2 flex items-center gap-2">
                {log.isFixed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-[10px] font-medium border border-green-500/30">
                    <Check className="w-3 h-3" />
                    Fixed
                  </span>
                ) : (
                  <button
                    onClick={() => onFixError(log.id, log.message)}
                    disabled={log.isFixing}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/20 transition-all text-[10px] font-medium"
                  >
                    {log.isFixing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {log.isFixing ? 'Fixing with AI...' : 'Fix with AI'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={consoleEndRef} />
    </div>
  );
};
