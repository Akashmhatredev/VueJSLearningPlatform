<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { visualizers } from '../content/visualizers.js'
import { contentIndex } from '../content/index.js'
import VisualizerHost from '../components/diagrams/VisualizerHost.vue'

const route = useRoute()
const router = useRouter()

// Demo data for the data-driven visualizers.
const DEMO_PROPS = {
  'concept-diagram': {
    nodes: [
      { id: 'click', label: 'User clicks a link', note: '<RouterLink>', tone: 'acid' },
      { id: 'router', label: 'Router matches the URL', note: '/users/:id' },
      { id: 'guard', label: 'Guards run', note: 'beforeEach' },
      { id: 'view', label: 'RouterView renders', note: 'UserProfile', tone: 'cobalt' },
    ],
    edges: [
      { from: 'click', to: 'router', label: 'push()' },
      { from: 'router', to: 'guard' },
      { from: 'guard', to: 'view', label: 'allowed' },
    ],
    steps: [
      { focus: ['click'], text: 'A **concept diagram** is defined entirely by lesson data: nodes, arrows and steps.' },
      { focus: ['router'], edges: ['click->router'], text: 'Each step can spotlight nodes and animate arrows.' },
      { focus: ['guard'], edges: ['router->guard'], text: 'Lessons use it for anything from HTTP requests to SSR hydration.' },
      { focus: ['view'], edges: ['guard->view'], text: 'Auto-layout reflows into a column on phones.' },
    ],
  },
  comparison: {
    left: { label: 'Options API', lang: 'js', code: "export default {\n  data: () => ({ count: 0 }),\n  computed: {\n    double() { return this.count * 2 }\n  },\n  methods: {\n    inc() { this.count++ }\n  }\n}" },
    right: { label: 'Composition API', lang: 'js', code: "const count = ref(0)\nconst double = computed(() => count.value * 2)\nconst inc = () => count.value++" },
    points: ['Options API groups code by option type; Composition API groups it by feature.', 'Composition API code can be extracted into reusable composables.', 'Both are fully supported in Vue 3.'],
  },
}

const types = Object.keys(visualizers)
const active = computed(() => (types.includes(route.query.v) ? route.query.v : 'reactivity'))
const def = computed(() => visualizers[active.value])
const enumProp = computed(() => Object.entries(def.value.props).find(([, v]) => Array.isArray(v)))
const presetValue = computed(() => {
  const [name, values] = enumProp.value ?? []
  if (!name) return null
  return values.includes(route.query.p) ? route.query.p : values[0]
})
const hostProps = computed(() => {
  const base = { ...(DEMO_PROPS[active.value] ?? {}) }
  if (enumProp.value) base[enumProp.value[0]] = presetValue.value
  if (active.value === 'lifecycle') base.withChild = true
  return base
})
const usedIn = computed(() =>
  Object.values(contentIndex.lessons)
    .filter((l) => l.status === 'ready' && l.visuals.includes(active.value))
    .slice(0, 12),
)

function pick(v, p) {
  router.replace({ query: { v, ...(p ? { p } : {}) } })
}
</script>

<template>
  <div class="page vz">
    <header class="page-head">
      <span class="label">visual learning engine</span>
      <h1>Concept visualizers</h1>
      <p class="vz__lead">Fifteen interactive machines that make Vue’s invisible work visible. Every one is reusable — lessons embed them with a single line of data.</p>
    </header>

    <div class="vz__grid">
      <nav class="vz__nav" aria-label="Visualizers">
        <button
          v-for="t in types"
          :key="t"
          type="button"
          class="vz__item"
          :aria-current="active === t ? 'true' : undefined"
          @click="pick(t)"
        >
          <span class="vz__item-title">{{ visualizers[t].title }}</span>
          <span class="vz__item-blurb">{{ visualizers[t].blurb }}</span>
        </button>
      </nav>

      <section class="vz__main" :aria-label="def.title">
        <div v-if="enumProp" class="vz__presets cluster">
          <span class="label">{{ enumProp[0] }}:</span>
          <button v-for="p in enumProp[1]" :key="p" type="button" class="btn btn--sm mono" :aria-pressed="presetValue === p" @click="pick(active, p)">{{ p }}</button>
        </div>
        <VisualizerHost :key="active + presetValue" :type="active" :props="hostProps" :title="def.title" :caption="def.blurb" />
        <div v-if="usedIn.length" class="vz__used">
          <p class="label">used in these lessons</p>
          <div class="cluster">
            <RouterLink v-for="l in usedIn" :key="l.id" :to="l.path" class="chip">{{ l.title }}</RouterLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.vz__lead {
  max-width: 60ch;
  font-size: var(--step-1);
  color: var(--text-soft);
}
.vz__grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: var(--s-6);
  align-items: start;
}
.vz__nav {
  display: grid;
  border: var(--border);
  background: var(--surface);
  position: sticky;
  top: calc(var(--header-h) + 16px);
  max-height: calc(100vh - var(--header-h) - 32px);
  overflow-y: auto;
}
.vz__item {
  display: grid;
  gap: 2px;
  text-align: left;
  padding: var(--s-3);
  border: 0;
  border-bottom: var(--border-thin);
  background: none;
  color: var(--text);
}
.vz__item:last-child {
  border-bottom: 0;
}
.vz__item:hover {
  background: var(--surface-2);
}
.vz__item[aria-current='true'] {
  background: var(--acid);
  color: var(--acid-ink);
}
.vz__item-title {
  font-weight: 800;
}
.vz__item-blurb {
  font-size: 0.8rem;
  opacity: 0.8;
}
.vz__main {
  min-width: 0;
}
.vz__presets .btn {
  text-transform: none;
  letter-spacing: 0;
}
.vz__used a.chip {
  text-decoration: none;
}
@media (max-width: 1000px) {
  .vz__grid {
    grid-template-columns: 1fr;
  }
  .vz__nav {
    position: static;
    max-height: 260px;
  }
}
</style>
