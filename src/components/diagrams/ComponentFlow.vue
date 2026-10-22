<script setup>
// Component communication visualizer. State here is real reactive state; GSAP
// animates a "packet" between components so learners see the direction data
// travels. Clicking a component shows its code.
import { computed, nextTick, onBeforeUnmount, reactive, readonly, ref, useTemplateRef } from 'vue'
import CodeBlock from '../code/CodeBlock.vue'
import { usePreferencesStore } from '../../stores/preferences.js'

const props = defineProps({
  mode: { type: String, default: 'props' },
})

const prefs = usePreferencesStore()
const MODES = {
  props: {
    title: 'Props flow down',
    nodes: { parent: 'Parent', child: 'Child' },
    code: {
      parent: `<script setup>\nimport { ref } from 'vue'\nimport Child from './Child.vue'\nconst count = ref(0)\n<\/script>\n\n<template>\n  <button @click="count++">count++</button>\n  <Child :count="count" />\n</template>`,
      child: `<script setup>\nconst props = defineProps({\n  count: { type: Number, required: true },\n})\n// props.count++  ✗ props are read-only\n<\/script>\n\n<template>\n  <p>I received {{ count }}</p>\n</template>`,
    },
  },
  emits: {
    title: 'Events flow up',
    nodes: { parent: 'Parent', child: 'Child' },
    code: {
      parent: `<script setup>\nimport { ref } from 'vue'\nimport Child from './Child.vue'\nconst total = ref(0)\n<\/script>\n\n<template>\n  <p>Total: {{ total }}</p>\n  <Child @add="(n) => total += n" />\n</template>`,
      child: `<script setup>\nconst emit = defineEmits(['add'])\n<\/script>\n\n<template>\n  <button @click="emit('add', 5)">+5</button>\n</template>`,
    },
  },
  'v-model': {
    title: 'v-model = prop down + event up',
    nodes: { parent: 'Parent', child: 'NameInput' },
    code: {
      parent: `<script setup>\nimport { ref } from 'vue'\nconst name = ref('Ada')\n<\/script>\n\n<template>\n  <NameInput v-model="name" />\n  <!-- same as: -->\n  <NameInput\n    :modelValue="name"\n    @update:modelValue="(v) => name = v" />\n</template>`,
      child: `<script setup>\n// Vue 3.4+: defineModel() declares the prop + event for you\nconst model = defineModel()\n<\/script>\n\n<template>\n  <input v-model="model" />\n</template>`,
    },
  },
  slots: {
    title: 'Slots: the parent supplies content',
    nodes: { parent: 'Parent', child: 'Card' },
    code: {
      parent: `<template>\n  <Card>\n    <template #title>Hello!</template>\n    <p>Parent-owned content</p>\n  </Card>\n</template>`,
      child: `<template>\n  <article class="card">\n    <h3><slot name="title">Untitled</slot></h3>\n    <slot />  <!-- parent content lands here -->\n  </article>\n</template>`,
    },
  },
  'scoped-slots': {
    title: 'Scoped slots: child data, parent markup',
    nodes: { parent: 'Parent', child: 'FruitList' },
    code: {
      parent: `<template>\n  <FruitList v-slot="{ item, index }">\n    <strong>{{ index + 1 }}. {{ item }}</strong>\n  </FruitList>\n</template>`,
      child: `<script setup>\nconst items = ['apple', 'pear', 'fig']\n<\/script>\n\n<template>\n  <ul>\n    <li v-for="(item, index) in items" :key="item">\n      <slot :item="item" :index="index" />\n    </li>\n  </ul>\n</template>`,
    },
  },
  'provide-inject': {
    title: 'provide / inject skips the middle',
    nodes: { parent: 'App', middle: 'Layout', child: 'ThemedButton' },
    code: {
      parent: `<script setup>\nimport { provide, ref } from 'vue'\nconst theme = ref('light')\nprovide('theme', theme)\n<\/script>`,
      middle: `<!-- Layout never mentions theme -->\n<template>\n  <main><slot /></main>\n</template>`,
      child: `<script setup>\nimport { inject } from 'vue'\nconst theme = inject('theme')\n<\/script>\n\n<template>\n  <button :class="theme">Click</button>\n</template>`,
    },
  },
  pinia: {
    title: 'One store, many components',
    nodes: { store: 'cart store', header: 'Header', product: 'ProductCard', sidebar: 'CartSidebar', footer: 'Footer' },
    code: {
      store: `export const useCart = defineStore('cart', () => {\n  const items = ref([])\n  const count = computed(() => items.value.length)\n  function add(product) { items.value.push(product) }\n  return { items, count, add }\n})`,
      header: `const cart = useCart()\n// template: 🛒 {{ cart.count }}`,
      product: `const cart = useCart()\n// template: <button @click="cart.add(product)">Add</button>`,
      sidebar: `const cart = useCart()\n// template: <li v-for="item in cart.items">…</li>`,
      footer: `// Footer never reads the cart store,\n// so cart changes never re-render it.`,
    },
  },
}
const mode = computed(() => (MODES[props.mode] ? props.mode : 'props'))
const def = computed(() => MODES[mode.value])
const selected = ref(Object.keys(MODES[mode.value].nodes).find((k) => k === 'child') ?? Object.keys(MODES[mode.value].nodes)[0])

const s = reactive({
  count: 0,
  total: 0,
  name: 'Ada',
  slotTitle: 'Hello!',
  slotBody: 'Parent-owned content',
  fruits: ['apple', 'pear', 'fig'],
  fruitStyle: 'numbered',
  theme: 'light',
  cart: [],
  flash: {},
})
const childProps = readonly(s) // what a child receives: read-only
const log = ref([])
const stage = useTemplateRef('stage')
const packet = useTemplateRef('packet')
const packetLabel = ref('')
const busy = ref(false)
let gsap = null

function say(text) {
  log.value = [text, ...log.value].slice(0, 5)
}

function center(id) {
  const el = stage.value?.querySelector(`[data-node="${id}"]`)
  const box = stage.value?.getBoundingClientRect()
  if (!el || !box) return { x: 0, y: 0 }
  const r = el.getBoundingClientRect()
  return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 }
}

async function send(from, to, label, { via } = {}) {
  packetLabel.value = label
  await nextTick()
  const el = packet.value
  if (!el) return
  const a = center(from)
  const b = center(to)
  if (prefs.reducedMotion) {
    flash(to)
    return
  }
  gsap ??= (await import('gsap')).gsap
  const w = el.offsetWidth / 2
  const h = el.offsetHeight / 2
  busy.value = true
  const tl = gsap.timeline()
  tl.set(el, { opacity: 1, x: a.x - w, y: a.y - h })
  if (via) {
    const m = center(via)
    tl.to(el, { x: m.x - w + 150, y: m.y - h, duration: 0.45, ease: 'power1.inOut' })
  }
  tl.to(el, { x: b.x - w, y: b.y - h, duration: via ? 0.45 : 0.8, ease: 'power2.inOut' })
  tl.to(el, { opacity: 0, duration: 0.15 })
  await tl.then()
  busy.value = false
  flash(to)
}

function flash(id) {
  s.flash[id] = (s.flash[id] ?? 0) + 1
  setTimeout(() => (s.flash[id] = Math.max(0, (s.flash[id] ?? 1) - 1)), 450)
}

// ---- actions per mode (real state changes, then the packet shows the direction)
async function propsParentInc() {
  s.count++
  say(`Parent set count = ${s.count}. Vue re-renders Child with the new prop.`)
  await send('parent', 'child', `:count="${s.count}"`)
}
function propsChildMutate() {
  const before = childProps.count
  try {
    childProps.count++ // readonly: Vue refuses the write
  } catch {
    /* strict-mode TypeError in some builds */
  }
  say(`Child tried props.count++ → still ${childProps.count === before ? before : childProps.count}. Props are read-only; in development Vue warns about it.`)
  flash('child')
}
async function emitAdd() {
  say('Child called emit("add", 5). The event travels to the parent.')
  await send('child', 'parent', "emit('add', 5)")
  s.total += 5
  say(`Parent's listener ran: total = ${s.total}.`)
}
let typingTimer = null
function onModelInput(e) {
  const v = e.target.value
  clearTimeout(typingTimer)
  typingTimer = setTimeout(async () => {
    say(`Child emitted update:modelValue("${v}").`)
    await send('child', 'parent', `update:modelValue`)
    s.name = v
    say(`Parent set name = "${v}" and passes it back down as modelValue.`)
    await send('parent', 'child', `:modelValue="${v}"`)
  }, 250)
}
async function setSlot(title, body) {
  s.slotTitle = title
  s.slotBody = body
  say(`Parent changed what it puts in the slots. The child's markup stays the same.`)
  await send('parent', 'child', 'slot content')
}
async function setFruitStyle(style) {
  say('Child passes { item, index } up to the parent’s slot template…')
  await send('child', 'parent', '{ item, index }')
  s.fruitStyle = style
  say(`…and the parent decides how each item looks (${style}).`)
  await send('parent', 'child', 'rendered markup')
}
async function toggleTheme() {
  s.theme = s.theme === 'light' ? 'dark' : 'light'
  say(`App changed the provided theme to "${s.theme}". Layout is skipped entirely.`)
  await send('parent', 'child', `provide('theme')`, { via: 'middle' })
}
async function addToCart() {
  const product = ['🧦 socks', '🧢 cap', '👟 shoes', '🧤 gloves'][s.cart.length % 4]
  say(`ProductCard called cart.add("${product}").`)
  await send('product', 'store', 'add()')
  s.cart.push(product)
  say(`Store updated: ${s.cart.length} item(s). Only components that READ the cart re-render: Header and CartSidebar.`)
  send('store', 'header', 'count')
  await new Promise((r) => setTimeout(r, prefs.reducedMotion ? 0 : 120))
  await send('store', 'sidebar', 'items')
}

const fruitText = (f, i) => (s.fruitStyle === 'numbered' ? `${i + 1}. ${f}` : s.fruitStyle === 'loud' ? `${f.toUpperCase()}!` : `• ${f}`)

onBeforeUnmount(() => clearTimeout(typingTimer))
</script>

<template>
  <div class="cf" :class="`cf--${mode}`">
    <div ref="stage" class="cf__stage graph-paper">
      <svg class="cf__wires" aria-hidden="true">
        <template v-if="mode === 'pinia'">
          <line x1="50%" y1="50%" x2="20%" y2="16%" />
          <line x1="50%" y1="50%" x2="20%" y2="84%" />
          <line x1="50%" y1="50%" x2="80%" y2="16%" />
          <line x1="50%" y1="50%" x2="80%" y2="84%" class="is-faint" />
        </template>
        <template v-else-if="mode === 'provide-inject'">
          <line x1="50%" y1="16%" x2="50%" y2="84%" />
        </template>
        <line v-else x1="50%" y1="20%" x2="50%" y2="80%" />
      </svg>

      <!-- ===== props / emits / v-model / slots / scoped-slots ===== -->
      <template v-if="!['pinia', 'provide-inject'].includes(mode)">
        <section
          data-node="parent"
          class="cf__node cf__node--top"
          :class="{ 'is-sel': selected === 'parent', 'is-flash': s.flash.parent }"
          @click="selected = 'parent'"
        >
          <header class="cf__name">{{ def.nodes.parent }}</header>
          <template v-if="mode === 'props'">
            <p class="mono">count = {{ s.count }}</p>
            <button type="button" class="btn btn--sm btn--acid" :disabled="busy" @click.stop="propsParentInc">count++</button>
          </template>
          <p v-else-if="mode === 'emits'" class="mono">total = {{ s.total }}</p>
          <p v-else-if="mode === 'v-model'" class="mono">name = "{{ s.name }}"</p>
          <div v-else-if="mode === 'slots'" class="cluster">
            <button type="button" class="btn btn--sm" @click.stop="setSlot('Hello!', 'Parent-owned content')">greeting</button>
            <button type="button" class="btn btn--sm" @click.stop="setSlot('Sale ⚡', 'Everything 20% off today')">promo</button>
          </div>
          <div v-else-if="mode === 'scoped-slots'" class="cluster">
            <button v-for="st in ['numbered', 'bullets', 'loud']" :key="st" type="button" class="btn btn--sm" :aria-pressed="s.fruitStyle === st" :disabled="busy" @click.stop="setFruitStyle(st)">
              {{ st }}
            </button>
          </div>
        </section>

        <section
          data-node="child"
          class="cf__node cf__node--bottom"
          :class="{ 'is-sel': selected === 'child', 'is-flash': s.flash.child }"
          @click="selected = 'child'"
        >
          <header class="cf__name">{{ def.nodes.child }}</header>
          <template v-if="mode === 'props'">
            <p class="mono">props.count = {{ childProps.count }}</p>
            <button type="button" class="btn btn--sm" @click.stop="propsChildMutate">try props.count++</button>
          </template>
          <button v-else-if="mode === 'emits'" type="button" class="btn btn--sm btn--acid" :disabled="busy" @click.stop="emitAdd">emit('add', 5)</button>
          <input v-else-if="mode === 'v-model'" class="input cf__input" :value="s.name" aria-label="Name (child input)" @input="onModelInput" @click.stop />
          <div v-else-if="mode === 'slots'" class="cf__card">
            <strong class="cf__slot">{{ s.slotTitle }}</strong>
            <span class="cf__slot">{{ s.slotBody }}</span>
          </div>
          <ul v-else-if="mode === 'scoped-slots'" class="cf__list">
            <li v-for="(f, i) in s.fruits" :key="f" class="cf__slot">{{ fruitText(f, i) }}</li>
          </ul>
        </section>
      </template>

      <!-- ===== provide / inject ===== -->
      <template v-else-if="mode === 'provide-inject'">
        <section data-node="parent" class="cf__node cf__node--top" :class="{ 'is-sel': selected === 'parent', 'is-flash': s.flash.parent }" @click="selected = 'parent'">
          <header class="cf__name">App</header>
          <p class="mono">provide('theme', "{{ s.theme }}")</p>
          <button type="button" class="btn btn--sm btn--acid" :disabled="busy" @click.stop="toggleTheme">toggle theme</button>
        </section>
        <section data-node="middle" class="cf__node cf__node--mid" :class="{ 'is-sel': selected === 'middle' }" @click="selected = 'middle'">
          <header class="cf__name">Layout</header>
          <p class="muted">no props, no idea about theme</p>
        </section>
        <section data-node="child" class="cf__node cf__node--bottom" :class="{ 'is-sel': selected === 'child', 'is-flash': s.flash.child }" @click="selected = 'child'">
          <header class="cf__name">ThemedButton</header>
          <span class="cf__themed" :class="`is-${s.theme}`">inject('theme') → {{ s.theme }}</span>
        </section>
      </template>

      <!-- ===== pinia ===== -->
      <template v-else>
        <section data-node="store" class="cf__node cf__node--store" :class="{ 'is-sel': selected === 'store', 'is-flash': s.flash.store }" @click="selected = 'store'">
          <header class="cf__name">🍍 cart store</header>
          <p class="mono">items: {{ s.cart.length }}</p>
        </section>
        <section data-node="header" class="cf__node cf__pos-tl" :class="{ 'is-sel': selected === 'header', 'is-flash': s.flash.header }" @click="selected = 'header'">
          <header class="cf__name">Header</header>
          <p class="mono">🛒 {{ s.cart.length }}</p>
        </section>
        <section data-node="product" class="cf__node cf__pos-bl" :class="{ 'is-sel': selected === 'product', 'is-flash': s.flash.product }" @click="selected = 'product'">
          <header class="cf__name">ProductCard</header>
          <button type="button" class="btn btn--sm btn--acid" :disabled="busy" @click.stop="addToCart">add to cart</button>
        </section>
        <section data-node="sidebar" class="cf__node cf__pos-tr" :class="{ 'is-sel': selected === 'sidebar', 'is-flash': s.flash.sidebar }" @click="selected = 'sidebar'">
          <header class="cf__name">CartSidebar</header>
          <p class="mono cf__items">{{ s.cart.slice(-3).join(', ') || 'empty' }}</p>
        </section>
        <section data-node="footer" class="cf__node cf__pos-br cf__node--faint" :class="{ 'is-sel': selected === 'footer' }" @click="selected = 'footer'">
          <header class="cf__name">Footer</header>
          <p class="muted">doesn't read the store</p>
        </section>
      </template>

      <div ref="packet" class="cf__packet" aria-hidden="true">{{ packetLabel }}</div>
    </div>

    <div class="cf__side">
      <p class="label">{{ def.title }} · click a component to see its code</p>
      <CodeBlock :code="def.code[selected] ?? ''" lang="vue" :title="`${def.nodes[selected]}`" :copyable="false" />
      <ol class="cf__log" aria-live="polite" aria-label="What just happened">
        <li v-if="!log.length" class="muted">Use the buttons inside the components.</li>
        <li v-for="(l, i) in log" :key="i + l">{{ l }}</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.cf {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: var(--s-4);
}
.cf__stage {
  position: relative;
  min-height: 380px;
  border: var(--border-thin);
  overflow: hidden;
}
.cf__wires {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.cf__wires line {
  stroke: var(--text);
  stroke-width: 3;
  stroke-dasharray: 2 7;
  stroke-linecap: round;
}
.cf__wires .is-faint {
  opacity: 0.25;
}
.cf__node {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(270px, 80%);
  display: grid;
  gap: 6px;
  justify-items: start;
  padding: var(--s-3);
  background: var(--surface);
  border: var(--border);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  font-size: 0.88rem;
}
.cf__node p {
  margin: 0;
}
.cf__node--top {
  top: 20%;
}
.cf__node--mid {
  top: 50%;
  border-style: dashed;
}
.cf__node--bottom {
  top: 80%;
}
.cf__node--store {
  top: 50%;
  width: 170px;
  background: var(--kraft);
  color: #1a1a1a;
}
.cf__pos-tl,
.cf__pos-tr,
.cf__pos-bl,
.cf__pos-br {
  width: min(180px, 42%);
}
.cf__pos-tl {
  left: 20%;
  top: 16%;
}
.cf__pos-tr {
  left: 80%;
  top: 16%;
}
.cf__pos-bl {
  left: 20%;
  top: 84%;
}
.cf__pos-br {
  left: 80%;
  top: 84%;
}
.cf__node--faint {
  opacity: 0.6;
  border-style: dashed;
}
.cf__node.is-sel {
  outline: 3px solid var(--cobalt);
  outline-offset: 3px;
}
.cf__node.is-flash {
  background: var(--acid);
  color: var(--acid-ink);
}
.cf__name {
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--text);
  color: var(--bg);
  padding: 1px 6px;
}
.cf__input {
  min-height: 34px;
  padding: 4px 8px;
}
.cf__card {
  display: grid;
  gap: 4px;
  width: 100%;
  border: 2px solid var(--line);
  padding: 6px 8px;
}
.cf__slot {
  background: color-mix(in srgb, var(--cobalt) 14%, transparent);
  outline: 1.5px dashed var(--cobalt);
  padding: 0 4px;
}
.cf__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 3px;
  width: 100%;
}
.cf__list li + li {
  margin: 0;
}
.cf__themed {
  padding: 4px 10px;
  border: 2px solid var(--line);
  font-family: var(--font-mono);
  font-size: 0.8rem;
}
.cf__themed.is-dark {
  background: #1a1a1a;
  color: #f1eee5;
}
.cf__themed.is-light {
  background: #fff;
  color: #1a1a1a;
}
.cf__items {
  font-size: 0.75rem;
}
.cf__packet {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  pointer-events: none;
  padding: 3px 9px;
  background: var(--red);
  color: #fff;
  border: 2px solid #1a1a1a;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 3px 3px 0 #1a1a1a;
  z-index: 3;
}
.cf__side {
  display: grid;
  gap: var(--s-3);
  align-content: start;
  min-width: 0;
}
.cf__side > .label {
  margin: 0;
  color: var(--muted);
}
.cf__log {
  margin: 0;
  padding: var(--s-3) var(--s-3) var(--s-3) 2em;
  border: var(--border-thin);
  background: var(--note-yellow);
  font-size: 0.86rem;
}
@media (max-width: 900px) {
  .cf {
    grid-template-columns: 1fr;
  }
}
</style>
