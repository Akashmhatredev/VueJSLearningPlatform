// Lesson: Using stores — storeToRefs, $patch, $reset, $subscribe, $onAction & composing stores

const mainJs = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')`

const productsStore = `import { defineStore } from 'pinia'

export const useProductStore = defineStore('products', {
  state: () => ({
    list: [
      { id: 1, name: 'Coffee mug', price: 12 },
      { id: 2, name: 'Notebook', price: 8 },
      { id: 3, name: 'Desk plant', price: 20 },
    ],
  }),
  getters: {
    byId: (state) => (id) => state.list.find((p) => p.id === id),
  },
})`

const userStore = `import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const name = ref('Sam')
  const isMember = ref(false)
  return { name, isMember }
})`

const cartStore = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProductStore } from './products.js'
import { useUserStore } from './user.js'

export const useCartStore = defineStore('cart', () => {
  // A store can use other stores
  const products = useProductStore()
  const user = useUserStore()

  // State keeps only ids and quantities — prices live in the products store
  const lines = ref([]) // { productId, qty }

  const detailed = computed(() =>
    lines.value.map((l) => ({ ...products.byId(l.productId), qty: l.qty })),
  )
  const itemCount = computed(() => lines.value.reduce((n, l) => n + l.qty, 0))
  const subtotal = computed(() =>
    detailed.value.reduce((sum, l) => sum + l.price * l.qty, 0),
  )
  // TODO (experiment): members get 10% off
  const total = computed(() => subtotal.value)

  function addItem(productId) {
    const line = lines.value.find((l) => l.productId === productId)
    if (line) line.qty++
    else lines.value.push({ productId, qty: 1 })
  }

  function clear() {
    lines.value = []
  }

  return { lines, detailed, itemCount, subtotal, total, addItem, clear }
})`

const appVue = `<script setup>
import CartBadge from './CartBadge.vue'
import ProductList from './ProductList.vue'
import CartSummary from './CartSummary.vue'
import MemberToggle from './MemberToggle.vue'
import { useCartStore } from './stores/cart.js'

const cart = useCartStore()

// $subscribe: runs after changes to this store's state
cart.$subscribe((mutation, state) => {
  console.log(\`[cart] \${mutation.type}: \${state.lines.length} line(s)\`)
})
</script>

<template>
  <header class="top">
    <strong>Corner Shop</strong>
    <CartBadge />
  </header>
  <MemberToggle />
  <main class="layout">
    <ProductList />
    <CartSummary />
  </main>
</template>

<style>
.top { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 2px solid #222; }
.layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 12px; }
.member-toggle { display: block; padding: 8px 12px; }
button { margin-left: 6px; }
</style>`

const badgeVue = `<script setup>
import { useCartStore } from './stores/cart.js'

// Grab the value we need from the store
const { itemCount } = useCartStore()
</script>

<template>
  <span class="badge">🛒 <b class="count">{{ itemCount }}</b></span>
</template>`

const productListVue = `<script setup>
import { useProductStore } from './stores/products.js'
import { useCartStore } from './stores/cart.js'

const products = useProductStore()
// Actions are functions bound to the store — safe to destructure
const { addItem } = useCartStore()
</script>

<template>
  <section>
    <h3>Products</h3>
    <ul>
      <li v-for="p in products.list" :key="p.id">
        {{ p.name }} — \${{ p.price }}
        <button class="add" @click="addItem(p.id)">Add</button>
      </li>
    </ul>
  </section>
</template>`

const summaryVue = `<script setup>
import { storeToRefs } from 'pinia'
import { useCartStore } from './stores/cart.js'

const cart = useCartStore()
// storeToRefs: state and getters stay reactive after destructuring
const { detailed, subtotal, total } = storeToRefs(cart)
// actions come straight from the store
const { clear } = cart
</script>

<template>
  <section class="summary">
    <h3>Cart</h3>
    <ul>
      <li v-for="line in detailed" :key="line.id" class="line">{{ line.name }} × {{ line.qty }}</li>
    </ul>
    <p class="subtotal">Subtotal: \${{ subtotal.toFixed(2) }}</p>
    <p class="total">Total: \${{ total.toFixed(2) }}</p>
    <button class="clear" @click="clear">Empty cart</button>
  </section>
</template>`

const memberVue = `<script setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from './stores/user.js'

const { name, isMember } = storeToRefs(useUserStore())
</script>

<template>
  <label class="member-toggle">
    <!-- v-model on a ref from storeToRefs writes back into the store -->
    <input type="checkbox" class="member" v-model="isMember" />
    {{ name }} is a member (10% off)
  </label>
</template>`

const playgroundFiles = {
  'main.js': mainJs,
  'stores/products.js': productsStore,
  'stores/user.js': userStore,
  'stores/cart.js': cartStore,
  'App.vue': appVue,
  'CartBadge.vue': badgeVue,
  'ProductList.vue': productListVue,
  'CartSummary.vue': summaryVue,
  'MemberToggle.vue': memberVue,
}

// ---- exercise: settings panel
const settingsStore = `import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({ theme: 'light', fontSize: 16 }),
  getters: {
    label: (state) => \`\${state.theme} · \${state.fontSize}px\`,
  },
})`

const settingsApp = `<script setup>
import SettingsPanel from './SettingsPanel.vue'
import Preview from './Preview.vue'
</script>

<template>
  <SettingsPanel />
  <Preview />
</template>`

const previewVue = `<script setup>
import { useSettingsStore } from './stores/settings.js'
const settings = useSettingsStore()
</script>

<template>
  <p class="preview" :style="{ fontSize: settings.fontSize + 'px' }">{{ settings.label }}</p>
</template>`

const panelStarter = `<script setup>
import { useSettingsStore } from './stores/settings.js'

const settings = useSettingsStore()
let { theme, fontSize } = settings

function applyDarkPreset() {
  // TODO: set theme 'dark' and fontSize 18 with ONE $patch call
}

function resetAll() {
  // TODO: back to the initial state
}
</script>

<template>
  <label>Theme
    <select class="theme-select" v-model="theme">
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  <label>Font size
    <input class="font-size" type="number" v-model.number="fontSize" />
  </label>
  <button class="preset-dark" @click="applyDarkPreset">Dark preset</button>
  <button class="reset" @click="resetAll">Reset</button>
</template>`

const panelSolution = `<script setup>
import { storeToRefs } from 'pinia'
import { useSettingsStore } from './stores/settings.js'

const settings = useSettingsStore()
// refs linked to the store: v-model reads AND writes store state
const { theme, fontSize } = storeToRefs(settings)

function applyDarkPreset() {
  // one patch = one change notification, one devtools entry
  settings.$patch({ theme: 'dark', fontSize: 18 })
}

function resetAll() {
  settings.$reset() // available because this is an option store
}
</script>

<template>
  <label>Theme
    <select class="theme-select" v-model="theme">
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  <label>Font size
    <input class="font-size" type="number" v-model.number="fontSize" />
  </label>
  <button class="preset-dark" @click="applyDarkPreset">Dark preset</button>
  <button class="reset" @click="resetAll">Reset</button>
</template>`

// ---- exercise: checkout toasts via $onAction
const checkoutApi = `let nextOrder = 1001

// Simulated server (simplified): fails when the cart is empty
export function placeOrder(items) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (items.length === 0) reject(new Error('Your cart is empty'))
      else resolve({ orderId: nextOrder++ })
    }, 50)
  })
}`

const checkoutCart = `import { defineStore } from 'pinia'
import { placeOrder } from '../api.js'

export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  actions: {
    add(name) {
      this.items.push(name)
    },
    async checkout() {
      const { orderId } = await placeOrder([...this.items])
      this.items = []
      return orderId
    },
  },
})`

const toastStore = `import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toasts', () => {
  const items = ref([])
  let nextId = 1

  function push(text, kind = 'info') {
    items.value.push({ id: nextId++, text, kind })
  }

  function dismiss(id) {
    items.value = items.value.filter((t) => t.id !== id)
  }

  return { items, push, dismiss }
})`

const toastList = `<script setup>
import { useToastStore } from './stores/toasts.js'
const toasts = useToastStore()
</script>

<template>
  <ul class="toasts" aria-live="polite">
    <li v-for="t in toasts.items" :key="t.id" class="toast" :class="t.kind">
      {{ t.text }}
      <button @click="toasts.dismiss(t.id)" aria-label="Dismiss">×</button>
    </li>
  </ul>
</template>`

const checkoutAppStarter = `<script setup>
import { useCartStore } from './stores/cart.js'
import { useToastStore } from './stores/toasts.js'
import ToastList from './ToastList.vue'

const cart = useCartStore()
const toasts = useToastStore()

// TODO: use cart.$onAction so that the checkout action
//  - on success pushes a 'success' toast: "Order #<id> placed"
//  - on failure pushes an 'error' toast with the error message
</script>

<template>
  <button class="add" @click="cart.add('Coffee mug')">Add mug</button>
  <span class="items">{{ cart.items.length }} item(s)</span>
  <button class="checkout" @click="cart.checkout().catch(() => {})">Checkout</button>
  <ToastList />
</template>`

const checkoutAppSolution = `<script setup>
import { useCartStore } from './stores/cart.js'
import { useToastStore } from './stores/toasts.js'
import ToastList from './ToastList.vue'

const cart = useCartStore()
const toasts = useToastStore()

// Runs before every cart action. Removed automatically when App unmounts.
cart.$onAction(({ name, after, onError }) => {
  if (name !== 'checkout') return

  // after(): the action finished — for async actions, after the promise resolved
  after((orderId) => {
    toasts.push(\`Order #\${orderId} placed\`, 'success')
  })

  // onError(): the action threw or its promise rejected
  onError((error) => {
    toasts.push(error.message, 'error')
  })
})
</script>

<template>
  <button class="add" @click="cart.add('Coffee mug')">Add mug</button>
  <span class="items">{{ cart.items.length }} item(s)</span>
  <button class="checkout" @click="cart.checkout().catch(() => {})">Checkout</button>
  <ToastList />
</template>`

// ---- interview coding: reset in a setup store
const filtersStarter = `import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFilterStore = defineStore('filters', () => {
  const query = ref('')
  const category = ref('all')
  const inStockOnly = ref(false)

  // TODO: reset() — setup stores have no built-in $reset()

  return { query, category, inStockOnly }
})`

const filtersSolution = `import { defineStore } from 'pinia'
import { ref } from 'vue'

// One function describes the initial state, so reset can never drift from it
function initialState() {
  return { query: '', category: 'all', inStockOnly: false }
}

export const useFilterStore = defineStore('filters', () => {
  const start = initialState()
  const query = ref(start.query)
  const category = ref(start.category)
  const inStockOnly = ref(start.inStockOnly)

  function reset() {
    const fresh = initialState()
    query.value = fresh.query
    category.value = fresh.category
    inStockOnly.value = fresh.inStockOnly
  }

  return { query, category, inStockOnly, reset }
})`

const filtersApp = `<script setup>
import { storeToRefs } from 'pinia'
import { useFilterStore } from './stores/filters.js'

const filters = useFilterStore()
const { query, category, inStockOnly } = storeToRefs(filters)
</script>

<template>
  <input class="query" v-model="query" placeholder="Search" />
  <select class="category" v-model="category">
    <option value="all">All</option>
    <option value="books">Books</option>
    <option value="games">Games</option>
  </select>
  <label><input type="checkbox" class="in-stock" v-model="inStockOnly" /> In stock only</label>
  <button class="reset" @click="filters.reset()">Reset filters</button>
  <p class="summary">{{ query || '∅' }} | {{ category }} | {{ inStockOnly }}</p>
</template>`

export default {
  id: 'using-stores',
  title: 'Using stores: storeToRefs, $patch & composition',
  summary: 'Use stores safely in components with storeToRefs, change several values at once with $patch, reset state, react to changes with $subscribe and $onAction, and compose stores.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['pinia-basics', 'reactivity-utilities'],
  related: ['pinia-async-patterns', 'pinia-production', 'arrays-objects-reactivity', 'navigation-guards'],
  tags: ['pinia', 'storeToRefs', '$patch', '$reset', '$subscribe', '$onAction', '$state', 'store composition', 'destructuring', 'mapStores'],
  apis: [
    { name: 'storeToRefs(store)', summary: 'Returns refs for every state property and getter of a store (actions are skipped), so you can destructure without losing reactivity.' },
    { name: 'store.$patch(object | fn)', summary: 'Applies several state changes as one mutation — an object is deep-merged; a function receives the state to mutate.' },
    { name: 'store.$reset()', summary: 'Option stores only: rebuilds state by calling `state()` again. Setup stores must implement their own reset.' },
    { name: 'store.$subscribe(cb, options?)', summary: 'Calls `cb(mutation, state)` after the store\'s state changes. Removed on component unmount unless `{ detached: true }`.' },
    { name: 'store.$onAction(cb, detached?)', summary: 'Calls `cb({ name, args, store, after, onError })` before every action; `after`/`onError` register callbacks for when it finishes or fails.' },
    { name: 'store.$state', summary: 'The whole state object. Assigning to it calls `$patch()` internally rather than replacing the reactive object.' },
  ],
  docs: [
    { label: 'Pinia — Using the store & destructuring (storeToRefs)', url: 'https://pinia.vuejs.org/core-concepts/#Destructuring-from-a-Store' },
    { label: 'Pinia — State: $patch, $reset, $subscribe', url: 'https://pinia.vuejs.org/core-concepts/state.html' },
    { label: 'Pinia — Actions: $onAction', url: 'https://pinia.vuejs.org/core-concepts/actions.html#Subscribing-to-actions' },
    { label: 'Pinia — Composing stores', url: 'https://pinia.vuejs.org/cookbook/composing-stores.html' },
    { label: 'Pinia — Using a store outside of a component', url: 'https://pinia.vuejs.org/core-concepts/outside-component-usage.html' },
  ],

  intro: `
You can define a store. Now you need to *use* it well — inside components, from other stores, and from code that is not a component at all.

This lesson covers the handful of tools you will use every day:

- **\`storeToRefs()\`** — destructure a store without breaking reactivity;
- **\`$patch()\`** — change several values in one go;
- **\`$reset()\`** — go back to the initial state (and what to do in setup stores, which don't have it);
- **\`$subscribe()\`** and **\`$onAction()\`** — react to state changes and to actions, for logging, persistence or notifications;
- **composing stores** — one store using another, without creating a tangle.
`,

  why: `
A store is a \`reactive\` object, and reactive objects have one famous trap: **destructuring copies values out and cuts the connection**. \`const { count } = store\` gives you the number 0, forever. That single line is behind a large share of "my store doesn't update!" questions.

Real apps also need more than reading and writing one field:

- a "load preset" button should change five settings at once, as **one** change that devtools and subscribers see together;
- a "start over" button should restore defaults without listing every field by hand;
- some code needs to know **whenever** the cart changes (to save it) or **whenever** checkout runs (to show a toast or report errors);
- the cart needs prices from the products store and a discount from the user store.

Each tool in this lesson exists for one of those jobs.
`,

  eli15: `
Imagine the store is a live scoreboard in a stadium.

- Writing down today's score on a napkin (\`const { score } = store\`) gives you a copy. The real board keeps changing; your napkin doesn't. \`storeToRefs()\` instead gives you a **little live screen** connected to the board.
- \`$patch()\` is the operator updating home score, away score and the clock **in one press**, so the crowd sees one clean update, not three flickers.
- \`$reset()\` is the "new game" button: everything back to 0–0.
- \`$subscribe()\` is a reporter who writes something down **every time the board changes**.
- \`$onAction()\` is a referee who is told **every time someone presses a button** — and again when it worked or failed.
`,

  analogy: {
    title: 'The stadium scoreboard and its control room',
    body: `
The board itself is the store's state. People in the stands can look at it directly, or carry a small live monitor wired to it. Someone who scribbles the score on paper has a snapshot that will be wrong by half-time.

In the control room, operators press buttons (actions). A reporter logs every change to the board, and a supervisor is told before each button press and again when it succeeded or failed. One board can even pull numbers from another — the league table board reads results from every match board.
`,
    mapping: [
      ['scribbling the score on paper', '`const { count } = store` — a dead copy'],
      ['a live monitor wired to the board', '`storeToRefs(store)` — refs that stay connected'],
      ['updating several numbers in one press', '`store.$patch({ … })`'],
      ['the "new game" button', '`store.$reset()` (option stores) or your own `reset()` action'],
      ['the reporter logging every change', '`store.$subscribe()`'],
      ['the supervisor told about every button press', '`store.$onAction()`'],
      ['the league board reading match boards', 'one store calling `useOtherStore()`'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'Destructuring a store: copy vs live refs',
    props: {
      left: {
        label: '❌ Plain destructuring',
        lang: 'js',
        code: `const cart = useCartStore()
const { itemCount } = cart
// itemCount is the number 0.
// cart.addItem(1) → store changes,
// itemCount is still 0.`,
      },
      right: {
        label: '✅ storeToRefs',
        lang: 'js',
        code: `const cart = useCartStore()
const { itemCount } = storeToRefs(cart)
const { addItem } = cart  // actions: plain destructure
// itemCount is a ref linked to the store.
// addItem(1) → itemCount.value === 1`,
      },
      points: [
        'The store is a reactive object; refs inside it are unwrapped when you read them.',
        'Destructuring reads each property once and stores the plain value in a new variable.',
        '`storeToRefs()` creates refs for state and getters that read from and write to the store.',
        'Actions are functions bound to the store, so destructuring them directly is safe.',
      ],
    },
    alt: 'Two code panels side by side. Left: destructuring a store directly gives a plain number that never updates. Right: storeToRefs gives a ref connected to the store; actions are destructured from the store itself.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'What happens when an action runs',
    caption: 'Follow one call to `cart.checkout()` through `$onAction`, the state change, `$subscribe`, and the re-render.',
    alt: 'A flow from a component click, to the $onAction listeners, to the action body changing state, to $subscribe listeners and re-rendered components, and finally to the after or onError callbacks when the action finishes or fails.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'click', label: 'Component', note: 'cart.checkout()', tone: 'paper' },
        { id: 'onaction', label: '$onAction', note: 'name, args, store', tone: 'cobalt' },
        { id: 'body', label: 'Action body', note: 'changes state', tone: 'acid' },
        { id: 'subscribe', label: '$subscribe + render', note: 'mutation, state', tone: 'kraft' },
        { id: 'after', label: 'after / onError', note: 'result or error', tone: 'red' },
      ],
      edges: [
        { from: 'click', to: 'onaction' },
        { from: 'onaction', to: 'body' },
        { from: 'body', to: 'subscribe', label: 'state changed' },
        { from: 'subscribe', to: 'after', label: 'promise settles', dashed: true },
      ],
      steps: [
        { focus: ['click'], text: 'A component calls an action — `cart.checkout()`. Actions are wrapped by Pinia, so the call is observable.' },
        { focus: ['onaction'], edges: ['click->onaction'], text: 'Before the action body runs, every `$onAction` listener is called with `{ name, args, store, after, onError }`. Listeners can register `after` and `onError` callbacks.' },
        { focus: ['body'], edges: ['onaction->body'], text: 'The action body runs and changes state (`this.items = []`). For an async action this may happen after an `await`.' },
        { focus: ['subscribe'], edges: ['body->subscribe'], text: 'State changed, so `$subscribe` listeners receive `(mutation, state)` and components that read that state re-render (batched in the next tick).' },
        { focus: ['after'], edges: ['subscribe->after'], text: 'When the action returns — or its promise resolves — `after(result)` callbacks run. If it throws or rejects, `onError(error)` callbacks run instead.' },
      ],
    },
  },

  syntax: [
    `
#### storeToRefs — destructure safely
`,
    {
      code: `<script setup>
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
const { items, itemCount } = storeToRefs(cart) // state + getters → refs
const { addItem, clear } = cart                // actions → destructure directly
</script>

<template>
  <p>{{ itemCount }} items</p>        <!-- refs unwrap in templates -->
  <button @click="addItem(3)">Add</button>
</template>`,
      lang: 'vue',
      title: 'storeToRefs',
    },
    `
Or skip destructuring entirely and write \`cart.itemCount\` — that is always reactive and often clearer.

#### $patch — several changes, one mutation
`,
    {
      code: `// Object form: deep-merged into state
settings.$patch({ theme: 'dark', fontSize: 18 })

// Function form: best for arrays and conditional logic (must be synchronous)
cart.$patch((state) => {
  state.lines.push({ productId: 3, qty: 1 })
  state.couponCode = null
})

// Assigning $state also goes through $patch (the reactive object is kept)
settings.$state = { theme: 'light', fontSize: 16 }`,
      lang: 'js',
      title: '$patch',
    },
    `
#### $reset — back to the initial state
`,
    {
      code: `// Option store: built in — it calls state() again
settings.$reset()

// Setup store: write your own (the Pinia docs name it $reset; any name works)
export const useFilterStore = defineStore('filters', () => {
  const query = ref('')
  const category = ref('all')
  function $reset() {
    query.value = ''
    category.value = 'all'
  }
  return { query, category, $reset }
})`,
      lang: 'js',
      title: '$reset',
    },
    `
#### $subscribe and $onAction — react to changes
`,
    {
      code: `// After state changes. mutation.type: 'direct' | 'patch object' | 'patch function'
const stop = cart.$subscribe((mutation, state) => {
  localStorage.setItem('cart', JSON.stringify(state))
}, { detached: true }) // keep it after the component unmounts

// Before every action, plus hooks for its result
const unsubscribe = cart.$onAction(({ name, args, store, after, onError }) => {
  const started = Date.now()
  after((result) => console.log(\`\${name} took \${Date.now() - started}ms\`))
  onError((error) => console.warn(\`\${name} failed\`, error))
})`,
      lang: 'js',
      title: 'subscriptions',
    },
    `
Both return a function that removes the listener. Called inside a component's \`setup\`, they are removed automatically when the component unmounts, unless you pass \`{ detached: true }\` (\`$subscribe\`) or \`true\` as the second argument (\`$onAction\`).

#### Composing stores — one store using another
`,
    {
      code: `// Setup store: call the other store at the top of the setup function
export const useCartStore = defineStore('cart', () => {
  const user = useUserStore()
  const total = computed(() => subtotal.value * (user.isMember ? 0.9 : 1))
  // …
})

// Option store: call it inside the getter or action that needs it
actions: {
  async checkout() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) throw new Error('Please log in')
  },
},`,
      lang: 'js',
      title: 'composing stores',
    },
    `
**The rules:**

1. Destructure **state and getters** with \`storeToRefs()\`; destructure **actions** from the store itself (\`storeToRefs\` skips them).
2. Writing \`store.count++\` from a component is allowed in Pinia — but prefer actions for anything with rules, so changes stay findable.
3. \`$patch(fn)\` must be **synchronous**. Do async work in an action, then patch.
4. \`$reset()\` exists only on **option stores**. In setup stores, calling the built-in one throws in development; write your own.
5. Two stores may use each other only if they don't **both read each other's state in their setup functions** — that is a circular dependency. Read the other store inside getters/actions instead.
6. Outside components (router guards, plain modules), call \`useXxxStore()\` **inside** a function that runs after \`app.use(pinia)\`, never at the module's top level.
`,
    {
      callout: 'note',
      title: 'Options API',
      text: 'Components written with the [Options API](lesson:options-api) use `mapStores()`, `mapState()`, `mapWritableState()` and `mapActions()` instead of calling the store in `setup()`. They map store state and getters into `computed` and actions into `methods`.',
    },
  ],

  walkthrough: {
    title: 'stores/cart.js',
    lang: 'js',
    code: cartStore,
    intro: 'The playground\'s cart store uses two other stores. Step through it to see store composition in a setup store.',
    steps: [
      { lines: [3, 4], text: 'Other stores are imported like any module. Importing does not create them — calling `useXxxStore()` does.' },
      { lines: [7, 9], text: 'In a setup store, call other stores at the top of the setup function. Here the cart reads product details and the user\'s membership. The other stores never read the cart, so there is no circular dependency.' },
      { lines: [11, 12], text: 'The cart stores only ids and quantities. Prices have one owner — the products store — so a price change can never leave a stale copy in the cart.' },
      { lines: [14, 16], text: '`detailed` joins the two stores into display-ready lines. It is a getter, so it is cached and recalculates only when lines or products change.' },
      { lines: [17, 22], text: 'Counts and totals are derived. `total` is the spot where the member discount will go — it will read `user.isMember`, and recompute automatically when that flips.' },
      { lines: [24, 32], text: 'Actions change the cart\'s own state. A store should only change *its own* state; to change another store, call that store\'s action.' },
      { lines: [34], text: 'Return everything. `lines` is state; the computeds are getters; the functions are actions.' },
    ],
  },

  playground: {
    title: 'Three stores, one shop',
    objective: 'Fix a classic destructuring bug, compose two stores for a member discount, and watch actions with $onAction.',
    files: playgroundFiles,
    expected: 'A shop with a member checkbox. Clicking **Add** updates the cart summary — but the header badge is stuck at **0**: that is the first experiment. The console logs every cart state change from `$subscribe`.',
    experiments: [
      {
        id: 'fix-badge',
        task: 'The header badge never moves off 0. Find out why in `CartBadge.vue` and fix it so the badge shows the item count.',
        hint: '`const { itemCount } = useCartStore()` copies the current value (0) once. Use `storeToRefs()` from `pinia`, or keep the store and write `cart.itemCount` in the template.',
        tests: [
          {
            name: 'the badge follows the cart',
            code: `await click(findAll('.add')[0])
expect(text('.count')).toBe('1')
await click(findAll('.add')[1])
expect(text('.count')).toBe('2')`,
          },
        ],
        explain: 'Destructuring a reactive object reads each property once and keeps the plain value. `storeToRefs()` instead creates refs that read from the store on every access — so the badge re-renders when the count changes.',
      },
      {
        id: 'member-discount',
        task: 'Members get **10% off**. Change the `total` getter in `stores/cart.js` so it uses the user store: when `user.isMember` is true, total = subtotal × 0.9.',
        hint: 'The cart already has `const user = useUserStore()`. Write `computed(() => subtotal.value * (user.isMember ? 0.9 : 1))`. No `.value` on `user.isMember` — the store unwraps it.',
        tests: [
          {
            name: 'checking the member box takes 10% off',
            code: `await click(findAll('.add')[2])
expect(text('.total')).toContain('20.00')
await check('.member', true)
expect(text('.total')).toContain('18.00')
await check('.member', false)
expect(text('.total')).toContain('20.00')`,
          },
          {
            name: 'the cart total reacts to the user store',
            code: `const { useCartStore } = requireModule('stores/cart.js')
const { useUserStore } = requireModule('stores/user.js')
const cart = useCartStore()
cart.addItem(1)
useUserStore().isMember = true
expect(cart.total).toBe(10.8)`,
          },
        ],
        explain: 'A getter in one store read state from another store, and Vue\'s dependency tracking crossed the store boundary: flipping `isMember` recomputed the cart total. The user store did not need to know the cart exists.',
      },
      {
        id: 'action-log',
        task: 'In `App.vue`, use `cart.$onAction()` to record every cart action: push its `name` into a local `log` ref and render it as `<ol class="log">` with one `<li>` per entry.',
        hint: '`const log = ref([])` and `cart.$onAction(({ name }) => log.value.push(name))`. Don\'t forget `import { ref } from \'vue\'`.',
        tests: [
          {
            name: 'each action appears in the log',
            code: `await click(findAll('.add')[0])
await click('.clear')
const entries = findAll('.log li').map((li) => li.textContent.trim())
expect(entries).toHaveLength(2)
expect(entries[0]).toContain('addItem')
expect(entries[1]).toContain('clear')`,
          },
        ],
        explain: '`ProductList` destructured `addItem` from the store, yet `$onAction` still saw it — the store\'s actions are wrapped by Pinia, and destructuring gives you the wrapped function. This is how logging, analytics and error-reporting plugins hook into every action.',
      },
      {
        id: 'patch-vs-direct',
        task: 'Open the **Console**: each Add logs `direct`. Now change the **Empty cart** button in `CartSummary.vue` to call `cart.$patch({ lines: [] })` instead of `clear`. Empty the cart and compare the log line.',
        hint: 'The `$subscribe` callback in `App.vue` prints `mutation.type`.',
        explain: 'Direct mutations report `direct`; object patches report `patch object` (with the patch as `mutation.payload`); function patches report `patch function`. `$patch` groups many changes into one notification and one devtools entry.',
      },
    ],
  },

  internals: {
    beginner: `
A store is a \`reactive\` object. Reading \`cart.itemCount\` *through the store* is what lets Vue notice you depend on it. Pulling the value out into your own variable skips that, so Vue has nothing to track — the variable is just a number.

\`storeToRefs()\` makes small "windows" (refs) into the store. Each window looks at the store whenever you read it, so you are still reading through the store and Vue still tracks you.

\`$patch\`, \`$reset\`, \`$subscribe\` and \`$onAction\` are built into every store (their names start with \`$\` so they never clash with your own state).
`,
    technical: [
      `
**storeToRefs.** It walks the store's raw object and, for each state property and getter, creates a ref linked to it (\`toRef(store, key)\` for state; the existing computed for getters). Functions — actions and the \`$\` methods — are skipped. Unlike \`toRefs(store)\`, it doesn't create refs for everything, which would wrap every action too.

**$patch.** The object form deep-merges into the state tree; arrays are *replaced*, not merged, which is why the function form exists for pushing into arrays. During a patch, Pinia pauses its own state watcher and calls subscribers **once**, synchronously, with \`type: 'patch object'\` (including the payload) or \`'patch function'\`.

**$subscribe.** It is a deep \`watch\` on the store's slice of the Pinia state tree (\`pinia.state.value[id]\`), plus direct notification for patches. Like \`watch\`, direct mutations are batched: several changes in the same tick produce one callback with the default flush timing. The \`flush\` option (\`'pre' | 'post' | 'sync'\`) controls when direct-mutation callbacks run; it does not affect \`$patch\`, which notifies right away.
`,
      {
        code: `// Simplified model of how actions are wrapped — not Pinia's real source
function wrapAction(name, fn, store, listeners) {
  return function (...args) {
    const afterCbs = [], errorCbs = []
    listeners.forEach((l) =>
      l({ name, args, store, after: (cb) => afterCbs.push(cb), onError: (cb) => errorCbs.push(cb) }))
    let result
    try {
      result = fn.apply(store, args)
    } catch (error) {
      errorCbs.forEach((cb) => cb(error)); throw error
    }
    if (result instanceof Promise) {
      return result.then(
        (value) => { afterCbs.forEach((cb) => cb(value)); return value },
        (error) => { errorCbs.forEach((cb) => cb(error)); return Promise.reject(error) })
    }
    afterCbs.forEach((cb) => cb(result))
    return result
  }
}`,
        lang: 'js',
        title: 'mental model of $onAction',
      },
      `
**$reset.** For option stores Pinia keeps your \`state\` function; \`$reset()\` calls it and applies the fresh object with a function \`$patch\`. A setup store has no separate "initial state" function — the whole setup function is the initialiser — so the built-in \`$reset\` throws in development. If your setup store returns its own \`$reset\`, that one is used.

**Automatic cleanup.** \`$subscribe\` and \`$onAction\` check whether they are called inside an active effect scope (a component's \`setup\`). If so, they register cleanup with \`onScopeDispose\`, so unmounting the component removes the listener. \`detached\` opts out.

**Composing stores.** \`useOtherStore()\` inside a store returns the other store from the same Pinia. Getters that read another store's state track it like any reactive dependency. The circular case fails because store A's setup calls \`useB()\`, whose setup calls \`useA()\` while A is not finished — A is not registered yet, so the code reads from a store that doesn't fully exist.
`,
    ],
    production: `
- **Prefer \`cart.itemCount\` over destructuring** in small components; reach for \`storeToRefs\` when you need refs (for \`v-model\`, composables, or long templates).
- **Persistence and sync:** \`$subscribe(…, { detached: true })\` is the usual hook for saving to storage — see [persistence in production](lesson:pinia-production). Debounce writes for large state.
- **Cross-cutting concerns:** error reporting, analytics and performance timing belong in \`$onAction\` listeners or a Pinia plugin, not copy-pasted into every action.
- **Store boundaries:** a store should change only its own state. To affect another store, call its action. Keep the dependency direction one-way (cart → products, cart → user) to avoid cycles.
- **Router guards:** call \`useAuthStore()\` *inside* the guard. On the server (SSR), pass the pinia explicitly (\`useAuthStore(pinia)\`) when there is no component context.
- **Devtools:** \`$patch\` produces one timeline entry, which makes multi-field updates easier to read and time-travel.
`,
  },

  mistakes: [
    {
      title: 'Destructuring state or getters directly',
      wrong: { code: `const { items, total } = useCartStore()
// items/total are snapshots — the template never updates`, lang: 'js' },
      right: { code: `const cart = useCartStore()
const { items, total } = storeToRefs(cart)
// or simply use cart.items / cart.total`, lang: 'js' },
      explanation: 'The store is reactive; destructuring reads each property once and keeps plain values. `storeToRefs()` gives refs that stay connected.',
    },
    {
      title: 'Taking actions from storeToRefs',
      wrong: { code: `const { items, addItem } = storeToRefs(cart)
addItem(1) // TypeError: addItem is not a function`, lang: 'js' },
      right: { code: `const { items } = storeToRefs(cart)
const { addItem } = cart`, lang: 'js' },
      explanation: '`storeToRefs` only returns state and getters. Actions are already bound to the store — take them from the store itself.',
    },
    {
      title: 'Calling the built-in $reset() on a setup store',
      wrong: { code: `const filters = useFilterStore() // a setup store
filters.$reset() // Error: Store "filters" is built using the setup syntax and does not implement $reset().`, lang: 'js' },
      right: { code: `// in the setup store
function reset() {
  query.value = ''
  category.value = 'all'
}
return { query, category, reset }`, lang: 'js' },
      explanation: 'Only option stores keep a `state()` function Pinia can call again. Setup stores must provide their own reset (you may name it `$reset`, as the Pinia docs do).',
    },
    {
      title: 'Using a store at the top level of a module',
      wrong: { code: `// router.js
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore() // ❌ runs before app.use(pinia)

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
})`, lang: 'js' },
      right: { code: `router.beforeEach((to) => {
  const auth = useAuthStore() // ✅ runs during navigation, after Pinia is installed
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
})`, lang: 'js' },
      explanation: 'Module top-level code runs when the file is imported — usually before `app.use(pinia)`. Calling the store inside the guard defers it until Pinia is ready. (The guard only controls navigation; the server must still authorise API requests.)',
    },
    {
      title: 'Async work inside $patch(fn)',
      wrong: { code: `cart.$patch(async (state) => {
  state.lines = await api.loadCart() // ❌ $patch functions must be synchronous
})`, lang: 'js' },
      right: { code: `// in an action
async function loadCart() {
  const lines = await api.loadCart()
  this.$patch({ lines }) // or: lines.value = … in a setup store
}`, lang: 'js' },
      explanation: 'Pinia groups the changes made *during* the function call. Anything after an `await` happens later, outside the patch. Fetch in an action, then patch.',
    },
  ],

  debugging: [
    {
      symptom: 'A value from the store shows its initial value and never updates.',
      cause: 'State or a getter was destructured directly from the store.',
      fix: 'Use `storeToRefs(store)` for state/getters, or read through the store (`store.value`) in the template.',
    },
    {
      symptom: '`TypeError: addItem is not a function` after destructuring.',
      cause: 'The action was taken from `storeToRefs()`, which skips functions.',
      fix: 'Destructure actions from the store itself: `const { addItem } = store`.',
    },
    {
      symptom: '"getActivePinia()" was called but there was no active Pinia.',
      cause: 'A store was used at module top level, or in a guard/helper that runs before `app.use(pinia)`.',
      fix: 'Move the `useXxxStore()` call inside the function (guard, action, handler) so it runs after installation.',
    },
    {
      symptom: 'A `$subscribe` listener stops firing after navigating away from a page.',
      cause: 'It was registered in a component and removed automatically on unmount.',
      fix: 'Pass `{ detached: true }` if it must outlive the component — or register it in a plugin or `main.js`.',
    },
    {
      symptom: 'Two stores importing each other cause `undefined` errors or an infinite loop on startup.',
      cause: 'Both setup functions read each other\'s state immediately (circular dependency).',
      fix: 'Read the other store inside getters or actions, not directly in setup; or extract the shared part into a third store.',
    },
  ],

  bestPractices: [
    'Read through the store (`cart.total`) by default; use `storeToRefs()` when you need refs.',
    'Never take actions from `storeToRefs()` — destructure them from the store.',
    'Use `$patch` when several fields change together, so subscribers and devtools see one change.',
    'Give every setup store that needs it an explicit reset built from one `initialState()` function.',
    'Put logging, analytics and error reporting in `$onAction` listeners or plugins, not in every action.',
    'Keep store dependencies one-directional; a store changes only its own state and calls other stores\' actions.',
    'Outside components, call `useXxxStore()` inside the function that needs it.',
  ],

  useCases: [
    '`storeToRefs` + `v-model` to bind a settings form directly to a preferences store.',
    '`$patch` to apply a "dark preset" or server response that updates many fields at once.',
    '`$reset` / custom reset for "Clear filters" and "Start over" buttons, and on logout.',
    '`$subscribe` to save the cart to `localStorage` or sync it to another tab.',
    '`$onAction` to show toasts after checkout, time slow actions, or report failures.',
    'A cart store reading prices from a products store and a discount from a user store.',
  ],

  whenToUse: {
    use: [
      '`storeToRefs` when you want several store values as standalone refs (v-model, composables, long templates).',
      '`$patch` for multi-field or array updates that belong together.',
      '`$subscribe` when you care that state changed, whichever code changed it (persistence, sync).',
      '`$onAction` when you care that a specific operation ran and how it ended (toasts, analytics, error reporting).',
    ],
    avoid: [
      'Destructuring state or getters without `storeToRefs`.',
      '`$subscribe` for UI logic inside one component — a `watch` on the store value is more explicit there.',
      'Changing another store\'s state directly from inside an action — call its action instead.',
      'Circular store dependencies that read each other\'s state during setup.',
    ],
  },

  comparison: {
    title: 'Ways to change and observe a store',
    headers: ['', 'What it does', 'Subscribers see', 'Best for'],
    rows: [
      ['`store.x = 1`', 'direct mutation', '`direct` (batched per tick)', 'trivial one-field changes'],
      ['`store.someAction()`', 'runs your named logic', 'whatever the action mutates, plus `$onAction`', 'anything with rules — the default'],
      ['`store.$patch({ … })`', 'deep-merges an object', 'one `patch object` with payload', 'several fields at once'],
      ['`store.$patch((s) => …)`', 'runs a sync mutator', 'one `patch function`', 'arrays, conditional changes'],
      ['`store.$reset()`', 'rebuilds from `state()`', 'one `patch function`', 'option stores only'],
      ['`watch(() => store.x, …)`', 'observes one value', '—', 'component-level reactions to a specific value'],
      ['`store.$subscribe(…)`', 'observes the whole store state', '`(mutation, state)`', 'persistence, syncing, logging'],
    ],
    note: 'Next: [async actions, loading states and optimistic updates](lesson:pinia-async-patterns).',
  },

  quiz: [
    {
      id: 'using-stores-q1',
      type: 'mcq',
      prompt: 'Which line gives you a `total` that **stays reactive**?',
      options: [
        { text: '`const { total } = storeToRefs(useCartStore())`' },
        { text: '`const { total } = useCartStore()`', why: 'Destructuring the store copies the current value; it never updates.' },
        { text: '`const total = useCartStore().total`', why: 'Same problem — reading the property once stores a plain value.' },
        { text: '`const { total } = toRaw(useCartStore())`', why: '`toRaw` removes reactivity entirely.' },
      ],
      answer: 0,
      explanation: '`storeToRefs()` returns refs linked to the store\'s state and getters. Reading `cart.total` directly in the template also works.',
    },
    {
      id: 'using-stores-q2',
      type: 'output',
      prompt: 'The button is clicked **twice**. What does the paragraph show?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { useCounterStore } from './stores/counter.js'

const counter = useCounterStore()   // state: { count: 0 }
const { count } = counter
</script>

<template>
  <p>{{ count }}</p>
  <button @click="counter.count++">+</button>
</template>`,
      },
      options: [
        { text: '2', why: 'The store\'s count *is* 2, but the template shows the destructured copy.' },
        { text: '0' },
        { text: 'An error', why: 'Nothing throws — the copy just never changes.' },
        { text: '1', why: 'There is no partial update; the copy is disconnected.' },
      ],
      answer: 1,
      explanation: '`const { count } = counter` stored the number 0. Clicking changes `counter.count` to 2, but the template reads the local copy.',
    },
    {
      id: 'using-stores-q3',
      type: 'bug',
      prompt: 'Clicking "Add" throws `TypeError: addItem is not a function`. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { storeToRefs } from 'pinia'
import { useCartStore } from './stores/cart.js'

const cart = useCartStore()
const { items, addItem } = storeToRefs(cart)
</script>

<template>
  <p>{{ items.length }} items</p>
  <button @click="addItem(1)">Add</button>
</template>`,
      },
      answerLine: 6,
      explanation: '`storeToRefs` only returns state and getters — actions are skipped. Write `const { items } = storeToRefs(cart)` and `const { addItem } = cart`.',
    },
    {
      id: 'using-stores-q4',
      type: 'fill',
      prompt: 'Complete the component so `itemCount` stays reactive and `addItem` is usable.',
      code: {
        lang: 'js',
        code: `import { ___ } from 'pinia'

const cart = useCartStore()
const { itemCount } = storeToRefs(cart)
const { addItem } = ___`,
      },
      answer: [['storeToRefs'], ['cart']],
      explanation: 'Import `storeToRefs` from `pinia`, use it for state/getters, and destructure actions from the store itself.',
    },
    {
      id: 'using-stores-q5',
      type: 'mcq',
      prompt: 'You call `filters.$reset()` on a **setup store** that doesn\'t define its own reset. What happens (in development)?',
      options: [
        { text: 'It throws an error saying the setup store does not implement $reset()' },
        { text: 'It resets every ref to its initial value', why: 'Pinia has no separate initial-state function for setup stores, so it cannot.' },
        { text: 'It silently does nothing', why: 'In development Pinia throws to make the problem obvious.' },
        { text: 'It re-runs the setup function and replaces the store', why: 'Pinia never re-runs the setup function to reset.' },
      ],
      answer: 0,
      explanation: 'Only option stores get a built-in `$reset()`. In a setup store, return your own reset function (the docs name it `$reset`).',
    },
    {
      id: 'using-stores-q6',
      type: 'mcq',
      prompt: 'Which tool fits **"show a toast when checkout fails"** best?',
      options: [
        { text: '`cart.$onAction()` with `onError()`' },
        { text: '`cart.$subscribe()`', why: '`$subscribe` reports state changes, not which action ran or whether it failed.' },
        { text: '`storeToRefs(cart)`', why: 'That only exposes refs to state and getters.' },
        { text: '`cart.$patch()`', why: '`$patch` changes state; it doesn\'t observe anything.' },
      ],
      answer: 0,
      explanation: '`$onAction` runs before each action and lets you register `after` (success) and `onError` (failure) callbacks, including for async actions.',
    },
    {
      id: 'using-stores-q7',
      type: 'short',
      prompt: 'Explain the difference between `$subscribe` and `$onAction`, with one use for each.',
      answer: '`$subscribe` fires after the store\'s state changes, whatever caused it, and receives the mutation info and the new state — good for persisting the cart to localStorage. `$onAction` fires before an action runs and lets you hook into its success (`after`) or failure (`onError`) — good for showing a toast when checkout fails or reporting errors.',
    },
  ],

  exercises: [
    {
      id: 'settings-panel',
      title: 'Settings panel: storeToRefs, $patch and $reset',
      difficulty: 'intermediate',
      prompt: `
\`SettingsPanel.vue\` edits an **option store**, and \`Preview.vue\` shows the result in \`.preview\` (e.g. \`light · 16px\`). Right now the panel's inputs don't affect the store.

Fix \`SettingsPanel.vue\` only:

- the \`.theme-select\` and \`.font-size\` inputs must read **and write** the store (keep using \`v-model\`);
- \`.preset-dark\` sets \`theme: 'dark'\` and \`fontSize: 18\` with **one** \`$patch\` call;
- \`.reset\` restores the initial state.
`,
      files: {
        'main.js': mainJs,
        'stores/settings.js': settingsStore,
        'App.vue': settingsApp,
        'SettingsPanel.vue': panelStarter,
        'Preview.vue': previewVue,
      },
      hints: [
        'Destructuring copied the values out of the store. `storeToRefs(settings)` gives refs that `v-model` can read and write.',
        '`settings.$patch({ theme: \'dark\', fontSize: 18 })` applies both changes as one mutation.',
        'This is an option store, so `settings.$reset()` is available.',
      ],
      solution: {
        explanation: '`storeToRefs` turned the copies into refs linked to the store, so `v-model` writes back into it and `Preview` updates. `$patch` applies both preset values as a single mutation (one subscriber call, one devtools entry). `$reset()` calls the store\'s `state()` again — a built-in that only option stores have.',
        files: {
          'main.js': mainJs,
          'stores/settings.js': settingsStore,
          'App.vue': settingsApp,
          'SettingsPanel.vue': panelSolution,
          'Preview.vue': previewVue,
        },
      },
      tests: [
        { name: 'starts with the defaults', code: `expect(text('.preview')).toBe('light · 16px')` },
        {
          name: 'the theme select updates the store',
          code: `await select('.theme-select', 'dark')
expect(text('.preview')).toBe('dark · 16px')`,
        },
        {
          name: 'the font size input updates the store',
          code: `await type('.font-size', '20')
expect(text('.preview')).toBe('light · 20px')`,
        },
        {
          name: 'the dark preset uses a single $patch',
          code: `const { useSettingsStore } = requireModule('stores/settings.js')
const settings = useSettingsStore()
const types = []
settings.$subscribe((mutation) => types.push(mutation.type), { flush: 'sync' })
await click('.preset-dark')
expect(text('.preview')).toBe('dark · 18px')
expect(types).toHaveLength(1)
expect(types[0]).toMatch(/patch/)`,
        },
        {
          name: 'reset restores the initial state',
          code: `await select('.theme-select', 'dark')
await type('.font-size', '22')
await click('.reset')
expect(text('.preview')).toBe('light · 16px')`,
        },
      ],
    },
    {
      id: 'checkout-toasts',
      title: 'Checkout toasts with $onAction',
      difficulty: 'intermediate',
      prompt: `
The cart store has an async \`checkout()\` action that calls a fake server (\`api.js\`) and rejects when the cart is empty. A separate toast store shows messages in \`ToastList.vue\`.

In \`App.vue\`, use \`cart.$onAction()\` so that, **only for the \`checkout\` action**:

- on success, a toast with kind \`'success'\` and text \`Order #<orderId> placed\` is pushed (the action resolves with the order id);
- on failure, a toast with kind \`'error'\` and the error's \`message\` is pushed.

Each toast renders as \`<li class="toast success">\` or \`<li class="toast error">\`. Other actions (\`add\`) must not create toasts. Don't change the stores.
`,
      files: {
        'main.js': mainJs,
        'api.js': checkoutApi,
        'stores/cart.js': checkoutCart,
        'stores/toasts.js': toastStore,
        'App.vue': checkoutAppStarter,
        'ToastList.vue': toastList,
      },
      hints: [
        '`cart.$onAction(({ name, after, onError }) => { … })` runs before every action. Return early when `name !== \'checkout\'`.',
        'Inside, register `after((orderId) => …)` for success and `onError((error) => …)` for failure.',
        'Use the toast store\'s action: `toasts.push(\\`Order #\\${orderId} placed\\`, \'success\')`.',
      ],
      solution: {
        explanation: '`$onAction` lets one place react to how an action ends without editing the action itself. For async actions, `after` waits for the promise to resolve (receiving its value) and `onError` catches the rejection. The listener lives in `App.vue`, so it is removed automatically if App unmounts.',
        files: {
          'main.js': mainJs,
          'api.js': checkoutApi,
          'stores/cart.js': checkoutCart,
          'stores/toasts.js': toastStore,
          'App.vue': checkoutAppSolution,
          'ToastList.vue': toastList,
        },
      },
      tests: [
        {
          name: 'empty checkout shows an error toast',
          code: `await click('.checkout')
await wait(150)
expect(exists('.toast.error')).toBe(true)
expect(text('.toast.error')).toContain('Your cart is empty')`,
        },
        {
          name: 'successful checkout shows a success toast with the order id',
          code: `await click('.add')
await click('.checkout')
await wait(150)
expect(exists('.toast.success')).toBe(true)
expect(text('.toast.success')).toContain('Order #1001 placed')
expect(text('.items')).toBe('0 item(s)')`,
        },
        {
          name: 'other actions do not create toasts',
          code: `await click('.add')
await click('.add')
await wait(80)
expect(findAll('.toast')).toHaveLength(0)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'using-stores-destructure',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'A teammate writes `const { user, isLoggedIn } = useAuthStore()` and the navbar never updates after login. Why, and how do you fix it?',
      answer: 'The store is a reactive object; destructuring reads `user` and `isLoggedIn` once and stores plain values, cutting the reactive connection. Use `const { user, isLoggedIn } = storeToRefs(useAuthStore())`, or keep `const auth = useAuthStore()` and read `auth.isLoggedIn`. Actions can be destructured directly.',
      explanation: 'Reactivity works through property access on the proxy. Local variables holding plain values can\'t be tracked.',
      whyAsked: 'The single most common Pinia bug — interviewers expect an instant answer.',
      mistakes: ['Suggesting `toRefs` without knowing `storeToRefs` exists.', 'Saying actions must also go through `storeToRefs`.', 'Blaming the login action.'],
      followUps: ['Why does `storeToRefs` skip actions?', 'Is `toRefs(store)` wrong?'],
      modelAnswer: 'Pinia stores are reactive objects, so destructuring them copies the current values into plain variables — the navbar keeps the logged-out snapshot. I would use `storeToRefs` for state and getters, which returns refs linked to the store, and destructure actions from the store directly since they\'re bound functions. Alternatively I just keep the store object and read `auth.isLoggedIn` in the template.',
    },
    {
      id: 'using-stores-patch',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `store.a = 1; store.b = 2`, `store.$patch({ a: 1, b: 2 })`, `store.$patch((s) => { … })` and calling an action.',
      answer: 'Direct assignment works and is batched for rendering, but each change is a separate `direct` mutation for subscribers and devtools. `$patch(object)` deep-merges and notifies subscribers once with `patch object` (arrays are replaced, not merged). `$patch(fn)` runs a synchronous mutator — best for arrays and conditional changes — and notifies once with `patch function`. An action wraps business logic and is observable with `$onAction`; it is the default for anything with rules.',
      explanation: 'All four end up changing the same reactive state; they differ in grouping, observability and where the logic lives.',
      whyAsked: 'Tests whether you know Pinia beyond basic actions and can pick the right tool.',
      mistakes: ['Claiming direct mutation is forbidden in Pinia.', 'Not knowing arrays are replaced by object patches.', 'Using `$patch` with an async function.'],
      followUps: ['Why must `$patch(fn)` be synchronous?', 'What does `mutation.payload` contain?'],
      modelAnswer: 'Direct assignment is allowed and re-renders are batched, but subscribers and devtools see separate direct mutations. `$patch` with an object deep-merges and reports one `patch object` mutation with the payload, though arrays are replaced. `$patch` with a function is for arrays and conditional logic, must be synchronous, and reports one `patch function`. Actions are where rules live and they are visible to `$onAction`, so for anything non-trivial I call an action — which may itself use `$patch` inside.',
    },
    {
      id: 'using-stores-subscribe-vs-watch',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'When would you use `store.$subscribe()` instead of `watch(() => store.items, …, { deep: true })`?',
      answer: '`$subscribe` watches the store\'s whole state and tells you *how* it changed (`mutation.type`, `storeId`, the patch payload), fires once per `$patch`, can be detached from the component, and is the conventional hook for persistence and syncing. `watch` is better for a component reacting to one specific value, with full control over the source and options like `immediate` and `once` (3.4+).',
      explanation: '`$subscribe` is built on a deep watch of the store state plus direct patch notifications, with Pinia-specific metadata.',
      whyAsked: 'Distinguishes candidates who understand Pinia\'s subscription model from those who only know component watchers.',
      mistakes: ['Saying they are identical.', 'Forgetting `$subscribe` is removed on unmount unless detached.', 'Using `$subscribe` for UI logic that depends on one field.'],
      followUps: ['What does `flush` do for `$subscribe`?', 'How would you debounce persistence writes?'],
      modelAnswer: 'Both are watchers under the hood, but `$subscribe` is store-level: it observes the whole state, gives me the mutation type and payload, groups each `$patch` into one call, and can be detached so it survives component unmounts — ideal for persisting or syncing a store. A regular `watch` is more precise: one source, options like immediate or once, and it belongs to the component. So I use `$subscribe` for infrastructure and `watch` for component behaviour.',
    },
    {
      id: 'using-stores-outside-components',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Your route guard file does `const auth = useAuthStore()` at the top and the app crashes on startup with "getActivePinia() was called but there was no active Pinia". Explain and fix.',
      answer: 'Top-level code runs when `router.js` is imported, which happens before `app.use(pinia)` in `main.js`. There is no active Pinia yet. Move `useAuthStore()` inside the `beforeEach` callback: navigation happens after the app (and Pinia) is installed. In SSR, pass the pinia instance explicitly when outside components.',
      explanation: 'Stores find their Pinia through the component tree or the active Pinia; module top-level code has neither yet.',
      code: {
        lang: 'js',
        code: `router.beforeEach((to) => {
  const auth = useAuthStore() // inside the guard
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})`,
      },
      whyAsked: 'Auth guards are everywhere; this error is a rite of passage.',
      mistakes: ['Moving `app.use(pinia)` around randomly without understanding import order.', 'Claiming the guard secures the API — it only controls navigation.'],
      followUps: ['How do you use a store in a plain helper module?', 'What changes with SSR?'],
      modelAnswer: 'Imports are evaluated before `main.js` reaches `app.use(pinia)`, so calling the store at the top of `router.js` happens with no active Pinia. Moving the call into the guard defers it until a navigation actually runs, by which point Pinia is installed. I would also remind the team that the guard only improves UX — the backend must still authorise every request. With SSR I would pass the request\'s pinia to `useAuthStore(pinia)` explicitly.',
    },
    {
      id: 'using-stores-composition',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'Your cart store needs prices from the products store, and the products store wants to show "in your cart" badges using the cart. How do you structure this without a circular dependency problem?',
      answer: 'Keep dependencies one-directional where possible: the cart reads products (prices), and "in cart" is computed in the cart store (e.g. `isInCart(id)`) or in the component, which can use both stores. If both stores truly need each other, never read each other\'s state directly in both setup functions — call the other store inside getters or actions, which run later. Or extract the shared concern into a third store.',
      explanation: 'Pinia supports stores using each other, but two setup functions reading each other\'s state at creation time is a cycle.',
      whyAsked: 'Architecture question about store boundaries in growing apps.',
      mistakes: ['Merging everything into one giant store.', 'Duplicating prices into the cart.', 'Letting one store mutate another store\'s state directly.'],
      followUps: ['Where should "add to cart" validation (stock) live?', 'How would you test the cart store in isolation?'],
      modelAnswer: 'I would keep the arrow pointing one way: the cart depends on products for prices, and products knows nothing about the cart. "Is this in the cart?" becomes a cart getter, and components that show product cards use both stores. If a real two-way need appears, I make sure neither setup function reads the other\'s state immediately — the access goes inside getters or actions — or I extract the shared piece into a third store. Each store changes only its own state and calls the other store\'s actions when needed.',
    },
    {
      id: 'using-stores-onaction-reporting',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 3,
      question: 'Product wants every failed store action reported to an error-tracking service, with the action name and arguments. How would you implement it without editing every action?',
      answer: 'Register an `$onAction` listener for each store — ideally in a Pinia plugin so it applies to all stores automatically. In the listener, use `onError((error) => report({ store: store.$id, action: name, args, error }))`. Scrub sensitive arguments (passwords, tokens) before sending.',
      explanation: '`$onAction` sees every action call, including async rejections, so cross-cutting concerns live in one place.',
      code: {
        lang: 'js',
        code: `// plugins/errorReporting.js (simplified)
export function errorReporting({ store }) {
  store.$onAction(({ name, args, onError }) => {
    onError((error) => {
      reportError({ store: store.$id, action: name, args: scrub(args), message: error.message })
    })
  })
}

// main.js
pinia.use(errorReporting)`,
      },
      whyAsked: 'Shows you can design cross-cutting infrastructure instead of copy-paste.',
      mistakes: ['Wrapping every action body in try/catch manually.', 'Sending raw arguments that may include passwords.', 'Forgetting async rejections.'],
      followUps: ['How would you measure action duration?', 'How do plugins receive the store?'],
      modelAnswer: 'I would write a small Pinia plugin that calls `store.$onAction` for every store. In the listener I register `onError`, which fires for thrown errors and rejected promises, and report the store id, action name, sanitised arguments and message. Because it is a plugin, new stores get it for free and no action needs try/catch boilerplate. The same hook with `after` can time actions for performance monitoring.',
    },
    {
      id: 'using-stores-coding-reset',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'The filter store is a **setup store**, so `$reset()` isn\'t available. Add a `reset()` action that restores `query: \'\'`, `category: \'all\'` and `inStockOnly: false`. The `.reset` button already calls `filters.reset()`.',
      starter: {
        files: {
          'main.js': mainJs,
          'stores/filters.js': filtersStarter,
          'App.vue': filtersApp,
        },
      },
      tests: [
        { name: 'starts with defaults', code: `expect(text('.summary')).toBe('∅ | all | false')` },
        {
          name: 'reset restores every filter',
          code: `await type('.query', 'zelda')
await select('.category', 'games')
await check('.in-stock', true)
expect(text('.summary')).toBe('zelda | games | true')
await click('.reset')
expect(text('.summary')).toBe('∅ | all | false')`,
        },
        {
          name: 'reset() is an action on the store',
          code: `const { useFilterStore } = requireModule('stores/filters.js')
const f = useFilterStore()
f.query = 'x'
f.reset()
expect(f.query).toBe('')
expect(f.category).toBe('all')
expect(f.inStockOnly).toBe(false)`,
        },
      ],
      hints: ['Write a function inside the setup store that assigns each ref\'s `.value`, and return it.', 'To keep the defaults in one place, build them from an `initialState()` function used both for the refs and for reset.'],
      answer: 'Add a `reset()` function that sets each ref back to its initial value (ideally from a shared `initialState()` function) and return it from the setup store.',
      solution: {
        files: {
          'main.js': mainJs,
          'stores/filters.js': filtersSolution,
          'App.vue': filtersApp,
        },
      },
      explanation: 'Setup stores have no `state()` function for Pinia to call again, so reset must be written by hand. Building both the initial refs and the reset from one `initialState()` function stops them drifting apart when someone adds a filter.',
      whyAsked: 'Checks that you know the option/setup difference in practice, not just in theory.',
      mistakes: ['Calling `filters.$reset()` anyway.', 'Reassigning the refs themselves (`query = ref(\'\')`) instead of their `.value`.', 'Duplicating defaults in two places.'],
      followUps: ['Could you name it `$reset`?', 'How would you reset every store on logout?'],
      modelAnswer: 'Because it is a setup store, Pinia has no initial-state function to call, so I add a `reset` action that writes each ref\'s `.value` back to its default. I keep the defaults in one `initialState()` function used both to create the refs and inside reset, so adding a filter later can\'t make them drift. The Pinia docs even name such a function `$reset`, which keeps the API consistent with option stores.',
    },
  ],

  takeaways: [
    'Never destructure state or getters directly — use `storeToRefs()` or read through the store.',
    'Destructure actions from the store itself; `storeToRefs()` skips them.',
    '`$patch` groups several changes into one mutation; use the function form for arrays, and keep it synchronous.',
    '`$reset()` is built into option stores only; setup stores need their own reset.',
    '`$subscribe` observes state changes (persistence, sync); `$onAction` observes actions and their outcome (toasts, reporting).',
    'Stores can use other stores; keep dependencies one-directional and call stores inside functions outside components.',
  ],
}
