/**
 * QuickStylesTab - AI-Powered Quick Style Editor
 *
 * Provides preset style options and custom prompts for AI styling:
 * - Style presets (Beautify, Animate, Responsive, Dark Mode, etc.)
 * - Custom prompt input for specific styling requests
 * - Live preview with temporary styles
 * - Apply to code via AI edit flow
 */

import React, { useState, useCallback } from 'react';
import {
  Sparkles,
  Wand2,
  Smartphone,
  Moon,
  Accessibility,
  Layers,
  Send,
  Loader2,
  Palette,
  Undo2,
  Target,
} from 'lucide-react';
import { STYLE_PRESETS, type QuickStylesTabProps, type EditScope } from './types';

// Icon mapping for presets
const PresetIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className }) => {
  switch (icon) {
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Wand2':
      return <Wand2 className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'Moon':
      return <Moon className={className} />;
    case 'Accessibility':
      return <Accessibility className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

export const QuickStylesTab: React.FC<QuickStylesTabProps> = ({
  elementRef,
  ffGroup,
  onApplyPreset,
  onApplyCustom,
  onApplyTempStyle,
  onClearTempStyles,
  isProcessing,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [scope, setScope] = useState<EditScope>('element');

  const hasGroup = !!ffGroup;

  const handlePresetClick = useCallback(
    (presetId: string) => {
      const preset = STYLE_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        onApplyPreset(preset.prompt, scope);
      }
    },
    [onApplyPreset, scope]
  );

  const handleCustomSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (customPrompt.trim()) {
        onApplyCustom(customPrompt.trim(), scope);
        setCustomPrompt('');
      }
    },
    [customPrompt, onApplyCustom, scope]
  );

  const handlePreviewEnter = useCallback(
    (presetId: string) => {
      setActivePreview(presetId);
      // Apply preview styles based on preset
      const previewStyles: Record<string, Record<string, string>> = {
        beautify: { boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)', borderRadius: '12px' },
        animate: { transform: 'scale(1.02)', transition: 'all 0.3s ease' },
        darkmode: { backgroundColor: '#1e1e2e', color: '#cdd6f4' },
        modern: { borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
      };
      if (previewStyles[presetId]) {
        onApplyTempStyle(previewStyles[presetId]);
      }
    },
    [onApplyTempStyle]
  );

  const handlePreviewLeave = useCallback(() => {
    setActivePreview(null);
    onClearTempStyles();
  }, [onClearTempStyles]);

  if (!elementRef) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2 p-4">
        <Wand2 className="w-8 h-8 opacity-50" />
        <p className="text-center">Select an element to apply quick styles</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
        <Palette className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-slate-300">Quick Styles</span>
        {isProcessing && <Loader2 className="w-3 h-3 animate-spin text-purple-400 ml-auto" />}
      </div>

      {/* Scope Selector - Only show if element has a group */}
      {hasGroup && (
        <div className="p-2 bg-slate-800/50 rounded-lg border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-slate-400">Apply to:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setScope('element')}
              disabled={isProcessing}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                scope === 'element'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-300 hover:bg-slate-600'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              This Element
            </button>
            <button
              onClick={() => setScope('group')}
              disabled={isProcessing}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                scope === 'group'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-300 hover:bg-slate-600'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              All in Group
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            {scope === 'element'
              ? 'Changes apply only to this element'
              : `Changes apply to all elements with group "${ffGroup}"`}
          </p>
        </div>
      )}

      {/* Style Presets Grid */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Presets
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.id)}
              onMouseEnter={() => handlePreviewEnter(preset.id)}
              onMouseLeave={handlePreviewLeave}
              disabled={isProcessing}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                activePreview === preset.id
                  ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                  : 'border-white/10 bg-slate-800/50 hover:border-purple-500/50 hover:bg-slate-800'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <PresetIcon
                icon={preset.icon}
                className={`w-5 h-5 ${
                  activePreview === preset.id ? 'text-purple-400' : 'text-slate-400'
                }`}
              />
              <span className="text-xs font-medium text-slate-300">{preset.label}</span>
              <span className="text-[10px] text-slate-500 text-center leading-tight">
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Custom Style
        </h3>
        <form onSubmit={handleCustomSubmit} className="space-y-2">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe the style changes you want...&#10;e.g., 'Add a gradient background and rounded corners'"
            disabled={isProcessing}
            className="w-full h-20 px-3 py-2 text-xs bg-slate-800 border border-white/10 rounded-lg text-slate-300 placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !customPrompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Apply Custom Style
              </>
            )}
          </button>
        </form>
      </div>

      {/* Clear Preview Button */}
      {activePreview && (
        <button
          onClick={handlePreviewLeave}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Clear Preview
        </button>
      )}

      {/* Help Text */}
      <div className="text-[10px] text-slate-500 p-2 bg-slate-800/30 rounded-lg">
        <p className="mb-1">
          <strong>Hover</strong> over presets to preview styles
        </p>
        <p>
          <strong>Click</strong> to apply via AI and update your code
        </p>
      </div>
    </div>
  );
};
