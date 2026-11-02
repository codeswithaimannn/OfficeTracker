import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Send API calls to the NestJS backend. The browser only ever talks to
    // localhost:5173, so the login cookie is same-origin (as on Netlify).
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom', // a fake browser for component tests
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
