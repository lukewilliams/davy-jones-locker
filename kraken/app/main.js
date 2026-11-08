import { createApp } from 'vue'
import App from './App.vue'
// SEAMONSTER's styles (every widget's, the menu's first), then Leaflet's for
// the Map panel, then the app's own, so app rules win on any collision.
import 'seamonster/style.css'
import 'leaflet/dist/leaflet.css'
import './app.css'

createApp(App).mount('#app')
