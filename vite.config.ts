import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3100,
      host: '0.0.0.0',
      watch: {
        // Ignore projects folder - file changes there shouldn't trigger HMR
        ignored: ['**/projects/**', '**/node_modules/**', '**/.git/**'],
      },
    },
    plugins: [
      react(),
    ],
    css: {
      postcss: './postcss.config.js',
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    optimizeDeps: {
      exclude: [
        '@typescript-eslint/typescript-estree',
        '@typescript-eslint/parser',
        'acorn',
        'acorn-walk',
        'glob',
        'fs',
        'path',
        'os'
      ]
    },
    build: {
      rollupOptions: {
        external: [
          '@typescript-eslint/typescript-estree',
          '@typescript-eslint/parser',
          'acorn',
          'acorn-walk',
          'glob',
          'fs',
          'path',
          'os'
        ]
      }
    }
  };
});
