// Lesson: Why shared state? Local vs global

const cartModule = `import { reactive, computed } from 'vue'

// Created ONCE — the first time any file imports this module.
// Every component that imports \`cart\` gets the very same object.
export const cart = reactive({
  items: [], // each line: { id, name, price, qty }
})

// Derived state: how many lines are in the cart.
export const itemCount = computed(() => cart.items.length)

export const subtotal = computed(() =>
  cart.items.reduce((sum, line) => sum + line.price * line.qty, 0),
)

export function addToCart(product) {
  const line = cart.items.find((l) => l.id === product.id)
  if (line) line.qty++
  else cart.items.push({ ...product, qty: 1 })
}`

const appVue = `<script setup>
import CartBadge from './CartBadge.vue'
import ProductList from './ProductList.vue'
import CartPanel from './CartPanel.vue'
</script>

<template>
  <header class="top">
    <strong>Corner Shop</strong>
    <span>🛒 <CartBadge /></span>
  </header>
  <main class="layout">
    <ProductList />
    <CartPanel />
  </main>
</template>

<style>
.top { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 2px solid #222; }
.layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 12px; }
ul { padding-left: 18px; }
button { margin-left: 6px; }
</style>`

const badgeVue = `<script setup>
import { itemCount } from './cart.js'
</script>

<template>
  <span class="badge">{{ itemCount }}</span>
</template>`

const productListVue = `<script setup>
import { addToCart } from './cart.js'

// Local data: only this component needs the catalogue.
const products = [
  { id: 1, name: 'Coffee mug', price: 12 },
  { id: 2, name: 'Notebook', price: 8 },
  { id: 3, name: 'Desk plant', price: 20 },
]
</script>

<template>
  <section class="products">
    <h3>Products</h3>
    <ul>
      <li v-for="p in products" :key="p.id">
        {{ p.name }} — \${{ p.price }}
        <button class="add" @click="addToCart(p)">Add</button>
      </li>
    </ul>
  </section>
</template>`

const cartPanelVue = `<script setup>
import { cart, subtotal } from './cart.js'
</script>

<template>
  <section class="cart">
    <h3>Your cart</h3>
    <p v-if="cart.items.length === 0" class="empty">Nothing here yet.</p>
    <ul v-else>
      <li v-for="line in cart.items" :key="line.id" class="cart-line">
        {{ line.name }} × {{ line.qty }}
      </li>
    </ul>
    <p class="subtotal">Subtotal: \${{ subtotal }}</p>
  </section>
</template>`

// ---- variant: the same shop with props & events (prop drilling)
const drillApp = `<script setup>
import { ref, computed } from 'vue'
import TheHeader from './TheHeader.vue'
import ProductList from './ProductList.vue'
import CartPanel from './CartPanel.vue'

// App owns the cart because two distant components need it.
const items = ref([])
const itemCount = computed(() => items.value.length)

function addToCart(product) {
  const line = items.value.find((l) => l.id === product.id)
  if (line) line.qty++
  else items.value.push({ ...product, qty: 1 })
}
</script>

<template>
  <!-- TheHeader doesn't care about the cart. It only carries it to the badge. -->
  <TheHeader :count="itemCount" />
  <main class="layout">
    <ProductList @add="addToCart" />
    <CartPanel :items="items" />
  </main>
</template>`

const drillHeader = `<script setup>
import CartBadge from './CartBadge.vue'
// A "pass-through" prop: declared here only to hand it down again.
defineProps({ count: { type: Number, required: true } })
</script>

<template>
  <header class="top">
    <strong>Corner Shop</strong>
    <span>🛒 <CartBadge :count="count" /></span>
  </header>
</template>`

const drillBadge = `<script setup>
defineProps({ count: { type: Number, required: true } })
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>`

const drillList = `<script setup>
const emit = defineEmits(['add'])
const products = [
  { id: 1, name: 'Coffee mug', price: 12 },
  { id: 2, name: 'Notebook', price: 8 },
  { id: 3, name: 'Desk plant', price: 20 },
]
</script>

<template>
  <section class="products">
    <h3>Products</h3>
    <ul>
      <li v-for="p in products" :key="p.id">
        {{ p.name }}
        <button class="add" @click="emit('add', p)">Add</button>
      </li>
    </ul>
  </section>
</template>`

const drillPanel = `<script setup>
defineProps({ items: { type: Array, required: true } })
</script>

<template>
  <section class="cart">
    <h3>Your cart</h3>
    <p v-if="items.length === 0" class="empty">Nothing here yet.</p>
    <ul v-else>
      <li v-for="line in items" :key="line.id" class="cart-line">{{ line.name }} × {{ line.qty }}</li>
    </ul>
  </section>
</template>`

// ---- variant: a preview of the same shop with Pinia (next lesson)
const piniaMain = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')`

const piniaStore = `import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  getters: {
    itemCount: (state) => state.items.length,
  },
  actions: {
    addToCart(product) {
      const line = this.items.find((l) => l.id === product.id)
      if (line) line.qty++
      else this.items.push({ ...product, qty: 1 })
    },
  },
})`

const piniaApp = `<script setup>
import CartBadge from './CartBadge.vue'
import ProductList from './ProductList.vue'
import CartPanel from './CartPanel.vue'
</script>

<template>
  <header class="top"><strong>Corner Shop</strong> <span>🛒 <CartBadge /></span></header>
  <main class="layout">
    <ProductList />
    <CartPanel />
  </main>
</template>`

const piniaBadge = `<script setup>
import { useCartStore } from './stores/cart.js'
const cart = useCartStore()
</script>

<template>
  <span class="badge">{{ cart.itemCount }}</span>
</template>`

const piniaList = `<script setup>
import { useCartStore } from './stores/cart.js'
const cart = useCartStore()
const products = [
  { id: 1, name: 'Coffee mug', price: 12 },
  { id: 2, name: 'Notebook', price: 8 },
  { id: 3, name: 'Desk plant', price: 20 },
]
</script>

<template>
  <section class="products">
    <h3>Products</h3>
    <ul>
      <li v-for="p in products" :key="p.id">
        {{ p.name }} <button class="add" @click="cart.addToCart(p)">Add</button>
      </li>
    </ul>
  </section>
</template>`

const piniaPanel = `<script setup>
import { useCartStore } from './stores/cart.js'
const cart = useCartStore()
</script>

<template>
  <section class="cart">
    <h3>Your cart</h3>
    <p v-if="cart.items.length === 0" class="empty">Nothing here yet.</p>
    <ul v-else>
      <li v-for="line in cart.items" :key="line.id" class="cart-line">{{ line.name }} × {{ line.qty }}</li>
    </ul>
  </section>
</template>`

export default {
  id: 'why-state-management',
  title: 'Why shared state? Local vs global',
  summary: 'Learn which state belongs inside one component, when props and events are enough, and why apps eventually need one shared, predictable store.',
  difficulty: 'intermediate',
  minutes: 30,
  prerequisites: ['props', 'emits', 'component-communication'],
  related: ['pinia-basics', 'provide-inject', 'composables-intro', 'using-stores'],
  tags: ['state management', 'shared state', 'global state', 'local state', 'prop drilling', 'lifting state up', 'pinia', 'store'],
  apis: [
    { name: 'reactive() at module level', summary: 'A reactive object created in a plain .js module is shared by every component that imports it — the simplest possible "store".' },
    { name: 'Prop drilling', summary: 'Passing a prop through components that do not use it, only to reach a deeper child.' },
    { name: 'Lifting state up', summary: 'Moving state into the closest common parent so siblings can share it via props and events.' },
  ],
  docs: [
    { label: 'Vue Guide — State Management', url: 'https://vuejs.org/guide/scaling-up/state-management.html' },
    { label: 'Pinia — Introduction & "Why should I use Pinia?"', url: 'https://pinia.vuejs.org/introduction.html' },
    { label: 'Vue Guide — Props: one-way data flow', url: 'https://vuejs.org/guide/components/props.html#one-way-data-flow' },
  ],

  intro: `
*State* is the data your app remembers right now: what is in the cart, who is logged in, whether a menu is open, what the user typed into a search box.

Some state belongs to **one component** — a dropdown's "am I open?" flag matters to nobody else. Other state is needed by **many components that are far apart** — the cart count in the header, the cart page, and the "Add" buttons on every product card.

This lesson is about telling those two apart, using the simple tools (props and events) when they are enough, and recognising the moment you need one **shared store** that everyone can read and change in a predictable way. That store is what [Pinia](lesson:pinia-basics) gives you in the next lesson.
`,

  why: `
Components are great at keeping things separate. That is also their problem: by default, a component's data is **private**. If the header's cart badge and the product list both need the cart, someone has to own it and share it.

With only props and events, the owner must be the closest common parent — often the root \`App\`. Then the data has to travel:

- **down** through every component in between, as props, even ones that never use it (*prop drilling*);
- **up** through every level, as events, whenever something changes it.

Two components deep, that is fine. Five levels deep with ten consumers, every new feature means editing components that have nothing to do with it, and tracing "who changed the cart?" becomes detective work.

Shared state management exists so that **data many parts of the app need lives in one place**, any component can read it directly, and changes go through a small number of well-named functions you can find, test and debug.
`,

  eli15: `
Picture a family with one fridge whiteboard. On it: the shopping list.

Things only *you* care about — your homework, what song is stuck in your head — stay in your own notebook. That is **local state**.

The shopping list is different. Mum adds milk, your brother adds cereal, and whoever goes to the shop reads it. If the list were only in one person's notebook, everyone else would have to ask them, and they would have to pass messages from room to room. That message-passing is **prop drilling**.

The whiteboard is a **shared store**: one list, in one spot, that everyone can read. And because the family agreed to only *add* or *cross out* items (no scribbling over the whole board), nobody has to wonder what happened to the list.
`,

  analogy: {
    title: 'The fridge whiteboard',
    body: `
A house runs on two kinds of information. Private notes live in each person's pocket. Household facts — the shopping list, who has the car tonight — live on the whiteboard on the fridge, where anyone can glance at them.

Passing household facts from person to person ("tell your sister to tell Dad…") is slow and error-prone. Putting *everything* on the whiteboard is just as bad: soon nobody can find the shopping list among doodles and phone numbers. The skill is choosing what goes on the board — and agreeing on *how* people are allowed to change it.
`,
    mapping: [
      ['your pocket notebook', 'local component state (a `ref` inside one component)'],
      ['"tell your sister to tell Dad"', 'prop drilling — passing data through components that do not need it'],
      ['the fridge whiteboard', 'a shared store (a module-level `reactive()` object, or a Pinia store)'],
      ['"only add or cross out items"', 'actions: the agreed, named ways to change shared state'],
      ['a cluttered whiteboard', 'a "god store" holding state that should have stayed local'],
    ],
  },

  visual: {
    type: 'pinia',
    props: { preset: 'local-vs-shared' },
    title: 'Local state vs shared state',
    caption: 'Change the local value in one component and only that component updates. Change the shared value and every component that reads it updates — wherever it sits in the tree.',
    alt: 'Several sibling components. Each holds its own local counter; changing one only re-renders that component. A shared store sits beside them; changing its value re-renders every component that reads it.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Prop drilling vs a shared store',
    caption: 'Step through how the cart reaches the badge with props, and how a store removes the middlemen.',
    alt: 'A component tree. App at the top owns the cart. Layout and Header sit between App and CartBadge and only pass the cart down as props. ProductList emits an add event up to App. In the last step a shared store appears; CartBadge and ProductList connect to it directly and Layout and Header no longer carry the cart.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'app', label: 'App', note: 'owns cart', x: 380, y: 40, tone: 'acid' },
        { id: 'layout', label: 'Layout', note: 'passes cart ↓', x: 200, y: 120 },
        { id: 'header', label: 'Header', note: 'passes cart ↓', x: 200, y: 200 },
        { id: 'badge', label: 'CartBadge', note: 'reads count', x: 200, y: 280, tone: 'cobalt' },
        { id: 'list', label: 'ProductList', note: 'adds items', x: 580, y: 160, tone: 'cobalt' },
        { id: 'store', label: 'Shared store', note: 'cart lives here', x: 440, y: 280, tone: 'kraft' },
      ],
      edges: [
        { from: 'app', to: 'layout', label: 'prop' },
        { from: 'layout', to: 'header', label: 'prop' },
        { from: 'header', to: 'badge', label: 'prop' },
        { from: 'list', to: 'app', label: "emit('add')" },
        { from: 'store', to: 'badge', label: 'reads', dashed: true },
        { from: 'list', to: 'store', label: 'addToCart()', dashed: true },
      ],
      steps: [
        { focus: ['app'], text: 'With only props and events, the cart must live in the **closest common parent** of everyone who needs it. Here that is `App`.' },
        { focus: ['layout', 'header', 'badge'], edges: ['app->layout', 'layout->header', 'header->badge'], text: 'To show a count in the badge, the cart travels down as a prop through `Layout` and `Header`. Neither uses it — they only carry it. That is **prop drilling**.' },
        { focus: ['list', 'app'], edges: ['list->app'], text: 'When `ProductList` adds an item, it cannot change the cart itself (props are read-only). It emits an event up to `App`, which changes the cart, which flows down again.' },
        { focus: ['store', 'badge', 'list'], edges: ['store->badge', 'list->store'], text: 'With a **shared store**, the cart lives outside the tree. The badge reads it directly; the list calls a store function to change it. `Layout` and `Header` stop caring.' },
      ],
    },
  },

  syntax: [
    `
#### 1. Local state — the default

If only one component (and maybe its direct children) needs a value, keep it inside that component:
`,
    {
      code: `<script setup>
import { ref } from 'vue'
const isOpen = ref(false) // nobody outside this dropdown cares
</script>`,
      lang: 'vue',
      title: 'Dropdown.vue',
    },
    `
#### 2. Lifting state up — when siblings must agree

When two siblings need the same value, move it to their **closest common parent** and share it with props (data down) and events (changes up). This is often all you need — no library required.
`,
    {
      code: `<!-- Parent.vue -->
<script setup>
import { ref } from 'vue'
const query = ref('')
</script>

<template>
  <SearchBox v-model="query" />        <!-- changes come up -->
  <ResultsList :query="query" />       <!-- data goes down -->
</template>`,
      lang: 'vue',
      title: 'lifting state up',
    },
    `
#### 3. A shared module — the simplest "store"

A \`reactive()\` object created in a plain \`.js\` file is evaluated **once**, and every importer gets the same object. Vue's reactivity is not tied to components, so any component that reads it will update when it changes. The Vue guide shows exactly this pattern:
`,
    {
      code: `// cart.js
import { reactive } from 'vue'

export const cart = reactive({ items: [] })

export function addToCart(product) {
  cart.items.push({ ...product, qty: 1 })
}`,
      lang: 'js',
      title: 'cart.js — simplified store',
    },
    `
#### 4. A real store library — Pinia

[Pinia](lesson:pinia-basics) is the officially recommended state management library for Vue. It keeps the same idea (one shared reactive object) and adds devtools integration, plugins, testing helpers, SSR safety and hot module replacement:
`,
    {
      code: `import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  actions: {
    addToCart(product) { this.items.push({ ...product, qty: 1 }) },
  },
})`,
      lang: 'js',
      title: 'stores/cart.js — preview of the next lesson',
    },
    `
**Rules of thumb for where state lives:**

1. **Start local.** Move state up only when a second component genuinely needs it.
2. **Parent + child, or close siblings?** Props and events (or \`v-model\`).
3. **A subtree that shares context** (a form and its fields, a tabs widget and its panels)? [provide / inject](lesson:provide-inject).
4. **Many distant components, or state that must outlive a page** (cart, logged-in user, preferences)? A store.
5. **State that belongs in the address bar** (search filters, current page, selected tab) — keep it in the URL with the router so links and the back button work.
6. **Never store what you can compute.** Totals, counts and filtered lists are \`computed()\` values derived from state, not extra state to keep in sync.
`,
    {
      callout: 'note',
      title: 'Not all "global" data is client state',
      text: 'Data that really lives on a server (products, orders, a user profile) is a *cache* of the server, not state your app invents. You can keep it in a store, but it brings its own problems — staleness, refetching, loading states. You will handle those in [async store patterns](lesson:pinia-async-patterns).',
    },
  ],

  walkthrough: {
    title: 'cart.js',
    lang: 'js',
    code: cartModule,
    intro: 'This tiny module is the whole "store" in the playground. Step through it to see why every component that imports it shares the same cart.',
    steps: [
      { lines: [1], text: '`reactive` and `computed` work anywhere — not only inside components. That is what makes a shared module possible.' },
      { lines: [3, 7], text: 'An ES module runs **once**, the first time it is imported. So this `reactive()` object is created a single time and every `import { cart }` receives the very same object.' },
      { lines: [9, 10], text: '`itemCount` is **derived state**: computed from `cart.items`, never stored separately. Any component that shows it re-renders when the items change.' },
      { lines: [12, 14], text: 'The subtotal is derived too. If you stored it as its own number, you would have to remember to update it on every change — and one day you would forget.' },
      { lines: [16, 20], text: 'Changes go through a named function. Components *could* push into `cart.items` directly, but routing changes through `addToCart()` keeps the rules (merge duplicate products) in one place.' },
    ],
  },

  playground: {
    title: 'Corner Shop: one cart, three components',
    objective: 'See three components that never pass props to each other stay in sync through one shared module — then change the shared state and a local state side by side.',
    files: {
      'App.vue': appVue,
      'cart.js': cartModule,
      'CartBadge.vue': badgeVue,
      'ProductList.vue': productListVue,
      'CartPanel.vue': cartPanelVue,
    },
    expected: 'A header with a cart badge showing **0**, a product list and an empty cart panel. Clicking **Add** updates the badge *and* the panel at once, even though no props or events connect them. Adding the same product twice increases its quantity but the badge still counts lines — you will change that.',
    experiments: [
      {
        id: 'badge-quantity',
        task: 'Add the **Coffee mug** twice: the badge says 1 because it counts *lines*. Change `itemCount` in `cart.js` so it counts the **total quantity** (2 mugs → 2).',
        hint: 'Replace `cart.items.length` with a `reduce` that adds up `line.qty`, like `subtotal` does with prices.',
        tests: [
          {
            name: 'two mugs show 2 in the badge',
            code: `const add = findAll('.add')[0]
await click(add)
await click(add)
expect(text('.badge')).toBe('2')`,
          },
          {
            name: 'a mug and a notebook show 2 as well',
            code: `const adds = findAll('.add')
await click(adds[0])
await click(adds[1])
expect(text('.badge')).toBe('2')`,
          },
        ],
        explain: 'You changed one line in the shared module and the badge updated without touching `CartBadge.vue`. Derived state lives next to the data it comes from; every reader gets the new rule for free.',
      },
      {
        id: 'clear-cart',
        task: 'Add a `clearCart()` function to `cart.js` and a **Clear** button with `class="clear"` in `CartPanel.vue` that empties the cart.',
        hint: 'In `cart.js`: `export function clearCart() { cart.items.splice(0) }` (or `cart.items = []`). Import it in `CartPanel.vue` and call it from `@click`.',
        tests: [
          {
            name: 'Clear empties the cart everywhere',
            code: `await click(findAll('.add')[0])
await click(findAll('.add')[1])
expect(exists('.clear')).toBe(true)
await click('.clear')
expect(text('.badge')).toBe('0')
expect(findAll('.cart-line')).toHaveLength(0)`,
          },
        ],
        explain: 'The button lives in the panel, but the badge in the header emptied too. Neither component knows the other exists — they only know the shared state.',
      },
      {
        id: 'local-collapse',
        task: 'Give `CartPanel.vue` a **local** `ref` that hides and shows the list of lines, toggled by a button with `class="toggle"`. The badge must keep showing the count while the list is hidden.',
        hint: 'Inside `CartPanel.vue`: `const expanded = ref(true)`, a button `@click="expanded = !expanded"`, and `v-if="expanded"` (or `v-show`) on the list.',
        tests: [
          {
            name: 'toggle hides the lines but not the badge count',
            code: `await click(findAll('.add')[0])
expect(exists('.toggle')).toBe(true)
await click('.toggle')
expect(findAll('.cart-line').filter((el) => isVisible(el))).toHaveLength(0)
expect(text('.badge')).toBe('1')
await click('.toggle')
expect(findAll('.cart-line').filter((el) => isVisible(el))).toHaveLength(1)`,
          },
        ],
        explain: '"Is the list expanded?" is a fact about *this panel only*, so it stays local. If you had put it in `cart.js`, every cart panel on every page would collapse together — the classic mistake of making UI state global.',
      },
      {
        id: 'rogue-write',
        task: 'In `CartBadge.vue`, import `cart` and add `<button @click="cart.items = []">oops</button>`. Click it after adding items. Then delete it again.',
        hint: 'Nothing stops you — that is the point of this experiment.',
        explain: 'A plain shared module lets **any** file change shared state in **any** way, and nothing records who did it. In a big app that makes bugs hard to trace. Pinia keeps the shared object but adds named actions and a devtools timeline, so changes are easy to find and replay.',
      },
    ],
    variants: [
      {
        id: 'prop-drilling',
        label: 'Same shop with props & events (prop drilling)',
        files: {
          'App.vue': drillApp,
          'TheHeader.vue': drillHeader,
          'CartBadge.vue': drillBadge,
          'ProductList.vue': drillList,
          'CartPanel.vue': drillPanel,
        },
      },
      {
        id: 'pinia-preview',
        label: 'Same shop with Pinia (preview)',
        files: {
          'main.js': piniaMain,
          'stores/cart.js': piniaStore,
          'App.vue': piniaApp,
          'CartBadge.vue': piniaBadge,
          'ProductList.vue': piniaList,
          'CartPanel.vue': piniaPanel,
        },
      },
    ],
  },

  internals: {
    beginner: `
Two facts make shared state work.

First, a JavaScript **module runs once**. However many components write \`import { cart } from './cart.js'\`, they all get the *same* object — not copies.

Second, Vue's reactivity is **not tied to components**. When a component draws itself, Vue notes every reactive value it reads, wherever that value was created. Change the value later and Vue redraws every component that read it. So one reactive object in a module, read by three components, keeps all three in sync.
`,
    technical: [
      `
**Module singletons.** ES modules are evaluated once per module graph and cached; later imports return the cached exports. A \`reactive()\` created at the top level of a module is therefore a process-wide singleton.

**Effects subscribe to any reactive source.** Each component's render function runs inside a reactive *effect*. Reading \`cart.items\` during render registers that effect as a dependency of the \`items\` property on that proxy (track). Mutating it triggers every subscribed effect (trigger), and the scheduler re-renders those components in the next microtask. Where the object was created is irrelevant.

**What prop drilling costs.** A component that passes a prop down reads it in its own render (\`:count="count"\`), so it becomes a dependency of that prop and re-renders when it changes, even if it shows nothing related. Every intermediate component also has to *declare* the prop and, for changes, re-emit events. The cost is mostly maintenance — coupling unrelated components — rather than raw speed.
`,
      {
        code: `// The same reactive object, imported in two places
// Badge.vue                         // Panel.vue
import { cart } from './cart.js'     import { cart } from './cart.js'
// render reads cart.items.length    // render reads cart.items
//            \\                        /
//             └── both effects subscribe to cart.items ──┘
// addToCart() mutates cart.items → both re-render`,
        lang: 'js',
        title: 'two readers, one source',
      },
      `
**Why a plain module is not enough at scale.** The pattern above has no record of *who* changed state, no devtools panel, no plugin hooks (for persistence, logging), no easy way to reset state between tests, and — most importantly — it breaks with server-side rendering.
`,
    ],
    production: `
- **SSR cross-request state pollution.** On a Node server, modules are evaluated once for the whole server process, so a module-level \`reactive()\` is shared by *every user's request*. One user's cart could leak into another user's page. The Vue guide calls this out explicitly; Pinia avoids it because each request creates its own \`createPinia()\` instance and stores live inside it.
- **Traceability.** Pinia integrates with Vue DevTools: you can inspect each store, edit its state, and see actions on a timeline. With a hand-rolled module you get none of that.
- **Testing.** Tests need a fresh state per test. With Pinia you call \`setActivePinia(createPinia())\`; with module singletons you have to add reset functions or re-import modules.
- **Keep the store small.** Global state is a cost: every global value is something any part of the app might depend on. Keep UI-only state (open/closed, hover, which tab) local, keep URL-worthy state in the router, and put in a store only what many distant parts truly share.
- **Server data is a cache.** If most of your "global state" is API data, consider whether a data-fetching layer (covered in [async patterns](lesson:pinia-async-patterns)) fits better than hand-written loading flags.
`,
  },

  mistakes: [
    {
      title: 'Making UI-only state global',
      wrong: { code: `// stores/ui.js
export const ui = reactive({
  isProductModalOpen: false,
  hoveredRowId: null,
  activeTabOnSettingsPage: 'profile',
})`, lang: 'js' },
      right: { code: `<!-- ProductModal.vue -->
<script setup>
import { ref } from 'vue'
const isOpen = ref(false) // only this component cares
</script>`, lang: 'vue' },
      explanation: 'If only one component reads a value, global state just adds a dependency every other part of the app could accidentally touch. Two instances of the component would also share the flag and open together. Keep it local until a second, distant component really needs it.',
    },
    {
      title: 'A "shared" composable that creates new state on every call',
      wrong: { code: `// useCart.js
export function useCart() {
  const items = ref([])          // ❌ a NEW array for every caller
  const add = (p) => items.value.push(p)
  return { items, add }
}`, lang: 'js' },
      right: { code: `// useCart.js
const items = ref([])            // ✅ created once, at module level
export function useCart() {
  const add = (p) => items.value.push(p)
  return { items, add }
}`, lang: 'js' },
      explanation: 'Code inside the function runs once per caller, so each component gets its own private cart. State declared *outside* the function runs once per module, so everyone shares it. Both are valid — but only one is shared state. (For production shared state, prefer a Pinia store; module-level state has the SSR problem described above.)',
    },
    {
      title: 'Storing derived values as extra state',
      wrong: { code: `const cart = reactive({ items: [], count: 0, subtotal: 0 })

function addToCart(p) {
  cart.items.push({ ...p, qty: 1 })
  cart.count++              // must remember…
  cart.subtotal += p.price  // …every single time
}`, lang: 'js' },
      right: { code: `const cart = reactive({ items: [] })
const count = computed(() => cart.items.length)
const subtotal = computed(() =>
  cart.items.reduce((s, l) => s + l.price * l.qty, 0))`, lang: 'js' },
      explanation: 'Stored copies drift: one forgotten line in a "remove" function and the count disagrees with the list. Store the minimum facts and compute the rest.',
    },
    {
      title: 'Mutating a prop to "share" a change',
      wrong: { code: `<script setup>
const props = defineProps({ count: Number })
function add() {
  props.count++ // ❌ props are read-only
}
</script>`, lang: 'vue' },
      right: { code: `<script setup>
defineProps({ count: Number })
const emit = defineEmits(['increment'])
// the parent that owns count changes it
</script>

<template><button @click="emit('increment')">+</button></template>`, lang: 'vue' },
      explanation: 'Props flow one way. Vue warns and ignores the write, because the parent owns that value. Either emit an event so the owner changes it, or — if many components need to change it — move it to a store.',
    },
  ],

  debugging: [
    {
      symptom: 'Two components should show the same cart, but each shows its own different contents.',
      cause: 'The state is created inside a function (a composable or `setup`) that each component calls, so each gets a private copy.',
      fix: 'Create the state once: in a store, in the common parent (passed down), or at module level for a quick prototype.',
    },
    {
      symptom: '"[Vue warn]: Attempting to mutate prop" in the console and nothing changes.',
      cause: 'A child is assigning to a prop it received.',
      fix: 'Emit an event to the owner, use `v-model` on the component, or move the state into a shared store if many components change it.',
    },
    {
      symptom: 'Opening a modal on one page also opens it on another page, or two copies of a widget toggle together.',
      cause: 'Per-instance UI state was put into a global store or module.',
      fix: 'Move it back into the component as a local `ref`.',
    },
    {
      symptom: 'A cart count and the cart list disagree after removing an item.',
      cause: 'The count is stored separately and a code path forgot to update it.',
      fix: 'Delete the stored count and make it a `computed` from the list.',
    },
  ],

  bestPractices: [
    'Default to local state; promote it only when a second, distant component needs it.',
    'Use props and events for parent ↔ child and close siblings — they are explicit and easy to follow.',
    'Use a store for data many unrelated components share: cart, current user, preferences, notifications.',
    'Keep filters, search terms and pagination in the URL when users should be able to share or bookmark them.',
    'Store facts, compute everything else (`computed` for counts, totals, filtered lists).',
    'Route every change to shared state through named functions (actions) so rules live in one place.',
    'In real apps prefer Pinia over hand-rolled module state: devtools, plugins, testing helpers and SSR safety come for free.',
  ],

  useCases: [
    'Shopping cart: product cards add, the header badge counts, the checkout page totals.',
    'Logged-in user: the navbar shows the avatar, route guards check roles, settings edit the profile.',
    'App preferences: theme, language and currency read by many components.',
    'Notifications/toasts: any feature can push a message; one container displays them.',
    'A multi-page wizard whose answers must survive navigating between routes.',
  ],

  whenToUse: {
    use: [
      'Several components in different branches of the tree read or change the same data.',
      'The data must survive the component that created it being unmounted (e.g., moving between routes).',
      'You are passing the same prop through two or more components that do not use it.',
      'You want one place to see, log, persist or test every change to important data.',
    ],
    avoid: [
      'Only one component (plus its direct children) uses the value — keep it local.',
      'The value is UI-only and per-instance: open/closed, hover, focus, which accordion panel.',
      'The value belongs in the URL (filters, search, page number) so it can be shared and bookmarked.',
      'The value can be computed from other state — compute it instead of storing it.',
    ],
  },

  comparison: {
    title: 'Ways to share state',
    headers: ['', 'Props & events', 'provide / inject', 'Module-level `reactive()`', 'Pinia store'],
    rows: [
      ['Best for', 'parent ↔ child, close siblings', 'a subtree sharing context (form + fields, tabs + panels)', 'quick prototypes, small client-only apps', 'app-wide shared state'],
      ['Who can change it', 'only the owner (children emit)', 'whatever the provider exposes', 'any file that imports it', 'any component, ideally through actions'],
      ['Data flow is visible in templates', 'yes', 'no', 'no', 'no — but each store has a name and a devtools panel'],
      ['Devtools support', 'component props', 'component inspector', 'no dedicated panel', 'stores panel, timeline, state editing'],
      ['Safe for SSR by default', 'yes', 'yes', '**no** — shared across requests', 'yes (one pinia per request)'],
      ['Boilerplate', 'grows with tree depth', 'low', 'lowest', 'low'],
    ],
    note: 'Most real apps use all four: local refs, props for nearby components, provide/inject for widget internals, and Pinia for genuinely global data. Next: [Pinia basics](lesson:pinia-basics).',
  },

  quiz: [
    {
      id: 'why-state-management-q1',
      type: 'mcq',
      prompt: 'Which piece of state is the **best** candidate to stay local to one component?',
      options: [
        { text: 'Whether a tooltip on a single button is visible' },
        { text: 'The logged-in user', why: 'The navbar, route guards and settings all need the user — that is shared state.' },
        { text: 'The items in the shopping cart', why: 'The header badge, product cards and checkout all read the cart.' },
        { text: 'The selected UI language', why: 'Almost every component that shows text depends on the language.' },
      ],
      answer: 0,
      explanation: 'A tooltip\'s visibility matters only to the component that renders it. Making it global would let unrelated code depend on it — and two tooltips would toggle together.',
    },
    {
      id: 'why-state-management-q2',
      type: 'output',
      prompt: '`Clicker.vue` and `Display.vue` both call `useCounter()`. Clicker\'s button is clicked **twice**. What does `Display.vue` show?',
      code: {
        lang: 'js',
        code: `// useCounter.js
import { ref } from 'vue'

export function useCounter() {
  const count = ref(0)
  const inc = () => count.value++
  return { count, inc }
}

// Clicker.vue:  const { inc } = useCounter()   → <button @click="inc">
// Display.vue:  const { count } = useCounter() → <p>{{ count }}</p>`,
      },
      options: [
        { text: '2', why: 'That would need both components to share one ref. Here each call creates its own.' },
        { text: '0' },
        { text: 'It throws: `count` is not shared', why: 'Nothing throws — each component simply has its own private counter.' },
        { text: '1', why: 'There is no partial sharing; Display\'s ref is never touched.' },
      ],
      answer: 1,
      explanation: '`ref(0)` runs **inside** the function, so every caller gets a new ref. Clicker increments its own; Display\'s stays 0. Moving `const count = ref(0)` above the function (module level) would make it shared.',
    },
    {
      id: 'why-state-management-q3',
      type: 'bug',
      prompt: 'This module is meant to be a shared store, but components that use it never see each other\'s changes. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `import { reactive } from 'vue'

export function useTodos() {
  const state = reactive({ todos: [] })

  function add(text) {
    state.todos.push({ text, done: false })
  }

  return { state, add }
}`,
      },
      answerLine: 4,
      explanation: '`reactive({ todos: [] })` is created inside `useTodos()`, so each component calling it gets a fresh, private object. Move it above the function to share one object (or use a Pinia store).',
    },
    {
      id: 'why-state-management-q4',
      type: 'fill',
      prompt: 'Complete this minimal shared store so every component that imports `theme` sees the same value.',
      code: {
        lang: 'js',
        code: `import { ___ } from 'vue'

export const theme = reactive({ mode: 'light' })

export function toggleTheme() {
  theme.___ = theme.mode === 'light' ? 'dark' : 'light'
}`,
      },
      answer: [['reactive'], ['mode']],
      explanation: 'Import `reactive`, create the object once at module level, and change it through a named function. Every importer reads the same `theme.mode`.',
    },
    {
      id: 'why-state-management-q5',
      type: 'mcq',
      prompt: 'Select **all** signs that a piece of state should move into a shared store.',
      options: [
        { text: 'You pass it as a prop through components that never use it' },
        { text: 'Components on different routes need it, and it must survive navigation' },
        { text: 'It is the open/closed flag of one accordion panel', why: 'That is per-instance UI state — keep it local.' },
        { text: 'It can be calculated from other state', why: 'Derived values should be `computed`, not stored anywhere.' },
        { text: 'Many unrelated components change it, and you need to know who did' },
      ],
      answer: [0, 1, 4],
      explanation: 'Prop drilling, cross-route lifetime and many writers are the classic signals. UI-only and derived values should not go into a store.',
    },
    {
      id: 'why-state-management-q6',
      type: 'mcq',
      prompt: 'Why does the Vue guide warn against a module-level `reactive()` store in a server-side rendered app?',
      options: [
        { text: 'Reactivity does not work on the server', why: 'Reactive objects work on the server; the problem is who shares them.' },
        { text: 'The module is evaluated once per server process, so all users\' requests would share the same state' },
        { text: 'Modules cannot export reactive objects', why: 'They can — that is exactly what the pattern does in client-only apps.' },
        { text: 'It makes the bundle much larger', why: 'Bundle size is not the concern here.' },
      ],
      answer: 1,
      explanation: 'On the server, one module instance serves every request. A singleton store would leak one user\'s data into another user\'s HTML. Pinia avoids this by creating a fresh pinia (and therefore fresh stores) per request.',
    },
    {
      id: 'why-state-management-q7',
      type: 'short',
      prompt: 'In two or three sentences: what is prop drilling, and what problem does a shared store solve?',
      answer: 'Prop drilling is passing data through intermediate components that do not use it, only so a deeper component can receive it (and passing change events back up the same way). A shared store keeps that data in one place outside the component tree, so any component can read it directly and change it through named actions, without involving the components in between.',
    },
  ],

  exercises: [
    {
      id: 'lift-search',
      title: 'Lift the search query up',
      difficulty: 'beginner',
      prompt: `
\`SearchBox.vue\` keeps the query in its own local \`ref\`, so \`ResultsList.vue\` can never see it. Fix it **without a store** — this is a job for props and events.

- \`App.vue\` must own the query and pass it to both children.
- \`SearchBox.vue\` keeps its \`<input class="search">\` and sends changes up (\`v-model\` on the component — \`defineModel()\` needs Vue 3.4+ — or a \`modelValue\` prop + \`update:modelValue\` emit).
- \`ResultsList.vue\` receives a \`query\` prop (a string, default \`''\`) and renders only fruits whose name contains it, **case-insensitively**, each as \`<li class="result">\`.
- An empty query shows all six fruits.
`,
      files: {
        'App.vue': `<script setup>
import SearchBox from './SearchBox.vue'
import ResultsList from './ResultsList.vue'
</script>

<template>
  <SearchBox />
  <ResultsList />
</template>`,
        'SearchBox.vue': `<script setup>
import { ref } from 'vue'

// This query is trapped inside SearchBox — ResultsList can't see it.
const query = ref('')
</script>

<template>
  <label>
    Search fruit
    <input class="search" v-model="query" />
  </label>
</template>`,
        'ResultsList.vue': `<script setup>
import { computed } from 'vue'

const fruits = ['Apple', 'Banana', 'Cherry', 'Mango', 'Orange', 'Pineapple']

// TODO: receive the query as a prop and filter by it
const visible = computed(() => fruits)
</script>

<template>
  <ul>
    <li v-for="fruit in visible" :key="fruit" class="result">{{ fruit }}</li>
  </ul>
</template>`,
      },
      hints: [
        'The query must live in the closest common parent of the two components: `App.vue`.',
        'In `App.vue`: `const query = ref(\'\')`, then `<SearchBox v-model="query" />` and `<ResultsList :query="query" />`.',
        'In `SearchBox.vue` replace the local ref with `const query = defineModel({ default: \'\' })`. In `ResultsList.vue`: `const props = defineProps({ query: { type: String, default: \'\' } })` and filter with `fruit.toLowerCase().includes(props.query.toLowerCase())`.',
      ],
      solution: {
        explanation: 'The query now has one owner, `App`, which is the closest common parent. Data flows down (`:query`), changes flow up (`v-model`). No store was needed because the two components are siblings with a shared parent one level up — props and events are the simplest correct tool.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import SearchBox from './SearchBox.vue'
import ResultsList from './ResultsList.vue'

const query = ref('')
</script>

<template>
  <SearchBox v-model="query" />
  <ResultsList :query="query" />
</template>`,
          'SearchBox.vue': `<script setup>
// defineModel() (Vue 3.4+) = a modelValue prop + an update:modelValue emit
const query = defineModel({ type: String, default: '' })
</script>

<template>
  <label>
    Search fruit
    <input class="search" v-model="query" />
  </label>
</template>`,
          'ResultsList.vue': `<script setup>
import { computed } from 'vue'

const props = defineProps({ query: { type: String, default: '' } })

const fruits = ['Apple', 'Banana', 'Cherry', 'Mango', 'Orange', 'Pineapple']

const visible = computed(() => {
  const q = props.query.trim().toLowerCase()
  return fruits.filter((fruit) => fruit.toLowerCase().includes(q))
})
</script>

<template>
  <ul>
    <li v-for="fruit in visible" :key="fruit" class="result">{{ fruit }}</li>
  </ul>
</template>`,
        },
      },
      tests: [
        { name: 'shows all six fruits at first', code: `expect(findAll('.result')).toHaveLength(6)` },
        {
          name: 'typing "an" filters the list',
          code: `await type('.search', 'an')
expect(findAll('.result').map((el) => el.textContent.trim())).toEqual(['Banana', 'Mango', 'Orange'])`,
        },
        {
          name: 'filtering is case-insensitive',
          code: `await type('.search', 'AP')
expect(findAll('.result').map((el) => el.textContent.trim())).toEqual(['Apple', 'Pineapple'])`,
        },
        {
          name: 'clearing the box shows everything again',
          code: `await type('.search', 'an')
await type('.search', '')
expect(findAll('.result')).toHaveLength(6)`,
        },
        {
          name: 'ResultsList filters by its query prop',
          code: `const w = mountFile('ResultsList.vue', { query: 'cher' })
expect(w.text()).toBe('Cherry')`,
        },
      ],
    },
    {
      id: 'shared-notifications',
      title: 'A tiny shared notification store',
      difficulty: 'intermediate',
      prompt: `
Three components live in different corners of the app and must share one list of notifications. Build a shared module **without Pinia** (you will meet Pinia next lesson).

In \`notifications.js\` export:

- \`state\` — a \`reactive({ items: [] })\` object; each item is \`{ id, text }\`;
- \`notify(text)\` — adds an item with a unique \`id\`; **ignores** empty or whitespace-only text (trim it);
- \`dismiss(id)\` — removes the item with that id.

Then wire the components:

- \`Composer.vue\`: \`<input class="message">\` + \`<button class="notify">\` → calls \`notify()\` and clears the input.
- \`Bell.vue\`: \`<span class="bell-count">\` shows how many notifications exist.
- \`NotificationList.vue\`: a \`<ul class="notifications">\` with one \`<li class="notification">\` per item, each containing the text and a \`<button class="dismiss">\`.
`,
      files: {
        'App.vue': `<script setup>
import Composer from './Composer.vue'
import Bell from './Bell.vue'
import NotificationList from './NotificationList.vue'
</script>

<template>
  <header>🔔 <Bell /></header>
  <Composer />
  <NotificationList />
</template>`,
        'notifications.js': `import { reactive } from 'vue'

// TODO: export a shared \`state\`, plus notify(text) and dismiss(id)
`,
        'Composer.vue': `<script setup>
import { ref } from 'vue'

const text = ref('')
const sent = ref([]) // ❌ local: nobody else can see these

function send() {
  if (!text.value.trim()) return
  sent.value.push(text.value.trim())
  text.value = ''
}
</script>

<template>
  <input class="message" v-model="text" placeholder="Message" />
  <button class="notify" @click="send">Notify</button>
</template>`,
        'Bell.vue': `<template>
  <span class="bell-count">0</span>
</template>`,
        'NotificationList.vue': `<template>
  <ul class="notifications"></ul>
</template>`,
      },
      hints: [
        'Create the state at the top level of `notifications.js` — outside any function — so it is created once and shared.',
        'Keep a module-level counter for ids: `let nextId = 1`, then `state.items.push({ id: nextId++, text: clean })`. For `dismiss`, find the index and `splice` it out (or reassign a filtered array).',
        'Each component imports what it needs: Composer imports `notify`, Bell imports `state` and shows `state.items.length`, the list imports `state` and `dismiss` and loops with `v-for="n in state.items" :key="n.id"`.',
      ],
      solution: {
        explanation: 'The module is evaluated once, so `state` is one object shared by every importer — and even by code outside components. Changes go through `notify` and `dismiss`, which hold the rules (trim, ignore empty, unique ids). This is a hand-rolled store: fine for learning and small client-only apps; Pinia adds devtools, plugins, testing helpers and SSR safety.',
        files: {
          'App.vue': `<script setup>
import Composer from './Composer.vue'
import Bell from './Bell.vue'
import NotificationList from './NotificationList.vue'
</script>

<template>
  <header>🔔 <Bell /></header>
  <Composer />
  <NotificationList />
</template>`,
          'notifications.js': `import { reactive } from 'vue'

let nextId = 1

// One object for the whole app (simplified store — see the Pinia lessons)
export const state = reactive({ items: [] })

export function notify(text) {
  const clean = String(text ?? '').trim()
  if (!clean) return
  state.items.push({ id: nextId++, text: clean })
}

export function dismiss(id) {
  const index = state.items.findIndex((item) => item.id === id)
  if (index !== -1) state.items.splice(index, 1)
}`,
          'Composer.vue': `<script setup>
import { ref } from 'vue'
import { notify } from './notifications.js'

const text = ref('')

function send() {
  notify(text.value)
  text.value = ''
}
</script>

<template>
  <input class="message" v-model="text" placeholder="Message" />
  <button class="notify" @click="send">Notify</button>
</template>`,
          'Bell.vue': `<script setup>
import { state } from './notifications.js'
</script>

<template>
  <span class="bell-count">{{ state.items.length }}</span>
</template>`,
          'NotificationList.vue': `<script setup>
import { state, dismiss } from './notifications.js'
</script>

<template>
  <ul class="notifications">
    <li v-for="n in state.items" :key="n.id" class="notification">
      {{ n.text }}
      <button class="dismiss" @click="dismiss(n.id)">Dismiss</button>
    </li>
  </ul>
</template>`,
        },
      },
      tests: [
        {
          name: 'sending from Composer updates the Bell',
          code: `await type('.message', 'Deploy finished')
await click('.notify')
expect(text('.bell-count')).toBe('1')`,
        },
        {
          name: 'the list shows every notification',
          code: `await type('.message', 'Deploy finished')
await click('.notify')
await type('.message', 'New comment')
await click('.notify')
expect(findAll('.notification')).toHaveLength(2)
expect(text('.notifications')).toContain('Deploy finished')
expect(text('.notifications')).toContain('New comment')`,
        },
        {
          name: 'dismiss removes it everywhere',
          code: `await type('.message', 'One')
await click('.notify')
await type('.message', 'Two')
await click('.notify')
await click(findAll('.dismiss')[0])
expect(text('.bell-count')).toBe('1')
expect(text('.notifications')).toContain('Two')
expect(text('.notifications')).not.toContain('One')`,
        },
        {
          name: 'empty messages are ignored',
          code: `await type('.message', '   ')
await click('.notify')
expect(text('.bell-count')).toBe('0')`,
        },
        {
          name: 'notify() from outside any component updates the UI',
          code: `const { notify, state } = requireModule('notifications.js')
notify('From the outside')
await flush()
expect(state.items).toHaveLength(1)
expect(text('.bell-count')).toBe('1')
expect(text('.notifications')).toContain('From the outside')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'why-state-management-prop-drilling',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is prop drilling, and why would you use a store like Pinia instead?',
      answer: 'Prop drilling is passing data through layers of components that do not use it, just so a deeply nested component can receive it — and bubbling change events back up the same chain. A store holds shared data outside the component tree, so any component reads it directly and changes it through named actions, without the intermediate components knowing.',
      explanation: 'Each extra layer has to declare the prop, pass it on, and re-emit events. That couples unrelated components and makes refactors painful. A store removes the middlemen.',
      code: {
        lang: 'vue',
        code: `<!-- Without a store: Header only exists here to carry "count" -->
<Header :count="cartCount" />          <!-- App.vue -->
<CartBadge :count="count" />           <!-- Header.vue -->

<!-- With Pinia: the badge asks the store itself -->
<script setup>
import { useCartStore } from '@/stores/cart'
const cart = useCartStore()
</script>
<template><span>{{ cart.itemCount }}</span></template>`,
      },
      whyAsked: 'It is the most common entry question about state management. Interviewers want to hear that you know the *cost* of prop drilling and also when it is perfectly fine.',
      mistakes: [
        'Saying props are bad — for parent/child communication they are the clearest tool.',
        'Claiming a store makes the app faster; the main benefit is maintainability and traceability.',
        'Not mentioning that store changes should go through actions.',
      ],
      followUps: [
        'When would you still choose props and events?',
        'How is provide/inject different from a store?',
        'What do you lose by putting state in a store?',
      ],
      modelAnswer: 'Prop drilling is when data has to travel through several components that do not use it, just to reach a deeply nested child — and events travel back up the same path. It couples unrelated components and makes every change touch many files. A store such as Pinia keeps shared data outside the tree: any component reads it directly and changes it through named actions, and devtools show every change. I still use props and events for parent-child communication because they are explicit; I reach for a store when distant components share data, or when it must survive route changes.',
      challenge: 'Open the *prop drilling* variant of the playground and count how many files you would edit to add a "Remove" button to the cart. Then do the same in the *Pinia preview* variant.',
    },
    {
      id: 'why-state-management-placement',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 4,
      question: 'For an online shop, where would you keep each of these: (a) whether the mobile menu is open, (b) the logged-in user, (c) category filters and page number on the product list, (d) the cart, (e) the text typed into a checkout form before submit, (f) the cart total?',
      answer: '(a) local component state; (b) a store (e.g., an auth/user store); (c) the URL query string via the router, so the view can be bookmarked and the back button works; (d) a store, possibly persisted; (e) local state in the form component (or a form composable); (f) nowhere — compute it from the cart with a getter/`computed`.',
      explanation: 'Each placement follows a rule: who reads it, how long it must live, and whether it should be shareable or derived.',
      whyAsked: 'It tests judgement rather than API knowledge: experienced developers avoid both prop drilling and the "everything global" god store.',
      mistakes: [
        'Putting everything in the store "to be safe".',
        'Storing the cart total as its own state instead of deriving it.',
        'Forgetting the URL as a place for state.',
      ],
      followUps: [
        'The checkout form now spans three routes. Does (e) move?',
        'How would you persist the cart across reloads?',
        'What changes if the app is server-side rendered?',
      ],
      modelAnswer: 'I place state by who needs it and how long it lives. The mobile menu flag is UI state for one component, so it stays local. The logged-in user is read by the navbar, guards and settings — that goes in a store. Filters and pagination belong in the URL so users can share links and use the back button. The cart is shared across distant components and routes, so it goes in a store, maybe persisted. The checkout draft stays local to the form until it spans routes. And the total is derived — a getter, never stored.',
    },
    {
      id: 'why-state-management-everything-global',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A teammate proposes moving *all* component state into Pinia "so it is easy to find". How do you respond?',
      answer: 'Disagree respectfully: global state is a cost. Every value in a store can be read and changed from anywhere, per-instance UI state breaks when two instances share it, and the store becomes a grab bag that is hard to reason about. Keep UI-only state local, URL-worthy state in the router, derived values computed, and put in stores only data that many distant parts share — organised as several small domain stores.',
      explanation: 'Discoverability comes from good file structure and devtools, not from making everything global.',
      whyAsked: 'Checks that you can argue a design trade-off with a colleague, not just recite APIs.',
      mistakes: [
        'Agreeing because "Pinia is the recommended way to manage state".',
        'Rejecting stores entirely.',
        'Missing the bug: two instances of a component sharing per-instance state.',
      ],
      followUps: ['How would you split stores in a large app?', 'How do you decide when to promote local state to a store?'],
      modelAnswer: 'I would push back. Moving everything into Pinia makes every value global: any file can depend on it, two instances of a component would share flags like "is open", and the store turns into a junk drawer. I would keep UI-only state local, put filters and pagination in the URL, compute derived values, and use small domain stores — cart, auth, preferences — for genuinely shared data. If the goal is finding state, good folder structure and Vue DevTools solve that.',
    },
    {
      id: 'why-state-management-module-vs-pinia',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'You can share state with `export const state = reactive({})` in a module. Why use Pinia at all?',
      answer: 'In a client-only SPA the module pattern works. Pinia adds: SSR safety (state lives in a per-request pinia instead of a process-wide module singleton, avoiding cross-request state pollution), Vue DevTools integration (stores panel, timeline of actions, editing state), a plugin system (persistence, logging), testing utilities (`setActivePinia(createPinia())` for a fresh state per test, `@pinia/testing`), hot module replacement for stores, and good TypeScript inference.',
      explanation: 'The core idea is identical — a shared reactive object. Pinia wraps it with structure and tooling that matter as soon as an app grows or renders on the server.',
      code: {
        lang: 'js',
        code: `// Fine for a small client-only app
export const cart = reactive({ items: [] })

// On a Node SSR server this ONE object would be shared by every request.
// Pinia: createPinia() per request → stores are created inside it.
export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
})`,
      },
      whyAsked: 'Senior candidates are expected to know *why* the library exists, including the SSR pitfall the Vue docs warn about.',
      mistakes: [
        'Saying the module pattern is not reactive.',
        'Not knowing about cross-request state pollution in SSR.',
        'Listing only "devtools" without the testing and plugin story.',
      ],
      followUps: ['What is cross-request state pollution?', 'How do you reset Pinia state between tests?', 'When is the module pattern genuinely fine?'],
      modelAnswer: 'The module pattern and Pinia rest on the same idea: one reactive object many components read. For a small client-only app the module is fine. Pinia earns its place with SSR safety — on the server a module singleton is shared by every request, so one user\'s data could leak into another\'s page, while Pinia creates a pinia per request. It also gives DevTools support with an action timeline, plugins for things like persistence, testing helpers for fresh state per test, HMR, and strong TypeScript inference. So I prototype with whatever is fastest but ship shared state in Pinia.',
    },
    {
      id: 'why-state-management-different-carts',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'The header badge always shows 0 even though the product page adds items to the cart. Both use the composable below. What is wrong?',
      code: {
        lang: 'js',
        code: `// useCart.js
import { ref, computed } from 'vue'

export function useCart() {
  const items = ref([])
  const count = computed(() => items.value.length)
  const add = (product) => items.value.push(product)
  return { items, count, add }
}`,
      },
      options: [
        'The badge needs `items.value.length` in its template',
        'Each call to `useCart()` creates a new `items` ref, so the badge and the product page have separate carts',
        '`computed` does not work inside composables',
        '`push` does not trigger reactivity on refs',
      ],
      correctOption: 1,
      answer: '`const items = ref([])` runs inside `useCart()`, so every component that calls it gets its own private array. The product page adds to its array; the badge reads a different, empty one. Move the ref to module scope for a quick fix, or better, turn it into a Pinia store.',
      explanation: 'Composables are reusable *logic*. Whether they share *state* depends on where the state is created: inside the function = per caller, outside = shared.',
      whyAsked: 'This is one of the most common real bugs when teams start sharing state with composables.',
      mistakes: ['Blaming reactivity or `push`.', 'Suggesting `reactive()` instead of `ref()` — that does not change the per-call problem.'],
      followUps: ['What are the risks of moving the ref to module scope?', 'When do you *want* per-caller state from a composable?'],
      modelAnswer: 'The composable creates `items` inside the function, so each component gets its own cart — the product page fills one and the badge reads another. Composables share logic, not state, unless the state is created outside the function. I could hoist the ref to module scope, which shares it, but for production I would make it a Pinia store so it is SSR-safe, testable and visible in DevTools.',
    },
    {
      id: 'why-state-management-coding-shared-theme',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Clicking the toggle in `ThemeToggle.vue` should change the label in `ThemeBadge.vue` (`class="theme"`) between `light` and `dark`. Both use `useTheme()`, but the badge never changes. Fix `useTheme.js` so they share one theme, without changing the components.',
      starter: {
        files: {
          'App.vue': `<script setup>
import ThemeToggle from './ThemeToggle.vue'
import ThemeBadge from './ThemeBadge.vue'
</script>

<template>
  <ThemeBadge />
  <ThemeToggle />
</template>`,
          'useTheme.js': `import { ref } from 'vue'

export function useTheme() {
  const theme = ref('light')
  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  return { theme, toggle }
}`,
          'ThemeToggle.vue': `<script setup>
import { useTheme } from './useTheme.js'
const { toggle } = useTheme()
</script>

<template>
  <button class="toggle" @click="toggle">Toggle theme</button>
</template>`,
          'ThemeBadge.vue': `<script setup>
import { useTheme } from './useTheme.js'
const { theme } = useTheme()
</script>

<template>
  <span class="theme">{{ theme }}</span>
</template>`,
        },
      },
      tests: [
        { name: 'starts light', code: `expect(text('.theme')).toBe('light')` },
        { name: 'toggle changes the badge to dark', code: `await click('.toggle'); expect(text('.theme')).toBe('dark')` },
        { name: 'toggling twice goes back to light', code: `await click('.toggle'); await click('.toggle'); expect(text('.theme')).toBe('light')` },
      ],
      hints: [
        'Where is `ref(\'light\')` created, and how many times does that line run?',
        'Move the `ref` above the `useTheme` function so the module creates it once.',
      ],
      answer: 'Move `const theme = ref(\'light\')` (and optionally `toggle`) to module scope, outside `useTheme()`, so every caller receives the same ref.',
      solution: {
        files: {
          'App.vue': `<script setup>
import ThemeToggle from './ThemeToggle.vue'
import ThemeBadge from './ThemeBadge.vue'
</script>

<template>
  <ThemeBadge />
  <ThemeToggle />
</template>`,
          'useTheme.js': `import { ref } from 'vue'

// Module scope: created once, shared by every caller
const theme = ref('light')

function toggle() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

export function useTheme() {
  return { theme, toggle }
}`,
          'ThemeToggle.vue': `<script setup>
import { useTheme } from './useTheme.js'
const { toggle } = useTheme()
</script>

<template>
  <button class="toggle" @click="toggle">Toggle theme</button>
</template>`,
          'ThemeBadge.vue': `<script setup>
import { useTheme } from './useTheme.js'
const { theme } = useTheme()
</script>

<template>
  <span class="theme">{{ theme }}</span>
</template>`,
        },
      },
      explanation: 'Code inside the function runs once per caller; code at module scope runs once per app. Hoisting the ref turns per-component state into shared state.',
      whyAsked: 'A quick check that you understand the difference between sharing logic and sharing state.',
      mistakes: ['Passing the theme through props from App instead of fixing the composable.', 'Creating a second ref in the badge and syncing them with a watcher.'],
      followUps: ['What would you change for an SSR app?', 'How would you persist the theme across reloads?'],
      modelAnswer: 'Each component calls `useTheme()`, and the ref is created inside it, so they each get their own theme. I would move the ref to module scope so it is created once and shared. For a production app — especially with SSR — I would put the theme in a small Pinia store instead, and persist it to localStorage if it should survive reloads.',
    },
  ],

  takeaways: [
    'Start with local state; promote it only when a second, distant component needs it.',
    'Props and events (and lifting state up) are the right tool for parent/child and close siblings.',
    'Prop drilling — passing data through components that do not use it — is the signal that a shared store might help.',
    'A module-level `reactive()` object is shared by every importer; it is the core idea behind every store.',
    'Pinia adds devtools, plugins, testing helpers, HMR and SSR safety on top of that idea.',
    'Store facts, compute derived values, and keep URL-worthy state in the router.',
  ],
}
