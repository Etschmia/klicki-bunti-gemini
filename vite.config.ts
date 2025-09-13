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
      server: {
        port: 3000,  // Use a specific port to avoid conflicts
        open: true,  // Öffnet automatisch den Browser mit der Local-URL
        hmr: true,  // Let Vite automatically handle HMR port
        strictPort: false  // Allow port change if 3000 is in use
      }
    };
});
