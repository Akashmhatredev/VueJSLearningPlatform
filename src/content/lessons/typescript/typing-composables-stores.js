// Lesson: Typing composables, generics, APIs & stores (Level 18 — optional TypeScript track)
//
// Runnable code is JavaScript (with JSDoc types where they help); TypeScript is
// shown in static code blocks.

const mainJs = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')`

const apiJs = `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let userCalls = 0

export async function fetchProducts() {
  await wait(60)
  return [
    { id: 1, name: 'Trail Backpack', price: 89 },
    { id: 2, name: 'Camp Stove', price: 45 },
  ]
}

// Fails on the first call, like a flaky network.
export async function fetchUsers() {
  await wait(60)
  userCalls++
  if (userCalls === 1) throw new Error('Network error')
  return [
    { id: 'u1', name: 'Ada' },
    { id: 'u2', name: 'Bea' },
  ]
}`

const useAsyncJs = `import { ref, shallowRef } from 'vue'

/**
 * Generic async state, typed with JSDoc so editors can infer T.
 * TypeScript equivalent: function useAsync<T>(loader: () => Promise<T>)
 *
 * @template T
 * @param {() => Promise<T>} loader
 */
export function useAsync(loader) {
  /** @type {import('vue').ShallowRef<T | null>} */
  const data = shallowRef(null)
  /** @type {import('vue').Ref<Error | null>} */
  const error = ref(null)
  const loading = ref(false)

  async function run() {
    loading.value = true
    error.value = null
    try {
      data.value = await loader()
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      loading.value = false
    }
  }

  run()
  return { data, error, loading, run }
}`

const useAsyncTs = `import { ref, shallowRef } from 'vue'

export function useAsync<T>(loader: () => Promise<T>) {
  const data = shallowRef<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function run(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      data.value = await loader()
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      loading.value = false
    }
  }

  void run()
  return { data, error, loading, run }
}

// const { data } = useAsync(fetchProducts)
// data: ShallowRef<Product[] | null>   ← T inferred from the loader`

const dataListVue = `<script setup>
// In a TypeScript component this would be generic (3.3+): add
//   generic="T extends { id: string | number }" to the script setup tag, then
//   defineProps<{ items: T[] }>()
//   defineEmits<{ select: [item: T] }>()
defineProps({ items: { type: Array, required: true } })
const emit = defineEmits(['select'])
</script>

<template>
  <ul class="list">
    <li v-for="item in items" :key="item.id" class="item" @click="emit('select', item)">
      <slot :item="item">{{ item.id }}</slot>
    </li>
  </ul>
</template>`

const cartJs = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// A setup store: TypeScript infers the whole store type from what you return.
// TS: const lines = ref<CartLine[]>([])
export const useCartStore = defineStore('cart', () => {
  const lines = ref([])

  const count = computed(() => lines.value.reduce((n, line) => n + line.qty, 0))

  function add(product) {
    const line = lines.value.find((l) => l.id === product.id)
    if (line) line.qty++
    else lines.value.push({ id: product.id, name: product.name, price: product.price, qty: 1 })
  }

  return { lines, count, add }
})`

const appVue = `<script setup>
import { useAsync } from './useAsync.js'
import { fetchProducts, fetchUsers } from './api.js'
import { useCartStore } from './cart.js'
import DataList from './DataList.vue'

const { data: products, loading: loadingProducts } = useAsync(fetchProducts)
const { data: users, error: usersError } = useAsync(fetchUsers)
const cart = useCartStore()
</script>

<template>
  <section class="products">
    <h3>Products</h3>
    <p v-if="loadingProducts">Loading…</p>
    <DataList v-else-if="products" :items="products" @select="cart.add" />
  </section>

  <p class="count">In cart: {{ cart.count }}</p>

  <section class="users">
    <h3>Team</h3>
    <p v-if="usersError" class="error">{{ usersError.message }}</p>
    <DataList v-else-if="users" :items="users" />
  </section>
</template>`

// ---------- exercise 1: a generic selection composable
const selectionStarter = `import { ref, computed, toValue } from 'vue'

/**
 * TS: function useSelection<T extends { id: string | number }>(items: MaybeRefOrGetter<T[]>)
 *
 * @template {{ id: string | number }} T
 * @param {import('vue').MaybeRefOrGetter<T[]>} items
 */
export function useSelection(items) {
  // TODO: return { isSelected, toggle, clear, selectedItems, count }
  return {}
}`

const selectionSolution = `import { ref, computed, toValue } from 'vue'

/**
 * TS: function useSelection<T extends { id: string | number }>(items: MaybeRefOrGetter<T[]>)
 *
 * @template {{ id: string | number }} T
 * @param {import('vue').MaybeRefOrGetter<T[]>} items
 */
export function useSelection(items) {
  /** @type {import('vue').Ref<Array<T['id']>>} */
  const selectedIds = ref([])

  const isSelected = (item) => selectedIds.value.includes(item.id)

  function toggle(item) {
    selectedIds.value = isSelected(item)
      ? selectedIds.value.filter((id) => id !== item.id)
      : [...selectedIds.value, item.id]
  }

  function clear() {
    selectedIds.value = []
  }

  // toValue() (3.3+) accepts a plain array, a ref or a getter.
  const selectedItems = computed(() => toValue(items).filter((item) => selectedIds.value.includes(item.id)))
  const count = computed(() => selectedItems.value.length)

  return { isSelected, toggle, clear, selectedItems, count }
}`

const selectionApp = `<script setup>
import { ref } from 'vue'
import { useSelection } from './useSelection.js'

const products = ref([
  { id: 1, name: 'Trail Backpack' },
  { id: 2, name: 'Camp Stove' },
  { id: 3, name: 'Head Lamp' },
])

const { isSelected, toggle, clear, count } = useSelection(products)
</script>

<template>
  <label v-for="p in products" :key="p.id" class="option">
    <input type="checkbox" class="pick" :checked="isSelected(p)" @change="toggle(p)" />
    {{ p.name }}
  </label>
  <p class="selected-count">{{ count }} selected</p>
  <button class="clear" @click="clear">Clear</button>
</template>`

// ---------- exercise 2: a typed Pinia store with async state
const storeMain = mainJs

const storeApi = `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let failNextCall = false

export function failNext() {
  failNextCall = true
}

export async function fetchProducts() {
  await wait(50)
  if (failNextCall) {
    failNextCall = false
    throw new Error('Server unavailable')
  }
  return [
    { id: 1, name: 'Trail Backpack', price: 89, stock: 4 },
    { id: 2, name: 'Camp Stove', price: 45, stock: 0 },
    { id: 3, name: 'Head Lamp', price: 25, stock: 12 },
  ]
}`

const storeStarter = `import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchProducts } from './api.js'

// TS types to implement (static):
//   interface Product { id: number; name: string; price: number; stock: number }
//   type Status = 'idle' | 'loading' | 'success' | 'error'
export const useProductsStore = defineStore('products', () => {
  const products = ref([])

  return { products }
})`

const storeSolution = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchProducts } from './api.js'

// TS:
//   const products = ref<Product[]>([])
//   const status = ref<Status>('idle')
//   const error = ref<Error | null>(null)
export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const status = ref('idle')
  const error = ref(null)

  const inStock = computed(() => products.value.filter((p) => p.stock > 0))

  // A getter that takes an argument is just a function (TS: (id: number) => Product | undefined)
  function byId(id) {
    return products.value.find((p) => p.id === id)
  }

  async function load() {
    status.value = 'loading'
    error.value = null
    try {
      products.value = await fetchProducts()
      status.value = 'success'
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      status.value = 'error'
    }
  }

  return { products, status, error, inStock, byId, load }
})`

const storeApp = `<script setup>
import { useProductsStore } from './products.js'

const store = useProductsStore()
</script>

<template>
  <button class="load" @click="store.load()">Load products</button>
  <p class="status">{{ store.status }}</p>
  <ul>
    <li v-for="p in store.products" :key="p.id" class="product">{{ p.name }}</li>
  </ul>
</template>`

// ---------- interview coding: exhaustive handling of a discriminated union
const matchStarter = `// state is one of:
//   { status: 'idle' } | { status: 'loading' }
//   | { status: 'success', data } | { status: 'error', error }
export function matchState(state, handlers) {
  return null
}`

const matchSolution = `export function matchState(state, handlers) {
  const handler = handlers[state && state.status]
  if (typeof handler !== 'function') {
    // TypeScript would catch a missing handler at compile time (exhaustiveness);
    // at runtime we fail loudly instead of rendering nothing.
    throw new Error('Unhandled status: ' + (state && state.status))
  }
  return handler(state)
}`

const matchApp = `<script setup>
import { matchState } from './matchState.js'

const state = { status: 'success', data: ['Trail Backpack', 'Camp Stove'] }
const label = matchState(state, {
  idle: () => 'Not loaded',
  loading: () => 'Loading…',
  success: (s) => s.data.length + ' products',
  error: (s) => 'Failed: ' + s.error.message,
})
</script>

<template>
  <p class="label">{{ label }}</p>
</template>`

export default {
  id: 'typing-composables-stores',
  title: 'Typing composables, generics, APIs & stores',
  summary: 'Type the logic around your components — generic composables, generic components, API responses, provide/inject and Pinia stores — and recognise the type errors you will meet most often.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['typing-components', 'composables-intro', 'pinia-basics'],
  related: ['why-typescript', 'composable-design', 'using-stores', 'fetching-data', 'scoped-slots', 'pinia-async-patterns', 'provide-inject'],
  tags: ['typescript', 'generics', 'composables', 'MaybeRefOrGetter', 'toValue', 'generic components', 'defineSlots', 'pinia', 'setup store', 'InjectionKey', 'api types', 'discriminated union', 'jsdoc'],
  apis: [
    { name: 'MaybeRefOrGetter<T> / toValue()', summary: 'Accept a plain value, a ref or a getter in composables, and normalise it (3.3+).' },
    { name: '<script setup generic="T">', summary: 'Generic components: props, emits and slots that adapt to the caller\'s types (3.3+).' },
    { name: 'defineSlots<T>()', summary: 'Types a component\'s slots and their props (3.3+).' },
    { name: 'InjectionKey<T>', summary: 'A typed symbol key so provide() and inject() agree on the value\'s type.' },
    { name: 'defineStore(id, setup)', summary: 'Pinia setup store — its state, getters and actions are inferred from what the function returns.' },
  ],
  docs: [
    { label: 'Vue Guide — TypeScript with Composition API', url: 'https://vuejs.org/guide/typescript/composition-api.html' },
    { label: 'Vue Guide — Generic components', url: 'https://vuejs.org/api/sfc-script-setup.html#generics' },
    { label: 'Vue Guide — Typing provide / inject', url: 'https://vuejs.org/guide/typescript/composition-api.html#typing-provide-inject' },
    { label: 'API — toValue()', url: 'https://vuejs.org/api/reactivity-utilities.html#tovalue' },
    { label: 'Pinia — Core concepts (setup stores)', url: 'https://pinia.vuejs.org/core-concepts/' },
  ],

  intro: `
Components are only half of a Vue app. The other half is logic: **composables** that fetch and transform data, **stores** that share state, **API layers** that talk to servers, and **generic components** like lists and tables that work for any kind of item.

That's where TypeScript pays off most. A composable written once — \`useAsync(loader)\` — can tell every caller exactly what its \`data\` holds, whether it loads products, users or invoices. A store typed once gives autocomplete in every component that uses it. And a single validated boundary for API data makes all those types honest.

As in the rest of this track, runnable code is JavaScript (with JSDoc types where they help); TypeScript appears as static code.
`,

  why: `
Shared logic is where untyped mistakes travel furthest. Imagine \`useAsync\` returns \`{ data }\` and fifteen components read \`data.value.items\` — then the API changes to return a plain array. In JavaScript you find out one page at a time. With a typed composable, every affected line lights up at once.

Some patterns are hard to express in JavaScript at all:

- A **generic** list component: "whatever item type you pass in, the slot gives you back *that* type, and \`select\` emits *that* type."
- **Exhaustive** state handling: "this async state is \`idle | loading | success | error\` — and I handled every case."
- **Typed dependency injection**: \`inject(CartKey)\` returns a \`Cart\`, not \`unknown\`.

The goal isn't to annotate everything. Modern Vue and Pinia are designed so that **inference** does most of the work: setup stores and composables infer their return types; you add types at the edges — parameters, API responses, injection keys.
`,

  eli15: `
A composable is like a **recipe card**: "give me any kind of fruit, I'll give you a smoothie of that fruit." A good recipe card says it in a way that promises: strawberries in → strawberry smoothie out, not "some smoothie".

That promise is what **generics** are. \`useAsync<T>\` says: "whatever your loader returns — call it T — my \`data\` will hold exactly that T." Give it products, get products back.

A **store** is the shared fridge everyone in the house uses. If the fridge has labelled shelves (types), nobody puts milk where the eggs go — and everyone can see at a glance what's inside.

And the **API** is the grocery delivery. You still check the bag at the door (validation), because the label on the order form (the type) doesn't guarantee the shop sent the right thing.
`,

  analogy: {
    title: 'Recipe cards, a shared fridge and the grocery delivery',
    body: `
Generic composables are recipe cards that keep the ingredient type all the way through. Typed stores are a labelled shared fridge. The API boundary is the doorstep where you check the delivery before it goes on the shelves.
`,
    mapping: [
      ['a recipe card for "any fruit"', 'a generic composable: `useAsync<T>(loader)`'],
      ['strawberries in → strawberry smoothie out', 'T is inferred from the argument and flows to the result'],
      ['labelled fridge shelves', 'a typed Pinia store'],
      ['a generic serving tray', 'a generic component (`generic="T"`) with typed slot props'],
      ['checking the delivery at the door', 'validating API responses at the boundary'],
      ['a labelled key to the pantry', '`InjectionKey<T>` for provide/inject'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'One composable: JavaScript with JSDoc vs TypeScript',
    caption: 'The logic is identical. The TypeScript generic (or the JSDoc @template) lets the caller\'s type flow into `data`.',
    alt: 'Side by side. Left: the playground\'s useAsync written in JavaScript with JSDoc comments declaring a template type T and typed refs. Right: the same composable in TypeScript with a generic parameter T, shallowRef of T or null, a typed error ref, and a comment showing that data is inferred as ShallowRef of Product array or null.',
    props: {
      left: { label: 'useAsync.js (runnable, JSDoc)', lang: 'js', code: useAsyncJs },
      right: { label: 'useAsync.ts (static)', lang: 'ts', code: useAsyncTs },
      points: [
        '`<T>` (or JSDoc `@template T`) makes the composable generic; T is inferred from the loader.',
        '`shallowRef<T | null>` fits API data you replace wholesale, and avoids deep-unwrapping types for an unknown T.',
        'Return types are inferred — no need to write `{ data: ShallowRef<T | null>, … }` by hand.',
        'The caller writes `useAsync(fetchProducts)` and gets `Product[] | null` back with zero annotations.',
      ],
    },
  },

  animation: {
    type: 'concept-diagram',
    title: 'How a type flows through the layers',
    caption: 'Validate once at the boundary, then let inference carry the type through composables, stores and components.',
    alt: 'A flow from left to right: raw JSON from the API typed as unknown, a parse function that validates it into Product objects, a generic useAsync composable that infers T as Product array, a Pinia setup store whose state type is inferred, and a generic DataList component whose slot props are typed as Product.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'json', label: 'API JSON', note: 'unknown', tone: 'red', x: 90, y: 160 },
        { id: 'parse', label: 'parseProducts()', note: 'unknown → Product[]', tone: 'kraft', x: 240, y: 160 },
        { id: 'composable', label: 'useAsync(loader)', note: 'T = Product[]', tone: 'cobalt', x: 400, y: 70 },
        { id: 'store', label: 'useProductsStore()', note: 'inferred from setup', tone: 'cobalt', x: 400, y: 250 },
        { id: 'component', label: '<DataList :items>', note: 'generic T = Product', tone: 'acid', x: 580, y: 160 },
        { id: 'slot', label: 'slot { item }', note: 'item: Product', tone: 'acid', x: 700, y: 270 },
      ],
      edges: [
        { from: 'json', to: 'parse', label: 'validate' },
        { from: 'parse', to: 'composable' },
        { from: 'parse', to: 'store' },
        { from: 'composable', to: 'component' },
        { from: 'store', to: 'component' },
        { from: 'component', to: 'slot' },
      ],
      steps: [
        { focus: ['json'], text: 'Data arrives from the network. Honestly, its type is `unknown` — TypeScript has no idea what the server sent.' },
        { focus: ['parse'], edges: ['json->parse'], text: 'A parse/validate function (hand-written guard or schema library) checks the shape and returns `Product[]` — or throws. This is the only place that has to be careful.' },
        { focus: ['composable'], edges: ['parse->composable'], text: '`useAsync(() => api.getProducts())` infers `T = Product[]` from the loader\'s return type. `data` is `ShallowRef<Product[] | null>` without a single annotation in the component.' },
        { focus: ['store'], edges: ['parse->store'], text: 'A Pinia **setup store** infers its state, getters and actions from what the setup function returns. Annotate refs whose initial value hides the type: `ref<Product[]>([])`.' },
        { focus: ['component'], edges: ['composable->component', 'store->component'], text: 'A generic component (`<script setup lang="ts" generic="T extends { id: number | string }">`) receives `items: T[]` — here T becomes `Product`.' },
        { focus: ['slot'], edges: ['component->slot'], text: 'Its scoped slot exposes `item: T`, so in the parent\'s template `item.price` autocompletes and `item.prise` is an error. The type travelled all the way from the boundary.' },
      ],
    },
  },

  syntax: [
    `
#### Typing composable parameters and results
`,
    {
      code: `import { computed, toValue, type MaybeRefOrGetter } from 'vue'

// Accept a value, a ref or a getter (3.3+) — and infer the result
export function useFilteredList<T extends { name: string }>(
  items: MaybeRefOrGetter<T[]>,
  query: MaybeRefOrGetter<string>,
) {
  return computed(() => {
    const q = toValue(query).toLowerCase()
    return toValue(items).filter((item) => item.name.toLowerCase().includes(q))
  })                                   // ComputedRef<T[]> — inferred
}

// usage: useFilteredList(products, () => search.value)  →  ComputedRef<Product[]>`,
      lang: 'ts',
      title: 'a generic composable (static example)',
      static: true,
    },
    `
- \`T extends { name: string }\` is a **constraint**: any item type works, as long as it has a \`name\`.
- Return refs (not a \`reactive\` object) so callers can destructure without losing reactivity — and types.
- Inside generic functions prefer \`shallowRef<T | null>(null)\` for replaceable data: \`ref<T>()\` produces \`Ref<UnwrapRef<T>>\`, which TypeScript can't simplify while T is unknown.

#### Typing API responses
`,
    {
      code: `// What the server sends (DTO) vs what the app uses (domain type)
interface ProductDto { id: number; name: string; price: string }
interface Product { id: number; name: string; price: number }

function parseProduct(raw: unknown): Product {
  // validate (guard or schema library), then convert
  …
}

export async function getProducts(): Promise<Product[]> {
  const raw: unknown = await fetch('/api/products').then((r) => r.json())
  if (!Array.isArray(raw)) throw new Error('Expected an array')
  return raw.map(parseProduct)
}

// Async state as a discriminated union: impossible states are unrepresentable
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }`,
      lang: 'ts',
      title: 'an API layer (static example)',
      static: true,
    },
    `
#### Generic components (3.3+)
`,
    {
      code: `<script setup lang="ts" generic="T extends { id: string | number }">
defineProps<{ items: T[]; selected?: T }>()
const emit = defineEmits<{ select: [item: T] }>()
defineSlots<{ default(props: { item: T }): any }>()
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id" @click="emit('select', item)">
      <slot :item="item" />
    </li>
  </ul>
</template>

<!-- Parent: <DataList :items="products" @select="(p) => cart.add(p)">
       <template #default="{ item }">{{ item.price }}</template>   ← item: Product
     </DataList> -->`,
      lang: 'vue',
      title: 'DataList.vue (static example)',
      static: true,
    },
    `
#### Typed provide / inject
`,
    {
      code: `// keys.ts
import type { InjectionKey } from 'vue'
export interface Cart { count: number; add(id: number): void }
export const CartKey: InjectionKey<Cart> = Symbol('cart')

// provider:  provide(CartKey, cart)                 ← checked against Cart
// consumer:  const cart = inject(CartKey)            ← Cart | undefined
//            const cart = inject(CartKey, fallback)  ← Cart`,
      lang: 'ts',
      title: 'InjectionKey (static example)',
      static: true,
    },
    `
#### Typing Pinia stores
`,
    {
      code: `// Setup store: everything inferred from the return value
export const useCartStore = defineStore('cart', () => {
  const lines = ref<CartLine[]>([])             // annotate: [] alone would be never[]
  const total = computed(() => lines.value.reduce((s, l) => s + l.price * l.qty, 0))
  function add(product: Product) { /* … */ }
  return { lines, total, add }
})

// Option store: type the state through the state function's return type
export const useUserStore = defineStore('user', {
  state: () => ({ user: null as User | null, status: 'idle' as Status }),
  getters: { isLoggedIn: (state) => state.user !== null },
})

// In components: const { lines, total } = storeToRefs(useCartStore())  ← typed refs`,
      lang: 'ts',
      title: 'Pinia stores (static example)',
      static: true,
    },
    {
      callout: 'version',
      title: 'Version notes',
      text: '`toValue()`, `MaybeRefOrGetter`, generic components (`generic` attribute) and `defineSlots` require Vue 3.3+. Pinia infers setup-store types in current versions; option stores type state via the `state()` return type.',
    },
  ],

  walkthrough: {
    title: 'useAsync.js',
    lang: 'js',
    code: useAsyncJs,
    intro: 'The playground\'s composable, read as TypeScript would read it. JSDoc gives JavaScript editors the same generic inference.',
    steps: [
      { lines: [3, 9], text: '`@template T` declares a type parameter; `@param {() => Promise<T>} loader` ties it to the loader\'s result. In TypeScript: `function useAsync<T>(loader: () => Promise<T>)`.' },
      { lines: [11, 12], text: '`data` is a `shallowRef` typed `T | null`: empty until the first load. Shallow because API results are replaced wholesale, not mutated deeply.' },
      { lines: [13, 15], text: '`error` holds an `Error` or `null`; `loading` is inferred as `Ref<boolean>` from `ref(false)` — no annotation needed.' },
      { lines: [17, 27], text: '`run()` handles the async lifecycle. Note the `catch`: in TypeScript a caught value is `unknown`, so we normalise it into an `Error` before storing it.' },
      { lines: [29, 30], text: 'Start loading immediately and return **refs**, so callers can destructure (`const { data: products } = useAsync(…)`) and keep reactivity and types.' },
    ],
  },

  playground: {
    title: 'Typed logic around components',
    objective: 'Work with a generic composable, a generic list component and a Pinia setup store — the JavaScript versions of patterns TypeScript types especially well.',
    files: {
      'main.js': mainJs,
      'App.vue': appVue,
      'useAsync.js': useAsyncJs,
      'DataList.vue': dataListVue,
      'cart.js': cartJs,
      'api.js': apiJs,
    },
    expected: 'After a moment, a product list (showing only ids "1" and "2" — the list\'s fallback) and "In cart: 0". Clicking a product adds it to the cart. The Team section shows **Network error**: the first users request fails on purpose.',
    experiments: [
      {
        id: 'slot-content',
        task: 'Use `DataList`\'s scoped slot in `App.vue` to show each product as `Trail Backpack — €89` instead of its id.',
        hint: '`<DataList …><template #default="{ item }">{{ item.name }} — €{{ item.price }}</template></DataList>`',
        tests: [
          {
            name: 'products show name and price',
            code: `await wait(150)
expect(text('.products')).toContain('Trail Backpack — €89')
expect(text('.products')).toContain('Camp Stove — €45')`,
          },
        ],
        explain: 'In TypeScript, DataList would be generic (`generic="T extends { id: … }"`), so `item` in this slot would be typed as `Product` automatically — `item.prise` would be an error in your template.',
      },
      {
        id: 'store-total',
        task: 'Add a `total` getter (a `computed`) to the cart store — the sum of `price × qty` — return it from the store, and show it in `App.vue` as `<p class="total">Total: €{{ cart.total.toFixed(2) }}</p>`.',
        hint: 'In `cart.js`: `const total = computed(() => lines.value.reduce((sum, l) => sum + l.price * l.qty, 0))`, and add `total` to the returned object.',
        tests: [
          {
            name: 'the total sums price × quantity',
            code: `await wait(150)
const items = findAll('.products .item')
await click(items[0])
await click(items[0])
await click(items[1])
expect(text('.count')).toBe('In cart: 3')
expect(text('.total')).toBe('Total: €223.00')`,
          },
        ],
        explain: 'With a setup store, TypeScript infers `total: number` from the computed — you only annotate `lines` (`ref<CartLine[]>([])`), because an empty array literal tells TypeScript nothing about its items.',
      },
      {
        id: 'retry-users',
        task: 'The users request fails the first time. Add a `<button class="retry">` next to the error that calls the composable\'s `run()` to try again.',
        hint: 'Destructure it: `const { data: users, error: usersError, run: reloadUsers } = useAsync(fetchUsers)`, then `<button class="retry" @click="reloadUsers">Retry</button>` inside the error branch.',
        tests: [
          {
            name: 'retrying loads the team',
            code: `await wait(150)
expect(exists('.error')).toBe(true)
await click('.retry')
await wait(150)
expect(exists('.error')).toBe(false)
expect(findAll('.users .item').length).toBe(2)`,
          },
        ],
        explain: 'Returning functions alongside refs makes composables flexible. Their types are inferred too: `run: () => Promise<void>`.',
      },
      {
        id: 'read-generics',
        task: 'Look at the TypeScript `useAsync` in the comparison above. For `useAsync(fetchUsers)`, what does `T` become, and what is the type of `data`? What would change if `fetchUsers` returned `Promise<unknown>`?',
        hint: 'T is inferred from the loader\'s return type.',
        explain: '`T` becomes the resolved type of `fetchUsers()` — e.g. `User[]` — so `data` is `ShallowRef<User[] | null>`. If the loader returned `Promise<unknown>`, `data` would be `unknown` and TypeScript would force you to validate before use — which is exactly the push you want at an API boundary.',
      },
    ],
  },

  internals: {
    beginner: `
Generics are "type variables": placeholders that get filled in when the function is used. \`useAsync<T>\` doesn't know what T is when you write it; when you call \`useAsync(fetchProducts)\`, TypeScript looks at what \`fetchProducts\` returns and fills T in. Then every place that uses \`data\` knows it holds products.
`,
    technical: [
      `
**Inference beats annotation.** Vue's APIs are typed so that values flow: \`ref(0)\` → \`Ref<number>\`, \`computed(fn)\` → \`ComputedRef<ReturnType<fn>>\`, \`toValue(MaybeRefOrGetter<T>)\` → \`T\`. A composable's return type is inferred from its \`return\` statement, and Pinia infers a setup store's public type the same way. Annotate where a value's *initial* form hides its eventual type (\`ref<Product[]>([])\`, \`ref<User | null>(null)\`) and at boundaries (parameters, API responses).

**Ref unwrapping and generics.** \`ref<T>(x)\` returns \`Ref<UnwrapRef<T>>\` because a ref holding an object makes nested refs disappear in its type. For a concrete T that resolves cleanly; for an unresolved generic T inside your composable, TypeScript can't simplify \`UnwrapRef<T>\`, leading to errors like "Type 'T' is not assignable to type 'UnwrapRef<T>'". \`shallowRef<T>()\` doesn't unwrap, so it avoids the problem (and suits replace-wholesale data).

**Generic components.** The \`generic\` attribute on \`<script setup lang="ts">\` declares type parameters for the whole component; Vue's language tools infer them at each usage from the props you pass, then type emits and slot props accordingly. At runtime there is nothing generic — it's an ordinary component.
`,
      {
        code: `// Discriminated union + exhaustive switch
function label(state: AsyncState<Product[]>): string {
  switch (state.status) {
    case 'idle': return 'Not loaded'
    case 'loading': return 'Loading…'
    case 'success': return state.data.length + ' products'   // data exists here
    case 'error': return state.error.message                   // error exists here
    default: {
      const unreachable: never = state  // compile error if a case is missing
      return unreachable
    }
  }
}`,
        lang: 'ts',
        title: 'exhaustiveness checking (static example)',
        static: true,
      },
      `
**Narrowing.** Checking a discriminant (\`state.status === 'success'\`) narrows the union so \`state.data\` becomes available. The \`never\` trick turns "I forgot a case" into a compile error. The coding interview question builds the runtime counterpart.

**Typed injection.** \`InjectionKey<T>\` is a \`Symbol\` branded with a type. \`provide(key, value)\` checks \`value\` against T; \`inject(key)\` returns \`T | undefined\` (because no ancestor might provide it) unless you pass a default.
`,
    ],
    production: `
- **Type the edges, infer the middle**: parameters, API responses, injection keys and initially-empty refs get annotations; most other types should be inferred.
- **One validated API layer**: DTO types for what the server sends, domain types for what the app uses, and parse functions in between. Consider generating DTO types (and validators) from an OpenAPI schema shared with the backend.
- **Prefer setup stores** in TypeScript projects for full inference; use \`storeToRefs\` to destructure state and getters without losing reactivity or types.
- **Model async state as a discriminated union** (or a small set of refs with clear rules) so impossible combinations ("loading *and* error") can't be represented.
- **Generic components for genuinely generic UI** (lists, tables, selects); don't make everything generic — it costs readability.
- **Typed injection keys** live in one module and are imported by both provider and consumer; wrap \`inject\` in a helper that throws a clear error if the provider is missing.
- **Watch for \`as\` casts** in shared code — each one is an unchecked promise; replace with guards where data crosses a boundary.
`,
  },

  mistakes: [
    {
      title: 'Empty-array refs without a type',
      wrong: { code: `const lines = ref([])           // Ref<never[]>\nlines.value.push(line)          // ❌ not assignable to never`, lang: 'ts' },
      right: { code: `const lines = ref<CartLine[]>([])`, lang: 'ts' },
      explanation: 'An empty array literal gives TypeScript nothing to infer from. Annotate refs whose initial value hides the type: empty arrays, `null`, empty objects.',
    },
    {
      title: 'Returning a reactive object from a composable',
      wrong: { code: `return reactive({ data, error, loading })\n// const { data } = useAsync(…) → loses reactivity`, lang: 'ts' },
      right: { code: `return { data, error, loading, run }   // refs: destructure freely`, lang: 'ts' },
      explanation: 'Destructuring a reactive object copies plain values. Returning refs keeps reactivity — and their types — when callers destructure.',
    },
    {
      title: 'Casting API responses instead of validating',
      wrong: { code: `const products = (await res.json()) as Product[]`, lang: 'ts' },
      right: { code: `const raw: unknown = await res.json()\nconst products = parseProducts(raw)   // validates, returns Product[]`, lang: 'ts' },
      explanation: 'A cast is an unchecked promise; it moves the failure to some random component later. Validate once at the boundary.',
    },
    {
      title: 'Using ref<T>() for data inside a generic composable',
      wrong: { code: `function useAsync<T>(loader: () => Promise<T>) {\n  const data = ref<T | null>(null)\n  data.value = await loader()   // ❌ T is not assignable to UnwrapRef<T>\n}`, lang: 'ts' },
      right: { code: `const data = shallowRef<T | null>(null)  // no deep unwrapping`, lang: 'ts' },
      explanation: '`ref` unwraps nested refs in its type; for an unknown T TypeScript can\'t resolve that. `shallowRef` keeps T as-is and fits replaceable data.',
    },
    {
      title: 'Ignoring that inject() may return undefined',
      wrong: { code: `const cart = inject(CartKey)\ncart.add(1)                       // ❌ possibly undefined`, lang: 'ts' },
      right: { code: `function useCart() {\n  const cart = inject(CartKey)\n  if (!cart) throw new Error('useCart() needs a <CartProvider> ancestor')\n  return cart\n}`, lang: 'ts' },
      explanation: 'Nothing guarantees an ancestor provided the value. A small helper turns a confusing runtime error into a clear one — and gives callers a non-optional type.',
    },
  ],

  debugging: [
    {
      symptom: '"Argument of type \'X\' is not assignable to parameter of type \'never\'" when pushing to an array ref.',
      cause: 'The ref was created from an empty array literal, so its type is `never[]`.',
      fix: 'Annotate: `ref<Item[]>([])`.',
    },
    {
      symptom: '"Type \'T\' is not assignable to type \'UnwrapRef<T>\'" inside a generic composable.',
      cause: '`ref<T>()` deep-unwraps types; TypeScript can\'t resolve that for an unknown T.',
      fix: 'Use `shallowRef<T | null>(null)` (or, if you really need `ref`, a carefully placed cast with a comment).',
    },
    {
      symptom: 'Destructured composable values stop updating.',
      cause: 'The composable returned a `reactive()` object, or the caller destructured store state directly.',
      fix: 'Return refs from composables; use `storeToRefs()` for Pinia state and getters.',
    },
    {
      symptom: 'In a generic component\'s slot, `item` is `any` or `unknown`.',
      cause: 'The component isn\'t generic (no `generic` attribute), its props don\'t use T, or slots aren\'t typed.',
      fix: 'Add `generic="T extends …"`, type props as `T[]`, and declare slots with `defineSlots<{ default(props: { item: T }): any }>()`.',
    },
    {
      symptom: '"Property \'data\' does not exist on type \'AsyncState<…>\'".',
      cause: 'Accessing a member that only exists on some union members without narrowing.',
      fix: 'Check the discriminant first: `if (state.status === \'success\') state.data…`.',
    },
  ],

  bestPractices: [
    'Let composables and setup stores infer their return types; annotate parameters and initially-empty refs.',
    'Accept `MaybeRefOrGetter<T>` and normalise with `toValue()` (3.3+) for flexible composables.',
    'Return refs (plus functions) from composables, never a reactive object meant for destructuring.',
    'Use `shallowRef<T | null>` for generic, replace-wholesale data.',
    'Validate API data once (DTO → domain types) and keep `as` casts out of shared code.',
    'Model async state as a discriminated union and handle every case.',
    'Type provide/inject with `InjectionKey<T>` and wrap `inject` in a helper that checks for a provider.',
    'Use generic components for genuinely generic UI and type their slots with `defineSlots`.',
  ],

  useCases: [
    'Data-fetching composables (`useAsync`, `useQuery`-style) reused across many resources.',
    'Reusable list, table, select and autocomplete components with typed slots and events.',
    'Pinia stores shared by many components, with autocomplete and safe refactors.',
    'API clients with typed, validated responses (optionally generated from OpenAPI).',
    'Plugin-style features exposing services through typed provide/inject.',
    'JavaScript codebases using JSDoc `@template` to get generic inference without converting.',
  ],

  whenToUse: {
    use: [
      'Generics when the same logic serves several data types and callers should get their own type back.',
      'Discriminated unions for states with mutually exclusive data (loading/success/error).',
      'Setup stores when you want the store type inferred end to end.',
    ],
    avoid: [
      'Generics "just in case" on components and composables that only ever handle one type.',
      'Hand-writing return types that inference already gets right (they drift out of date).',
      '`any` or casts at API boundaries — validate instead.',
    ],
  },

  comparison: {
    title: 'Where to put the type information',
    headers: ['', 'Composables', 'Pinia setup store', 'Generic components', 'API layer'],
    rows: [
      ['Annotate', 'parameters, empty/`null` refs', 'empty/`null` refs, action parameters', '`generic` constraint, props, slots', 'DTOs, parse functions, return types'],
      ['Inferred', 'return type', 'whole store type', 'T at each usage', 'everything downstream'],
      ['Key tools', '`MaybeRefOrGetter`, `toValue`, `shallowRef`', '`storeToRefs`', '`generic="T"`, `defineSlots`', '`unknown` + guards / schemas'],
      ['JS counterpart', 'JSDoc `@template`', 'JSDoc on refs', 'scoped slots (untyped)', 'runtime validation (same code)'],
    ],
    note: 'That completes the optional TypeScript track. Put it into practice in the [projects](lesson:project-api-explorer).',
  },

  quiz: [
    {
      id: 'typing-composables-stores-q1',
      type: 'output',
      prompt: 'With the TypeScript `useAsync<T>` from this lesson, what is the type of `data` here?',
      code: { lang: 'ts', code: `async function fetchTags(): Promise<string[]> { /* … */ }\n\nconst { data } = useAsync(fetchTags)` },
      options: [
        { text: '`ShallowRef<string[] | null>`' },
        { text: '`string[]`', why: '`data` is a ref; the array lives in `data.value`, and it starts as `null`.' },
        { text: '`ShallowRef<any>`', why: 'T is inferred from the loader\'s return type, so nothing is `any`.' },
        { text: '`Promise<string[]>`', why: 'The composable awaits the loader; `data` holds the resolved value.' },
      ],
      answer: 0,
      explanation: '`T` is inferred as `string[]` from `() => Promise<string[]>`, and `data` is declared as `shallowRef<T | null>(null)`.',
    },
    {
      id: 'typing-composables-stores-q2',
      type: 'mcq',
      prompt: 'Why should a composable usually return an object of refs rather than `reactive({ … })`?',
      options: [
        { text: 'Callers can destructure refs without losing reactivity (and types).' },
        { text: 'reactive() can\'t be typed', why: 'It can; the problem is destructuring, which copies plain values out of a reactive object.' },
        { text: 'Refs are faster than reactive objects', why: 'Performance isn\'t the reason; ergonomics and reactivity under destructuring are.' },
        { text: 'Pinia requires it', why: 'Composables are independent of Pinia.' },
      ],
      answer: 0,
      explanation: '`const { data } = useAsync(…)` keeps working because `data` is a ref. Destructuring a reactive object would capture current values only.',
    },
    {
      id: 'typing-composables-stores-q3',
      type: 'bug',
      prompt: 'This TypeScript setup store has a type error the moment `add()` pushes a line. Click the line that causes it.',
      code: {
        lang: 'ts',
        code: `export const useCartStore = defineStore('cart', () => {
  const lines = ref([])
  const count = computed(() => lines.value.length)

  function add(product: Product) {
    lines.value.push({ id: product.id, qty: 1 })
  }

  return { lines, count, add }
})`,
      },
      answerLine: 2,
      explanation: '`ref([])` is inferred as `Ref<never[]>`, so pushing anything fails on line 6 — but the cause is line 2. Fix: `ref<CartLine[]>([])`.',
    },
    {
      id: 'typing-composables-stores-q4',
      type: 'fill',
      prompt: 'Complete the composable so `query` may be a string, a ref or a getter.',
      code: {
        lang: 'ts',
        code: `import { computed, ___, type MaybeRefOrGetter } from 'vue'

export function useSearchUrl(query: ___<string>) {
  return computed(() => '/search?q=' + encodeURIComponent(toValue(query)))
}`,
      },
      answer: [['toValue'], ['MaybeRefOrGetter']],
      explanation: '`MaybeRefOrGetter<string>` accepts `\'tent\'`, `ref(\'tent\')` or `() => search.value`; `toValue()` (3.3+) normalises all three — and reading it inside `computed` tracks the dependency.',
    },
    {
      id: 'typing-composables-stores-q5',
      type: 'mcq',
      prompt: 'What does `inject(CartKey)` return when `CartKey` is `InjectionKey<Cart>` and no default is given?',
      options: [
        { text: '`Cart | undefined`' },
        { text: '`Cart`', why: 'Nothing guarantees an ancestor provided it, so the type includes `undefined` unless you pass a default.' },
        { text: '`unknown`', why: 'The key carries the type; that\'s the point of InjectionKey.' },
        { text: '`Ref<Cart>`', why: 'inject returns whatever was provided; it doesn\'t wrap it in a ref.' },
      ],
      answer: 0,
      explanation: 'Typed keys make provide and inject agree on `Cart`; the `undefined` reflects a possibly missing provider. Pass a default or check in a helper.',
    },
    {
      id: 'typing-composables-stores-q6',
      type: 'mcq',
      prompt: 'Which features need Vue 3.3 or later? (Select all that apply.)',
      options: [
        { text: '`<script setup lang="ts" generic="T">` generic components' },
        { text: '`toValue()` and `MaybeRefOrGetter`' },
        { text: '`defineSlots()`' },
        { text: '`ref<T>()` with an explicit generic', why: '`ref` has accepted a generic type argument since Vue 3.0.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Generic components, `toValue`/`MaybeRefOrGetter` and `defineSlots` arrived in 3.3. Explicit generics on `ref` have always worked.',
    },
    {
      id: 'typing-composables-stores-q7',
      type: 'short',
      prompt: 'Explain "type the edges, infer the middle" for a Vue app.',
      answer: 'Annotate where TypeScript can\'t know the type: function parameters, API responses (validated from unknown), injection keys, and refs whose initial value hides the real type (empty arrays, null). Everything in between — composable return types, computed values, setup-store types, generic component instances — is inferred from those, so types stay correct as code changes without hand-maintained annotations.',
    },
  ],

  exercises: [
    {
      id: 'generic-selection',
      title: 'A generic useSelection composable',
      difficulty: 'intermediate',
      prompt: `
Implement \`useSelection(items)\` in \`useSelection.js\` — a composable that works for **any** item type with an \`id\` (in TypeScript: \`useSelection<T extends { id: string | number }>(items: MaybeRefOrGetter<T[]>)\`).

- \`items\` may be a plain array, a ref or a getter — normalise it with \`toValue()\` (3.3+).
- Return \`{ isSelected, toggle, clear, selectedItems, count }\`:
  - \`isSelected(item)\` → boolean, \`toggle(item)\` adds/removes it, \`clear()\` empties the selection (selection is tracked **by id**);
  - \`selectedItems\`: a computed array of the selected items **in the order of \`items\`**, always reading the current items;
  - \`count\`: a computed number of selected items.

\`App.vue\` renders checkboxes \`.pick\`, a \`.selected-count\` and a \`.clear\` button.
`,
      files: { 'App.vue': selectionApp, 'useSelection.js': selectionStarter },
      hints: [
        'Keep `const selectedIds = ref([])` and compare by `item.id` — then it doesn\'t matter whether the caller passes the same object or a fresh copy.',
        '`toggle`: if selected, filter the id out; otherwise append it. Assign a new array so the change is obvious.',
        '`selectedItems = computed(() => toValue(items).filter((item) => selectedIds.value.includes(item.id)))`; `count` derives from it.',
      ],
      solution: {
        explanation: 'Tracking ids (not object references) and deriving `selectedItems` from `toValue(items)` keeps the selection correct when the list is refetched or reordered. Accepting `MaybeRefOrGetter` makes the composable work with whatever the caller has. In TypeScript the generic constraint `T extends { id: string | number }` is all it needs — `selectedItems` is then `ComputedRef<T[]>` for every caller.',
        files: { 'App.vue': selectionApp, 'useSelection.js': selectionSolution },
      },
      tests: [
        {
          name: 'toggle, isSelected and count',
          code: `const { useSelection } = requireModule('useSelection.js')
const s = withSetup(() => useSelection([{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }]))
s.toggle({ id: 3 })
s.toggle({ id: 1 })
expect(s.isSelected({ id: 1 })).toBe(true)
expect(s.count.value).toBe(2)
s.toggle({ id: 1 })
expect(s.isSelected({ id: 1 })).toBe(false)
expect(s.count.value).toBe(1)`,
        },
        {
          name: 'selectedItems keep the order of items',
          code: `const { useSelection } = requireModule('useSelection.js')
const s = withSetup(() => useSelection([{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }]))
s.toggle({ id: 3 })
s.toggle({ id: 1 })
expect(s.selectedItems.value.map((i) => i.name)).toEqual(['A', 'C'])
s.clear()
expect(s.count.value).toBe(0)`,
        },
        {
          name: 'works with a getter and follows new item objects',
          code: `const { useSelection } = requireModule('useSelection.js')
const { ref } = requireModule('vue')
const list = ref([{ id: 'a' }, { id: 'b' }])
const s = withSetup(() => useSelection(() => list.value))
s.toggle({ id: 'b' })
list.value = [{ id: 'b', fresh: true }, { id: 'c' }]
expect(s.selectedItems.value.length).toBe(1)
expect(s.selectedItems.value[0].fresh).toBe(true)`,
        },
        {
          name: 'the checkboxes drive the count',
          code: `const picks = findAll('.pick')
await check(picks[0], true)
await check(picks[2], true)
expect(text('.selected-count')).toBe('2 selected')
await click('.clear')
expect(text('.selected-count')).toBe('0 selected')`,
        },
      ],
    },
    {
      id: 'typed-products-store',
      title: 'A Pinia store with typed async state',
      difficulty: 'advanced',
      prompt: `
Complete the setup store \`useProductsStore\` in \`products.js\` (its TypeScript types are listed in the file). Return:

- \`products\` — array, initially \`[]\`
- \`status\` — \`'idle' | 'loading' | 'success' | 'error'\`, initially \`'idle'\`
- \`error\` — an \`Error\` or \`null\`
- \`inStock\` — computed: products with \`stock > 0\`
- \`byId(id)\` — returns the product with that id, or \`undefined\`
- \`load()\` — async: sets \`status\` to \`'loading'\`, awaits \`fetchProducts()\`, stores the result and sets \`'success'\`; on failure stores the error and sets \`'error'\`.

\`api.js\` has \`failNext()\` to make the next request fail. \`App.vue\` has a \`.load\` button, a \`.status\` line and \`.product\` items.
`,
      files: { 'main.js': storeMain, 'App.vue': storeApp, 'products.js': storeStarter, 'api.js': storeApi },
      hints: [
        'Add `const status = ref(\'idle\')` and `const error = ref(null)` (in TS: `ref<Status>(\'idle\')`, `ref<Error | null>(null)`).',
        '`inStock = computed(() => products.value.filter((p) => p.stock > 0))`; `byId` can be a plain function using `find`.',
        'In `load`: set `\'loading\'` first, then `try { products.value = await fetchProducts(); status.value = \'success\' } catch (e) { error.value = e; status.value = \'error\' }`. Return everything from the setup function.',
      ],
      solution: {
        explanation: 'A setup store is a composable with shared state: refs are state, computeds are getters, functions are actions. In TypeScript only the refs whose initial values hide their types need annotations (`ref<Product[]>([])`, `ref<Status>(\'idle\')`, `ref<Error | null>(null)`); Pinia infers the rest of the store\'s type — including `byId`\'s return type `Product | undefined`.',
        files: { 'main.js': storeMain, 'App.vue': storeApp, 'products.js': storeSolution, 'api.js': storeApi },
      },
      tests: [
        {
          name: 'starts idle and empty',
          code: `const store = requireModule('products.js').useProductsStore()
expect(store.status).toBe('idle')
expect(store.products.length).toBe(0)
expect(store.error).toBeNull()`,
        },
        {
          name: 'load() goes loading → success',
          code: `const store = requireModule('products.js').useProductsStore()
const done = store.load()
expect(store.status).toBe('loading')
await done
expect(store.status).toBe('success')
expect(store.products.length).toBe(3)`,
        },
        {
          name: 'inStock and byId',
          code: `const store = requireModule('products.js').useProductsStore()
await store.load()
expect(store.inStock.map((p) => p.name)).toEqual(['Trail Backpack', 'Head Lamp'])
expect(store.byId(2).name).toBe('Camp Stove')
expect(store.byId(99)).toBeUndefined()`,
        },
        {
          name: 'failures set status and error',
          code: `requireModule('api.js').failNext()
const store = requireModule('products.js').useProductsStore()
await store.load()
expect(store.status).toBe('error')
expect(store.error.message).toBe('Server unavailable')`,
        },
        {
          name: 'the page loads products on click',
          code: `await click('.load')
await wait(100)
expect(text('.status')).toBe('success')
expect(findAll('.product').length).toBe(3)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'typing-composables-stores-composable-typing',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you type a composable in Vue 3 with TypeScript?',
      answer: 'Type the parameters and let the return type be inferred. For flexible inputs use `MaybeRefOrGetter<T>` and `toValue()` (3.3+). Make it generic when it serves several data types (`useAsync<T>(loader: () => Promise<T>)`), with constraints where needed (`T extends { id: number }`). Annotate refs whose initial value hides the type (`ref<User | null>(null)`), prefer `shallowRef<T | null>` for generic replaceable data, and return an object of refs and functions so callers can destructure.',
      explanation: 'Edges annotated, middle inferred.',
      whyAsked: 'Composables are the main unit of reuse; typing them well determines the developer experience of a codebase.',
      mistakes: ['Hand-writing elaborate return types.', 'Returning reactive objects for destructuring.', 'Typing parameters as Ref<T> only, forcing callers to wrap values.'],
      followUps: ['Why shallowRef in generic composables?', 'When would you accept a getter instead of a ref?'],
      modelAnswer: 'I type the inputs and let TypeScript infer the output. Inputs that may be reactive get MaybeRefOrGetter with toValue, so callers can pass a value, a ref or a getter. If the composable serves different data types I make it generic, like useAsync of T taking a loader returning Promise of T, with constraints where it needs properties. Inside, I annotate refs that start empty, use shallowRef for generic data, and return refs plus functions so destructuring keeps reactivity and types.',
    },
    {
      id: 'typing-composables-stores-generic-components',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What are generic components in Vue, and when would you use one?',
      answer: 'Since 3.3, `<script setup lang="ts" generic="T extends …">` declares type parameters for a component. Props, emits and slots can use T (`defineProps<{ items: T[] }>()`, `defineEmits<{ select: [item: T] }>()`, `defineSlots<{ default(p: { item: T }): any }>()`), and Vue\'s language tools infer T from the props at each usage — so a parent\'s slot receives `item: Product`. Use them for genuinely generic UI: lists, tables, selects, autocompletes. At runtime nothing is generic.',
      explanation: 'They bring function generics to components for type safety across slots and events.',
      whyAsked: 'Tests knowledge of modern Vue TS features.',
      mistakes: ['Thinking generics affect runtime.', 'Making every component generic.', 'Forgetting to type slots.'],
      followUps: ['How do you constrain T?', 'How would you type a table with column definitions keyed by T?'],
      modelAnswer: 'A generic component declares type parameters with the generic attribute on script setup, available since 3.3. The props, emits and slots can refer to T, and the tooling infers T from what the parent passes — so a list given products emits products and gives its slot a typed item. It\'s purely compile-time. I use it for reusable lists, tables and selects, with a constraint like T extends an object with an id when the component needs keys.',
    },
    {
      id: 'typing-composables-stores-pinia-compare',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare typing a Pinia setup store with an option store.',
      answer: 'Setup store: a function returning refs (state), computeds (getters) and functions (actions); Pinia infers the full store type from the return value — annotate only refs with uninformative initial values (`ref<Item[]>([])`) and action parameters. Option store: `state: () => ({ … })` defines state types from the returned object, so you add assertions/annotations for nullable or empty values (`user: null as User | null`); getters receive typed `state`, and getters using `this` need explicit return types. Both work with `storeToRefs` for typed destructuring.',
      explanation: 'Setup stores feel like typed composables; option stores rely on the state function\'s return type.',
      whyAsked: 'Pinia is Vue\'s official store; typing it is everyday work.',
      mistakes: ['Destructuring store state without storeToRefs.', 'Leaving `user: null` untyped in option stores.'],
      followUps: ['How do you type a getter that takes an argument?', 'How do you test a typed store?'],
      modelAnswer: 'In a setup store the store is just a function returning refs, computeds and functions, so Pinia infers the whole type; I only annotate refs that start empty or null and action parameters. In an option store the state types come from the object the state function returns, so I annotate nullable or empty fields, and getters that use this need explicit return types. Either way I use storeToRefs to destructure state and getters with types and reactivity intact.',
    },
    {
      id: 'typing-composables-stores-api-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How would you structure a typed API layer for a large Vue app talking to a REST backend?',
      answer: 'One module per resource exposing functions that return domain types (`getProducts(): Promise<Product[]>`). Internally: a shared request helper (base URL, auth, error mapping into a typed `ApiError`); responses typed as `unknown`, validated and converted from DTOs (server shape) to domain types (app shape) with parse functions or schema libraries; DTO types ideally generated from an OpenAPI schema shared with the backend. Composables/stores consume these functions (`useAsync(getProducts)`), model async state as discriminated unions, and components never call fetch directly. Errors are typed so the UI can distinguish 401/403/422/5xx.',
      explanation: 'A single validated boundary keeps every downstream type honest.',
      whyAsked: 'Senior candidates design boundaries, not just annotate code.',
      mistakes: ['`as` casts on every response.', 'Using DTOs throughout the UI.', 'Components calling fetch directly.'],
      followUps: ['How do you keep frontend and backend types in sync?', 'Where do you handle 401 globally?'],
      modelAnswer: 'I\'d have one module per resource with functions returning domain types, built on a shared request helper that handles the base URL, auth and mapping errors into a typed ApiError. Responses come in as unknown and pass through parse functions or schemas that validate the DTO and convert it to the app\'s domain type — ideally with DTO types generated from the backend\'s OpenAPI spec. Composables and stores call these functions and model async state as discriminated unions, so components never touch fetch or raw JSON.',
    },
    {
      id: 'typing-composables-stores-unwrap-debug',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'Inside `function useResource<T>(load: () => Promise<T>)` a teammate writes `const data = ref<T | null>(null)` and `data.value = await load()`, and gets "Type \'T\' is not assignable to type \'UnwrapRef<T> | null\'". Explain and fix.',
      answer: '`ref<X>()` returns `Ref<UnwrapRef<X>>` because refs deeply unwrap nested refs in their type. For a concrete X that resolves; for a generic T it stays as the unresolved `UnwrapRef<T>`, and TypeScript can\'t prove `T` is assignable to it. Fix: `const data = shallowRef<T | null>(null)` (no unwrapping, and appropriate for data replaced wholesale), or as a last resort cast (`ref(null) as Ref<T | null>`) with a comment.',
      explanation: 'It\'s a consequence of ref unwrapping types meeting unresolved generics.',
      whyAsked: 'A real-world error that stumps people writing generic composables.',
      mistakes: ['Switching T to any.', 'Not understanding UnwrapRef.'],
      followUps: ['Are there runtime differences between ref and shallowRef here?'],
      modelAnswer: 'ref\'s type deep-unwraps nested refs, so ref of T or null is really Ref of UnwrapRef of T. With a generic T, TypeScript can\'t reduce UnwrapRef of T, so it can\'t prove that a T fits. I\'d switch to shallowRef of T or null — it doesn\'t unwrap, and API data is replaced wholesale anyway, so we also avoid making it deeply reactive. A cast would work but hides the reasoning.',
    },
    {
      id: 'typing-composables-stores-inject-scenario',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Your design system provides a theme via `provide(ThemeKey, theme)`. Consumers write `inject(ThemeKey)!.colors`. What would you change?',
      answer: 'Keep `ThemeKey` as `InjectionKey<Theme>` in one shared module, and replace scattered non-null assertions with a helper: `export function useTheme(): Theme { const t = inject(ThemeKey); if (!t) throw new Error(\'useTheme() requires <ThemeProvider>\'); return t }` — or provide a sensible default via `inject(ThemeKey, defaultTheme)`. Consumers get a non-optional type and a clear error when the provider is missing.',
      explanation: 'The `!` hides a real runtime possibility; a helper makes it explicit once.',
      whyAsked: 'Shows judgment about type assertions and API design for shared code.',
      mistakes: ['Keeping `!` everywhere.', 'Typing the key as `InjectionKey<any>`.'],
      followUps: ['When is a default better than throwing?'],
      modelAnswer: 'I\'d keep a typed InjectionKey of Theme in one shared module and add a useTheme helper that injects it and throws a clear error if there\'s no provider, returning a non-optional Theme. If a default theme makes sense, inject with a default instead. That replaces dozens of non-null assertions, each an unchecked promise, with one explicit check.',
    },
    {
      id: 'typing-composables-stores-coding-match',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 7,
      question: 'Implement `matchState(state, handlers)` in `matchState.js`: call the handler named after `state.status` with the state and return its result; throw an `Error` mentioning the status when no handler exists. (In TypeScript, a mapped type would make missing handlers a compile error — this is the runtime counterpart.)',
      starter: { files: { 'matchState.js': matchStarter, 'App.vue': matchApp } },
      tests: [
        {
          name: 'calls the matching handler with the state',
          code: `const { matchState } = requireModule('matchState.js')
const handlers = { idle: () => 'idle', loading: () => 'loading', success: (s) => s.data.length, error: (s) => s.error.message }
expect(matchState({ status: 'success', data: [1, 2, 3] }, handlers)).toBe(3)
expect(matchState({ status: 'error', error: new Error('Boom') }, handlers)).toBe('Boom')
expect(matchState({ status: 'idle' }, handlers)).toBe('idle')`,
        },
        {
          name: 'a missing handler throws with the status in the message',
          code: `const { matchState } = requireModule('matchState.js')
let message = ''
try { matchState({ status: 'loading' }, { idle: () => 1 }) } catch (e) { message = e.message }
expect(message).toContain('loading')`,
        },
        {
          name: 'unknown statuses throw',
          code: `const { matchState } = requireModule('matchState.js')
expect(() => matchState({ status: 'paused' }, { idle: () => 1 })).toThrow()
expect(() => matchState(null, { idle: () => 1 })).toThrow()`,
        },
        { name: 'the page shows the success label', code: `expect(text('.label')).toBe('2 products')` },
      ],
      hints: [
        'Look up `handlers[state.status]`.',
        'If it isn\'t a function, `throw new Error(\'Unhandled status: \' + state.status)`.',
        'Guard against `state` being `null` before reading `status`.',
      ],
      answer: 'Look up the handler by the discriminant, throw a descriptive error if it\'s missing, otherwise return `handler(state)`.',
      solution: { files: { 'matchState.js': matchSolution, 'App.vue': matchApp } },
      explanation: 'Discriminated unions pair a tag (`status`) with the data valid for that tag. TypeScript narrows on the tag and can enforce exhaustiveness at compile time (e.g. `handlers: { [K in State[\'status\']]: (s: Extract<State, { status: K }>) => R }`); in JavaScript you get the same safety at runtime by failing loudly on unhandled tags.',
      whyAsked: 'Tests understanding of discriminated unions and exhaustiveness — core to modelling UI state with types.',
      mistakes: ['Returning undefined silently for unknown statuses.', 'Using if-chains that forget a case.'],
      followUps: ['How would you type `handlers` so TypeScript requires every status?', 'Why is a union better than separate loading/error/data refs?'],
      modelAnswer: 'I look up the handler using the status tag and call it with the whole state, returning its result. If no handler exists — a forgotten case or an unexpected status — I throw an error naming the status rather than silently returning undefined. In TypeScript I\'d type handlers as a mapped type over the status union, so a missing case fails at compile time and each handler receives the narrowed state.',
    },
  ],

  takeaways: [
    'Type the edges (parameters, API responses, injection keys, empty refs); let inference handle the middle.',
    'Generic composables (`useAsync<T>`) let each caller get its own type back; use `shallowRef<T | null>` for generic data.',
    '`MaybeRefOrGetter<T>` + `toValue()` (3.3+) make composables accept values, refs or getters.',
    'Generic components (`generic="T"`, 3.3+) type props, emits and slot props per usage; type slots with `defineSlots`.',
    'Validate API data once (DTO → domain), model async state as discriminated unions, avoid `as` in shared code.',
    'Pinia setup stores infer their type; annotate empty/nullable refs and use `storeToRefs` to destructure.',
  ],
}
