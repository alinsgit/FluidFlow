/**
 * StylesTab - CSS Computed Styles Display
 *
 * Displays computed CSS styles organized by category,
 * with Tailwind class explanations and copy functionality.
 */

import React, { useState, useMemo } from 'react';
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
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-slate-500" />
        ) : (
          <ChevronRight className="w-3 h-3 text-slate-500" />
        )}
        <span className={`text-xs font-medium ${getCategoryColor(category)}`}>
          {getCategoryDisplayName(category)}
        </span>
        <span className="text-[10px] text-slate-600 ml-auto">{entries.length}</span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2 space-y-1">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5 group cursor-pointer"
              onClick={() => handleCopy(key, value)}
            >
              <span className="text-[11px] text-slate-400 font-mono min-w-[120px]">{key}:</span>
              <span className="text-[11px] text-slate-300 font-mono flex-1 truncate">{value}</span>
              {copiedKey === key ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
    setTimeout(() => setCopiedClass(null), 1500);
  };

  return (
    <div className="border-b border-white/5">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-slate-500" />
        ) : (
          <ChevronRight className="w-3 h-3 text-slate-500" />
        )}
        <Palette className="w-3 h-3 text-cyan-400" />
        <span className="text-xs font-medium text-cyan-400">Tailwind Classes</span>
        <span className="text-[10px] text-slate-600 ml-auto">{totalClasses}</span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2">
          {Object.entries(classes).map(([category, categoryClasses]) => {
            if (categoryClasses.length === 0) return null;

            return (
              <div key={category} className="mb-2 last:mb-0">
                <div className={`text-[10px] font-medium mb-1 ${getCategoryColor(category as TailwindCategory)}`}>
                  {getCategoryDisplayName(category as TailwindCategory)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {categoryClasses.map((info) => (
                    <button
                      key={info.className}
                      onClick={() => handleCopyClass(info.className)}
                      className="group relative px-1.5 py-0.5 bg-slate-800/50 hover:bg-slate-700/50 rounded text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
                      title={`${info.description}\n${info.cssEquivalent}`}
                    >
                      {info.className}
                      {copiedClass === info.className && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-green-500/90 text-white text-[9px] rounded whitespace-nowrap">
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
      <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10">
        <Loader2 className="w-5 h-5 mb-2 animate-spin" />
        <span className="text-xs">Loading styles...</span>
      </div>
    );
  }

  if (!styles) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 italic py-10">
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
      <div className="px-3 py-2 bg-slate-900/50 border-b border-white/5 sticky top-0 z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-mono">
            &lt;{styles.tagName}&gt;
          </span>
          {styles.id && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-mono">
              #{styles.id}
            </span>
          )}
          <span className="text-[10px] text-slate-500">
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
        <div className="px-3 py-4 text-center text-slate-500 text-xs">
          No computed styles available
        </div>
      )}
    </div>
  );
};
