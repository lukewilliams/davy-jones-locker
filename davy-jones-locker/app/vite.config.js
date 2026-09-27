import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: fileURLToPath(new URL('index.js', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // The host provides these (peer dependencies): a second copy of Vue
      // breaks reactivity, and of SEAMONSTER splits its menu registry.
      external: ['vue', /^seamonster(\/|$)/],
    },
  },
})
