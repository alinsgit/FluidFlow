/**
 * BoxModelTab - Visual Box Model Display
 *
 * Displays the CSS box model (margin, border, padding, content)
 * as a visual nested diagram like Chrome DevTools.
 */

import React from 'react';
import { Loader2, Box } from 'lucide-react';
import type { BoxModelTabProps } from './types';

interface BoxSideValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BoxLayerProps {
  label: string;
  color: string;
  bgColor: string;
  values: BoxSideValues;
  children: React.ReactNode;
}

const BoxLayer: React.FC<BoxLayerProps> = ({ label, color, bgColor, values, children }) => {
  const formatValue = (v: number) => (v === 0 ? '-' : v);

  return (
    <div className={`relative ${bgColor} p-2`}>
      {/* Label */}
      <span className={`absolute top-0.5 left-1 text-[8px] font-medium ${color}`}>{label}</span>

      {/* Top value */}
      <div className="flex justify-center mb-1">
        <span className={`text-[10px] font-mono ${color}`}>{formatValue(values.top)}</span>
      </div>

      {/* Middle row: left - content - right */}
      <div className="flex items-center">
        {/* Left value */}
        <span className={`text-[10px] font-mono ${color} w-8 text-center`}>
          {formatValue(values.left)}
        </span>

        {/* Content/children */}
        <div className="flex-1">{children}</div>

        {/* Right value */}
        <span className={`text-[10px] font-mono ${color} w-8 text-center`}>
          {formatValue(values.right)}
        </span>
      </div>

      {/* Bottom value */}
      <div className="flex justify-center mt-1">
        <span className={`text-[10px] font-mono ${color}`}>{formatValue(values.bottom)}</span>
      </div>
    </div>
  );
};

export const BoxModelTab: React.FC<BoxModelTabProps> = ({ boxModel, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10">
        <Loader2 className="w-5 h-5 mb-2 animate-spin" />
        <span className="text-xs">Loading box model...</span>
      </div>
    );
  }

  if (!boxModel) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 italic py-10">
        <Box className="w-5 h-5 mb-2 opacity-50" />
        <span className="text-xs">Select an element to view box model</span>
      </div>
    );
  }

  const { margin, padding, border, width, height } = boxModel;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4">
      {/* Box model diagram */}
      <div className="max-w-[300px] mx-auto">
        {/* Margin layer */}
        <BoxLayer
          label="margin"
          color="text-orange-300"
          bgColor="bg-orange-500/10"
          values={margin}
        >
          {/* Border layer */}
          <BoxLayer
            label="border"
            color="text-yellow-300"
            bgColor="bg-yellow-500/10"
            values={border}
          >
            {/* Padding layer */}
            <BoxLayer
              label="padding"
              color="text-green-300"
              bgColor="bg-green-500/10"
              values={padding}
            >
              {/* Content box */}
              <div className="bg-blue-500/20 p-3 text-center">
                <span className="text-[10px] font-mono text-blue-300">
                  {width} × {height}
                </span>
              </div>
            </BoxLayer>
          </BoxLayer>
        </BoxLayer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-500/30" />
          <span className="text-[10px] text-slate-400">Margin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500/30" />
          <span className="text-[10px] text-slate-400">Border</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500/30" />
          <span className="text-[10px] text-slate-400">Padding</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500/30" />
          <span className="text-[10px] text-slate-400">Content</span>
        </div>
      </div>

      {/* Raw values table */}
      <div className="mt-6 space-y-3">
        <h4 className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
          Raw Values
        </h4>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          {/* Content dimensions */}
          <div className="bg-slate-800/30 rounded px-2 py-1.5">
            <span className="text-slate-500">width:</span>{' '}
            <span className="text-blue-300">{width}px</span>
          </div>
          <div className="bg-slate-800/30 rounded px-2 py-1.5">
            <span className="text-slate-500">height:</span>{' '}
            <span className="text-blue-300">{height}px</span>
          </div>

          {/* Padding */}
          <div className="col-span-2 bg-slate-800/30 rounded px-2 py-1.5">
            <span className="text-slate-500">padding:</span>{' '}
            <span className="text-green-300">
              {padding.top} {padding.right} {padding.bottom} {padding.left}
            </span>
          </div>

          {/* Border */}
          <div className="col-span-2 bg-slate-800/30 rounded px-2 py-1.5">
            <span className="text-slate-500">border-width:</span>{' '}
            <span className="text-yellow-300">
              {border.top} {border.right} {border.bottom} {border.left}
            </span>
          </div>

          {/* Margin */}
          <div className="col-span-2 bg-slate-800/30 rounded px-2 py-1.5">
            <span className="text-slate-500">margin:</span>{' '}
            <span className="text-orange-300">
              {margin.top} {margin.right} {margin.bottom} {margin.left}
            </span>
          </div>

          {/* Total dimensions */}
          <div className="col-span-2 bg-slate-800/30 rounded px-2 py-1.5 border border-white/5">
            <span className="text-slate-500">total:</span>{' '}
            <span className="text-slate-300">
              {width + padding.left + padding.right + border.left + border.right + margin.left + margin.right}
              {' × '}
              {height + padding.top + padding.bottom + border.top + border.bottom + margin.top + margin.bottom}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
