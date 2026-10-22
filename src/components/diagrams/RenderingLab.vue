<script setup>
// Live demos of Vue's built-in rendering components. Everything shown (logs,
// DOM parents, transition classes) is read from the real DOM and real hooks.
import { defineComponent, h, KeepAlive, nextTick, onActivated, onDeactivated, onMounted, onUnmounted, ref, shallowRef, Transition, TransitionGroup, useId, useTemplateRef, watch } from 'vue'

const props = defineProps({
  mode: { type: String, default: 'teleport' },
})
const uid = useId().replace(/[^\w-]/g, '')
const log = ref([])
const say = (t) => (log.value = [t, ...log.value].slice(0, 8))

// ---------- Teleport
const modalOpen = ref(false)
const teleportDisabled = ref(false)
const parentInfo = ref('')
const targetId = `tp-target-${uid}`
watch([modalOpen, teleportDisabled], async () => {
  await nextTick()
  const el = document.querySelector(`[data-modal="${uid}"]`)
  parentInfo.value = el ? (el.parentElement.id === targetId ? 'inside the <body> stand-in (teleported)' : 'inside the Card component (not teleported)') : 'not rendered'
})

// ---------- KeepAlive + dynamic
function tabComponent(name, emoji) {
  return defineComponent({
    name,
    setup() {
      const count = ref(0)
      const text = ref('')
      onMounted(() => say(`${name}: onMounted (created fresh)`))
      onUnmounted(() => say(`${name}: onUnmounted (state destroyed)`))
      onActivated(() => say(`${name}: onActivated (restored from cache)`))
      onDeactivated(() => say(`${name}: onDeactivated (kept in cache)`))
      return () =>
        h('div', { class: 'rl__tab' }, [
          h('strong', `${emoji} ${name}`),
          h('button', { type: 'button', class: 'btn btn--sm', onClick: () => count.value++ }, `clicked ${count.value}×`),
          h('input', { class: 'input', placeholder: 'type something', value: text.value, 'aria-label': `${name} text`, onInput: (e) => (text.value = e.target.value) }),
        ])
    },
  })
}
const tabs = [tabComponent('Profile', '👤'), tabComponent('Settings', '⚙️'), tabComponent('Inbox', '📥')]
const current = shallowRef(tabs[0])
const useKeepAlive = ref(true)

// ---------- Transition
const showBox = ref(true)
const transitionMode = ref('out-in')
const classLog = ref([])
const box = useTemplateRef('box')
let observer = null
function watchClasses(el) {
  observer?.disconnect()
  if (!el) return
  observer = new MutationObserver(() => {
    const cls = [...el.classList].filter((c) => c.startsWith('fade-'))
    if (cls.length) classLog.value = [cls.join(' '), ...classLog.value.filter((x) => x !== cls.join(' '))].slice(0, 6)
  })
  observer.observe(el, { attributes: true, attributeFilter: ['class'] })
}
function onBeforeEnter(el) {
  classLog.value = []
  watchClasses(el)
  say('enter: Vue adds fade-enter-from + fade-enter-active, then swaps to fade-enter-to on the next frame')
}
function onBeforeLeave(el) {
  classLog.value = []
  watchClasses(el)
  say('leave: fade-leave-from + fade-leave-active, then fade-leave-to; the element is removed when the transition ends')
}
const items = ref([1, 2, 3])
let nextItem = 4
const addItem = () => items.value.splice(Math.floor(Math.random() * (items.value.length + 1)), 0, nextItem++)
const removeItem = () => items.value.length && items.value.splice(Math.floor(Math.random() * items.value.length), 1)
const shuffleItems = () => (items.value = [...items.value].sort(() => Math.random() - 0.5))

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div class="rl">
    <!-- ================= Teleport ================= -->
    <template v-if="mode === 'teleport'">
      <div class="rl__controls cluster">
        <button type="button" class="btn btn--sm btn--acid" @click="modalOpen = !modalOpen">{{ modalOpen ? 'close' : 'open' }} modal</button>
        <label class="checkbox"><input v-model="teleportDisabled" type="checkbox" /> <code>:disabled="true"</code> (render in place)</label>
      </div>
      <div class="rl__teleport">
        <div class="rl__app">
          <p class="label">App › Card component (overflow: hidden)</p>
          <div class="rl__card">
            <p>A card with clipped overflow — a modal rendered here would be cut off.</p>
            <Teleport :to="`#${targetId}`" :disabled="teleportDisabled" defer>
              <div v-if="modalOpen" class="rl__modal" role="dialog" aria-label="Demo modal" :data-modal="uid">
                <strong>I’m the modal</strong>
                <span>Declared inside Card, rendered wherever Teleport sends me.</span>
              </div>
            </Teleport>
          </div>
        </div>
        <div :id="targetId" class="rl__body">
          <p class="label">&lt;body&gt; stand-in (teleport target)</p>
        </div>
      </div>
      <p class="rl__fact mono">real DOM: the modal is {{ parentInfo || 'not rendered' }}</p>
      <p class="rl__insight">Teleport changes <strong>where the DOM goes</strong>, not who owns it: the modal still uses Card’s props, state and events.</p>
    </template>

    <!-- ================= KeepAlive / dynamic ================= -->
    <template v-else-if="mode === 'keep-alive' || mode === 'dynamic'">
      <div class="rl__controls cluster">
        <button v-for="t in tabs" :key="t.name" type="button" class="btn btn--sm" :aria-pressed="current === t" @click="current = t">{{ t.name }}</button>
        <label v-if="mode === 'keep-alive'" class="checkbox"><input v-model="useKeepAlive" type="checkbox" /> wrap in <code>&lt;KeepAlive&gt;</code></label>
      </div>
      <div class="rl__stage">
        <KeepAlive v-if="mode === 'keep-alive' && useKeepAlive">
          <component :is="current" />
        </KeepAlive>
        <component :is="current" v-else />
      </div>
      <p class="rl__insight">
        <template v-if="mode === 'dynamic'"><code>&lt;component :is&gt;</code> swaps components: the old one is unmounted and its state is lost. Click a counter, switch tabs, come back.</template>
        <template v-else>With KeepAlive, switching tabs <strong>deactivates</strong> instead of unmounting, so counters and typed text survive. Untick it to compare.</template>
      </p>
    </template>

    <!-- ================= Transition ================= -->
    <template v-else>
      <div class="rl__controls cluster">
        <button type="button" class="btn btn--sm btn--acid" @click="showBox = !showBox">toggle (v-if)</button>
        <label class="field rl__select">
          <span class="label">mode</span>
          <select v-model="transitionMode" class="select"><option>out-in</option><option>in-out</option><option value="default">default</option></select>
        </label>
      </div>
      <div class="rl__transition">
        <div class="rl__stage rl__stage--t">
          <Transition name="fade" :mode="transitionMode === 'default' ? undefined : transitionMode" @before-enter="onBeforeEnter" @before-leave="onBeforeLeave">
            <div v-if="showBox" ref="box" key="a" class="rl__box">I fade &amp; slide</div>
            <div v-else key="b" class="rl__box rl__box--alt">The other element</div>
          </Transition>
        </div>
        <div class="rl__classes">
          <p class="label">classes Vue applied (live)</p>
          <ol>
            <li v-for="(c, i) in classLog" :key="i" class="mono">{{ c }}</li>
            <li v-if="!classLog.length" class="muted">toggle to watch the classes change</li>
          </ol>
        </div>
      </div>
      <div class="rl__controls cluster">
        <span class="label">TransitionGroup:</span>
        <button type="button" class="btn btn--sm" @click="addItem">add</button>
        <button type="button" class="btn btn--sm" @click="removeItem">remove</button>
        <button type="button" class="btn btn--sm" @click="shuffleItems">shuffle (move)</button>
      </div>
      <TransitionGroup name="list" tag="ul" class="rl__list">
        <li v-for="n in items" :key="n">item {{ n }}</li>
      </TransitionGroup>
    </template>

    <ol v-if="mode !== 'teleport'" class="rl__log" aria-live="polite" aria-label="Lifecycle and transition log">
      <li v-if="!log.length" class="muted">Interact to see real hooks fire.</li>
      <li v-for="(l, i) in log" :key="i + l" class="mono">{{ l }}</li>
    </ol>
  </div>
</template>

<style scoped>
.rl {
  display: grid;
  gap: var(--s-3);
}
.rl__teleport {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
.rl__app,
.rl__body {
  border: var(--border-thin);
  padding: var(--s-3);
  background: var(--surface);
  min-height: 170px;
  position: relative;
}
.rl__body {
  background: var(--surface-2);
  border-style: dashed;
}
.rl__app .label,
.rl__body .label {
  margin: 0 0 var(--s-2);
  color: var(--muted);
}
.rl__card {
  border: 2px solid var(--line);
  padding: var(--s-2) var(--s-3);
  height: 96px;
  overflow: hidden;
  position: relative;
  font-size: 0.85rem;
}
.rl__card p {
  margin: 0;
}
.rl__modal {
  display: grid;
  gap: 4px;
  padding: var(--s-3);
  background: var(--acid);
  color: #1a1a1a;
  border: var(--border);
  box-shadow: var(--shadow-sm);
  font-size: 0.85rem;
  margin-top: var(--s-2);
}
.rl__fact {
  margin: 0;
  font-size: 0.8rem;
}
.rl__insight {
  margin: 0;
  padding: var(--s-3) var(--s-4);
  border-left: 6px solid var(--cobalt);
  background: var(--note-blue);
}
.rl__stage {
  border: var(--border-thin);
  padding: var(--s-3);
  background: var(--surface);
  min-height: 120px;
}
.rl__stage :deep(.rl__tab) {
  display: grid;
  gap: var(--s-2);
  justify-items: start;
}
.rl__stage :deep(.rl__tab .input) {
  max-width: 280px;
}
.rl__transition {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
.rl__stage--t {
  display: grid;
  place-items: center;
  overflow: hidden;
}
.rl__box {
  padding: var(--s-4) var(--s-5);
  border: var(--border);
  background: var(--acid);
  color: #1a1a1a;
  font-weight: 800;
}
.rl__box--alt {
  background: var(--cobalt);
  color: #fff;
}
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.8s ease,
    transform 0.8s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(18px) rotate(-3deg);
}
.rl__classes {
  border: var(--border-thin);
  padding: var(--s-3);
  background: var(--surface-2);
  font-size: 0.8rem;
}
.rl__classes .label {
  margin: 0 0 6px;
  color: var(--muted);
}
.rl__classes ol {
  margin: 0;
  padding-left: 1.3em;
}
.rl__select {
  width: 140px;
}
.rl__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  position: relative;
}
.rl__list li {
  margin: 0;
  padding: 6px 12px;
  border: var(--border-thin);
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: 0.8rem;
}
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-14px);
}
.list-leave-active {
  position: absolute;
}
.rl__log {
  margin: 0;
  padding: var(--s-3) var(--s-3) var(--s-3) 2em;
  border: var(--border-thin);
  background: var(--note-yellow);
  font-size: 0.78rem;
}
@media (max-width: 800px) {
  .rl__teleport,
  .rl__transition {
    grid-template-columns: 1fr;
  }
}
</style>
