<script setup>
// Dependency tracker: a live mini reactivity engine. Change state and see which
// computeds and effects re-run, which return cached values and which are untouched.
import { computed, reactive, ref, shallowRef } from 'vue'
import { createEngine } from '../../utils/miniReactivity.js'

const props = defineProps({
  preset: { type: String, default: 'cart' },
})

const runs = reactive({})
const lastRun = ref(new Set())
const lastHit = ref(new Set())
const lastNotes = ref([])
const tick = ref(0)
let events = []
const engine = createEngine((e) => events.push(e))
const isChain = props.preset === 'chain'

const nodes = []
const s = {}
const consoleLog = ref([])

if (!isChain) {
  s.price = engine.ref('price', 20)
  s.qty = engine.ref('qty', 2)
  s.coupon = engine.ref('coupon', false)
  s.subtotal = engine.computed('subtotal', () => s.price.value * s.qty.value)
  s.discount = engine.computed('discount', () => (s.coupon.value ? Math.round(s.subtotal.value * 0.1) : 0))
  s.total = engine.computed('total', () => s.subtotal.value - s.discount.value)
  engine.watch('watch(total)', () => s.total.value, (v, o) => (consoleLog.value = [`total ${o} → ${v}`, ...consoleLog.value].slice(0, 3)))
  engine.effect('render', () => `qty ${s.qty.value} · total $${s.total.value}`, { kind: 'render' })
  nodes.push(
    { id: 'price', col: 0, kind: 'state' },
    { id: 'qty', col: 0, kind: 'state' },
    { id: 'coupon', col: 0, kind: 'state' },
    { id: 'subtotal', col: 1, kind: 'computed', code: 'price × qty' },
    { id: 'discount', col: 1, kind: 'computed', code: 'coupon ? 10% of subtotal : 0' },
    { id: 'total', col: 1, kind: 'computed', code: 'subtotal − discount' },
    { id: 'watch(total)', col: 2, kind: 'watch' },
    { id: 'render', col: 2, kind: 'render', code: 'shows qty & total' },
  )
} else {
  s.a = engine.ref('a', 1)
  s.b = engine.computed('b', () => s.a.value * 2)
  s.c = engine.computed('c', () => s.b.value + 1)
  s.showC = engine.ref('showC', true)
  engine.effect('render', () => (s.showC.value ? `c = ${s.c.value}` : 'c is hidden'), { kind: 'render' })
  nodes.push(
    { id: 'a', col: 0, kind: 'state' },
    { id: 'showC', col: 0, kind: 'state' },
    { id: 'b', col: 1, kind: 'computed', code: 'a × 2' },
    { id: 'c', col: 1, kind: 'computed', code: 'b + 1' },
    { id: 'render', col: 2, kind: 'render', code: 'v-if="showC" → reads c' },
  )
}

function absorb() {
  const ran = new Set()
  const hit = new Set()
  const notes = []
  for (const e of events) {
    if (e.type === 'run') {
      ran.add(e.effect)
      runs[e.effect] = (runs[e.effect] ?? 0) + 1
    }
    if (e.type === 'cache-hit') hit.add(e.effect)
    if (e.type === 'same') notes.push(`${e.dep} set to the same value — nothing triggered.`)
    if (e.type === 'trigger' && !e.subs.length) notes.push(`${e.dep} changed but nothing depends on it.`)
    if (e.type === 'dirty' && !events.some((x) => x.type === 'run' && x.effect === e.effect)) notes.push(`${e.effect} was marked dirty but nobody read it, so it did not recompute (lazy).`)
  }
  events = []
  lastRun.value = ran
  lastHit.value = hit
  lastNotes.value = notes
  tick.value++
}
absorb()
lastRun.value = new Set()

function set(name, value) {
  s[name].value = value
  engine.flush()
  absorb()
}

const graph = computed(() => {
  void tick.value
  return engine.graph()
})
const COLW = 230
const ROWH = 78
const VBW = COLW * 2 + 200 // viewBox width; nodes are 26% of it wide
const pos = computed(() => {
  const rows = [0, 0, 0]
  return Object.fromEntries(nodes.map((n) => [n.id, { x: 20 + n.col * COLW, y: 20 + rows[n.col]++ * ROWH }]))
})
const height = computed(() => Math.max(...[0, 1, 2].map((c) => nodes.filter((n) => n.col === c).length)) * ROWH + 20)
const lines = computed(() =>
  graph.value.flatMap((g) =>
    g.subs
      .filter((sub) => pos.value[sub] && pos.value[g.dep])
      .map((sub) => {
        const a = pos.value[g.dep]
        const b = pos.value[sub]
        return { id: `${g.dep}->${sub}`, from: g.dep, to: sub, x1: a.x + VBW * 0.26, y1: a.y + 26, x2: b.x, y2: b.y + 26 }
      }),
  ),
)
const valueOf = (id) => {
  void tick.value
  const v = s[id]
  if (!v) return ''
  if (v.peek) return v.peek()
  return ''
}
const output = computed(() => {
  void tick.value
  return isChain ? (s.showC.peek() ? `c = ${s.c.peek()}` : 'c is hidden') : `qty ${s.qty.peek()} · total $${s.total.peek()}`
})
const highlight = (id) => (lastRun.value.has(id) ? 'ran' : lastHit.value.has(id) ? 'hit' : '')
</script>

<template>
  <div class="dt">
    <div class="dt__inputs">
      <template v-if="!isChain">
        <label class="field"><span class="label">price</span><input class="input" type="number" min="0" :value="valueOf('price')" @change="set('price', Number($event.target.value))" /></label>
        <label class="field"><span class="label">qty</span><input class="input" type="number" min="0" :value="valueOf('qty')" @change="set('qty', Number($event.target.value))" /></label>
        <label class="checkbox dt__check"><input type="checkbox" :checked="valueOf('coupon')" @change="set('coupon', $event.target.checked)" /> coupon</label>
        <button type="button" class="btn btn--sm" @click="set('qty', valueOf('qty'))">qty = same value</button>
      </template>
      <template v-else>
        <button type="button" class="btn btn--sm btn--acid" @click="set('a', valueOf('a') + 1)">a++ (a = {{ valueOf('a') }})</button>
        <label class="checkbox dt__check"><input type="checkbox" :checked="valueOf('showC')" @change="set('showC', $event.target.checked)" /> render shows c</label>
      </template>
    </div>

    <div class="dt__canvas graph-paper">
      <div class="dt__cols label" aria-hidden="true">
        <span>state</span><span>computed</span><span>effects</span>
      </div>
      <div class="dt__board" :style="{ height: height + 'px' }">
        <svg class="dt__svg" :viewBox="`0 0 ${VBW} ${height}`" preserveAspectRatio="none" aria-hidden="true">
          <path
            v-for="l in lines"
            :key="l.id"
            :d="`M ${l.x1} ${l.y1} C ${l.x1 + 30} ${l.y1}, ${l.x2 - 30} ${l.y2}, ${l.x2} ${l.y2}`"
            :class="{ 'is-hot': lastRun.has(l.to) }"
          />
        </svg>
        <div
          v-for="n in nodes"
          :key="n.id"
          class="dt__node"
          :class="[`dt__node--${n.kind}`, `is-${highlight(n.id)}`]"
          :style="{ left: `${(pos[n.id].x / VBW) * 100}%`, top: pos[n.id].y + 'px' }"
        >
          <span class="dt__id mono">{{ n.id }}</span>
          <span v-if="n.code" class="dt__code">{{ n.code }}</span>
          <span v-if="n.kind === 'state' || n.kind === 'computed'" class="dt__val mono">= {{ valueOf(n.id) }}</span>
          <span v-if="n.kind !== 'state'" class="dt__runs mono" :title="`${n.id} has run ${runs[n.id] ?? 0} time(s)`">runs {{ runs[n.id] ?? 0 }}</span>
        </div>
      </div>
    </div>

    <div class="dt__report" aria-live="polite">
      <p><span class="dt__legend is-ran">re-ran</span> <span class="dt__legend is-hit">cached</span> <span class="dt__legend">untouched</span></p>
      <p v-if="lastRun.size" class="mono">re-ran: {{ [...lastRun].join(', ') }}</p>
      <p v-if="lastHit.size" class="mono">served from cache: {{ [...lastHit].join(', ') }}</p>
      <p v-for="(n, i) in lastNotes" :key="i">{{ n }}</p>
      <p class="dt__out">render output: <strong>{{ output }}</strong></p>
      <p v-for="(l, i) in consoleLog" :key="'c' + i" class="mono muted">console › {{ l }}</p>
    </div>
    <p class="muted dt__note">Runs on a simplified teaching engine that mirrors Vue’s tracking rules (track on read, lazy cached computeds, batched effects) — not Vue’s source code.</p>
  </div>
</template>

<style scoped>
.dt {
  display: grid;
  gap: var(--s-3);
}
.dt__inputs {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--s-3);
}
.dt__inputs .field {
  width: 110px;
}
.dt__check {
  font-weight: 700;
  min-height: 44px;
}
.dt__canvas {
  border: var(--border-thin);
  padding: var(--s-2) var(--s-3) var(--s-3);
  overflow-x: auto;
}
.dt__cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  color: var(--muted);
  margin-bottom: 6px;
  min-width: 560px;
}
.dt__board {
  position: relative;
  min-width: 560px;
}
.dt__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.dt__svg path {
  fill: none;
  stroke: var(--text);
  stroke-width: 2;
  opacity: 0.35;
}
.dt__svg path.is-hot {
  stroke: var(--red);
  stroke-width: 3.5;
  opacity: 1;
  stroke-dasharray: 8 5;
  animation: flow 0.7s linear infinite;
}
.dt__node {
  position: absolute;
  width: 26%;
  min-height: 52px;
  display: grid;
  gap: 1px;
  padding: 5px 8px;
  border: var(--border-thin);
  background: var(--surface);
  font-size: 0.75rem;
}
.dt__node--state {
  background: var(--kraft);
  color: #1a1a1a;
}
.dt__node--render,
.dt__node--watch {
  background: var(--note-blue);
}
.dt__node.is-ran {
  background: var(--acid);
  color: var(--acid-ink);
  box-shadow: 4px 4px 0 var(--shadow-color);
}
.dt__node.is-hit {
  outline: 3px dashed var(--cobalt);
  outline-offset: 2px;
}
.dt__id {
  font-weight: 800;
}
.dt__code {
  opacity: 0.8;
}
.dt__runs {
  position: absolute;
  right: 6px;
  top: 4px;
  font-size: 0.66rem;
  font-weight: 800;
}
.dt__report {
  border: var(--border);
  background: var(--note-yellow);
  padding: var(--s-3) var(--s-4);
  font-size: 0.9rem;
}
.dt__report p {
  margin: 0 0 4px;
}
.dt__legend {
  display: inline-block;
  padding: 0 6px;
  border: 2px solid var(--line);
  font-size: 0.72rem;
  font-weight: 700;
  margin-right: 6px;
}
.dt__legend.is-ran {
  background: var(--acid);
  color: var(--acid-ink);
}
.dt__legend.is-hit {
  border-style: dashed;
  border-color: var(--cobalt);
}
.dt__out {
  margin-top: 6px !important;
}
.dt__note {
  margin: 0;
  font-size: 0.8rem;
}
@keyframes flow {
  to {
    stroke-dashoffset: -26;
  }
}
</style>
