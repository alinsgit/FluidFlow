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
    <div className="relative p-2" style={{ backgroundColor: bgColor }}>
      {/* Label */}
      <span className="absolute top-0.5 left-1 text-[8px] font-medium" style={{ color }}>{label}</span>

      {/* Top value */}
      <div className="flex justify-center mb-1">
        <span className="text-[10px] font-mono" style={{ color }}>{formatValue(values.top)}</span>
      </div>

      {/* Middle row: left - content - right */}
      <div className="flex items-center">
        {/* Left value */}
        <span className="text-[10px] font-mono w-8 text-center" style={{ color }}>
          {formatValue(values.left)}
        </span>

        {/* Content/children */}
        <div className="flex-1">{children}</div>

        {/* Right value */}
        <span className="text-[10px] font-mono w-8 text-center" style={{ color }}>
          {formatValue(values.right)}
        </span>
      </div>

      {/* Bottom value */}
      <div className="flex justify-center mt-1">
        <span className="text-[10px] font-mono" style={{ color }}>{formatValue(values.bottom)}</span>
      </div>
    </div>
  );
};

export const BoxModelTab: React.FC<BoxModelTabProps> = ({ boxModel, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-10" style={{ color: 'var(--theme-text-dim)' }}>
        <Loader2 className="w-5 h-5 mb-2 animate-spin" />
        <span className="text-xs">Loading box model...</span>
      </div>
    );
  }

  if (!boxModel) {
    return (
      <div className="h-full flex flex-col items-center justify-center italic py-10" style={{ color: 'var(--theme-text-dim)' }}>
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
          color="var(--color-warning)"
          bgColor="var(--color-warning-subtle)"
          values={margin}
        >
          {/* Border layer */}
          <BoxLayer
            label="border"
            color="var(--color-warning)"
            bgColor="color-mix(in srgb, var(--color-warning) 10%, transparent)"
            values={border}
          >
            {/* Padding layer */}
            <BoxLayer
              label="padding"
              color="var(--color-success)"
              bgColor="var(--color-success-subtle)"
              values={padding}
            >
              {/* Content box */}
              <div className="p-3 text-center" style={{ backgroundColor: 'var(--color-info-subtle)' }}>
                <span className="text-[10px] font-mono" style={{ color: 'var(--color-info)' }}>
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
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-warning-subtle)' }} />
          <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Margin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)' }} />
          <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Border</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-success-subtle)' }} />
          <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Padding</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--color-info-subtle)' }} />
          <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>Content</span>
        </div>
      </div>

      {/* Raw values table */}
      <div className="mt-6 space-y-3">
        <h4 className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--theme-text-dim)' }}>
          Raw Values
        </h4>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          {/* Content dimensions */}
          <div className="rounded px-2 py-1.5" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
            <span style={{ color: 'var(--theme-text-dim)' }}>width:</span>{' '}
            <span style={{ color: 'var(--color-info)' }}>{width}px</span>
          </div>
          <div className="rounded px-2 py-1.5" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
            <span style={{ color: 'var(--theme-text-dim)' }}>height:</span>{' '}
            <span style={{ color: 'var(--color-info)' }}>{height}px</span>
          </div>

          {/* Padding */}
          <div className="col-span-2 rounded px-2 py-1.5" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
            <span style={{ color: 'var(--theme-text-dim)' }}>padding:</span>{' '}
            <span style={{ color: 'var(--color-success)' }}>
              {padding.top} {padding.right} {padding.bottom} {padding.left}
            </span>
          </div>

          {/* Border */}
          <div className="col-span-2 rounded px-2 py-1.5" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
            <span style={{ color: 'var(--theme-text-dim)' }}>border-width:</span>{' '}
            <span style={{ color: 'var(--color-warning)' }}>
              {border.top} {border.right} {border.bottom} {border.left}
            </span>
          </div>

          {/* Margin */}
          <div className="col-span-2 rounded px-2 py-1.5" style={{ backgroundColor: 'var(--theme-glass-200)' }}>
            <span style={{ color: 'var(--theme-text-dim)' }}>margin:</span>{' '}
            <span style={{ color: 'var(--color-warning)' }}>
              {margin.top} {margin.right} {margin.bottom} {margin.left}
            </span>
          </div>

          {/* Total dimensions */}
          <div className="col-span-2 rounded px-2 py-1.5" style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)' }}>
            <span style={{ color: 'var(--theme-text-dim)' }}>total:</span>{' '}
            <span style={{ color: 'var(--theme-text-secondary)' }}>
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
