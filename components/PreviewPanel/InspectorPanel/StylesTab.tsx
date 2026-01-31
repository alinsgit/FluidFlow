/**
 * StylesTab - CSS Computed Styles Display
 *
 * Displays computed CSS styles organized by category,
 * with Tailwind class explanations and copy functionality.
 */

import React, { useState, useMemo } from 'react';
import { SAVE_INDICATOR_DURATION_MS } from '../../../constants/timing';
import { ChevronDown, ChevronRight, Copy, Check, Loader2, Palette } from 'lucide-react';
import type { StylesTabProps } from './types';
import {
  groupClassesByCategory,
  getCategoryDisplayName,
  getCategoryColor,
  type TailwindCategory,
} from '@/utils/tailwindParser';

interface CategorySectionProps {
  category: TailwindCategory;
  styles: Record<string, string>;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (text: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  styles,
  isExpanded,
  onToggle,
  onCopy,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const entries = Object.entries(styles);

  if (entries.length === 0) return null;

  const handleCopy = (key: string, value: string) => {
    onCopy(`${key}: ${value}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), SAVE_INDICATOR_DURATION_MS);
  };

  return (
    <div style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" style={{ color: 'var(--theme-text-dim)' }} />
        ) : (
          <ChevronRight className="w-3 h-3" style={{ color: 'var(--theme-text-dim)' }} />
        )}
        <span className="text-xs font-medium" style={{ color: getCategoryColor(category) }}>
          {getCategoryDisplayName(category)}
        </span>
        <span className="text-[10px] ml-auto" style={{ color: 'var(--theme-text-dim)' }}>{entries.length}</span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2 space-y-1">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 py-1 px-2 rounded group cursor-pointer"
              onClick={() => handleCopy(key, value)}
            >
              <span className="text-[11px] font-mono min-w-[120px]" style={{ color: 'var(--theme-text-muted)' }}>{key}:</span>
              <span className="text-[11px] font-mono flex-1 truncate" style={{ color: 'var(--theme-text-secondary)' }}>{value}</span>
              {copiedKey === key ? (
                <Check className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
              ) : (
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-dim)' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface TailwindSectionProps {
  classes: ReturnType<typeof groupClassesByCategory>;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (text: string) => void;
}

const TailwindSection: React.FC<TailwindSectionProps> = ({
  classes,
  isExpanded,
  onToggle,
  onCopy,
}) => {
  const [copiedClass, setCopiedClass] = useState<string | null>(null);
  const totalClasses = Object.values(classes).flat().length;

  if (totalClasses === 0) return null;

  const handleCopyClass = (className: string) => {
    onCopy(className);
    setCopiedClass(className);
    setTimeout(() => setCopiedClass(null), SAVE_INDICATOR_DURATION_MS);
  };

  return (
    <div style={{ borderBottom: '1px solid var(--theme-border-light)' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" style={{ color: 'var(--theme-text-dim)' }} />
        ) : (
          <ChevronRight className="w-3 h-3" style={{ color: 'var(--theme-text-dim)' }} />
        )}
        <Palette className="w-3 h-3" style={{ color: 'var(--color-info)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--color-info)' }}>Tailwind Classes</span>
        <span className="text-[10px] ml-auto" style={{ color: 'var(--theme-text-dim)' }}>{totalClasses}</span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2">
          {Object.entries(classes).map(([category, categoryClasses]) => {
            if (categoryClasses.length === 0) return null;

            return (
              <div key={category} className="mb-2 last:mb-0">
                <div className="text-[10px] font-medium mb-1" style={{ color: getCategoryColor(category as TailwindCategory) }}>
                  {getCategoryDisplayName(category as TailwindCategory)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {categoryClasses.map((info) => (
                    <button
                      key={info.className}
                      onClick={() => handleCopyClass(info.className)}
                      className="group relative px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors"
                      style={{ backgroundColor: 'var(--theme-glass-200)', color: 'var(--theme-text-secondary)' }}
                      title={`${info.description}\n${info.cssEquivalent}`}
                    >
                      {info.className}
                      {copiedClass === info.className && (
                        <span
                          className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[9px] rounded whitespace-nowrap"
                          style={{ backgroundColor: 'var(--color-success)', color: 'white' }}
                        >
                          Copied!
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const StylesTab: React.FC<StylesTabProps> = ({
  styles,
  tailwindClasses,
  isLoading,
  onCopy,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['layout', 'spacing', 'typography', 'tailwind'])
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const groupedTailwind = useMemo(
    () => groupClassesByCategory(tailwindClasses),
    [tailwindClasses]
  );

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-10" style={{ color: 'var(--theme-text-dim)' }}>
        <Loader2 className="w-5 h-5 mb-2 animate-spin" />
        <span className="text-xs">Loading styles...</span>
      </div>
    );
  }

  if (!styles) {
    return (
      <div className="h-full flex flex-col items-center justify-center italic py-10" style={{ color: 'var(--theme-text-dim)' }}>
        <Palette className="w-5 h-5 mb-2 opacity-50" />
        <span className="text-xs">Select an element to view styles</span>
      </div>
    );
  }

  const { stylesByCategory } = styles;

  // Map CSS categories to our display categories
  const categoryMapping: Record<string, TailwindCategory> = {
    layout: 'layout',
    flexbox: 'flexbox',
    grid: 'grid',
    spacing: 'spacing',
    sizing: 'sizing',
    typography: 'typography',
    colors: 'colors',
    borders: 'borders',
    effects: 'effects',
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {/* Element info header */}
      <div className="px-3 py-2 sticky top-0 z-10" style={{ backgroundColor: 'var(--theme-surface-dark)', borderBottom: '1px solid var(--theme-border-light)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }}>
            &lt;{styles.tagName}&gt;
          </span>
          {styles.id && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }}>
              #{styles.id}
            </span>
          )}
          <span className="text-[10px]" style={{ color: 'var(--theme-text-dim)' }}>
            {styles.boxModel.width} × {styles.boxModel.height}
          </span>
        </div>
      </div>

      {/* Tailwind classes section */}
      <TailwindSection
        classes={groupedTailwind}
        isExpanded={expandedCategories.has('tailwind')}
        onToggle={() => toggleCategory('tailwind')}
        onCopy={onCopy}
      />

      {/* CSS categories */}
      {Object.entries(stylesByCategory || {}).map(([category, categoryStyles]) => {
        const mappedCategory = categoryMapping[category] || ('other' as TailwindCategory);
        return (
          <CategorySection
            key={category}
            category={mappedCategory}
            styles={categoryStyles as Record<string, string>}
            isExpanded={expandedCategories.has(category)}
            onToggle={() => toggleCategory(category)}
            onCopy={onCopy}
          />
        );
      })}

      {/* No styles message */}
      {Object.keys(stylesByCategory || {}).length === 0 && tailwindClasses.length === 0 && (
        <div className="px-3 py-4 text-center text-xs" style={{ color: 'var(--theme-text-dim)' }}>
          No computed styles available
        </div>
      )}
    </div>
  );
};
