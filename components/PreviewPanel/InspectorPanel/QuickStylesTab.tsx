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
const PresetIcon: React.FC<{ icon: string; className?: string; style?: React.CSSProperties }> = ({ icon, className, style }) => {
  switch (icon) {
    case 'Sparkles':
      return <Sparkles className={className} style={style} />;
    case 'Wand2':
      return <Wand2 className={className} style={style} />;
    case 'Smartphone':
      return <Smartphone className={className} style={style} />;
    case 'Moon':
      return <Moon className={className} style={style} />;
    case 'Accessibility':
      return <Accessibility className={className} style={style} />;
    case 'Layers':
      return <Layers className={className} style={style} />;
    default:
      return <Sparkles className={className} style={style} />;
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
        beautify: { boxShadow: '0 4px 20px color-mix(in srgb, var(--theme-ai-accent) 30%, transparent)', borderRadius: '12px' },
        animate: { transform: 'scale(1.02)', transition: 'all 0.3s ease' },
        darkmode: { backgroundColor: 'var(--theme-surface-dark)', color: 'var(--theme-text-primary)' },
        modern: { borderRadius: '16px', boxShadow: '0 2px 10px color-mix(in srgb, var(--theme-background) 10%, transparent)' },
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
      <div className="flex flex-col items-center justify-center h-full text-sm gap-2 p-4" style={{ color: 'var(--theme-text-dim)' }}>
        <Wand2 className="w-8 h-8 opacity-50" />
        <p className="text-center">Select an element to apply quick styles</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
        <Palette className="w-4 h-4" style={{ color: 'var(--color-feature)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Quick Styles</span>
        {isProcessing && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: 'var(--color-feature)' }} />}
      </div>

      {/* Scope Selector - Only show if element has a group */}
      {hasGroup && (
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--theme-glass-200)', border: '1px solid var(--theme-border-light)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-3.5 h-3.5" style={{ color: 'var(--color-feature)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Apply to:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setScope('element')}
              disabled={isProcessing}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all"
              style={{
                backgroundColor: scope === 'element' ? 'var(--color-feature)' : 'var(--theme-glass-300)',
                color: scope === 'element' ? 'var(--theme-text-on-accent)' : 'var(--theme-text-muted)',
                opacity: isProcessing ? 0.5 : 1,
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              This Element
            </button>
            <button
              onClick={() => setScope('group')}
              disabled={isProcessing}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all"
              style={{
                backgroundColor: scope === 'group' ? 'var(--color-feature)' : 'var(--theme-glass-300)',
                color: scope === 'group' ? 'var(--theme-text-on-accent)' : 'var(--theme-text-muted)',
                opacity: isProcessing ? 0.5 : 1,
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              All in Group
            </button>
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--theme-text-dim)' }}>
            {scope === 'element'
              ? 'Changes apply only to this element'
              : `Changes apply to all elements with group "${ffGroup}"`}
          </p>
        </div>
      )}

      {/* Style Presets Grid */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
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
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all"
              style={{
                border: `1px solid ${activePreview === preset.id ? 'var(--color-feature)' : 'var(--theme-border-light)'}`,
                backgroundColor: activePreview === preset.id ? 'var(--color-feature-subtle)' : 'var(--theme-glass-200)',
                opacity: isProcessing ? 0.5 : 1,
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              <PresetIcon
                icon={preset.icon}
                className="w-5 h-5"
                style={{ color: activePreview === preset.id ? 'var(--color-feature)' : 'var(--theme-text-muted)' }}
              />
              <span className="text-xs font-medium" style={{ color: 'var(--theme-text-secondary)' }}>{preset.label}</span>
              <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--theme-text-dim)' }}>
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-text-muted)' }}>
          Custom Style
        </h3>
        <form onSubmit={handleCustomSubmit} className="space-y-2">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe the style changes you want...&#10;e.g., 'Add a gradient background and rounded corners'"
            disabled={isProcessing}
            className="w-full h-20 px-3 py-2 text-xs rounded-lg resize-none focus:outline-none disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border-light)', color: 'var(--theme-text-secondary)' }}
          />
          <button
            type="submit"
            disabled={isProcessing || !customPrompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: isProcessing || !customPrompt.trim() ? 'var(--theme-glass-300)' : 'var(--color-feature)',
              color: isProcessing || !customPrompt.trim() ? 'var(--theme-text-dim)' : 'var(--theme-text-on-accent)'
            }}
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
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--theme-glass-300)', color: 'var(--theme-text-secondary)' }}
        >
          <Undo2 className="w-3.5 h-3.5" />
          Clear Preview
        </button>
      )}

      {/* Help Text */}
      <div className="text-[10px] p-2 rounded-lg" style={{ color: 'var(--theme-text-dim)', backgroundColor: 'var(--theme-glass-200)' }}>
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
