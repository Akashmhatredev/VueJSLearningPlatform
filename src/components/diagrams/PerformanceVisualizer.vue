<script setup>
// Performance lab. Every number on screen is measured live in the learner's
// browser (render counts via onUpdated, timings via performance.now(), real
// resource-timing entries). Nothing is pre-recorded or invented.
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'

const props = defineProps({
  demo: { type: String, default: 'updates' },
})
const demo = computed(() => (['updates', 'computed-cache', 'debounce', 'lazy-routes', 'virtual-list', 'shallow'].includes(props.demo) ? props.demo : 'updates'))

// ---------------- updates: unstable vs stable props
const tick = ref(0)
const theme = ref('cobalt')
// Stable: a computed returns the SAME object until `theme` itself changes.
const stableOptions = computed(() => ({ color: theme.value }))
// Each child counts its own renders in a plain (non-reactive) variable. Storing
// the count in reactive state from onUpdated would re-render the parent, which
// re-renders the child again — an infinite loop.
const counted = () =>
  defineComponent({
    props: { options: Object },
    setup(p) {
      let renders = 0
      return () => {
        renders++
        return h('span', { class: 'pf__chip' }, [`options.color = ${p.options.color}`, h('strong', { class: 'pf__renders' }, ` · rendered ${renders}×`)])
      }
    },
  })
const InlineChild = counted()
const StableChild = counted()

// ---------------- computed cache vs method
let methodCalls = 0
let computedCalls = 0
const price = ref(10)
const unrelated = ref(0)
const stats = reactive({ methodCalls: 0, computedCalls: 0, lastRenderMs: 0 })
function heavy(n) {
  let x = 0
  for (let i = 0; i < 150000; i++) x += Math.sqrt(i * n) % 3
  return Math.round(x)
}
function viaMethod() {
  methodCalls++
  return heavy(price.value)
}
const viaComputed = computed(() => {
  computedCalls++
  return heavy(price.value)
})
async function measure(fn) {
  const t = performance.now()
  fn()
  await nextTick()
  stats.lastRenderMs = performance.now() - t
  stats.methodCalls = methodCalls
  stats.computedCalls = computedCalls
}

// ---------------- debounce
const query = ref('')
const useDebounce = ref(true)
const requests = ref([])
const keystrokes = ref(0)
let timer = null
function onType(e) {
  query.value = e.target.value
  keystrokes.value++
  clearTimeout(timer)
  const fire = () => (requests.value = [{ q: query.value, at: new Date().toLocaleTimeString() }, ...requests.value].slice(0, 30))
  if (useDebounce.value) timer = setTimeout(fire, 300)
  else fire()
}
function resetDebounce() {
  query.value = ''
  requests.value = []
  keystrokes.value = 0
}

// ---------------- lazy routes: this site's real chunks
const chunks = ref([])
const loadingChunk = ref(false)
function readChunks() {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return
  chunks.value = performance
    .getEntriesByType('resource')
    .filter((e) => /\.(js|vue)(\?|$)/.test(e.name) || e.initiatorType === 'script')
    .map((e) => ({ name: e.name.replace(location.origin, '').replace(/\?.*$/, ''), kb: e.transferSize ? (e.transferSize / 1024).toFixed(1) : null, ms: e.duration.toFixed(0), start: e.startTime }))
    .sort((a, b) => b.start - a.start)
}
async function loadLazy() {
  loadingChunk.value = true
  const before = performance.getEntriesByType('resource').length
  await import('../../pages/VisualizersPage.vue')
  await new Promise((r) => setTimeout(r, 50))
  readChunks()
  loadingChunk.value = false
  lazyNote.value = performance.getEntriesByType('resource').length > before ? 'New chunk(s) downloaded just now — they are at the top of the list.' : 'That page was already loaded earlier, so nothing new was downloaded (the browser reuses cached modules).'
}
const lazyNote = ref('')

// ---------------- virtual list
const ROWS = 10000
const ROW_H = 28
const VIEW_H = 280
const allRows = Array.from({ length: ROWS }, (_, i) => `Row #${i + 1} — order ${(i * 7919) % 100000}`)
const virtual = ref(true)
const scrollTop = ref(0)
const listEl = ref(null)
const vstats = reactive({ nodes: 0, ms: 0 })
const start = computed(() => Math.max(0, Math.floor(scrollTop.value / ROW_H) - 5))
const visible = computed(() => (virtual.value ? allRows.slice(start.value, start.value + Math.ceil(VIEW_H / ROW_H) + 10) : allRows))
async function switchMode(v) {
  const t = performance.now()
  virtual.value = v
  scrollTop.value = 0
  await nextTick()
  if (listEl.value) listEl.value.scrollTop = 0
  vstats.ms = performance.now() - t
  vstats.nodes = listEl.value ? listEl.value.querySelectorAll('*').length : 0
}

// ---------------- deep vs shallow
const sres = reactive({ deepMs: null, shallowMs: null, count: 20000 })
function makeData(n) {
  return Array.from({ length: n }, (_, i) => ({ id: i, profile: { name: `user${i}`, stats: { score: i % 97, visits: i % 13 } } }))
}
function runShallow() {
  const dataA = makeData(sres.count)
  const dataB = makeData(sres.count)
  let t = performance.now()
  const deep = reactive({ items: dataA })
  let sum = 0
  for (const item of deep.items) sum += item.profile.stats.score // each access creates nested proxies
  sres.deepMs = performance.now() - t
  t = performance.now()
  const shallow = shallowRef({ items: dataB })
  let sum2 = 0
  for (const item of shallow.value.items) sum2 += item.profile.stats.score // plain objects, no proxies
  sres.shallowMs = performance.now() - t
  sres.check = sum === sum2
}

onMounted(() => {
  if (demo.value === 'lazy-routes') readChunks()
  if (demo.value === 'virtual-list') switchMode(true)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="pf">
    <!-- updates -->
    <template v-if="demo === 'updates'">
      <div class="cluster">
        <button type="button" class="btn btn--sm btn--acid" @click="tick++">re-render the parent ({{ tick }})</button>
        <button type="button" class="btn btn--sm" @click="theme = theme === 'cobalt' ? 'red' : 'cobalt'">change theme</button>
      </div>
      <div class="pf__cols">
        <section class="pf__card pf__card--bad">
          <p class="mono pf__code">&lt;Child :options="{ color: theme }" /&gt;</p>
          <component :is="InlineChild" :options="{ color: theme }" />
          <p class="pf__why">The object literal is re-created on every parent render — same content, new object — so Vue must treat the prop as changed.</p>
        </section>
        <section class="pf__card pf__card--good">
          <p class="mono pf__code">const options = computed(() =&gt; ({ color: theme.value }))<br />&lt;Child :options="options" /&gt;</p>
          <component :is="StableChild" :options="stableOptions" />
          <p class="pf__why">The computed hands back the same object until <code>theme</code> changes, so Vue sees unchanged props and skips the child.</p>
        </section>
      </div>
    </template>

    <!-- computed cache -->
    <template v-else-if="demo === 'computed-cache'">
      <div class="cluster">
        <button type="button" class="btn btn--sm" @click="measure(() => unrelated++)">change unrelated state</button>
        <button type="button" class="btn btn--sm btn--acid" @click="measure(() => price++)">change price (a dependency)</button>
      </div>
      <div class="pf__cols">
        <section class="pf__card pf__card--bad">
          <p class="mono pf__code" v-pre>{{ heavy() }} × 3 in the template</p>
          <p class="mono">{{ viaMethod() }} · {{ viaMethod() }} · {{ viaMethod() }}</p>
          <p class="pf__metric">method calls so far: <strong>{{ stats.methodCalls }}</strong></p>
        </section>
        <section class="pf__card pf__card--good">
          <p class="mono pf__code" v-pre>{{ heavyComputed }} × 3 in the template</p>
          <p class="mono">{{ viaComputed }} · {{ viaComputed }} · {{ viaComputed }}</p>
          <p class="pf__metric">computed evaluations: <strong>{{ stats.computedCalls }}</strong></p>
        </section>
      </div>
      <p class="pf__measure mono">last update took {{ stats.lastRenderMs.toFixed(1) }} ms (measured in your browser; unrelated: {{ unrelated }})</p>
      <p class="pf__why">The method runs on every render — even when only unrelated state changed. The computed runs once per real dependency change and serves the cached value otherwise.</p>
    </template>

    <!-- debounce -->
    <template v-else-if="demo === 'debounce'">
      <div class="cluster">
        <input class="input pf__search" :value="query" placeholder="type a search…" aria-label="Search" @input="onType" />
        <label class="checkbox"><input v-model="useDebounce" type="checkbox" /> debounce 300 ms</label>
        <button type="button" class="btn btn--sm btn--ghost" @click="resetDebounce">reset</button>
      </div>
      <div class="pf__cols">
        <section class="pf__card">
          <p class="pf__metric">keystrokes: <strong>{{ keystrokes }}</strong></p>
          <p class="pf__metric">requests sent: <strong>{{ requests.length }}</strong></p>
        </section>
        <section class="pf__card pf__reqs">
          <p class="label">simulated request log</p>
          <ol>
            <li v-for="(r, i) in requests" :key="i" class="mono">GET /search?q={{ r.q }} <span class="muted">{{ r.at }}</span></li>
            <li v-if="!requests.length" class="muted">no requests yet</li>
          </ol>
        </section>
      </div>
      <p class="pf__why">Without debouncing every keystroke hits the server (and older responses can arrive after newer ones). Debouncing waits until typing pauses.</p>
    </template>

    <!-- lazy routes -->
    <template v-else-if="demo === 'lazy-routes'">
      <div class="cluster">
        <button type="button" class="btn btn--sm btn--acid" :disabled="loadingChunk" @click="loadLazy">lazy-load the Visualizers page now</button>
        <button type="button" class="btn btn--sm" @click="readChunks">refresh list</button>
      </div>
      <p v-if="lazyNote" class="pf__measure">{{ lazyNote }}</p>
      <div class="pf__card pf__chunks">
        <p class="label">JavaScript this very site has downloaded so far ({{ chunks.length }} files, newest first)</p>
        <ol>
          <li v-for="(c, i) in chunks.slice(0, 25)" :key="i" class="mono">
            <span class="pf__chunk">{{ c.name }}</span> <span class="muted">{{ c.kb ? c.kb + ' KB' : 'cached' }} · {{ c.ms }} ms</span>
          </li>
        </ol>
      </div>
      <p class="pf__why">Every page of this site is a lazy route (<code>() =&gt; import('./Page.vue')</code>): its code downloads only when you first visit it. These entries come from the browser’s Resource Timing API.</p>
    </template>

    <!-- virtual list -->
    <template v-else-if="demo === 'virtual-list'">
      <div class="cluster">
        <button type="button" class="btn btn--sm" :aria-pressed="!virtual" @click="switchMode(false)">render all {{ ROWS.toLocaleString() }} rows</button>
        <button type="button" class="btn btn--sm btn--acid" :aria-pressed="virtual" @click="switchMode(true)">virtualize</button>
      </div>
      <p class="pf__measure mono">DOM elements in the list: {{ vstats.nodes.toLocaleString() }} · last switch took {{ vstats.ms.toFixed(0) }} ms (measured now)</p>
      <div ref="listEl" class="pf__vlist" :style="{ height: VIEW_H + 'px' }" tabindex="0" aria-label="Scrollable list" @scroll="scrollTop = $event.target.scrollTop">
        <div v-if="virtual" :style="{ height: ROWS * ROW_H + 'px', position: 'relative' }">
          <div v-for="(row, i) in visible" :key="start + i" class="pf__row" :style="{ position: 'absolute', top: (start + i) * ROW_H + 'px' }">{{ row }}</div>
        </div>
        <template v-else>
          <div v-for="(row, i) in visible" :key="i" class="pf__row">{{ row }}</div>
        </template>
      </div>
      <p class="pf__why">Virtualizing renders only the rows in view plus a small buffer, so the DOM stays tiny however long the list gets. (Simplified: fixed row heights.)</p>
    </template>

    <!-- shallow -->
    <template v-else>
      <div class="cluster">
        <label class="field pf__count"><span class="label">objects</span><input v-model.number="sres.count" class="input" type="number" min="1000" max="100000" step="1000" /></label>
        <button type="button" class="btn btn--sm btn--acid" @click="runShallow">measure deep vs shallow</button>
      </div>
      <div class="pf__cols">
        <section class="pf__card pf__card--bad">
          <p class="mono pf__code">reactive({ items }) then read item.profile.stats.score</p>
          <p class="pf__metric">{{ sres.deepMs === null ? '—' : sres.deepMs.toFixed(1) + ' ms' }}</p>
        </section>
        <section class="pf__card pf__card--good">
          <p class="mono pf__code">shallowRef({ items }) then read the same</p>
          <p class="pf__metric">{{ sres.shallowMs === null ? '—' : sres.shallowMs.toFixed(1) + ' ms' }}</p>
        </section>
      </div>
      <p class="pf__why">Deep reactivity wraps every nested object in a proxy as you touch it. For large data you only ever replace wholesale, <code>shallowRef</code> skips that work — at the cost of nested mutations not being tracked. Timings are from your device and vary run to run.</p>
    </template>
  </div>
</template>

<style scoped>
.pf {
  display: grid;
  gap: var(--s-3);
}
.pf__cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
.pf__card {
  border: var(--border-thin);
  padding: var(--s-3);
  background: var(--surface);
  display: grid;
  gap: 6px;
  align-content: start;
}
.pf__card p {
  margin: 0;
}
.pf__card--bad {
  box-shadow: 5px 5px 0 var(--red);
}
.pf__card--good {
  box-shadow: 5px 5px 0 var(--green);
}
.pf__code {
  font-size: 0.75rem;
  color: var(--muted);
}
.pf__metric {
  font-size: 1.05rem;
}
.pf__metric strong {
  font-family: var(--font-display);
  font-size: 1.5rem;
}
.pf__renders {
  font-family: var(--font-display);
}
.pf__chip {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  border: 2px solid var(--line);
  padding: 2px 6px;
  width: fit-content;
}
.pf__why {
  margin: 0;
  padding: var(--s-3) var(--s-4);
  border-left: 6px solid var(--cobalt);
  background: var(--note-blue);
}
.pf__measure {
  margin: 0;
  font-size: 0.82rem;
}
.pf__search {
  max-width: 280px;
}
.pf__reqs ol,
.pf__chunks ol {
  margin: 0;
  padding-left: 1.4em;
  font-size: 0.75rem;
  max-height: 200px;
  overflow: auto;
}
.pf__chunk {
  word-break: break-all;
}
.pf__vlist {
  overflow-y: auto;
  border: var(--border);
  background: var(--surface);
}
.pf__row {
  height: 28px;
  line-height: 28px;
  padding: 0 var(--s-3);
  border-bottom: 1px solid var(--paper-3);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  white-space: nowrap;
  left: 0;
  right: 0;
}
.pf__count {
  width: 140px;
}
@media (max-width: 700px) {
  .pf__cols {
    grid-template-columns: 1fr;
  }
}
</style>
