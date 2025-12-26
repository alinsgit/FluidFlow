// Theme System Type Definitions

export type ThemeId =
  | 'midnight-glass'    // Default - current dark glassmorphism
  | 'rose-garden'       // Soft pink/rose tones
  | 'lavender-dream'    // Purple/lavender pastels
  | 'ocean-breeze'      // Teal/cyan fresh
  | 'mint-chocolate'    // Mint green with warm accents
  | 'sunset-glow'       // Warm orange/coral
  | 'cotton-candy'      // Pink and blue pastels
  | 'aurora-borealis';  // Green/purple gradients

export interface ThemeColors {
  // Base colors
  background: string;        // Main app background
  surface: string;           // Cards, panels
  surfaceHover: string;      // Hover state for surfaces

  // Glass effects
  glass100: string;          // Lightest glass
  glass200: string;          // Medium glass
  glass300: string;          // Darker glass

  // Borders
  border: string;            // Default border
  borderHover: string;       // Hover state border

  // Text
  textPrimary: string;       // Main text
  textSecondary: string;     // Secondary text
  textMuted: string;         // Muted/disabled text

  // Accent colors
  accent: string;            // Primary accent
  accentHover: string;       // Accent hover
  accentSubtle: string;      // Subtle accent background

  // Gradient
  gradientFrom: string;      // Gradient start
  gradientTo: string;        // Gradient end

  // Scrollbar
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
}

// Semantic colors - these stay consistent across all themes
export interface SemanticColors {
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  error: string;
  errorSubtle: string;
  info: string;
  infoSubtle: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
  // Optional custom properties
  monacoTheme: 'vs-dark' | 'vs' | 'hc-black';
}

export interface ThemeConfig {
  currentTheme: ThemeId;
}

// Default semantic colors (theme-independent)
export const SEMANTIC_COLORS: SemanticColors = {
  success: '#22c55e',
  successSubtle: 'rgba(34, 197, 94, 0.15)',
  warning: '#f59e0b',
  warningSubtle: 'rgba(245, 158, 11, 0.15)',
  error: '#ef4444',
  errorSubtle: 'rgba(239, 68, 68, 0.15)',
  info: '#3b82f6',
  infoSubtle: 'rgba(59, 130, 246, 0.15)',
};

// Theme definitions
export const THEMES: Record<ThemeId, Theme> = {
  'midnight-glass': {
    id: 'midnight-glass',
    name: 'Midnight Glass',
    description: 'Dark glassmorphism theme for focused coding',
    monacoTheme: 'vs-dark',
    colors: {
      background: '#020617',
      surface: '#0f172a',
      surfaceHover: '#1e293b',
      glass100: 'rgba(255, 255, 255, 0.05)',
      glass200: 'rgba(255, 255, 255, 0.1)',
      glass300: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.1)',
      borderHover: 'rgba(255, 255, 255, 0.2)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#475569',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentSubtle: 'rgba(59, 130, 246, 0.15)',
      gradientFrom: 'rgba(59, 130, 246, 0.1)',
      gradientTo: 'rgba(168, 85, 247, 0.1)',
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#334155',
      scrollbarThumbHover: '#475569',
    },
  },

  'rose-garden': {
    id: 'rose-garden',
    name: 'Rose Garden',
    description: 'Soft and warm rose tones',
    monacoTheme: 'vs-dark',
    colors: {
      background: '#1a0a10',
      surface: '#2a1520',
      surfaceHover: '#3d1f2e',
      glass100: 'rgba(255, 182, 193, 0.05)',
      glass200: 'rgba(255, 182, 193, 0.1)',
      glass300: 'rgba(255, 182, 193, 0.15)',
      border: 'rgba(255, 182, 193, 0.15)',
      borderHover: 'rgba(255, 182, 193, 0.25)',
      textPrimary: '#fce7f3',
      textSecondary: '#f9a8d4',
      textMuted: '#9d5074',
      accent: '#f472b6',
      accentHover: '#ec4899',
      accentSubtle: 'rgba(244, 114, 182, 0.15)',
      gradientFrom: 'rgba(244, 114, 182, 0.1)',
      gradientTo: 'rgba(251, 113, 133, 0.1)',
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#4a2030',
      scrollbarThumbHover: '#6b2d47',
    },
  },

  'lavender-dream': {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Calming purple pastels',
    monacoTheme: 'vs-dark',
    colors: {
      background: '#0f0a1a',
      surface: '#1a1428',
      surfaceHover: '#2a2040',
      glass100: 'rgba(192, 132, 252, 0.05)',
      glass200: 'rgba(192, 132, 252, 0.1)',
      glass300: 'rgba(192, 132, 252, 0.15)',
      border: 'rgba(192, 132, 252, 0.12)',
      borderHover: 'rgba(192, 132, 252, 0.25)',
      textPrimary: '#f3e8ff',
      textSecondary: '#c4b5fd',
      textMuted: '#7c6a9e',
      accent: '#a78bfa',
      accentHover: '#8b5cf6',
      accentSubtle: 'rgba(167, 139, 250, 0.15)',
      gradientFrom: 'rgba(167, 139, 250, 0.1)',
      gradientTo: 'rgba(192, 132, 252, 0.1)',
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#3d2a5c',
      scrollbarThumbHover: '#5b3d8a',
    },
  },

  'ocean-breeze': {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Fresh teal and cyan tones',
    monacoTheme: 'vs-dark',
    colors: {
      background: '#021a1a',
      surface: '#0a2828',
      surfaceHover: '#103838',
      glass100: 'rgba(45, 212, 191, 0.05)',
      glass200: 'rgba(45, 212, 191, 0.1)',
      glass300: 'rgba(45, 212, 191, 0.15)',
      border: 'rgba(45, 212, 191, 0.12)',
      borderHover: 'rgba(45, 212, 191, 0.25)',
      textPrimary: '#ccfbf1',
      textSecondary: '#5eead4',
      textMuted: '#3a7a70',
      accent: '#2dd4bf',
      accentHover: '#14b8a6',
      accentSubtle: 'rgba(45, 212, 191, 0.15)',
      gradientFrom: 'rgba(45, 212, 191, 0.1)',
      gradientTo: 'rgba(34, 211, 238, 0.1)',
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#1a4040',
      scrollbarThumbHover: '#2a5a5a',
    },
  },

  'mint-chocolate': {
    id: 'mint-chocolate',
    name: 'Mint Chocolate',
    description: 'Fresh mint with warm chocolate tones',
    monacoTheme: 'vs-dark',
    colors: {
      background: '#0a1510',
      surface: '#132218',
      surfaceHover: '#1e3324',
      glass100: 'rgba(134, 239, 172, 0.05)',
      glass200: 'rgba(134, 239, 172, 0.1)',
      glass300: 'rgba(134, 239, 172, 0.15)',
      border: 'rgba(134, 239, 172, 0.12)',
      borderHover: 'rgba(134, 239, 172, 0.25)',
      textPrimary: '#dcfce7',
      textSecondary: '#86efac',
      textMuted: '#4a7a5a',
      accent: '#4ade80',
      accentHover: '#22c55e',
      accentSubtle: 'rgba(74, 222, 128, 0.15)',
      gradientFrom: 'rgba(74, 222, 128, 0.1)',
      gradientTo: 'rgba(180, 130, 100, 0.1)',
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#2a4a32',
      scrollbarThumbHover: '#3a6a45',
    },
  },

  'sunset-glow': {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm orange and coral tones',
    monacoTheme: 'vs-dark',
    colors: {
      background: '#1a0f05',
      surface: '#2a1a0a',
      surfaceHover: '#3d2510',
      glass100: 'rgba(251, 146, 60, 0.05)',
      glass200: 'rgba(251, 146, 60, 0.1)',
      glass300: 'rgba(251, 146, 60, 0.15)',
      border: 'rgba(251, 146, 60, 0.12)',
      borderHover: 'rgba(251, 146, 60, 0.25)',
      textPrimary: '#ffedd5',
      textSecondary: '#fdba74',
      textMuted: '#9a6530',
      accent: '#fb923c',
      accentHover: '#f97316',
      accentSubtle: 'rgba(251, 146, 60, 0.15)',
      gradientFrom: 'rgba(251, 146, 60, 0.1)',
      gradientTo: 'rgba(251, 113, 133, 0.1)',
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#4a3020',
      scrollbarThumbHover: '#6a4530',
    },
  },

  'cotton-candy': {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    description: 'Sweet pink and blue pastels',
    monacoTheme: 'vs-dark',
    colors: {
      background: '#100818',
      surface: '#1a1025',
      surfaceHover: '#281838',
      glass100: 'rgba(236, 72, 153, 0.05)',
      glass200: 'rgba(236, 72, 153, 0.08)',
      glass300: 'rgba(129, 140, 248, 0.1)',
      border: 'rgba(236, 72, 153, 0.15)',
      borderHover: 'rgba(129, 140, 248, 0.25)',
      textPrimary: '#fce7f3',
      textSecondary: '#f9a8d4',
      textMuted: '#8b5a80',
      accent: '#ec4899',
      accentHover: '#db2777',
      accentSubtle: 'rgba(236, 72, 153, 0.15)',
      gradientFrom: 'rgba(236, 72, 153, 0.15)',
      gradientTo: 'rgba(129, 140, 248, 0.15)',
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#3a2050',
      scrollbarThumbHover: '#5a3070',
    },
  },

  'aurora-borealis': {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    description: 'Northern lights green and purple',
    monacoTheme: 'vs-dark',
    colors: {
      background: '#030a10',
      surface: '#0a1820',
      surfaceHover: '#102530',
      glass100: 'rgba(52, 211, 153, 0.05)',
      glass200: 'rgba(52, 211, 153, 0.08)',
      glass300: 'rgba(167, 139, 250, 0.1)',
      border: 'rgba(52, 211, 153, 0.12)',
      borderHover: 'rgba(167, 139, 250, 0.25)',
      textPrimary: '#d1fae5',
      textSecondary: '#6ee7b7',
      textMuted: '#4a8070',
      accent: '#34d399',
      accentHover: '#10b981',
      accentSubtle: 'rgba(52, 211, 153, 0.15)',
      gradientFrom: 'rgba(52, 211, 153, 0.1)',
      gradientTo: 'rgba(167, 139, 250, 0.15)',
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#1a3040',
      scrollbarThumbHover: '#2a4a5a',
    },
  },
};

export const DEFAULT_THEME: ThemeId = 'midnight-glass';

// Storage key for theme
export const THEME_STORAGE_KEY = 'fluidflow_theme';
