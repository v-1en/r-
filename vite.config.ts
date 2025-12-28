import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to resolve TS error regarding cwd() not existing on Process type
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This is necessary to make process.env.API_KEY work in the browser with Vite
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});