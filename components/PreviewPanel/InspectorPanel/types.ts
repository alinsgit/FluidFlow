/**
 * InspectorPanel Types
 *
 * Shared types for the CSS Inspector panel components.
 */

import type { ComputedStylesResult } from '@/utils/sandboxHtml/scripts';
import type { TailwindClassInfo } from '@/utils/tailwindParser';

export type InspectorTab = 'styles' | 'boxmodel' | 'props' | 'quickstyles';

export interface InspectorTabConfig {
  id: InspectorTab;
  label: string;
  icon: string;
  description?: string;
}

export interface StylesTabProps {
  styles: ComputedStylesResult | null;
  tailwindClasses: TailwindClassInfo[];
  isLoading: boolean;
  onCopy: (text: string) => void;
}

export interface BoxModelTabProps {
  boxModel: ComputedStylesResult['boxModel'] | null;
  isLoading: boolean;
}

export interface PropsTabProps {
  props: Record<string, unknown> | null;
  state: Array<{ index: number; value: unknown }> | null;
  componentName: string | null;
  isLoading: boolean;
}

export type EditScope = 'element' | 'group';

export interface QuickStylesTabProps {
  elementRef: string | null;
  ffGroup?: string | null;  // Group ID for scope selection
  onApplyPreset: (preset: string, scope: EditScope) => void;
  onApplyCustom: (prompt: string, scope: EditScope) => void;
  onApplyTempStyle: (styles: Record<string, string>) => void;
  onClearTempStyles: () => void;
  isProcessing: boolean;
}

export interface InspectorPanelProps {
  isOpen: boolean;
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  onClose: () => void;
  // Styles tab
  computedStyles: ComputedStylesResult | null;
  tailwindClasses: TailwindClassInfo[];
  isStylesLoading: boolean;
  // Props tab
  componentProps: Record<string, unknown> | null;
  componentState: Array<{ index: number; value: unknown }> | null;
  componentName: string | null;
  isPropsLoading: boolean;
  // Quick styles tab
  selectedElementRef: string | null;
  ffGroup?: string | null;  // Group ID for scope selection
  onApplyPreset: (preset: string, scope: EditScope) => void;
  onApplyCustom: (prompt: string, scope: EditScope) => void;
  onApplyTempStyle: (styles: Record<string, string>) => void;
  onClearTempStyles: () => void;
  isQuickStylesProcessing: boolean;
}

// Style preset configurations
export interface StylePreset {
  id: string;
  label: string;
  description: string;
  prompt: string;
  icon: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'beautify',
    label: 'Beautify',
    description: 'Enhance visual appeal',
    prompt: 'Make this component more visually appealing with better colors, shadows, and spacing',
    icon: 'Sparkles',
  },
  {
    id: 'animate',
    label: 'Add Animation',
    description: 'Add smooth transitions',
    prompt: 'Add smooth hover animation and transition effects',
    icon: 'Wand2',
  },
  {
    id: 'responsive',
    label: 'Make Responsive',
    description: 'Mobile-friendly layout',
    prompt: 'Make this component fully responsive for all screen sizes',
    icon: 'Smartphone',
  },
  {
    id: 'darkmode',
    label: 'Dark Mode',
    description: 'Add dark theme support',
    prompt: 'Add dark mode support with appropriate colors',
    icon: 'Moon',
  },
  {
    id: 'a11y',
    label: 'Accessibility',
    description: 'Improve accessibility',
    prompt: 'Improve accessibility with proper ARIA labels and keyboard support',
    icon: 'Accessibility',
  },
  {
    id: 'modern',
    label: 'Modernize',
    description: 'Update to modern design',
    prompt: 'Update this component with a modern, clean design using current UI trends',
    icon: 'Layers',
  },
];
