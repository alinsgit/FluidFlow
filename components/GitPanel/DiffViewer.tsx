import React from 'react';
import { DiffViewerProps } from './types';

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff }) => {
  const lines = diff.split('\n');

  return (
    <pre className="text-sm font-mono p-4 overflow-x-auto">
      {lines.map((line, index) => {
        let className = 'text-slate-400';
        let bgClass = '';

        if (line.startsWith('+++') || line.startsWith('---')) {
          className = 'text-slate-500 font-bold';
        } else if (line.startsWith('@@')) {
          className = 'text-purple-400';
          bgClass = 'bg-purple-500/10';
        } else if (line.startsWith('+')) {
          className = 'text-emerald-400';
          bgClass = 'bg-emerald-500/10';
        } else if (line.startsWith('-')) {
          className = 'text-red-400';
          bgClass = 'bg-red-500/10';
        } else if (line.startsWith('diff --git')) {
          className = 'text-blue-400 font-bold';
          bgClass = 'bg-blue-500/10 border-t border-white/5 mt-2 pt-2';
        } else if (line.startsWith('index ') || line.startsWith('new file') || line.startsWith('deleted file')) {
          className = 'text-slate-600';
        }

        return (
          <div key={index} className={`${bgClass} -mx-4 px-4`}>
            <span className={className}>{line || ' '}</span>
          </div>
        );
      })}
    </pre>
  );
};

export default DiffViewer;
