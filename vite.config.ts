import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3100,
      host: '0.0.0.0',
      // HTTPS is handled by basicSsl plugin for WebContainer API
      watch: {
        // Ignore projects folder - file changes there shouldn't trigger HMR
        ignored: ['**/projects/**', '**/node_modules/**', '**/.git/**'],
      },
      headers: {
        // Required for WebContainer API (SharedArrayBuffer support)
        // Using 'credentialless' instead of 'require-corp' for better compatibility
        'Cross-Origin-Embedder-Policy': 'credentialless',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
      proxy: {
        // Proxy API requests to HTTPS backend
        '/api': {
          target: 'https://localhost:3200',
          changeOrigin: true,
          secure: false, // Allow self-signed certificates
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      basicSsl(), // Self-signed cert for local HTTPS
    ],
    // SEC-004 fix: API keys are NOT exposed in frontend bundle
    // Users must configure their API keys through Settings UI, which stores them
    // securely (encrypted) in localStorage and backend. For development, set
    // GEMINI_API_KEY in .env and the backend will automatically configure the default provider.
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    optimizeDeps: {
      exclude: [
        'fs',
        'path',
        'os'
      ]
    },
    build: {
      rollupOptions: {
        external: [
          'fs',
          'path',
          'os'
        ],
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            'vendor-react': ['react', 'react-dom'],
            'vendor-monaco': ['@monaco-editor/react'],
            'vendor-icons': ['lucide-react'],
            'vendor-ai': ['@google/genai'],
            'vendor-flow': ['@xyflow/react'],
          }
        }
      }
    }
  };
});
