import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    Buffer: 'globalThis.Buffer',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});