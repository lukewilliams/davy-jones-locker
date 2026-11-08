# davy-jones-locker 0.3.1

The engine runs subnets in whole-graph runs, as
[seamonster 0.4.1](https://github.com/lukewilliams/davy-jones-locker/releases/tag/seamonster-v0.4.1)
does in the browser, and the app shell passes FlowgraphEditor's new
`panels` slot through, so an app can add panels of its own, like seamonster
0.4.1's Map panel.

```
pip install davy-jones-locker==0.3.1
npm install --save-exact davy-jones-locker@0.3.1 seamonster@0.4.1
```

Base images: `ghcr.io/lukewilliams/davy-jones-locker-engine:0.3.1` (and
`-runner`, `-node-worker`), also tagged `0.3`.

## Added

- **Subnets in graph runs** (`POST /execute`, `POST /graphs/{id}/execute`):
  a Subnet node's graph, inline or shared from the document's `subnets`,
  runs as it is, with what's wired into its pins put out by its Input nodes
  and its Output nodes its outputs. Nodes inside are in `results` by path
  (`screening/classify`), and a target can be one. Errors name where they
  started (`Screening › Classify: …`); 8 levels deep at most.
- **`DavyJonesLocker`'s `panels` slot**, passed through to FlowgraphEditor:
  ```vue
  <DavyJonesLocker title="MYAPP" engine-url="/engines/engine-myapp">
    <template #panels>
      <EditorPanels />
      <MapPanel dock="right" aboveBottom />
    </template>
  </DavyJonesLocker>
  ```
  `EditorPanels` comes from `seamonster`, `MapPanel` from
  `seamonster/spatial/leaflet` (which needs `leaflet` installed, and
  `leaflet/dist/leaflet.css` imported). Without the slot the window is as
  before.
