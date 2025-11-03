import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Configure base path so that GitHub Pages can serve the app from /<repo-name>/
export default defineConfig({
  plugins: [vue()],
  base: process.env.BASE_PATH || '/',
});
