# Changelog

All notable changes to FluidFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2025-12-28

### Added
- Monaco Editor auto-sync with app theme (light/dark/high-contrast)
- Editor theme automatically updates when app theme changes
- Info message in Editor settings panel explaining auto-sync behavior

### Changed
- **Theme System: 100% hardcoded color elimination**
  - All hardcoded hex colors (#ffffff, #000000, etc.) migrated to CSS custom properties
  - Gradient button text colors now use `var(--theme-text-on-accent)` for proper contrast
  - Panel resize divider colors migrated from hardcoded `blue-500` to theme accent
  - Box shadow patterns now use theme variables (`var(--theme-shadow-strong)`)
  - StatusBar uses dedicated CSS variables (`--theme-statusbar-bg`, `--theme-statusbar-text`, etc.)
  - Removed `backdrop-blur-sm` from StatusBar to improve contrast
- **Light theme contrast improvements**
  - StatusBar background and text colors optimized for all 12 light themes
  - Increased color contrast ratios for better readability
  - Snow White, Marble, Parchment, Porcelain themes: darker backgrounds, stronger text
  - Sky Blue, Mint Fresh, Lavender Mist themes: enhanced visibility
- Editor theme selector now read-only with "Active" badge (auto-syncs with app theme)
- Panel resize divider now uses theme-aware hover and drag states

### Fixed
- Gradient buttons unreadable on light themes (text color contrast issue)
- StatusBar text difficult to read on light theme backgrounds
- Panel resize divider hardcoded blue color conflicting with theme colors
- Monaco Editor theme not updating when switching between light and dark app themes

### Technical
- `useEditorSettings` hook now integrates with `ThemeContext` for automatic theme sync
- Added dependency on `currentTheme` to re-apply Monaco theme on app theme change
- Intentional hardcoded colors documented (macOS Traffic Lights, Monaco theme previews)
- All UI components now 100% theme-variable driven (except intentional constants)

## [0.8.0] - 2025-12-28

### Added
- Project screenshot lightbox for full-size preview before opening projects
- Projects panel redesigned with 3-column vertical card layout
- 4:3 aspect ratio thumbnail display with zoom overlay on hover
- Resolution indicator in lightbox showing image dimensions

### Changed
- Screenshots now saved at 100% quality with no resizing or compression
- Thumbnail field stores original full-quality image (CSS handles display sizing)
- Binary file reading (PNG, JPG, etc.) properly converts to data URL
- Projects panel uses responsive grid (1/2/3 columns based on viewport)

### Fixed
- **Critical:** `.fluidflow` folder no longer deleted during project save/auto-save
- Added `.fluidflow` to `IGNORED_FOLDERS` to preserve screenshots and metadata
- Fixed binary image corruption when reading screenshot files from server
- Lightbox now correctly loads full-size screenshots from `.fluidflow/` folder

## [0.7.0] - 2025-12-26

### Added
- AI Context system for consistent AI responses across sessions
  - Style Guide generation (colors, typography, patterns, conventions)
  - Project Summary generation (purpose, architecture, key files, tech stack)
  - ~1K token context included in every prompt (vs 50K+ file tokens)
  - Context Manager modal with AI Context tab for viewing/deleting
- AI Context indicator in ContextIndicator component (purple sparkle badge)
- "Generate AI Context" prompt banner when project has no context
- Automatic AI Context cleanup on Start Fresh and project deletion

### Changed
- ContextIndicator now shows project context status and token count
- ContextManagerModal has new "AI Context" tab with style guide and project summary preview

## [0.6.0] - 2025-12-25

### Added
- Project Health system for detecting missing/corrupted critical files
- Auto-fix capability for package.json, vite.config.ts, tsconfig.json, index.html, etc.
- Health indicator in StatusBar showing project status (Fix Required / Check Health)
- ProjectHealthModal with issue selection and bulk fix options
- Critical file templates for scaffolding missing configurations

### Changed
- StatusBar now includes project health monitoring
- IDEFrame supports health check callback

## [0.5.0] - 2025-12-25

### Added
- Smart File Context tracking system with delta mode for token optimization
- Prompt Confirmation modal for reviewing AI requests before sending
- File context info display in prompts (files in prompt, tokens saved)
- Token savings indicator in StatusBar showing context optimization
- Settings panel for Smart File Context with reset functionality
- CodebaseSync integration with file context tracker
- Version checking and changelog display system
- About panel in settings with app info and update notifications

### Changed
- Context compaction now uses remaining-space-based threshold instead of usage-based
- Improved StatusBar with real-time status tracking via StatusBarContext
- Enhanced IDEFrame with activity bar, title bar integration

### Fixed
- ActivityBar tooltip positioning and styling
- Auto-commit status display in StatusBar

## [0.4.0] - 2025-12-24

### Added
- GitHub clone-by-URL import mode for projects
- Backup settings moved to dedicated panel
- Conversation history sync option for GitHub push
- `.fluidflow/` metadata directory for project settings

### Changed
- Reorganized GitHub settings panel layout
- Improved project import/export workflow

## [0.3.0] - 2025-12-23

### Added
- Multi-provider AI support (Gemini, OpenAI, Anthropic, OpenRouter, Ollama, LM Studio)
- Live preview with device simulation (desktop, tablet, mobile)
- Git integration with commit history and diff viewer
- WIP (Work In Progress) persistence via IndexedDB
- Monaco Editor integration with syntax highlighting
- Console and network log panels

### Changed
- Switched to Express 5 for backend API
- Improved streaming response handling

### Fixed
- CORS issues with local AI providers
- WebContainer API HTTPS requirement handling

## [0.2.0] - 2025-12-20

### Added
- Sketch-to-code conversion using AI
- Basic project management (create, load, save)
- File tree with create/rename/delete operations
- Tailwind CSS support in generated code

### Changed
- Migrated from Create React App to Vite
- Updated to React 19

## [0.1.0] - 2025-12-15

### Added
- Initial project setup
- Basic React application structure
- Vite build configuration
- TypeScript configuration
- ESLint and Prettier setup
