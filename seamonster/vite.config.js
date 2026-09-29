import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const entry = (file) => fileURLToPath(new URL(file, import.meta.url))

export default defineConfig({
  plugins: [
    vue({
      // TresJS elements are created by its custom renderer, not resolved as Vue
      // components (widgets/scene). TresCanvas is a real component.
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('Tres') && tag !== 'TresCanvas',
        },
      },
    }),
  ],
  build: {
    lib: {
      // One entry per widget, so a host imports only what it uses. menu comes
      // first so its CSS comes first in style.css: the editor's rules build on it.
      entry: {
        menu: entry('widgets/menu/index.js'),
        index: entry('index.js'),
        panels: entry('widgets/panels/index.js'),
        controls: entry('widgets/controls/index.js'),
        doc: entry('widgets/doc/index.js'),
        scene: entry('widgets/scene/index.js'),
        sheet: entry('widgets/sheet/index.js'),
        spatial: entry('widgets/spatial/index.js'),
        'spatial/leaflet': entry('widgets/spatial/leaflet.js'),
        'spatial/deck': entry('widgets/spatial/deck.js'),
      },
      formats: ['es'],
      cssFileName: 'style',
    },
    rollupOptions: {
      // The host provides these (peer dependencies). A second copy of Vue
      // breaks reactivity, and of three every instanceof check. Named exactly,
      // so Vue Flow's own stylesheet (@vue-flow/core/dist/style.css) is
      // bundled into style.css rather than left for the host to resolve.
      external: [
        'vue',
        'reka-ui',
        '@vue-flow/core',
        '@vue-flow/background',
        'three',
        '@tresjs/core',
        '@tresjs/cientos',
        'leaflet',
        'shpjs',
        'marked',
        /^@deck\.gl\//,
      ],
    },
  },
})
