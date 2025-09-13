import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Separate React and React-DOM
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              // Separate markdown rendering
              if (id.includes('react-markdown')) {
                return 'markdown-vendor';
              }
              // Separate AI SDK
              if (id.includes('@google/genai')) {
                return 'ai-vendor';
              }
              // Split syntax highlighter into smaller chunks
              if (id.includes('react-syntax-highlighter')) {
                if (id.includes('/languages/')) {
                  // Group language files into smaller chunks by first letter
                  const match = id.match(/\/languages\/hljs\/(.)/); 
                  if (match) {
                    const firstLetter = match[1].toLowerCase();
                    return `syntax-lang-${firstLetter}`;
                  }
                }
                return 'syntax-highlighter-core';
              }
              // Default chunk for other node_modules
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            }
          }
        },
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
      },
      server: {
        port: 3000,  // Use a specific port to avoid conflicts
        open: true,  // Öffnet automatisch den Browser mit der Local-URL
        hmr: true,  // Let Vite automatically handle HMR port
        strictPort: false  // Allow port change if 3000 is in use
      }
    };
});
