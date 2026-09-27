# spatial (`seamonster/spatial`)

A basemap with spatial data layers for Vue 3 widgets, in two interchangeable
renderers: **Leaflet** and **deck.gl**.

Deciding *which* layers to show stays in the app; this library resolves the
layers it is given to GeoJSON and draws them. Both renderers take the same
`layers` prop, so swapping one for the other is an import change.

## Install

Vue is required. The renderers are **optional** peer dependencies — install only
the one you use.

```
npm i leaflet                                          # Leaflet renderer
npm i @deck.gl/core @deck.gl/layers @deck.gl/geo-layers # deck.gl renderer
npm i shpjs                                            # only for shapefiles
```

Add `resolve.dedupe: ['vue']` to the consuming app's Vite config, plus `leaflet`
or the `@deck.gl/*` packages if the library is linked with `file:`.

## Usage

```vue
<script setup>
import { computed } from 'vue'
import { LeafletMap } from 'seamonster/spatial/leaflet'
import { fromRows } from 'seamonster/spatial'
import 'seamonster/style.css'
import 'leaflet/dist/leaflet.css'   // Leaflet only

const layers = computed(() => fromRows(rows.value, { baseUrl: '/' }))
</script>

<template>
  <LeafletMap :layers="layers" :center="[10.75, 59.91]" :zoom="12" />
</template>
```

deck.gl is the same component contract:

```js
import { DeckMap } from 'seamonster/spatial/deck'
```

The map fills its container, so give the container a size.

### Props

| Prop | Default | |
|---|---|---|
| `layers` | `[]` | layer descriptors, drawn in order |
| `center` | `[0, 0]` | **`[longitude, latitude]`** |
| `zoom` | `2` | initial zoom |
| `basemap` | OpenStreetMap | `{ url, attribution, maxZoom }` |
| `autoFit` | `true` | fit the view to the layers the first time they load |

`center` is `[lng, lat]`, GeoJSON order — **not** Leaflet's `[lat, lng]`. One
convention has to serve both renderers; `LeafletMap` flips it internally. This is
the single most likely thing to get wrong, and a swapped pair usually puts you in
the ocean off West Africa rather than throwing.

Events: `ready` (the underlying `Map`/`Deck`), `feature-click`
(`{ layer, feature }`), and `error` (`(error, layer)` — one failed layer is
dropped rather than blanking the map).

Exposed: `fit()` to re-fit the view, and `getMap()` / `getDeck()` as an escape
hatch to the underlying instance.

## Layer descriptors

```js
{
  id: 'parks',                       // required, and the render key
  label: 'Parks',                    // defaults to id
  format: 'geojson',                 // default
  url: '/spatial/parks.geojson',     // or…
  data: geojsonObjectOrString,       // …inline, which wins over url
  style: { color: '#ff0000', weight: 2, fillOpacity: 0.2 },
  visible: true,
}
```

`data` matters when the geometry comes straight out of the database as text —
there is then no second request.

### Style

Renderer-neutral names, translated by each renderer:

| | Default | |
|---|---|---|
| `color` | `#3388ff` | stroke |
| `fillColor` | falls back to `color` | |
| `weight` | `2` | stroke width, pixels |
| `opacity` | `1` | stroke opacity |
| `fillOpacity` | `0.2` | |
| `radius` | `5` | point radius, pixels |

Points draw as circles in both renderers — Leaflet's default marker would need
icon assets this library does not ship.

### fromRows

```js
fromRows(rows, {
  baseUrl: '',          // prefixed to relative urls; absolute urls are untouched
  style: { weight: 3 }, // defaults a row's own style overrides
  id: 'layer_id',       // column names
  label: 'label',
  format: 'format',
  url: 'url',
  data: 'data',
  style: 'style',       // a JSON object or a JSON string
  visible: 'visible',
})
```

An unparseable `style` string is ignored rather than thrown — one bad row should
not take the map down.

## Formats

`geojson` and `shapefile` are built in, and both resolve to a GeoJSON
FeatureCollection, which is all either renderer consumes. Shapefiles are read
with `shpjs` from a `.zip` containing at least `.shp`/`.dbf`; include a `.prj`
and it reprojects to WGS84, omit one and the coordinates arrive in their native
projection. `shpjs` is imported dynamically the first time a shapefile is
actually loaded, so a GeoJSON-only app never downloads it.

Adding a format is one call, and neither renderer changes:

```js
import { defineSpatialFormat } from 'seamonster/spatial'

defineSpatialFormat('topojson', {
  load: async (url) => toGeoJson(await (await fetch(url)).json()),
  parse: (value) => toGeoJson(typeof value === 'string' ? JSON.parse(value) : value),
})
```

`load` handles a url, `parse` handles inline data; supply either or both.
Anything returned that is a Feature, a bare geometry, or an array of collections
is normalised to a single FeatureCollection.

## Filtering

This library has no opinion about filtering — it draws the array it is handed.
Drive that array from your own query and the map follows:

```js
const { rows } = useQuery(MAP_LAYERS_SQL, filters.sqlParams('region', 'showLayers'))
const layers = computed(() => fromRows(rows.value, { baseUrl: import.meta.env.BASE_URL }))
```

Layers are keyed by `id`, so one leaving the array is removed from the map and
its GeoJSON released. Fetched layers are cached by url, so a layer that comes
back after being filtered out is not re-fetched. Inline `data` is not cached —
re-parsing something already in memory is cheaper than tracking it.

Only the latest resolve is applied, so toggling filters quickly cannot let an
earlier, slower fetch overwrite a later one.

## Styling

| Token | Default | |
|---|---|---|
| `--wsp-background` | `#f5f5f5` | shown before tiles load |
| `--wsp-attribution-color` | `#333` | |
| `--wsp-attribution-bg` | `rgba(255,255,255,.75)` | |

Class names (`wsp-*`) are internal. Leaflet brings its own stylesheet, which the
app imports; deck.gl needs none, and this library renders its attribution itself
as **text, never markup**.

## Choosing a renderer

Leaflet is smaller, DOM/SVG-based, has no WebGL requirement, and is the easier
one to debug. deck.gl draws on the GPU and stays smooth with far more geometry,
composes 3D layers, and shares a context with any other deck layers. Start with
Leaflet unless the data volume already says otherwise; the swap is one import.

The deck.gl renderer draws its basemap with `TileLayer` + `BitmapLayer` rather
than pairing with MapLibre — one library, one context, no second stylesheet. If
you later need vector basemaps or tilted 3D basemaps, that is the point to bring
in MapLibre and `@deck.gl/mapbox` instead.

## Distribution

Part of SEAMONSTER: its [README](../../README.md) covers installing it, the
peer dependencies, and Vite's `resolve.dedupe` for a linked copy.
