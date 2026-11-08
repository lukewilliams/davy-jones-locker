import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Relative asset paths so the built dist/ can be served from any path.
  base: './',
  resolve: {
    // seamonster and davy-jones-locker are linked `file:` dependencies, so
    // their own node_modules could supply second copies of what they share with
    // this app. One Vue (two break reactivity), one Vue Flow, one Leaflet, and
    // one SEAMONSTER (two split its menu registry and injection keys).
    dedupe: ['vue', 'reka-ui', '@vue-flow/core', '@vue-flow/background', 'leaflet', 'seamonster', 'davy-jones-locker'],
  },
  server: {
    // KRAKEN's ports are 8130 (Docker), 9130 (its engine) and 5130 (here).
    // strictPort: a busy port fails rather than moving, since sign-in's
    // callback names the port (PUBLIC_URL in engine/.env).
    port: 5130,
    strictPort: true,
    // `npm run dev` has no nginx: engine-kraken is reached on the host port
    // compose gives it (kraken/compose.yaml), as nginx would.
    proxy: {
      '/engines/engine-kraken': {
        target: 'http://localhost:9130',
        rewrite: (path) => path.replace(/^\/engines\/engine-kraken/, ''),
        ws: true,
      },
    },
  },
})
