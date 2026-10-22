<script setup>
// Pinia visualizer: a REAL Pinia store shared by real mini components. Render
// counts come from each component's onUpdated hook, and the action log from
// store.$onAction / $subscribe — nothing here is simulated.
import { computed, defineComponent, h, onBeforeUnmount, onUpdated, reactive, ref, useId } from 'vue'
import { defineStore } from 'pinia'

const props = defineProps({
  preset: { type: String, default: 'cart' },
})

const uid = useId()
const renders = reactive({})
const flashes = reactive({})
const log = ref([])
const say = (t) => (log.value = [t, ...log.value].slice(0, 6))

function tracked(name, render) {
  return defineComponent({
    name,
    setup() {
      renders[name] = 1
      onUpdated(() => {
        renders[name]++
        flashes[name] = (flashes[name] ?? 0) + 1
        setTimeout(() => (flashes[name] = Math.max(0, flashes[name] - 1)), 500)
      })
      return render
    },
  })
}

const PRODUCTS = [
  { id: 1, name: 'Socks', price: 6 },
  { id: 2, name: 'Cap', price: 18 },
  { id: 3, name: 'Hoodie', price: 42 },
]

// ---------- cart preset: one store, several readers
const useCart = defineStore(`viz-cart-${uid}`, {
  state: () => ({ items: [] }),
  getters: {
    count: (s) => s.items.length,
    total: (s) => s.items.reduce((n, p) => n + p.price, 0),
  },
  actions: {
    add(product) {
      this.items.push(product)
    },
    clear() {
      this.items = []
    },
  },
})
const cart = useCart()
const offAction = cart.$onAction(({ name, args, after }) => {
  say(`action ${name}(${args.map((a) => (a?.name ? `"${a.name}"` : '')).join('')}) called`)
  after(() => say(`state changed → count ${cart.count}, total $${cart.total}`))
})

const Header = tracked('Header', () => h('p', { class: 'pv__line' }, `🛒 ${cart.count} item(s)`))
const ProductList = tracked('ProductList', () =>
  h(
    'div',
    { class: 'pv__btns' },
    PRODUCTS.map((p) => h('button', { type: 'button', class: 'btn btn--sm btn--acid', onClick: () => cart.add(p) }, `+ ${p.name} $${p.price}`)),
  ),
)
const CartPanel = tracked('CartPanel', () =>
  h('div', { class: 'pv__line' }, [
    h('span', cart.items.length ? cart.items.map((i) => i.name).join(', ') : 'empty'),
    h('strong', ` · total $${cart.total}`),
  ]),
)
const Footer = tracked('Footer', () => h('p', { class: 'pv__line muted' }, '© shop (never reads the store)'))

// ---------- local-vs-shared preset
const useCounter = defineStore(`viz-counter-${uid}`, () => {
  const count = ref(0)
  const inc = () => count.value++
  return { count, inc }
})
const counter = useCounter()
const offSub = counter.$subscribe((mutation, state) => say(`store.count is now ${state.count} — every component using it updates`))
// Each instance of a local counter gets its OWN ref.
function makeLocal(name) {
  return defineComponent({
    name,
    setup() {
      const count = ref(0)
      renders[name] = 1
      onUpdated(() => renders[name]++)
      return () =>
        h('div', { class: 'pv__counter' }, [
          h('span', { class: 'mono' }, `local count: ${count.value}`),
          h('button', { type: 'button', class: 'btn btn--sm', onClick: () => (count.value++, say(`${name}: its own ref changed; the other component is unaffected`)) }, '+1'),
        ])
    },
  })
}
function makeShared(name) {
  return tracked(name, () =>
    h('div', { class: 'pv__counter' }, [
      h('span', { class: 'mono' }, `store.count: ${counter.count}`),
      h('button', { type: 'button', class: 'btn btn--sm btn--acid', onClick: () => counter.inc() }, '+1'),
    ]),
  )
}
const LocalA = makeLocal('LocalA')
const LocalB = makeLocal('LocalB')
const SharedA = makeShared('SharedA')
const SharedB = makeShared('SharedB')

onBeforeUnmount(() => {
  offAction()
  offSub()
  cart.$dispose()
  counter.$dispose()
})

const cartNodes = [
  { name: 'Header', comp: Header, reads: 'count getter' },
  { name: 'ProductList', comp: ProductList, reads: 'calls add()' },
  { name: 'CartPanel', comp: CartPanel, reads: 'items + total getter' },
  { name: 'Footer', comp: Footer, reads: 'nothing' },
]
const preset = computed(() => (props.preset === 'local-vs-shared' ? 'local-vs-shared' : 'cart'))
</script>

<template>
  <div class="pv">
    <template v-if="preset === 'cart'">
      <div class="pv__layout">
        <div class="pv__store">
          <p class="label">🍍 store “cart” (real Pinia)</p>
          <pre class="mono pv__state">state:   items = [{{ cart.items.map((i) => i.name).join(', ') }}]
getters: count = {{ cart.count }}, total = {{ cart.total }}</pre>
          <button type="button" class="btn btn--sm btn--ghost" @click="cart.clear()">cart.clear()</button>
        </div>
        <div class="pv__comps">
          <section v-for="n in cartNodes" :key="n.name" class="pv__comp" :class="{ 'is-flash': flashes[n.name] }">
            <header class="pv__head">
              <span class="pv__name">{{ n.name }}</span>
              <span class="pv__reads">{{ n.reads }}</span>
              <span class="pv__renders mono" :title="`${n.name} has rendered ${renders[n.name]} time(s)`">renders: {{ renders[n.name] }}</span>
            </header>
            <component :is="n.comp" />
          </section>
        </div>
      </div>
      <p class="pv__insight">
        Add products and watch the render counters: <strong>Header</strong> and <strong>CartPanel</strong> re-render because they read the store; <strong>Footer</strong> never does. Pinia stores are
        reactive objects, so the same dependency tracking applies.
      </p>
    </template>

    <template v-else>
      <div class="pv__compare">
        <div class="pv__col">
          <p class="label">local state — each component has its own ref</p>
          <component :is="LocalA" />
          <component :is="LocalB" />
        </div>
        <div class="pv__col pv__col--shared">
          <p class="label">shared state — both read one Pinia store</p>
          <component :is="SharedA" />
          <component :is="SharedB" />
        </div>
      </div>
      <p class="pv__insight">Local refs live and die with their component. A store is created once and shared, so every reader sees the same value.</p>
    </template>

    <ol class="pv__log" aria-live="polite" aria-label="Store activity">
      <li v-if="!log.length" class="muted">Store activity from $onAction / $subscribe appears here.</li>
      <li v-for="(l, i) in log" :key="i + l" class="mono">{{ l }}</li>
    </ol>
  </div>
</template>

<style scoped>
.pv {
  display: grid;
  gap: var(--s-4);
}
.pv__layout {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
  gap: var(--s-4);
  align-items: start;
}
.pv__store {
  border: var(--border);
  background: var(--kraft);
  color: #1a1a1a;
  padding: var(--s-3);
  box-shadow: var(--shadow-sm);
  display: grid;
  gap: var(--s-2);
}
.pv__store .label {
  margin: 0;
}
.pv__state {
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.78rem;
  background: #fffef0;
  border: 2px dashed #1a1a1a;
  padding: 6px 8px;
}
.pv__store .btn {
  --btn-fg: #1a1a1a;
  justify-self: start;
}
.pv__comps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-3);
}
.pv__comp {
  border: var(--border-thin);
  background: var(--surface);
  padding: var(--s-2) var(--s-3);
  display: grid;
  gap: 6px;
  transition: background var(--quick) var(--snap);
}
.pv__comp.is-flash {
  background: var(--acid);
  color: var(--acid-ink);
}
.pv__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.pv__name {
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 0.75rem;
  background: var(--text);
  color: var(--bg);
  padding: 0 5px;
}
.pv__reads {
  font-size: 0.72rem;
  color: var(--muted);
}
.pv__comp.is-flash .pv__reads {
  color: #3d3d2c;
}
.pv__renders {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 800;
  border: 1.5px solid currentColor;
  padding: 0 5px;
}
.pv__comp :deep(.pv__line) {
  margin: 0;
  font-size: 0.86rem;
}
.pv__comp :deep(.pv__btns) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pv__compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-4);
}
.pv__col {
  border: var(--border-thin);
  padding: var(--s-3);
  display: grid;
  gap: var(--s-2);
  background: var(--surface);
}
.pv__col--shared {
  background: var(--note-yellow);
}
.pv__col .label {
  margin: 0;
  color: var(--muted);
}
.pv__col :deep(.pv__counter) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
  border: 2px solid var(--line);
  padding: 6px 8px;
  background: var(--surface);
}
.pv__insight {
  margin: 0;
  padding: var(--s-3) var(--s-4);
  border-left: 6px solid var(--cobalt);
  background: var(--note-blue);
}
.pv__log {
  margin: 0;
  padding: var(--s-3) var(--s-3) var(--s-3) 2em;
  border: var(--border-thin);
  background: var(--surface-2);
  font-size: 0.78rem;
}
@media (max-width: 800px) {
  .pv__layout,
  .pv__compare {
    grid-template-columns: 1fr;
  }
}
</style>
