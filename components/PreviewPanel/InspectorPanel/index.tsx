/**
 * InspectorPanel - CSS Inspector Side Panel
 *
 * Chrome DevTools-like panel for inspecting:
 * - Computed CSS styles
 * - Box model visualization
 * - Component props/state
 * - Quick style presets with AI
 */

import React from 'react';
import { X, Palette, Box, Code2, Wand2, MousePointer2, Sparkles } from 'lucide-react';
import { StylesTab } from './StylesTab';
import { BoxModelTab } from './BoxModelTab';
import { PropsTab } from './PropsTab';
import { QuickStylesTab } from './QuickStylesTab';
import type { InspectorPanelProps, InspectorTabConfig } from './types';

const TABS: InspectorTabConfig[] = [
  { id: 'styles', label: 'Styles', icon: 'Palette', description: 'CSS Properties' },
  { id: 'boxmodel', label: 'Box', icon: 'Box', description: 'Dimensions' },
  { id: 'props', label: 'Props', icon: 'Code2', description: 'React Props' },
  { id: 'quickstyles', label: 'AI', icon: 'Wand2', description: 'AI Styles' },
];

const TabIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className }) => {
  switch (icon) {
    case 'Palette':
      return <Palette className={className} />;
    case 'Box':
      return <Box className={className} />;
    case 'Code2':
      return <Code2 className={className} />;
    case 'Wand2':
      return <Wand2 className={className} />;
    default:
      return null;
  }
};

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  // Styles tab
  computedStyles,
  tailwindClasses,
  isStylesLoading,
  // Props tab
  componentProps,
  componentState,
  componentName,
  isPropsLoading,
  // Quick styles tab
  selectedElementRef,
  ffGroup,
  onApplyPreset,
  onApplyCustom,
  onApplyTempStyle,
  onClearTempStyles,
  isQuickStylesProcessing,
}) => {
  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const hasSelection = !!selectedElementRef;

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl">
      {/* Header with selection info */}
      <div className="flex-none border-b border-white/10 bg-slate-950">
        {/* Title bar */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <MousePointer2 className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-sm font-semibold text-white">Inspector</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected element banner */}
        <div className="px-3 pb-2">
          {hasSelection ? (
            <div className="flex items-center gap-2 px-2.5 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {componentName && (
                    <span className="text-xs font-semibold text-purple-300">{componentName}</span>
                  )}
                  {!componentName && selectedElementRef && (
                    <span className="text-xs font-mono text-purple-300">Element</span>
                  )}
                </div>
                {selectedElementRef && (
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    #{selectedElementRef.slice(0, 12)}...
                  </p>
                )}
              </div>
              <Sparkles className="w-3.5 h-3.5 text-purple-400/50" />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-2 bg-slate-800/50 border border-white/5 rounded-lg">
              <MousePointer2 className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">No element selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-none flex border-b border-white/5 bg-slate-900/50 px-1 py-1 gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            disabled={!hasSelection}
            title={tab.description}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              activeTab === tab.id && hasSelection
                ? 'text-purple-300 bg-purple-500/15 ring-1 ring-purple-500/30'
                : hasSelection
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <TabIcon icon={tab.icon} className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {!hasSelection ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 px-6 text-center">
            <MousePointer2 className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">Select an Element</p>
            <p className="text-xs text-slate-500">
              Click on any element in the preview to inspect its styles, props, and apply AI-powered changes.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'styles' && (
              <StylesTab
                styles={computedStyles}
                tailwindClasses={tailwindClasses}
                isLoading={isStylesLoading}
                onCopy={handleCopy}
              />
            )}
            {activeTab === 'boxmodel' && (
              <BoxModelTab boxModel={computedStyles?.boxModel || null} isLoading={isStylesLoading} />
            )}
            {activeTab === 'props' && (
              <PropsTab
                props={componentProps}
                state={componentState}
                componentName={componentName}
                isLoading={isPropsLoading}
              />
            )}
            {activeTab === 'quickstyles' && (
              <QuickStylesTab
                elementRef={selectedElementRef}
                ffGroup={ffGroup}
                onApplyPreset={onApplyPreset}
                onApplyCustom={onApplyCustom}
                onApplyTempStyle={onApplyTempStyle}
                onClearTempStyles={onClearTempStyles}
                isProcessing={isQuickStylesProcessing}
              />
            )}
          </>
        )}
      </div>

      {/* Footer hint */}
      {hasSelection && (
        <div className="flex-none px-3 py-2 border-t border-white/5 bg-slate-950/50">
          <p className="text-[10px] text-slate-600 text-center">
            {activeTab === 'quickstyles'
              ? 'AI will modify your code based on the selected preset'
              : activeTab === 'styles'
                ? 'Click any value to copy to clipboard'
                : activeTab === 'props'
                  ? 'View React component props and state'
                  : 'Box model shows padding, border, margin'
            }
          </p>
        </div>
      )}
    </div>
  );
};

// Re-export types and components
export type { InspectorTab, InspectorPanelProps } from './types';
export { StylesTab } from './StylesTab';
export { BoxModelTab } from './BoxModelTab';
export { PropsTab } from './PropsTab';
export { QuickStylesTab } from './QuickStylesTab';
