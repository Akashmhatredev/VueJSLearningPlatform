<script setup>
// Lifecycle visualizer: real components register real lifecycle hooks; every
// hook call is recorded, so the order shown is the order Vue actually used.
import { computed, defineComponent, h, nextTick, onBeforeMount, onBeforeUnmount, onBeforeUpdate, onMounted, onUnmounted, onUpdated, ref, shallowRef } from 'vue'
import AnimationControls from './AnimationControls.vue'
import { useStepPlayer } from '../../composables/useStepPlayer.js'

const props = defineProps({
  withChild: { type: Boolean, default: true },
})

const PHASES = [
  { id: 'create', label: 'Create', hooks: ['setup()'] },
  { id: 'mount', label: 'Mount', hooks: ['onBeforeMount', 'onMounted'] },
  { id: 'update', label: 'Update', hooks: ['onBeforeUpdate', 'onUpdated'] },
  { id: 'unmount', label: 'Unmount', hooks: ['onBeforeUnmount', 'onUnmounted'] },
]
const EXPLAIN = {
  'setup()': 'setup runs first, once per instance: reactive state, computeds and hook registrations are created. No DOM exists yet.',
  onBeforeMount: 'About to create DOM nodes for the first time. The template has not been inserted into the page.',
  onMounted: 'The component’s DOM is in the page — safe to measure elements, focus inputs or start timers/listeners.',
  onBeforeUpdate: 'Reactive state changed; Vue is about to re-render. The DOM still shows the old values.',
  onUpdated: 'The DOM has been patched with the new values. Avoid changing state here (it can loop).',
  onBeforeUnmount: 'About to be removed — the component still works. Good place to start cleanup.',
  onUnmounted: 'Removed from the page; effects and watchers are stopped. Clear timers and listeners you added yourself.',
}

let buffer = []
let t0 = 0
const record = (comp, hook) => buffer.push({ comp, hook, t: performance.now() - t0 })

function instrumented(name, inner) {
  return defineComponent({
    name,
    props: { count: Number },
    setup(p) {
      record(name, 'setup()')
      onBeforeMount(() => record(name, 'onBeforeMount'))
      onMounted(() => record(name, 'onMounted'))
      onBeforeUpdate(() => record(name, 'onBeforeUpdate'))
      onUpdated(() => record(name, 'onUpdated'))
      onBeforeUnmount(() => record(name, 'onBeforeUnmount'))
      onUnmounted(() => record(name, 'onUnmounted'))
      return () =>
        h('div', { class: ['lc-comp', `lc-comp--${name.toLowerCase()}`] }, [
          h('span', { class: 'lc-comp__name' }, `<${name}>`),
          h('span', { class: 'lc-comp__val' }, `count: ${p.count}`),
          inner ? h(inner, { count: p.count }) : null,
        ])
    },
  })
}
const Child = instrumented('Child')
const Parent = instrumented('Parent', props.withChild ? Child : null)

const shown = ref(false)
const count = ref(0)
const frames = shallowRef([])
const lastAction = ref('')
const player = useStepPlayer(frames, { interval: 1300 })
const current = player.frame

async function act(label, fn) {
  buffer = []
  t0 = performance.now()
  lastAction.value = label
  fn()
  await nextTick()
  await nextTick()
  frames.value = buffer.map((e, i) => ({ ...e, i }))
  player.restart()
  if (player.canAutoplay.value) player.play()
}

const mount = () => act('Mount', () => (shown.value = true))
const update = () => act('count++', () => count.value++)
const unmount = () => act('Unmount', () => (shown.value = false))

const fired = computed(() => frames.value.slice(0, player.index.value + 1))
const firedKey = computed(() => new Set(fired.value.map((f) => `${f.comp}:${f.hook}`)))
const comps = computed(() => (props.withChild ? ['Parent', 'Child'] : ['Parent']))
</script>

<template>
  <div class="lc">
    <div class="lc__controls cluster">
      <button type="button" class="btn btn--sm btn--acid" :disabled="shown" @click="mount">mount</button>
      <button type="button" class="btn btn--sm" :disabled="!shown" @click="update">change state (count++)</button>
      <button type="button" class="btn btn--sm btn--danger" :disabled="!shown" @click="unmount">unmount</button>
      <span class="label muted">real components · real hooks</span>
    </div>

    <div class="lc__grid">
      <div class="lc__phases">
        <div v-for="phase in PHASES" :key="phase.id" class="lc__phase">
          <p class="lc__phase-title label">{{ phase.label }}</p>
          <div v-for="hook in phase.hooks" :key="hook" class="lc__hook">
            <span class="mono lc__hook-name">{{ hook }}</span>
            <span class="lc__badges">
              <span
                v-for="c in comps"
                :key="c"
                class="lc__badge"
                :class="{ 'is-fired': firedKey.has(`${c}:${hook}`), 'is-now': current && current.comp === c && current.hook === hook }"
              >
                {{ c }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div class="lc__right">
        <div class="lc__preview">
          <p class="label">rendered</p>
          <component :is="Parent" v-if="shown" :count="count" />
          <p v-else class="muted lc__empty">nothing mounted</p>
        </div>
        <div class="lc__explain" aria-live="polite">
          <template v-if="current">
            <p class="lc__now"><span class="mono">{{ current.comp }} · {{ current.hook }}</span> <span class="muted">+{{ current.t.toFixed(1) }} ms</span></p>
            <p>{{ EXPLAIN[current.hook] }}</p>
          </template>
          <p v-else class="muted">Press <strong>mount</strong> to create the component{{ withChild ? 's' : '' }}.</p>
        </div>
      </div>
    </div>

    <div v-if="frames.length" class="lc__sequence">
      <p class="label">{{ lastAction }} — hooks in the order Vue called them</p>
      <ol>
        <li v-for="(f, i) in frames" :key="i" :class="{ 'is-past': i < player.index.value, 'is-now': i === player.index.value }">
          <span class="mono">{{ f.comp }}</span> → <span class="mono">{{ f.hook }}</span>
        </li>
      </ol>
      <AnimationControls :player="player" label="Lifecycle" />
      <p v-if="withChild && lastAction === 'Mount'" class="lc__insight">
        Notice: the parent’s <code>onMounted</code> runs <strong>after</strong> the child’s — a parent only counts as mounted once its children are in the page.
      </p>
      <p v-if="withChild && lastAction === 'Unmount'" class="lc__insight">
        Unmounting goes parent-first for <code>onBeforeUnmount</code>, but children finish <code>onUnmounted</code> before the parent does.
      </p>
    </div>
  </div>
</template>

<style scoped>
.lc {
  display: grid;
  gap: var(--s-4);
}
.lc__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: var(--s-4);
  align-items: start;
}
.lc__phases {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: var(--border);
}
.lc__phase {
  border-right: var(--border-thin);
  padding: var(--s-2);
  display: grid;
  gap: var(--s-2);
  align-content: start;
  background: var(--surface);
}
.lc__phase:last-child {
  border-right: 0;
}
.lc__phase-title {
  margin: 0;
  background: var(--text);
  color: var(--bg);
  padding: 2px 6px;
}
.lc__hook {
  display: grid;
  gap: 4px;
  padding: 6px;
  border: 1.5px dashed color-mix(in srgb, var(--line) 40%, transparent);
}
.lc__hook-name {
  font-size: 0.72rem;
  font-weight: 800;
  word-break: break-word;
}
.lc__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.lc__badge {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0 5px;
  border: 1.5px solid var(--line);
  opacity: 0.35;
}
.lc__badge.is-fired {
  opacity: 1;
  background: var(--surface-2);
}
.lc__badge.is-now {
  opacity: 1;
  background: var(--acid);
  color: var(--acid-ink);
  box-shadow: 2px 2px 0 var(--shadow-color);
}
.lc__right {
  display: grid;
  gap: var(--s-3);
}
.lc__preview {
  border: var(--border-thin);
  padding: var(--s-3);
  background: #fff;
  color: #1a1a1a;
  min-height: 110px;
}
.lc__preview .label {
  margin: 0 0 var(--s-2);
  color: #6b6b66;
}
.lc__preview :deep(.lc-comp) {
  border: 2px solid #1a1a1a;
  padding: 6px 8px;
  display: grid;
  gap: 4px;
  background: #fffef0;
}
.lc__preview :deep(.lc-comp--child) {
  background: #eef2ff;
  margin-top: 4px;
}
.lc__preview :deep(.lc-comp__name) {
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 0.78rem;
}
.lc__preview :deep(.lc-comp__val) {
  font-size: 0.85rem;
}
.lc__empty {
  margin: 0;
}
.lc__explain {
  border: var(--border);
  background: var(--note-yellow);
  padding: var(--s-3) var(--s-4);
  min-height: 100px;
}
.lc__explain p {
  margin: 0 0 4px;
}
.lc__now .mono {
  font-weight: 800;
  background: var(--text);
  color: var(--bg);
  padding: 1px 6px;
}
.lc__sequence {
  display: grid;
  gap: var(--s-3);
}
.lc__sequence .label {
  margin: 0;
  color: var(--muted);
}
.lc__sequence ol {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  padding: 0;
  counter-reset: s;
}
.lc__sequence li {
  margin: 0;
  counter-increment: s;
  padding: 3px 8px;
  border: var(--border-thin);
  font-size: 0.8rem;
  opacity: 0.45;
}
.lc__sequence li::before {
  content: counter(s) '. ';
  font-weight: 800;
}
.lc__sequence li.is-past {
  opacity: 1;
}
.lc__sequence li.is-now {
  opacity: 1;
  background: var(--acid);
  color: var(--acid-ink);
}
.lc__insight {
  margin: 0;
  padding: var(--s-3) var(--s-4);
  border-left: 6px solid var(--cobalt);
  background: var(--note-blue);
}
@media (max-width: 900px) {
  .lc__grid {
    grid-template-columns: 1fr;
  }
  .lc__phases {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .lc__phase:nth-child(2) {
    border-right: 0;
  }
  .lc__phase:nth-child(-n + 2) {
    border-bottom: var(--border-thin);
  }
}
</style>
