// Theme System Type Definitions

export type ThemeId =
  // Dark themes
  | 'midnight-glass'    // Default - current dark glassmorphism
  | 'rose-garden'       // Soft pink/rose tones
  | 'lavender-dream'    // Purple/lavender pastels
  | 'ocean-breeze'      // Teal/cyan fresh
  | 'mint-chocolate'    // Mint green with warm accents
  | 'sunset-glow'       // Warm orange/coral
  | 'cotton-candy'      // Pink and blue pastels
  | 'aurora-borealis'   // Green/purple gradients
  | 'cyber-neon'        // Cyberpunk neon pink/cyan
  | 'forest-night'      // Deep forest greens
  | 'deep-ocean'        // Deep blue ocean depths
  | 'volcanic-ember'    // Red/orange volcanic
  | 'monochrome-dark'   // Pure black/white/gray dark
  | 'obsidian'          // Volcanic glass with purple undertones
  | 'noir'              // Film noir with warm amber accents
  | 'stealth'           // Tactical dark with olive accents
  // Light themes
  | 'snow-white'        // Clean white light theme
  | 'monochrome-light'  // Pure white/black/gray light
  | 'marble'            // Elegant marble with gray veining
  | 'parchment'         // Ancient manuscript warm ivory
  | 'porcelain'         // Refined ceramic blue-white
  | 'paper-cream'       // Warm cream/sepia light theme
  | 'sky-blue'          // Light blue tinted theme
  | 'mint-fresh'        // Light mint green
  | 'lavender-mist'     // Light lavender/purple
  | 'peach-blossom'     // Light peach/coral
  | 'sage-meadow'       // Light sage green
  | 'arctic-frost';     // Cool icy blue/white

export interface ThemeColors {
  // ============ BASE COLORS ============
  background: string;           // Main app background
  backgroundElevated: string;   // Elevated background (modals, dropdowns)
  surface: string;              // Cards, panels
  surfaceHover: string;         // Hover state for surfaces
  surfaceActive: string;        // Active/pressed state
  surfaceElevated: string;      // Elevated surfaces (tooltips, popovers)

  // ============ GLASS EFFECTS ============
  glass100: string;             // Lightest glass (5% opacity)
  glass200: string;             // Medium glass (10% opacity)
  glass300: string;             // Darker glass (15% opacity)
  glass400: string;             // Darkest glass (20% opacity)

  // ============ BORDERS ============
  border: string;               // Default border
  borderHover: string;          // Hover state border
  borderLight: string;          // Lighter border (subtle dividers)
  borderStrong: string;         // Stronger border (focus, emphasis)

  // ============ TEXT ============
  textPrimary: string;          // Main text
  textSecondary: string;        // Secondary text
  textMuted: string;            // Muted/disabled text
  textDim: string;              // Very dim/ghost text (even lighter than muted)
  textInverse: string;          // Inverse text (on colored backgrounds)
  textOnAccent: string;         // Text on accent backgrounds
  textHeading: string;          // Heading text (slightly different from primary)
  textLink: string;             // Link text color
  textLinkHover: string;        // Link hover color

  // ============ PRIMARY ACCENT ============
  accent: string;               // Primary accent
  accentHover: string;          // Accent hover
  accentActive: string;         // Accent pressed/active
  accentSubtle: string;         // Subtle accent background
  accentMuted: string;          // Muted accent for borders

  // ============ SECONDARY ACCENT ============
  secondary: string;            // Secondary accent (different hue)
  secondaryHover: string;       // Secondary hover
  secondarySubtle: string;      // Secondary subtle background

  // ============ TERTIARY ACCENT ============
  tertiary: string;             // Tertiary accent
  tertiaryHover: string;        // Tertiary hover
  tertiarySubtle: string;       // Tertiary subtle background

  // ============ AI-SPECIFIC COLORS ============
  aiAccent: string;             // AI buttons, highlights
  aiAccentHover: string;        // AI accent hover
  aiAccentSubtle: string;       // AI subtle background
  aiSecondary: string;          // Secondary AI color (pink)
  aiSecondarySubtle: string;    // Secondary AI subtle

  // ============ COMPONENT: SIDEBAR ============
  sidebarBackground: string;    // Sidebar/activity bar background
  sidebarBorder: string;        // Sidebar border
  sidebarItemHover: string;     // Sidebar item hover
  sidebarItemActive: string;    // Sidebar active item

  // ============ COMPONENT: HEADER/TITLEBAR ============
  headerBackground: string;     // Header/titlebar background
  headerBorder: string;         // Header border
  headerText: string;           // Header text

  // ============ COMPONENT: MODAL ============
  modalBackground: string;      // Modal content background
  modalOverlay: string;         // Modal backdrop overlay
  modalBorder: string;          // Modal border
  modalHeaderBg: string;        // Modal header background

  // ============ COMPONENT: INPUT ============
  inputBackground: string;      // Input field background
  inputBorder: string;          // Input border
  inputBorderFocus: string;     // Input focus border
  inputPlaceholder: string;     // Input placeholder text

  // ============ COMPONENT: BUTTON ============
  buttonBackground: string;     // Default button background
  buttonBackgroundHover: string;// Default button hover
  buttonBorder: string;         // Default button border
  buttonText: string;           // Default button text

  // ============ COMPONENT: TOOLTIP/POPOVER ============
  tooltipBackground: string;    // Tooltip background
  tooltipText: string;          // Tooltip text
  tooltipBorder: string;        // Tooltip border

  // ============ COMPONENT: BADGE/TAG ============
  badgeBackground: string;      // Badge/tag background
  badgeText: string;            // Badge/tag text

  // ============ COMPONENT: CODE/EDITOR ============
  codeBackground: string;       // Code block background
  codeText: string;             // Code text
  codeBorder: string;           // Code block border
  lineNumberText: string;       // Line number text
  lineHighlight: string;        // Current line highlight

  // ============ INTERACTIVE STATES ============
  focusRing: string;            // Focus ring color
  focusRingOffset: string;      // Focus ring offset background
  selection: string;            // Text selection background
  selectionText: string;        // Text selection text color
  highlight: string;            // Highlight/search match background

  // ============ OVERLAYS & SHADOWS ============
  overlay: string;              // Generic overlay (behind modals, etc.)
  shadow: string;               // Shadow color for drop-shadow
  shadowStrong: string;         // Stronger shadow
  glow: string;                 // Glow effect color

  // ============ GRADIENT ============
  gradientFrom: string;         // Gradient start
  gradientVia: string;          // Gradient middle
  gradientTo: string;           // Gradient end

  // ============ SCROLLBAR ============
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;

  // ============ STATUS BAR ============
  statusBarBackground: string;  // Status bar background
  statusBarBorder: string;      // Status bar top border
  statusBarText: string;        // Status bar text

  // ============ DIVIDER ============
  divider: string;              // Horizontal/vertical dividers
  dividerStrong: string;        // Stronger divider

  // ============ COMPONENT: PREVIEW ============
  previewBg: string;            // Preview area background
  previewDeviceBorder: string;  // Device frame border
  previewDeviceNotch: string;   // Device notch elements
  previewUrlbarBg: string;      // URL bar background
}

// Semantic colors - these stay consistent across all themes
export interface SemanticColors {
  // Success (green)
  success: string;
  successHover: string;
  successSubtle: string;
  successText: string;           // Text on success background
  successBorder: string;

  // Warning (amber/orange)
  warning: string;
  warningHover: string;
  warningSubtle: string;
  warningText: string;
  warningBorder: string;

  // Error (red)
  error: string;
  errorHover: string;
  errorSubtle: string;
  errorText: string;
  errorBorder: string;

  // Info (blue)
  info: string;
  infoHover: string;
  infoSubtle: string;
  infoText: string;
  infoBorder: string;

  // Neutral (for disabled, inactive states)
  neutral: string;
  neutralHover: string;
  neutralSubtle: string;
  neutralText: string;
  neutralBorder: string;

  // New/Feature (for highlighting new features)
  feature: string;
  featureSubtle: string;
  featureText: string;
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
  // Success
  success: '#22c55e',
  successHover: '#16a34a',
  successSubtle: 'rgba(34, 197, 94, 0.15)',
  successText: '#ffffff',
  successBorder: 'rgba(34, 197, 94, 0.3)',

  // Warning
  warning: '#f59e0b',
  warningHover: '#d97706',
  warningSubtle: 'rgba(245, 158, 11, 0.15)',
  warningText: '#ffffff',
  warningBorder: 'rgba(245, 158, 11, 0.3)',

  // Error
  error: '#ef4444',
  errorHover: '#dc2626',
  errorSubtle: 'rgba(239, 68, 68, 0.15)',
  errorText: '#ffffff',
  errorBorder: 'rgba(239, 68, 68, 0.3)',

  // Info
  info: '#3b82f6',
  infoHover: '#2563eb',
  infoSubtle: 'rgba(59, 130, 246, 0.15)',
  infoText: '#ffffff',
  infoBorder: 'rgba(59, 130, 246, 0.3)',

  // Neutral
  neutral: '#64748b',
  neutralHover: '#475569',
  neutralSubtle: 'rgba(100, 116, 139, 0.15)',
  neutralText: '#ffffff',
  neutralBorder: 'rgba(100, 116, 139, 0.3)',

  // Feature (purple for new feature highlights)
  feature: '#a855f7',
  featureSubtle: 'rgba(168, 85, 247, 0.15)',
  featureText: '#ffffff',
};

// Theme definitions
export const THEMES: Record<ThemeId, Theme> = {
  'midnight-glass': {
    id: 'midnight-glass',
    name: 'Midnight Glass',
    description: 'Dark glassmorphism theme for focused coding',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#020617',
      backgroundElevated: '#0a1628',
      surface: '#0f172a',
      surfaceHover: '#1e293b',
      surfaceActive: '#334155',
      surfaceElevated: '#1e293b',
      // Glass
      glass100: 'rgba(255, 255, 255, 0.05)',
      glass200: 'rgba(255, 255, 255, 0.1)',
      glass300: 'rgba(255, 255, 255, 0.15)',
      glass400: 'rgba(255, 255, 255, 0.2)',
      // Borders
      border: 'rgba(255, 255, 255, 0.1)',
      borderHover: 'rgba(255, 255, 255, 0.2)',
      borderLight: 'rgba(255, 255, 255, 0.05)',
      borderStrong: 'rgba(255, 255, 255, 0.3)',
      // Text
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#475569',
      textDim: '#334155',
      textInverse: '#0f172a',
      textOnAccent: '#ffffff',
      textHeading: '#ffffff',
      textLink: '#60a5fa',
      textLinkHover: '#93c5fd',
      // Primary Accent
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentActive: '#1d4ed8',
      accentSubtle: 'rgba(59, 130, 246, 0.15)',
      accentMuted: 'rgba(59, 130, 246, 0.3)',
      // Secondary Accent
      secondary: '#14b8a6',
      secondaryHover: '#0d9488',
      secondarySubtle: 'rgba(20, 184, 166, 0.15)',
      // Tertiary Accent
      tertiary: '#f59e0b',
      tertiaryHover: '#d97706',
      tertiarySubtle: 'rgba(245, 158, 11, 0.15)',
      // AI Colors
      aiAccent: '#a855f7',
      aiAccentHover: '#9333ea',
      aiAccentSubtle: 'rgba(168, 85, 247, 0.15)',
      aiSecondary: '#ec4899',
      aiSecondarySubtle: 'rgba(236, 72, 153, 0.15)',
      // Sidebar
      sidebarBackground: '#0a0f1a',
      sidebarBorder: 'rgba(255, 255, 255, 0.05)',
      sidebarItemHover: 'rgba(255, 255, 255, 0.1)',
      sidebarItemActive: 'rgba(59, 130, 246, 0.2)',
      // Header
      headerBackground: '#020617',
      headerBorder: 'rgba(255, 255, 255, 0.05)',
      headerText: '#f8fafc',
      // Modal
      modalBackground: '#0f172a',
      modalOverlay: 'rgba(0, 0, 0, 0.7)',
      modalBorder: 'rgba(255, 255, 255, 0.1)',
      modalHeaderBg: '#0a1628',
      // Input
      inputBackground: '#1e293b',
      inputBorder: 'rgba(255, 255, 255, 0.1)',
      inputBorderFocus: '#3b82f6',
      inputPlaceholder: '#475569',
      // Button
      buttonBackground: '#1e293b',
      buttonBackgroundHover: '#334155',
      buttonBorder: 'rgba(255, 255, 255, 0.1)',
      buttonText: '#f8fafc',
      // Tooltip
      tooltipBackground: '#1e293b',
      tooltipText: '#f8fafc',
      tooltipBorder: 'rgba(255, 255, 255, 0.1)',
      // Badge
      badgeBackground: 'rgba(255, 255, 255, 0.1)',
      badgeText: '#94a3b8',
      // Code
      codeBackground: '#0a1628',
      codeText: '#e2e8f0',
      codeBorder: 'rgba(255, 255, 255, 0.05)',
      lineNumberText: '#475569',
      lineHighlight: 'rgba(59, 130, 246, 0.1)',
      // Interactive
      focusRing: '#3b82f6',
      focusRingOffset: '#020617',
      selection: 'rgba(59, 130, 246, 0.3)',
      selectionText: '#ffffff',
      highlight: 'rgba(250, 204, 21, 0.3)',
      // Overlays & Shadows
      overlay: 'rgba(0, 0, 0, 0.6)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowStrong: 'rgba(0, 0, 0, 0.5)',
      glow: 'rgba(59, 130, 246, 0.4)',
      // Gradient
      gradientFrom: 'rgba(59, 130, 246, 0.1)',
      gradientVia: 'rgba(139, 92, 246, 0.1)',
      gradientTo: 'rgba(168, 85, 247, 0.1)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#334155',
      scrollbarThumbHover: '#475569',
      // Status Bar
      statusBarBackground: '#0a0f1a',
      statusBarBorder: 'rgba(255, 255, 255, 0.05)',
      statusBarText: '#64748b',
      // Divider
      divider: 'rgba(255, 255, 255, 0.05)',
      dividerStrong: 'rgba(255, 255, 255, 0.15)',
      // Preview
      previewBg: '#020617',
      previewDeviceBorder: '#1e293b',
      previewDeviceNotch: 'rgba(51, 65, 85, 0.5)',
      previewUrlbarBg: 'rgba(15, 23, 42, 0.95)',
    },
  },

  'rose-garden': {
    id: 'rose-garden',
    name: 'Rose Garden',
    description: 'Soft and warm rose tones',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#1a0a10',
      backgroundElevated: '#251520',
      surface: '#2a1520',
      surfaceHover: '#3d1f2e',
      surfaceActive: '#4d2a3d',
      surfaceElevated: '#3d1f2e',
      // Glass
      glass100: 'rgba(255, 182, 193, 0.05)',
      glass200: 'rgba(255, 182, 193, 0.1)',
      glass300: 'rgba(255, 182, 193, 0.15)',
      glass400: 'rgba(255, 182, 193, 0.2)',
      // Borders
      border: 'rgba(255, 182, 193, 0.15)',
      borderHover: 'rgba(255, 182, 193, 0.25)',
      borderLight: 'rgba(255, 182, 193, 0.08)',
      borderStrong: 'rgba(255, 182, 193, 0.35)',
      // Text
      textPrimary: '#fce7f3',
      textSecondary: '#f9a8d4',
      textMuted: '#9d5074',
      textDim: '#7a3d5a',
      textInverse: '#1a0a10',
      textOnAccent: '#ffffff',
      textHeading: '#fce7f3',
      textLink: '#f9a8d4',
      textLinkHover: '#fbcfe8',
      // Primary Accent
      accent: '#f472b6',
      accentHover: '#ec4899',
      accentActive: '#db2777',
      accentSubtle: 'rgba(244, 114, 182, 0.15)',
      accentMuted: 'rgba(244, 114, 182, 0.3)',
      // Secondary Accent
      secondary: '#fb7185',
      secondaryHover: '#f43f5e',
      secondarySubtle: 'rgba(251, 113, 133, 0.15)',
      // Tertiary Accent
      tertiary: '#fbbf24',
      tertiaryHover: '#f59e0b',
      tertiarySubtle: 'rgba(251, 191, 36, 0.15)',
      // AI Colors
      aiAccent: '#c084fc',
      aiAccentHover: '#a855f7',
      aiAccentSubtle: 'rgba(192, 132, 252, 0.15)',
      aiSecondary: '#fb7185',
      aiSecondarySubtle: 'rgba(251, 113, 133, 0.15)',
      // Sidebar
      sidebarBackground: '#150812',
      sidebarBorder: 'rgba(255, 182, 193, 0.08)',
      sidebarItemHover: 'rgba(255, 182, 193, 0.1)',
      sidebarItemActive: 'rgba(244, 114, 182, 0.2)',
      // Header
      headerBackground: '#1a0a10',
      headerBorder: 'rgba(255, 182, 193, 0.08)',
      headerText: '#fce7f3',
      // Modal
      modalBackground: '#2a1520',
      modalOverlay: 'rgba(26, 10, 16, 0.8)',
      modalBorder: 'rgba(255, 182, 193, 0.15)',
      modalHeaderBg: '#251520',
      // Input
      inputBackground: '#3d1f2e',
      inputBorder: 'rgba(255, 182, 193, 0.15)',
      inputBorderFocus: '#f472b6',
      inputPlaceholder: '#9d5074',
      // Button
      buttonBackground: '#3d1f2e',
      buttonBackgroundHover: '#4d2a3d',
      buttonBorder: 'rgba(255, 182, 193, 0.15)',
      buttonText: '#fce7f3',
      // Tooltip
      tooltipBackground: '#3d1f2e',
      tooltipText: '#fce7f3',
      tooltipBorder: 'rgba(255, 182, 193, 0.15)',
      // Badge
      badgeBackground: 'rgba(255, 182, 193, 0.1)',
      badgeText: '#f9a8d4',
      // Code
      codeBackground: '#251520',
      codeText: '#fce7f3',
      codeBorder: 'rgba(255, 182, 193, 0.08)',
      lineNumberText: '#9d5074',
      lineHighlight: 'rgba(244, 114, 182, 0.1)',
      // Interactive
      focusRing: '#f472b6',
      focusRingOffset: '#1a0a10',
      selection: 'rgba(244, 114, 182, 0.3)',
      selectionText: '#ffffff',
      highlight: 'rgba(251, 191, 36, 0.3)',
      // Overlays & Shadows
      overlay: 'rgba(26, 10, 16, 0.7)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowStrong: 'rgba(0, 0, 0, 0.5)',
      glow: 'rgba(244, 114, 182, 0.4)',
      // Gradient
      gradientFrom: 'rgba(244, 114, 182, 0.1)',
      gradientVia: 'rgba(192, 132, 252, 0.1)',
      gradientTo: 'rgba(251, 113, 133, 0.1)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#4a2030',
      scrollbarThumbHover: '#6b2d47',
      // Status Bar
      statusBarBackground: '#150812',
      statusBarBorder: 'rgba(255, 182, 193, 0.08)',
      statusBarText: '#9d5074',
      // Divider
      divider: 'rgba(255, 182, 193, 0.08)',
      dividerStrong: 'rgba(255, 182, 193, 0.2)',
      // Preview
      previewBg: '#1a0a10',
      previewDeviceBorder: '#3d1f2e',
      previewDeviceNotch: 'rgba(157, 80, 116, 0.5)',
      previewUrlbarBg: 'rgba(37, 21, 32, 0.95)',
    },
  },

  'lavender-dream': {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Calming purple pastels',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#0f0a1a',
      backgroundElevated: '#161020',
      surface: '#1a1428',
      surfaceHover: '#2a2040',
      surfaceActive: '#3a3055',
      surfaceElevated: '#2a2040',
      // Glass
      glass100: 'rgba(192, 132, 252, 0.05)',
      glass200: 'rgba(192, 132, 252, 0.1)',
      glass300: 'rgba(192, 132, 252, 0.15)',
      glass400: 'rgba(192, 132, 252, 0.2)',
      // Borders
      border: 'rgba(192, 132, 252, 0.12)',
      borderHover: 'rgba(192, 132, 252, 0.25)',
      borderLight: 'rgba(192, 132, 252, 0.06)',
      borderStrong: 'rgba(192, 132, 252, 0.35)',
      // Text
      textPrimary: '#f3e8ff',
      textSecondary: '#c4b5fd',
      textMuted: '#7c6a9e',
      textDim: '#5c4a7e',
      textInverse: '#0f0a1a',
      textOnAccent: '#ffffff',
      textHeading: '#f3e8ff',
      textLink: '#c4b5fd',
      textLinkHover: '#ddd6fe',
      // Primary Accent
      accent: '#a78bfa',
      accentHover: '#8b5cf6',
      accentActive: '#7c3aed',
      accentSubtle: 'rgba(167, 139, 250, 0.15)',
      accentMuted: 'rgba(167, 139, 250, 0.3)',
      // Secondary Accent
      secondary: '#818cf8',
      secondaryHover: '#6366f1',
      secondarySubtle: 'rgba(129, 140, 248, 0.15)',
      // Tertiary Accent
      tertiary: '#f472b6',
      tertiaryHover: '#ec4899',
      tertiarySubtle: 'rgba(244, 114, 182, 0.15)',
      // AI Colors
      aiAccent: '#c084fc',
      aiAccentHover: '#a855f7',
      aiAccentSubtle: 'rgba(192, 132, 252, 0.15)',
      aiSecondary: '#f472b6',
      aiSecondarySubtle: 'rgba(244, 114, 182, 0.15)',
      // Sidebar
      sidebarBackground: '#0c0815',
      sidebarBorder: 'rgba(192, 132, 252, 0.06)',
      sidebarItemHover: 'rgba(192, 132, 252, 0.1)',
      sidebarItemActive: 'rgba(167, 139, 250, 0.2)',
      // Header
      headerBackground: '#0f0a1a',
      headerBorder: 'rgba(192, 132, 252, 0.06)',
      headerText: '#f3e8ff',
      // Modal
      modalBackground: '#1a1428',
      modalOverlay: 'rgba(15, 10, 26, 0.8)',
      modalBorder: 'rgba(192, 132, 252, 0.12)',
      modalHeaderBg: '#161020',
      // Input
      inputBackground: '#2a2040',
      inputBorder: 'rgba(192, 132, 252, 0.12)',
      inputBorderFocus: '#a78bfa',
      inputPlaceholder: '#7c6a9e',
      // Button
      buttonBackground: '#2a2040',
      buttonBackgroundHover: '#3a3055',
      buttonBorder: 'rgba(192, 132, 252, 0.12)',
      buttonText: '#f3e8ff',
      // Tooltip
      tooltipBackground: '#2a2040',
      tooltipText: '#f3e8ff',
      tooltipBorder: 'rgba(192, 132, 252, 0.12)',
      // Badge
      badgeBackground: 'rgba(192, 132, 252, 0.1)',
      badgeText: '#c4b5fd',
      // Code
      codeBackground: '#161020',
      codeText: '#f3e8ff',
      codeBorder: 'rgba(192, 132, 252, 0.06)',
      lineNumberText: '#7c6a9e',
      lineHighlight: 'rgba(167, 139, 250, 0.1)',
      // Interactive
      focusRing: '#a78bfa',
      focusRingOffset: '#0f0a1a',
      selection: 'rgba(167, 139, 250, 0.3)',
      selectionText: '#ffffff',
      highlight: 'rgba(250, 204, 21, 0.3)',
      // Overlays & Shadows
      overlay: 'rgba(15, 10, 26, 0.7)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowStrong: 'rgba(0, 0, 0, 0.5)',
      glow: 'rgba(167, 139, 250, 0.4)',
      // Gradient
      gradientFrom: 'rgba(167, 139, 250, 0.1)',
      gradientVia: 'rgba(129, 140, 248, 0.1)',
      gradientTo: 'rgba(192, 132, 252, 0.1)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#3d2a5c',
      scrollbarThumbHover: '#5b3d8a',
      // Status Bar
      statusBarBackground: '#0c0815',
      statusBarBorder: 'rgba(192, 132, 252, 0.06)',
      statusBarText: '#7c6a9e',
      // Divider
      divider: 'rgba(192, 132, 252, 0.06)',
      dividerStrong: 'rgba(192, 132, 252, 0.18)',
      // Preview
      previewBg: '#0f0a1a',
      previewDeviceBorder: '#2a2040',
      previewDeviceNotch: 'rgba(124, 106, 158, 0.5)',
      previewUrlbarBg: 'rgba(22, 16, 32, 0.95)',
    },
  },

  'ocean-breeze': {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Fresh teal and cyan tones',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#021a1a',
      backgroundElevated: '#082020',
      surface: '#0a2828',
      surfaceHover: '#103838',
      surfaceActive: '#184848',
      surfaceElevated: '#103838',
      // Glass
      glass100: 'rgba(45, 212, 191, 0.05)',
      glass200: 'rgba(45, 212, 191, 0.1)',
      glass300: 'rgba(45, 212, 191, 0.15)',
      glass400: 'rgba(45, 212, 191, 0.2)',
      // Borders
      border: 'rgba(45, 212, 191, 0.12)',
      borderHover: 'rgba(45, 212, 191, 0.25)',
      borderLight: 'rgba(45, 212, 191, 0.06)',
      borderStrong: 'rgba(45, 212, 191, 0.35)',
      // Text
      textPrimary: '#ccfbf1',
      textSecondary: '#5eead4',
      textMuted: '#3a7a70',
      textDim: '#2a5a50',
      textInverse: '#021a1a',
      textOnAccent: '#ffffff',
      textHeading: '#ccfbf1',
      textLink: '#5eead4',
      textLinkHover: '#99f6e4',
      // Primary Accent
      accent: '#2dd4bf',
      accentHover: '#14b8a6',
      accentActive: '#0d9488',
      accentSubtle: 'rgba(45, 212, 191, 0.15)',
      accentMuted: 'rgba(45, 212, 191, 0.3)',
      // Secondary Accent
      secondary: '#22d3ee',
      secondaryHover: '#06b6d4',
      secondarySubtle: 'rgba(34, 211, 238, 0.15)',
      // Tertiary Accent
      tertiary: '#60a5fa',
      tertiaryHover: '#3b82f6',
      tertiarySubtle: 'rgba(96, 165, 250, 0.15)',
      // AI Colors
      aiAccent: '#a78bfa',
      aiAccentHover: '#8b5cf6',
      aiAccentSubtle: 'rgba(167, 139, 250, 0.15)',
      aiSecondary: '#f472b6',
      aiSecondarySubtle: 'rgba(244, 114, 182, 0.15)',
      // Sidebar
      sidebarBackground: '#011515',
      sidebarBorder: 'rgba(45, 212, 191, 0.06)',
      sidebarItemHover: 'rgba(45, 212, 191, 0.1)',
      sidebarItemActive: 'rgba(45, 212, 191, 0.2)',
      // Header
      headerBackground: '#021a1a',
      headerBorder: 'rgba(45, 212, 191, 0.06)',
      headerText: '#ccfbf1',
      // Modal
      modalBackground: '#0a2828',
      modalOverlay: 'rgba(2, 26, 26, 0.8)',
      modalBorder: 'rgba(45, 212, 191, 0.12)',
      modalHeaderBg: '#082020',
      // Input
      inputBackground: '#103838',
      inputBorder: 'rgba(45, 212, 191, 0.12)',
      inputBorderFocus: '#2dd4bf',
      inputPlaceholder: '#3a7a70',
      // Button
      buttonBackground: '#103838',
      buttonBackgroundHover: '#184848',
      buttonBorder: 'rgba(45, 212, 191, 0.12)',
      buttonText: '#ccfbf1',
      // Tooltip
      tooltipBackground: '#103838',
      tooltipText: '#ccfbf1',
      tooltipBorder: 'rgba(45, 212, 191, 0.12)',
      // Badge
      badgeBackground: 'rgba(45, 212, 191, 0.1)',
      badgeText: '#5eead4',
      // Code
      codeBackground: '#082020',
      codeText: '#ccfbf1',
      codeBorder: 'rgba(45, 212, 191, 0.06)',
      lineNumberText: '#3a7a70',
      lineHighlight: 'rgba(45, 212, 191, 0.1)',
      // Interactive
      focusRing: '#2dd4bf',
      focusRingOffset: '#021a1a',
      selection: 'rgba(45, 212, 191, 0.3)',
      selectionText: '#ffffff',
      highlight: 'rgba(250, 204, 21, 0.3)',
      // Overlays & Shadows
      overlay: 'rgba(2, 26, 26, 0.7)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowStrong: 'rgba(0, 0, 0, 0.5)',
      glow: 'rgba(45, 212, 191, 0.4)',
      // Gradient
      gradientFrom: 'rgba(45, 212, 191, 0.1)',
      gradientVia: 'rgba(6, 182, 212, 0.1)',
      gradientTo: 'rgba(34, 211, 238, 0.1)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#1a4040',
      scrollbarThumbHover: '#2a5a5a',
      // Status Bar
      statusBarBackground: '#011515',
      statusBarBorder: 'rgba(45, 212, 191, 0.06)',
      statusBarText: '#3a7a70',
      // Divider
      divider: 'rgba(45, 212, 191, 0.06)',
      dividerStrong: 'rgba(45, 212, 191, 0.18)',
      // Preview
      previewBg: '#021a1a',
      previewDeviceBorder: '#103838',
      previewDeviceNotch: 'rgba(58, 122, 112, 0.5)',
      previewUrlbarBg: 'rgba(8, 32, 32, 0.95)',
    },
  },

  'mint-chocolate': {
    id: 'mint-chocolate',
    name: 'Mint Chocolate',
    description: 'Fresh mint with warm chocolate tones',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#0a1510',
      backgroundElevated: '#101a14',
      surface: '#132218',
      surfaceHover: '#1e3324',
      surfaceActive: '#284430',
      surfaceElevated: '#1e3324',
      // Glass
      glass100: 'rgba(134, 239, 172, 0.05)',
      glass200: 'rgba(134, 239, 172, 0.1)',
      glass300: 'rgba(134, 239, 172, 0.15)',
      glass400: 'rgba(134, 239, 172, 0.2)',
      // Borders
      border: 'rgba(134, 239, 172, 0.12)',
      borderHover: 'rgba(134, 239, 172, 0.25)',
      borderLight: 'rgba(134, 239, 172, 0.06)',
      borderStrong: 'rgba(134, 239, 172, 0.35)',
      // Text
      textPrimary: '#dcfce7',
      textSecondary: '#86efac',
      textMuted: '#4a7a5a',
      textDim: '#3a5a4a',
      textInverse: '#0a1510',
      textOnAccent: '#ffffff',
      textHeading: '#dcfce7',
      textLink: '#86efac',
      textLinkHover: '#bbf7d0',
      // Primary Accent
      accent: '#4ade80',
      accentHover: '#22c55e',
      accentActive: '#16a34a',
      accentSubtle: 'rgba(74, 222, 128, 0.15)',
      accentMuted: 'rgba(74, 222, 128, 0.3)',
      // Secondary Accent
      secondary: '#a78bfa',
      secondaryHover: '#8b5cf6',
      secondarySubtle: 'rgba(167, 139, 250, 0.15)',
      // Tertiary Accent (chocolate warm)
      tertiary: '#d4a574',
      tertiaryHover: '#c08a50',
      tertiarySubtle: 'rgba(212, 165, 116, 0.15)',
      // AI Colors
      aiAccent: '#a78bfa',
      aiAccentHover: '#8b5cf6',
      aiAccentSubtle: 'rgba(167, 139, 250, 0.15)',
      aiSecondary: '#ec4899',
      aiSecondarySubtle: 'rgba(236, 72, 153, 0.15)',
      // Sidebar
      sidebarBackground: '#08100c',
      sidebarBorder: 'rgba(134, 239, 172, 0.06)',
      sidebarItemHover: 'rgba(134, 239, 172, 0.1)',
      sidebarItemActive: 'rgba(74, 222, 128, 0.2)',
      // Header
      headerBackground: '#0a1510',
      headerBorder: 'rgba(134, 239, 172, 0.06)',
      headerText: '#dcfce7',
      // Modal
      modalBackground: '#132218',
      modalOverlay: 'rgba(10, 21, 16, 0.8)',
      modalBorder: 'rgba(134, 239, 172, 0.12)',
      modalHeaderBg: '#101a14',
      // Input
      inputBackground: '#1e3324',
      inputBorder: 'rgba(134, 239, 172, 0.12)',
      inputBorderFocus: '#4ade80',
      inputPlaceholder: '#4a7a5a',
      // Button
      buttonBackground: '#1e3324',
      buttonBackgroundHover: '#284430',
      buttonBorder: 'rgba(134, 239, 172, 0.12)',
      buttonText: '#dcfce7',
      // Tooltip
      tooltipBackground: '#1e3324',
      tooltipText: '#dcfce7',
      tooltipBorder: 'rgba(134, 239, 172, 0.12)',
      // Badge
      badgeBackground: 'rgba(134, 239, 172, 0.1)',
      badgeText: '#86efac',
      // Code
      codeBackground: '#101a14',
      codeText: '#dcfce7',
      codeBorder: 'rgba(134, 239, 172, 0.06)',
      lineNumberText: '#4a7a5a',
      lineHighlight: 'rgba(74, 222, 128, 0.1)',
      // Interactive
      focusRing: '#4ade80',
      focusRingOffset: '#0a1510',
      selection: 'rgba(74, 222, 128, 0.3)',
      selectionText: '#ffffff',
      highlight: 'rgba(250, 204, 21, 0.3)',
      // Overlays & Shadows
      overlay: 'rgba(10, 21, 16, 0.7)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowStrong: 'rgba(0, 0, 0, 0.5)',
      glow: 'rgba(74, 222, 128, 0.4)',
      // Gradient
      gradientFrom: 'rgba(74, 222, 128, 0.1)',
      gradientVia: 'rgba(134, 239, 172, 0.1)',
      gradientTo: 'rgba(180, 130, 100, 0.1)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#2a4a32',
      scrollbarThumbHover: '#3a6a45',
      // Status Bar
      statusBarBackground: '#08100c',
      statusBarBorder: 'rgba(134, 239, 172, 0.06)',
      statusBarText: '#4a7a5a',
      // Divider
      divider: 'rgba(134, 239, 172, 0.06)',
      dividerStrong: 'rgba(134, 239, 172, 0.18)',
      // Preview
      previewBg: '#0a1510',
      previewDeviceBorder: '#1e3324',
      previewDeviceNotch: 'rgba(74, 122, 90, 0.5)',
      previewUrlbarBg: 'rgba(16, 26, 20, 0.95)',
    },
  },

  'sunset-glow': {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm orange and coral tones',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#1a0f05',
      backgroundElevated: '#221408',
      surface: '#2a1a0a',
      surfaceHover: '#3d2510',
      surfaceActive: '#503018',
      surfaceElevated: '#3d2510',
      // Glass
      glass100: 'rgba(251, 146, 60, 0.05)',
      glass200: 'rgba(251, 146, 60, 0.1)',
      glass300: 'rgba(251, 146, 60, 0.15)',
      glass400: 'rgba(251, 146, 60, 0.2)',
      // Borders
      border: 'rgba(251, 146, 60, 0.12)',
      borderHover: 'rgba(251, 146, 60, 0.25)',
      borderLight: 'rgba(251, 146, 60, 0.06)',
      borderStrong: 'rgba(251, 146, 60, 0.35)',
      // Text
      textPrimary: '#ffedd5',
      textSecondary: '#fdba74',
      textMuted: '#9a6530',
      textDim: '#7a4520',
      textInverse: '#1a0f05',
      textOnAccent: '#ffffff',
      textHeading: '#ffedd5',
      textLink: '#fdba74',
      textLinkHover: '#fed7aa',
      // Primary Accent
      accent: '#fb923c',
      accentHover: '#f97316',
      accentActive: '#ea580c',
      accentSubtle: 'rgba(251, 146, 60, 0.15)',
      accentMuted: 'rgba(251, 146, 60, 0.3)',
      // Secondary Accent
      secondary: '#fb7185',
      secondaryHover: '#f43f5e',
      secondarySubtle: 'rgba(251, 113, 133, 0.15)',
      // Tertiary Accent
      tertiary: '#fbbf24',
      tertiaryHover: '#f59e0b',
      tertiarySubtle: 'rgba(251, 191, 36, 0.15)',
      // AI Colors
      aiAccent: '#c084fc',
      aiAccentHover: '#a855f7',
      aiAccentSubtle: 'rgba(192, 132, 252, 0.15)',
      aiSecondary: '#f472b6',
      aiSecondarySubtle: 'rgba(244, 114, 182, 0.15)',
      // Sidebar
      sidebarBackground: '#150c04',
      sidebarBorder: 'rgba(251, 146, 60, 0.06)',
      sidebarItemHover: 'rgba(251, 146, 60, 0.1)',
      sidebarItemActive: 'rgba(251, 146, 60, 0.2)',
      // Header
      headerBackground: '#1a0f05',
      headerBorder: 'rgba(251, 146, 60, 0.06)',
      headerText: '#ffedd5',
      // Modal
      modalBackground: '#2a1a0a',
      modalOverlay: 'rgba(26, 15, 5, 0.8)',
      modalBorder: 'rgba(251, 146, 60, 0.12)',
      modalHeaderBg: '#221408',
      // Input
      inputBackground: '#3d2510',
      inputBorder: 'rgba(251, 146, 60, 0.12)',
      inputBorderFocus: '#fb923c',
      inputPlaceholder: '#9a6530',
      // Button
      buttonBackground: '#3d2510',
      buttonBackgroundHover: '#503018',
      buttonBorder: 'rgba(251, 146, 60, 0.12)',
      buttonText: '#ffedd5',
      // Tooltip
      tooltipBackground: '#3d2510',
      tooltipText: '#ffedd5',
      tooltipBorder: 'rgba(251, 146, 60, 0.12)',
      // Badge
      badgeBackground: 'rgba(251, 146, 60, 0.1)',
      badgeText: '#fdba74',
      // Code
      codeBackground: '#221408',
      codeText: '#ffedd5',
      codeBorder: 'rgba(251, 146, 60, 0.06)',
      lineNumberText: '#9a6530',
      lineHighlight: 'rgba(251, 146, 60, 0.1)',
      // Interactive
      focusRing: '#fb923c',
      focusRingOffset: '#1a0f05',
      selection: 'rgba(251, 146, 60, 0.3)',
      selectionText: '#ffffff',
      highlight: 'rgba(250, 204, 21, 0.3)',
      // Overlays & Shadows
      overlay: 'rgba(26, 15, 5, 0.7)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowStrong: 'rgba(0, 0, 0, 0.5)',
      glow: 'rgba(251, 146, 60, 0.4)',
      // Gradient
      gradientFrom: 'rgba(251, 146, 60, 0.1)',
      gradientVia: 'rgba(249, 115, 22, 0.1)',
      gradientTo: 'rgba(251, 113, 133, 0.1)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#4a3020',
      scrollbarThumbHover: '#6a4530',
      // Status Bar
      statusBarBackground: '#150c04',
      statusBarBorder: 'rgba(251, 146, 60, 0.06)',
      statusBarText: '#9a6530',
      // Divider
      divider: 'rgba(251, 146, 60, 0.06)',
      dividerStrong: 'rgba(251, 146, 60, 0.18)',
      // Preview
      previewBg: '#1a0f05',
      previewDeviceBorder: '#3d2510',
      previewDeviceNotch: 'rgba(154, 101, 48, 0.5)',
      previewUrlbarBg: 'rgba(34, 20, 8, 0.95)',
    },
  },

  'cotton-candy': {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    description: 'Sweet pink and blue pastels',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#100818',
      backgroundElevated: '#160c20',
      surface: '#1a1025',
      surfaceHover: '#281838',
      surfaceActive: '#38204a',
      surfaceElevated: '#281838',
      // Glass
      glass100: 'rgba(236, 72, 153, 0.05)',
      glass200: 'rgba(236, 72, 153, 0.08)',
      glass300: 'rgba(129, 140, 248, 0.1)',
      glass400: 'rgba(236, 72, 153, 0.15)',
      // Borders
      border: 'rgba(236, 72, 153, 0.15)',
      borderHover: 'rgba(129, 140, 248, 0.25)',
      borderLight: 'rgba(236, 72, 153, 0.08)',
      borderStrong: 'rgba(236, 72, 153, 0.35)',
      // Text
      textPrimary: '#fce7f3',
      textSecondary: '#f9a8d4',
      textMuted: '#8b5a80',
      textDim: '#6b3a60',
      textInverse: '#100818',
      textOnAccent: '#ffffff',
      textHeading: '#fce7f3',
      textLink: '#f9a8d4',
      textLinkHover: '#fbcfe8',
      // Primary Accent
      accent: '#ec4899',
      accentHover: '#db2777',
      accentActive: '#be185d',
      accentSubtle: 'rgba(236, 72, 153, 0.15)',
      accentMuted: 'rgba(236, 72, 153, 0.3)',
      // Secondary Accent
      secondary: '#818cf8',
      secondaryHover: '#6366f1',
      secondarySubtle: 'rgba(129, 140, 248, 0.15)',
      // Tertiary Accent
      tertiary: '#22d3ee',
      tertiaryHover: '#06b6d4',
      tertiarySubtle: 'rgba(34, 211, 238, 0.15)',
      // AI Colors
      aiAccent: '#a78bfa',
      aiAccentHover: '#8b5cf6',
      aiAccentSubtle: 'rgba(167, 139, 250, 0.15)',
      aiSecondary: '#818cf8',
      aiSecondarySubtle: 'rgba(129, 140, 248, 0.15)',
      // Sidebar
      sidebarBackground: '#0c0610',
      sidebarBorder: 'rgba(236, 72, 153, 0.08)',
      sidebarItemHover: 'rgba(236, 72, 153, 0.1)',
      sidebarItemActive: 'rgba(236, 72, 153, 0.2)',
      // Header
      headerBackground: '#100818',
      headerBorder: 'rgba(236, 72, 153, 0.08)',
      headerText: '#fce7f3',
      // Modal
      modalBackground: '#1a1025',
      modalOverlay: 'rgba(16, 8, 24, 0.8)',
      modalBorder: 'rgba(236, 72, 153, 0.15)',
      modalHeaderBg: '#160c20',
      // Input
      inputBackground: '#281838',
      inputBorder: 'rgba(236, 72, 153, 0.15)',
      inputBorderFocus: '#ec4899',
      inputPlaceholder: '#8b5a80',
      // Button
      buttonBackground: '#281838',
      buttonBackgroundHover: '#38204a',
      buttonBorder: 'rgba(236, 72, 153, 0.15)',
      buttonText: '#fce7f3',
      // Tooltip
      tooltipBackground: '#281838',
      tooltipText: '#fce7f3',
      tooltipBorder: 'rgba(236, 72, 153, 0.15)',
      // Badge
      badgeBackground: 'rgba(236, 72, 153, 0.1)',
      badgeText: '#f9a8d4',
      // Code
      codeBackground: '#160c20',
      codeText: '#fce7f3',
      codeBorder: 'rgba(236, 72, 153, 0.08)',
      lineNumberText: '#8b5a80',
      lineHighlight: 'rgba(236, 72, 153, 0.1)',
      // Interactive
      focusRing: '#ec4899',
      focusRingOffset: '#100818',
      selection: 'rgba(236, 72, 153, 0.3)',
      selectionText: '#ffffff',
      highlight: 'rgba(250, 204, 21, 0.3)',
      // Overlays & Shadows
      overlay: 'rgba(16, 8, 24, 0.7)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowStrong: 'rgba(0, 0, 0, 0.5)',
      glow: 'rgba(236, 72, 153, 0.4)',
      // Gradient
      gradientFrom: 'rgba(236, 72, 153, 0.15)',
      gradientVia: 'rgba(167, 139, 250, 0.1)',
      gradientTo: 'rgba(129, 140, 248, 0.15)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#3a2050',
      scrollbarThumbHover: '#5a3070',
      // Status Bar
      statusBarBackground: '#0c0610',
      statusBarBorder: 'rgba(236, 72, 153, 0.08)',
      statusBarText: '#8b5a80',
      // Divider
      divider: 'rgba(236, 72, 153, 0.08)',
      dividerStrong: 'rgba(236, 72, 153, 0.2)',
      // Preview
      previewBg: '#100818',
      previewDeviceBorder: '#281838',
      previewDeviceNotch: 'rgba(139, 90, 128, 0.5)',
      previewUrlbarBg: 'rgba(22, 12, 32, 0.95)',
    },
  },

  'aurora-borealis': {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    description: 'Northern lights green and purple',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#030a10',
      backgroundElevated: '#081218',
      surface: '#0a1820',
      surfaceHover: '#102530',
      surfaceActive: '#183540',
      surfaceElevated: '#102530',
      // Glass
      glass100: 'rgba(52, 211, 153, 0.05)',
      glass200: 'rgba(52, 211, 153, 0.08)',
      glass300: 'rgba(167, 139, 250, 0.1)',
      glass400: 'rgba(52, 211, 153, 0.15)',
      // Borders
      border: 'rgba(52, 211, 153, 0.12)',
      borderHover: 'rgba(167, 139, 250, 0.25)',
      borderLight: 'rgba(52, 211, 153, 0.06)',
      borderStrong: 'rgba(52, 211, 153, 0.3)',
      // Text
      textPrimary: '#d1fae5',
      textSecondary: '#6ee7b7',
      textMuted: '#4a8070',
      textDim: '#3a6050',
      textInverse: '#030a10',
      textOnAccent: '#ffffff',
      textHeading: '#d1fae5',
      textLink: '#6ee7b7',
      textLinkHover: '#a7f3d0',
      // Primary Accent
      accent: '#34d399',
      accentHover: '#10b981',
      accentActive: '#059669',
      accentSubtle: 'rgba(52, 211, 153, 0.15)',
      accentMuted: 'rgba(52, 211, 153, 0.3)',
      // Secondary Accent
      secondary: '#a78bfa',
      secondaryHover: '#8b5cf6',
      secondarySubtle: 'rgba(167, 139, 250, 0.15)',
      // Tertiary Accent
      tertiary: '#22d3ee',
      tertiaryHover: '#06b6d4',
      tertiarySubtle: 'rgba(34, 211, 238, 0.15)',
      // AI Colors
      aiAccent: '#a78bfa',
      aiAccentHover: '#8b5cf6',
      aiAccentSubtle: 'rgba(167, 139, 250, 0.15)',
      aiSecondary: '#c084fc',
      aiSecondarySubtle: 'rgba(192, 132, 252, 0.15)',
      // Sidebar
      sidebarBackground: '#02080c',
      sidebarBorder: 'rgba(52, 211, 153, 0.06)',
      sidebarItemHover: 'rgba(52, 211, 153, 0.1)',
      sidebarItemActive: 'rgba(52, 211, 153, 0.2)',
      // Header
      headerBackground: '#030a10',
      headerBorder: 'rgba(52, 211, 153, 0.06)',
      headerText: '#d1fae5',
      // Modal
      modalBackground: '#0a1820',
      modalOverlay: 'rgba(3, 10, 16, 0.8)',
      modalBorder: 'rgba(52, 211, 153, 0.12)',
      modalHeaderBg: '#081218',
      // Input
      inputBackground: '#102530',
      inputBorder: 'rgba(52, 211, 153, 0.12)',
      inputBorderFocus: '#34d399',
      inputPlaceholder: '#4a8070',
      // Button
      buttonBackground: '#102530',
      buttonBackgroundHover: '#183540',
      buttonBorder: 'rgba(52, 211, 153, 0.12)',
      buttonText: '#d1fae5',
      // Tooltip
      tooltipBackground: '#102530',
      tooltipText: '#d1fae5',
      tooltipBorder: 'rgba(52, 211, 153, 0.12)',
      // Badge
      badgeBackground: 'rgba(52, 211, 153, 0.1)',
      badgeText: '#6ee7b7',
      // Code
      codeBackground: '#081218',
      codeText: '#d1fae5',
      codeBorder: 'rgba(52, 211, 153, 0.06)',
      lineNumberText: '#4a8070',
      lineHighlight: 'rgba(52, 211, 153, 0.1)',
      // Interactive
      focusRing: '#34d399',
      focusRingOffset: '#030a10',
      selection: 'rgba(52, 211, 153, 0.3)',
      selectionText: '#ffffff',
      highlight: 'rgba(250, 204, 21, 0.3)',
      // Overlays & Shadows
      overlay: 'rgba(3, 10, 16, 0.7)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowStrong: 'rgba(0, 0, 0, 0.5)',
      glow: 'rgba(52, 211, 153, 0.4)',
      // Gradient
      gradientFrom: 'rgba(52, 211, 153, 0.1)',
      gradientVia: 'rgba(110, 175, 150, 0.1)',
      gradientTo: 'rgba(167, 139, 250, 0.15)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#1a3040',
      scrollbarThumbHover: '#2a4a5a',
      // Status Bar
      statusBarBackground: '#02080c',
      statusBarBorder: 'rgba(52, 211, 153, 0.06)',
      statusBarText: '#4a8070',
      // Divider
      divider: 'rgba(52, 211, 153, 0.06)',
      dividerStrong: 'rgba(52, 211, 153, 0.18)',
      // Preview
      previewBg: '#030a10',
      previewDeviceBorder: '#102530',
      previewDeviceNotch: 'rgba(74, 128, 112, 0.5)',
      previewUrlbarBg: 'rgba(8, 18, 24, 0.95)',
    },
  },

  'cyber-neon': {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    description: 'Cyberpunk neon pink and cyan',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#0a0a12',
      backgroundElevated: '#12121f',
      surface: '#16162a',
      surfaceHover: '#1f1f3a',
      surfaceActive: '#28284a',
      surfaceElevated: '#1f1f3a',
      // Glass
      glass100: 'rgba(236, 72, 153, 0.05)',
      glass200: 'rgba(6, 182, 212, 0.08)',
      glass300: 'rgba(236, 72, 153, 0.12)',
      glass400: 'rgba(6, 182, 212, 0.18)',
      // Borders
      border: 'rgba(6, 182, 212, 0.2)',
      borderHover: 'rgba(236, 72, 153, 0.35)',
      borderLight: 'rgba(6, 182, 212, 0.1)',
      borderStrong: 'rgba(236, 72, 153, 0.5)',
      // Text
      textPrimary: '#e0f2fe',
      textSecondary: '#67e8f9',
      textMuted: '#4a7a8a',
      textDim: '#3a5a6a',
      textInverse: '#0a0a12',
      textOnAccent: '#ffffff',
      textHeading: '#f0abfc',
      textLink: '#22d3ee',
      textLinkHover: '#67e8f9',
      // Primary Accent
      accent: '#ec4899',
      accentHover: '#db2777',
      accentActive: '#be185d',
      accentSubtle: 'rgba(236, 72, 153, 0.2)',
      accentMuted: 'rgba(236, 72, 153, 0.4)',
      // Secondary Accent
      secondary: '#06b6d4',
      secondaryHover: '#0891b2',
      secondarySubtle: 'rgba(6, 182, 212, 0.2)',
      // Tertiary Accent
      tertiary: '#a855f7',
      tertiaryHover: '#9333ea',
      tertiarySubtle: 'rgba(168, 85, 247, 0.2)',
      // AI Colors
      aiAccent: '#f0abfc',
      aiAccentHover: '#e879f9',
      aiAccentSubtle: 'rgba(240, 171, 252, 0.15)',
      aiSecondary: '#22d3ee',
      aiSecondarySubtle: 'rgba(34, 211, 238, 0.15)',
      // Sidebar
      sidebarBackground: '#08080f',
      sidebarBorder: 'rgba(6, 182, 212, 0.1)',
      sidebarItemHover: 'rgba(236, 72, 153, 0.15)',
      sidebarItemActive: 'rgba(6, 182, 212, 0.25)',
      // Header
      headerBackground: '#0a0a12',
      headerBorder: 'rgba(236, 72, 153, 0.15)',
      headerText: '#e0f2fe',
      // Modal
      modalBackground: '#16162a',
      modalOverlay: 'rgba(10, 10, 18, 0.85)',
      modalBorder: 'rgba(6, 182, 212, 0.2)',
      modalHeaderBg: '#12121f',
      // Input
      inputBackground: '#1f1f3a',
      inputBorder: 'rgba(6, 182, 212, 0.2)',
      inputBorderFocus: '#ec4899',
      inputPlaceholder: '#4a7a8a',
      // Button
      buttonBackground: '#1f1f3a',
      buttonBackgroundHover: '#28284a',
      buttonBorder: 'rgba(236, 72, 153, 0.25)',
      buttonText: '#e0f2fe',
      // Tooltip
      tooltipBackground: '#1f1f3a',
      tooltipText: '#e0f2fe',
      tooltipBorder: 'rgba(6, 182, 212, 0.2)',
      // Badge
      badgeBackground: 'rgba(236, 72, 153, 0.15)',
      badgeText: '#f0abfc',
      // Code
      codeBackground: '#12121f',
      codeText: '#e0f2fe',
      codeBorder: 'rgba(6, 182, 212, 0.1)',
      lineNumberText: '#4a7a8a',
      lineHighlight: 'rgba(236, 72, 153, 0.1)',
      // Interactive
      focusRing: '#ec4899',
      focusRingOffset: '#0a0a12',
      selection: 'rgba(6, 182, 212, 0.35)',
      selectionText: '#ffffff',
      highlight: 'rgba(250, 204, 21, 0.35)',
      // Overlays & Shadows
      overlay: 'rgba(10, 10, 18, 0.8)',
      shadow: 'rgba(0, 0, 0, 0.4)',
      shadowStrong: 'rgba(0, 0, 0, 0.6)',
      glow: 'rgba(236, 72, 153, 0.5)',
      // Gradient
      gradientFrom: 'rgba(236, 72, 153, 0.15)',
      gradientVia: 'rgba(168, 85, 247, 0.1)',
      gradientTo: 'rgba(6, 182, 212, 0.15)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#28284a',
      scrollbarThumbHover: '#3a3a5a',
      // Status Bar
      statusBarBackground: '#08080f',
      statusBarBorder: 'rgba(6, 182, 212, 0.1)',
      statusBarText: '#4a7a8a',
      // Divider
      divider: 'rgba(6, 182, 212, 0.1)',
      dividerStrong: 'rgba(236, 72, 153, 0.25)',
      // Preview
      previewBg: '#0a0a12',
      previewDeviceBorder: '#1f1f3a',
      previewDeviceNotch: 'rgba(74, 122, 138, 0.5)',
      previewUrlbarBg: 'rgba(18, 18, 31, 0.95)',
    },
  },

  'forest-night': {
    id: 'forest-night',
    name: 'Forest Night',
    description: 'Deep forest greens and earth tones',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#0c1210',
      backgroundElevated: '#121a16',
      surface: '#16221c',
      surfaceHover: '#1e3028',
      surfaceActive: '#264035',
      surfaceElevated: '#1e3028',
      // Glass
      glass100: 'rgba(74, 222, 128, 0.05)',
      glass200: 'rgba(74, 222, 128, 0.1)',
      glass300: 'rgba(74, 222, 128, 0.15)',
      glass400: 'rgba(74, 222, 128, 0.2)',
      // Borders
      border: 'rgba(74, 222, 128, 0.12)',
      borderHover: 'rgba(74, 222, 128, 0.25)',
      borderLight: 'rgba(74, 222, 128, 0.06)',
      borderStrong: 'rgba(74, 222, 128, 0.35)',
      // Text
      textPrimary: '#dcfce7',
      textSecondary: '#86efac',
      textMuted: '#4a7a5a',
      textDim: '#3a5a4a',
      textInverse: '#0c1210',
      textOnAccent: '#ffffff',
      textHeading: '#bbf7d0',
      textLink: '#4ade80',
      textLinkHover: '#86efac',
      // Primary Accent
      accent: '#22c55e',
      accentHover: '#16a34a',
      accentActive: '#15803d',
      accentSubtle: 'rgba(34, 197, 94, 0.15)',
      accentMuted: 'rgba(34, 197, 94, 0.3)',
      // Secondary Accent
      secondary: '#a3e635',
      secondaryHover: '#84cc16',
      secondarySubtle: 'rgba(163, 230, 53, 0.15)',
      // Tertiary Accent
      tertiary: '#fbbf24',
      tertiaryHover: '#f59e0b',
      tertiarySubtle: 'rgba(251, 191, 36, 0.15)',
      // AI Colors
      aiAccent: '#34d399',
      aiAccentHover: '#10b981',
      aiAccentSubtle: 'rgba(52, 211, 153, 0.15)',
      aiSecondary: '#a3e635',
      aiSecondarySubtle: 'rgba(163, 230, 53, 0.15)',
      // Sidebar
      sidebarBackground: '#0a0f0c',
      sidebarBorder: 'rgba(74, 222, 128, 0.06)',
      sidebarItemHover: 'rgba(74, 222, 128, 0.1)',
      sidebarItemActive: 'rgba(34, 197, 94, 0.2)',
      // Header
      headerBackground: '#0c1210',
      headerBorder: 'rgba(74, 222, 128, 0.06)',
      headerText: '#dcfce7',
      // Modal
      modalBackground: '#16221c',
      modalOverlay: 'rgba(12, 18, 16, 0.8)',
      modalBorder: 'rgba(74, 222, 128, 0.12)',
      modalHeaderBg: '#121a16',
      // Input
      inputBackground: '#1e3028',
      inputBorder: 'rgba(74, 222, 128, 0.12)',
      inputBorderFocus: '#22c55e',
      inputPlaceholder: '#4a7a5a',
      // Button
      buttonBackground: '#1e3028',
      buttonBackgroundHover: '#264035',
      buttonBorder: 'rgba(74, 222, 128, 0.12)',
      buttonText: '#dcfce7',
      // Tooltip
      tooltipBackground: '#1e3028',
      tooltipText: '#dcfce7',
      tooltipBorder: 'rgba(74, 222, 128, 0.12)',
      // Badge
      badgeBackground: 'rgba(74, 222, 128, 0.1)',
      badgeText: '#86efac',
      // Code
      codeBackground: '#121a16',
      codeText: '#dcfce7',
      codeBorder: 'rgba(74, 222, 128, 0.06)',
      lineNumberText: '#4a7a5a',
      lineHighlight: 'rgba(34, 197, 94, 0.1)',
      // Interactive
      focusRing: '#22c55e',
      focusRingOffset: '#0c1210',
      selection: 'rgba(34, 197, 94, 0.3)',
      selectionText: '#ffffff',
      highlight: 'rgba(250, 204, 21, 0.3)',
      // Overlays & Shadows
      overlay: 'rgba(12, 18, 16, 0.7)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowStrong: 'rgba(0, 0, 0, 0.5)',
      glow: 'rgba(34, 197, 94, 0.4)',
      // Gradient
      gradientFrom: 'rgba(34, 197, 94, 0.1)',
      gradientVia: 'rgba(74, 222, 128, 0.08)',
      gradientTo: 'rgba(163, 230, 53, 0.1)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#264035',
      scrollbarThumbHover: '#366048',
      // Status Bar
      statusBarBackground: '#0a0f0c',
      statusBarBorder: 'rgba(74, 222, 128, 0.06)',
      statusBarText: '#4a7a5a',
      // Divider
      divider: 'rgba(74, 222, 128, 0.06)',
      dividerStrong: 'rgba(74, 222, 128, 0.18)',
      // Preview
      previewBg: '#0c1210',
      previewDeviceBorder: '#1e3028',
      previewDeviceNotch: 'rgba(74, 122, 90, 0.5)',
      previewUrlbarBg: 'rgba(18, 26, 22, 0.95)',
    },
  },

  'deep-ocean': {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    description: 'Mysterious deep blue ocean depths',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#020812',
      backgroundElevated: '#061020',
      surface: '#081528',
      surfaceHover: '#0c2040',
      surfaceActive: '#102a50',
      surfaceElevated: '#0c2040',
      // Glass
      glass100: 'rgba(56, 189, 248, 0.05)',
      glass200: 'rgba(56, 189, 248, 0.1)',
      glass300: 'rgba(56, 189, 248, 0.15)',
      glass400: 'rgba(56, 189, 248, 0.2)',
      // Borders
      border: 'rgba(56, 189, 248, 0.12)',
      borderHover: 'rgba(56, 189, 248, 0.25)',
      borderLight: 'rgba(56, 189, 248, 0.06)',
      borderStrong: 'rgba(56, 189, 248, 0.35)',
      // Text
      textPrimary: '#e0f2fe',
      textSecondary: '#7dd3fc',
      textMuted: '#3a6a8a',
      textDim: '#2a4a6a',
      textInverse: '#020812',
      textOnAccent: '#ffffff',
      textHeading: '#bae6fd',
      textLink: '#38bdf8',
      textLinkHover: '#7dd3fc',
      // Primary Accent
      accent: '#0ea5e9',
      accentHover: '#0284c7',
      accentActive: '#0369a1',
      accentSubtle: 'rgba(14, 165, 233, 0.15)',
      accentMuted: 'rgba(14, 165, 233, 0.3)',
      // Secondary Accent
      secondary: '#06b6d4',
      secondaryHover: '#0891b2',
      secondarySubtle: 'rgba(6, 182, 212, 0.15)',
      // Tertiary Accent
      tertiary: '#818cf8',
      tertiaryHover: '#6366f1',
      tertiarySubtle: 'rgba(129, 140, 248, 0.15)',
      // AI Colors
      aiAccent: '#a78bfa',
      aiAccentHover: '#8b5cf6',
      aiAccentSubtle: 'rgba(167, 139, 250, 0.15)',
      aiSecondary: '#38bdf8',
      aiSecondarySubtle: 'rgba(56, 189, 248, 0.15)',
      // Sidebar
      sidebarBackground: '#010610',
      sidebarBorder: 'rgba(56, 189, 248, 0.06)',
      sidebarItemHover: 'rgba(56, 189, 248, 0.1)',
      sidebarItemActive: 'rgba(14, 165, 233, 0.2)',
      // Header
      headerBackground: '#020812',
      headerBorder: 'rgba(56, 189, 248, 0.06)',
      headerText: '#e0f2fe',
      // Modal
      modalBackground: '#081528',
      modalOverlay: 'rgba(2, 8, 18, 0.8)',
      modalBorder: 'rgba(56, 189, 248, 0.12)',
      modalHeaderBg: '#061020',
      // Input
      inputBackground: '#0c2040',
      inputBorder: 'rgba(56, 189, 248, 0.12)',
      inputBorderFocus: '#0ea5e9',
      inputPlaceholder: '#3a6a8a',
      // Button
      buttonBackground: '#0c2040',
      buttonBackgroundHover: '#102a50',
      buttonBorder: 'rgba(56, 189, 248, 0.12)',
      buttonText: '#e0f2fe',
      // Tooltip
      tooltipBackground: '#0c2040',
      tooltipText: '#e0f2fe',
      tooltipBorder: 'rgba(56, 189, 248, 0.12)',
      // Badge
      badgeBackground: 'rgba(56, 189, 248, 0.1)',
      badgeText: '#7dd3fc',
      // Code
      codeBackground: '#061020',
      codeText: '#e0f2fe',
      codeBorder: 'rgba(56, 189, 248, 0.06)',
      lineNumberText: '#3a6a8a',
      lineHighlight: 'rgba(14, 165, 233, 0.1)',
      // Interactive
      focusRing: '#0ea5e9',
      focusRingOffset: '#020812',
      selection: 'rgba(14, 165, 233, 0.3)',
      selectionText: '#ffffff',
      highlight: 'rgba(250, 204, 21, 0.3)',
      // Overlays & Shadows
      overlay: 'rgba(2, 8, 18, 0.7)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowStrong: 'rgba(0, 0, 0, 0.5)',
      glow: 'rgba(14, 165, 233, 0.4)',
      // Gradient
      gradientFrom: 'rgba(14, 165, 233, 0.1)',
      gradientVia: 'rgba(6, 182, 212, 0.08)',
      gradientTo: 'rgba(56, 189, 248, 0.1)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#102a50',
      scrollbarThumbHover: '#1a3a60',
      // Status Bar
      statusBarBackground: '#010610',
      statusBarBorder: 'rgba(56, 189, 248, 0.06)',
      statusBarText: '#3a6a8a',
      // Divider
      divider: 'rgba(56, 189, 248, 0.06)',
      dividerStrong: 'rgba(56, 189, 248, 0.18)',
      // Preview
      previewBg: '#020812',
      previewDeviceBorder: '#0c2040',
      previewDeviceNotch: 'rgba(58, 106, 138, 0.5)',
      previewUrlbarBg: 'rgba(6, 16, 32, 0.95)',
    },
  },

  'volcanic-ember': {
    id: 'volcanic-ember',
    name: 'Volcanic Ember',
    description: 'Fiery red and orange volcanic tones',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#120808',
      backgroundElevated: '#1a0c0c',
      surface: '#221010',
      surfaceHover: '#351818',
      surfaceActive: '#452020',
      surfaceElevated: '#351818',
      // Glass
      glass100: 'rgba(239, 68, 68, 0.05)',
      glass200: 'rgba(239, 68, 68, 0.1)',
      glass300: 'rgba(239, 68, 68, 0.15)',
      glass400: 'rgba(239, 68, 68, 0.2)',
      // Borders
      border: 'rgba(239, 68, 68, 0.15)',
      borderHover: 'rgba(239, 68, 68, 0.3)',
      borderLight: 'rgba(239, 68, 68, 0.08)',
      borderStrong: 'rgba(239, 68, 68, 0.4)',
      // Text
      textPrimary: '#fef2f2',
      textSecondary: '#fca5a5',
      textMuted: '#9a5050',
      textDim: '#7a3535',
      textInverse: '#120808',
      textOnAccent: '#ffffff',
      textHeading: '#fecaca',
      textLink: '#f87171',
      textLinkHover: '#fca5a5',
      // Primary Accent
      accent: '#ef4444',
      accentHover: '#dc2626',
      accentActive: '#b91c1c',
      accentSubtle: 'rgba(239, 68, 68, 0.15)',
      accentMuted: 'rgba(239, 68, 68, 0.3)',
      // Secondary Accent
      secondary: '#f97316',
      secondaryHover: '#ea580c',
      secondarySubtle: 'rgba(249, 115, 22, 0.15)',
      // Tertiary Accent
      tertiary: '#fbbf24',
      tertiaryHover: '#f59e0b',
      tertiarySubtle: 'rgba(251, 191, 36, 0.15)',
      // AI Colors
      aiAccent: '#fb923c',
      aiAccentHover: '#f97316',
      aiAccentSubtle: 'rgba(251, 146, 60, 0.15)',
      aiSecondary: '#fbbf24',
      aiSecondarySubtle: 'rgba(251, 191, 36, 0.15)',
      // Sidebar
      sidebarBackground: '#0f0606',
      sidebarBorder: 'rgba(239, 68, 68, 0.08)',
      sidebarItemHover: 'rgba(239, 68, 68, 0.12)',
      sidebarItemActive: 'rgba(239, 68, 68, 0.2)',
      // Header
      headerBackground: '#120808',
      headerBorder: 'rgba(239, 68, 68, 0.08)',
      headerText: '#fef2f2',
      // Modal
      modalBackground: '#221010',
      modalOverlay: 'rgba(18, 8, 8, 0.85)',
      modalBorder: 'rgba(239, 68, 68, 0.15)',
      modalHeaderBg: '#1a0c0c',
      // Input
      inputBackground: '#351818',
      inputBorder: 'rgba(239, 68, 68, 0.15)',
      inputBorderFocus: '#ef4444',
      inputPlaceholder: '#9a5050',
      // Button
      buttonBackground: '#351818',
      buttonBackgroundHover: '#452020',
      buttonBorder: 'rgba(239, 68, 68, 0.15)',
      buttonText: '#fef2f2',
      // Tooltip
      tooltipBackground: '#351818',
      tooltipText: '#fef2f2',
      tooltipBorder: 'rgba(239, 68, 68, 0.15)',
      // Badge
      badgeBackground: 'rgba(239, 68, 68, 0.12)',
      badgeText: '#fca5a5',
      // Code
      codeBackground: '#1a0c0c',
      codeText: '#fef2f2',
      codeBorder: 'rgba(239, 68, 68, 0.08)',
      lineNumberText: '#9a5050',
      lineHighlight: 'rgba(239, 68, 68, 0.1)',
      // Interactive
      focusRing: '#ef4444',
      focusRingOffset: '#120808',
      selection: 'rgba(239, 68, 68, 0.3)',
      selectionText: '#ffffff',
      highlight: 'rgba(250, 204, 21, 0.3)',
      // Overlays & Shadows
      overlay: 'rgba(18, 8, 8, 0.75)',
      shadow: 'rgba(0, 0, 0, 0.35)',
      shadowStrong: 'rgba(0, 0, 0, 0.55)',
      glow: 'rgba(239, 68, 68, 0.45)',
      // Gradient
      gradientFrom: 'rgba(239, 68, 68, 0.12)',
      gradientVia: 'rgba(249, 115, 22, 0.1)',
      gradientTo: 'rgba(251, 191, 36, 0.1)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#402020',
      scrollbarThumbHover: '#553030',
      // Status Bar
      statusBarBackground: '#0f0606',
      statusBarBorder: 'rgba(239, 68, 68, 0.08)',
      statusBarText: '#9a5050',
      // Divider
      divider: 'rgba(239, 68, 68, 0.08)',
      dividerStrong: 'rgba(239, 68, 68, 0.2)',
      // Preview
      previewBg: '#120808',
      previewDeviceBorder: '#351818',
      previewDeviceNotch: 'rgba(154, 80, 80, 0.5)',
      previewUrlbarBg: 'rgba(26, 12, 12, 0.95)',
    },
  },

  'monochrome-dark': {
    id: 'monochrome-dark',
    name: 'Monochrome Dark',
    description: 'Pure black, white, and gray tones',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#000000',
      backgroundElevated: '#0a0a0a',
      surface: '#111111',
      surfaceHover: '#1a1a1a',
      surfaceActive: '#242424',
      surfaceElevated: '#1a1a1a',
      // Glass
      glass100: 'rgba(255, 255, 255, 0.03)',
      glass200: 'rgba(255, 255, 255, 0.06)',
      glass300: 'rgba(255, 255, 255, 0.09)',
      glass400: 'rgba(255, 255, 255, 0.12)',
      // Borders
      border: 'rgba(255, 255, 255, 0.12)',
      borderHover: 'rgba(255, 255, 255, 0.2)',
      borderLight: 'rgba(255, 255, 255, 0.06)',
      borderStrong: 'rgba(255, 255, 255, 0.3)',
      // Text
      textPrimary: '#ffffff',
      textSecondary: '#a0a0a0',
      textMuted: '#666666',
      textDim: '#444444',
      textInverse: '#000000',
      textOnAccent: '#000000',
      textHeading: '#ffffff',
      textLink: '#ffffff',
      textLinkHover: '#cccccc',
      // Primary Accent
      accent: '#ffffff',
      accentHover: '#e0e0e0',
      accentActive: '#c0c0c0',
      accentSubtle: 'rgba(255, 255, 255, 0.1)',
      accentMuted: 'rgba(255, 255, 255, 0.2)',
      // Secondary Accent
      secondary: '#888888',
      secondaryHover: '#999999',
      secondarySubtle: 'rgba(136, 136, 136, 0.15)',
      // Tertiary Accent
      tertiary: '#555555',
      tertiaryHover: '#666666',
      tertiarySubtle: 'rgba(85, 85, 85, 0.15)',
      // AI Colors
      aiAccent: '#ffffff',
      aiAccentHover: '#e0e0e0',
      aiAccentSubtle: 'rgba(255, 255, 255, 0.1)',
      aiSecondary: '#888888',
      aiSecondarySubtle: 'rgba(136, 136, 136, 0.15)',
      // Sidebar
      sidebarBackground: '#050505',
      sidebarBorder: 'rgba(255, 255, 255, 0.06)',
      sidebarItemHover: 'rgba(255, 255, 255, 0.08)',
      sidebarItemActive: 'rgba(255, 255, 255, 0.12)',
      // Header
      headerBackground: '#000000',
      headerBorder: 'rgba(255, 255, 255, 0.06)',
      headerText: '#ffffff',
      // Modal
      modalBackground: '#111111',
      modalOverlay: 'rgba(0, 0, 0, 0.85)',
      modalBorder: 'rgba(255, 255, 255, 0.12)',
      modalHeaderBg: '#0a0a0a',
      // Input
      inputBackground: '#1a1a1a',
      inputBorder: 'rgba(255, 255, 255, 0.12)',
      inputBorderFocus: '#ffffff',
      inputPlaceholder: '#555555',
      // Button
      buttonBackground: '#1a1a1a',
      buttonBackgroundHover: '#242424',
      buttonBorder: 'rgba(255, 255, 255, 0.12)',
      buttonText: '#ffffff',
      // Tooltip
      tooltipBackground: '#1a1a1a',
      tooltipText: '#ffffff',
      tooltipBorder: 'rgba(255, 255, 255, 0.12)',
      // Badge
      badgeBackground: 'rgba(255, 255, 255, 0.1)',
      badgeText: '#a0a0a0',
      // Code
      codeBackground: '#0a0a0a',
      codeText: '#ffffff',
      codeBorder: 'rgba(255, 255, 255, 0.06)',
      lineNumberText: '#555555',
      lineHighlight: 'rgba(255, 255, 255, 0.05)',
      // Interactive
      focusRing: '#ffffff',
      focusRingOffset: '#000000',
      selection: 'rgba(255, 255, 255, 0.2)',
      selectionText: '#ffffff',
      highlight: 'rgba(255, 255, 255, 0.15)',
      // Overlays & Shadows
      overlay: 'rgba(0, 0, 0, 0.8)',
      shadow: 'rgba(0, 0, 0, 0.5)',
      shadowStrong: 'rgba(0, 0, 0, 0.7)',
      glow: 'rgba(255, 255, 255, 0.2)',
      // Gradient
      gradientFrom: 'rgba(255, 255, 255, 0.03)',
      gradientVia: 'rgba(255, 255, 255, 0.02)',
      gradientTo: 'rgba(255, 255, 255, 0.03)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#333333',
      scrollbarThumbHover: '#444444',
      // Status Bar
      statusBarBackground: '#050505',
      statusBarBorder: 'rgba(255, 255, 255, 0.06)',
      statusBarText: '#666666',
      // Divider
      divider: 'rgba(255, 255, 255, 0.06)',
      dividerStrong: 'rgba(255, 255, 255, 0.15)',
      // Preview
      previewBg: '#000000',
      previewDeviceBorder: '#1a1a1a',
      previewDeviceNotch: 'rgba(102, 102, 102, 0.5)',
      previewUrlbarBg: 'rgba(10, 10, 10, 0.95)',
    },
  },

  'obsidian': {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Volcanic glass with deep purple undertones',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#0d0a12',
      backgroundElevated: '#12101a',
      surface: '#161322',
      surfaceHover: '#1e1a2e',
      surfaceActive: '#26223a',
      surfaceElevated: '#1e1a2e',
      // Glass
      glass100: 'rgba(138, 120, 180, 0.04)',
      glass200: 'rgba(138, 120, 180, 0.08)',
      glass300: 'rgba(138, 120, 180, 0.12)',
      glass400: 'rgba(138, 120, 180, 0.16)',
      // Borders
      border: 'rgba(138, 120, 180, 0.15)',
      borderHover: 'rgba(138, 120, 180, 0.25)',
      borderLight: 'rgba(138, 120, 180, 0.08)',
      borderStrong: 'rgba(138, 120, 180, 0.35)',
      // Text
      textPrimary: '#e8e4f0',
      textSecondary: '#a8a0b8',
      textMuted: '#6a6080',
      textDim: '#4a4260',
      textInverse: '#0d0a12',
      textOnAccent: '#ffffff',
      textHeading: '#f0ecf8',
      textLink: '#b8a8d8',
      textLinkHover: '#d0c4e8',
      // Primary Accent
      accent: '#9078c0',
      accentHover: '#7a62aa',
      accentActive: '#684e98',
      accentSubtle: 'rgba(144, 120, 192, 0.15)',
      accentMuted: 'rgba(144, 120, 192, 0.25)',
      // Secondary Accent
      secondary: '#6878a8',
      secondaryHover: '#586898',
      secondarySubtle: 'rgba(104, 120, 168, 0.15)',
      // Tertiary Accent
      tertiary: '#585868',
      tertiaryHover: '#686878',
      tertiarySubtle: 'rgba(88, 88, 104, 0.15)',
      // AI Colors
      aiAccent: '#a088c8',
      aiAccentHover: '#8870b0',
      aiAccentSubtle: 'rgba(160, 136, 200, 0.15)',
      aiSecondary: '#7888b8',
      aiSecondarySubtle: 'rgba(120, 136, 184, 0.15)',
      // Sidebar
      sidebarBackground: '#0a080f',
      sidebarBorder: 'rgba(138, 120, 180, 0.08)',
      sidebarItemHover: 'rgba(138, 120, 180, 0.1)',
      sidebarItemActive: 'rgba(144, 120, 192, 0.18)',
      // Header
      headerBackground: '#0d0a12',
      headerBorder: 'rgba(138, 120, 180, 0.08)',
      headerText: '#e8e4f0',
      // Modal
      modalBackground: '#161322',
      modalOverlay: 'rgba(13, 10, 18, 0.88)',
      modalBorder: 'rgba(138, 120, 180, 0.15)',
      modalHeaderBg: '#12101a',
      // Input
      inputBackground: '#1e1a2e',
      inputBorder: 'rgba(138, 120, 180, 0.15)',
      inputBorderFocus: '#9078c0',
      inputPlaceholder: '#5a5270',
      // Button
      buttonBackground: '#1e1a2e',
      buttonBackgroundHover: '#26223a',
      buttonBorder: 'rgba(138, 120, 180, 0.15)',
      buttonText: '#e8e4f0',
      // Tooltip
      tooltipBackground: '#1e1a2e',
      tooltipText: '#e8e4f0',
      tooltipBorder: 'rgba(138, 120, 180, 0.15)',
      // Badge
      badgeBackground: 'rgba(138, 120, 180, 0.12)',
      badgeText: '#a8a0b8',
      // Code
      codeBackground: '#12101a',
      codeText: '#e8e4f0',
      codeBorder: 'rgba(138, 120, 180, 0.08)',
      lineNumberText: '#5a5270',
      lineHighlight: 'rgba(144, 120, 192, 0.08)',
      // Interactive
      focusRing: '#9078c0',
      focusRingOffset: '#0d0a12',
      selection: 'rgba(144, 120, 192, 0.25)',
      selectionText: '#ffffff',
      highlight: 'rgba(200, 180, 140, 0.2)',
      // Overlays & Shadows
      overlay: 'rgba(13, 10, 18, 0.8)',
      shadow: 'rgba(0, 0, 0, 0.4)',
      shadowStrong: 'rgba(0, 0, 0, 0.6)',
      glow: 'rgba(144, 120, 192, 0.3)',
      // Gradient
      gradientFrom: 'rgba(144, 120, 192, 0.08)',
      gradientVia: 'rgba(104, 120, 168, 0.06)',
      gradientTo: 'rgba(138, 120, 180, 0.08)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#2a2640',
      scrollbarThumbHover: '#3a3650',
      // Status Bar
      statusBarBackground: '#0a080f',
      statusBarBorder: 'rgba(138, 120, 180, 0.08)',
      statusBarText: '#6a6080',
      // Divider
      divider: 'rgba(138, 120, 180, 0.08)',
      dividerStrong: 'rgba(138, 120, 180, 0.18)',
      // Preview
      previewBg: '#0d0a12',
      previewDeviceBorder: '#1e1a2e',
      previewDeviceNotch: 'rgba(106, 96, 128, 0.5)',
      previewUrlbarBg: 'rgba(18, 16, 26, 0.95)',
    },
  },

  'noir': {
    id: 'noir',
    name: 'Noir',
    description: 'Classic film noir with warm amber accents',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#0f0e0c',
      backgroundElevated: '#161412',
      surface: '#1a1816',
      surfaceHover: '#242220',
      surfaceActive: '#2e2c2a',
      surfaceElevated: '#242220',
      // Glass
      glass100: 'rgba(200, 170, 120, 0.04)',
      glass200: 'rgba(200, 170, 120, 0.08)',
      glass300: 'rgba(200, 170, 120, 0.12)',
      glass400: 'rgba(200, 170, 120, 0.16)',
      // Borders
      border: 'rgba(200, 170, 120, 0.12)',
      borderHover: 'rgba(200, 170, 120, 0.22)',
      borderLight: 'rgba(200, 170, 120, 0.06)',
      borderStrong: 'rgba(200, 170, 120, 0.32)',
      // Text
      textPrimary: '#f0e8dc',
      textSecondary: '#c8b8a0',
      textMuted: '#8a7a68',
      textDim: '#5a5048',
      textInverse: '#0f0e0c',
      textOnAccent: '#0f0e0c',
      textHeading: '#f8f0e4',
      textLink: '#d4b888',
      textLinkHover: '#e8d0a8',
      // Primary Accent
      accent: '#c8a060',
      accentHover: '#b89050',
      accentActive: '#a88040',
      accentSubtle: 'rgba(200, 160, 96, 0.15)',
      accentMuted: 'rgba(200, 160, 96, 0.25)',
      // Secondary Accent
      secondary: '#a89080',
      secondaryHover: '#988070',
      secondarySubtle: 'rgba(168, 144, 128, 0.15)',
      // Tertiary Accent
      tertiary: '#786860',
      tertiaryHover: '#887870',
      tertiarySubtle: 'rgba(120, 104, 96, 0.15)',
      // AI Colors
      aiAccent: '#d4a868',
      aiAccentHover: '#c49858',
      aiAccentSubtle: 'rgba(212, 168, 104, 0.15)',
      aiSecondary: '#b8a088',
      aiSecondarySubtle: 'rgba(184, 160, 136, 0.15)',
      // Sidebar
      sidebarBackground: '#0c0b0a',
      sidebarBorder: 'rgba(200, 170, 120, 0.06)',
      sidebarItemHover: 'rgba(200, 170, 120, 0.08)',
      sidebarItemActive: 'rgba(200, 160, 96, 0.15)',
      // Header
      headerBackground: '#0f0e0c',
      headerBorder: 'rgba(200, 170, 120, 0.06)',
      headerText: '#f0e8dc',
      // Modal
      modalBackground: '#1a1816',
      modalOverlay: 'rgba(15, 14, 12, 0.88)',
      modalBorder: 'rgba(200, 170, 120, 0.12)',
      modalHeaderBg: '#161412',
      // Input
      inputBackground: '#242220',
      inputBorder: 'rgba(200, 170, 120, 0.12)',
      inputBorderFocus: '#c8a060',
      inputPlaceholder: '#6a5a50',
      // Button
      buttonBackground: '#242220',
      buttonBackgroundHover: '#2e2c2a',
      buttonBorder: 'rgba(200, 170, 120, 0.12)',
      buttonText: '#f0e8dc',
      // Tooltip
      tooltipBackground: '#242220',
      tooltipText: '#f0e8dc',
      tooltipBorder: 'rgba(200, 170, 120, 0.12)',
      // Badge
      badgeBackground: 'rgba(200, 170, 120, 0.1)',
      badgeText: '#c8b8a0',
      // Code
      codeBackground: '#161412',
      codeText: '#f0e8dc',
      codeBorder: 'rgba(200, 170, 120, 0.06)',
      lineNumberText: '#6a5a50',
      lineHighlight: 'rgba(200, 160, 96, 0.08)',
      // Interactive
      focusRing: '#c8a060',
      focusRingOffset: '#0f0e0c',
      selection: 'rgba(200, 160, 96, 0.25)',
      selectionText: '#ffffff',
      highlight: 'rgba(200, 170, 120, 0.2)',
      // Overlays & Shadows
      overlay: 'rgba(15, 14, 12, 0.8)',
      shadow: 'rgba(0, 0, 0, 0.4)',
      shadowStrong: 'rgba(0, 0, 0, 0.6)',
      glow: 'rgba(200, 160, 96, 0.25)',
      // Gradient
      gradientFrom: 'rgba(200, 160, 96, 0.06)',
      gradientVia: 'rgba(168, 144, 128, 0.04)',
      gradientTo: 'rgba(200, 170, 120, 0.06)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#3a3632',
      scrollbarThumbHover: '#4a4642',
      // Status Bar
      statusBarBackground: '#0c0b0a',
      statusBarBorder: 'rgba(200, 170, 120, 0.06)',
      statusBarText: '#8a7a68',
      // Divider
      divider: 'rgba(200, 170, 120, 0.06)',
      dividerStrong: 'rgba(200, 170, 120, 0.15)',
      // Preview
      previewBg: '#0f0e0c',
      previewDeviceBorder: '#242220',
      previewDeviceNotch: 'rgba(138, 122, 104, 0.5)',
      previewUrlbarBg: 'rgba(22, 20, 18, 0.95)',
    },
  },

  'stealth': {
    id: 'stealth',
    name: 'Stealth',
    description: 'Tactical dark with olive green accents',
    monacoTheme: 'vs-dark',
    colors: {
      // Base
      background: '#0a0c0a',
      backgroundElevated: '#10140f',
      surface: '#141814',
      surfaceHover: '#1c221a',
      surfaceActive: '#242c22',
      surfaceElevated: '#1c221a',
      // Glass
      glass100: 'rgba(120, 140, 100, 0.04)',
      glass200: 'rgba(120, 140, 100, 0.08)',
      glass300: 'rgba(120, 140, 100, 0.12)',
      glass400: 'rgba(120, 140, 100, 0.16)',
      // Borders
      border: 'rgba(120, 140, 100, 0.12)',
      borderHover: 'rgba(120, 140, 100, 0.22)',
      borderLight: 'rgba(120, 140, 100, 0.06)',
      borderStrong: 'rgba(120, 140, 100, 0.32)',
      // Text
      textPrimary: '#e0e8dc',
      textSecondary: '#a8b8a0',
      textMuted: '#6a7a62',
      textDim: '#4a5a44',
      textInverse: '#0a0c0a',
      textOnAccent: '#0a0c0a',
      textHeading: '#e8f0e4',
      textLink: '#98b080',
      textLinkHover: '#b0c8a0',
      // Primary Accent
      accent: '#7a9a60',
      accentHover: '#6a8a50',
      accentActive: '#5a7a42',
      accentSubtle: 'rgba(122, 154, 96, 0.15)',
      accentMuted: 'rgba(122, 154, 96, 0.25)',
      // Secondary Accent
      secondary: '#889888',
      secondaryHover: '#788878',
      secondarySubtle: 'rgba(136, 152, 136, 0.15)',
      // Tertiary Accent
      tertiary: '#606860',
      tertiaryHover: '#707870',
      tertiarySubtle: 'rgba(96, 104, 96, 0.15)',
      // AI Colors
      aiAccent: '#88a870',
      aiAccentHover: '#789860',
      aiAccentSubtle: 'rgba(136, 168, 112, 0.15)',
      aiSecondary: '#98a898',
      aiSecondarySubtle: 'rgba(152, 168, 152, 0.15)',
      // Sidebar
      sidebarBackground: '#080a08',
      sidebarBorder: 'rgba(120, 140, 100, 0.06)',
      sidebarItemHover: 'rgba(120, 140, 100, 0.08)',
      sidebarItemActive: 'rgba(122, 154, 96, 0.15)',
      // Header
      headerBackground: '#0a0c0a',
      headerBorder: 'rgba(120, 140, 100, 0.06)',
      headerText: '#e0e8dc',
      // Modal
      modalBackground: '#141814',
      modalOverlay: 'rgba(10, 12, 10, 0.88)',
      modalBorder: 'rgba(120, 140, 100, 0.12)',
      modalHeaderBg: '#10140f',
      // Input
      inputBackground: '#1c221a',
      inputBorder: 'rgba(120, 140, 100, 0.12)',
      inputBorderFocus: '#7a9a60',
      inputPlaceholder: '#5a6a54',
      // Button
      buttonBackground: '#1c221a',
      buttonBackgroundHover: '#242c22',
      buttonBorder: 'rgba(120, 140, 100, 0.12)',
      buttonText: '#e0e8dc',
      // Tooltip
      tooltipBackground: '#1c221a',
      tooltipText: '#e0e8dc',
      tooltipBorder: 'rgba(120, 140, 100, 0.12)',
      // Badge
      badgeBackground: 'rgba(120, 140, 100, 0.1)',
      badgeText: '#a8b8a0',
      // Code
      codeBackground: '#10140f',
      codeText: '#e0e8dc',
      codeBorder: 'rgba(120, 140, 100, 0.06)',
      lineNumberText: '#5a6a54',
      lineHighlight: 'rgba(122, 154, 96, 0.08)',
      // Interactive
      focusRing: '#7a9a60',
      focusRingOffset: '#0a0c0a',
      selection: 'rgba(122, 154, 96, 0.25)',
      selectionText: '#ffffff',
      highlight: 'rgba(180, 200, 140, 0.2)',
      // Overlays & Shadows
      overlay: 'rgba(10, 12, 10, 0.8)',
      shadow: 'rgba(0, 0, 0, 0.4)',
      shadowStrong: 'rgba(0, 0, 0, 0.6)',
      glow: 'rgba(122, 154, 96, 0.25)',
      // Gradient
      gradientFrom: 'rgba(122, 154, 96, 0.06)',
      gradientVia: 'rgba(136, 152, 136, 0.04)',
      gradientTo: 'rgba(120, 140, 100, 0.06)',
      // Scrollbar
      scrollbarTrack: 'transparent',
      scrollbarThumb: '#2a322a',
      scrollbarThumbHover: '#3a423a',
      // Status Bar
      statusBarBackground: '#080a08',
      statusBarBorder: 'rgba(120, 140, 100, 0.06)',
      statusBarText: '#6a7a62',
      // Divider
      divider: 'rgba(120, 140, 100, 0.06)',
      dividerStrong: 'rgba(120, 140, 100, 0.15)',
      // Preview
      previewBg: '#0a0c0a',
      previewDeviceBorder: '#1c221a',
      previewDeviceNotch: 'rgba(106, 122, 98, 0.5)',
      previewUrlbarBg: 'rgba(16, 20, 15, 0.95)',
    },
  },

  // ============ LIGHT THEMES ============

  'snow-white': {
    id: 'snow-white',
    name: 'Snow White',
    description: 'Clean and minimal light theme',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#ffffff',
      backgroundElevated: '#f8fafc',
      surface: '#f8fafc',
      surfaceHover: '#e2e8f0',
      surfaceActive: '#cbd5e1',
      surfaceElevated: '#ffffff',
      // Glass
      glass100: '#f1f5f9',
      glass200: '#e2e8f0',
      glass300: '#cbd5e1',
      glass400: '#94a3b8',
      // Borders
      border: '#cbd5e1',
      borderHover: '#94a3b8',
      borderLight: '#e2e8f0',
      borderStrong: '#64748b',
      // Text
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      textDim: '#94a3b8',
      textInverse: '#f8fafc',
      textOnAccent: '#ffffff',
      textHeading: '#0f172a',
      textLink: '#2563eb',
      textLinkHover: '#1d4ed8',
      // Primary Accent
      accent: '#2563eb',
      accentHover: '#1d4ed8',
      accentActive: '#1e40af',
      accentSubtle: '#dbeafe',
      accentMuted: 'rgba(37, 99, 235, 0.3)',
      // Secondary Accent
      secondary: '#0d9488',
      secondaryHover: '#0f766e',
      secondarySubtle: '#ccfbf1',
      // Tertiary Accent
      tertiary: '#ea580c',
      tertiaryHover: '#c2410c',
      tertiarySubtle: '#fed7aa',
      // AI Colors
      aiAccent: '#7c3aed',
      aiAccentHover: '#6d28d9',
      aiAccentSubtle: '#ede9fe',
      aiSecondary: '#db2777',
      aiSecondarySubtle: '#fce7f3',
      // Sidebar
      sidebarBackground: '#f1f5f9',
      sidebarBorder: '#e2e8f0',
      sidebarItemHover: '#e2e8f0',
      sidebarItemActive: '#dbeafe',
      // Header
      headerBackground: '#ffffff',
      headerBorder: '#e2e8f0',
      headerText: '#0f172a',
      // Modal
      modalBackground: '#ffffff',
      modalOverlay: 'rgba(15, 23, 42, 0.4)',
      modalBorder: '#cbd5e1',
      modalHeaderBg: '#f8fafc',
      // Input
      inputBackground: '#ffffff',
      inputBorder: '#cbd5e1',
      inputBorderFocus: '#2563eb',
      inputPlaceholder: '#94a3b8',
      // Button
      buttonBackground: '#f1f5f9',
      buttonBackgroundHover: '#e2e8f0',
      buttonBorder: '#cbd5e1',
      buttonText: '#0f172a',
      // Tooltip
      tooltipBackground: '#1e293b',
      tooltipText: '#f8fafc',
      tooltipBorder: '#334155',
      // Badge
      badgeBackground: '#e2e8f0',
      badgeText: '#334155',
      // Code
      codeBackground: '#f1f5f9',
      codeText: '#0f172a',
      codeBorder: '#e2e8f0',
      lineNumberText: '#64748b',
      lineHighlight: 'rgba(37, 99, 235, 0.1)',
      // Interactive
      focusRing: '#2563eb',
      focusRingOffset: '#ffffff',
      selection: 'rgba(37, 99, 235, 0.2)',
      selectionText: '#0f172a',
      highlight: 'rgba(250, 204, 21, 0.4)',
      // Overlays & Shadows
      overlay: 'rgba(15, 23, 42, 0.3)',
      shadow: 'rgba(15, 23, 42, 0.1)',
      shadowStrong: 'rgba(15, 23, 42, 0.2)',
      glow: 'rgba(37, 99, 235, 0.3)',
      // Gradient
      gradientFrom: 'rgba(59, 130, 246, 0.08)',
      gradientVia: 'rgba(139, 92, 246, 0.08)',
      gradientTo: 'rgba(168, 85, 247, 0.08)',
      // Scrollbar
      scrollbarTrack: '#f1f5f9',
      scrollbarThumb: '#94a3b8',
      scrollbarThumbHover: '#64748b',
      // Status Bar
      statusBarBackground: '#e2e8f0',
      statusBarBorder: '#cbd5e1',
      statusBarText: '#475569',
      // Divider
      divider: '#e2e8f0',
      dividerStrong: '#cbd5e1',
      // Preview
      previewBg: '#f1f5f9',
      previewDeviceBorder: '#cbd5e1',
      previewDeviceNotch: 'rgba(100, 116, 139, 0.3)',
      previewUrlbarBg: 'rgba(241, 245, 249, 0.95)',
    },
  },

  'monochrome-light': {
    id: 'monochrome-light',
    name: 'Monochrome Light',
    description: 'Pure white, black, and gray tones',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#ffffff',
      backgroundElevated: '#fafafa',
      surface: '#f5f5f5',
      surfaceHover: '#eeeeee',
      surfaceActive: '#e0e0e0',
      surfaceElevated: '#ffffff',
      // Glass
      glass100: '#f5f5f5',
      glass200: '#eeeeee',
      glass300: '#e0e0e0',
      glass400: '#bdbdbd',
      // Borders
      border: '#e0e0e0',
      borderHover: '#bdbdbd',
      borderLight: '#eeeeee',
      borderStrong: '#9e9e9e',
      // Text
      textPrimary: '#000000',
      textSecondary: '#424242',
      textMuted: '#757575',
      textDim: '#9e9e9e',
      textInverse: '#ffffff',
      textOnAccent: '#ffffff',
      textHeading: '#000000',
      textLink: '#000000',
      textLinkHover: '#424242',
      // Primary Accent
      accent: '#000000',
      accentHover: '#212121',
      accentActive: '#424242',
      accentSubtle: '#eeeeee',
      accentMuted: 'rgba(0, 0, 0, 0.2)',
      // Secondary Accent
      secondary: '#616161',
      secondaryHover: '#757575',
      secondarySubtle: '#f5f5f5',
      // Tertiary Accent
      tertiary: '#9e9e9e',
      tertiaryHover: '#bdbdbd',
      tertiarySubtle: '#fafafa',
      // AI Colors
      aiAccent: '#000000',
      aiAccentHover: '#212121',
      aiAccentSubtle: '#eeeeee',
      aiSecondary: '#616161',
      aiSecondarySubtle: '#f5f5f5',
      // Sidebar
      sidebarBackground: '#f5f5f5',
      sidebarBorder: '#e0e0e0',
      sidebarItemHover: '#eeeeee',
      sidebarItemActive: '#e0e0e0',
      // Header
      headerBackground: '#ffffff',
      headerBorder: '#e0e0e0',
      headerText: '#000000',
      // Modal
      modalBackground: '#ffffff',
      modalOverlay: 'rgba(0, 0, 0, 0.5)',
      modalBorder: '#e0e0e0',
      modalHeaderBg: '#fafafa',
      // Input
      inputBackground: '#ffffff',
      inputBorder: '#e0e0e0',
      inputBorderFocus: '#000000',
      inputPlaceholder: '#9e9e9e',
      // Button
      buttonBackground: '#f5f5f5',
      buttonBackgroundHover: '#eeeeee',
      buttonBorder: '#e0e0e0',
      buttonText: '#000000',
      // Tooltip
      tooltipBackground: '#212121',
      tooltipText: '#ffffff',
      tooltipBorder: '#424242',
      // Badge
      badgeBackground: '#eeeeee',
      badgeText: '#424242',
      // Code
      codeBackground: '#f5f5f5',
      codeText: '#000000',
      codeBorder: '#e0e0e0',
      lineNumberText: '#757575',
      lineHighlight: 'rgba(0, 0, 0, 0.05)',
      // Interactive
      focusRing: '#000000',
      focusRingOffset: '#ffffff',
      selection: 'rgba(0, 0, 0, 0.15)',
      selectionText: '#000000',
      highlight: 'rgba(0, 0, 0, 0.1)',
      // Overlays & Shadows
      overlay: 'rgba(0, 0, 0, 0.4)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowStrong: 'rgba(0, 0, 0, 0.2)',
      glow: 'rgba(0, 0, 0, 0.1)',
      // Gradient
      gradientFrom: 'rgba(0, 0, 0, 0.02)',
      gradientVia: 'rgba(0, 0, 0, 0.01)',
      gradientTo: 'rgba(0, 0, 0, 0.02)',
      // Scrollbar
      scrollbarTrack: '#f5f5f5',
      scrollbarThumb: '#bdbdbd',
      scrollbarThumbHover: '#9e9e9e',
      // Status Bar
      statusBarBackground: '#e8e8e8',
      statusBarBorder: '#d0d0d0',
      statusBarText: '#404040',
      // Divider
      divider: '#e0e0e0',
      dividerStrong: '#bdbdbd',
      // Preview
      previewBg: '#f5f5f5',
      previewDeviceBorder: '#e0e0e0',
      previewDeviceNotch: 'rgba(117, 117, 117, 0.3)',
      previewUrlbarBg: 'rgba(245, 245, 245, 0.95)',
    },
  },

  'marble': {
    id: 'marble',
    name: 'Marble',
    description: 'Elegant white marble with subtle gray veining',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#fafafa',
      backgroundElevated: '#f5f5f5',
      surface: '#f0f0f0',
      surfaceHover: '#e8e8e8',
      surfaceActive: '#e0e0e0',
      surfaceElevated: '#fafafa',
      // Glass
      glass100: '#f0f0f0',
      glass200: '#e8e8e8',
      glass300: '#d8d8d8',
      glass400: '#c0c0c0',
      // Borders
      border: '#d0d0d0',
      borderHover: '#b0b0b0',
      borderLight: '#e0e0e0',
      borderStrong: '#909090',
      // Text
      textPrimary: '#1a1a1a',
      textSecondary: '#404040',
      textMuted: '#707070',
      textDim: '#a0a0a0',
      textInverse: '#fafafa',
      textOnAccent: '#fafafa',
      textHeading: '#0a0a0a',
      textLink: '#505050',
      textLinkHover: '#303030',
      // Primary Accent
      accent: '#505050',
      accentHover: '#404040',
      accentActive: '#303030',
      accentSubtle: '#e8e8e8',
      accentMuted: 'rgba(80, 80, 80, 0.2)',
      // Secondary Accent
      secondary: '#707070',
      secondaryHover: '#606060',
      secondarySubtle: '#f0f0f0',
      // Tertiary Accent
      tertiary: '#909090',
      tertiaryHover: '#808080',
      tertiarySubtle: '#f5f5f5',
      // AI Colors
      aiAccent: '#404040',
      aiAccentHover: '#303030',
      aiAccentSubtle: '#e8e8e8',
      aiSecondary: '#606060',
      aiSecondarySubtle: '#f0f0f0',
      // Sidebar
      sidebarBackground: '#f0f0f0',
      sidebarBorder: '#d8d8d8',
      sidebarItemHover: '#e8e8e8',
      sidebarItemActive: '#e0e0e0',
      // Header
      headerBackground: '#fafafa',
      headerBorder: '#d8d8d8',
      headerText: '#1a1a1a',
      // Modal
      modalBackground: '#fafafa',
      modalOverlay: 'rgba(26, 26, 26, 0.4)',
      modalBorder: '#d0d0d0',
      modalHeaderBg: '#f5f5f5',
      // Input
      inputBackground: '#fafafa',
      inputBorder: '#d0d0d0',
      inputBorderFocus: '#505050',
      inputPlaceholder: '#a0a0a0',
      // Button
      buttonBackground: '#f0f0f0',
      buttonBackgroundHover: '#e8e8e8',
      buttonBorder: '#d0d0d0',
      buttonText: '#1a1a1a',
      // Tooltip
      tooltipBackground: '#1a1a1a',
      tooltipText: '#fafafa',
      tooltipBorder: '#404040',
      // Badge
      badgeBackground: '#e8e8e8',
      badgeText: '#404040',
      // Code
      codeBackground: '#f0f0f0',
      codeText: '#1a1a1a',
      codeBorder: '#d8d8d8',
      lineNumberText: '#707070',
      lineHighlight: 'rgba(80, 80, 80, 0.06)',
      // Interactive
      focusRing: '#505050',
      focusRingOffset: '#fafafa',
      selection: 'rgba(80, 80, 80, 0.15)',
      selectionText: '#1a1a1a',
      highlight: 'rgba(80, 80, 80, 0.1)',
      // Overlays & Shadows
      overlay: 'rgba(26, 26, 26, 0.35)',
      shadow: 'rgba(0, 0, 0, 0.08)',
      shadowStrong: 'rgba(0, 0, 0, 0.15)',
      glow: 'rgba(80, 80, 80, 0.15)',
      // Gradient
      gradientFrom: 'rgba(80, 80, 80, 0.03)',
      gradientVia: 'rgba(120, 120, 120, 0.02)',
      gradientTo: 'rgba(80, 80, 80, 0.03)',
      // Scrollbar
      scrollbarTrack: '#f0f0f0',
      scrollbarThumb: '#b0b0b0',
      scrollbarThumbHover: '#909090',
      // Status Bar
      statusBarBackground: '#e0e0e0',
      statusBarBorder: '#c0c0c0',
      statusBarText: '#303030',
      // Divider
      divider: '#d8d8d8',
      dividerStrong: '#c0c0c0',
      // Preview
      previewBg: '#f0f0f0',
      previewDeviceBorder: '#d0d0d0',
      previewDeviceNotch: 'rgba(112, 112, 112, 0.3)',
      previewUrlbarBg: 'rgba(240, 240, 240, 0.95)',
    },
  },

  'parchment': {
    id: 'parchment',
    name: 'Parchment',
    description: 'Ancient manuscript with warm ivory tones',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#f8f4e8',
      backgroundElevated: '#f2ece0',
      surface: '#ece6d8',
      surfaceHover: '#e4dcc8',
      surfaceActive: '#d8ceb8',
      surfaceElevated: '#f8f4e8',
      // Glass
      glass100: '#ece6d8',
      glass200: '#e0d8c8',
      glass300: '#d0c8b0',
      glass400: '#b8a888',
      // Borders
      border: '#c8bc9c',
      borderHover: '#a89870',
      borderLight: '#d8d0bc',
      borderStrong: '#887858',
      // Text
      textPrimary: '#3a3428',
      textSecondary: '#5a5040',
      textMuted: '#7a6a58',
      textDim: '#a89880',
      textInverse: '#f8f4e8',
      textOnAccent: '#f8f4e8',
      textHeading: '#2a2418',
      textLink: '#685838',
      textLinkHover: '#4a3820',
      // Primary Accent
      accent: '#6a5030',
      accentHover: '#5a4020',
      accentActive: '#4a3018',
      accentSubtle: '#e4dcc8',
      accentMuted: 'rgba(106, 80, 48, 0.2)',
      // Secondary Accent
      secondary: '#887050',
      secondaryHover: '#786040',
      secondarySubtle: '#ece6d8',
      // Tertiary Accent
      tertiary: '#a08868',
      tertiaryHover: '#907858',
      tertiarySubtle: '#f2ece0',
      // AI Colors
      aiAccent: '#785830',
      aiAccentHover: '#684820',
      aiAccentSubtle: '#e4dcc8',
      aiSecondary: '#907858',
      aiSecondarySubtle: '#ece6d8',
      // Sidebar
      sidebarBackground: '#ece6d8',
      sidebarBorder: '#d8d0bc',
      sidebarItemHover: '#e4dcc8',
      sidebarItemActive: '#d8ceb8',
      // Header
      headerBackground: '#f8f4e8',
      headerBorder: '#d8d0bc',
      headerText: '#3a3428',
      // Modal
      modalBackground: '#f8f4e8',
      modalOverlay: 'rgba(58, 52, 40, 0.4)',
      modalBorder: '#c8bc9c',
      modalHeaderBg: '#f2ece0',
      // Input
      inputBackground: '#f8f4e8',
      inputBorder: '#c8bc9c',
      inputBorderFocus: '#6a5030',
      inputPlaceholder: '#a89880',
      // Button
      buttonBackground: '#ece6d8',
      buttonBackgroundHover: '#e4dcc8',
      buttonBorder: '#c8bc9c',
      buttonText: '#3a3428',
      // Tooltip
      tooltipBackground: '#3a3428',
      tooltipText: '#f8f4e8',
      tooltipBorder: '#5a5040',
      // Badge
      badgeBackground: '#e4dcc8',
      badgeText: '#5a5040',
      // Code
      codeBackground: '#ece6d8',
      codeText: '#3a3428',
      codeBorder: '#d8d0bc',
      lineNumberText: '#7a6a58',
      lineHighlight: 'rgba(106, 80, 48, 0.08)',
      // Interactive
      focusRing: '#6a5030',
      focusRingOffset: '#f8f4e8',
      selection: 'rgba(106, 80, 48, 0.18)',
      selectionText: '#3a3428',
      highlight: 'rgba(168, 136, 80, 0.2)',
      // Overlays & Shadows
      overlay: 'rgba(58, 52, 40, 0.35)',
      shadow: 'rgba(58, 52, 40, 0.1)',
      shadowStrong: 'rgba(58, 52, 40, 0.18)',
      glow: 'rgba(106, 80, 48, 0.2)',
      // Gradient
      gradientFrom: 'rgba(106, 80, 48, 0.06)',
      gradientVia: 'rgba(136, 112, 80, 0.04)',
      gradientTo: 'rgba(160, 136, 104, 0.06)',
      // Scrollbar
      scrollbarTrack: '#e4dcc8',
      scrollbarThumb: '#b8a888',
      scrollbarThumbHover: '#a89870',
      // Status Bar
      statusBarBackground: '#d8ceb8',
      statusBarBorder: '#c8bc9c',
      statusBarText: '#3a3428',
      // Divider
      divider: '#d8d0bc',
      dividerStrong: '#c8bc9c',
      // Preview
      previewBg: '#ece6d8',
      previewDeviceBorder: '#c8bc9c',
      previewDeviceNotch: 'rgba(122, 106, 88, 0.3)',
      previewUrlbarBg: 'rgba(236, 230, 216, 0.95)',
    },
  },

  'porcelain': {
    id: 'porcelain',
    name: 'Porcelain',
    description: 'Refined ceramic with subtle blue-white tones',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#f8fafc',
      backgroundElevated: '#f0f4f8',
      surface: '#e8f0f4',
      surfaceHover: '#dce8f0',
      surfaceActive: '#cce0e8',
      surfaceElevated: '#f8fafc',
      // Glass
      glass100: '#e8f0f4',
      glass200: '#d8e8f0',
      glass300: '#c0d8e4',
      glass400: '#98c0d0',
      // Borders
      border: '#b8d0dc',
      borderHover: '#90b8c8',
      borderLight: '#d0e0e8',
      borderStrong: '#6898a8',
      // Text
      textPrimary: '#1a2830',
      textSecondary: '#384850',
      textMuted: '#587078',
      textDim: '#88a0a8',
      textInverse: '#f8fafc',
      textOnAccent: '#f8fafc',
      textHeading: '#0a1820',
      textLink: '#4a6878',
      textLinkHover: '#2a4858',
      // Primary Accent
      accent: '#4a6878',
      accentHover: '#3a5868',
      accentActive: '#2a4858',
      accentSubtle: '#dce8f0',
      accentMuted: 'rgba(74, 104, 120, 0.2)',
      // Secondary Accent
      secondary: '#688898',
      secondaryHover: '#587888',
      secondarySubtle: '#e8f0f4',
      // Tertiary Accent
      tertiary: '#88a0a8',
      tertiaryHover: '#789098',
      tertiarySubtle: '#f0f4f8',
      // AI Colors
      aiAccent: '#587080',
      aiAccentHover: '#486070',
      aiAccentSubtle: '#dce8f0',
      aiSecondary: '#789098',
      aiSecondarySubtle: '#e8f0f4',
      // Sidebar
      sidebarBackground: '#e8f0f4',
      sidebarBorder: '#d0e0e8',
      sidebarItemHover: '#dce8f0',
      sidebarItemActive: '#cce0e8',
      // Header
      headerBackground: '#f8fafc',
      headerBorder: '#d0e0e8',
      headerText: '#1a2830',
      // Modal
      modalBackground: '#f8fafc',
      modalOverlay: 'rgba(26, 40, 48, 0.4)',
      modalBorder: '#b8d0dc',
      modalHeaderBg: '#f0f4f8',
      // Input
      inputBackground: '#f8fafc',
      inputBorder: '#b8d0dc',
      inputBorderFocus: '#4a6878',
      inputPlaceholder: '#88a0a8',
      // Button
      buttonBackground: '#e8f0f4',
      buttonBackgroundHover: '#dce8f0',
      buttonBorder: '#b8d0dc',
      buttonText: '#1a2830',
      // Tooltip
      tooltipBackground: '#1a2830',
      tooltipText: '#f8fafc',
      tooltipBorder: '#384850',
      // Badge
      badgeBackground: '#dce8f0',
      badgeText: '#384850',
      // Code
      codeBackground: '#e8f0f4',
      codeText: '#1a2830',
      codeBorder: '#d0e0e8',
      lineNumberText: '#587078',
      lineHighlight: 'rgba(74, 104, 120, 0.08)',
      // Interactive
      focusRing: '#4a6878',
      focusRingOffset: '#f8fafc',
      selection: 'rgba(74, 104, 120, 0.18)',
      selectionText: '#1a2830',
      highlight: 'rgba(104, 136, 152, 0.15)',
      // Overlays & Shadows
      overlay: 'rgba(26, 40, 48, 0.35)',
      shadow: 'rgba(26, 40, 48, 0.1)',
      shadowStrong: 'rgba(26, 40, 48, 0.18)',
      glow: 'rgba(74, 104, 120, 0.2)',
      // Gradient
      gradientFrom: 'rgba(74, 104, 120, 0.06)',
      gradientVia: 'rgba(104, 136, 152, 0.04)',
      gradientTo: 'rgba(136, 160, 168, 0.06)',
      // Scrollbar
      scrollbarTrack: '#dce8f0',
      scrollbarThumb: '#98c0d0',
      scrollbarThumbHover: '#78a8b8',
      // Status Bar
      statusBarBackground: '#cce0e8',
      statusBarBorder: '#b8d0dc',
      statusBarText: '#1a2830',
      // Divider
      divider: '#d0e0e8',
      dividerStrong: '#b8d0dc',
      // Preview
      previewBg: '#e8f0f4',
      previewDeviceBorder: '#b8d0dc',
      previewDeviceNotch: 'rgba(88, 112, 120, 0.3)',
      previewUrlbarBg: 'rgba(232, 240, 244, 0.95)',
    },
  },

  'paper-cream': {
    id: 'paper-cream',
    name: 'Paper Cream',
    description: 'Warm sepia tones, easy on eyes',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#fefdfb',
      backgroundElevated: '#f9f5ef',
      surface: '#f9f5ef',
      surfaceHover: '#ede5d8',
      surfaceActive: '#ddd3c0',
      surfaceElevated: '#fefdfb',
      // Glass
      glass100: '#f5f0e6',
      glass200: '#ebe3d5',
      glass300: '#ddd3c0',
      glass400: '#c4b49a',
      // Borders
      border: '#d4c4a8',
      borderHover: '#b8a080',
      borderLight: '#ebe3d5',
      borderStrong: '#8b7a65',
      // Text
      textPrimary: '#2d2418',
      textSecondary: '#5c4d3d',
      textMuted: '#8b7a65',
      textDim: '#b8a080',
      textInverse: '#fefdfb',
      textOnAccent: '#ffffff',
      textHeading: '#2d2418',
      textLink: '#c2410c',
      textLinkHover: '#9a3412',
      // Primary Accent
      accent: '#c2410c',
      accentHover: '#9a3412',
      accentActive: '#7c2d12',
      accentSubtle: '#fed7aa',
      accentMuted: 'rgba(194, 65, 12, 0.3)',
      // Secondary Accent
      secondary: '#0f766e',
      secondaryHover: '#115e59',
      secondarySubtle: '#ccfbf1',
      // Tertiary Accent
      tertiary: '#b45309',
      tertiaryHover: '#92400e',
      tertiarySubtle: '#fef3c7',
      // AI Colors
      aiAccent: '#7c2d12',
      aiAccentHover: '#9a3412',
      aiAccentSubtle: '#ffedd5',
      aiSecondary: '#9f1239',
      aiSecondarySubtle: '#ffe4e6',
      // Sidebar
      sidebarBackground: '#f5f0e6',
      sidebarBorder: '#ebe3d5',
      sidebarItemHover: '#ede5d8',
      sidebarItemActive: '#fed7aa',
      // Header
      headerBackground: '#fefdfb',
      headerBorder: '#ebe3d5',
      headerText: '#2d2418',
      // Modal
      modalBackground: '#fefdfb',
      modalOverlay: 'rgba(45, 36, 24, 0.4)',
      modalBorder: '#d4c4a8',
      modalHeaderBg: '#f9f5ef',
      // Input
      inputBackground: '#fefdfb',
      inputBorder: '#d4c4a8',
      inputBorderFocus: '#c2410c',
      inputPlaceholder: '#b8a080',
      // Button
      buttonBackground: '#f5f0e6',
      buttonBackgroundHover: '#ede5d8',
      buttonBorder: '#d4c4a8',
      buttonText: '#2d2418',
      // Tooltip
      tooltipBackground: '#2d2418',
      tooltipText: '#fefdfb',
      tooltipBorder: '#5c4d3d',
      // Badge
      badgeBackground: '#ebe3d5',
      badgeText: '#5c4d3d',
      // Code
      codeBackground: '#f5f0e6',
      codeText: '#2d2418',
      codeBorder: '#ebe3d5',
      lineNumberText: '#8b7a65',
      lineHighlight: 'rgba(194, 65, 12, 0.1)',
      // Interactive
      focusRing: '#c2410c',
      focusRingOffset: '#fefdfb',
      selection: 'rgba(194, 65, 12, 0.2)',
      selectionText: '#2d2418',
      highlight: 'rgba(250, 204, 21, 0.4)',
      // Overlays & Shadows
      overlay: 'rgba(45, 36, 24, 0.3)',
      shadow: 'rgba(45, 36, 24, 0.1)',
      shadowStrong: 'rgba(45, 36, 24, 0.2)',
      glow: 'rgba(194, 65, 12, 0.3)',
      // Gradient
      gradientFrom: 'rgba(194, 65, 12, 0.1)',
      gradientVia: 'rgba(180, 83, 9, 0.1)',
      gradientTo: 'rgba(234, 88, 12, 0.1)',
      // Scrollbar
      scrollbarTrack: '#f0e8db',
      scrollbarThumb: '#c4b49a',
      scrollbarThumbHover: '#a08a68',
      // Status Bar
      statusBarBackground: '#d4c4a8',
      statusBarBorder: '#c4b49a',
      statusBarText: '#3a3028',
      // Divider
      divider: '#ebe3d5',
      dividerStrong: '#d4c4a8',
      // Preview
      previewBg: '#f5f0e6',
      previewDeviceBorder: '#d4c4a8',
      previewDeviceNotch: 'rgba(139, 122, 101, 0.3)',
      previewUrlbarBg: 'rgba(245, 240, 230, 0.95)',
    },
  },

  'sky-blue': {
    id: 'sky-blue',
    name: 'Sky Blue',
    description: 'Fresh blue-tinted light theme',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#f8fbff',
      backgroundElevated: '#eef6ff',
      surface: '#eef6ff',
      surfaceHover: '#dbeafe',
      surfaceActive: '#bfdbfe',
      surfaceElevated: '#f8fbff',
      // Glass
      glass100: '#e0f0ff',
      glass200: '#bfdbfe',
      glass300: '#93c5fd',
      glass400: '#60a5fa',
      // Borders
      border: '#93c5fd',
      borderHover: '#60a5fa',
      borderLight: '#bfdbfe',
      borderStrong: '#3b82f6',
      // Text
      textPrimary: '#1e3a5f',
      textSecondary: '#1e40af',
      textMuted: '#3b82f6',
      textDim: '#60a5fa',
      textInverse: '#f8fbff',
      textOnAccent: '#ffffff',
      textHeading: '#1e3a5f',
      textLink: '#0369a1',
      textLinkHover: '#075985',
      // Primary Accent
      accent: '#0369a1',
      accentHover: '#075985',
      accentActive: '#0c4a6e',
      accentSubtle: '#bae6fd',
      accentMuted: 'rgba(3, 105, 161, 0.3)',
      // Secondary Accent
      secondary: '#059669',
      secondaryHover: '#047857',
      secondarySubtle: '#a7f3d0',
      // Tertiary Accent
      tertiary: '#7c3aed',
      tertiaryHover: '#6d28d9',
      tertiarySubtle: '#ddd6fe',
      // AI Colors
      aiAccent: '#6d28d9',
      aiAccentHover: '#5b21b6',
      aiAccentSubtle: '#ede9fe',
      aiSecondary: '#be185d',
      aiSecondarySubtle: '#fce7f3',
      // Sidebar
      sidebarBackground: '#e0f0ff',
      sidebarBorder: '#bfdbfe',
      sidebarItemHover: '#dbeafe',
      sidebarItemActive: '#bae6fd',
      // Header
      headerBackground: '#f8fbff',
      headerBorder: '#bfdbfe',
      headerText: '#1e3a5f',
      // Modal
      modalBackground: '#f8fbff',
      modalOverlay: 'rgba(30, 58, 95, 0.4)',
      modalBorder: '#93c5fd',
      modalHeaderBg: '#eef6ff',
      // Input
      inputBackground: '#f8fbff',
      inputBorder: '#93c5fd',
      inputBorderFocus: '#0369a1',
      inputPlaceholder: '#60a5fa',
      // Button
      buttonBackground: '#e0f0ff',
      buttonBackgroundHover: '#dbeafe',
      buttonBorder: '#93c5fd',
      buttonText: '#1e3a5f',
      // Tooltip
      tooltipBackground: '#1e3a5f',
      tooltipText: '#f8fbff',
      tooltipBorder: '#1e40af',
      // Badge
      badgeBackground: '#bfdbfe',
      badgeText: '#1e40af',
      // Code
      codeBackground: '#e0f0ff',
      codeText: '#1e3a5f',
      codeBorder: '#bfdbfe',
      lineNumberText: '#3b82f6',
      lineHighlight: 'rgba(3, 105, 161, 0.1)',
      // Interactive
      focusRing: '#0369a1',
      focusRingOffset: '#f8fbff',
      selection: 'rgba(3, 105, 161, 0.2)',
      selectionText: '#1e3a5f',
      highlight: 'rgba(250, 204, 21, 0.4)',
      // Overlays & Shadows
      overlay: 'rgba(30, 58, 95, 0.3)',
      shadow: 'rgba(30, 58, 95, 0.1)',
      shadowStrong: 'rgba(30, 58, 95, 0.2)',
      glow: 'rgba(3, 105, 161, 0.3)',
      // Gradient
      gradientFrom: 'rgba(3, 105, 161, 0.12)',
      gradientVia: 'rgba(8, 145, 178, 0.1)',
      gradientTo: 'rgba(14, 165, 233, 0.12)',
      // Scrollbar
      scrollbarTrack: '#dbeafe',
      scrollbarThumb: '#60a5fa',
      scrollbarThumbHover: '#3b82f6',
      // Status Bar
      statusBarBackground: '#bfdbfe',
      statusBarBorder: '#93c5fd',
      statusBarText: '#1e40af',
      // Divider
      divider: '#bfdbfe',
      dividerStrong: '#93c5fd',
      // Preview
      previewBg: '#e0f0ff',
      previewDeviceBorder: '#93c5fd',
      previewDeviceNotch: 'rgba(59, 130, 246, 0.3)',
      previewUrlbarBg: 'rgba(224, 240, 255, 0.95)',
    },
  },

  'mint-fresh': {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    description: 'Refreshing light mint green',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#f5fdf9',
      backgroundElevated: '#e8faf2',
      surface: '#e8faf2',
      surfaceHover: '#ccfbf1',
      surfaceActive: '#99f6e4',
      surfaceElevated: '#f5fdf9',
      // Glass
      glass100: '#d1fae5',
      glass200: '#a7f3d0',
      glass300: '#6ee7b7',
      glass400: '#34d399',
      // Borders
      border: '#6ee7b7',
      borderHover: '#34d399',
      borderLight: '#a7f3d0',
      borderStrong: '#10b981',
      // Text
      textPrimary: '#064e3b',
      textSecondary: '#047857',
      textMuted: '#10b981',
      textDim: '#34d399',
      textInverse: '#f5fdf9',
      textOnAccent: '#ffffff',
      textHeading: '#064e3b',
      textLink: '#059669',
      textLinkHover: '#047857',
      // Primary Accent
      accent: '#059669',
      accentHover: '#047857',
      accentActive: '#065f46',
      accentSubtle: '#a7f3d0',
      accentMuted: 'rgba(5, 150, 105, 0.3)',
      // Secondary Accent
      secondary: '#14b8a6',
      secondaryHover: '#0d9488',
      secondarySubtle: '#99f6e4',
      // Tertiary Accent
      tertiary: '#0891b2',
      tertiaryHover: '#0e7490',
      tertiarySubtle: '#a5f3fc',
      // AI Colors
      aiAccent: '#7c3aed',
      aiAccentHover: '#6d28d9',
      aiAccentSubtle: '#ede9fe',
      aiSecondary: '#059669',
      aiSecondarySubtle: '#d1fae5',
      // Sidebar
      sidebarBackground: '#d1fae5',
      sidebarBorder: '#a7f3d0',
      sidebarItemHover: '#ccfbf1',
      sidebarItemActive: '#a7f3d0',
      // Header
      headerBackground: '#f5fdf9',
      headerBorder: '#a7f3d0',
      headerText: '#064e3b',
      // Modal
      modalBackground: '#f5fdf9',
      modalOverlay: 'rgba(6, 78, 59, 0.35)',
      modalBorder: '#6ee7b7',
      modalHeaderBg: '#e8faf2',
      // Input
      inputBackground: '#f5fdf9',
      inputBorder: '#6ee7b7',
      inputBorderFocus: '#059669',
      inputPlaceholder: '#34d399',
      // Button
      buttonBackground: '#d1fae5',
      buttonBackgroundHover: '#ccfbf1',
      buttonBorder: '#6ee7b7',
      buttonText: '#064e3b',
      // Tooltip
      tooltipBackground: '#064e3b',
      tooltipText: '#f5fdf9',
      tooltipBorder: '#047857',
      // Badge
      badgeBackground: '#a7f3d0',
      badgeText: '#047857',
      // Code
      codeBackground: '#d1fae5',
      codeText: '#064e3b',
      codeBorder: '#a7f3d0',
      lineNumberText: '#10b981',
      lineHighlight: 'rgba(5, 150, 105, 0.1)',
      // Interactive
      focusRing: '#059669',
      focusRingOffset: '#f5fdf9',
      selection: 'rgba(5, 150, 105, 0.2)',
      selectionText: '#064e3b',
      highlight: 'rgba(250, 204, 21, 0.4)',
      // Overlays & Shadows
      overlay: 'rgba(6, 78, 59, 0.3)',
      shadow: 'rgba(6, 78, 59, 0.1)',
      shadowStrong: 'rgba(6, 78, 59, 0.2)',
      glow: 'rgba(5, 150, 105, 0.3)',
      // Gradient
      gradientFrom: 'rgba(5, 150, 105, 0.12)',
      gradientVia: 'rgba(20, 184, 166, 0.1)',
      gradientTo: 'rgba(52, 211, 153, 0.12)',
      // Scrollbar
      scrollbarTrack: '#ccfbf1',
      scrollbarThumb: '#34d399',
      scrollbarThumbHover: '#10b981',
      // Status Bar
      statusBarBackground: '#a7f3d0',
      statusBarBorder: '#6ee7b7',
      statusBarText: '#065f46',
      // Divider
      divider: '#a7f3d0',
      dividerStrong: '#6ee7b7',
      // Preview
      previewBg: '#d1fae5',
      previewDeviceBorder: '#6ee7b7',
      previewDeviceNotch: 'rgba(16, 185, 129, 0.3)',
      previewUrlbarBg: 'rgba(209, 250, 229, 0.95)',
    },
  },

  'lavender-mist': {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    description: 'Soft lavender and purple hues',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#faf8ff',
      backgroundElevated: '#f3f0ff',
      surface: '#f3f0ff',
      surfaceHover: '#ede9fe',
      surfaceActive: '#ddd6fe',
      surfaceElevated: '#faf8ff',
      // Glass
      glass100: '#e9e5ff',
      glass200: '#ddd6fe',
      glass300: '#c4b5fd',
      glass400: '#a78bfa',
      // Borders
      border: '#c4b5fd',
      borderHover: '#a78bfa',
      borderLight: '#ddd6fe',
      borderStrong: '#8b5cf6',
      // Text
      textPrimary: '#3b1a6b',
      textSecondary: '#5b21b6',
      textMuted: '#7c3aed',
      textDim: '#a78bfa',
      textInverse: '#faf8ff',
      textOnAccent: '#ffffff',
      textHeading: '#3b1a6b',
      textLink: '#6d28d9',
      textLinkHover: '#5b21b6',
      // Primary Accent
      accent: '#7c3aed',
      accentHover: '#6d28d9',
      accentActive: '#5b21b6',
      accentSubtle: '#ddd6fe',
      accentMuted: 'rgba(124, 58, 237, 0.3)',
      // Secondary Accent
      secondary: '#a855f7',
      secondaryHover: '#9333ea',
      secondarySubtle: '#f3e8ff',
      // Tertiary Accent
      tertiary: '#ec4899',
      tertiaryHover: '#db2777',
      tertiarySubtle: '#fce7f3',
      // AI Colors
      aiAccent: '#a855f7',
      aiAccentHover: '#9333ea',
      aiAccentSubtle: '#f3e8ff',
      aiSecondary: '#ec4899',
      aiSecondarySubtle: '#fce7f3',
      // Sidebar
      sidebarBackground: '#e9e5ff',
      sidebarBorder: '#ddd6fe',
      sidebarItemHover: '#ede9fe',
      sidebarItemActive: '#ddd6fe',
      // Header
      headerBackground: '#faf8ff',
      headerBorder: '#ddd6fe',
      headerText: '#3b1a6b',
      // Modal
      modalBackground: '#faf8ff',
      modalOverlay: 'rgba(59, 26, 107, 0.35)',
      modalBorder: '#c4b5fd',
      modalHeaderBg: '#f3f0ff',
      // Input
      inputBackground: '#faf8ff',
      inputBorder: '#c4b5fd',
      inputBorderFocus: '#7c3aed',
      inputPlaceholder: '#a78bfa',
      // Button
      buttonBackground: '#e9e5ff',
      buttonBackgroundHover: '#ede9fe',
      buttonBorder: '#c4b5fd',
      buttonText: '#3b1a6b',
      // Tooltip
      tooltipBackground: '#3b1a6b',
      tooltipText: '#faf8ff',
      tooltipBorder: '#5b21b6',
      // Badge
      badgeBackground: '#ddd6fe',
      badgeText: '#5b21b6',
      // Code
      codeBackground: '#e9e5ff',
      codeText: '#3b1a6b',
      codeBorder: '#ddd6fe',
      lineNumberText: '#7c3aed',
      lineHighlight: 'rgba(124, 58, 237, 0.1)',
      // Interactive
      focusRing: '#7c3aed',
      focusRingOffset: '#faf8ff',
      selection: 'rgba(124, 58, 237, 0.2)',
      selectionText: '#3b1a6b',
      highlight: 'rgba(250, 204, 21, 0.4)',
      // Overlays & Shadows
      overlay: 'rgba(59, 26, 107, 0.3)',
      shadow: 'rgba(59, 26, 107, 0.1)',
      shadowStrong: 'rgba(59, 26, 107, 0.2)',
      glow: 'rgba(124, 58, 237, 0.3)',
      // Gradient
      gradientFrom: 'rgba(124, 58, 237, 0.12)',
      gradientVia: 'rgba(168, 85, 247, 0.1)',
      gradientTo: 'rgba(192, 132, 252, 0.12)',
      // Scrollbar
      scrollbarTrack: '#ede9fe',
      scrollbarThumb: '#a78bfa',
      scrollbarThumbHover: '#8b5cf6',
      // Status Bar
      statusBarBackground: '#ddd6fe',
      statusBarBorder: '#c4b5fd',
      statusBarText: '#5b21b6',
      // Divider
      divider: '#ddd6fe',
      dividerStrong: '#c4b5fd',
      // Preview
      previewBg: '#e9e5ff',
      previewDeviceBorder: '#c4b5fd',
      previewDeviceNotch: 'rgba(124, 58, 237, 0.3)',
      previewUrlbarBg: 'rgba(233, 229, 255, 0.95)',
    },
  },

  'peach-blossom': {
    id: 'peach-blossom',
    name: 'Peach Blossom',
    description: 'Warm peach and coral tones',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#fffaf8',
      backgroundElevated: '#fff5f0',
      surface: '#fff5f0',
      surfaceHover: '#fed7c7',
      surfaceActive: '#fdba9a',
      surfaceElevated: '#fffaf8',
      // Glass
      glass100: '#ffeee5',
      glass200: '#fed7c7',
      glass300: '#fdba9a',
      glass400: '#fb923c',
      // Borders
      border: '#fdba9a',
      borderHover: '#fb923c',
      borderLight: '#fed7c7',
      borderStrong: '#ea580c',
      // Text
      textPrimary: '#7c2d12',
      textSecondary: '#9a3412',
      textMuted: '#c2410c',
      textDim: '#ea580c',
      textInverse: '#fffaf8',
      textOnAccent: '#ffffff',
      textHeading: '#7c2d12',
      textLink: '#c2410c',
      textLinkHover: '#9a3412',
      // Primary Accent
      accent: '#ea580c',
      accentHover: '#c2410c',
      accentActive: '#9a3412',
      accentSubtle: '#fed7aa',
      accentMuted: 'rgba(234, 88, 12, 0.3)',
      // Secondary Accent
      secondary: '#f97316',
      secondaryHover: '#ea580c',
      secondarySubtle: '#ffedd5',
      // Tertiary Accent
      tertiary: '#f472b6',
      tertiaryHover: '#ec4899',
      tertiarySubtle: '#fce7f3',
      // AI Colors
      aiAccent: '#fb923c',
      aiAccentHover: '#f97316',
      aiAccentSubtle: '#ffedd5',
      aiSecondary: '#f472b6',
      aiSecondarySubtle: '#fce7f3',
      // Sidebar
      sidebarBackground: '#ffeee5',
      sidebarBorder: '#fed7c7',
      sidebarItemHover: '#fed7c7',
      sidebarItemActive: '#fed7aa',
      // Header
      headerBackground: '#fffaf8',
      headerBorder: '#fed7c7',
      headerText: '#7c2d12',
      // Modal
      modalBackground: '#fffaf8',
      modalOverlay: 'rgba(124, 45, 18, 0.35)',
      modalBorder: '#fdba9a',
      modalHeaderBg: '#fff5f0',
      // Input
      inputBackground: '#fffaf8',
      inputBorder: '#fdba9a',
      inputBorderFocus: '#ea580c',
      inputPlaceholder: '#ea580c',
      // Button
      buttonBackground: '#ffeee5',
      buttonBackgroundHover: '#fed7c7',
      buttonBorder: '#fdba9a',
      buttonText: '#7c2d12',
      // Tooltip
      tooltipBackground: '#7c2d12',
      tooltipText: '#fffaf8',
      tooltipBorder: '#9a3412',
      // Badge
      badgeBackground: '#fed7c7',
      badgeText: '#9a3412',
      // Code
      codeBackground: '#ffeee5',
      codeText: '#7c2d12',
      codeBorder: '#fed7c7',
      lineNumberText: '#c2410c',
      lineHighlight: 'rgba(234, 88, 12, 0.1)',
      // Interactive
      focusRing: '#ea580c',
      focusRingOffset: '#fffaf8',
      selection: 'rgba(234, 88, 12, 0.2)',
      selectionText: '#7c2d12',
      highlight: 'rgba(250, 204, 21, 0.4)',
      // Overlays & Shadows
      overlay: 'rgba(124, 45, 18, 0.3)',
      shadow: 'rgba(124, 45, 18, 0.1)',
      shadowStrong: 'rgba(124, 45, 18, 0.2)',
      glow: 'rgba(234, 88, 12, 0.3)',
      // Gradient
      gradientFrom: 'rgba(234, 88, 12, 0.12)',
      gradientVia: 'rgba(249, 115, 22, 0.1)',
      gradientTo: 'rgba(251, 146, 60, 0.12)',
      // Scrollbar
      scrollbarTrack: '#fed7c7',
      scrollbarThumb: '#fb923c',
      scrollbarThumbHover: '#ea580c',
      // Status Bar
      statusBarBackground: '#fed7c7',
      statusBarBorder: '#fdba9a',
      statusBarText: '#7c2d12',
      // Divider
      divider: '#fed7c7',
      dividerStrong: '#fdba9a',
      // Preview
      previewBg: '#ffeee5',
      previewDeviceBorder: '#fdba9a',
      previewDeviceNotch: 'rgba(194, 65, 12, 0.3)',
      previewUrlbarBg: 'rgba(255, 238, 229, 0.95)',
    },
  },

  'sage-meadow': {
    id: 'sage-meadow',
    name: 'Sage Meadow',
    description: 'Calm sage green and earth tones',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#f8faf6',
      backgroundElevated: '#f0f5ed',
      surface: '#f0f5ed',
      surfaceHover: '#dce8d5',
      surfaceActive: '#c5d9ba',
      surfaceElevated: '#f8faf6',
      // Glass
      glass100: '#e5eedf',
      glass200: '#d4e3cc',
      glass300: '#b8d4a8',
      glass400: '#8fc278',
      // Borders
      border: '#b8d4a8',
      borderHover: '#8fc278',
      borderLight: '#d4e3cc',
      borderStrong: '#5a9e3e',
      // Text
      textPrimary: '#2d3a28',
      textSecondary: '#3d5235',
      textMuted: '#5a7a4d',
      textDim: '#8fc278',
      textInverse: '#f8faf6',
      textOnAccent: '#ffffff',
      textHeading: '#2d3a28',
      textLink: '#4a8033',
      textLinkHover: '#3d6a2a',
      // Primary Accent
      accent: '#5a9e3e',
      accentHover: '#4a8033',
      accentActive: '#3d6a2a',
      accentSubtle: '#d4e3cc',
      accentMuted: 'rgba(90, 158, 62, 0.3)',
      // Secondary Accent
      secondary: '#65a30d',
      secondaryHover: '#4d7c0f',
      secondarySubtle: '#ecfccb',
      // Tertiary Accent
      tertiary: '#a16207',
      tertiaryHover: '#854d0e',
      tertiarySubtle: '#fef3c7',
      // AI Colors
      aiAccent: '#65a30d',
      aiAccentHover: '#4d7c0f',
      aiAccentSubtle: '#ecfccb',
      aiSecondary: '#a16207',
      aiSecondarySubtle: '#fef3c7',
      // Sidebar
      sidebarBackground: '#e5eedf',
      sidebarBorder: '#d4e3cc',
      sidebarItemHover: '#dce8d5',
      sidebarItemActive: '#d4e3cc',
      // Header
      headerBackground: '#f8faf6',
      headerBorder: '#d4e3cc',
      headerText: '#2d3a28',
      // Modal
      modalBackground: '#f8faf6',
      modalOverlay: 'rgba(45, 58, 40, 0.35)',
      modalBorder: '#b8d4a8',
      modalHeaderBg: '#f0f5ed',
      // Input
      inputBackground: '#f8faf6',
      inputBorder: '#b8d4a8',
      inputBorderFocus: '#5a9e3e',
      inputPlaceholder: '#8fc278',
      // Button
      buttonBackground: '#e5eedf',
      buttonBackgroundHover: '#dce8d5',
      buttonBorder: '#b8d4a8',
      buttonText: '#2d3a28',
      // Tooltip
      tooltipBackground: '#2d3a28',
      tooltipText: '#f8faf6',
      tooltipBorder: '#3d5235',
      // Badge
      badgeBackground: '#d4e3cc',
      badgeText: '#3d5235',
      // Code
      codeBackground: '#e5eedf',
      codeText: '#2d3a28',
      codeBorder: '#d4e3cc',
      lineNumberText: '#5a7a4d',
      lineHighlight: 'rgba(90, 158, 62, 0.1)',
      // Interactive
      focusRing: '#5a9e3e',
      focusRingOffset: '#f8faf6',
      selection: 'rgba(90, 158, 62, 0.2)',
      selectionText: '#2d3a28',
      highlight: 'rgba(250, 204, 21, 0.4)',
      // Overlays & Shadows
      overlay: 'rgba(45, 58, 40, 0.3)',
      shadow: 'rgba(45, 58, 40, 0.1)',
      shadowStrong: 'rgba(45, 58, 40, 0.2)',
      glow: 'rgba(90, 158, 62, 0.3)',
      // Gradient
      gradientFrom: 'rgba(90, 158, 62, 0.12)',
      gradientVia: 'rgba(101, 163, 13, 0.1)',
      gradientTo: 'rgba(143, 194, 120, 0.12)',
      // Scrollbar
      scrollbarTrack: '#dce8d5',
      scrollbarThumb: '#8fc278',
      scrollbarThumbHover: '#5a9e3e',
      // Status Bar
      statusBarBackground: '#d4e3cc',
      statusBarBorder: '#b8d4a8',
      statusBarText: '#2a4020',
      // Divider
      divider: '#d4e3cc',
      dividerStrong: '#b8d4a8',
      // Preview
      previewBg: '#e5eedf',
      previewDeviceBorder: '#b8d4a8',
      previewDeviceNotch: 'rgba(90, 122, 77, 0.3)',
      previewUrlbarBg: 'rgba(229, 238, 223, 0.95)',
    },
  },

  'arctic-frost': {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    description: 'Cool icy blue and silver tones',
    monacoTheme: 'vs',
    colors: {
      // Base
      background: '#f8fcff',
      backgroundElevated: '#eff8ff',
      surface: '#eff8ff',
      surfaceHover: '#dbeefa',
      surfaceActive: '#bce0f5',
      surfaceElevated: '#f8fcff',
      // Glass
      glass100: '#e5f3fc',
      glass200: '#cce7f8',
      glass300: '#a3d4f0',
      glass400: '#6bb8e3',
      // Borders
      border: '#a3d4f0',
      borderHover: '#6bb8e3',
      borderLight: '#cce7f8',
      borderStrong: '#2e9fd6',
      // Text
      textPrimary: '#1a3a4f',
      textSecondary: '#2a5570',
      textMuted: '#4a8aa8',
      textDim: '#6bb8e3',
      textInverse: '#f8fcff',
      textOnAccent: '#ffffff',
      textHeading: '#1a3a4f',
      textLink: '#2e9fd6',
      textLinkHover: '#2380b0',
      // Primary Accent
      accent: '#2e9fd6',
      accentHover: '#2380b0',
      accentActive: '#1c6892',
      accentSubtle: '#cce7f8',
      accentMuted: 'rgba(46, 159, 214, 0.3)',
      // Secondary Accent
      secondary: '#0891b2',
      secondaryHover: '#0e7490',
      secondarySubtle: '#cffafe',
      // Tertiary Accent
      tertiary: '#6366f1',
      tertiaryHover: '#4f46e5',
      tertiarySubtle: '#e0e7ff',
      // AI Colors
      aiAccent: '#6366f1',
      aiAccentHover: '#4f46e5',
      aiAccentSubtle: '#e0e7ff',
      aiSecondary: '#2e9fd6',
      aiSecondarySubtle: '#cce7f8',
      // Sidebar
      sidebarBackground: '#e5f3fc',
      sidebarBorder: '#cce7f8',
      sidebarItemHover: '#dbeefa',
      sidebarItemActive: '#cce7f8',
      // Header
      headerBackground: '#f8fcff',
      headerBorder: '#cce7f8',
      headerText: '#1a3a4f',
      // Modal
      modalBackground: '#f8fcff',
      modalOverlay: 'rgba(26, 58, 79, 0.35)',
      modalBorder: '#a3d4f0',
      modalHeaderBg: '#eff8ff',
      // Input
      inputBackground: '#f8fcff',
      inputBorder: '#a3d4f0',
      inputBorderFocus: '#2e9fd6',
      inputPlaceholder: '#6bb8e3',
      // Button
      buttonBackground: '#e5f3fc',
      buttonBackgroundHover: '#dbeefa',
      buttonBorder: '#a3d4f0',
      buttonText: '#1a3a4f',
      // Tooltip
      tooltipBackground: '#1a3a4f',
      tooltipText: '#f8fcff',
      tooltipBorder: '#2a5570',
      // Badge
      badgeBackground: '#cce7f8',
      badgeText: '#2a5570',
      // Code
      codeBackground: '#e5f3fc',
      codeText: '#1a3a4f',
      codeBorder: '#cce7f8',
      lineNumberText: '#4a8aa8',
      lineHighlight: 'rgba(46, 159, 214, 0.1)',
      // Interactive
      focusRing: '#2e9fd6',
      focusRingOffset: '#f8fcff',
      selection: 'rgba(46, 159, 214, 0.2)',
      selectionText: '#1a3a4f',
      highlight: 'rgba(250, 204, 21, 0.4)',
      // Overlays & Shadows
      overlay: 'rgba(26, 58, 79, 0.3)',
      shadow: 'rgba(26, 58, 79, 0.1)',
      shadowStrong: 'rgba(26, 58, 79, 0.2)',
      glow: 'rgba(46, 159, 214, 0.3)',
      // Gradient
      gradientFrom: 'rgba(46, 159, 214, 0.12)',
      gradientVia: 'rgba(8, 145, 178, 0.1)',
      gradientTo: 'rgba(107, 184, 227, 0.12)',
      // Scrollbar
      scrollbarTrack: '#dbeefa',
      scrollbarThumb: '#6bb8e3',
      scrollbarThumbHover: '#2e9fd6',
      // Status Bar
      statusBarBackground: '#cce7f8',
      statusBarBorder: '#a3d4f0',
      statusBarText: '#1a4858',
      // Divider
      divider: '#cce7f8',
      dividerStrong: '#a3d4f0',
      // Preview
      previewBg: '#e5f3fc',
      previewDeviceBorder: '#a3d4f0',
      previewDeviceNotch: 'rgba(74, 138, 168, 0.3)',
      previewUrlbarBg: 'rgba(229, 243, 252, 0.95)',
    },
  },
};

export const DEFAULT_THEME: ThemeId = 'midnight-glass';

// Storage key for theme
export const THEME_STORAGE_KEY = 'fluidflow_theme';
