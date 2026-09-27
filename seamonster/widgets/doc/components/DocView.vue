<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  documents: { type: Array, required: true },
  // Class prefix, so an app can namespace the tag hooks differently.
  prefix: { type: String, default: 'md-doc' },
})

// Parsed once per change rather than on every render.
const rendered = computed(() =>
  props.documents.map((doc, index) => ({
    key: doc.id ?? index,
    // An unknown or empty tag simply produces no second class, so it falls back
    // to whatever the app styles the prefix class as.
    classes: doc.tag ? [props.prefix, `${props.prefix}-${doc.tag}`] : [props.prefix],
    html: marked.parse(doc.body ?? '', { gfm: true, async: false }),
  })),
)
</script>

<template>
  <!-- Content comes from the app's own database and is not sanitised here.
       See the README before rendering anything user-authored. -->
  <article v-for="doc in rendered" :key="doc.key" :class="doc.classes" v-html="doc.html" />
</template>
