// Lesson: Persistence, testing & choosing Pinia

const mainJs = `import App from './App.vue'
import { startApp } from './boot.js'

// boot.js does the usual createApp(App).use(pinia).mount('#app')
// and can throw the app away to simulate a page reload.
startApp(App)`

const bootJs = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { persistPlugin } from './plugins/persist.js'

let root = null
let app = null

// What every page load does: a brand-new Pinia and a brand-new app.
export function startApp(component) {
  root = component
  const pinia = createPinia()
  pinia.use(persistPlugin) // plugins run for every store this Pinia creates
  app = createApp(root).use(pinia)
  app.mount('#app')
}

// Simulated reload: memory is wiped, localStorage survives.
export function simulateReload() {
  app.unmount()
  startApp(root)
}`

const persistPluginJs = `// A simplified persistence plugin. Production versions add debouncing,
// versioned keys / migrations and a choice of which fields to save.
export function persistPlugin({ store, options }) {
  if (!options.persist) return // only stores that opt in

  const key = \`vz:\${store.$id}\`

  // 1. Hydrate: restore saved state when the store is created
  const saved = localStorage.getItem(key)
  if (saved) store.$patch(JSON.parse(saved))

  // 2. Save after every change. detached: keep listening even if the
  //    component that first used the store unmounts.
  store.$subscribe((_mutation, state) => {
    localStorage.setItem(key, JSON.stringify(state))
  }, { detached: true })
}`

const cartStore = `import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],        // { id, name, qty }
    lastAdded: null,  // only used to highlight the newest line
  }),
  getters: {
    count: (state) => state.items.reduce((n, i) => n + i.qty, 0),
  },
  actions: {
    add(product) {
      const line = this.items.find((i) => i.id === product.id)
      if (line) line.qty++
      else this.items.push({ id: product.id, name: product.name, qty: 1 })
      this.lastAdded = product.id
    },
    clear() {
      this.items = []
      this.lastAdded = null
    },
  },
  persist: true, // a custom option — Pinia ignores it, our plugin reads it
})`

const prefsStore = `import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePrefsStore = defineStore('prefs', () => {
  const theme = ref('light')
  const currency = ref('EUR')
  return { theme, currency }
})`

const appVue = `<script setup>
import { storeToRefs } from 'pinia'
import { useCartStore } from './stores/cart.js'
import { usePrefsStore } from './stores/prefs.js'
import { simulateReload } from './boot.js'

const cart = useCartStore()
const { theme, currency } = storeToRefs(usePrefsStore())

const products = [
  { id: 1, name: 'Coffee mug' },
  { id: 2, name: 'Notebook' },
]
</script>

<template>
  <section :class="['app', theme]">
    <header class="top">
      <strong>Corner Shop</strong>
      <span>🛒 <b class="count">{{ cart.count }}</b></span>
    </header>

    <label>Theme
      <select class="theme" v-model="theme">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    <label>Currency
      <select class="currency" v-model="currency">
        <option>EUR</option>
        <option>USD</option>
      </select>
    </label>

    <ul>
      <li v-for="p in products" :key="p.id">
        {{ p.name }} <button class="add" @click="cart.add(p)">Add</button>
      </li>
    </ul>
    <ul class="lines">
      <li v-for="line in cart.items" :key="line.id" :class="{ fresh: line.id === cart.lastAdded }">
        {{ line.name }} × {{ line.qty }}
      </li>
    </ul>

    <button class="clear" @click="cart.clear()">Empty cart</button>
    <button class="reload-sim" @click="simulateReload">↻ Simulate page reload</button>
  </section>
</template>

<style>
.app { padding: 12px; }
.app.dark { background: #1d1d1f; color: #f5f5f7; }
.top { display: flex; justify-content: space-between; margin-bottom: 8px; }
.fresh { font-weight: bold; }
label { margin-right: 12px; }
</style>`

const playgroundFiles = {
  'main.js': mainJs,
  'boot.js': bootJs,
  'plugins/persist.js': persistPluginJs,
  'stores/cart.js': cartStore,
  'stores/prefs.js': prefsStore,
  'App.vue': appVue,
}

// ---- exercise: budget store vs unit tests
const plainMain = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')`

const budgetStarter = `import { defineStore } from 'pinia'

export const useBudgetStore = defineStore('budget', {
  state: () => ({
    limit: 500,
    expenses: [], // { id, label, amount }
  }),

  getters: {
    spent: (state) => state.expenses.reduce((sum, e) => sum + e.amount, 0),
    remaining: (state) => state.limit,
    // TODO: isOverBudget
  },

  actions: {
    addExpense({ label, amount }) {
      this.expenses.push({ id: Date.now(), label, amount })
    },
    // TODO: removeExpense(id), setLimit(limit)
  },
})`

const budgetSolution = `import { defineStore } from 'pinia'

export const useBudgetStore = defineStore('budget', {
  state: () => ({
    limit: 500,
    expenses: [], // { id, label, amount }
    nextId: 1,
  }),

  getters: {
    spent: (state) => state.expenses.reduce((sum, e) => sum + e.amount, 0),
    remaining() {
      return this.limit - this.spent
    },
    isOverBudget() {
      return this.spent > this.limit
    },
  },

  actions: {
    addExpense({ label, amount }) {
      const value = Number(amount)
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('Amount must be a positive number')
      }
      // Date.now() can repeat within one millisecond — use a counter instead
      this.expenses.push({ id: this.nextId++, label, amount: value })
    },
    removeExpense(id) {
      this.expenses = this.expenses.filter((e) => e.id !== id)
    },
    setLimit(limit) {
      this.limit = Number(limit)
    },
  },
})`

const budgetApp = `<script setup>
import { ref } from 'vue'
import { useBudgetStore } from './stores/budget.js'

const budget = useBudgetStore()
const label = ref('')
const amount = ref('')
const error = ref('')

function add() {
  error.value = ''
  try {
    budget.addExpense({ label: label.value, amount: amount.value })
    label.value = ''
    amount.value = ''
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <form @submit.prevent="add">
    <input class="label" v-model="label" placeholder="What" />
    <input class="amount" v-model="amount" placeholder="Amount" />
    <button>Add</button>
  </form>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <ul>
    <li v-for="e in budget.expenses" :key="e.id" class="expense">
      {{ e.label }}: {{ e.amount }}
      <button class="remove" @click="budget.removeExpense?.(e.id)">×</button>
    </li>
  </ul>
  <p class="remaining">Remaining: {{ budget.remaining }}</p>
  <p v-if="budget.isOverBudget" class="over">Over budget!</p>
</template>`

const budgetTestsShown = `import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBudgetStore } from '@/stores/budget'

describe('budget store', () => {
  beforeEach(() => {
    setActivePinia(createPinia()) // a fresh Pinia → fresh state for every test
  })

  it('tracks spent and remaining', () => {
    const budget = useBudgetStore()
    budget.addExpense({ label: 'Rent', amount: 300 })
    budget.addExpense({ label: 'Food', amount: 120 })
    expect(budget.spent).toBe(420)
    expect(budget.remaining).toBe(80)
  })
  // …more tests: invalid amounts throw, removeExpense, setLimit, isOverBudget
})`

// ---- exercise: versioned persistence with migration
const storageStarter = `// Saved carts survive app updates — so their SHAPE can be old.
// v1 (old app):  ["Mug", "Plant", "Mug"]              key 'cart:v1'
// v2 (current):  [{ name: "Mug", qty: 2 }, …]          key 'cart:v2'

const KEY = 'cart:v2'

export function loadCart() {
  const raw = localStorage.getItem(KEY)
  if (raw) return JSON.parse(raw)
  // TODO: migrate 'cart:v1' data, and never crash on corrupted JSON
  return []
}

export function saveCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}`

const storageSolution = `// Saved carts survive app updates — so their SHAPE can be old.
// v1 (old app):  ["Mug", "Plant", "Mug"]              key 'cart:v1'
// v2 (current):  [{ name: "Mug", qty: 2 }, …]          key 'cart:v2'

const KEY = 'cart:v2'
const OLD_KEY = 'cart:v1'

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem(key) // corrupted: drop it rather than crash
    return null
  }
}

function migrateV1(names) {
  const lines = []
  for (const name of names) {
    const line = lines.find((l) => l.name === name)
    if (line) line.qty++
    else lines.push({ name, qty: 1 })
  }
  return lines
}

export function loadCart() {
  const current = readJson(KEY)
  if (Array.isArray(current)) return current

  const old = readJson(OLD_KEY)
  if (Array.isArray(old)) {
    const migrated = migrateV1(old)
    saveCart(migrated)
    localStorage.removeItem(OLD_KEY)
    return migrated
  }
  return []
}

export function saveCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}`

const migrateCartStore = `import { defineStore } from 'pinia'
import { loadCart } from '../storage.js'

export const useCartStore = defineStore('cart', {
  // state() runs when the store is created → hydrate from storage here
  state: () => ({ items: loadCart() }),
  getters: {
    count: (state) => state.items.reduce((n, l) => n + l.qty, 0),
  },
  actions: {
    add(name) {
      const line = this.items.find((l) => l.name === name)
      if (line) line.qty++
      else this.items.push({ name, qty: 1 })
    },
  },
})`

const migrateApp = `<script setup>
import { useCartStore } from './stores/cart.js'
import { saveCart } from './storage.js'

const cart = useCartStore()
cart.$subscribe((_mutation, state) => saveCart(state.items), { detached: true })
</script>

<template>
  <button class="add-mug" @click="cart.add('Mug')">Add mug</button>
  <p class="count">{{ cart.count }}</p>
  <ul>
    <li v-for="line in cart.items" :key="line.name" class="line">{{ line.name }} × {{ line.qty }}</li>
  </ul>
</template>`

// ---- interview coding: a $reset plugin for setup stores
const resetMain = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { resetPlugin } from './plugins/reset.js'
import App from './App.vue'

const pinia = createPinia()
pinia.use(resetPlugin)
createApp(App).use(pinia).mount('#app')`

const resetPluginStarter = `// TODO: give every store a working $reset(), including setup stores.
export function resetPlugin({ store }) {
}`

const resetPluginSolution = `// Simplified: assumes JSON-serialisable state (no Dates, Maps, class instances).
export function resetPlugin({ store }) {
  // Snapshot the state as it is right after the store is created
  const initial = JSON.stringify(store.$state)

  store.$reset = () => {
    // Parse a FRESH copy each time, so later changes can't leak into the snapshot
    const fresh = JSON.parse(initial)
    store.$patch((state) => Object.assign(state, fresh))
  }
}`

const resetCart = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const count = computed(() => items.value.length)
  function add(name) { items.value.push(name) }
  return { items, count, add }
})`

const resetPrefs = `import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePrefsStore = defineStore('prefs', () => {
  const theme = ref('light')
  return { theme }
})`

const resetApp = `<script setup>
import { useCartStore } from './stores/cart.js'
import { usePrefsStore } from './stores/prefs.js'

const cart = useCartStore()
const prefs = usePrefsStore()

function logout() {
  // Everything user-specific goes back to its initial state
  cart.$reset()
  prefs.$reset()
}
</script>

<template>
  <button class="add" @click="cart.add('Mug')">Add mug</button>
  <span class="count">{{ cart.count }}</span>
  <button class="dark" @click="prefs.theme = 'dark'">Dark theme</button>
  <span class="theme">{{ prefs.theme }}</span>
  <button class="logout" @click="logout">Log out</button>
</template>`

export default {
  id: 'pinia-production',
  title: 'Persistence, testing & choosing Pinia',
  summary: 'Persist stores safely with plugins, test stores and components that use them, use devtools and HMR, avoid the classic mistakes, and decide when Pinia beats provide/inject or composables.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['pinia-async-patterns', 'using-stores'],
  related: ['provide-inject', 'composables-intro', 'testing-logic', 'auth-security', 'rendering-strategies', 'why-state-management'],
  tags: ['pinia', 'persistence', 'localStorage', 'plugins', 'testing', 'setActivePinia', 'createTestingPinia', 'devtools', 'HMR', 'SSR', 'provide/inject', 'composables'],
  apis: [
    { name: 'pinia.use(plugin)', summary: 'Registers a plugin; it runs once for every store created by that Pinia and receives `{ pinia, app, store, options }`.' },
    { name: 'setActivePinia(createPinia())', summary: 'Makes a fresh Pinia active outside components — the standard `beforeEach` in store unit tests.' },
    { name: 'createTestingPinia()', summary: 'From `@pinia/testing`: a Pinia for component tests that stubs actions by default and accepts `initialState`.' },
    { name: 'acceptHMRUpdate()', summary: 'Enables hot module replacement for a store in Vite/webpack projects.' },
    { name: 'store.$subscribe(…, { detached: true })', summary: 'The usual hook for saving store state; `detached` keeps it alive after the calling component unmounts.' },
  ],
  docs: [
    { label: 'Pinia — Plugins', url: 'https://pinia.vuejs.org/core-concepts/plugins.html' },
    { label: 'Pinia — Testing stores', url: 'https://pinia.vuejs.org/cookbook/testing.html' },
    { label: 'Pinia — Hot Module Replacement', url: 'https://pinia.vuejs.org/cookbook/hot-module-replacement.html' },
    { label: 'Pinia — Server Side Rendering', url: 'https://pinia.vuejs.org/ssr/' },
    { label: 'Vue Guide — State Management', url: 'https://vuejs.org/guide/scaling-up/state-management.html' },
  ],

  intro: `
Pinia state lives in memory. Reload the page and it is gone; open a test and it must start clean; render on a server and it must not leak between users.

This lesson is about running Pinia in real projects:

- **persistence** — saving selected state to \`localStorage\` with a plugin, restoring it safely, and migrating old saved data;
- **testing** — unit-testing stores with a fresh Pinia per test, and testing components that use stores;
- **devtools and HMR** — seeing and editing state while you develop;
- **the classic mistakes** that make stores hard to live with;
- **choosing** between Pinia, provide/inject and composables.
`,

  why: `
Users expect a cart to survive a refresh and a theme to be remembered. Writing \`localStorage.setItem\` inside every action is repetitive and easy to forget — one central mechanism is better, and Pinia's **plugin** system is exactly that.

Saved data then outlives your code: next month the cart's shape changes, and old saved carts must still load. Corrupted JSON must not crash the app. And some things — tokens, personal data, transient flags — should never be persisted at all.

Stores also hold your most important rules (prices, limits, permissions in the UI), so they deserve tests. Because Pinia stores are created per Pinia instance, giving each test a fresh Pinia makes them easy to test in isolation.

Finally, Pinia isn't the only way to share state. Knowing when **provide/inject** or a **composable** is the better tool keeps your global state small.
`,

  eli15: `
Think of a whiteboard in a classroom (the store). At the end of the day the cleaner wipes it — that's a page reload.

**Persistence** is taking a photo of the important parts of the board before you leave, and copying them back onto the board in the morning. You don't photograph the doodles, and you never photograph someone's password written in the corner.

If next term the teacher changes how the board is laid out, last term's photos still need to make sense — that's **migration**.

**Testing** a store is like checking the board's rules with a brand-new, clean board for each check, so one experiment can't mess up the next.
`,

  analogy: {
    title: 'The classroom whiteboard and the photo',
    body: `
The whiteboard is fast and everyone can see it, but it's wiped every night. So before leaving, a student photographs the parts worth keeping and in the morning copies them back. The class agrees on *which* parts get photographed — not the doodles, never anything private.

When the school changes the layout of the board, someone has to translate old photos into the new layout. And when the teacher wants to check a rule ("the homework list can't have more than 5 items"), they try it on a spare, clean board — not on the one the class is using.
`,
    mapping: [
      ['the whiteboard', 'Pinia state in memory'],
      ['wiped every night', 'a page reload creates a new Pinia'],
      ['the photo', 'state saved to `localStorage` by `$subscribe`'],
      ['copying it back in the morning', 'hydrating the store when it is created'],
      ['agreeing what to photograph', 'opting stores in, omitting transient or secret fields'],
      ['translating old photos', 'versioned keys and migrations'],
      ['a spare, clean board', '`setActivePinia(createPinia())` in each test'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Which tool shares this state?',
    caption: 'Ask who needs the state and how many independent copies should exist.',
    alt: 'A decision diagram. If only one component needs it, use local state. If a parent and nearby children need it, use props and events. If a subtree such as one form or one tabs widget needs it and each instance should have its own copy, use provide and inject. If you need reusable logic with per-caller state, use a composable. If distant parts of the whole app share one copy, use a Pinia store.',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'q', label: 'Who needs this state?', x: 380, y: 40, tone: 'ink' },
        { id: 'local', label: 'Local ref', note: 'one component', x: 90, y: 170, tone: 'paper' },
        { id: 'props', label: 'Props & events', note: 'parent + nearby children', x: 240, y: 260, tone: 'paper' },
        { id: 'inject', label: 'provide / inject', note: 'one subtree, one copy per instance', x: 380, y: 170, tone: 'cobalt' },
        { id: 'composable', label: 'Composable', note: 'reusable logic, per-caller state', x: 530, y: 260, tone: 'kraft' },
        { id: 'pinia', label: 'Pinia store', note: 'whole app, one shared copy', x: 670, y: 170, tone: 'acid' },
      ],
      edges: [
        { from: 'q', to: 'local' },
        { from: 'q', to: 'props' },
        { from: 'q', to: 'inject' },
        { from: 'q', to: 'composable' },
        { from: 'q', to: 'pinia' },
      ],
      steps: [
        { focus: ['q'], text: 'Start from the question "who needs this, and how many independent copies should exist?" — not from "which library do we use".' },
        { focus: ['local', 'props'], edges: ['q->local', 'q->props'], text: 'One component → a local `ref`. A parent and nearby children → props down, events (or `v-model`) up. Most state lives here.' },
        { focus: ['inject'], edges: ['q->inject'], text: 'A **subtree** that shares context — one form and its fields, one tabs widget and its panels — and where every instance needs **its own** copy → provide/inject. Two forms on a page get two separate states.' },
        { focus: ['composable'], edges: ['q->composable'], text: 'Reusable **logic** (fetching, mouse position, a form helper) where each caller gets its own state → a composable. It shares code, not data.' },
        { focus: ['pinia'], edges: ['q->pinia'], text: 'Distant parts of the **whole app** share **one** copy (cart, current user, preferences), and you want devtools, plugins, testing helpers and SSR safety → a Pinia store.' },
      ],
    },
  },

  animation: {
    type: 'concept-diagram',
    title: 'The persistence round trip',
    caption: 'Changes are saved by a subscription; a reload creates a new Pinia, and the plugin restores what was saved.',
    alt: 'A loop. An action changes store state; a $subscribe listener writes JSON to localStorage. On reload a new Pinia is created, the store is created again, the plugin reads localStorage and patches the saved state into the store, and the UI renders the restored values.',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'action', label: 'cart.add()', note: 'state changes', x: 110, y: 70, tone: 'acid' },
        { id: 'subscribe', label: '$subscribe', note: 'JSON.stringify', x: 380, y: 70, tone: 'cobalt' },
        { id: 'storage', label: 'localStorage', note: 'vz:cart', x: 650, y: 70, tone: 'kraft' },
        { id: 'reload', label: 'Reload', note: 'new Pinia, empty state', x: 650, y: 230, tone: 'red' },
        { id: 'plugin', label: 'Plugin hydrates', note: 'store.$patch(saved)', x: 380, y: 230, tone: 'cobalt' },
        { id: 'ui', label: 'UI renders', note: 'cart restored', x: 110, y: 230, tone: 'paper' },
      ],
      edges: [
        { from: 'action', to: 'subscribe' },
        { from: 'subscribe', to: 'storage', label: 'setItem' },
        { from: 'storage', to: 'reload', dashed: true },
        { from: 'reload', to: 'plugin', label: 'getItem' },
        { from: 'plugin', to: 'ui' },
      ],
      steps: [
        { focus: ['action'], text: 'An action changes the cart state, exactly as before. The store knows nothing about storage.' },
        { focus: ['subscribe', 'storage'], edges: ['action->subscribe', 'subscribe->storage'], text: 'The plugin registered a detached `$subscribe` listener for opted-in stores. After the change it serialises the state and writes it under a key like `vz:cart`.' },
        { focus: ['reload'], edges: ['storage->reload'], text: 'The page reloads. All JavaScript memory is gone: a new app, a new Pinia, no stores yet. `localStorage` survives.' },
        { focus: ['plugin'], edges: ['reload->plugin'], text: 'When a component first calls `useCartStore()`, the store is created and the plugin runs: it reads the key, parses the JSON (safely!) and `$patch`es it into the fresh state.' },
        { focus: ['ui'], edges: ['plugin->ui'], text: 'Components render the restored cart. From the user\'s point of view, nothing was lost.' },
      ],
    },
  },

  syntax: [
    `
#### A Pinia plugin

A plugin is a function Pinia calls **once for each store** it creates. It receives a context object and can read the store's options, subscribe, add properties, or wrap actions:
`,
    {
      code: `// main.js
const pinia = createPinia()
pinia.use(({ pinia, app, store, options }) => {
  // options = the object passed to defineStore (option stores),
  //           or the third argument (setup stores)
  console.log('created store', store.$id)
})
app.use(pinia)`,
      lang: 'js',
      title: 'plugin shape',
    },
    `
#### Opting stores in with a custom option
`,
    {
      code: `// option store: add it next to state/getters/actions
defineStore('cart', {
  state: () => ({ items: [] }),
  persist: true,
})

// setup store: pass options as the third argument
defineStore('prefs', () => {
  const theme = ref('light')
  return { theme }
}, { persist: true })`,
      lang: 'js',
      title: 'custom store options',
    },
    `
#### Hydrate and save (simplified)
`,
    {
      code: `export function persistPlugin({ store, options }) {
  if (!options.persist) return
  const key = \`vz:\${store.$id}\`

  try {
    const saved = localStorage.getItem(key)
    if (saved) store.$patch(JSON.parse(saved))
  } catch {
    localStorage.removeItem(key)          // corrupted → start fresh
  }

  store.$subscribe((_mutation, state) => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* storage full or blocked (e.g. private mode) — keep working in memory */
    }
  }, { detached: true })
}`,
      lang: 'js',
      title: 'plugins/persist.js',
    },
    `
Community plugins such as \`pinia-plugin-persistedstate\` package this pattern with more options (which storage, which paths, custom serialisers). Writing the small version yourself first makes their options easy to understand.

#### Testing a store
`,
    {
      code: `import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '@/stores/tasks'
import * as api from '@/api'

vi.mock('@/api')                        // no real network in unit tests

describe('task store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())       // fresh state for EVERY test
  })

  it('loads tasks', async () => {
    api.fetchTasks.mockResolvedValue([{ id: 1, title: 'A', done: false }])
    const store = useTaskStore()
    await store.fetchTasks()
    expect(store.status).toBe('success')
    expect(store.remaining).toBe(1)
  })
})`,
      lang: 'js',
      title: 'tasks.spec.js (Vitest)',
      static: true,
    },
    `
#### Testing a component that uses stores
`,
    {
      code: `import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { vi } from 'vitest'
import CartBadge from '@/components/CartBadge.vue'
import { useCartStore } from '@/stores/cart'

const wrapper = mount(CartBadge, {
  global: {
    plugins: [createTestingPinia({
      createSpy: vi.fn,                         // actions become spies…
      initialState: { cart: { items: [{ id: 1, qty: 2 }] } },
    })],
  },
})

const cart = useCartStore()                     // the testing pinia's store
expect(wrapper.text()).toContain('2')
await wrapper.find('button').trigger('click')
expect(cart.clear).toHaveBeenCalledOnce()       // …stubbed by default (stubActions: true)`,
      lang: 'js',
      title: 'CartBadge.spec.js (Vitest + Vue Test Utils)',
      static: true,
    },
    `
#### Hot module replacement (Vite)
`,
    {
      code: `import { defineStore, acceptHMRUpdate } from 'pinia'

export const useCartStore = defineStore('cart', { /* … */ })

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartStore, import.meta.hot))
}`,
      lang: 'js',
      title: 'stores/cart.js',
      static: true,
    },
    `
With HMR, editing a store keeps the current state instead of reloading the page. **Vue DevTools** (browser extension or the Vite plugin) shows each Pinia store: inspect and edit state, and follow actions and mutations on a timeline.

**The rules:**

1. Persist **only what users expect to survive**: cart, preferences, drafts. Never tokens you can keep in httpOnly cookies, never secrets, rarely personal data.
2. Don't persist **derived** values (getters) or **transient** state (loading flags, errors, "just added" highlights).
3. Treat saved data as **untrusted input**: parse inside \`try\`, validate the shape, version your keys and migrate old formats.
4. \`localStorage\` doesn't exist on the server — with SSR, hydrate persisted state on the client only.
5. In tests, create a **fresh Pinia per test** (\`beforeEach\`), mock the API module, and test getters and actions directly.
6. Plugins only run for stores created **after** the Pinia is installed in an app; in tests of plugins, install the Pinia into an app first.
`,
  ],

  walkthrough: {
    title: 'plugins/persist.js',
    lang: 'js',
    code: persistPluginJs,
    intro: 'The whole persistence mechanism behind the playground. It runs once per store and touches no component.',
    steps: [
      { lines: [3], text: 'A plugin is just a function. Pinia calls it for every store this Pinia creates, passing `{ pinia, app, store, options }` — here we only need the store and its options.' },
      { lines: [4], text: '`options` is what you passed to `defineStore`. `persist` is not a Pinia feature; it is a custom option our plugin chooses to read. Stores without it are ignored.' },
      { lines: [6], text: 'One storage key per store id. A real app would add a version (`vz:cart:v2`) so a future shape change can be detected.' },
      { lines: [8, 10], text: 'Hydration: if something was saved, patch it into the freshly created state. Note the risk — `JSON.parse` throws on corrupted data, which would crash store creation. One experiment fixes that.' },
      { lines: [12, 16], text: 'Saving: `$subscribe` runs after state changes. `detached: true` keeps the listener even after the component that first called `useCartStore()` unmounts — the store lives longer than any single component.' },
    ],
  },

  playground: {
    title: 'A cart that survives reloads',
    objective: 'See persistence through a plugin, simulate a page reload, then make the plugin safer and more selective.',
    files: playgroundFiles,
    expected: 'A small shop with theme and currency selectors. Add items, then press **↻ Simulate page reload**: the app and its Pinia are thrown away and rebuilt. The cart comes back (it opts into persistence); the theme does not (yet).',
    experiments: [
      {
        id: 'persist-prefs',
        task: 'The theme is forgotten on reload. Opt the **prefs** setup store into persistence by passing `{ persist: true }` as the third argument to `defineStore`.',
        hint: '`defineStore(\'prefs\', () => { … }, { persist: true })` — setup stores take options as a third argument, and the plugin reads them from `options`.',
        tests: [
          {
            name: 'the theme is saved and survives a reload',
            code: `await select('.theme', 'dark')
await flush()
expect(localStorage.getItem('vz:prefs') || '').toContain('"theme":"dark"')
await click('.reload-sim')
expect(find('.theme').value).toBe('dark')`,
          },
        ],
        explain: 'No component changed, and the prefs store gained persistence with one option. That is the point of a plugin: cross-cutting behaviour in one place, opted into per store.',
      },
      {
        id: 'safe-hydrate',
        task: 'If the saved JSON is corrupted, `JSON.parse` throws and the store can\'t even be created. Make the plugin **survive** it: catch the error, remove the bad entry, and start with the default state.',
        hint: 'Wrap the `getItem` + `JSON.parse` + `$patch` lines in `try { … } catch { localStorage.removeItem(key) }`.',
        tests: [
          {
            name: 'a fresh Pinia survives corrupted storage',
            code: `const { createApp } = requireModule('vue')
const { createPinia, setActivePinia } = requireModule('pinia')
const { persistPlugin } = requireModule('plugins/persist.js')
const { useCartStore } = requireModule('stores/cart.js')

localStorage.setItem('vz:cart', '{not json')
const pinia = createPinia()
pinia.use(persistPlugin)
createApp({}).use(pinia) // plugins run once Pinia is installed in an app
setActivePinia(pinia)

let cart
expect(() => { cart = useCartStore() }).not.toThrow()
expect(cart.count).toBe(0)
expect(localStorage.getItem('vz:cart')).toBeNull()`,
          },
        ],
        explain: 'Saved data is input you don\'t control — older versions of your app, browser extensions or a half-written value can all leave something unparsable. This test also shows how to test a plugin: a fresh Pinia, installed into an app, with `setActivePinia` — no page needed.',
      },
      {
        id: 'omit-transient',
        task: '`lastAdded` only highlights the newest line; restoring it after a reload is meaningless. Change the cart to `persist: { omit: [\'lastAdded\'] }` and update the plugin so omitted keys are **not saved**.',
        hint: 'In the `$subscribe` callback: `const copy = { ...state }`, then `for (const k of options.persist.omit ?? []) delete copy[k]`, and save `copy`. `persist: true` has no `omit`, so guard with `?.`.',
        tests: [
          {
            name: 'items are saved but lastAdded is not',
            code: `await click(findAll('.add')[0])
await flush()
const saved = JSON.parse(localStorage.getItem('vz:cart') || '{}')
expect(saved.items).toHaveLength(1)
expect('lastAdded' in saved).toBe(false)`,
          },
        ],
        explain: 'Persist facts users care about, not UI leftovers. The same idea keeps loading flags, error messages and anything secret out of storage.',
      },
      {
        id: 'fresh-pinia',
        task: 'Remove `persist: true` from the cart store, add a few items and press **Simulate page reload**. Then put it back.',
        hint: 'Watch the cart badge before and after.',
        explain: 'Everything is gone: each page load creates a brand-new Pinia, and Pinia state lives only in memory. Persistence is something you add deliberately, store by store.',
      },
    ],
  },

  internals: {
    beginner: `
A plugin is a function Pinia calls each time it creates a store. It's a single place to add behaviour to *every* store — like saving to storage — instead of writing the same lines in each one.

Saving works with \`$subscribe\`: "tell me whenever this store's state changes". Loading works the other way: right after a store is created, the plugin looks in \`localStorage\` and copies the saved values in.

For tests, the important idea is that a store lives *inside* a Pinia. Make a new Pinia and you get brand-new stores with fresh state. That's why each test starts with \`setActivePinia(createPinia())\`.
`,
    technical: [
      `
**When plugins run.** \`pinia.use(plugin)\` stores the plugin; if the Pinia isn't installed in an app yet, it is queued until \`app.use(pinia)\`. Plugins then run for each store *as it is created* (lazily, on first \`useXxxStore()\`), inside the store's effect scope, with \`{ pinia, app, store, options }\`. Whatever object a plugin returns is merged into the store; plugins can also assign properties directly, call \`$subscribe\`/\`$onAction\`, or wrap actions.

**Hydration timing.** Patching saved state inside the plugin happens during store creation, before any component reads it, so the first render already shows restored values. Hydrating in \`state()\` (\`state: () => ({ items: loadCart() })\`) works too and is simpler for a single store.

**Testing.** \`setActivePinia(pinia)\` sets the Pinia that \`useXxxStore()\` falls back to outside components. A new \`createPinia()\` has an empty state tree and an empty store registry, so every store is created fresh. Plugins only run once the Pinia is installed in an app — which is why plugin tests create a dummy app, and why \`createTestingPinia()\` handles that for you.
`,
      {
        code: `// What the sandbox experiment does — and what a plugin test looks like
const pinia = createPinia()
pinia.use(persistPlugin)
createApp({}).use(pinia)   // install: queued plugins become active
setActivePinia(pinia)
const cart = useCartStore() // store created now → plugin runs → hydration`,
        lang: 'js',
        title: 'testing a plugin',
      },
      `
**createTestingPinia.** For component tests, \`@pinia/testing\` creates a Pinia that installs itself into the mounted app, sets initial state, and by default replaces actions with spies (\`stubActions: true\`) so you test the component's behaviour, not the store's. Pass \`stubActions: false\` to run real actions. Getters can be overridden in tests.

**SSR.** On the server, each request creates its own Pinia; after rendering, \`pinia.state.value\` is serialised into the HTML and the client sets \`pinia.state.value\` from it before stores are used. Because that payload is injected into HTML, serialise it with something that escapes it safely (for example \`devalue\`). Nuxt's Pinia module does this for you. \`localStorage\` hydration must run only on the client.
`,
    ],
    production: `
- **Version and migrate.** Put a version in the key or payload (\`cart:v2\`), migrate older shapes on load, then delete the old key. Saved data outlives deployments.
- **Validate on load.** Check the parsed value's shape before patching; ignore unknown fields. Treat it like any external input.
- **Mind the cost.** \`JSON.stringify\` of a large store on every change can be noticeable; debounce writes, persist only the needed fields, or use a separate key per slice.
- **Security.** Anything in \`localStorage\` can be read by any script running on your origin (including injected ones), so keep auth tokens out of it where possible (prefer httpOnly cookies), and clear user-specific stores on logout.
- **Cross-tab sync.** The \`storage\` event fires in *other* tabs when a key changes; a plugin can listen and \`$patch\` to keep tabs consistent.
- **Store size and shape.** Prefer many small domain stores to one "god store". Split by business domain (cart, auth, catalog), not by technical layer.
- **Common mistakes to review for:** destructuring stores without \`storeToRefs\`; components mutating store state from everywhere instead of calling actions; derived values stored as state; per-instance UI state made global; store calls at module top level; circular store dependencies.
`,
  },

  mistakes: [
    {
      title: 'Persisting everything, including secrets',
      wrong: { code: `// persist the whole auth store
defineStore('auth', {
  state: () => ({ user: null, accessToken: '', refreshToken: '' }),
  persist: true,
})`, lang: 'js' },
      right: { code: `// let the server keep the session in an httpOnly cookie;
// persist only harmless UI preferences
defineStore('prefs', () => {
  const theme = ref('light')
  return { theme }
}, { persist: true })`, lang: 'js' },
      explanation: 'Anything in `localStorage` is readable by any script that runs on your page. Long-lived tokens there turn a single XSS bug into account takeover. Persist what users expect to survive; leave secrets to httpOnly cookies set by the server.',
    },
    {
      title: 'Trusting saved JSON',
      wrong: { code: `const saved = localStorage.getItem(key)
if (saved) store.$patch(JSON.parse(saved)) // throws on corrupted data`, lang: 'js' },
      right: { code: `try {
  const saved = JSON.parse(localStorage.getItem(key) ?? 'null')
  if (saved && Array.isArray(saved.items)) store.$patch(saved)
} catch {
  localStorage.removeItem(key)
}`, lang: 'js' },
      explanation: 'Saved data can be corrupted, from an older app version, or edited by hand. Parse safely and check the shape before using it.',
    },
    {
      title: 'Sharing one Pinia across tests',
      wrong: { code: `beforeAll(() => {
  setActivePinia(createPinia()) // one Pinia for the whole file
})`, lang: 'js' },
      right: { code: `beforeEach(() => {
  setActivePinia(createPinia()) // fresh state for every test
})`, lang: 'js' },
      explanation: 'Stores are shared per Pinia. With one Pinia for all tests, state from one test leaks into the next and results depend on test order.',
    },
    {
      title: 'Mutating store state from everywhere',
      wrong: { code: `// ProductCard.vue
cart.items.push({ id, qty: 1 })
// CartPage.vue
cart.items = cart.items.filter((i) => i.id !== id)
// Checkout.vue
cart.items[0].qty = 99`, lang: 'js' },
      right: { code: `// stores/cart.js holds the rules
actions: {
  add(id) { /* merge duplicates, respect stock */ },
  remove(id) { /* … */ },
  setQty(id, qty) { /* clamp 1..stock */ },
}`, lang: 'js' },
      explanation: 'Pinia allows direct writes, but scattering them means rules (stock limits, merging) are duplicated or skipped, and devtools shows anonymous mutations. Route meaningful changes through named actions.',
    },
  ],

  debugging: [
    {
      symptom: 'Persisted state is not restored after a reload.',
      cause: 'The store didn\'t opt in, the key changed, or the plugin was registered after the store was created.',
      fix: 'Check `options.persist`, the storage key in DevTools → Application, and register `pinia.use(plugin)` before any store is used.',
    },
    {
      symptom: 'The app crashes on startup for some users only.',
      cause: 'Corrupted or old-format data in their `localStorage` is parsed or patched without checks.',
      fix: 'Wrap hydration in `try/catch`, validate the shape, version the key and migrate old formats.',
    },
    {
      symptom: 'Store tests pass alone but fail when run together.',
      cause: 'Tests share one Pinia (or module-level state), so state leaks between them.',
      fix: 'Call `setActivePinia(createPinia())` in `beforeEach`, and avoid module-level mutable state outside stores.',
    },
    {
      symptom: 'In a component test, clicking a button doesn\'t change store state.',
      cause: '`createTestingPinia()` stubs actions by default.',
      fix: 'Assert that the action was called, or pass `stubActions: false` to run real actions.',
    },
    {
      symptom: 'A custom plugin never runs in a unit test.',
      cause: 'The Pinia was never installed in an app, so queued plugins weren\'t activated.',
      fix: 'Install it: `createApp({}).use(pinia)` before creating stores — or use `createTestingPinia({ plugins: [myPlugin] })`.',
    },
  ],

  bestPractices: [
    'Implement persistence once, as a plugin with an explicit per-store opt-in.',
    'Persist only what users expect to survive; omit derived, transient and secret values.',
    'Version storage keys, migrate old formats, and parse saved data defensively.',
    'Give every unit test a fresh Pinia and mock the API layer.',
    'Use `createTestingPinia` for component tests; decide deliberately whether actions are stubbed.',
    'Add `acceptHMRUpdate` to stores in Vite projects and use Vue DevTools to inspect state and actions.',
    'Prefer several small domain stores; keep per-instance UI state local and subtree context in provide/inject.',
  ],

  useCases: [
    'Remembering the cart, theme, language and dismissed banners across reloads.',
    'Saving long form drafts so a refresh doesn\'t lose work.',
    'Migrating saved data after the cart format changes in a new release.',
    'Unit-testing pricing rules, limits and async actions in isolation.',
    'Component tests that start from a given store state without real API calls.',
    'Deciding that a tabs widget uses provide/inject while the cart uses Pinia.',
  ],

  whenToUse: {
    use: [
      'Pinia when distant parts of the whole app share one copy of state and you want devtools, plugins, tests and SSR safety.',
      'A persistence plugin when several stores need saving with the same rules.',
      '`setActivePinia(createPinia())` for every store unit test.',
      '`createTestingPinia` when a component test should control store state or spy on actions.',
    ],
    avoid: [
      'Pinia for state that belongs to one widget instance — use local state or provide/inject.',
      'Persisting tokens, secrets, derived values or transient flags.',
      'Hydrating from `localStorage` during server rendering.',
      'One giant store for unrelated domains.',
    ],
  },

  comparison: {
    title: 'Pinia vs provide/inject vs composables',
    headers: ['', 'Pinia store', 'provide / inject', 'Composable'],
    rows: [
      ['Shares', 'one copy of state for the whole app', 'state for one subtree (one copy per provider)', 'logic; state is per caller unless declared at module level'],
      ['Typical use', 'cart, current user, preferences, notifications', 'form ↔ fields, tabs ↔ panels, theming a section', 'fetching, mouse position, debouncing, form helpers'],
      ['Several independent instances on one page', 'no (one store per id)', 'yes — each provider has its own', 'yes — each call has its own'],
      ['Devtools', 'stores panel + timeline', 'component inspector', 'component inspector'],
      ['Plugins / persistence', 'built-in plugin system', 'manual', 'manual'],
      ['Testing', '`setActivePinia(createPinia())`, `@pinia/testing`', 'mount with a provider', 'call it (inside a component if it uses lifecycle hooks)'],
      ['SSR safety', 'per-request Pinia', 'per app instance', 'safe unless it uses module-level state'],
    ],
    note: 'They combine well: a composable can use a store, and a store can use composables (setup stores). Review the whole topic in [why shared state](lesson:why-state-management).',
  },

  quiz: [
    {
      id: 'pinia-production-q1',
      type: 'mcq',
      prompt: 'Inside a Pinia plugin, where do you read a custom option like `persist: true`?',
      options: [
        { text: '`context.options` — the options object passed to `defineStore`' },
        { text: '`store.$state.persist`', why: 'Custom options are not state; they are not in `$state`.' },
        { text: '`pinia.state.value.persist`', why: 'That is the global state tree, keyed by store id.' },
        { text: 'It isn\'t possible — Pinia rejects unknown options', why: 'Pinia passes unknown options through to plugins precisely so they can read them.' },
      ],
      answer: 0,
      explanation: 'Plugins receive `{ pinia, app, store, options }`. For option stores `options` is the definition object; for setup stores it is the third argument of `defineStore`.',
    },
    {
      id: 'pinia-production-q2',
      type: 'output',
      prompt: 'A user adds 3 items, then reloads the page. What does the badge show after the reload?',
      code: {
        lang: 'js',
        code: `// main.js
const pinia = createPinia()
pinia.use(persistPlugin)        // saves stores that have persist: true
createApp(App).use(pinia).mount('#app')

// stores/cart.js
export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  getters: { count: (s) => s.items.length },
  actions: { add(i) { this.items.push(i) } },
})`,
      },
      options: [
        { text: '3', why: 'The plugin only saves stores that opt in with `persist: true` — this one doesn\'t.' },
        { text: '0' },
        { text: 'An error', why: 'Nothing fails; the store just starts from `state()` again.' },
        { text: 'undefined', why: '`count` is a getter over an empty array: 0.' },
      ],
      answer: 1,
      explanation: 'A reload creates a new Pinia, so the cart starts from `state()`. It was never saved because it didn\'t opt in.',
    },
    {
      id: 'pinia-production-q3',
      type: 'bug',
      prompt: 'The second test fails when run after the first, but passes alone. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'

beforeAll(() => {
  setActivePinia(createPinia())
})

it('adds an item', () => {
  const cart = useCartStore()
  cart.add('mug')
  expect(cart.count).toBe(1)
})

it('starts empty', () => {
  expect(useCartStore().count).toBe(0)
})`,
      },
      answerLine: 4,
      explanation: '`beforeAll` creates one Pinia for the whole file, so both tests share the same cart store. Use `beforeEach` to give each test a fresh Pinia.',
    },
    {
      id: 'pinia-production-q4',
      type: 'fill',
      prompt: 'Complete the plugin registration and the save hook.',
      code: {
        lang: 'js',
        code: `const pinia = createPinia()
pinia.___(({ store, options }) => {
  if (!options.persist) return
  store.___((mutation, state) => {
    localStorage.setItem(store.$id, JSON.stringify(state))
  }, { detached: true })
})`,
      },
      answer: [['use'], ['$subscribe']],
      explanation: '`pinia.use()` registers a plugin; `store.$subscribe()` runs after state changes.',
    },
    {
      id: 'pinia-production-q5',
      type: 'mcq',
      prompt: 'In a component test using `createTestingPinia()` with default options, the button calls `cart.clear()`. What happens to the cart\'s state?',
      options: [
        { text: 'Nothing — actions are stubbed by default; you can assert the spy was called' },
        { text: 'The cart is cleared, as in the real app', why: 'Only with `stubActions: false`.' },
        { text: 'The test throws because actions are disabled', why: 'Stubs are spies; calling them is fine.' },
        { text: 'The state resets to `initialState`', why: 'Stubbed actions don\'t touch state at all.' },
      ],
      answer: 0,
      explanation: '`createTestingPinia` stubs actions by default so component tests focus on the component. Pass `stubActions: false` to execute them.',
    },
    {
      id: 'pinia-production-q6',
      type: 'mcq',
      prompt: 'A page shows **three independent** tabs widgets. Each widget\'s `<TabList>` and `<TabPanel>` children must share *that widget\'s* active tab. Which tool fits best?',
      options: [
        { text: 'provide/inject from each `<Tabs>` component' },
        { text: 'One Pinia store `useTabsStore`', why: 'A store has one copy for the whole app; all three widgets would share one active tab.' },
        { text: 'A module-level `ref` in a composable', why: 'Module-level state is shared by every caller — the same problem as a store.' },
        { text: 'localStorage', why: 'Persistence is unrelated, and it is shared too.' },
      ],
      answer: 0,
      explanation: 'provide/inject scopes state to a subtree, and each provider instance has its own copy — exactly "per widget" state.',
    },
    {
      id: 'pinia-production-q7',
      type: 'short',
      prompt: 'Name three things you would NOT persist from a Pinia store, and say why for each.',
      answer: 'Auth tokens or secrets — localStorage is readable by any script on the page, so an XSS bug could steal them (prefer httpOnly cookies). Derived values like totals — they can be recomputed and would go stale. Transient state like loading flags, error messages or "just added" highlights — restoring them after a reload is meaningless or confusing.',
    },
  ],

  exercises: [
    {
      id: 'budget-store-tests',
      title: 'Make the budget store pass its unit tests',
      difficulty: 'intermediate',
      prompt: `
Your team wrote unit tests for \`stores/budget.js\` (an option store). They create a **fresh Pinia for every test**, like this:

\`\`\`js
${budgetTestsShown}
\`\`\`

Fix and finish the store so that:

- \`spent\` is the sum of amounts, \`remaining\` is \`limit - spent\`, \`isOverBudget\` is \`spent > limit\`;
- \`addExpense({ label, amount })\` converts \`amount\` to a number and **throws** an \`Error\` if it is not a positive, finite number;
- every expense gets a **unique** \`id\` (even when two are added in the same millisecond);
- \`removeExpense(id)\` removes that expense; \`setLimit(limit)\` changes the limit.

The small UI in \`App.vue\` already uses the store (\`.amount\`, \`.remaining\`, \`.over\`, \`.error\`).
`,
      files: {
        'main.js': plainMain,
        'stores/budget.js': budgetStarter,
        'App.vue': budgetApp,
      },
      hints: [
        'Getters that use other getters need `this`: `remaining() { return this.limit - this.spent }`.',
        'Validate first: `const value = Number(amount); if (!Number.isFinite(value) || value <= 0) throw new Error(\'…\')`.',
        '`Date.now()` can return the same number twice in a row. Keep a `nextId` counter in state and use `this.nextId++`.',
      ],
      solution: {
        explanation: 'Each rule now lives in exactly one place in the store, and the tests can check them without any UI. The duplicate-id bug is a classic: two expenses added in the same millisecond got the same `Date.now()` id, so removing one removed both. A counter in state is deterministic — and resets with each fresh Pinia, which keeps tests independent.',
        files: {
          'main.js': plainMain,
          'stores/budget.js': budgetSolution,
          'App.vue': budgetApp,
        },
      },
      tests: [
        {
          name: 'a fresh store starts empty with the default limit',
          code: `const { createPinia, setActivePinia } = requireModule('pinia')
const { useBudgetStore } = requireModule('stores/budget.js')
setActivePinia(createPinia())
const budget = useBudgetStore()
expect(budget.spent).toBe(0)
expect(budget.remaining).toBe(500)
expect(budget.isOverBudget).toBe(false)`,
        },
        {
          name: 'tracks spent and remaining',
          code: `const { createPinia, setActivePinia } = requireModule('pinia')
const { useBudgetStore } = requireModule('stores/budget.js')
setActivePinia(createPinia())
const budget = useBudgetStore()
budget.addExpense({ label: 'Rent', amount: 300 })
budget.addExpense({ label: 'Food', amount: '120' })
expect(budget.spent).toBe(420)
expect(budget.remaining).toBe(80)`,
        },
        {
          name: 'rejects invalid amounts',
          code: `const { createPinia, setActivePinia } = requireModule('pinia')
const { useBudgetStore } = requireModule('stores/budget.js')
setActivePinia(createPinia())
const budget = useBudgetStore()
expect(() => budget.addExpense({ label: 'Zero', amount: 0 })).toThrow()
expect(() => budget.addExpense({ label: 'Negative', amount: -5 })).toThrow()
expect(() => budget.addExpense({ label: 'Text', amount: 'abc' })).toThrow()
expect(budget.expenses).toHaveLength(0)`,
        },
        {
          name: 'isOverBudget and setLimit',
          code: `const { createPinia, setActivePinia } = requireModule('pinia')
const { useBudgetStore } = requireModule('stores/budget.js')
setActivePinia(createPinia())
const budget = useBudgetStore()
budget.addExpense({ label: 'Laptop', amount: 600 })
expect(budget.isOverBudget).toBe(true)
budget.setLimit(1000)
expect(budget.isOverBudget).toBe(false)
expect(budget.remaining).toBe(400)`,
        },
        {
          name: 'removeExpense removes exactly one expense',
          code: `const { createPinia, setActivePinia } = requireModule('pinia')
const { useBudgetStore } = requireModule('stores/budget.js')
setActivePinia(createPinia())
const budget = useBudgetStore()
budget.addExpense({ label: 'A', amount: 10 })
budget.addExpense({ label: 'B', amount: 20 })
budget.removeExpense(budget.expenses[0].id)
expect(budget.expenses.map((e) => e.label)).toEqual(['B'])`,
        },
        {
          name: 'the UI shows errors and the remaining amount',
          code: `await type('.label', 'Bike')
await type('.amount', '-3')
await submit('form')
expect(exists('.error')).toBe(true)
await type('.amount', '50')
await submit('form')
expect(text('.remaining')).toBe('Remaining: 450')`,
        },
      ],
    },
    {
      id: 'versioned-persistence',
      title: 'Migrate old saved carts',
      difficulty: 'advanced',
      prompt: `
The cart is hydrated in \`state()\` from \`loadCart()\` in \`storage.js\`, and saved by a \`$subscribe\` in \`App.vue\`.

The previous version of the app saved carts under \`'cart:v1'\` as an array of names: \`["Mug", "Plant", "Mug"]\`. The current format, under \`'cart:v2'\`, is \`[{ name: "Mug", qty: 2 }, { name: "Plant", qty: 1 }]\`.

Update \`loadCart()\` so that:

- valid \`'cart:v2'\` data is returned as-is;
- otherwise, \`'cart:v1'\` data is **migrated** (duplicates counted, first-seen order kept), **saved** under \`'cart:v2'\`, and the \`'cart:v1'\` key is **removed**;
- corrupted JSON under either key never throws — it is removed and treated as missing;
- with nothing usable, it returns \`[]\`.

(Storage starts empty for every test.)
`,
      files: {
        'main.js': plainMain,
        'storage.js': storageStarter,
        'stores/cart.js': migrateCartStore,
        'App.vue': migrateApp,
      },
      hints: [
        'Write a small `readJson(key)` helper with `try/catch` that returns `null` (and removes the key) when parsing fails.',
        'Migration is a loop: find an existing line by name and `qty++`, or push `{ name, qty: 1 }`.',
        'After migrating: `saveCart(migrated)` then `localStorage.removeItem(\'cart:v1\')`, and return the migrated lines.',
      ],
      solution: {
        explanation: 'Persisted data outlives the code that wrote it, so loading must handle every shape that might still be on users\' devices. Migrating once and deleting the old key means the slow path runs only the first time. Defensive parsing turns corrupted data into "nothing saved" instead of a crash on startup.',
        files: {
          'main.js': plainMain,
          'storage.js': storageSolution,
          'stores/cart.js': migrateCartStore,
          'App.vue': migrateApp,
        },
      },
      tests: [
        {
          name: 'new visitors start with an empty cart',
          code: `const { loadCart } = requireModule('storage.js')
expect(loadCart()).toEqual([])`,
        },
        {
          name: 'v1 data is migrated when the store is created',
          code: `const { createPinia, setActivePinia } = requireModule('pinia')
const { useCartStore } = requireModule('stores/cart.js')
localStorage.setItem('cart:v1', JSON.stringify(['Mug', 'Plant', 'Mug']))
setActivePinia(createPinia()) // like a fresh page load
const cart = useCartStore()
expect(cart.items).toEqual([{ name: 'Mug', qty: 2 }, { name: 'Plant', qty: 1 }])
expect(cart.count).toBe(3)`,
        },
        {
          name: 'migration saves v2 and removes v1',
          code: `const { loadCart } = requireModule('storage.js')
localStorage.setItem('cart:v1', JSON.stringify(['Lamp']))
loadCart()
expect(localStorage.getItem('cart:v1')).toBeNull()
expect(JSON.parse(localStorage.getItem('cart:v2'))).toEqual([{ name: 'Lamp', qty: 1 }])`,
        },
        {
          name: 'existing v2 data wins',
          code: `const { loadCart } = requireModule('storage.js')
localStorage.setItem('cart:v2', JSON.stringify([{ name: 'Mug', qty: 5 }]))
localStorage.setItem('cart:v1', JSON.stringify(['Plant']))
expect(loadCart()).toEqual([{ name: 'Mug', qty: 5 }])`,
        },
        {
          name: 'corrupted data never throws',
          code: `const { loadCart } = requireModule('storage.js')
localStorage.setItem('cart:v2', '{oops')
localStorage.setItem('cart:v1', 'also broken')
let result
expect(() => { result = loadCart() }).not.toThrow()
expect(result).toEqual([])`,
        },
        {
          name: 'changes are saved in the v2 format',
          code: `await click('.add-mug')
await click('.add-mug')
await flush()
expect(JSON.parse(localStorage.getItem('cart:v2'))).toEqual([{ name: 'Mug', qty: 2 }])`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'pinia-production-vs-provide-inject',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'When would you use Pinia, provide/inject, or a composable to share state?',
      answer: 'Pinia for app-wide state with one shared copy — cart, current user, preferences — where devtools, plugins, testing helpers and SSR safety matter. provide/inject for state scoped to a subtree where each instance needs its own copy — a form and its fields, a tabs widget and its panels. A composable to reuse logic; each caller gets its own state unless the state is deliberately declared at module level, which turns it into an ad-hoc global store.',
      explanation: 'The deciding questions: how far apart are the readers, and how many independent copies should exist?',
      whyAsked: 'A classic architecture question; strong answers show judgement rather than a favourite tool.',
      mistakes: ['"Always Pinia" or "Pinia is unnecessary with composables".', 'Not mentioning per-instance state for provide/inject.', 'Ignoring SSR implications of module-level state.'],
      followUps: ['Can a composable use a store?', 'How would you build a form library\'s field registration?'],
      modelAnswer: 'I start from who needs the state and how many copies should exist. If distant parts of the whole app share one copy — the cart, the current user — I use Pinia, which also gives me devtools, plugins, test helpers and SSR safety. If a subtree shares context and each instance needs its own copy — like each form and its fields, or each tabs widget — I use provide/inject from the parent component. Composables are for reusable logic; each call gets its own state, and I avoid module-level state in them because it silently becomes a global store. They combine well: composables can use stores.',
    },
    {
      id: 'pinia-production-persist-what',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Product wants "everything to survive a refresh". How do you design persistence for a Pinia app?',
      answer: 'Implement it once as a plugin with per-store opt-in, and persist only what users expect to survive: cart, preferences, drafts. Exclude derived values, transient state (loading, errors) and secrets — keep the session in an httpOnly cookie rather than a token in localStorage. Version the storage keys, migrate old formats, parse defensively, debounce writes for large state, clear user-specific data on logout, and with SSR hydrate from storage on the client only.',
      explanation: 'Persistence is a product and security decision, not a checkbox.',
      whyAsked: 'Tests practical production judgement: security, migrations and UX.',
      mistakes: ['Persisting the entire Pinia state blindly.', 'Storing tokens in localStorage without discussing XSS.', 'No plan for format changes.'],
      followUps: ['How do you sync state between tabs?', 'What happens when localStorage is full or unavailable?'],
      modelAnswer: 'I would push back gently on "everything" and agree a list: cart, preferences and long drafts. Technically I would write a small Pinia plugin that stores opt into, which hydrates on store creation and saves with a detached `$subscribe`, debounced if the state is large. I would leave out derived and transient state, and keep auth in httpOnly cookies instead of localStorage tokens. Keys get versions so I can migrate old data, parsing is wrapped in try/catch, and logout clears user-specific stores.',
    },
    {
      id: 'pinia-production-testing',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'How do you test a Pinia store, and how do you test a component that uses one?',
      answer: 'Store unit tests: `beforeEach(() => setActivePinia(createPinia()))` for fresh state, mock the API module, then call actions and assert on state and getters (awaiting async actions). Component tests: mount with `createTestingPinia()` from `@pinia/testing`, optionally with `initialState`; actions are stubbed by default so you assert they were called, or pass `stubActions: false` to run them. Testing plugins requires installing the Pinia into an app.',
      explanation: 'Isolate the store\'s logic in unit tests; isolate the component\'s behaviour in component tests.',
      code: {
        lang: 'js',
        code: `beforeEach(() => setActivePinia(createPinia()))

it('applies the member discount', () => {
  const cart = useCartStore()
  const user = useUserStore()
  cart.addItem(3)          // 20
  user.isMember = true
  expect(cart.total).toBe(18)
})`,
      },
      whyAsked: 'Testing stores is a routine task; interviewers check you know the standard setup and the stubbing default.',
      mistakes: ['Sharing one Pinia across tests.', 'Not knowing `createTestingPinia` stubs actions by default.', 'Hitting the real network in unit tests.'],
      followUps: ['How do you override a getter in a component test?', 'How would you test a store that uses another store?'],
      modelAnswer: 'For the store itself I write plain unit tests: a fresh Pinia in `beforeEach` with `setActivePinia(createPinia())`, the API module mocked, then I call actions and assert on state and getters, awaiting async ones. For components I mount with `createTestingPinia` and set `initialState`; actions are spies by default, so I assert the component called the right action — or set `stubActions: false` for a more integrated test. Stores that use other stores work naturally because both come from the same fresh Pinia.',
    },
    {
      id: 'pinia-production-ssr',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'What changes for Pinia state when an app is server-side rendered?',
      answer: 'Each request must get its own Pinia (created inside the per-request app factory), otherwise users\' state leaks between requests. After rendering, the server serialises `pinia.state.value` into the HTML using an escaping serializer; the client sets `pinia.state.value` from it before stores are used, so stores hydrate without refetching. Code must not touch browser-only APIs like localStorage during server rendering, and stores must not be used at module top level. Nuxt\'s Pinia module automates the transfer.',
      explanation: 'Server modules are shared by all requests; Pinia instances must not be.',
      whyAsked: 'Senior-level understanding of where state lives in SSR and why module singletons are dangerous.',
      mistakes: ['Creating one Pinia at module level in the server entry.', 'Serialising state with plain JSON.stringify into a script tag without escaping.', 'Reading localStorage during SSR.'],
      followUps: ['What is a hydration mismatch?', 'Why might `skipHydrate` be needed?'],
      modelAnswer: 'On the server, one Node process serves every user, so anything at module level is shared. I create the app and a new Pinia inside a per-request factory. After rendering I serialise `pinia.state.value` into the page with an escaping serializer like devalue, and on the client I assign it back to `pinia.state.value` before any store is used, so the stores hydrate with the server data. Browser-only work such as localStorage hydration runs only on the client. In Nuxt the Pinia module handles the transfer.',
    },
    {
      id: 'pinia-production-plugins',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a Pinia plugin, what does it receive, and what can it do?',
      answer: 'A function registered with `pinia.use()` that Pinia calls once for every store it creates (after the Pinia is installed in an app). It receives `{ pinia, app, store, options }`. It can add properties (by returning an object or assigning to the store), add state, read custom `defineStore` options, subscribe with `$subscribe`/`$onAction`, wrap or replace methods like `$reset`, and integrate with devtools. Typical uses: persistence, logging, error reporting, resetting, router access.',
      explanation: 'Plugins are Pinia\'s extension point for cross-cutting behaviour.',
      whyAsked: 'Probes depth beyond basic store usage.',
      mistakes: ['Thinking plugins run once globally rather than per store.', 'Not knowing custom options reach `context.options`.', 'Expecting plugins to run before the Pinia is installed.'],
      followUps: ['How would you add a `$resetAll()` across stores?', 'How do you test a plugin?'],
      modelAnswer: 'A Pinia plugin is a function I register with `pinia.use()`. Pinia calls it each time it creates a store, passing the pinia, the app, the store and the options the store was defined with. Inside I can add properties, subscribe to state or actions, read custom options like `persist`, or replace methods — for example giving setup stores a `$reset`. I use plugins for persistence, logging and error reporting so stores stay focused on business logic.',
    },
    {
      id: 'pinia-production-god-store',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'You inherit a 2,000-line "main" store holding auth, cart, catalog filters, modal flags and API caches. How do you refactor it?',
      answer: 'Split by domain into small stores (auth, cart, catalog), move per-instance UI flags back into components, move filters/pagination into the URL, and consider a server-state layer for API caches. Replace stored derived values with getters, route mutations through actions, and add store unit tests before and during the split. Migrate incrementally: create the new store, re-export or proxy from the old one temporarily, update components feature by feature, then delete the old code.',
      explanation: 'Each piece of state should live where its readers are.',
      whyAsked: 'Real-world refactoring judgement — common in senior interviews.',
      mistakes: ['A big-bang rewrite with no tests.', 'Splitting by technical layer ("getters store") instead of domain.', 'Keeping modal flags global.'],
      followUps: ['How do you keep persisted data working after the split?', 'How do you avoid circular dependencies between the new stores?'],
      modelAnswer: 'First I write tests around the current behaviour. Then I classify the state: auth, cart and catalog become separate domain stores; modal and hover flags go back into their components; filters and page numbers move into the URL; and API caches either become actions with clear loading states or move to a server-state library. Derived values become getters. I migrate incrementally — new store, temporary bridge from the old one, component by component — and watch for dependency direction between the new stores.',
    },
    {
      id: 'pinia-production-coding-reset-plugin',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Both stores are **setup stores**, so `$reset()` throws. Write `resetPlugin` in `plugins/reset.js` that gives **every** store a working `$reset()` restoring the state it had when it was created. The Log out button calls `cart.$reset()` and `prefs.$reset()`. Assume state is JSON-serialisable.',
      starter: {
        files: {
          'main.js': resetMain,
          'plugins/reset.js': resetPluginStarter,
          'stores/cart.js': resetCart,
          'stores/prefs.js': resetPrefs,
          'App.vue': resetApp,
        },
      },
      tests: [
        {
          name: 'log out resets every store',
          code: `await click('.add')
await click('.add')
await click('.dark')
expect(text('.count')).toBe('2')
expect(text('.theme')).toBe('dark')
await click('.logout')
expect(text('.count')).toBe('0')
expect(text('.theme')).toBe('light')`,
        },
        {
          name: 'resetting twice still restores a clean state',
          code: `const { useCartStore } = requireModule('stores/cart.js')
const cart = useCartStore()
cart.add('A')
cart.$reset()
cart.add('B')
cart.add('C')
cart.$reset()
expect(cart.items).toEqual([])`,
        },
      ],
      hints: [
        'A plugin receives `{ store }`. Right when it runs, `store.$state` is the initial state — snapshot it with `JSON.stringify`.',
        'Assign `store.$reset = () => { … }` and apply a **fresh** `JSON.parse` of the snapshot with `store.$patch((state) => Object.assign(state, fresh))`. Reusing one parsed object would let later pushes mutate your snapshot.',
      ],
      answer: 'Snapshot `JSON.stringify(store.$state)` when the plugin runs; define `store.$reset` to parse a fresh copy and `$patch` it into the state.',
      solution: {
        files: {
          'main.js': resetMain,
          'plugins/reset.js': resetPluginSolution,
          'stores/cart.js': resetCart,
          'stores/prefs.js': resetPrefs,
          'App.vue': resetApp,
        },
      },
      explanation: 'The plugin runs once per store, right after creation, so `$state` is still the initial state. Storing it as a string and parsing a fresh copy on every reset guarantees the snapshot can never be mutated by later changes (the second test catches the shared-array bug). Simplified: JSON loses Dates, Maps and class instances.',
      whyAsked: 'Combines plugin knowledge, the setup-store `$reset` gap and a subtle aliasing bug.',
      mistakes: ['Saving `store.$state` by reference — it changes along with the store.', 'Parsing the snapshot once and reusing the same object.', 'Replacing `store.$state` with a new reactive object instead of patching.'],
      followUps: ['How would you support Dates or Maps?', 'How would you add a `$resetAll()` on the pinia instance?'],
      modelAnswer: 'A plugin runs once for each store right after it is created, so I snapshot the state there as a JSON string. Then I assign a `$reset` method on the store that parses a fresh copy and applies it with a function `$patch`, which keeps the reactive object and notifies subscribers once. Parsing fresh each time matters — reusing one object would let later pushes mutate the snapshot. It is simplified to JSON-safe state; for Dates or Maps I would use a custom clone or let each store declare an initial-state function.',
    },
  ],

  takeaways: [
    'Pinia state lives in memory; persistence is a deliberate, per-store choice — best implemented once as a plugin.',
    'Persist what users expect to survive; never secrets, derived values or transient flags.',
    'Treat saved data as untrusted: parse safely, validate, version keys and migrate old formats.',
    'Unit-test stores with a fresh Pinia per test; use `createTestingPinia` (actions stubbed by default) for components.',
    'Use Vue DevTools and `acceptHMRUpdate` in development; with SSR, one Pinia per request.',
    'Pinia for app-wide shared state, provide/inject for per-subtree state, composables for reusable logic.',
  ],
}
