// Lesson: Feature-based project structure (Level 15 — Vue Project Architecture)

const productionTree = `src/
├── main.js                    # entry: createApp(App), install plugins, mount
├── app/
│   ├── App.vue                # app shell: picks the layout, renders <RouterView>
│   └── errorHandling.js       # app.config.errorHandler + reporting setup
├── router/
│   ├── index.js               # createRouter(), history mode, global guards
│   └── routes.js              # the route table — pages are lazy-loaded
├── plugins/
│   └── i18n.js                # one file per app-wide plugin
├── config/
│   └── env.js                 # reads import.meta.env once and validates it
├── layouts/
│   ├── DefaultLayout.vue      # header + sidebar + <slot /> for the page
│   └── AuthLayout.vue         # centred card for login / sign-up
├── pages/                     # one thin component per route ("views/" elsewhere)
│   ├── HomePage.vue
│   ├── ProductPage.vue
│   ├── CheckoutPage.vue
│   └── NotFoundPage.vue
├── features/
│   ├── cart/
│   │   ├── components/
│   │   │   ├── CartList.vue
│   │   │   └── CartListItem.vue
│   │   ├── composables/
│   │   │   └── useCartTotals.js
│   │   ├── stores/
│   │   │   └── cartStore.js   # export const useCartStore = defineStore(…)
│   │   ├── services/
│   │   │   └── cartApi.js     # cart endpoints, built on services/http.js
│   │   └── index.js           # PUBLIC API — the only file others may import
│   ├── catalog/               # same shape as cart/
│   └── checkout/              # same shape as cart/
├── shared/
│   ├── ui/                    # BaseButton.vue, BaseInput.vue, BaseModal.vue …
│   ├── composables/           # useDebounce.js, useMediaQuery.js …
│   └── utils/                 # formatPrice.js, dates.js … (plain functions)
├── services/
│   └── http.js                # the one fetch wrapper: base URL, headers, errors
├── stores/
│   └── sessionStore.js        # truly global state: current user, preferences
└── assets/
    ├── styles/                # tokens.css, base.css
    └── images/
tests/
├── unit/                      # or colocate CartList.spec.js next to CartList.vue
└── e2e/                       # whole-app journeys in a real browser`

const typeBasedTree = `src/
├── components/
│   ├── CartList.vue
│   ├── CartListItem.vue
│   ├── ProductCard.vue
│   ├── ProductGrid.vue
│   ├── CheckoutForm.vue
│   └── BaseButton.vue
├── composables/
│   ├── useCart.js
│   ├── useProducts.js
│   └── useCheckout.js
├── stores/
│   ├── cart.js
│   └── products.js
└── services/
    ├── cartApi.js
    └── productsApi.js`

const featureBasedTree = `src/
├── features/
│   ├── cart/
│   │   ├── components/  CartList.vue, CartListItem.vue
│   │   ├── composables/ useCart.js
│   │   ├── stores/      cartStore.js
│   │   ├── services/    cartApi.js
│   │   └── index.js
│   ├── catalog/
│   │   ├── components/  ProductCard.vue, ProductGrid.vue
│   │   ├── services/    productsApi.js
│   │   └── index.js
│   └── checkout/
│       └── …
└── shared/
    └── ui/              BaseButton.vue`

// ---------------------------------------------------------------- playground

const appVue = `<script setup>
import DefaultLayout from './layouts/DefaultLayout.vue'
import ShopPage from './pages/ShopPage.vue'
import { useCart } from './features/cart/index.js'

// The app shell only talks to a feature through its public index.js
const { count } = useCart()
</script>

<template>
  <DefaultLayout>
    <template #header>
      <strong>Vue/Zero Shop</strong>
      <span class="cart-count">Cart: {{ count }}</span>
    </template>

    <ShopPage />
  </DefaultLayout>
</template>`

const defaultLayoutVue = `<script setup>
// A layout is the frame around a page: header, main area, (footer…).
// It knows nothing about products or carts — it only offers slots.
</script>

<template>
  <div class="layout-default">
    <header class="layout-header">
      <slot name="header" />
    </header>
    <main class="layout-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout-header {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 2px solid currentColor;
}
.layout-main {
  display: grid;
  gap: 1rem;
  padding: 0.75rem;
}
</style>`

const shopPageVue = `<script setup>
// A page is a thin route-level component: it COMPOSES features.
import { ProductGrid } from '../features/catalog/index.js'
import { CartList } from '../features/cart/index.js'
</script>

<template>
  <ProductGrid />
  <CartList />
</template>`

const catalogIndexJs = `// Public API of the catalog feature.
// Code outside features/catalog/ imports from HERE, never from deeper files.
export { default as ProductGrid } from './components/ProductGrid.vue'`

const productGridVue = `<script setup>
import { ref, onMounted } from 'vue'
import BaseButton from '../../../shared/ui/BaseButton.vue'
import { formatPrice } from '../../../shared/utils/formatPrice.js'
import { fetchProducts } from '../services/productsApi.js'
// ⚠ Boundary violation: the catalog reaches into the cart's internals.
import { useCart } from '../../cart/composables/useCart.js'

const { add } = useCart()
const products = ref([])
const loading = ref(true)

onMounted(async () => {
  products.value = await fetchProducts()
  loading.value = false
})
</script>

<template>
  <section class="catalog">
    <h2>Products</h2>
    <p v-if="loading" class="loading">Loading products…</p>
    <ul v-else>
      <li v-for="product in products" :key="product.id" class="product">
        <span class="product-name">{{ product.name }}</span>
        <span v-if="product.onSale" class="sale">Sale</span>
        <span class="product-price">{{ formatPrice(product.price) }}</span>
        <BaseButton class="add-to-cart" @click="add(product)">Add</BaseButton>
      </li>
    </ul>
  </section>
</template>`

const productsApiJs = `import { http } from '../../../services/http.js'

// The catalog's own endpoints. Components call this, never http directly.
export function fetchProducts() {
  return http.get('/products')
}`

const cartIndexJs = `// Public API of the cart feature.
export { default as CartList } from './components/CartList.vue'
export { useCart } from './composables/useCart.js'`

const useCartJs = `import { ref, computed } from 'vue'

// Module-level state: every caller of useCart() shares ONE cart.
// Simplified — a real app would usually keep this in a Pinia store
// (features/cart/stores/cartStore.js) for devtools, SSR safety and testing.
const items = ref([])

export function useCart() {
  const count = computed(() => items.value.reduce((sum, item) => sum + item.qty, 0))
  const total = computed(() => items.value.reduce((sum, item) => sum + item.qty * item.price, 0))

  function add(product) {
    const line = items.value.find((item) => item.id === product.id)
    if (line) line.qty++
    else items.value.push({ id: product.id, name: product.name, price: product.price, qty: 1 })
  }

  function remove(id) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  return { items, count, total, add, remove }
}`

const cartListVue = `<script setup>
import BaseButton from '../../../shared/ui/BaseButton.vue'
import { useCart } from '../composables/useCart.js'

const { items, total, remove } = useCart()
</script>

<template>
  <section class="cart">
    <h2>Cart</h2>
    <p v-if="!items.length" class="cart-empty">Your cart is empty.</p>
    <ul v-else>
      <li v-for="item in items" :key="item.id" class="cart-line">
        {{ item.name }} × {{ item.qty }}
        <BaseButton variant="ghost" class="remove" @click="remove(item.id)">Remove</BaseButton>
      </li>
    </ul>
    <p class="cart-total">Total: {{ total }}</p>
  </section>
</template>`

const baseButtonVue = `<script setup>
// "Base" prefix = an app-wide, feature-agnostic building block.
defineProps({
  variant: { type: String, default: 'primary' },
})
</script>

<template>
  <!-- class and @click from the parent fall through to this <button> -->
  <button type="button" class="base-button" :class="'base-button--' + variant">
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  font: inherit;
  padding: 0.2rem 0.6rem;
  border: 2px solid currentColor;
  border-radius: 6px;
  cursor: pointer;
}
.base-button--primary { background: #1f3fbf; color: white; border-color: #1f3fbf; }
.base-button--ghost { background: transparent; }
</style>`

const baseBadgeVue = `<!-- TODO (experiment 2): turn this into a reusable badge.
     Give the root element class="base-badge" and render the default slot. -->
<template>
  <span><slot /></span>
</template>`

const formatPriceJs = `// A plain function: no Vue, no knowledge of any feature.
// That is exactly what makes it safe to live in shared/.
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatPrice(amount) {
  return usd.format(amount)
}`

const httpJs = `// A fake HTTP client so this sandbox needs no network.
// In a real app this file wraps fetch(): base URL, headers, error mapping.
const fakeServer = {
  '/products': [
    { id: 1, name: 'Mechanical keyboard', price: 89, onSale: false },
    { id: 2, name: 'USB-C cable', price: 9.5, onSale: true },
    { id: 3, name: 'Laptop stand', price: 34, onSale: false },
  ],
}

export const http = {
  get(url) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (url in fakeServer) resolve(fakeServer[url].map((row) => ({ ...row })))
        else reject(new Error('404 Not Found: ' + url))
      }, 100)
    })
  },
}`

const playgroundFiles = {
  'App.vue': appVue,
  'layouts/DefaultLayout.vue': defaultLayoutVue,
  'pages/ShopPage.vue': shopPageVue,
  'features/catalog/index.js': catalogIndexJs,
  'features/catalog/components/ProductGrid.vue': productGridVue,
  'features/catalog/services/productsApi.js': productsApiJs,
  'features/cart/index.js': cartIndexJs,
  'features/cart/composables/useCart.js': useCartJs,
  'features/cart/components/CartList.vue': cartListVue,
  'shared/ui/BaseButton.vue': baseButtonVue,
  'shared/ui/BaseBadge.vue': baseBadgeVue,
  'shared/utils/formatPrice.js': formatPriceJs,
  'services/http.js': httpJs,
}

// ---------------------------------------------------------------- exercise 1

const todosStarterApp = `<script setup>
// Everything lives in App.vue today. Move it into features/todos/.
import { ref, computed } from 'vue'

const todos = ref([
  { id: 1, text: 'Sketch the folder tree', done: true },
  { id: 2, text: 'Move the todo logic into a feature', done: false },
])
const draft = ref('')
const remaining = computed(() => todos.value.filter((t) => !t.done).length)

function addTodo(text) {
  const clean = text.trim()
  if (!clean) return
  todos.value.push({ id: Date.now(), text: clean, done: false })
}

function toggleTodo(id) {
  const todo = todos.value.find((t) => t.id === id)
  if (todo) todo.done = !todo.done
}

function submit() {
  addTodo(draft.value)
  draft.value = ''
}
</script>

<template>
  <h1>Todos</h1>
  <form @submit.prevent="submit">
    <input v-model="draft" class="new-todo" placeholder="What needs doing?" />
    <button>Add</button>
  </form>
  <ul>
    <li v-for="todo in todos" :key="todo.id" class="todo" :class="{ done: todo.done }">
      <label>
        <input type="checkbox" class="toggle" :checked="todo.done" @change="toggleTodo(todo.id)" />
        {{ todo.text }}
      </label>
    </li>
  </ul>
  <p class="remaining">{{ remaining }} left</p>
</template>`

const todosStarterIndex = `// TODO: export this feature's public API:
//   TodoList (default export of ./components/TodoList.vue)
//   useTodos (from ./composables/useTodos.js)
export {}`

const todosStarterComposable = `import { ref, computed } from 'vue'

// TODO: move the todo state and functions here.
// Return { todos, remaining, addTodo, toggleTodo }.
export function useTodos() {
}`

const todosStarterList = `<script setup>
// TODO: receive \`todos\` as a prop, emit 'toggle' with the todo id.
</script>

<template>
  <ul></ul>
</template>`

const todosSolutionApp = `<script setup>
import { ref } from 'vue'
import { TodoList, useTodos } from './features/todos/index.js'

const { todos, remaining, addTodo, toggleTodo } = useTodos()
const draft = ref('')

function submit() {
  addTodo(draft.value)
  draft.value = ''
}
</script>

<template>
  <h1>Todos</h1>
  <form @submit.prevent="submit">
    <input v-model="draft" class="new-todo" placeholder="What needs doing?" />
    <button>Add</button>
  </form>
  <TodoList :todos="todos" @toggle="toggleTodo" />
  <p class="remaining">{{ remaining }} left</p>
</template>`

const todosSolutionIndex = `export { default as TodoList } from './components/TodoList.vue'
export { useTodos } from './composables/useTodos.js'`

const todosSolutionComposable = `import { ref, computed } from 'vue'

export function useTodos() {
  const todos = ref([
    { id: 1, text: 'Sketch the folder tree', done: true },
    { id: 2, text: 'Move the todo logic into a feature', done: false },
  ])
  const remaining = computed(() => todos.value.filter((t) => !t.done).length)

  function addTodo(text) {
    const clean = text.trim()
    if (!clean) return
    todos.value.push({ id: Date.now(), text: clean, done: false })
  }

  function toggleTodo(id) {
    const todo = todos.value.find((t) => t.id === id)
    if (todo) todo.done = !todo.done
  }

  return { todos, remaining, addTodo, toggleTodo }
}`

const todosSolutionList = `<script setup>
defineProps({
  todos: { type: Array, required: true },
})
const emit = defineEmits(['toggle'])
</script>

<template>
  <ul>
    <li v-for="todo in todos" :key="todo.id" class="todo" :class="{ done: todo.done }">
      <label>
        <input type="checkbox" class="toggle" :checked="todo.done" @change="emit('toggle', todo.id)" />
        {{ todo.text }}
      </label>
    </li>
  </ul>
</template>`

// ---------------------------------------------------------------- exercise 2

const layoutsMain = `import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'

createApp(App).use(router).mount('#app')`

const layoutsRouter = `import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import SettingsPage from '../pages/SettingsPage.vue'

// createMemoryHistory() because the sandbox has no real URL bar.
// A real app uses createWebHistory() and lazy imports: () => import('../pages/…')
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/login', component: LoginPage, meta: { layout: 'auth' } },
    { path: '/settings', component: SettingsPage },
  ],
})

export default router`

const layoutsFiles = {
  'main.js': layoutsMain,
  'router/index.js': layoutsRouter,
  'layouts/DefaultLayout.vue': `<template>
  <div class="layout-default">
    <header class="app-header">Vue/Zero · <RouterLink to="/">Home</RouterLink> · <RouterLink to="/settings">Settings</RouterLink></header>
    <main><slot /></main>
  </div>
</template>`,
  'layouts/AuthLayout.vue': `<template>
  <div class="layout-auth">
    <main class="auth-card"><slot /></main>
  </div>
</template>`,
  'pages/HomePage.vue': `<template>
  <h1 class="page-title">Home</h1>
</template>`,
  'pages/LoginPage.vue': `<template>
  <h1 class="page-title">Log in</h1>
  <p>Please sign in to continue.</p>
</template>`,
  'pages/SettingsPage.vue': `<template>
  <h1 class="page-title">Settings</h1>
</template>`,
}

// ---------------------------------------------------------------- interview coding

const durationStarter = {
  'App.vue': `<script setup>
import { PlaylistView } from './features/playlist/index.js'
import { NowPlaying } from './features/player/index.js'
</script>

<template>
  <NowPlaying />
  <PlaylistView />
</template>`,
  'features/playlist/index.js': `export { default as PlaylistView } from './components/PlaylistView.vue'`,
  'features/playlist/utils/formatDuration.js': `// Turns 65 into "1:05". Lives inside the playlist feature… for now.
export function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return minutes + ':' + seconds
}`,
  'features/playlist/components/PlaylistView.vue': `<script setup>
import { formatDuration } from '../utils/formatDuration.js'

const tracks = [
  { id: 1, title: 'Intro', seconds: 65 },
  { id: 2, title: 'Long Drive', seconds: 600 },
]
</script>

<template>
  <ul>
    <li v-for="track in tracks" :key="track.id" class="track">
      {{ track.title }} <span class="track-duration">{{ formatDuration(track.seconds) }}</span>
    </li>
  </ul>
</template>`,
  'features/player/index.js': `export { default as NowPlaying } from './components/NowPlaying.vue'`,
  'features/player/components/NowPlaying.vue': `<script setup>
// ⚠ Deep import into another feature's private utils folder.
import { formatDuration } from '../../playlist/utils/formatDuration.js'

const elapsed = 5
</script>

<template>
  <p class="now-playing">Now playing — <span class="now-playing-time">{{ formatDuration(elapsed) }}</span></p>
</template>`,
  'shared/utils/formatDuration.js': `// TODO: move formatDuration here so every feature can use it.
export function formatDuration(totalSeconds) {
}`,
}

const durationSolution = {
  'App.vue': durationStarter['App.vue'],
  'features/playlist/index.js': durationStarter['features/playlist/index.js'],
  'features/playlist/components/PlaylistView.vue': `<script setup>
import { formatDuration } from '../../../shared/utils/formatDuration.js'

const tracks = [
  { id: 1, title: 'Intro', seconds: 65 },
  { id: 2, title: 'Long Drive', seconds: 600 },
]
</script>

<template>
  <ul>
    <li v-for="track in tracks" :key="track.id" class="track">
      {{ track.title }} <span class="track-duration">{{ formatDuration(track.seconds) }}</span>
    </li>
  </ul>
</template>`,
  'features/player/index.js': durationStarter['features/player/index.js'],
  'features/player/components/NowPlaying.vue': `<script setup>
import { formatDuration } from '../../../shared/utils/formatDuration.js'

const elapsed = 5
</script>

<template>
  <p class="now-playing">Now playing — <span class="now-playing-time">{{ formatDuration(elapsed) }}</span></p>
</template>`,
  'shared/utils/formatDuration.js': `// Shared, pure, feature-agnostic: 65 -> "1:05"
export function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = String(safe % 60).padStart(2, '0')
  return minutes + ':' + seconds
}`,
}

export default {
  id: 'project-structure',
  title: 'Feature-based project structure',
  summary: 'Organise a growing Vue app by feature — pages, layouts, features with public APIs and a shared layer — so code stays findable, deletable and safe to change.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['single-file-components', 'es-modules', 'composables-intro', 'router-basics'],
  related: ['service-layers', 'design-patterns', 'error-handling', 'lazy-routes-scroll', 'bundle-optimization', 'pinia-basics'],
  tags: ['architecture', 'folder structure', 'feature folders', 'pages', 'layouts', 'naming conventions', 'dependency boundaries', 'code splitting', 'barrel files', 'shared'],
  apis: [
    { name: 'features/<name>/index.js', summary: 'A feature\'s public API: the only file other parts of the app may import from.' },
    { name: 'meta.layout', summary: 'A route meta field (Vue Router) an app shell can read to choose a layout component.' },
    { name: '() => import(\'./Page.vue\')', summary: 'A dynamic import used as a lazy route component; the bundler splits it into its own chunk.' },
  ],
  docs: [
    { label: 'Vue Style Guide (naming rules)', url: 'https://vuejs.org/style-guide/' },
    { label: 'Vue Guide — Composables (naming convention)', url: 'https://vuejs.org/guide/reusability/composables.html' },
    { label: 'Vue Router — Lazy Loading Routes', url: 'https://router.vuejs.org/guide/advanced/lazy-loading.html' },
    { label: 'Pinia — Defining a Store', url: 'https://pinia.vuejs.org/core-concepts/' },
    { label: 'Vite — Performance (avoid barrel files)', url: 'https://vite.dev/guide/performance.html' },
  ],

  intro: `
*Project structure* is the answer to a boring-sounding question with big consequences: **where does each file live?**

A **feature-based** structure groups code by what it does for the user — \`features/cart/\`, \`features/catalog/\`, \`features/checkout/\` — instead of by what kind of file it is (\`components/\`, \`stores/\`, \`services/\`). Around those features sit a few app-wide layers: **pages** (one component per route), **layouts** (the frame around a page), **shared** (truly generic building blocks) and the **app shell** that wires it all together.

The rule that makes it work: each feature exposes a small **public API** (its \`index.js\`), and the rest of the app imports only from there.
`,

  why: `
Every Vue project starts tidy. With five components, *any* structure works. The pain arrives later, quietly:

- \`components/\` grows to 140 files and nobody knows which ones the checkout uses.
- Changing \`ProductCard.vue\` breaks the wishlist, because the wishlist imported it from deep inside the catalog.
- Deleting an old feature is scary: its pieces are scattered across five folders, mixed in with everything else.
- Two teams edit the same \`stores/\` folder all day and keep stepping on each other.

A feature-based structure exists so that **code that changes together lives together**. When the product manager says "change how the cart works", you open one folder. When the company drops a feature, you delete one folder. When a new developer joins, the folder names read like the product's menu.

Folders are for humans — Vite and the browser don't care where files live. That's exactly why it's worth designing them for the humans who'll maintain the app.
`,

  eli15: `
Think about your bedroom versus a supermarket.

In a messy bedroom everything is sorted by *type*: all the cables in one drawer, all the papers in another. Fine for one person — but to pack for a football match you open six drawers to collect your boots, socks, shin pads and water bottle.

A supermarket is sorted by *what people want to do*: a breakfast aisle, a baking aisle, a cleaning aisle. Everything for one job sits together.

A feature-based Vue project is the supermarket. Everything for "the cart" — its components, its logic, its data loading — sits in \`features/cart/\`. And each aisle has **one entrance** (\`index.js\`): other parts of the app walk in through the front, they don't climb over the shelves.

The few things *everyone* needs — buttons, price formatting — go in a \`shared/\` aisle near the door.
`,

  analogy: {
    title: 'The supermarket floor plan',
    body: `
A well-run supermarket has **aisles by purpose** (breakfast, baking, cleaning), a **front entrance per department** with a sign, **shared infrastructure** everyone uses (trolleys, tills, lighting) and a **floor plan** at the door telling you where things are.

Nobody stocks the bakery by walking through the freezer room. Staff from one department don't rearrange another department's shelves. And when the store stops selling DVDs, it removes one aisle — nothing else moves.
`,
    mapping: [
      ['an aisle (bakery, dairy)', 'a feature folder: `features/cart/`'],
      ['the aisle\'s signposted entrance', 'the feature\'s public `index.js`'],
      ['the back storeroom of an aisle', 'a feature\'s internal files — private to it'],
      ['trolleys, tills, lighting', '`shared/ui`, `shared/utils`, `services/http.js`'],
      ['the store layout around the aisles', 'layouts: header, sidebar, footer frame'],
      ['a shopping trip (breakfast)', 'a page: composes several features for one route'],
      ['the floor plan at the door', '`router/` + the app shell (`App.vue`)'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'Sorted by type vs sorted by feature',
    props: {
      left: { label: 'Type-based (fine for small apps)', lang: 'text', code: typeBasedTree },
      right: { label: 'Feature-based (scales with the product)', lang: 'text', code: featureBasedTree },
      points: [
        'Type-based: to change the cart you touch components/, composables/, stores/ and services/ — four folders, each mixed with unrelated files.',
        'Feature-based: everything the cart needs sits under features/cart/. Change it, test it, or delete it in one place.',
        'Feature-based adds an index.js per feature: the public entrance other code imports from.',
        'Both keep truly generic pieces (BaseButton) in one shared place.',
        'Type-based is perfectly reasonable for a small app or a prototype — structure should grow with the codebase.',
      ],
    },
    caption: 'The same e-commerce app, two ways. Neither is "wrong"; they optimise for different sizes.',
    alt: 'Two folder trees side by side. Left, type-based: components, composables, stores and services folders, each containing files from cart, catalog and checkout mixed together. Right, feature-based: a features folder with cart, catalog and checkout subfolders, each holding its own components, composables, stores, services and an index.js, plus a shared/ui folder containing BaseButton.',
  },

  syntax: [
    `
#### The layers and the one-way rule

A scalable Vue app usually has these layers. **Imports only point downwards** in this list:
`,
    {
      code: `app shell   main.js, App.vue, router/, plugins/, config/   ← wires everything together
   ↓
pages       one thin component per route                   ← composes features
layouts     the frame around pages (slots)                 ← knows no feature details
   ↓
features    features/<name>/ … exposed via index.js        ← the product's real work
   ↓
shared      shared/ui, shared/composables, shared/utils    ← generic, feature-agnostic
services    services/http.js (the single HTTP client)      ← talks to the outside world`,
      lang: 'text',
      title: 'dependency direction',
    },
    `
1. **Pages compose features.** A page imports \`ProductGrid\` from \`features/catalog\` and \`CartList\` from \`features/cart\`, and connects them.
2. **Features don't import each other's internals.** If the catalog needs something from the cart, it goes through \`features/cart/index.js\` — or better, the page wires them together with props and events.
3. **\`shared/\` never imports from \`features/\`.** The moment a "shared" file knows about carts, it isn't shared any more.
4. **One public entrance per feature.** \`index.js\` re-exports what the feature offers; everything else in the folder is private by convention.
`,
    {
      code: `// features/cart/index.js — the public API
export { default as CartList } from './components/CartList.vue'
export { useCartStore } from './stores/cartStore.js'
export { formatCartSummary } from './utils/formatCartSummary.js'

// elsewhere — ✅ through the front door
import { CartList, useCartStore } from '@/features/cart'

// ❌ climbing over the shelves (couples you to private file names)
import CartListItem from '@/features/cart/components/CartListItem.vue'`,
      lang: 'js',
      title: 'a feature\'s public API',
    },
    {
      callout: 'note',
      title: 'What is `@`?',
      text: '`@` is an **import alias** for `src/`. Projects created with `create-vue` configure it in `vite.config.js` (`resolve.alias`). It\'s a build-tool setting, not a Vue feature. Importing a folder (`@/features/cart`) resolves to its `index.js`.',
    },
    `
#### Naming conventions

From the [official Vue style guide](https://vuejs.org/style-guide/), the [composables guide](https://vuejs.org/guide/reusability/composables.html) and the [Pinia docs](https://pinia.vuejs.org/core-concepts/):

- **Components:** use **multi-word** names, which avoids clashing with current and future HTML elements — \`TodoItem.vue\`, not \`Item.vue\`.
- **SFC files:** PascalCase (or kebab-case — pick one and stay consistent) — \`CartList.vue\`.
- **Base components:** a shared prefix such as \`Base\` or \`App\` — \`BaseButton.vue\`, \`BaseInput.vue\`.
- **Single-instance components:** the \`The\` prefix — \`TheHeader.vue\`.
- **Tightly coupled children:** the parent's name as a prefix — \`CartList.vue\` → \`CartListItem.vue\`.
- **Composables:** camelCase starting with \`use\` — \`useCart\`, \`useDebounce\`.
- **Pinia stores:** \`use…Store\` for the function \`defineStore\` returns — \`useCartStore\`.
- **Pages:** a suffix like \`Page\` (or \`View\`) — a team convention, not an official rule — \`CheckoutPage.vue\`.
`,
    `
#### Pages & layouts

A **page** (sometimes called a *view*) is the component a route renders. Keep it thin: fetch route params, compose features, done. A **layout** is the frame around pages. Two common ways to choose one:
`,
    {
      code: `// Option A — route meta + a dynamic component in the app shell
{ path: '/login', component: LoginPage, meta: { layout: 'auth' } }
// App.vue:  <component :is="layouts[route.meta.layout] ?? DefaultLayout"><RouterView /></component>

// Option B — the layout is a parent route; pages are its children
{
  path: '/',
  component: DefaultLayout,          // contains its own <RouterView />
  children: [
    { path: '', component: HomePage },
    { path: 'checkout', component: () => import('@/pages/CheckoutPage.vue') },
  ],
}`,
      lang: 'js',
      title: 'choosing a layout',
    },
    {
      callout: 'tip',
      title: 'Code splitting comes almost free',
      text: 'Lazy routes — `component: () => import(\'@/pages/CheckoutPage.vue\')` — let the bundler put each page (and the feature code only it uses) into its own chunk, downloaded on first visit. See [lazy-loaded routes](lesson:lazy-routes-scroll) and [code splitting](lesson:bundle-optimization). (The sandbox on this site cannot run dynamic `import()`, so the runnable examples import pages eagerly.)',
    },
  ],

  walkthrough: {
    title: 'A medium-to-large production tree',
    lang: 'text',
    code: productionTree,
    intro: 'This is a realistic structure for an e-commerce app with several developers. Step through it — each step explains one folder and *why* it exists.',
    steps: [
      { lines: [2, 2], text: '`main.js` is the **entry point**: create the app, install plugins (router, Pinia, i18n), mount. It should stay short — wiring only, no business logic.' },
      { lines: [3, 5], text: '`app/` holds the **app shell**: `App.vue` (chooses the layout and renders `<RouterView>`) and app-wide setup such as the global error handler. One place to look for "what happens when the app starts".' },
      { lines: [6, 8], text: '`router/` owns navigation: `createRouter()`, the history mode, global guards, and the route table. Pages are imported lazily here, which is what makes route-level code splitting work.' },
      { lines: [9, 10], text: '`plugins/` — one file per app-wide plugin (i18n, analytics, error reporting). `main.js` imports and installs them, so each plugin\'s configuration lives in exactly one file.' },
      { lines: [11, 12], text: '`config/env.js` reads `import.meta.env` **once**, validates it, and exports a typed-ish config object. The rest of the app imports `config`, never `import.meta.env` directly — so a missing variable fails loudly in one spot. (Details in [service layers](lesson:service-layers).)' },
      { lines: [13, 15], text: '`layouts/` are frames around pages: header, sidebar, footer, a centred auth card. They offer **slots** and know nothing about carts or products.' },
      { lines: [16, 20], text: '`pages/` — one **thin** component per route. A page reads route params, composes features and passes data between them. If a page grows past "glue", the logic belongs in a feature.' },
      { lines: [21, 25], text: '`features/` is where the product lives. Each feature has the same internal shape: `components/` for its UI…' },
      { lines: [26, 31], text: '…`composables/` for reusable logic, `stores/` for its shared state (Pinia), and `services/` for its API calls (built on the one HTTP client). Not every feature needs every folder — create them when needed.' },
      { lines: [32, 32], text: '`index.js` is the feature\'s **public API**. Other code imports `@/features/cart`, never a file deeper inside. That lets the cart team rename or reorganise their internals freely.' },
      { lines: [33, 34], text: 'Every feature has the **same shape**, so once you know one, you know them all. A new developer can guess where the checkout\'s API calls live without asking.' },
      { lines: [35, 38], text: '`shared/` holds generic building blocks: `ui/` (Base components), `composables/` (`useDebounce`), `utils/` (pure functions). The rule: **shared never imports from features**. Promote something here only when a second feature genuinely needs it.' },
      { lines: [39, 40], text: '`services/http.js` is the single HTTP client: base URL, auth header, timeouts, turning failed responses into errors. Feature services build on it.' },
      { lines: [41, 42], text: '`stores/` (top level) is for state that is truly app-wide — the signed-in user, preferences. Feature state belongs in the feature\'s own `stores/`.' },
      { lines: [43, 45], text: '`assets/` — global styles (design tokens, base CSS) and images that are imported by code.' },
      { lines: [46, 48], text: '`tests/` for unit and end-to-end tests. Many teams **colocate** unit tests next to the file they test (`CartList.spec.js`) and keep only E2E tests here.' },
    ],
  },

  playground: {
    title: 'A small shop, organised by feature',
    objective: 'Explore a feature-based project in the file tabs, then make four structural changes: use a shared utility, promote a component to shared/ui, fix a boundary violation, and extend a layout.',
    files: playgroundFiles,
    entry: 'App.vue',
    expected: 'A header with **Vue/Zero Shop** and **Cart: 0**, a product list that appears after a moment (keyboard, cable, stand) and an empty cart. **Add** puts a product in the cart and the header count goes up. Notice the cart total shows a raw number like `89` — experiment 1 fixes that. Browse the file tabs: `features/`, `shared/`, `pages/`, `layouts/`, `services/`.',
    experiments: [
      {
        id: 'shared-util',
        task: 'The cart total shows a raw number (`Total: 89`). Make `features/cart/components/CartList.vue` use the existing **shared** helper `formatPrice` (in `shared/utils/formatPrice.js`) so it shows `Total: $89.00`.',
        hint: '`ProductGrid.vue` already imports it: `import { formatPrice } from \'../../../shared/utils/formatPrice.js\'`. Then write `{{ formatPrice(total) }}`.',
        tests: [
          {
            name: 'the cart total is formatted as a price',
            code: `await wait(200)
await click(findAll('.add-to-cart')[0])
expect(text('.cart-total')).toContain('$89.00')`,
          },
        ],
        explain: '`formatPrice` is a pure function with no knowledge of any feature, so both the catalog and the cart can use it. That is the test for "does it belong in shared/?": it would make sense in an app that had no cart at all.',
      },
      {
        id: 'promote-badge',
        task: 'The cart team wants the same **Sale** badge as the catalog. Promote it: finish `shared/ui/BaseBadge.vue` (root element `<span class="base-badge">` rendering its default slot) and use `<BaseBadge>Sale</BaseBadge>` in `ProductGrid.vue` instead of the hand-written `<span class="sale">`.',
        hint: 'In `ProductGrid.vue`: `import BaseBadge from \'../../../shared/ui/BaseBadge.vue\'`, then `<BaseBadge v-if="product.onSale">Sale</BaseBadge>`.',
        tests: [
          {
            name: 'on-sale products show a BaseBadge reading "Sale"',
            code: `await wait(200)
const badges = findAll('.base-badge')
expect(badges.length).toBe(1)
expect(badges[0].textContent.trim()).toBe('Sale')`,
          },
        ],
        explain: 'You promoted the badge **when a second feature needed it** — not "just in case". Shared components should be generic (a slot for the text, no product logic) and use the `Base` prefix so everyone knows they are app-wide building blocks.',
      },
      {
        id: 'fix-boundary',
        task: '`ProductGrid.vue` deep-imports `useCart` from **inside** the cart feature, so the catalog now depends on the cart\'s private files. Fix it: make `ProductGrid` **emit an `add` event** with the product (declare it with `defineEmits([\'add\'])`) and let `pages/ShopPage.vue` connect it to the cart using `useCart` from `features/cart/index.js`.',
        hint: 'ProductGrid: remove the `useCart` import, add `const emit = defineEmits([\'add\'])`, use `@click="emit(\'add\', product)"`. ShopPage: `import { CartList, useCart } from \'../features/cart/index.js\'`, `const { add } = useCart()`, `<ProductGrid @add="add" />`.',
        tests: [
          {
            name: 'ProductGrid emits "add" with the clicked product',
            code: `const grid = mountFile('features/catalog/components/ProductGrid.vue')
await wait(200)
await click(grid.find('.add-to-cart'))
const calls = grid.emitted('add')
expect(calls.length).toBe(1)
expect(calls[0][0].name).toBe('Mechanical keyboard')`,
          },
          {
            name: 'clicking Add in the shop still fills the cart',
            code: `await wait(200)
await click(findAll('.add-to-cart')[1])
expect(findAll('.cart-line').length).toBe(1)
expect(text('.cart-count')).toContain('1')`,
          },
        ],
        explain: 'Now the catalog knows nothing about carts — it just announces "someone wants this product". The **page** decides what that means. The catalog can be reused on a wishlist page, tested alone, or moved without touching the cart.',
      },
      {
        id: 'layout-footer',
        task: 'Give `layouts/DefaultLayout.vue` a **named slot** `footer`, rendered inside `<footer class="layout-footer">` below `<main>`. Fill it from `App.vue` with **© Vue/Zero Shop**.',
        hint: 'Layout: `<footer class="layout-footer"><slot name="footer" /></footer>`. App: `<template #footer>© Vue/Zero Shop</template>` inside `<DefaultLayout>`.',
        tests: [
          {
            name: 'the layout renders a footer filled by the app shell',
            code: `expect(exists('footer.layout-footer')).toBe(true)
expect(text('.layout-footer')).toContain('© Vue/Zero Shop')`,
          },
        ],
        explain: 'The layout owns the **frame** (where the footer goes); the app decides the **content**. Layouts stay feature-agnostic, so the same frame can wrap any page.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'Which way may imports point?',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'shell', label: 'App shell', note: 'main.js · App.vue · router', tone: 'ink', x: 120, y: 60 },
        { id: 'pages', label: 'pages/', note: 'one per route', tone: 'acid', x: 380, y: 60 },
        { id: 'layouts', label: 'layouts/', note: 'frames + slots', tone: 'paper', x: 640, y: 60 },
        { id: 'catalog', label: 'features/catalog', note: 'index.js = public API', tone: 'cobalt', x: 250, y: 180 },
        { id: 'cart', label: 'features/cart', note: 'index.js = public API', tone: 'cobalt', x: 510, y: 180 },
        { id: 'shared', label: 'shared/', note: 'ui · composables · utils', tone: 'kraft', x: 250, y: 295 },
        { id: 'services', label: 'services/', note: 'http client', tone: 'kraft', x: 510, y: 295 },
      ],
      edges: [
        { from: 'shell', to: 'pages', label: 'routes to' },
        { from: 'shell', to: 'layouts', label: 'chooses' },
        { from: 'pages', to: 'catalog', label: 'index.js' },
        { from: 'pages', to: 'cart', label: 'index.js' },
        { id: 'cross', from: 'catalog', to: 'cart', label: '✗ deep import', dashed: true },
        { from: 'catalog', to: 'shared' },
        { from: 'cart', to: 'shared' },
        { from: 'catalog', to: 'services' },
        { from: 'cart', to: 'services' },
        { id: 'back', from: 'shared', to: 'cart', label: '✗ never', dashed: true },
      ],
      steps: [
        { focus: ['shell'], text: 'The **app shell** starts everything: `main.js` creates the app and installs the router; `App.vue` renders the current route inside a layout.' },
        { focus: ['shell', 'pages', 'layouts'], edges: ['shell->pages', 'shell->layouts'], text: 'The router picks a **page** for the URL; the shell wraps it in a **layout**. Layouts only offer slots — they import nothing from features.' },
        { focus: ['pages', 'catalog', 'cart'], edges: ['pages->catalog', 'pages->cart'], text: 'Pages **compose features**, always through each feature\'s `index.js`. The page is the glue: "when the grid emits `add`, put it in the cart".' },
        { focus: ['catalog', 'cart'], edges: ['cross'], text: 'Features **don\'t reach into each other**. A deep import like `features/cart/composables/useCart.js` from the catalog couples two teams\' private files. Go through the page (props/events) or the public `index.js`.' },
        { focus: ['catalog', 'cart', 'shared', 'services'], edges: ['catalog->shared', 'cart->shared', 'catalog->services', 'cart->services'], text: 'Features build on the **shared** layer (Base components, pure utils) and the **services** layer (the HTTP client). Many arrows point *down* — that is healthy.' },
        { focus: ['shared', 'cart'], edges: ['back'], text: '`shared/` **never** imports a feature. If a "shared" file needs the cart store, it isn\'t shared — move it into the feature, or pass the data in as a parameter.' },
        { focus: ['shell', 'pages', 'layouts', 'catalog', 'cart', 'shared', 'services'], text: 'Result: arrows point one way, top to bottom. You can delete `features/cart/` and only the pages that use it need editing — nothing in `shared/` or the catalog breaks.' },
      ],
    },
    caption: 'Step through the allowed (solid) and forbidden (dashed) import directions.',
    alt: 'A layered diagram. Top row: App shell, pages, layouts. Middle row: features/catalog and features/cart, each with a public index.js. Bottom row: shared and services. Solid arrows go from app shell to pages and layouts, from pages to both features, and from both features down to shared and services. Two dashed, forbidden arrows: catalog to cart labelled deep import, and shared to cart labelled never.',
  },

  internals: {
    beginner: `
Vue and the browser **don't care** where your files live. When you write \`import { CartList } from './features/cart/index.js'\`, the build tool follows the path, finds the file and bundles it. A folder structure is a set of *agreements between people*: "cart code lives here", "you may import this, not that".

Because they are only agreements, they need two things to survive: they must be **obvious** (same shape in every feature, clear names) and ideally **checked by a tool** so nobody breaks them by accident at 6 pm on a Friday.
`,
    technical: [
      `
**Module resolution.** Vite resolves \`import '@/features/cart'\` in steps: the \`@\` alias (configured in \`vite.config.js\`) becomes \`src/\`; a path to a folder resolves to its \`index.js\`. Every \`.vue\` file is compiled to a JavaScript module whose default export is the component.

**Public APIs are re-exports (a "barrel" file).** \`export { default as CartList } from './components/CartList.vue'\` doesn't copy anything — it re-exports a live binding. The trade-offs:
`,
      {
        code: `// features/cart/index.js
export { default as CartList } from './components/CartList.vue'
export { useCartStore } from './stores/cartStore.js'

// ✅ production build: unused re-exports can be tree-shaken
//    (if the modules have no side effects)
// ⚠ dev server: importing the barrel makes Vite load and transform
//    EVERY module it re-exports, even ones this page never uses
// ⚠ cycles: cart/index.js → checkout/index.js → cart/index.js
//    can give "Cannot access 'X' before initialization"`,
        lang: 'js',
        title: 'what a feature index.js costs and buys',
      },
      `
Vite's own [performance guide](https://vite.dev/guide/performance.html) recommends avoiding *big* barrel files for that dev-server reason. A feature's \`index.js\` that re-exports a handful of public items is a reasonable compromise; a giant \`src/components/index.js\` that re-exports 200 components is not.

**Circular imports.** ES modules allow cycles, but during evaluation one side of the cycle sees the other's exports *before* they are initialised. With \`const\`/\`let\`/\`class\` exports this throws a \`ReferenceError\` ("Cannot access … before initialization"). The one-way layering rule (pages → features → shared) makes cycles between layers impossible by design; between features, wire through the page instead.

**Code splitting.** A dynamic \`import('./CheckoutPage.vue')\` tells the bundler (Rollup/Rolldown inside Vite) to start a new chunk at that module. Everything only reachable from it — the checkout feature's components, its store — lands in that chunk too. Code shared by several chunks is moved into common chunks automatically. Feature folders don't *cause* splitting; lazy routes and \`defineAsyncComponent\` do. Feature folders just make the split points obvious.
`,
    ],
    production: `
- **Enforce boundaries with tooling, not memory.** Lint rules can forbid deep imports across features and imports from \`shared/\` into \`features/\` — for example ESLint's \`no-restricted-imports\` with patterns, or community plugins dedicated to import boundaries. Pick what your team already uses; the rule matters more than the tool.
- **Ownership.** Feature folders map cleanly onto code-owner files (e.g. GitHub \`CODEOWNERS\`): the checkout team reviews changes under \`features/checkout/\`.
- **Grow the structure with the app.** A two-page prototype doesn't need \`features/\`, \`shared/\` and \`services/\`. Start flat; introduce a feature folder when a feature has 3+ related files; introduce \`shared/\` when a second feature needs something.
- **Promotion rule.** Move code into \`shared/\` when a *second* feature needs it, and generalise it at that point (slots and props instead of feature data). Promoting on day one creates generic APIs nobody asked for.
- **Keep pages thin.** If a page has hundreds of lines of logic, the logic belongs in a feature composable or store. Thin pages make route-level lazy loading and testing easy.
- **Colocate tests and stories** with the code they cover so deleting a feature deletes its tests too.
- **Write the structure down.** A short \`ARCHITECTURE.md\` with the layer rules and naming conventions saves hours of review comments. Pair it with the [design patterns](lesson:design-patterns) your team agrees on.
`,
  },

  mistakes: [
    {
      title: 'Deep imports across features',
      wrong: { code: `// features/wishlist/components/WishlistItem.vue
import ProductCard from '@/features/catalog/components/ProductCard.vue'
import { useCartStore } from '@/features/cart/stores/cartStore.js'`, lang: 'js' },
      right: { code: `// features/wishlist/components/WishlistItem.vue
import { ProductCard } from '@/features/catalog'   // public API only
// …or let the page pass the cart action down as an event handler`, lang: 'js' },
      explanation: 'A deep import couples you to another feature\'s *private* file names and folder layout. When the catalog team renames `components/ProductCard.vue`, the wishlist breaks. Public `index.js` files are a contract; everything else is free to change.',
    },
    {
      title: 'A "shared" file that knows about a feature',
      wrong: { code: `// shared/ui/PriceTag.vue
import { useCartStore } from '@/features/cart'
const cart = useCartStore()
const label = computed(() => formatPrice(props.amount, cart.currency))`, lang: 'js' },
      right: { code: `// shared/ui/PriceTag.vue — receives what it needs
const props = defineProps({ amount: Number, currency: { type: String, default: 'USD' } })
const label = computed(() => formatPrice(props.amount, props.currency))`, lang: 'js' },
      explanation: 'Once `shared/` imports a feature, the arrows point both ways and cycles become possible. Shared code receives data through props or parameters; the feature that *has* the data passes it in.',
    },
    {
      title: 'Single-word component names',
      wrong: { code: `components/Header.vue
components/Item.vue
components/Table.vue`, lang: 'text' },
      right: { code: `layouts/TheHeader.vue
features/cart/components/CartListItem.vue
shared/ui/BaseTable.vue`, lang: 'text' },
      explanation: 'The Vue style guide marks multi-word names as *essential*: HTML elements are single words (`<header>`, `<table>`), so single-word component names can clash with current and future elements. Multi-word names also say *which* header or item you mean.',
    },
    {
      title: 'Over-structuring a tiny app',
      wrong: { code: `src/features/counter/components/CounterDisplay.vue
src/features/counter/composables/useCounter.js
src/features/counter/stores/counterStore.js
src/features/counter/services/counterApi.js
src/features/counter/index.js
# …for a single-page counter demo`, lang: 'text' },
      right: { code: `src/App.vue
src/components/CounterDisplay.vue
src/composables/useCounter.js`, lang: 'text' },
      explanation: 'Structure has a cost: more files, more paths, more indirection. Small apps and prototypes are clearer flat. Introduce feature folders when the app has several distinct features or several people working on it.',
    },
    {
      title: 'Fat pages that do everything',
      wrong: { code: `<!-- pages/CheckoutPage.vue: 600 lines -->
<script setup>
// fetches cart, validates address, calculates tax, talks to payment API,
// renders 4 sections of form inline …
</script>`, lang: 'vue' },
      right: { code: `<!-- pages/CheckoutPage.vue: glue only -->
<script setup>
import { AddressForm, PaymentForm, useCheckout } from '@/features/checkout'
import { CartSummary } from '@/features/cart'
const checkout = useCheckout()
</script>`, lang: 'vue' },
      explanation: 'A page that contains feature logic can\'t be reused, is hard to test, and mixes concerns of several features. Pages compose; features do the work.',
    },
  ],

  debugging: [
    {
      symptom: '`ReferenceError: Cannot access \'useCartStore\' before initialization` (or an import that is unexpectedly `undefined`).',
      cause: 'A circular import: e.g. `features/cart/index.js` imports from `features/checkout`, which imports from `features/cart`. One side runs before the other has finished initialising.',
      fix: 'Break the cycle: move the shared piece down into `shared/`, or remove the feature-to-feature import and let a page pass data/events between them.',
    },
    {
      symptom: 'Moving a folder breaks dozens of `../../../` imports.',
      cause: 'Long relative paths encode the folder layout into every file.',
      fix: 'Use the `@` alias for imports that cross layers (`@/shared/ui/BaseButton.vue`) and keep relative imports for files inside the same feature.',
    },
    {
      symptom: 'A change in one feature breaks an unrelated feature.',
      cause: 'Someone deep-imported a private file of the changed feature.',
      fix: 'Expose what\'s needed via the feature\'s `index.js`, switch the import, and add a lint rule that forbids deep cross-feature imports.',
    },
    {
      symptom: 'The initial JavaScript bundle contains every page of the app.',
      cause: 'Route components are imported eagerly at the top of the router file.',
      fix: 'Use lazy routes: `component: () => import(\'@/pages/CheckoutPage.vue\')`. Check the build output to confirm separate chunks appear.',
    },
    {
      symptom: '`[Vue warn]: Failed to resolve component: CartList` after reorganising files.',
      cause: 'The component is no longer imported where it is used (or the public `index.js` doesn\'t export it).',
      fix: 'Import it in the `<script setup>` that uses it, and check the feature\'s `index.js` re-exports it with the expected name.',
    },
  ],

  bestPractices: [
    'Group code by feature once the app has several distinct features; keep a small `shared/` for genuinely generic pieces.',
    'Give every feature the same internal shape (`components/`, `composables/`, `stores/`, `services/`, `index.js`) — create subfolders only when needed.',
    'Import other features only through their public `index.js`; keep the index small and intentional.',
    'Keep imports pointing one way: app shell → pages/layouts → features → shared/services.',
    'Keep pages thin: they read the route and compose features.',
    'Follow the Vue style guide names: multi-word components, `Base` prefix for app-wide building blocks, `use…` composables, `use…Store` stores.',
    'Lazy-load route components so each page (and its feature code) becomes its own chunk.',
    'Enforce boundaries with a lint rule and document them in a short architecture note.',
  ],

  useCases: [
    'An e-commerce app with catalog, cart, checkout and account features owned by different developers.',
    'An admin dashboard where each section (users, billing, reports) is a feature folder with its own lazy-loaded pages.',
    'A SaaS product that regularly adds and removes experimental features — each one is a folder you can delete.',
    'Onboarding: new developers navigate the code by reading the product menu in `features/`.',
    'Preparing a large app for code-owner reviews and parallel team work.',
  ],

  whenToUse: {
    use: [
      'The app has several distinct features, or more than one or two developers.',
      'You find yourself opening many folders to change one feature.',
      'You want features to be deletable, testable and lazily loaded on their own.',
      'Different teams own different areas of the product.',
    ],
    avoid: [
      'A prototype, demo or single-page widget — a flat `components/` folder is clearer.',
      'Splitting one feature into many tiny folders "for later" — wait until the code exists.',
      'Creating a giant barrel file that re-exports every component in the app.',
    ],
  },

  comparison: {
    title: 'Ways to organise a Vue codebase',
    headers: ['', 'Type-based', 'Feature-based', 'Feature-based + shared layer'],
    rows: [
      ['Grouped by', 'kind of file (components, stores…)', 'product feature', 'feature, plus generic building blocks'],
      ['Change one feature', 'touch many folders', 'one folder', 'one folder (plus shared if generic)'],
      ['Delete a feature', 'hunt for its files', 'delete one folder', 'delete one folder'],
      ['Reusing generic UI', 'easy (it\'s all in components/)', 'unclear where it lives', 'clear: `shared/ui`'],
      ['Best for', 'small apps, prototypes', 'medium apps', 'medium-to-large apps, several teams'],
      ['Main risk', 'giant mixed folders', 'duplicated generic code', 'a `shared/` dumping ground'],
    ],
    note: 'Most growing apps end up in the last column. Next, see how the services layer fits in: [service layers](lesson:service-layers).',
  },

  quiz: [
    {
      id: 'project-structure-q1',
      type: 'mcq',
      prompt: '`PaymentMethodPicker.vue` is used **only** by the checkout feature. Where should it live?',
      options: [
        { text: '`features/checkout/components/PaymentMethodPicker.vue`' },
        { text: '`shared/ui/PaymentMethodPicker.vue`', why: '`shared/` is for things several features need. Putting single-feature code there makes `shared/` a dumping ground and invites accidental coupling.' },
        { text: '`pages/PaymentMethodPicker.vue`', why: '`pages/` holds route-level components. A picker is part of a page, not a page.' },
        { text: '`components/PaymentMethodPicker.vue` next to every other component', why: 'That is the type-based layout this structure replaces: the picker gets mixed with unrelated components.' },
      ],
      answer: 0,
      explanation: 'Code used by one feature lives inside that feature. If a second feature needs it later, promote it to `shared/` and make it generic then.',
    },
    {
      id: 'project-structure-q2',
      type: 'output',
      prompt: 'In a `create-vue` project with the default alias, which file does this import load first?',
      code: { lang: 'js', code: `import { CartList } from '@/features/cart'` },
      options: [
        { text: '`src/features/cart/index.js`' },
        { text: '`src/features/cart/CartList.vue`', why: 'The import names a folder, not a component file. Resolution goes to the folder\'s `index.js`, which may re-export `CartList` from anywhere inside.' },
        { text: '`src/features/cart.js`', why: 'There is no such file in a feature-based layout; `cart` is a directory.' },
        { text: 'Nothing — it is a syntax error', why: 'Aliases and folder imports are valid; `@` is configured in `vite.config.js`.' },
      ],
      answer: 0,
      explanation: '`@` is aliased to `src/`, and importing a directory resolves to its `index.js` — the feature\'s public API. That file decides what `CartList` is.',
    },
    {
      id: 'project-structure-q3',
      type: 'bug',
      prompt: 'This file lives in `shared/ui/PriceTag.vue` (inside `<script setup>`). Click the line that breaks the dependency rules.',
      code: {
        lang: 'js',
        code: `import { computed } from 'vue'
import { formatPrice } from '@/shared/utils/formatPrice.js'
import { useCartStore } from '@/features/cart/stores/cartStore.js'

const props = defineProps({ amount: Number })
const cart = useCartStore()
const label = computed(() => formatPrice(props.amount, cart.currency))`,
      },
      answerLine: 3,
      explanation: 'A shared component importing a feature\'s store reverses the dependency direction (and deep-imports a private file). Pass `currency` in as a prop instead, so the component stays generic.',
    },
    {
      id: 'project-structure-q4',
      type: 'fill',
      prompt: 'Complete the lazy route and the conventional Pinia store name.',
      code: {
        lang: 'js',
        code: `// router/routes.js
{ path: '/checkout', component: () => ___('@/pages/CheckoutPage.vue') }

// features/cart/stores/cartStore.js
export const ___ = defineStore('cart', { /* … */ })`,
      },
      answer: [['import'], ['useCartStore']],
      explanation: 'A function returning a dynamic `import()` makes the route lazy (its own chunk). Pinia\'s convention is to name the returned function `use…Store`.',
    },
    {
      id: 'project-structure-q5',
      type: 'mcq',
      prompt: 'Which names follow the official Vue conventions? (Select all that apply.)',
      options: [
        { text: '`CartListItem.vue` for an item used only inside `CartList.vue`' },
        { text: '`Item.vue`', why: 'Single-word component names can clash with HTML elements and say nothing about *which* item. The style guide marks multi-word names as essential.' },
        { text: '`BaseButton.vue` for an app-wide button' },
        { text: '`useDebounce` for a composable' },
        { text: '`cartHelper` for a composable that holds reactive cart state', why: 'Composables are named in camelCase starting with `use` — e.g. `useCart` — so readers know they must be called in setup.' },
      ],
      answer: [0, 2, 3],
      explanation: 'Tightly coupled children use the parent\'s name as a prefix, app-wide base components share a prefix such as `Base`, and composables start with `use`.',
    },
    {
      id: 'project-structure-q6',
      type: 'short',
      prompt: 'In two or three sentences: when would you **not** introduce a feature-based structure, and what would you do instead?',
      answer: 'For a small app, prototype or a single-page widget, feature folders add indirection without benefit. I would start flat (components/, composables/) and introduce feature folders once there are several distinct features or several people working on the code — structure should grow with the codebase.',
    },
  ],

  exercises: [
    {
      id: 'todos-feature-folder',
      title: 'Move a monolith into a feature folder',
      difficulty: 'intermediate',
      prompt: `
Everything for the todo list lives in \`App.vue\`. Move it into \`features/todos/\` (the files already exist as stubs):

- \`features/todos/composables/useTodos.js\` exports **\`useTodos()\`**, which returns \`{ todos, remaining, addTodo, toggleTodo }\` (\`todos\` a ref of \`{ id, text, done }\`, starting with the same two todos; \`remaining\` a computed count of undone todos; \`addTodo(text)\` trims and ignores empty text; \`toggleTodo(id)\` flips \`done\`).
- \`features/todos/components/TodoList.vue\` receives a **\`todos\` prop** and renders each todo as \`<li class="todo">\` with a checkbox \`class="toggle"\`; changing the checkbox **emits \`toggle\`** with the todo's id.
- \`features/todos/index.js\` exports **\`TodoList\`** and **\`useTodos\`** — the feature's public API.
- \`App.vue\` imports **only** from \`./features/todos/index.js\` and keeps the form (\`input.new-todo\`) and the \`<p class="remaining">\` showing \`N left\`.
`,
      files: {
        'App.vue': todosStarterApp,
        'features/todos/index.js': todosStarterIndex,
        'features/todos/composables/useTodos.js': todosStarterComposable,
        'features/todos/components/TodoList.vue': todosStarterList,
      },
      hints: [
        'Start with `useTodos.js`: cut the `todos` ref, the `remaining` computed and the two functions from `App.vue`, paste them inside `useTodos()` and `return` them.',
        'In `TodoList.vue`, use `defineProps({ todos: Array })` and `const emit = defineEmits([\'toggle\'])`; the checkbox does `@change="emit(\'toggle\', todo.id)"`.',
        '`index.js` needs two lines: `export { default as TodoList } from \'./components/TodoList.vue\'` and `export { useTodos } from \'./composables/useTodos.js\'`. Then `App.vue` does `import { TodoList, useTodos } from \'./features/todos/index.js\'`.',
      ],
      solution: {
        explanation: 'The feature now owns its state (`useTodos`) and its UI (`TodoList`), and exposes both through `index.js`. `App.vue` only wires the form to `addTodo` and passes data down / events up. Creating the state *inside* `useTodos()` gives each caller its own list; if the whole app had to share one list, you would use a store instead.',
        files: {
          'App.vue': todosSolutionApp,
          'features/todos/index.js': todosSolutionIndex,
          'features/todos/composables/useTodos.js': todosSolutionComposable,
          'features/todos/components/TodoList.vue': todosSolutionList,
        },
      },
      tests: [
        {
          name: 'index.js exposes TodoList and useTodos',
          code: `const api = requireModule('features/todos/index.js')
expect(typeof api.useTodos).toBe('function')
expect(api.TodoList).toBeTruthy()`,
        },
        {
          name: 'useTodos() returns working state and actions',
          code: `const t = withSetup(() => requireModule('features/todos/index.js').useTodos())
expect(t.todos.value.length).toBe(2)
expect(t.remaining.value).toBe(1)
t.addTodo('   ')
expect(t.todos.value.length).toBe(2)
t.addTodo('Buy milk')
expect(t.todos.value.length).toBe(3)
expect(t.remaining.value).toBe(2)
t.toggleTodo(t.todos.value[1].id)
expect(t.remaining.value).toBe(1)`,
        },
        {
          name: 'the app still renders, adds and toggles todos',
          code: `expect(findAll('.todo').length).toBe(2)
expect(text('.remaining')).toBe('1 left')
await type('.new-todo', 'Write tests')
await submit('form')
expect(findAll('.todo').length).toBe(3)
expect(text('.remaining')).toBe('2 left')
await check(findAll('.toggle')[2], true)
expect(text('.remaining')).toBe('1 left')`,
        },
      ],
    },
    {
      id: 'route-layouts',
      title: 'Pick the layout from route meta',
      difficulty: 'intermediate',
      prompt: `
The router (\`router/index.js\`) marks the login route with \`meta: { layout: 'auth' }\`, but \`App.vue\` always uses \`DefaultLayout\`.

Change \`App.vue\` so that:

- routes with \`meta.layout === 'auth'\` render inside **\`AuthLayout\`** (root element \`.layout-auth\`);
- every other route renders inside **\`DefaultLayout\`** (root element \`.layout-default\`);
- the page itself still renders through \`<RouterView />\`.

Don't change the layouts, pages or router.
`,
      files: {
        ...layoutsFiles,
        'App.vue': `<script setup>
import DefaultLayout from './layouts/DefaultLayout.vue'
// TODO: also use AuthLayout for routes with meta.layout === 'auth'
</script>

<template>
  <DefaultLayout>
    <RouterView />
  </DefaultLayout>
</template>`,
      },
      hints: [
        'Read the current route with `useRoute()` from `vue-router`; its `meta` object holds `layout`.',
        'Make a lookup object `{ default: DefaultLayout, auth: AuthLayout }` and a `computed` that returns the right one.',
        'Render it with `<component :is="layout"><RouterView /></component>` — the page goes into the layout\'s default slot.',
      ],
      solution: {
        explanation: 'The layout choice is *data on the route* (`meta.layout`), and the app shell turns that data into a component with `<component :is>`. Adding a third layout is one import and one entry in the lookup object. The alternative — making the layout a parent route with children — is also common; it shines when a layout needs its own nested `<RouterView>`.',
        files: {
          ...layoutsFiles,
          'App.vue': `<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import AuthLayout from './layouts/AuthLayout.vue'

const layouts = { default: DefaultLayout, auth: AuthLayout }
const route = useRoute()
const layout = computed(() => layouts[route.meta.layout] ?? DefaultLayout)
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>`,
        },
      },
      tests: [
        {
          name: 'the home page uses the default layout',
          code: `expect(exists('.layout-default')).toBe(true)
expect(text('.page-title')).toBe('Home')`,
        },
        {
          name: '/login uses the auth layout (and not the default one)',
          code: `const router = requireModule('router/index.js').default
await router.push('/login')
await flush()
expect(exists('.layout-auth')).toBe(true)
expect(exists('.layout-default')).toBe(false)
expect(text('.page-title')).toBe('Log in')`,
        },
        {
          name: 'leaving /login switches back to the default layout',
          code: `const router = requireModule('router/index.js').default
await router.push('/login')
await flush()
await router.push('/settings')
await flush()
expect(exists('.layout-default')).toBe(true)
expect(exists('.layout-auth')).toBe(false)
expect(text('.page-title')).toBe('Settings')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'project-structure-type-vs-feature',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the difference between a type-based and a feature-based folder structure, and when would you choose each?',
      answer: 'Type-based groups files by kind (`components/`, `stores/`, `services/`); feature-based groups them by product feature (`features/cart/` containing its own components, store and services) with a small shared layer. Type-based is simple for small apps; feature-based scales better because code that changes together lives together and features can be changed, owned or deleted in one place.',
      explanation: 'The question is really "what is the unit of change in your codebase?" — in a growing product it is usually a feature, not a file type.',
      whyAsked: 'Checks whether you have worked on a codebase large enough for structure to matter, and whether you can reason about trade-offs instead of following a template.',
      mistakes: [
        'Claiming one structure is always right regardless of app size.',
        'Describing folders without mentioning boundaries or public APIs.',
        'Forgetting the shared layer for generic components.',
      ],
      followUps: ['Where do generic components like buttons go?', 'How do you stop features from depending on each other\'s internals?', 'How would you migrate a type-based app gradually?'],
      modelAnswer: 'Type-based structure groups by file kind — all components together, all stores together. Feature-based groups by what the code does for the user: `features/cart` holds the cart\'s components, composables, store and API calls, and exposes a public `index.js`. I use type-based for small apps and prototypes because it\'s the least ceremony. Once there are several features or several developers, I move to feature folders plus a small `shared/` layer, because a change to "the cart" then touches one folder and a feature can be deleted cleanly. The trade-off is a bit more indirection, so I let the structure grow with the app rather than starting big.',
    },
    {
      id: 'project-structure-multiword',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Why does the Vue style guide insist on multi-word component names like `TodoItem` instead of `Item` or `Header`?',
      options: [
        'Single-word names can clash with existing and future HTML elements, which are all single words',
        'Vue throws a compile error for single-word component names',
        'Multi-word names make components render faster',
        'It is required for Vue Router to find the component',
      ],
      correctOption: 0,
      answer: 'Because HTML elements are single words (`<header>`, `<table>`, `<button>`), a single-word component name can conflict with a current or future element. Multi-word names avoid that and are more descriptive. It\'s a style-guide rule (marked essential), enforced by linting — not a compiler error.',
      explanation: 'The root `App` component and Vue\'s built-ins (`<Transition>`, `<KeepAlive>`) are the exceptions.',
      whyAsked: 'A quick check that you know the conventions a team will expect in code review.',
      mistakes: ['Saying Vue refuses to compile single-word names.', 'Not knowing it is enforced by an ESLint rule in most setups.'],
      followUps: ['What other naming rules from the style guide do you follow?', 'How do you name a component used only inside another component?'],
      modelAnswer: 'HTML elements are single words, so a component called `Header` or `Table` can collide with real elements today or in future HTML versions. The style guide marks multi-word names as essential for that reason, with exceptions for the root `App` and built-ins. It\'s not a compiler error — teams enforce it with the official ESLint plugin. Multi-word names are also clearer: `CartListItem` tells you exactly where it belongs.',
    },
    {
      id: 'project-structure-promote-shared',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate proposes putting every new component into `shared/components/` "in case we reuse it later". How do you respond?',
      answer: 'Keep components inside the feature that uses them, and promote to `shared/` when a second feature actually needs one — generalising it at that moment (slots/props instead of feature data). Promoting speculatively turns `shared/` into a dumping ground of half-generic components with feature logic baked in, blurs ownership and invites coupling.',
      explanation: 'The best time to design a reusable API is when you have two real use cases, not zero.',
      whyAsked: 'Tests judgement about abstraction timing — a common source of messy codebases.',
      mistakes: [
        'Agreeing because "reuse is always good".',
        'Refusing all sharing — duplicated generic UI is also a problem.',
        'Not mentioning what changes when you promote (generalising the API, naming with a Base prefix).',
      ],
      followUps: ['What makes a component "generic enough" for shared?', 'Who owns shared/ in a multi-team setup?', 'What about utilities like date formatting?'],
      modelAnswer: 'I\'d push back gently. A component\'s home should be the feature that uses it, because then its owner and context are obvious. When a second feature needs it, we promote it to `shared/ui`, and that\'s when we generalise: remove feature-specific data, expose props and slots, give it a `Base` name. Promoting on day one means guessing at an API with zero real use cases, and `shared/` fills up with components that secretly import feature stores. The rule I like is: shared code must make sense in an app that doesn\'t have the feature at all.',
    },
    {
      id: 'project-structure-circular',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'After adding a "recommended products" section to the cart, the app crashes on load with `ReferenceError: Cannot access \'useCartStore\' before initialization`. What is likely going on and how do you fix it?',
      code: {
        lang: 'js',
        code: `// features/cart/index.js
export { useCartStore } from './stores/cartStore.js'
export { default as CartPage } from './components/CartPage.vue' // imports @/features/catalog

// features/catalog/index.js
export { default as ProductCard } from './components/ProductCard.vue' // imports @/features/cart`,
      },
      answer: 'A circular import between the two feature barrels: cart imports catalog, catalog imports cart. While one module is still evaluating, the other reads its `const` export before it\'s initialised, which throws. Fix by removing the feature-to-feature edge — have the page compose both features (pass the add-to-cart handler as an event), or move the genuinely shared piece down into `shared/`.',
      explanation: 'ES modules allow cycles, but `const`/`let` exports live in a "temporal dead zone" until their declaration runs. Barrels make cycles easier to create because one import pulls in everything the barrel re-exports.',
      whyAsked: 'Circular dependencies are a classic large-app bug; diagnosing them shows you understand module evaluation, not just Vue.',
      mistakes: [
        'Blaming Pinia or suggesting to call the store later "with a setTimeout".',
        'Fixing it by switching to deep imports, which hides the coupling.',
        'Not explaining why `const` exports throw while `var` would give `undefined`.',
      ],
      followUps: ['How would a lint rule help prevent this?', 'Why do barrel files make cycles more likely?', 'Would lazy-loading one side fix it? Is that a good fix?'],
      modelAnswer: 'That error almost always means a circular import. Here the cart barrel pulls in a component that imports the catalog barrel, which imports something from the cart barrel — so one module reads `useCartStore` before its declaration has run. I\'d fix it structurally: features shouldn\'t import each other, so the page composes them — the catalog card emits `add` and the page calls the cart store. If both genuinely need the same helper, it moves down to `shared/`. Then I\'d add a lint rule against cross-feature imports so the cycle can\'t come back.',
    },
    {
      id: 'project-structure-shared-util',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'The player feature deep-imports `formatDuration` from the **playlist** feature\'s private `utils/` folder. Move the function into `shared/utils/formatDuration.js` (the file exists as a stub), make it return `m:ss` (`65 → "1:05"`, `5 → "0:05"`, `600 → "10:00"`, negative input → `"0:00"`), and make **both** features import it from `shared/`.',
      starter: { files: durationStarter },
      tests: [
        {
          name: 'shared formatDuration formats m:ss',
          code: `const { formatDuration } = requireModule('shared/utils/formatDuration.js')
expect(formatDuration(65)).toBe('1:05')
expect(formatDuration(5)).toBe('0:05')
expect(formatDuration(600)).toBe('10:00')`,
        },
        {
          name: 'negative input is clamped to 0:00',
          code: `const { formatDuration } = requireModule('shared/utils/formatDuration.js')
expect(formatDuration(-3)).toBe('0:00')`,
        },
        {
          name: 'both features still render durations',
          code: `expect(text('.now-playing-time')).toBe('0:05')
const durations = findAll('.track-duration').map((el) => el.textContent.trim())
expect(durations).toEqual(['1:05', '10:00'])`,
        },
      ],
      hints: [
        'Copy the implementation into `shared/utils/formatDuration.js` and add `Math.max(0, …)` for negatives.',
        'From `features/<name>/components/`, the shared folder is three levels up: `../../../shared/utils/formatDuration.js`.',
      ],
      answer: 'Move the pure function to `shared/utils/`, clamp negatives, and point both feature components at the shared path — no feature imports another feature any more.',
      solution: { files: durationSolution },
      explanation: 'A pure, feature-agnostic helper belongs in `shared/`. Both features now depend downwards on `shared/` instead of sideways on each other, so the playlist team can reorganise their folder without breaking the player.',
      whyAsked: 'A small refactor that shows whether you recognise and fix dependency-direction problems, not just write the function.',
      mistakes: ['Re-exporting the playlist util from the playlist index and calling it done — the player still depends on the playlist feature.', 'Leaving two copies of the function that will drift apart.'],
      followUps: ['Would you also add a unit test for it? Where would it live?', 'How would you prevent the deep import from coming back?'],
      modelAnswer: 'The function is pure and has nothing to do with playlists, so it belongs in `shared/utils`. I\'d move it there, add the edge case for negative input, and update both components to import from shared. Then the player depends on shared, not on the playlist feature\'s internals. I\'d colocate a small unit test with it and add a lint rule that forbids importing from another feature\'s subfolders.',
    },
    {
      id: 'project-structure-large-app',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 8,
      question: 'You are setting up the frontend for a marketplace with four teams (catalog, checkout, seller tools, account). Describe the project structure, the dependency rules, and how you keep the initial bundle small.',
      answer: 'App shell (`main.js`, `App.vue`, `router/`, `plugins/`, `config/`), `layouts/`, thin `pages/`, one folder per feature under `features/` with a consistent internal shape and a public `index.js`, a `shared/` layer (ui, composables, utils) and `services/http.js`. Rules: imports point down (shell → pages → features → shared/services), no deep cross-feature imports, shared never imports features — enforced by lint rules and code owners per feature folder. Bundle: lazy-load every route (and heavy feature widgets with `defineAsyncComponent`), so each team\'s pages ship as separate chunks; keep barrels small.',
      explanation: 'A good answer covers three things: where code lives, what may import what (and how that is enforced), and how the structure maps to runtime loading.',
      code: {
        lang: 'js',
        code: `// router/routes.js — one lazy chunk per page / feature area
export default [
  { path: '/', component: () => import('@/pages/HomePage.vue') },
  { path: '/p/:id', component: () => import('@/pages/ProductPage.vue') },
  { path: '/checkout', component: () => import('@/pages/CheckoutPage.vue'), meta: { layout: 'focused' } },
  { path: '/seller', component: () => import('@/pages/SellerDashboardPage.vue'), meta: { requiresAuth: true } },
]`,
      },
      whyAsked: 'Senior frontend roles are expected to set up structures that let several teams work in parallel without stepping on each other.',
      mistakes: [
        'Listing folders without any dependency rules or enforcement.',
        'Ignoring team ownership and code review boundaries.',
        'Forgetting runtime concerns: code splitting and initial load.',
        'Proposing micro-frontends by default without discussing their cost.',
      ],
      followUps: ['Where does cross-cutting state like the current user live?', 'How would seller tools reuse catalog components?', 'When would you consider a monorepo with separate packages?'],
      modelAnswer: 'I\'d use a feature-based structure: an app shell with `main.js`, `App.vue`, router, plugins and a validated config module; layouts; thin pages; and `features/catalog`, `features/checkout`, `features/seller`, `features/account`, each with the same internal shape and a public `index.js`. Generic UI and helpers go in `shared/`, the HTTP client in `services/`, and truly global state like the session in a top-level store. Imports only point down, features never deep-import each other, and shared never imports features — enforced with lint rules and CODEOWNERS per feature folder. Every route is lazy-loaded so each team\'s pages are separate chunks, and heavy widgets use `defineAsyncComponent`. I\'d only reach for separate packages or micro-frontends if teams need independent deploys, because that adds real operational cost.',
    },
    {
      id: 'project-structure-barrels',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare importing through a feature\'s `index.js` barrel with importing files directly. What are the costs of barrels in a Vite project?',
      answer: 'Barrels give each feature a stable public API, hide internal file names and make boundaries lintable. Costs: in the Vite dev server, importing a barrel loads and transforms every module it re-exports (Vite\'s performance guide recommends avoiding large barrels); barrels make circular imports easier to create; and tree-shaking in production depends on modules being side-effect free. Compromise: small, intentional feature barrels for cross-feature use; direct relative imports inside a feature.',
      explanation: 'The barrel is a contract for *other* features. Inside the feature, you don\'t need it.',
      whyAsked: 'Shows whether you understand the tooling consequences of a structural choice, not only the organisational benefit.',
      mistakes: ['Saying barrels always bloat production bundles (tree-shaking usually removes unused re-exports).', 'Recommending a single giant `components/index.js`.', 'Importing a feature\'s own barrel from inside that feature (an easy way to create cycles).'],
      followUps: ['How do side effects affect tree-shaking?', 'How would you detect a circular import in CI?'],
      modelAnswer: 'A feature barrel is the feature\'s public API: other code imports `@/features/cart`, which hides internal paths and lets lint rules enforce boundaries. The costs are mostly tooling: in dev, Vite has to load everything a barrel re-exports, so huge barrels slow page loads — Vite\'s own docs warn about that. Barrels also make cycles easier, and production tree-shaking only drops unused re-exports when modules are side-effect free. So I keep feature barrels small and intentional, use them only across features, and use direct relative imports inside a feature.',
    },
  ],

  takeaways: [
    'Group code by feature once an app grows: code that changes together lives together, and a feature can be deleted in one go.',
    'Layers: app shell → pages & layouts → features → shared & services. Imports point one way, downwards.',
    'Each feature exposes a small public `index.js`; nobody deep-imports another feature\'s files, and `shared/` never imports features.',
    'Pages are thin glue; layouts are feature-agnostic frames with slots.',
    'Follow the Vue naming rules: multi-word components, `Base` prefix, `use…` composables, `use…Store` stores.',
    'Lazy routes turn pages and their feature code into separate chunks; structure should grow with the app — don\'t over-structure a prototype.',
  ],
}
