<div align="center">

# FluidFlow

**Sketch-to-App AI Prototyping Tool**

Transform wireframes and sketches into functional React applications using Google's Gemini AI.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)](https://ai.google.dev/)

[Features](#features) | [Installation](#installation) | [Usage](#usage) | [Architecture](#architecture) | [Debug Mode](#debug-mode)

</div>

---

## Features

### Core Capabilities

- **Sketch to Code** - Upload wireframes/mockups and generate complete React applications
- **Brand Integration** - Upload brand logos to automatically extract and apply color schemes
- **Multi-File Generation** - Creates organized project structure with components, utilities, and styles
- **Live Preview** - Real-time preview with device simulation (desktop, tablet, mobile)
- **Code Editor** - Monaco-powered editor with syntax highlighting and split view

### AI-Powered Features

| Feature | Description |
|---------|-------------|
| **Consultant Mode** | Get UX/UI suggestions before generating code |
| **Auto-Fix** | Automatically detects and fixes runtime errors |
| **Quick Edit** | Make targeted changes via natural language prompts |
| **Inspect & Edit** | Click elements to modify specific components |
| **Accessibility Audit** | WCAG 2.1 compliance checking with auto-fix |
| **Responsiveness Fix** | AI-powered mobile optimization |

### Export Options

- **ZIP Download** - Complete Vite + React + Tailwind project
- **GitHub Push** - Direct repository creation and push
- **StackBlitz** - One-click cloud IDE export

### Developer Tools

- **Console Panel** - View logs, warnings, and errors from preview
- **Network Panel** - Monitor HTTP requests
- **Debug Mode** - Track all AI API calls with JSON inspection
- **Version History** - Undo/redo with 50-step history
- **Education Mode** - Detailed code comments for learning

---

## Installation

### Prerequisites

- Node.js 18+
- Google Gemini API Key ([Get one here](https://ai.google.dev/))

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/fluidflow.git
cd fluidflow

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3100) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## Usage

### Basic Workflow

1. **Upload Sketch** - Drag & drop or click to upload a wireframe/mockup image
2. **Add Context** (Optional) - Describe features or add a brand logo
3. **Generate** - Click generate to create your React app
4. **Review** - Inspect the generated code in the diff modal
5. **Iterate** - Use quick edit or chat to refine the result
6. **Export** - Download as ZIP or push to GitHub

### Modes

#### Engineer Mode (Default)
Generates complete React applications from sketches.

#### Consultant Mode
Analyzes designs and provides UX improvement suggestions before code generation.

### AI Models

| Model | Best For |
|-------|----------|
| Gemini 2.5 Flash | Fast iterations, simple apps |
| Gemini 2.5 Pro | Complex applications, better quality |
| Gemini 3 Pro Preview | Latest features (experimental) |

---

## Architecture

### Project Structure

```
fluidflow/
├── components/
│   ├── ControlPanel/          # Left sidebar
│   │   ├── index.tsx          # Main orchestrator + AI calls
│   │   ├── ChatPanel.tsx      # Message display
│   │   ├── ChatInput.tsx      # Input with attachments
│   │   ├── SettingsPanel.tsx  # Model & mode settings
│   │   └── ModeToggle.tsx     # Engineer/Consultant toggle
│   │
│   └── PreviewPanel/          # Right panel
│       ├── index.tsx          # Preview + AI features
│       ├── CodeEditor.tsx     # Monaco editor
│       ├── ConsolePanel.tsx   # DevTools console
│       ├── FileExplorer.tsx   # Virtual file tree
│       ├── DebugPanel.tsx     # API call inspector
│       └── ...                # Modals and utilities
│
├── hooks/
│   ├── useVersionHistory.ts   # Undo/redo state
│   ├── useDebugStore.ts       # Debug logging state
│   ├── useKeyboardShortcuts.ts
│   └── useDebounce.ts
│
├── utils/
│   ├── cleanCode.ts           # AI response cleaning
│   └── codemap.ts             # Project structure analysis
│
├── types/
│   └── index.ts               # TypeScript definitions
│
├── App.tsx                    # Main app + diff modal
└── index.tsx                  # Entry point
```

### Data Flow

```
User Input → ControlPanel.handleSend()
    ↓
Gemini API (streaming)
    ↓
Parse Response → Extract Files
    ↓
DiffModal (review changes)
    ↓
Confirm → Update FileSystem State
    ↓
PreviewPanel (live iframe render)
```

### Virtual File System

Generated apps are stored in memory as a `FileSystem` object:

```typescript
type FileSystem = Record<string, string>;
// Example:
{
  "src/App.tsx": "export default function App() {...}",
  "src/components/Header.tsx": "...",
  "src/index.css": "@tailwind base;..."
}
```

---

## Debug Mode

Monitor all AI API interactions in real-time.

### Enabling Debug Mode

1. Open **Settings** (bottom of left panel)
2. Toggle **Debug Mode** on
3. Switch to the **Debug** tab in the right panel

### Log Types

| Type | Icon | Description |
|------|------|-------------|
| Request | 🔵 | Outgoing API calls |
| Response | 🟢 | Successful responses |
| Stream | 🟣 | Streaming chunks |
| Error | 🔴 | Failed requests |
| Info | ⚪ | Informational logs |

### Categories

- `generation` - Main code generation
- `accessibility` - A11y audits
- `quick-edit` - Inline edits
- `auto-fix` - Error auto-correction

### Features

- **JSON Viewer** - Expandable/collapsible response inspection
- **Filtering** - Filter by type, category, or search text
- **Copy** - One-click JSON export
- **Duration** - Response time tracking
- **Model Info** - See which model was used

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open command palette |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + S` | Save current file |
| `Ctrl/Cmd + P` | Quick file open |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript 5.8 |
| Build Tool | Vite 6 |
| AI | Google Gemini API |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Editor | Monaco Editor |
| Diff | diff (npm) |
| Export | JSZip, FileSaver |

---

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for code editing
- [Lucide](https://lucide.dev/) for icons

---

<div align="center">

**Built with AI, for Builders**

[Report Bug](https://github.com/yourusername/fluidflow/issues) | [Request Feature](https://github.com/yourusername/fluidflow/issues)

</div>
