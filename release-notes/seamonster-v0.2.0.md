# seamonster 0.2.0

The flowgraph editor's panels, for any app: `PanelHost` puts SEAMONSTER's
docked panels, rails, linking and Ctrl+Space over any content, such as a map
or a 3D scene, and the editor is now built on it.

```
npm install seamonster@0.2.0
```

With DAVY JONES' LOCKER, update its app shell to 0.1.2 too: 0.1.0 accepts
only seamonster 0.1.

## Added

- **`seamonster/panels`**, a new entry: `PanelHost`, `FlowPanel`,
  `createPanelLayout`, `PANEL_LAYOUT`, `PANEL_MENU`, `panelCommands` and
  `panelsSubmenu`. It doesn't need Vue Flow. The main entry exports all of it
  too. See `widgets/panels/README.md`.
- **`PanelHost`:** content in the default slot, `FlowPanel`s in `#panels`,
  and an optional `#title` top left. Props: `storage-key` (where unlinked
  panel sizes are saved; name one per host), `auto-hide-rails`, `hotkeys`
  (turn off to leave letter keys to your content), `commands`, `ignore`, and
  `layout`. Keys act only while focus is inside the host, and the host's
  content stays under the panels whatever its own z-indexes.
- **`sizing="content"`** on `FlowPanel`: linked, a side panel sits at the top
  of its edge and is as tall as its content; a bottom panel sits at the left
  and is as wide and tall as its content. Capped to the host, beyond which it
  scrolls both ways. Its rail sits at its anchor, and shows while it overlaps
  another panel.
- **`createPanelLayout({ storageKey, autoHideRails })`**, exported:
  `storageKey` namespaces saved unlinked rects. The editor keeps its key
  (`seamonster:unlinked-panel-rects`), so its saved rects survive.
- **`autoHideRails`** on `FlowgraphEditor` (default `true`, as before): open
  panels leave the rails unless their edge's panels can cover each other.
  Set it to `false` to keep a rail for every panel, open or collapsed.

## Changed

- **The Console panel is now the Terminal**, so it isn't mistaken for the
  browser's DevTools console. Its hotkey moved from C to T, and its panel
  name from `console` to `terminal`: if you had unlinked the Console and
  saved its size, the Terminal starts again from its linked place. Its CSS
  classes are `.flow-terminal*` (they were `.flow-console*`).
- **The menu look moved** from `.flow-editor` to `.flow-surface`, a class
  every PanelHost carries (the editor included). Overrides of the `--wm-*`
  tokens on `.flow-editor` in your own CSS still apply; for other hosts, set
  them on `.flow-surface`.
- **A panel's title can change:** its rail and the Panels menu follow the
  `title` prop (they kept the first one before).
- **`FlowgraphEditor` is a `PanelHost`:** its element also carries
  `.flow-surface` and `.flow-panel-host`, and is `isolation: isolate`, so its
  panels stack inside it. Its layout, rails, menus and keys are unchanged.
