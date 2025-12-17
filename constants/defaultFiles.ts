/**
 * Default project files for new projects
 *
 * These files are used when:
 * - No project is open
 * - Creating a new project without initial files
 * - Resetting the app
 *
 * TECHNOLOGY STACK (Keep in sync with prompts):
 * - React 19
 * - TypeScript 5.9+
 * - Vite 7
 * - Tailwind CSS 4
 * - lucide-react (latest)
 * - motion/react (latest) - NOT framer-motion!
 * - react-router v7 - NOT react-router-dom!
 */

import type { FileSystem } from '@/types';

export const DEFAULT_FILES: FileSystem = {
  'package.json': JSON.stringify({
    name: "fluidflow-app",
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies: {
      "react": "^19.2.0",
      "react-dom": "^19.2.0",
      "lucide-react": "^0.561.0",
      "motion": "^12.0.0",
      "react-router": "^7.1.0"
    },
    devDependencies: {
      "@vitejs/plugin-react": "^5.1.0",
      "vite": "^7.2.0",
      "@tailwindcss/vite": "^4.1.0",
      "tailwindcss": "^4.1.0",
      "typescript": "^5.9.0",
      "@types/react": "^19.2.0",
      "@types/react-dom": "^19.2.0",
      "@types/node": "^25.0.0"
    }
  }, null, 2),
  'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src')
    }
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }
  }
})`,
  'tsconfig.json': JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      baseUrl: ".",
      paths: {
        "@/*": ["src/*"],
        "src/*": ["src/*"]
      }
    },
    include: ["src"]
  }, null, 2),
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FluidFlow App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`,
  'src/main.tsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)`,
  'src/index.css': `@import "tailwindcss";`,
  'src/App.tsx': `import { Sparkles } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Welcome to FluidFlow</h1>
        <p className="text-slate-400 text-lg">Upload a sketch or describe your app to get started</p>
      </div>
    </div>
  )
}`
};
