import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev`  -> http://localhost:5173, /api is proxied to the C# backend on :5080
// `npm run build:api` -> builds straight into the backend's wwwroot (single deployment)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5080' },
  },
  build: {
    chunkSizeWarningLimit: 2000, // TF.js is ~1.8 MB; it loads once and is cached
    rollupOptions: { output: { manualChunks: { tfjs: ['@tensorflow/tfjs'] } } },
  },
});
