import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { contentIndex } from './plugins/content-index.js'
import { sandboxLibs } from './plugins/sandbox-libs.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), contentIndex(), sandboxLibs()],
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    // The only chunks above ~250 kB are lazily loaded data (search index and
    // interview question bank), fetched on first search / interview visit.
    chunkSizeWarningLimit: 2200,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
    setupFiles: ['tests/unit/setup.js'],
    testTimeout: 20000,
    // Sandbox tests for time-based lessons (debounce, sockets, retries) use real
    // timers; one retry absorbs machine-load hiccups. A broken solution still fails.
    retry: 1,
  },
})
