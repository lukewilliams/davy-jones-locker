<script setup>
import { DavyJonesLocker } from 'davy-jones-locker'
import { EditorPanels } from 'seamonster'
import { MapPanel } from 'seamonster/spatial/leaflet'
import './themes/abyss.js'
</script>

<template>
  <!-- theme: LUX, LUXDARK, FLOW, FLOWDARK, or ABYSS (themes/). The panels slot
       keeps the editor's own panels and adds the Map panel (hotkey P), which
       draws the selected node's geometry. -->
  <DavyJonesLocker
    title="KRAKEN"
    theme="ABYSS"
    engine-url="/engines/engine-kraken"
    engine-name="engine-kraken"
    storage-name="kraken"
  >
    <template #panels>
      <EditorPanels />
      <MapPanel dock="right" aboveBottom />
    </template>
  </DavyJonesLocker>
</template>
