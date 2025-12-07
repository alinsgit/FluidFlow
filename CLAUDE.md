# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FluidFlow is a sketch-to-app prototyping tool that uses AI to convert wireframes/sketches into functional React applications. It features a glassmorphism UI and provides real-time preview of generated apps. The application has evolved into a full-stack development environment with local projects storage, AI-powered code generation, and integrated development tools.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start both frontend (port 3100) and backend (port 3200) servers
npm run dev:frontend # Start only frontend development server
npm run dev:server   # Start only backend development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run server       # Start backend server only
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
- React 19 with TypeScript
- Vite for bundling and dev server
- Express.js for backend API
- Node.js with tsx for TypeScript execution

### Key Libraries
- `@monaco-editor/react` - Code editing
- `@google/genai` - Gemini AI integration
- `lucide-react` - Icon library
- `diff` - File comparison
- `simple-git` - Git operations
- `jszip` - File compression
- `file-saver` - File downloads
- `cors` - Cross-origin resource sharing

### AI & Development
- Multiple AI provider SDKs (OpenAI, Anthropic, etc.)
- Babel for in-browser transpilation
- Git integration for version control

## Path Aliases

`@/*` maps to project root (configured in tsconfig.json and vite.config.ts)

## Key Directories

- `server/` - Express backend API
- `services/` - Frontend service layer
- `components/` - React components
- `hooks/` - Custom React hooks
- `utils/` - Utility functions
- `types/` - TypeScript type definitions
- `projects/` - Local project storage
