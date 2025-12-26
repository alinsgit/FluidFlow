import React from 'react';
import { Palette, Check, Info } from 'lucide-react';
import { SettingsSection } from '../shared';
import { useTheme } from '../../../contexts/ThemeContext';
import { SEMANTIC_COLORS, Theme } from '../../../types/theme';

// Theme card component
const ThemeCard: React.FC<{
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ theme, isSelected, onSelect }) => {
  const { colors } = theme;

  return (
    <button
      onClick={onSelect}
      className={`
        group relative p-3 rounded-xl border-2 transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        ${isSelected
          ? 'border-(--theme-accent) shadow-lg shadow-(--theme-accent)/20'
          : 'border-white/10 hover:border-white/20'
        }
      `}
      style={{ backgroundColor: colors.surface }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: colors.accent }}
        >
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Color preview */}
      <div className="flex gap-1.5 mb-2">
        <div
          className="w-6 h-6 rounded-lg border border-white/10"
          style={{ backgroundColor: colors.background }}
          title="Background"
        />
        <div
          className="w-6 h-6 rounded-lg border border-white/10"
          style={{ backgroundColor: colors.surface }}
          title="Surface"
        />
        <div
          className="w-6 h-6 rounded-lg border border-white/10"
          style={{ backgroundColor: colors.accent }}
          title="Accent"
        />
        <div
          className="w-6 h-6 rounded-lg border border-white/10"
          style={{
            background: `linear-gradient(135deg, ${colors.gradientFrom}, ${colors.gradientTo})`
          }}
          title="Gradient"
        />
      </div>

      {/* Theme name */}
      <div
        className="text-sm font-medium text-left"
        style={{ color: colors.textPrimary }}
      >
        {theme.name}
      </div>

      {/* Description */}
      <div
        className="text-xs text-left mt-0.5 line-clamp-1"
        style={{ color: colors.textSecondary }}
      >
        {theme.description}
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.accent}10, transparent 70%)`
        }}
      />
    </button>
  );
};

// Semantic color display
const SemanticColorChip: React.FC<{
  name: string;
  color: string;
  subtleColor: string;
}> = ({ name, color, subtleColor }) => (
  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: subtleColor }}>
    <div
      className="w-4 h-4 rounded-full"
      style={{ backgroundColor: color }}
    />
    <span className="text-xs font-medium" style={{ color }}>{name}</span>
  </div>
);

export const AppearancePanel: React.FC = () => {
  const { themeId, setTheme, currentTheme, themeList } = useTheme();

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: 'var(--theme-accent-subtle)' }}
        >
          <Palette className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
            Appearance
          </h2>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            Customize FluidFlow's visual style
          </p>
        </div>
      </div>

      {/* Theme Selection */}
      <SettingsSection
        title="Theme"
        description="Choose a theme that suits your style"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {themeList.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={theme.id === themeId}
              onSelect={() => setTheme(theme.id)}
            />
          ))}
        </div>
      </SettingsSection>

      {/* Current Theme Preview */}
      <SettingsSection
        title="Active Theme"
        description="Preview of your current theme colors"
      >
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-border)',
            background: `linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))`
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--theme-accent-subtle)' }}
            >
              <Palette className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
            </div>
            <div>
              <div className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                {currentTheme.name}
              </div>
              <div className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                {currentTheme.description}
              </div>
            </div>
          </div>

          {/* Color palette preview */}
          <div className="grid grid-cols-8 gap-2">
            {[
              { name: 'BG', color: currentTheme.colors.background },
              { name: 'Surface', color: currentTheme.colors.surface },
              { name: 'Hover', color: currentTheme.colors.surfaceHover },
              { name: 'Accent', color: currentTheme.colors.accent },
              { name: 'Text', color: currentTheme.colors.textPrimary },
              { name: 'Secondary', color: currentTheme.colors.textSecondary },
              { name: 'Muted', color: currentTheme.colors.textMuted },
              { name: 'Border', color: currentTheme.colors.border },
            ].map((item) => (
              <div key={item.name} className="text-center">
                <div
                  className="w-full aspect-square rounded-lg border mb-1"
                  style={{
                    backgroundColor: item.color,
                    borderColor: 'var(--theme-border)'
                  }}
                />
                <div className="text-[9px]" style={{ color: 'var(--theme-text-muted)' }}>
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Semantic Colors */}
      <SettingsSection
        title="Semantic Colors"
        description="These colors remain consistent across all themes"
      >
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--theme-glass-100)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--theme-accent)' }} />
            <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
              Semantic colors for success, warning, error, and info states stay the same
              regardless of theme to maintain clear visual feedback.
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <SemanticColorChip
              name="Success"
              color={SEMANTIC_COLORS.success}
              subtleColor={SEMANTIC_COLORS.successSubtle}
            />
            <SemanticColorChip
              name="Warning"
              color={SEMANTIC_COLORS.warning}
              subtleColor={SEMANTIC_COLORS.warningSubtle}
            />
            <SemanticColorChip
              name="Error"
              color={SEMANTIC_COLORS.error}
              subtleColor={SEMANTIC_COLORS.errorSubtle}
            />
            <SemanticColorChip
              name="Info"
              color={SEMANTIC_COLORS.info}
              subtleColor={SEMANTIC_COLORS.infoSubtle}
            />
          </div>
        </div>
      </SettingsSection>

      {/* Preview Device Info */}
      <SettingsSection
        title="Preview Panel"
        description="Device simulation options"
      >
        <div
          className="flex items-start gap-3 p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--theme-glass-100)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--theme-accent)' }} />
          <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            Use the device buttons in the Preview panel toolbar to switch between desktop,
            tablet, and mobile views. The preview will remember your last selection during
            the session.
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default AppearancePanel;
