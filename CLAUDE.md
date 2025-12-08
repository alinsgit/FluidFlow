# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FluidFlow is a sketch-to-app prototyping tool that uses AI to convert wireframes/sketches into functional React applications. It features a glassmorphism UI and provides real-time preview of generated apps. The application has evolved into a full-stack development environment with local projects storage, AI-powered code generation, and integrated development tools.

## Development Commands

### Installation & Setup
```bash
npm install          # Install dependencies
```

### Development Servers
```bash
npm run dev          # Start both frontend (port 3100) and backend (port 3200) servers
npm run dev:frontend # Start only frontend development server (Vite on port 3100)
npm run dev:server   # Start only backend development server (Express on port 3200)
npm run server       # Start backend server only (tsx)
```

### Building & Production
```bash
npm run build        # Build for production (Vite bundle)
npm run preview      # Preview production build locally
```

### Code Quality
```bash
npm run type-check   # TypeScript type checking (tsc --noEmit)
npm run lint         # ESLint checking (max-warnings: 0)
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check Prettier formatting
```

### Testing
```bash
npm test             # Run tests in watch mode (Vitest)
npm test:run         # Run tests once (CI mode)
npm test:coverage    # Run tests with coverage report
npm test:ui          # Run tests with Vitest UI
npm run test:security # Run security tests only
```

### Custom Test Commands
```bash
# Run specific test file
npm test -- utils/safeJson.test.ts

# Run tests with coverage threshold
npm run test:coverage -- --reporter=verbose

# Run tests matching pattern
npm test -- --grep "XSS Prevention"
```

## Environment Setup

Create a `.env` or `.env.local` file with:
```
GEMINI_API_KEY=your_gemini_api_key
```

## Architecture

### Full-Stack Architecture

**Backend (Express.js on port 3200)**
- `server/index.ts` - Main Express server with CORS configuration
- `server/api/` - API endpoints:
  - `projects.ts` - Project CRUD operations and file management
  - `git.ts` - Git operations (init, status, commit, push)
  - `github.ts` - GitHub integration (create repo, push)
  - `settings.ts` - Settings persistence
  - `runner.ts` - Project execution/preview server

**Frontend (React + Vite on port 3100)**
- `index.tsx` - React entry point
- `App.tsx` - Main application with comprehensive state management

### File Structure

**Core Components:**
- `components/ControlPanel/` - Left sidebar containing:
  - `ChatPanel.tsx` - AI chat interface with context management
  - `PromptInput.tsx` - Text input with voice recognition
  - `ProjectPanel.tsx` - Project management interface
  - `FileExplorer.tsx` - Virtual file system navigation
  - `ModeToggle.tsx` - Engineer/Consultant mode switch
- `components/PreviewPanel/` - Right panel containing:
  - `CodeEditor.tsx` - Monaco editor with syntax highlighting
  - `ConsolePanel.tsx` - Live console and network monitoring
  - `FileExplorer.tsx` - File tree view
  - `ComponentInspector.tsx` - Element inspection and quick edits
  - `RunnerPanel.tsx` - Project execution environment
  - `GitPanel.tsx` - Git status and operations
  - `DebugPanel.tsx` - Debug logs and AI request monitoring

**Key Features:**
- `AIHistoryModal.tsx` - AI generation history with response recovery
- `PromptImproverModal.tsx` - AI-powered prompt enhancement
- `ProjectManager.tsx` - Multi-project management
- `GitPanel.tsx` - Git version control integration
- `SyncConfirmationDialog.tsx` - Project sync confirmation
- `CompactionConfirmModal.tsx` - History compaction management

### Key Patterns

**Virtual File System**: The app manages a virtual file system (`FileSystem` type defined in `types/index.ts`) that stores generated React project files. Files are persisted locally in the `projects/` directory.

**AI Provider Architecture**: Multi-provider AI support with:
- Default: Google Gemini (Gemini 2.5 Flash/Pro, Gemini 3 Pro)
- Supported: OpenAI, Anthropic, Ollama, LMStudio, Custom/OpenRouter endpoints
- Provider configuration in `services/ai/`

**State Management**:
- Centralized state in `App.tsx` with React hooks
- IndexedDB WIP (Work In Progress) storage for page refresh resilience
- Git-centric approach with explicit commit operations
- Conversation context management for AI interactions

**Preview & Execution**:
- Live iframe preview with device simulation
- In-browser transpilation using Babel
- Custom import resolution for virtual files
- Console/network interception via postMessage
- Project runner service for executing generated applications

### Services Architecture

**AI Service (`services/ai/`)**:
- Multi-provider abstraction layer
- Streaming generation support
- Prompt context management
- Debug logging for AI requests/responses

**Project API (`services/projectApi.ts`)**:
- CRUD operations for projects
- Git integration with simple-git
- GitHub API integration
- Settings persistence
- Local file system operations

### Data Flow

1. User uploads sketch or provides prompt → ChatPanel
2. AI Provider processes request → generation with context
3. Response goes through `reviewChange()` → DiffModal for approval
4. Approved changes update `files` state → saved to project directory
5. Changes can be committed to git → optionally pushed to GitHub

### Storage

- **Projects**: Stored in `projects/[projectId]/files/` directory
- **WIP Data**: IndexedDB for unsaved changes
- **Settings**: LocalStorage/Server persistence
- **History**: In-memory with optional compaction

## Dependencies

### Core Stack
- React 19 with TypeScript 5.8
- Vite 6 for bundling and dev server
- Express.js 5 for backend API
- Node.js with tsx for TypeScript execution

### Key Libraries
- `@monaco-editor/react` - Code editing with syntax highlighting
- `@google/genai` - Gemini AI integration
- `lucide-react` - Icon library
- `diff` - File comparison and diff generation
- `simple-git` - Git operations wrapper
- `jszip` - ZIP file creation and downloads
- `file-saver` - Browser file download utility
- `cors` - Cross-origin resource sharing middleware

### Testing & Quality
- Vitest 2 - Unit testing framework
- @vitest/ui - Interactive test UI
- @vitest/coverage-v8 - Code coverage reporting
- ESLint with security plugin
- Prettier - Code formatting

### AI & Development
- Multiple AI provider SDKs (OpenAI, Anthropic, GLM, etc.)
- Babel for in-browser transpilation
- Git version control integration
- Tailwind CSS for styling

## Path Aliases

`@/*` maps to project root directory

Additional aliases configured in `vitest.config.ts`:
- `@utils` → `/utils`
- `@components` → `/components`
- `@services` → `/services`
- `@hooks` → `/hooks`
- `@types` → `/types`
- `@server` → `/server`

## Key Directories

- `server/` - Express backend API (port 3200)
- `services/` - Frontend service layer (AI, project API, context)
- `components/` - React components (ControlPanel, PreviewPanel, modals)
- `hooks/` - Custom React hooks (state management)
- `utils/` - Utility functions (cleaning, validation, code analysis)
- `types/` - TypeScript type definitions
- `tests/` - Test files (unit, integration, security)
- `projects/` - Local project storage (auto-generated)
- `bundlesize.config.json` - Bundle size configuration

## Testing Architecture

### Testing Stack
- **Framework**: Vitest 2 with jsdom environment
- **Coverage**: v8 provider with HTML/JSON/text reporters
- **Setup**: `tests/setup.ts` - Test globals and custom matchers

### Test Structure
```
tests/
├── setup.ts                 # Test environment configuration
├── utils/
│   ├── safeJson.test.ts    # JSON parsing tests (BUG-004)
│   └── validation.test.ts  # Input validation tests
├── security/
│   └── validation.test.ts  # XSS/SQL injection/path traversal tests
└── integration/
    └── api.test.ts         # API integration tests
```

### Custom Matchers
Tests define custom matchers for project validation:
- `toBeValidProjectId()` - Validates project ID format
- `toBeValidFilePath()` - Prevents path traversal attacks

### Security Testing
Security tests cover:
- **XSS Prevention**: Script tags, event handlers, CSS expressions
- **Path Traversal**: Absolute paths, relative traversal, encoding, null bytes
- **SQL Injection**: Basic keyword escaping
- **Content Security**: Unicode attacks, mixed encoding

### Test Coverage Exclusions
Coverage excludes:
- `node_modules/`
- `tests/`
- `dist/`
- `**/*.d.ts`
- `**/*.config.*`

## Code Quality Configuration

### ESLint Configuration (`.eslintrc.js`)
**Security Rules** (security/detect-* plugin):
- Object injection detection
- Buffer safety checks
- Child process detection
- Eval expression detection
- Fs filename validation
- Timing attack detection
- Pseudo-random bytes detection

**React Rules**:
- `react-hooks/rules-of-hooks` - Enforced
- `react-hooks/exhaustive-deps` - Warning
- `react-refresh/only-export-components` - Hot reload support

**TypeScript Rules**:
- Unused variables (error)
- No explicit `any` (warning)
- Non-null assertion (warning)
- Prefer nullish coalescing (error)
- Prefer optional chain (error)
- No floating promises (error)

**Formatting Rules**:
- 2-space indentation
- Single quotes (with escape)
- Double quotes for JSX
- Semicolons required
- Max line length: 100 (warning)
- Trailing spaces: error
- EOF newline: error

### Environment Variables

**Required** (`.env.local`):
```env
GEMINI_API_KEY=your_gemini_api_key  # Primary AI provider
```

**Optional**:
```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
VITE_API_URL=http://localhost:3200/api  # Backend API URL
```

### Vite Configuration (`vite.config.ts`)

**Server**:
- Port: 3100
- Host: 0.0.0.0 (accessible from network)
- Watch ignore: `projects/**`, `node_modules/**`, `.git/**`

**Build**:
- External dependencies: TypeScript parser, acorn, glob, fs, path, os
- CSS: PostCSS with Tailwind

**Define**:
- Exposes API keys to client code (process.env.*)

### TypeScript Configuration (`tsconfig.json`)

**Key Settings**:
- Target: ES2022
- Module: ESNext (ESM)
- JSX: react-jsx (React 17+ automatic runtime)
- ModuleResolution: bundler
- Path mapping: `@/*` → `./*`
- Type checking: Enabled with strict options

## Critical Files to Understand

### Core Application
- `App.tsx` - Main application orchestrator, state management, diff modal
- `index.tsx` - React entry point

### Backend API
- `server/index.ts` - Express server with CORS, middleware setup
- `server/api/projects.ts` - Project CRUD, file management, git operations
- `server/api/git.ts` - Git initialization, status, commit, push
- `server/api/github.ts` - GitHub repository creation and integration
- `server/api/settings.ts` - Provider and app settings persistence
- `server/api/runner.ts` - Project execution and preview server

### AI System
- `services/ai/index.ts` - Provider manager, factory pattern, localStorage sync
- `services/ai/providers/gemini.ts` - Google Gemini implementation
- `services/ai/providers/openai.ts` - OpenAI/OpenRouter/Custom API (OpenAI-compatible)
- `services/ai/providers/anthropic.ts` - Anthropic Claude implementation
- `services/ai/providers/zai.ts` - Z.AI GLM provider
- `services/ai/providers/ollama.ts` - Ollama local LLM
- `services/ai/providers/lmstudio.ts` - LMStudio API
- `services/ai/types.ts` - Provider interfaces and types

### Project Management
- `services/projectApi.ts` - Backend API client, project CRUD, git integration
- `services/conversationContext.ts` - Context management, token tracking, compaction
- `hooks/useProject.ts` - Project state and git operations
- `hooks/useVersionHistory.ts` - Undo/redo with IndexedDB persistence

### Utility Functions
- `utils/cleanCode.ts` - AI response cleaning, code extraction, parsing
- `utils/validation.ts` - Security validation, XSS prevention, path sanitization
- `utils/safeJson.ts` - Safe JSON parsing with fallback handling
- `utils/codemap.ts` - Project structure analysis and file mapping

### Key Components
**ControlPanel** (left sidebar):
- `index.tsx` - Main orchestrator, AI call handling, state updates
- `ChatPanel.tsx` - Message display, context indicator, history
- `ChatInput.tsx` - Text input with voice recognition, file attachments
- `SettingsPanel.tsx` - Provider configuration, model selection, debug mode
- `ModeToggle.tsx` - Engineer vs Consultant mode switching
- `PromptImproverModal.tsx` - Interactive prompt enhancement
- `ProjectPanel.tsx` - Project management, cloud sync, WIP persistence

**PreviewPanel** (right panel):
- `index.tsx` - Preview rendering, AI features (auto-fix, quick edit, a11y)
- `CodeEditor.tsx` - Monaco editor, syntax highlighting, split view
- `ConsolePanel.tsx` - DevTools console, network monitoring
- `FileExplorer.tsx` - Virtual file tree, file operations
- `DebugPanel.tsx` - API call inspector, JSON viewer, filtering
- `GitPanel.tsx` - Git status, commit operations, history
- `RunnerPanel.tsx` - Project execution environment
- `ComponentInspector.tsx` - Element inspection, quick component edits

### State Management Pattern

**Centralized State in App.tsx**:
- `files` - Virtual file system (Record<string, string>)
- `currentProject` - Project metadata
- `isGenerating` - Loading state
- `selectedFile` - Active file in editor
- `diff` - Current diff data
- `gitStatus` - Git repository status
- `conversationHistory` - AI conversation context
- `aiHistory` - Generation history for recovery

**Persistence**:
- **LocalStorage**: Provider configs, active provider, UI preferences
- **IndexedDB**: WIP (Work In Progress) data for refresh resilience
- **File System**: Persisted projects in `projects/[id]/files/`
- **Git**: Version history with explicit commits

**State Flow**:
```
User Input → ControlPanel.handleSend()
    ↓
AI Provider (streaming)
    ↓
Parse Response → Extract Files
    ↓
DiffModal (review changes)
    ↓
Confirm → Update State → Save to FS
    ↓
PreviewPanel (live render via iframe)
```

### AI Provider Architecture

**Provider Types**:
- `gemini` - Google Gemini (2.5 Flash, 2.5 Pro, 3 Pro)
- `openai` - OpenAI (GPT-4o, GPT-4o Mini)
- `openrouter` - OpenRouter (100+ models)
- `custom` - OpenAI-compatible custom endpoints
- `anthropic` - Claude (4.5 Sonnet, 4.5 Opus)
- `zai` - Z.AI GLM (GLM-4.6, GLM-4.5)
- `ollama` - Ollama (local LLMs)
- `lmstudio` - LMStudio API

**Provider Manager** (`ProviderManager` class):
- Caches provider instances
- Manages configuration persistence (localStorage + backend)
- Handles initialization (localStorage fast, backend async)
- Provides factory pattern for creating providers
- Test connection method for each provider

**Generation Methods**:
- `generate()` - Standard generation
- `generateStream()` - Streaming with onChunk callback
- Supports model-specific configuration per provider

### Context Management System

**Separate Contexts**:
- `main-chat` - Primary code generation
- `prompt-improver` - Prompt enhancement sessions
- `git-commit` - Commit message generation
- `quick-edit` - Inline code modifications

**Token Tracking**:
- ~4 characters = 1 token (approximation)
- Visual indicator with color coding (green → yellow → red)
- Model-aware limits (Gemini 2.5: 1M tokens, GPT-4o: 128K, Claude 4.5: 200K)

**AI Compaction Process**:
1. Monitor context size approaching threshold
2. Preserve recent messages (last 2-4)
3. Summarize older messages with AI
4. Replace with summarized system message
5. Log compaction with before/after stats
6. Maintain separate logs per context type

### Preview & Execution System

**Live Preview**:
- Iframe-based rendering
- Device simulation (desktop, tablet, mobile)
- Custom import resolution for virtual files
- Babel transpilation in browser

**Console/Network Interception**:
- postMessage API for iframe communication
- Console.log/warn/error capture
- Network request monitoring
- Real-time error display

**Project Runner**:
- `server/api/runner.ts` - Express server for preview
- Serves generated files
- Handles route requests
- Supports SPA routing

### Git Integration

**Backend Integration** (simple-git):
- `git init` - Initialize repository
- `git status` - Check clean/dirty state
- `git add/commit` - Stage and commit changes
- `git push` - Push to remote (GitHub)
- Branch tracking, ahead/behind status

**Frontend Hooks** (`hooks/useProject.ts`):
- Initialize git for projects
- Status checking before operations
- Commit message generation (AI)
- Push to GitHub integration

**Git Panel UI** (`components/PreviewPanel/GitPanel.tsx`):
- Visual git status
- Commit history
- Branch information
- Push/pull operations

### Security Features

**Input Sanitization** (`utils/validation.ts`):
- XSS prevention (script tags, event handlers, CSS expressions)
- SQL injection keyword escaping
- Unicode/encoding attack handling
- Path traversal prevention (absolute, relative, encoded, null bytes)

**Security Testing** (`tests/security/validation.test.ts`):
- Comprehensive XSS attack vectors
- Path traversal detection
- Content security validation
- Mixed encoding attacks

**Security ESLint Rules**:
- Object injection detection
- Buffer safety
- Child process usage
- Eval expressions
- Fs filename validation
- Timing attacks

### Export & Deployment Options

**ZIP Export**:
- Complete Vite + React + Tailwind project
- Generated via JSZip
- Downloaded via FileSaver

**GitHub Integration**:
- Direct repository creation
- Push to GitHub
- OAuth flow (backend)

**StackBlitz Integration**:
- One-click cloud IDE export
- StackBlitz SDK integration

### Debugging & Monitoring

**Debug Panel** (`components/PreviewPanel/DebugPanel.tsx`):
- Real-time API call monitoring
- JSON request/response inspection
- Filter by type (Request, Response, Stream, Error, Info)
- Filter by category (generation, accessibility, quick-edit, auto-fix)
- Duration tracking, model info

**Context Indicator**:
- Visual token usage
- Click to open context manager
- Compaction logs with statistics

**Console Panel**:
- Live console from iframe
- Network request monitoring
- Error tracking and display

### Build & Bundle

**Bundle Analysis**:
- `bundlesize.config.json` - Bundle size limits
- Vite bundle analyzer integration

**Production Build**:
- Vite production mode
- External dependencies (TypeScript parser, acorn, etc.)
- Tailwind CSS purging
- Asset optimization

### Browser Support
- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

### Keyboard Shortcuts
- `Ctrl/Cmd + K` - Command palette
- `Ctrl/Cmd + O` - Project manager
- `Ctrl/Cmd + Z` / `Y` - Undo/Redo
- `Ctrl/Cmd + S` - Save to server
- `Ctrl/Cmd + Shift + G` - Toggle Git tab
- `Ctrl/Cmd + Shift + H` - Toggle History panel
- `Ctrl/Cmd + 1` / `2` - Switch Preview/Code
