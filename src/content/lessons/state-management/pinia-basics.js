// Lesson: Pinia basics — state, getters, actions

const mainJs = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia()) // install Pinia once, before mounting
app.mount('#app')`

const cartStore = `import { defineStore } from 'pinia'

// Convention: name it useXxxStore. The id ('cart') must be unique.
export const useCartStore = defineStore('cart', {
  // STATE — a function that returns the starting data
  state: () => ({
    items: [], // each line: { id, name, price, qty }
  }),

  // GETTERS — derived values, cached like computed()
  getters: {
    itemCount: (state) => state.items.reduce((n, line) => n + line.qty, 0),
    subtotal: (state) =>
      state.items.reduce((sum, line) => sum + line.price * line.qty, 0),
    // a regular function can reach other getters through \`this\`
    isEmpty() {
      return this.itemCount === 0
    },
  },

  // ACTIONS — the named ways to change state
  actions: {
    addItem(product) {
      const line = this.items.find((l) => l.id === product.id)
      if (line) line.qty++
      else this.items.push({ id: product.id, name: product.name, price: product.price, qty: 1 })
    },
    clear() {
      this.items = []
    },
  },
})`

const cartSetupStore = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// The same store written as a SETUP store
export const useCartStore = defineStore('cart', () => {
  // ref() → state
  const items = ref([])

  // computed() → getters
  const itemCount = computed(() => items.value.reduce((n, l) => n + l.qty, 0))
  const subtotal = computed(() => items.value.reduce((s, l) => s + l.price * l.qty, 0))
  const isEmpty = computed(() => itemCount.value === 0)

  // function → actions
  function addItem(product) {
    const line = items.value.find((l) => l.id === product.id)
    if (line) line.qty++
    else items.value.push({ id: product.id, name: product.name, price: product.price, qty: 1 })
  }

  function clear() {
    items.value = []
  }

  // Return ALL state, plus the getters and actions you want to expose
  return { items, itemCount, subtotal, isEmpty, addItem, clear }
})`

const appVue = `<script setup>
import CartBadge from './CartBadge.vue'
import ProductList from './ProductList.vue'
import CartSummary from './CartSummary.vue'
import { useCartStore } from './stores/cart.js'

// App can use the store too — it is the same instance everywhere.
const cart = useCartStore()
</script>

<template>
  <header class="top">
    <strong>Corner Shop</strong>
    <CartBadge />
  </header>
  <main class="layout">
    <ProductList />
    <CartSummary />
  </main>
  <footer class="foot">{{ cart.items.length }} different product(s) in the cart</footer>
</template>

<style>
.top { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 2px solid #222; }
.layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 12px; }
.foot { padding: 0 12px; color: #666; }
button { margin-left: 6px; }
</style>`

const productListVue = `<script setup>
import { useCartStore } from './stores/cart.js'

const cart = useCartStore()

const products = [
  { id: 1, name: 'Coffee mug', price: 12, stock: 3 },
  { id: 2, name: 'Notebook', price: 8, stock: 10 },
  { id: 3, name: 'Desk plant', price: 20, stock: 5 },
]
</script>

<template>
  <section>
    <h3>Products</h3>
    <ul>
      <li v-for="p in products" :key="p.id" class="product">
        {{ p.name }} — \${{ p.price }} <small>({{ p.stock }} in stock)</small>
        <button class="add" @click="cart.addItem(p)">Add</button>
      </li>
    </ul>
  </section>
</template>`

const badgeVue = `<script setup>
import { useCartStore } from './stores/cart.js'
const cart = useCartStore()
</script>

<template>
  <span class="badge">🛒 <b class="count">{{ cart.itemCount }}</b></span>
</template>`

const summaryVue = `<script setup>
import { useCartStore } from './stores/cart.js'
const cart = useCartStore()
</script>

<template>
  <section class="summary">
    <h3>Cart</h3>
    <p v-if="cart.isEmpty" class="empty">Your cart is empty.</p>
    <ul v-else>
      <li v-for="line in cart.items" :key="line.id" class="line">
        {{ line.name }} × {{ line.qty }}
      </li>
    </ul>
    <p class="subtotal">Subtotal: \${{ cart.subtotal }}</p>
    <button class="clear" :disabled="cart.isEmpty" @click="cart.clear()">Empty cart</button>
  </section>
</template>`

const playgroundFiles = {
  'main.js': mainJs,
  'stores/cart.js': cartStore,
  'App.vue': appVue,
  'CartBadge.vue': badgeVue,
  'ProductList.vue': productListVue,
  'CartSummary.vue': summaryVue,
}

// ---- exercise: todo store
const todoMain = mainJs

const todoApp = `<script setup>
import TodoInput from './TodoInput.vue'
import TodoList from './TodoList.vue'
import TodoFooter from './TodoFooter.vue'
</script>

<template>
  <h2>Todos</h2>
  <TodoInput />
  <TodoList />
  <TodoFooter />
</template>`

const todoInput = `<script setup>
import { ref } from 'vue'
import { useTodoStore } from './stores/todos.js'

const store = useTodoStore()
const text = ref('')

function submit() {
  store.add(text.value)
  text.value = ''
}
</script>

<template>
  <form @submit.prevent="submit">
    <input class="new-todo" v-model="text" placeholder="What needs doing?" />
    <button>Add</button>
  </form>
</template>`

const todoList = `<script setup>
import { useTodoStore } from './stores/todos.js'
const store = useTodoStore()
</script>

<template>
  <ul>
    <li v-for="todo in store.todos" :key="todo.id" class="todo">
      <label>
        <input type="checkbox" class="toggle" :checked="todo.done" @change="store.toggle(todo.id)" />
        <span :class="{ done: todo.done }">{{ todo.text }}</span>
      </label>
    </li>
  </ul>
</template>

<style>
.done { text-decoration: line-through; color: #888; }
</style>`

const todoFooter = `<script setup>
import { useTodoStore } from './stores/todos.js'
const store = useTodoStore()
</script>

<template>
  <footer>
    <span class="remaining">{{ store.remaining }} left</span>
    <button class="clear-done" @click="store.clearDone()">Clear done</button>
  </footer>
</template>`

const todoStoreStarter = `import { defineStore } from 'pinia'

export const useTodoStore = defineStore('todos', {
  state: () => ({
    todos: [
      { id: 1, text: 'Learn Pinia', done: false },
      { id: 2, text: 'Install Vue', done: true },
    ],
  }),

  getters: {
    // TODO: remaining — how many todos are NOT done
  },

  actions: {
    // TODO: add(text), toggle(id), clearDone()
  },
})`

const todoStoreSolution = `import { defineStore } from 'pinia'

export const useTodoStore = defineStore('todos', {
  state: () => ({
    todos: [
      { id: 1, text: 'Learn Pinia', done: false },
      { id: 2, text: 'Install Vue', done: true },
    ],
  }),

  getters: {
    remaining: (state) => state.todos.filter((t) => !t.done).length,
  },

  actions: {
    add(text) {
      const clean = text.trim()
      if (!clean) return
      const nextId = Math.max(0, ...this.todos.map((t) => t.id)) + 1
      this.todos.push({ id: nextId, text: clean, done: false })
    },
    toggle(id) {
      const todo = this.todos.find((t) => t.id === id)
      if (todo) todo.done = !todo.done
    },
    clearDone() {
      this.todos = this.todos.filter((t) => !t.done)
    },
  },
})`

// ---- exercise: playlist setup store
const playlistApp = `<script setup>
import NowPlaying from './NowPlaying.vue'
import Controls from './Controls.vue'
import Stats from './Stats.vue'
</script>

<template>
  <NowPlaying />
  <Controls />
  <Stats />
</template>`

const nowPlaying = `<script setup>
import { usePlaylistStore } from './stores/playlist.js'
const playlist = usePlaylistStore()
</script>

<template>
  <p class="now-playing">▶ {{ playlist.current?.title }} — {{ playlist.current?.artist }}</p>
</template>`

const controls = `<script setup>
import { usePlaylistStore } from './stores/playlist.js'
const playlist = usePlaylistStore()
</script>

<template>
  <button class="prev" @click="playlist.previous()">⏮ Previous</button>
  <button class="next" @click="playlist.next()">Next ⏭</button>
</template>`

const stats = `<script setup>
import { usePlaylistStore } from './stores/playlist.js'
const playlist = usePlaylistStore()
</script>

<template>
  <p class="total">{{ playlist.totalMinutes }} minutes in total</p>
  <p class="artist-count">{{ playlist.byArtist?.('The Commuters').length }} songs by The Commuters</p>
</template>`

const playlistStarter = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlaylistStore = defineStore('playlist', () => {
  const songs = ref([
    { id: 1, title: 'Morning Run', artist: 'The Commuters', seconds: 240 },
    { id: 2, title: 'Paper Boats', artist: 'Lumen', seconds: 200 },
    { id: 3, title: 'Last Train Home', artist: 'The Commuters', seconds: 180 },
  ])

  // TODO: state   → currentIndex (starts at 0)
  // TODO: getters → current, totalMinutes, byArtist(artist)
  // TODO: actions → next(), previous() (both wrap around)

  return { songs }
})`

const playlistSolution = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlaylistStore = defineStore('playlist', () => {
  // state
  const songs = ref([
    { id: 1, title: 'Morning Run', artist: 'The Commuters', seconds: 240 },
    { id: 2, title: 'Paper Boats', artist: 'Lumen', seconds: 200 },
    { id: 3, title: 'Last Train Home', artist: 'The Commuters', seconds: 180 },
  ])
  const currentIndex = ref(0)

  // getters
  const current = computed(() => songs.value[currentIndex.value])
  const totalMinutes = computed(() =>
    Math.round(songs.value.reduce((sum, s) => sum + s.seconds, 0) / 60),
  )
  // a getter that takes an argument returns a function (not cached per argument)
  const byArtist = computed(() => (artist) => songs.value.filter((s) => s.artist === artist))

  // actions
  function next() {
    currentIndex.value = (currentIndex.value + 1) % songs.value.length
  }
  function previous() {
    currentIndex.value = (currentIndex.value - 1 + songs.value.length) % songs.value.length
  }

  // return every piece of state, or Pinia (and devtools, SSR, plugins) can't see it
  return { songs, currentIndex, current, totalMinutes, byArtist, next, previous }
})`

// ---- interview coding: wishlist
const wishApp = `<script setup>
import WishBadge from './WishBadge.vue'
import ProductGrid from './ProductGrid.vue'
</script>

<template>
  <header>Wishlist: <WishBadge /></header>
  <ProductGrid />
</template>`

const wishGridStarter = `<script setup>
const products = [
  { id: 1, name: 'Headphones' },
  { id: 2, name: 'Backpack' },
  { id: 3, name: 'Water bottle' },
]
</script>

<template>
  <ul>
    <li v-for="p in products" :key="p.id" class="product">
      {{ p.name }}
      <button class="heart" :aria-pressed="false">♡</button>
    </li>
  </ul>
</template>`

const wishBadgeStarter = `<template>
  <span class="wish-count">0</span>
</template>`

const wishStoreStarter = `import { defineStore } from 'pinia'

// TODO: export const useWishlistStore = defineStore('wishlist', …)
// state: ids (array of product ids)
// getters: count
// actions: toggle(id)
// plus has(id) → true/false
`

const wishStoreSolution = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref([])
  const count = computed(() => ids.value.length)
  const has = computed(() => (id) => ids.value.includes(id))

  function toggle(id) {
    const i = ids.value.indexOf(id)
    if (i === -1) ids.value.push(id)
    else ids.value.splice(i, 1)
  }

  return { ids, count, has, toggle }
})`

const wishGridSolution = `<script setup>
import { useWishlistStore } from './stores/wishlist.js'

const wishlist = useWishlistStore()
const products = [
  { id: 1, name: 'Headphones' },
  { id: 2, name: 'Backpack' },
  { id: 3, name: 'Water bottle' },
]
</script>

<template>
  <ul>
    <li v-for="p in products" :key="p.id" class="product">
      {{ p.name }}
      <button class="heart" :aria-pressed="wishlist.has(p.id)" @click="wishlist.toggle(p.id)">
        {{ wishlist.has(p.id) ? '♥' : '♡' }}
      </button>
    </li>
  </ul>
</template>`

const wishBadgeSolution = `<script setup>
import { useWishlistStore } from './stores/wishlist.js'
const wishlist = useWishlistStore()
</script>

<template>
  <span class="wish-count">{{ wishlist.count }}</span>
</template>`

export default {
  id: 'pinia-basics',
  title: 'Pinia basics: state, getters, actions',
  summary: 'Install Pinia, define a store with state, getters and actions — as an option store or a setup store — and share it across components.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['why-state-management', 'computed', 'create-app-mount'],
  related: ['using-stores', 'pinia-async-patterns', 'composables-intro', 'options-api'],
  tags: ['pinia', 'store', 'defineStore', 'createPinia', 'state', 'getters', 'actions', 'option store', 'setup store', 'vuex'],
  apis: [
    { name: 'createPinia()', summary: 'Creates the Pinia instance (the container for every store). Install it with `app.use(pinia)`.' },
    { name: 'defineStore(id, options | setup)', summary: 'Defines a store and returns a `useXxxStore()` function that creates or returns the store instance.' },
    { name: 'state', summary: 'Option stores: a function returning the initial state. Setup stores: every returned `ref()` / `reactive()`.' },
    { name: 'getters', summary: 'Derived values, cached like `computed()`. Setup stores: every returned `computed()`.' },
    { name: 'actions', summary: 'Methods that change state; may be synchronous or `async`. Setup stores: every returned function.' },
  ],
  docs: [
    { label: 'Pinia — Getting Started', url: 'https://pinia.vuejs.org/getting-started.html' },
    { label: 'Pinia — Defining a Store (option vs setup stores)', url: 'https://pinia.vuejs.org/core-concepts/' },
    { label: 'Pinia — State', url: 'https://pinia.vuejs.org/core-concepts/state.html' },
    { label: 'Pinia — Getters', url: 'https://pinia.vuejs.org/core-concepts/getters.html' },
    { label: 'Pinia — Actions', url: 'https://pinia.vuejs.org/core-concepts/actions.html' },
  ],

  intro: `
**Pinia** is the officially recommended state management library for Vue. A *store* is an object that holds shared data and the functions that change it, living outside your component tree so any component can use it.

Every store has three parts:

- **state** — the data itself (the cart's items);
- **getters** — values computed from the state (the item count, the subtotal), cached like \`computed()\`;
- **actions** — functions that change the state (\`addItem\`, \`clear\`).

You will build a shop where a header badge, a product list and a cart summary — three components that never talk to each other — all stay in sync through one store.
`,

  why: `
In [the previous lesson](lesson:why-state-management) you built a "store" by hand: a \`reactive()\` object in a module. It worked, but:

- nothing stops any file from changing the state in any way;
- there is no devtools view of what changed, when, and why;
- there is no hook for persistence or logging;
- tests have no easy way to start with a fresh state;
- with server-side rendering, the singleton leaks between users.

Pinia keeps the same simple idea — one reactive object many components read — and gives it a **standard shape** (state, getters, actions), devtools integration, plugins, testing helpers and per-app (and per-request) isolation. Its API is deliberately small: if you know \`ref\`, \`computed\` and functions, you already know most of Pinia.
`,

  eli15: `
Think of a school's lost-and-found office.

- The **shelves** are the *state*: the actual things being kept.
- The **sign on the door** ("7 items waiting, 2 umbrellas") is a *getter*: it is worked out from what is on the shelves, and it updates whenever the shelves change.
- The **office staff** are the *actions*: you don't climb over the counter and grab things — you ask the staff to "add this" or "hand that back", and they follow the rules.

There is one office for the whole school, so every class sees the same shelves. That office is a **Pinia store**. \`createPinia()\` builds the school's office building; \`defineStore()\` sets up one office (cart, user, settings…); \`useCartStore()\` is walking up to the counter.
`,

  analogy: {
    title: 'The lost-and-found office',
    body: `
A store has a fixed layout. The shelves hold the real items. The sign on the door summarises them and is always up to date. The staff are the only ones who move things, and they follow the office rules ("no more than 3 umbrellas per person").

Every class in the school sends people to the same office, so everyone sees the same shelves — and if something goes missing, you ask the staff, who keep a log.
`,
    mapping: [
      ['the shelves', '`state` — the store\'s data'],
      ['the sign on the door', '`getters` — derived, cached values'],
      ['the staff and their rules', '`actions` — the functions that change state'],
      ['the office building', 'the Pinia instance from `createPinia()`'],
      ['walking up to the counter', 'calling `useCartStore()` in a component'],
      ['the staff log book', 'Vue DevTools\' Pinia timeline'],
    ],
  },

  visual: {
    type: 'pinia',
    props: { preset: 'cart' },
    title: 'One store, many components',
    caption: 'Run an action from any component and watch which components re-render: only the ones that read the state or getters that changed.',
    alt: 'A cart store in the middle with state, getters and actions. Three components — a header badge, a product list and a cart summary — are connected to it. Running addItem updates the items state; the badge and summary that read it re-render, while a component that does not read it stays untouched.',
  },

  animation: {
    type: 'component-flow',
    props: { mode: 'pinia' },
    title: 'Data flow with a store',
    caption: 'Components do not pass the cart to each other. They read from the store and call its actions; the store notifies every reader.',
    alt: 'An animated component tree with a store beside it. A child component calls an action on the store; the store\'s state changes and the update flows to every component that reads it, regardless of where it sits in the tree.',
  },

  syntax: [
    `
#### 1. Install and register Pinia (once per app)
`,
    {
      code: `npm install pinia`,
      lang: 'bash',
      title: 'terminal',
      static: true,
    },
    {
      code: `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')`,
      lang: 'js',
      title: 'main.js',
    },
    `
Projects scaffolded with \`npm create vue@latest\` can add Pinia for you — the setup wizard asks.

#### 2. Define a store — Option store

Pass an id and an object with \`state\`, \`getters\` and \`actions\`. It reads like the [Options API](lesson:options-api):
`,
    {
      code: `// src/stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0, step: 1 }),
  getters: {
    double: (state) => state.count * 2,   // state is passed in
    quadruple() { return this.double * 2 }, // other getters via \`this\`
  },
  actions: {
    increment() { this.count += this.step }, // state via \`this\`
  },
})`,
      lang: 'js',
      title: 'option store',
    },
    `
#### 3. Define a store — Setup store

Pass an id and a function, like \`<script setup>\`. **\`ref\`/\`reactive\` become state, \`computed\` becomes getters, functions become actions.** Return everything:
`,
    {
      code: `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const step = ref(1)
  const double = computed(() => count.value * 2)
  function increment() { count.value += step.value }

  return { count, step, double, increment }
})`,
      lang: 'js',
      title: 'setup store',
    },
    `
#### 4. Use it in any component
`,
    {
      code: `<script setup>
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <p>{{ counter.count }} × 2 = {{ counter.double }}</p>
  <button @click="counter.increment()">+{{ counter.step }}</button>
</template>`,
      lang: 'vue',
      title: 'Counter.vue',
    },
    `
**The rules:**

1. The **id** (first argument) must be unique across the app — devtools and plugins use it. Name the function \`use\` + id + \`Store\`.
2. In option stores \`state\` is a **function** that returns a fresh object, so every Pinia instance (each test, each server request) starts clean.
3. The store is a \`reactive\` object: write \`counter.count\`, never \`counter.count.value\` — refs are unwrapped.
4. Don't destructure the store directly (\`const { count } = counter\` loses reactivity). [Using stores](lesson:using-stores) shows \`storeToRefs()\`.
5. Option-store getters and actions that use \`this\` must be regular functions or methods, **not arrow functions**.
6. Setup stores must **return every piece of state**. Unreturned refs are invisible to devtools, SSR and plugins.
7. Actions can be \`async\` and can call other actions or other stores — see [async patterns](lesson:pinia-async-patterns).
`,
    {
      callout: 'version',
      title: 'Pinia and Vue versions',
      text: 'Current Pinia releases support Vue 3 only (Pinia 2 also supported Vue 2). `defineStore`, `createPinia` and `storeToRefs` have kept the same shape for years. Very old code may pass the id inside the options object (`defineStore({ id: \'cart\', … })`); current Pinia expects the id as the first argument.',
    },
    {
      callout: 'note',
      title: 'Vuex',
      text: 'Vuex was Vue\'s previous official store. Its docs now point new projects to Pinia, and Vuex is in maintenance mode. Pinia drops Vuex\'s *mutations*: actions change state directly, sync or async.',
    },
  ],

  walkthrough: {
    title: 'stores/cart.js',
    lang: 'js',
    code: cartStore,
    intro: 'The store behind the playground. Every component in the shop reads and changes the cart through this one file.',
    steps: [
      { lines: [1], text: '`defineStore` comes from `pinia`, not from `vue`. Pinia is a separate library built on Vue\'s reactivity.' },
      { lines: [3, 4], text: 'The id `\'cart\'` names the store in devtools and plugins. `defineStore` returns a *function*; components call `useCartStore()` to get the store.' },
      { lines: [5, 8], text: '`state` is a function returning the initial data. A function, not an object, so each Pinia instance gets its own fresh copy.' },
      { lines: [10, 14], text: 'Getters receive `state` and return a derived value. They are cached: `itemCount` re-computes only when `items` changes, no matter how many components read it.' },
      { lines: [15, 18], text: 'A getter written as a regular function can use `this` to reach other getters. An arrow function would have no `this`.' },
      { lines: [21, 27], text: '`addItem` is an action. It changes state through `this` — no `.value`, because the store unwraps refs. The rule "merge duplicate products" lives here, once, instead of in every component.' },
      { lines: [28, 30], text: 'Replacing the whole array is fine inside an action. Every component reading `items` updates.' },
    ],
  },

  playground: {
    title: 'Corner Shop with Pinia',
    objective: 'Three components that never pass props to each other share one cart store. Add getters and actions and watch every component follow.',
    files: playgroundFiles,
    expected: 'A header badge showing **0**, a product list and an empty cart. Click **Add** on any product: the badge, the cart lines, the subtotal and the footer all update together. **Empty cart** clears everything. Switch to the *Setup store* variant: identical behaviour, different syntax.',
    experiments: [
      {
        id: 'free-shipping',
        task: 'Add a getter `freeShipping` that is `true` when the subtotal is **40 or more**. In `CartSummary.vue`, show `<p class="shipping">Free shipping!</p>` only when it is true.',
        hint: 'A getter can use another getter through `this`: `freeShipping() { return this.subtotal >= 40 }`. In the template: `v-if="cart.freeShipping"`.',
        tests: [
          {
            name: 'two plants (40) unlock free shipping',
            code: `const plant = findAll('.add')[2]
await click(plant)
expect(exists('.shipping') && isVisible('.shipping')).toBe(false)
await click(plant)
expect(isVisible('.shipping')).toBe(true)
expect(text('.shipping')).toContain('Free shipping')`,
          },
          {
            name: 'the store exposes a freeShipping getter',
            code: `const { useCartStore } = requireModule('stores/cart.js')
const cart = useCartStore()
expect(cart.freeShipping).toBe(false)
cart.addItem({ id: 3, name: 'Desk plant', price: 20 })
cart.addItem({ id: 3, name: 'Desk plant', price: 20 })
expect(cart.freeShipping).toBe(true)`,
          },
        ],
        explain: 'Getters are where derived rules live. The summary just asks `cart.freeShipping`; if the threshold changes, you edit one line in the store.',
      },
      {
        id: 'remove-one',
        task: 'Add an action `removeItem(id)` that lowers that line\'s quantity by one and removes the line when it reaches 0. Add a `<button class="remove">` inside each `.line` in `CartSummary.vue` that calls it.',
        hint: 'Find the line; `if (line.qty > 1) line.qty--` else filter it out: `this.items = this.items.filter((l) => l.id !== id)`.',
        tests: [
          {
            name: 'remove lowers the quantity, then removes the line',
            code: `const mug = findAll('.add')[0]
await click(mug)
await click(mug)
expect(exists('.line .remove')).toBe(true)
await click(find('.line .remove'))
expect(text('.line')).toContain('× 1')
expect(text('.count')).toBe('1')
await click(find('.line .remove'))
expect(findAll('.line')).toHaveLength(0)
expect(text('.count')).toBe('0')`,
          },
        ],
        explain: 'The button is in the summary, but the header badge updated too. Every component that reads `items` or a getter built on it re-renders after the action runs.',
      },
      {
        id: 'stock-limit',
        task: 'Each product has a `stock`. Make `addItem` refuse to add more of a product than its stock (the mug has 3). Put the rule **in the action**, not in the template.',
        hint: 'In `addItem(product)`: `if (line && line.qty >= product.stock) return` before incrementing.',
        tests: [
          {
            name: 'clicking Add 5 times on the mug stops at 3',
            code: `const mug = findAll('.add')[0]
for (let i = 0; i < 5; i++) await click(mug)
expect(text('.count')).toBe('3')`,
          },
          {
            name: 'the rule lives in the action',
            code: `const { useCartStore } = requireModule('stores/cart.js')
const cart = useCartStore()
const pen = { id: 9, name: 'Pen', price: 1, stock: 1 }
cart.addItem(pen)
cart.addItem(pen)
expect(cart.items.find((l) => l.id === 9).qty).toBe(1)`,
          },
        ],
        explain: 'Disabling a button is nice UX, but only the action can *guarantee* the rule — any component (or test, or devtools user) calling `addItem` gets the same protection.',
      },
      {
        id: 'inspect-store',
        task: 'Open the **Reactive state** tab. `App.vue` called `useCartStore()`, so `cart` shows up there. Add products from the list and watch `cart` change even though `App.vue` itself did nothing.',
        hint: 'Every `useCartStore()` call returns the same store object.',
        explain: 'The store is one reactive object shared by every component that calls `useCartStore()`. In a real project, the Vue DevTools Pinia panel shows the same thing, plus a timeline of every action.',
      },
    ],
    variants: [
      {
        id: 'setup-store',
        label: 'Same shop with a setup store',
        files: { ...playgroundFiles, 'stores/cart.js': cartSetupStore },
      },
    ],
  },

  internals: {
    beginner: `
\`createPinia()\` builds one container for all your stores and \`app.use()\` hands it to the app. The first time any component calls \`useCartStore()\`, Pinia looks in the container for a store with the id \`'cart'\`. It isn't there yet, so Pinia creates it — runs \`state()\`, sets up the getters and actions — and saves it. Every later call, from any component, gets that same saved store back.

The store is reactive, like a \`reactive()\` object. When an action changes \`items\`, Vue redraws exactly the components that read \`items\` (or a getter built from it).
`,
    technical: [
      `
**One container, one state tree.** The Pinia instance keeps all store *state* in a single \`ref\` keyed by store id (\`pinia.state.value.cart\`), and a registry \`Map\` of created stores. That single tree is what devtools, SSR serialisation and plugins work with.

**Lazy creation.** \`defineStore()\` only returns a function. The store is created on the first \`useCartStore()\` call. Inside a component, \`useCartStore()\` finds the Pinia instance through the app's injection; outside a component it falls back to the *active* Pinia (set by \`app.use(pinia)\` or \`setActivePinia()\`).

**Option stores become setup stores.** Internally Pinia converts an option store into the setup form: its state object is turned into refs (\`toRefs(pinia.state.value.cart)\`), each getter is wrapped in \`computed()\` and called with the store as \`this\`, and actions are attached as methods.
`,
      {
        code: `// A simplified mental model — not Pinia's real source
function defineStore(id, setup) {
  return function useStore() {
    const pinia = getPiniaFromAppOrActive()
    if (!pinia.stores.has(id)) {
      const scope = effectScope()             // owns the store's computeds/watchers
      const bindings = scope.run(setup)       // { items: ref, itemCount: computed, addItem: fn }
      const store = reactive({ $id: id })     // refs inside a reactive are unwrapped
      for (const [key, value] of Object.entries(bindings)) {
        store[key] = typeof value === 'function' ? wrapAction(key, value) : value
      }
      pinia.stores.set(id, store)
    }
    return pinia.stores.get(id)
  }
}`,
        lang: 'js',
        title: 'mental model of defineStore',
      },
      `
**Why the store unwraps refs.** The store is a \`reactive()\` object; putting a ref inside a reactive object unwraps it on access. That is why you write \`cart.items\`, and also why destructuring (\`const { items } = cart\`) breaks reactivity: you copy out the current value, not the ref.

**Actions are wrapped** so Pinia can notify \`$onAction\` subscribers (and devtools) before and after each call, including when an async action resolves or rejects.

**Effect scope.** Each store runs inside its own \`effectScope\`, so its computeds and watchers live as long as the store, not as long as the component that first used it. Unmounting that component does not destroy the store.
`,
    ],
    production: `
- **Organise by domain:** \`stores/cart.js\`, \`stores/auth.js\`, \`stores/preferences.js\`. Many small stores beat one giant store — each is created lazily, so unused stores cost nothing until used.
- **Option or setup?** Both are fully supported. Option stores give a fixed, easy-to-scan structure; setup stores allow composables, \`watch\`, and \`inject()\` of app-level provides (such as the router). Teams usually pick one style per codebase for consistency.
- **Return all state from setup stores.** Pinia docs are explicit: state that is not returned (or is returned \`readonly\`) breaks SSR, devtools and plugins. If you need "private" helpers, keep them as plain functions or a separate store.
- **Getters with arguments are not cached** — returning a function means the work re-runs on every call. For expensive lookups, cache inside the getter (e.g., build a \`Map\` by id in a computed and look up in it).
- **TypeScript:** setup stores infer types naturally; in option stores, getters that use \`this\` need an explicit return type. See the [TypeScript track](lesson:typing-composables-stores).
- **Frontend state is not security.** A store holding \`user.role = 'admin'\` decides what the UI *shows*; the server must still authorise every request.
`,
  },

  mistakes: [
    {
      title: 'Using `.value` on store properties',
      wrong: { code: `const cart = useCartStore()
cart.items.value.push(product) // TypeError: cannot read 'push' of undefined`, lang: 'js' },
      right: { code: `const cart = useCartStore()
cart.items.push(product) // better still: cart.addItem(product)`, lang: 'js' },
      explanation: 'The store is a reactive object, so refs inside it are already unwrapped. `.value` is only needed *inside* a setup store\'s own code, where `items` is still a ref.',
    },
    {
      title: 'Arrow functions for actions or `this`-getters in option stores',
      wrong: { code: `actions: {
  addItem: (product) => {
    this.items.push(product) // \`this\` is not the store
  },
},`, lang: 'js' },
      right: { code: `actions: {
  addItem(product) {
    this.items.push(product)
  },
},`, lang: 'js' },
      explanation: 'Arrow functions do not get their own `this`, so Pinia cannot bind the store to it. Use method syntax for actions and for getters that read other getters.',
    },
    {
      title: 'Forgetting to return state from a setup store',
      wrong: { code: `defineStore('cart', () => {
  const items = ref([])
  const coupon = ref(null)          // used by actions…
  function apply(code) { coupon.value = code }
  return { items, apply }           // …but not returned
})`, lang: 'js' },
      right: { code: `defineStore('cart', () => {
  const items = ref([])
  const coupon = ref(null)
  function apply(code) { coupon.value = code }
  return { items, coupon, apply }
})`, lang: 'js' },
      explanation: 'Pinia only treats returned refs as state. `coupon` would be missing from devtools, from SSR hydration, from `$patch` and `$subscribe`, and from plugins such as persistence.',
    },
    {
      title: 'Making `state` an object instead of a function',
      wrong: { code: `defineStore('cart', {
  state: { items: [] }, // ❌`, lang: 'js' },
      right: { code: `defineStore('cart', {
  state: () => ({ items: [] }), // ✅ fresh object each time`, lang: 'js' },
      explanation: 'Pinia calls `state()` to build the initial state for each Pinia instance. A function guarantees every app, test and server request starts with its own fresh object.',
    },
  ],

  debugging: [
    {
      symptom: '`getActivePinia()` was called with no active Pinia / "Did you forget to install pinia?"',
      cause: 'A store was used before `app.use(createPinia())`, or at the top level of a module that runs before the app is created.',
      fix: 'Install Pinia in `main.js` before mounting, and call `useXxxStore()` inside `setup`, inside functions, or inside router guards — not at module top level.',
    },
    {
      symptom: 'TypeError: `cart.addItem is not a function`.',
      cause: 'The action was not defined in `actions` (option store) or not returned (setup store), or was misspelled.',
      fix: 'Check the store definition. In setup stores, everything the outside world uses must be in the returned object.',
    },
    {
      symptom: 'A getter returns `undefined` or throws "Cannot read properties of undefined".',
      cause: 'An arrow-function getter used `this`, or a getter reads state that does not exist in `state()`.',
      fix: 'Use the `state` parameter in arrow getters, or a regular function when you need `this`. Declare every state property in `state()` up front.',
    },
    {
      symptom: 'A value works in the app but is missing in the devtools Pinia panel.',
      cause: 'A setup store keeps a ref that is not returned.',
      fix: 'Return it. Setup stores have no private state.',
    },
  ],

  bestPractices: [
    'One store per domain (cart, auth, preferences), each in `src/stores/<name>.js`, named `useXxxStore`.',
    'Keep the minimum facts in state; express everything derived as getters.',
    'Put business rules (stock limits, merging duplicates, validation) in actions so every caller gets them.',
    'Prefer calling actions from components over writing to state directly — it keeps changes findable.',
    'Pick option or setup stores per codebase for consistency; both are first-class.',
    'In setup stores, return every ref that is state — no private state.',
    'Call `useXxxStore()` inside setup, functions or guards, never at module top level.',
  ],

  useCases: [
    'Shopping cart with items, count, subtotal and add/remove actions.',
    'Authenticated user: profile, roles, login/logout actions (the server still authorises everything).',
    'User preferences: theme, language, currency.',
    'A todo or task list shared between a list view, a counter in the header and a statistics panel.',
    'A media player whose current track is controlled from several places in the UI.',
  ],

  whenToUse: {
    use: [
      'Several distant components read or change the same data.',
      'State must survive route changes or components unmounting.',
      'You want devtools visibility, plugins (persistence, logging) or easy store unit tests.',
      'The app is server-side rendered and needs per-request state.',
    ],
    avoid: [
      'State used by one component or a parent and its child — `ref` plus props/events is simpler.',
      'Widget-internal context (a tabs component and its panels) — provide/inject keeps it scoped.',
      'Values derived from other state — compute them with a getter or `computed`.',
      'Data that should live in the URL (filters, page number).',
    ],
  },

  comparison: {
    title: 'Option store vs setup store',
    headers: ['', 'Option store', 'Setup store'],
    rows: [
      ['Shape', '`{ state, getters, actions }`', 'a function returning refs, computeds and functions'],
      ['State', '`state: () => ({ … })`', '`ref()` / `reactive()` that you return'],
      ['Getters', '`getters: { x: (state) => … }`', '`computed(() => …)`'],
      ['Actions', '`actions: { fn() { this… } }`', 'plain functions'],
      ['`this`', 'used in actions and getters', 'not used — variables are in scope'],
      ['`$reset()` built in', 'yes', 'no — write your own `reset()` action'],
      ['Can use `watch`, composables, `inject()`', 'no', 'yes'],
      ['Feels like', 'Options API', '`<script setup>`'],
    ],
    note: 'Pinia treats both styles equally. Next: [using stores well](lesson:using-stores) — `storeToRefs`, `$patch`, `$reset` and composing stores.',
  },

  quiz: [
    {
      id: 'pinia-basics-q1',
      type: 'mcq',
      prompt: 'In an **option store**, what must `state` be?',
      options: [
        { text: 'A function that returns the initial state object' },
        { text: 'A plain object with the initial values', why: 'Pinia needs to build a fresh state per Pinia instance, so it calls a function.' },
        { text: 'A `ref()`', why: 'That is how *setup* stores declare state, not option stores.' },
        { text: 'A `reactive()` object exported from the file', why: 'That is the hand-rolled module pattern from the previous lesson.' },
      ],
      answer: 0,
      explanation: '`state: () => ({ items: [] })`. Calling a function gives each app, test and server request its own fresh state.',
    },
    {
      id: 'pinia-basics-q2',
      type: 'output',
      prompt: 'The button is clicked **twice**. What does the paragraph show?',
      code: {
        lang: 'vue',
        code: `// stores/counter.js
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 1 }),
  getters: { triple: (state) => state.count * 3 },
  actions: { increment() { this.count++ } },
})

<!-- Counter.vue -->
<script setup>
const counter = useCounterStore()
</script>
<template>
  <p>{{ counter.triple }}</p>
  <button @click="counter.increment()">+</button>
</template>`,
      },
      options: [
        { text: '3', why: 'That is the starting value; the getter recomputes after each increment.' },
        { text: '6', why: 'That would be after one click (count 2).' },
        { text: '9' },
        { text: '1', why: 'The paragraph shows `triple`, not `count`.' },
      ],
      answer: 2,
      explanation: 'count goes 1 → 2 → 3, and the cached getter recomputes when `count` changes: 3 × 3 = 9.',
    },
    {
      id: 'pinia-basics-q3',
      type: 'bug',
      prompt: 'Clicking "Add" throws `TypeError: Cannot read properties of undefined (reading \'items\')`. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  getters: {
    count: (state) => state.items.length,
  },
  actions: {
    addItem: (product) => {
      this.items.push(product)
    },
  },
})`,
      },
      answerLine: 7,
      explanation: 'An arrow function has no `this` of its own, so Pinia cannot bind the store to it. Write it as a method: `addItem(product) { this.items.push(product) }`.',
    },
    {
      id: 'pinia-basics-q4',
      type: 'fill',
      prompt: 'Complete the setup store so `count` is state and `double` is a getter.',
      code: {
        lang: 'js',
        code: `export const useCounterStore = defineStore('counter', () => {
  const count = ___(0)
  const double = ___(() => count.value * 2)
  function increment() { count.value++ }
  return { count, double, increment }
})`,
      },
      answer: [['ref'], ['computed']],
      explanation: 'In setup stores `ref()` becomes state, `computed()` becomes a getter, and functions become actions.',
    },
    {
      id: 'pinia-basics-q5',
      type: 'mcq',
      prompt: '`CartBadge.vue` and `CartPage.vue` both call `useCartStore()`. What do they get?',
      options: [
        { text: 'The same store instance — Pinia creates it on the first call and returns it afterwards' },
        { text: 'Two independent copies, one per component', why: 'That is how a composable that creates refs inside behaves. Pinia stores are shared per Pinia instance.' },
        { text: 'An error — a store can only be used by one component', why: 'Any number of components can use a store.' },
        { text: 'The same instance, but only if both import it from the same folder', why: 'Identity comes from the store id inside one Pinia instance, not from import paths.' },
      ],
      answer: 0,
      explanation: 'Within one Pinia instance (one app), each store id maps to exactly one store. That is what makes it shared state.',
    },
    {
      id: 'pinia-basics-q6',
      type: 'mcq',
      prompt: 'In a setup store, a `ref` named `draft` is used by an action but **not returned**. What happens?',
      options: [
        { text: 'It works inside the store, but Pinia doesn\'t treat it as state: devtools, `$patch`, SSR hydration and plugins don\'t see it' },
        { text: 'It becomes private, read-only state', why: 'Pinia has no private state — unreturned refs are simply not state as far as Pinia knows.' },
        { text: 'Pinia throws an error when the store is created', why: 'There is no error; the problems show up later in devtools, SSR or plugins.' },
        { text: 'It is shared between all Pinia instances', why: 'It is created inside the setup function, so each store instance gets its own — it is just invisible to Pinia.' },
      ],
      answer: 0,
      explanation: 'Pinia docs: return all state properties in setup stores. Unreturned state breaks SSR, devtools and plugins.',
    },
    {
      id: 'pinia-basics-q7',
      type: 'short',
      prompt: 'Explain in your own words the difference between state, getters and actions — with a cart example for each.',
      answer: 'State is the raw data the store remembers, like the list of cart items. Getters are values computed from state and cached, like the item count or the subtotal — you never store them separately. Actions are the functions that change state and hold the rules, like addItem (which merges duplicates and respects stock) or clear.',
    },
  ],

  exercises: [
    {
      id: 'todo-option-store',
      title: 'Finish the todo store (option store)',
      difficulty: 'intermediate',
      prompt: `
The components are already wired to \`useTodoStore()\` — only the store is unfinished. Complete \`stores/todos.js\` (keep it an **option store**):

- getter \`remaining\` — how many todos are **not** done (\`.remaining\` shows "N left");
- action \`add(text)\` — trims the text, **ignores** empty text, appends \`{ id, text, done: false }\` with a **unique** id;
- action \`toggle(id)\` — flips \`done\` on that todo;
- action \`clearDone()\` — removes every finished todo.

The UI: \`<input class="new-todo">\` inside a form, one \`<li class="todo">\` per todo with a checkbox \`.toggle\`, and a \`.clear-done\` button.
`,
      files: {
        'main.js': todoMain,
        'stores/todos.js': todoStoreStarter,
        'App.vue': todoApp,
        'TodoInput.vue': todoInput,
        'TodoList.vue': todoList,
        'TodoFooter.vue': todoFooter,
      },
      hints: [
        'Getters take `state`: `remaining: (state) => state.todos.filter((t) => !t.done).length`.',
        'Actions are methods that use `this`: `add(text) { const clean = text.trim(); if (!clean) return; … }`. For an id, `Math.max(0, ...this.todos.map((t) => t.id)) + 1` works.',
        '`toggle(id)` finds the todo and flips `done`; `clearDone()` can reassign `this.todos = this.todos.filter((t) => !t.done)`.',
      ],
      solution: {
        explanation: 'All rules live in the store: trimming and ignoring empty input, unique ids, what "remaining" means. The three components only display state and call actions, so they stay tiny — and the header, list and footer can never disagree.',
        files: {
          'main.js': todoMain,
          'stores/todos.js': todoStoreSolution,
          'App.vue': todoApp,
          'TodoInput.vue': todoInput,
          'TodoList.vue': todoList,
          'TodoFooter.vue': todoFooter,
        },
      },
      tests: [
        { name: 'remaining counts unfinished todos', code: `expect(text('.remaining')).toBe('1 left')` },
        {
          name: 'adding through the form trims and appends',
          code: `await type('.new-todo', '  Walk the dog  ')
await submit('form')
const items = findAll('.todo')
expect(items).toHaveLength(3)
expect(items[2].textContent.trim()).toBe('Walk the dog')
expect(text('.remaining')).toBe('2 left')`,
        },
        {
          name: 'add() ignores empty text',
          code: `const { useTodoStore } = requireModule('stores/todos.js')
const store = useTodoStore()
store.add('   ')
expect(store.todos).toHaveLength(2)`,
        },
        {
          name: 'ids stay unique',
          code: `const { useTodoStore } = requireModule('stores/todos.js')
const store = useTodoStore()
store.add('A')
store.add('B')
const ids = store.todos.map((t) => t.id)
expect(new Set(ids).size).toBe(ids.length)`,
        },
        {
          name: 'toggle flips done',
          code: `await check(findAll('.toggle')[0], true)
expect(text('.remaining')).toBe('0 left')`,
        },
        {
          name: 'clearDone removes finished todos',
          code: `await click('.clear-done')
expect(findAll('.todo')).toHaveLength(1)
expect(text('.todo')).toContain('Learn Pinia')`,
        },
      ],
    },
    {
      id: 'playlist-setup-store',
      title: 'A playlist setup store',
      difficulty: 'intermediate',
      prompt: `
Finish \`stores/playlist.js\` as a **setup store**. The components already use it.

- state \`currentIndex\` (starts at \`0\`);
- getter \`current\` — the song at \`currentIndex\`;
- getter \`totalMinutes\` — total length of all songs in minutes, rounded (\`Math.round\`);
- getter \`byArtist\` — a getter that **takes an argument**: \`byArtist('The Commuters')\` returns that artist's songs;
- actions \`next()\` and \`previous()\` — both **wrap around** (next after the last song goes to the first; previous from the first goes to the last).

Return every piece of state. The UI uses \`.now-playing\`, \`.prev\`, \`.next\`, \`.total\` and \`.artist-count\`.
`,
      files: {
        'main.js': mainJs,
        'stores/playlist.js': playlistStarter,
        'App.vue': playlistApp,
        'NowPlaying.vue': nowPlaying,
        'Controls.vue': controls,
        'Stats.vue': stats,
      },
      hints: [
        '`const currentIndex = ref(0)` and `const current = computed(() => songs.value[currentIndex.value])`.',
        'Wrap-around with the remainder operator: `(i + 1) % length` for next, `(i - 1 + length) % length` for previous.',
        'A getter with an argument is a computed that returns a function: `computed(() => (artist) => songs.value.filter((s) => s.artist === artist))`. Remember to add everything to the returned object.',
      ],
      solution: {
        explanation: '`ref` → state, `computed` → getters, functions → actions. `byArtist` returns a function, so it can take an argument — the trade-off is that its result is not cached per artist. Returning `currentIndex` matters: it makes it real Pinia state, so `$patch`, devtools and plugins can see it.',
        files: {
          'main.js': mainJs,
          'stores/playlist.js': playlistSolution,
          'App.vue': playlistApp,
          'NowPlaying.vue': nowPlaying,
          'Controls.vue': controls,
          'Stats.vue': stats,
        },
      },
      tests: [
        { name: 'shows the first song', code: `expect(text('.now-playing')).toContain('Morning Run')` },
        {
          name: 'next() moves forward and wraps around',
          code: `await click('.next')
expect(text('.now-playing')).toContain('Paper Boats')
await click('.next')
await click('.next')
expect(text('.now-playing')).toContain('Morning Run')`,
        },
        {
          name: 'previous() wraps to the last song',
          code: `await click('.prev')
expect(text('.now-playing')).toContain('Last Train Home')`,
        },
        { name: 'totalMinutes is rounded total length', code: `expect(text('.total')).toBe('10 minutes in total')` },
        {
          name: 'byArtist(artist) returns that artist’s songs',
          code: `const { usePlaylistStore } = requireModule('stores/playlist.js')
const playlist = usePlaylistStore()
expect(playlist.byArtist('The Commuters').map((s) => s.title)).toEqual(['Morning Run', 'Last Train Home'])
expect(text('.artist-count')).toBe('2 songs by The Commuters')`,
        },
        {
          name: 'currentIndex is returned as real state',
          code: `const { usePlaylistStore } = requireModule('stores/playlist.js')
const playlist = usePlaylistStore()
expect(playlist.currentIndex).toBe(0)
playlist.$patch({ currentIndex: 2 })
await nextTick()
expect(text('.now-playing')).toContain('Last Train Home')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'pinia-basics-what-is-pinia',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is Pinia, and how does it differ from Vuex?',
      answer: 'Pinia is the officially recommended state management library for Vue. A store has state, getters and actions. Compared with Vuex it removes mutations (actions change state directly, sync or async), uses many small independent stores instead of one tree of nested modules, has a much smaller API, infers TypeScript types well, and supports the Composition API style via setup stores. Vuex is in maintenance mode.',
      explanation: 'Pinia keeps Vuex\'s good ideas — one source of truth, devtools, plugins — and removes the ceremony.',
      whyAsked: 'Many codebases still have Vuex. Interviewers check that you know the modern default and can explain a migration.',
      mistakes: [
        'Saying Pinia is part of Vue core — it is a separate library.',
        'Claiming Pinia has mutations.',
        'Not knowing that Vuex is in maintenance mode.',
      ],
      followUps: ['How would you migrate a Vuex module to Pinia?', 'What replaced Vuex modules in Pinia?', 'Do you still need a store with the Composition API?'],
      modelAnswer: 'Pinia is Vue\'s officially recommended state management library. You define stores with `defineStore`, each with state, getters and actions, and use them from any component. Compared with Vuex, there are no mutations — actions change state directly and can be async — and instead of one big store with nested modules you have many small stores that can use each other. The API is smaller and TypeScript inference works out of the box. Vuex is now in maintenance mode, so new projects use Pinia.',
    },
    {
      id: 'pinia-basics-option-vs-setup',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare option stores and setup stores. When would you pick each?',
      answer: 'Option stores use `{ state, getters, actions }` with `this`, have a built-in `$reset()`, and suit teams that like a fixed structure (or come from the Options API). Setup stores use a function with `ref`/`computed`/functions, can use `watch`, composables and `inject()` for app-level provides, but need a hand-written reset and must return all state. Both are equally supported; consistency within a codebase matters more than the choice.',
      explanation: 'Same capabilities for most stores; setup stores are more flexible, option stores more uniform.',
      code: {
        lang: 'js',
        code: `// option
defineStore('cart', {
  state: () => ({ items: [] }),
  getters: { count: (s) => s.items.length },
  actions: { add(p) { this.items.push(p) } },
})

// setup
defineStore('cart', () => {
  const items = ref([])
  const count = computed(() => items.value.length)
  const add = (p) => items.value.push(p)
  return { items, count, add }
})`,
      },
      whyAsked: 'Shows whether you understand Pinia beyond one tutorial and can make a reasoned style decision.',
      mistakes: [
        'Saying setup stores are "the new way" and option stores are deprecated.',
        'Forgetting that setup stores have no built-in `$reset()`.',
        'Not mentioning the return-all-state rule.',
      ],
      followUps: ['How do you implement reset in a setup store?', 'Can a setup store use a composable like `useRoute()`?'],
      modelAnswer: 'Both styles produce the same kind of store. Option stores declare state as a function, getters and actions with `this`; they are uniform and come with `$reset()`. Setup stores are a function like `<script setup>`: refs are state, computeds are getters, functions are actions; they can use watchers, composables and inject app-level provides, but I must return all state and write my own reset. I would pick one style per codebase — usually setup stores in a Composition API project.',
    },
    {
      id: 'pinia-basics-singleton',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'When exactly is a Pinia store created, and how many instances are there?',
      answer: 'A store is created lazily, the first time `useXxxStore()` is called with a given Pinia instance. After that, every call with the same Pinia returns the same instance. So there is one store per id per Pinia — usually one per app (and one per request in SSR, one per test with `setActivePinia(createPinia())`).',
      explanation: '`defineStore` only defines; `useXxxStore()` creates on first use and then reuses.',
      whyAsked: 'Understanding lifetime explains why stores survive unmounting and why tests need a fresh Pinia.',
      mistakes: ['Saying `defineStore` creates the store immediately.', 'Thinking each component gets its own instance.', 'Thinking a store is destroyed when the component that first used it unmounts.'],
      followUps: ['How do tests get a fresh store?', 'What does `$dispose()` do?'],
      modelAnswer: 'Calling `defineStore` only returns a `useStore` function. The first time any code calls it with a given Pinia instance, Pinia runs the state and setup and registers the store under its id. Every later call gets that same instance, so there is one store per id per Pinia — one per app normally, one per request in SSR, and one per test if I create a fresh Pinia in `beforeEach`. The store is not tied to the first component that used it.',
    },
    {
      id: 'pinia-basics-state-function',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'Why is `state` in an option store a function rather than an object?',
      answer: 'So Pinia can create a fresh initial state for every Pinia instance — each SSR request, each test, each app — and so `$reset()` can rebuild the initial state by calling it again. A shared object literal would be one object reused everywhere, leaking state between instances.',
      explanation: 'Same reason component `data` is a function in the Options API.',
      whyAsked: 'Probes SSR and testing awareness, and the link to `$reset()`.',
      mistakes: ['Saying it is just syntax.', 'Not connecting it to SSR or tests.', 'Not knowing `$reset()` calls `state()` again.'],
      followUps: ['What is the setup-store equivalent of `state()`?', 'How would you implement `$reset` in a setup store?'],
      modelAnswer: 'Pinia calls `state()` whenever it needs a fresh initial state: when a store is first created in a new Pinia instance — a new app, an SSR request, or a test — and when `$reset()` runs. If `state` were a plain object, every instance would share it, so one request or test could leak into another. It is the same reason component `data` is a function in the Options API. In a setup store the setup function itself plays that role, which is why `$reset()` isn\'t built in there.',
    },
    {
      id: 'pinia-basics-getter-args',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'A getter `productById` returns a function. A template calls `store.productById(1)` in three places. How many times does the `find` run per render?',
      code: {
        lang: 'js',
        code: `getters: {
  productById: (state) => (id) => {
    console.log('searching')
    return state.products.find((p) => p.id === id)
  },
},`,
      },
      options: ['Once — getters are cached', 'Three times — the returned function runs on every call', 'Zero — getters are lazy', 'Once per product in the list'],
      correctOption: 1,
      answer: 'Three times. The getter itself is cached (it returns the same function until `state.products` changes), but the *returned function* runs on every call, so each of the three calls searches again.',
      explanation: 'Caching applies to the getter\'s return value — here, a function — not to the results of calling it.',
      whyAsked: 'A subtle performance detail that separates people who have read the docs from people who assume "getters are cached".',
      mistakes: ['Answering "once" because getters are cached.', 'Not suggesting a fix for expensive lookups.'],
      followUps: ['How would you make lookups by id cheap?', 'Is this a problem for small lists?'],
      modelAnswer: 'It searches three times. The getter is cached, but what it caches is a function; calling that function runs the search every time. For small lists that is fine. For expensive lookups I would add a cached getter that builds a `Map` from id to product, and have `productById` read from that map, so each call is a cheap lookup.',
    },
    {
      id: 'pinia-basics-missing-state',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'After adding a persistence plugin, the cart items survive a reload but the applied coupon does not. The coupon also never shows in devtools. Why?',
      code: {
        lang: 'js',
        code: `export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const coupon = ref(null)
  const total = computed(() => /* uses coupon.value */ 0)
  function applyCoupon(code) { coupon.value = code }
  return { items, total, applyCoupon }
})`,
      },
      answer: '`coupon` is not returned, so Pinia does not know it is state. Plugins, devtools, `$patch`, `$subscribe` and SSR hydration only see returned refs. Return `coupon` too.',
      explanation: 'Setup stores have no private state: if it is a ref that holds data, return it.',
      whyAsked: 'A realistic bug that tests understanding of how Pinia discovers state in setup stores.',
      mistakes: ['Blaming the plugin.', 'Making `coupon` a module-level variable — that shares it across all Pinia instances.'],
      followUps: ['How would you keep something truly internal?', 'What does `skipHydrate()` do?'],
      modelAnswer: 'In a setup store, Pinia treats only the returned refs as state. `coupon` is used internally but not returned, so the persistence plugin, devtools and SSR never see it. The fix is to return `coupon`. The docs are explicit that setup stores cannot have private state — hiding state breaks SSR, devtools and plugins.',
    },
    {
      id: 'pinia-basics-coding-wishlist',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Build a wishlist store shared by two components. `stores/wishlist.js` exports `useWishlistStore` with state `ids` (array), getter `count`, action `toggle(id)` and `has(id)` returning `true`/`false`. In `ProductGrid.vue`, each `.heart` button toggles its product and has `aria-pressed` set to whether it is in the wishlist. `WishBadge.vue` shows the count in `.wish-count`.',
      starter: {
        files: {
          'main.js': mainJs,
          'stores/wishlist.js': wishStoreStarter,
          'App.vue': wishApp,
          'ProductGrid.vue': wishGridStarter,
          'WishBadge.vue': wishBadgeStarter,
        },
      },
      tests: [
        { name: 'starts empty', code: `expect(text('.wish-count')).toBe('0')` },
        {
          name: 'clicking a heart adds it and updates the badge',
          code: `await click(findAll('.heart')[0])
expect(text('.wish-count')).toBe('1')
expect(attr(findAll('.heart')[0], 'aria-pressed')).toBe('true')`,
        },
        {
          name: 'clicking again removes it',
          code: `const h = findAll('.heart')[1]
await click(h)
await click(h)
expect(text('.wish-count')).toBe('0')
expect(attr(h, 'aria-pressed')).toBe('false')`,
        },
        {
          name: 'store API: toggle, has, count',
          code: `const { useWishlistStore } = requireModule('stores/wishlist.js')
const w = useWishlistStore()
w.toggle(3)
expect(w.has(3)).toBe(true)
expect(w.has(1)).toBe(false)
expect(w.count).toBe(1)
expect(w.ids).toEqual([3])`,
        },
      ],
      hints: [
        'A setup store is quickest: `ids = ref([])`, `count = computed(...)`, `has = computed(() => (id) => ids.value.includes(id))`.',
        '`toggle(id)`: find the index; push if missing, `splice` if present. Then use the store in both components.',
      ],
      answer: 'A small store with `ids`, `count`, `has` and `toggle`, used by both components; the grid binds `:aria-pressed="wishlist.has(p.id)"`.',
      solution: {
        files: {
          'main.js': mainJs,
          'stores/wishlist.js': wishStoreSolution,
          'App.vue': wishApp,
          'ProductGrid.vue': wishGridSolution,
          'WishBadge.vue': wishBadgeSolution,
        },
      },
      explanation: 'Both components read the same store, so the badge and the hearts always agree. `aria-pressed` makes the toggle state available to screen readers.',
      whyAsked: 'A short live-coding task covering store definition, getters with arguments, actions and sharing between components.',
      mistakes: ['Keeping the wishlist in `ProductGrid` and emitting events to the badge.', 'Storing `count` as separate state.', 'Using `.value` on store properties in components.'],
      followUps: ['How would you persist the wishlist?', 'How would you test the store without components?'],
      modelAnswer: 'I would write a setup store with `ids` as state, `count` as a computed, `has` as a computed returning a function, and a `toggle` action that adds or removes the id. Both components call `useWishlistStore()`: the grid binds each button\'s `aria-pressed` to `has(id)` and calls `toggle`, and the badge shows `count`. Because they share one store they cannot disagree.',
    },
  ],

  takeaways: [
    'Install once: `app.use(createPinia())` in `main.js`.',
    '`defineStore(id, …)` returns `useXxxStore()`; the store is created on first use and shared afterwards.',
    'State is the data, getters are cached derived values, actions are the named ways to change state.',
    'Option stores: `state()` function, getters with `state`/`this`, actions with `this` — no arrow functions.',
    'Setup stores: `ref` → state, `computed` → getters, functions → actions — and return all state.',
    'The store is reactive: no `.value` on its properties, and don\'t destructure it directly.',
  ],
}
