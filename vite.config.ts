import { defineConfig } from 'vite';

export default defineConfig({
  base: '/text-diff-tool/',
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
