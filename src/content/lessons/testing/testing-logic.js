// Lesson: Testing computed, watchers, composables & stores.
// Vitest / Pinia testing code is static. Runnable parts: a Pinia cart store, a
// persistence watcher and a composable, checked by the platform's in-browser
// harness (requireModule, withSetup, nextTick…).

const mainJs = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')`

const cartStoreJs = `// cartStore.js — a Pinia setup store
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref(JSON.parse(localStorage.getItem('cart') || '[]'))

  // getters
  const totalItems = computed(() => items.value.length)
  const totalCents = computed(() =>
    items.value.reduce((sum, line) => sum + line.priceCents * line.qty, 0),
  )

  // actions
  function add(product, qty = 1) {
    const line = items.value.find((l) => l.id === product.id)
    if (line) line.qty += qty
    else items.value.push({ ...product, qty })
  }

  function remove(id) {
    items.value = items.value.filter((l) => l.id !== id)
  }

  // persist the cart whenever it changes
  watch(items, (value) => {
    localStorage.setItem('cart', JSON.stringify(value))
  })

  return { items, totalItems, totalCents, add, remove }
})`

const useQuantityJs = `// useQuantity.js — a small composable for a quantity picker
import { ref } from 'vue'

export function useQuantity(initial = 1, { min = 1, max = 99 } = {}) {
  const count = ref(initial)
  const clamp = (n) => Math.min(max, Math.max(min, n))

  function increment() {
    count.value = clamp(count.value + 1)
  }

  function decrement() {
    count.value = clamp(count.value - 1)
  }

  function set(n) {
    count.value = n
  }

  return { count, increment, decrement, set }
}`

const shopApp = `<script setup>
import { useCartStore } from './cartStore.js'
import { useQuantity } from './useQuantity.js'

const cart = useCartStore()
const { count, increment, decrement, set } = useQuantity(1, { min: 1, max: 5 })

const products = [
  { id: 1, name: 'Coffee beans', priceCents: 1299 },
  { id: 2, name: 'Ceramic mug', priceCents: 1850 },
]
const price = (cents) => '$' + (cents / 100).toFixed(2)
</script>

<template>
  <h2>Shop</h2>
  <p>
    Quantity:
    <button class="less" @click="decrement">−</button>
    <input class="qty" type="number" :value="count" @change="set(Number($event.target.value))" />
    <button class="more" @click="increment">+</button>
  </p>
  <p v-for="p in products" :key="p.id">
    <button class="add" @click="cart.add(p, count)">Add {{ count }} × {{ p.name }}</button>
  </p>

  <h3 class="badge">Cart: {{ cart.totalItems }} item(s) · {{ price(cart.totalCents) }}</h3>
  <ul>
    <li v-for="line in cart.items" :key="line.id" class="line">
      {{ line.qty }} × {{ line.name }}
      <button class="remove" @click="cart.remove(line.id)">Remove</button>
    </li>
  </ul>
</template>`

const storeTest = `import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from './cartStore.js'

const mug = { id: 2, name: 'Ceramic mug', priceCents: 1850 }

describe('cart store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia()) // a fresh, empty store for every test
  })

  it('counts quantities, not lines', () => {
    const cart = useCartStore()
    cart.add(mug, 2)
    cart.add(mug, 1)
    expect(cart.items).toHaveLength(1)
    expect(cart.totalItems).toBe(3)
  })

  it('saves the cart after every change', async () => {
    const cart = useCartStore()
    cart.add(mug)
    await nextTick() // the watcher callback is queued; after this tick it has run
    expect(JSON.parse(localStorage.getItem('cart'))).toEqual([{ ...mug, qty: 1 }])
  })
})`

const paginationApp = `<script setup>
import { ref, computed } from 'vue'
import { usePagination } from './usePagination.js'

const products = ref(Array.from({ length: 23 }, (_, i) => 'Product ' + (i + 1)))
const total = computed(() => products.value.length)
const { page, pageCount, next, prev, hasNext, hasPrev } = usePagination(total, 10)

const visible = computed(() => products.value.slice((page.value - 1) * 10, page.value * 10))
</script>

<template>
  <ul>
    <li v-for="p in visible" :key="p" class="product">{{ p }}</li>
  </ul>
  <button class="prev" :disabled="hasPrev === false" @click="prev">Previous</button>
  <span class="page-info">Page {{ page }} of {{ pageCount }}</span>
  <button class="next" :disabled="hasNext === false" @click="next">Next</button>
</template>`

const checkoutApi = `// api.js — a pretend payment server (simplified, in memory).
export const server = { failNext: false, orders: 0 }

export function placeOrder(items) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (server.failNext) {
        server.failNext = false
        reject(new Error('Payment declined'))
        return
      }
      server.orders++
      resolve({ id: 'ord_' + server.orders, lines: items.length })
    }, 150)
  })
}`

const checkoutApp = `<script setup>
import { useCartStore } from './cartStore.js'

const cart = useCartStore()
const mug = { id: 2, name: 'Ceramic mug', priceCents: 1850 }
</script>

<template>
  <button class="add" @click="cart.add(mug)">Add a mug</button>
  <ul>
    <li v-for="line in cart.items" :key="line.id" class="line">{{ line.qty }} × {{ line.name }}</li>
  </ul>
  <button class="checkout" :disabled="cart.status === 'submitting'" @click="cart.checkout()">
    {{ cart.status === 'submitting' ? 'Placing order…' : 'Check out' }}
  </button>
  <p v-if="cart.error" class="error">{{ cart.error }}</p>
  <p v-if="cart.status === 'done'" class="done">Order {{ cart.orderId }} placed!</p>
</template>`

const checkoutStoreHead = `// cartStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { placeOrder } from './api.js'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const status = ref('idle') // 'idle' | 'submitting' | 'done' | 'error'
  const error = ref('')
  const orderId = ref(null)

  function add(product) {
    const line = items.value.find((l) => l.id === product.id)
    if (line) line.qty++
    else items.value.push({ ...product, qty: 1 })
  }
`

const formFieldApp = `<script setup>
import { useFormField } from './useFormField.js'

const { value: email, error: emailError, blur: onEmailBlur } = useFormField('', (v) =>
  v.includes('@') ? '' : 'Enter a valid email',
)
</script>

<template>
  <label>Email <input v-model="email" class="email" @blur="onEmailBlur" /></label>
  <p v-if="emailError" class="field-error">{{ emailError }}</p>
</template>`

export default {
  id: 'testing-logic',
  title: 'Testing computed, watchers, composables & stores',
  summary: 'Test the logic behind your components — computed values, watchers, composables and Pinia stores — directly, quickly and without rendering the UI.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['testing-fundamentals', 'composables-intro', 'pinia-basics', 'watch'],
  related: ['component-testing', 'testing-async-routing', 'composable-design', 'pinia-production', 'next-tick'],
  tags: ['testing', 'vitest', 'composables', 'pinia', 'setActivePinia', 'createTestingPinia', 'nextTick', 'watch', 'computed', 'fake timers'],
  apis: [
    { name: 'setActivePinia(createPinia())', summary: 'Pinia: makes a fresh Pinia instance active so `useStore()` works outside components — typically in `beforeEach`.' },
    { name: 'createTestingPinia()', summary: '@pinia/testing: a Pinia for component tests that stubs actions with spies and accepts `initialState`.' },
    { name: 'nextTick()', summary: 'Vue: a promise that resolves after queued watchers and DOM updates have flushed.' },
    { name: 'withSetup(composable)', summary: 'A small test helper (from the Vue docs) that runs a composable inside a throwaway component so lifecycle hooks and inject work.' },
    { name: 'vi.useFakeTimers()', summary: 'Vitest: replaces setTimeout/setInterval with controllable fakes; move time with `vi.advanceTimersByTime(ms)`.' },
  ],
  docs: [
    { label: 'Vue Guide — Testing composables', url: 'https://vuejs.org/guide/scaling-up/testing.html#testing-composables' },
    { label: 'Pinia — Testing stores', url: 'https://pinia.vuejs.org/cookbook/testing.html' },
    { label: 'Vue API — nextTick()', url: 'https://vuejs.org/api/general.html#nexttick' },
    { label: 'Vitest — Mocking timers', url: 'https://vitest.dev/guide/mocking.html#timers' },
  ],

  intro: `
Most of an app's *rules* don't live in templates. They live in **computed** values (the cart total), **watchers** (save the cart whenever it changes), **composables** (reusable logic like a quantity picker) and **Pinia stores** (shared state and actions).

All of these are plain JavaScript you can call from a test — no need to mount a component, find a button and click it. You change an input, call a function, and check the result. The two things to learn are *how to set them up* (stores need an active Pinia, some composables need a component around them) and *when to wait* (watchers run a moment after the change, not instantly).
`,

  why: `
If you only test logic through components, every rule costs a full render, a click and a DOM query. When a test fails you don't know whether the template, the event wiring or the rule itself broke. And you can't easily reach edge cases ("what if the quantity is NaN?") through a UI that doesn't let you type them.

Testing the logic layer directly gives you:

- **speed** — no rendering at all;
- **precision** — a failure points at one getter or one action;
- **reach** — you can call \`set(NaN)\` or make the server fail on purpose.

There are a few traps, though. Destructuring a store breaks reactivity. Watchers run *asynchronously*, so an assertion right after a change sees the old world. Stores share state between tests unless you create a fresh Pinia. This lesson walks through each one.
`,

  eli15: `
Imagine testing a vending machine's brain without building the machine. You give the brain a pretend coin and check it says "credit: €1". No buttons, no lights — just the logic.

That's what this lesson is about. A **computed** value is like a calculator: change the numbers going in, read the answer. A **store** is a shared notebook with rules for writing in it; in a test you give each test its own fresh notebook so they don't scribble over each other.

A **watcher** is a helper who reacts to changes — but only after you finish what you're doing, like a waiter who comes to the table once you've closed the menu. In a test you have to *wait a moment* (\`await nextTick()\`) before checking what the helper did.
`,

  analogy: {
    title: 'Testing a car\'s engine on a test stand',
    body: `
Mechanics don't test an engine by driving it around town. They bolt it to a **test stand**, feed it fuel, and read the dials. Some parts can be tested on the bench by hand (a spark plug: apply voltage, see a spark). Others need the stand to supply what the car normally would — power, cooling, a crankshaft to turn.

Pure computed logic and simple composables are the spark plugs: call them and check. Composables that use lifecycle hooks or \`inject\` need the test stand — a tiny host component (\`withSetup\`). Pinia stores need their power supply plugged in: an active Pinia.
`,
    mapping: [
      ['spark plug on the bench', 'a computed value or `ref`-only composable called directly'],
      ['the test stand', 'a throwaway host component (`withSetup`) for hooks and `inject`'],
      ['plugging in the power', '`setActivePinia(createPinia())` before using a store'],
      ['letting the engine settle before reading the dial', '`await nextTick()` before asserting on a watcher'],
      ['a fresh engine for each test', 'a new Pinia in `beforeEach`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'How to test each kind of logic',
    caption: 'Each kind of logic has its own setup and its own "when is it done?" — step through them.',
    alt: 'A grid of five boxes. Computed: change the source, read .value. Watcher: change the source, await nextTick, assert the side effect. Composable: call it directly or inside withSetup, then use the returned refs and functions. Pinia store: create a fresh Pinia, call actions, assert state and getters. Component using a store: mount with createTestingPinia, actions are stubbed spies.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'computed', label: 'computed', note: 'change source → read .value', tone: 'acid' },
        { id: 'watcher', label: 'watcher', note: 'change → await nextTick → assert', tone: 'kraft' },
        { id: 'composable', label: 'composable', note: 'call directly or via withSetup', tone: 'cobalt' },
        { id: 'store', label: 'Pinia store', note: 'fresh Pinia → action → state', tone: 'acid' },
        { id: 'component', label: 'component + store', note: 'createTestingPinia: actions are spies', tone: 'red' },
      ],
      edges: [
        { from: 'computed', to: 'watcher', label: 'adds timing' },
        { from: 'composable', to: 'store', label: 'adds sharing' },
        { from: 'store', to: 'component', label: 'adds UI' },
      ],
      steps: [
        { focus: ['computed'], text: '**Computed:** set the source refs, read `.value`. Computeds are lazy and synchronous — the new value is there the moment you read it. No waiting.' },
        { focus: ['watcher'], edges: ['computed->watcher'], text: '**Watcher:** change the source, then `await nextTick()`. By default a watcher callback is *queued* and runs before the next render, not at the moment of the change.' },
        { focus: ['composable'], text: '**Composable:** if it only uses `ref`/`computed`/`watch`, call it directly. If it uses `onMounted`, `onUnmounted` or `inject`, run it inside a throwaway host component (`withSetup`) so those APIs have an instance to attach to.' },
        { focus: ['store'], edges: ['composable->store'], text: '**Pinia store:** `setActivePinia(createPinia())` in `beforeEach` gives every test a fresh, empty store. Call actions, then assert on state and getters. Mock the API module the actions call.' },
        { focus: ['component'], edges: ['store->component'], text: '**Component that uses a store:** mount with `createTestingPinia()`. Actions become spies (they record calls but don\'t run), so you test the component\'s wiring — "clicking Clear calls `cart.clear()`" — not the store again.' },
      ],
    },
  },

  syntax: [
    `
#### Computed: inputs in, value out
`,
    {
      code: `import { ref, computed } from 'vue'
import { it, expect } from 'vitest'

it('derives the total from the lines', () => {
  const lines = ref([{ priceCents: 1299, qty: 2 }])
  const total = computed(() => lines.value.reduce((s, l) => s + l.priceCents * l.qty, 0))

  expect(total.value).toBe(2598)
  lines.value.push({ priceCents: 1850, qty: 1 })
  expect(total.value).toBe(4448) // recomputed on read — no await needed
})`,
      lang: 'js',
      title: 'testing a computed',
      static: true,
    },
    `
#### Watchers: change, then wait a tick
`,
    {
      code: `import { ref, watch, nextTick } from 'vue'

it('saves the theme when it changes', async () => {
  const theme = ref('light')
  watch(theme, (value) => localStorage.setItem('theme', value))

  theme.value = 'dark'
  expect(localStorage.getItem('theme')).toBe(null)   // callback not run yet
  await nextTick()
  expect(localStorage.getItem('theme')).toBe('dark') // now it has
})`,
      lang: 'js',
      title: 'testing a watcher',
      static: true,
    },
    `
#### Composables: directly, or inside a host component

A composable that only uses reactivity APIs can be called straight from a test. One that uses lifecycle hooks or \`inject()\` needs a component instance — the Vue docs suggest a tiny helper:
`,
    {
      code: `// test-utils.js — the helper from the Vue testing guide
import { createApp } from 'vue'

export function withSetup(composable) {
  let result
  const app = createApp({
    setup() {
      result = composable()
      return () => {} // render nothing
    },
  })
  app.mount(document.createElement('div'))
  return [result, app] // call app.unmount() to trigger onUnmounted
}

// in a test
const [{ count, increment }, app] = withSetup(() => useQuantity(1, { max: 5 }))
increment()
expect(count.value).toBe(2)
app.unmount()`,
      lang: 'js',
      title: 'withSetup()',
      static: true,
    },
    `
#### Pinia stores: a fresh Pinia per test
`,
    {
      code: `import { setActivePinia, createPinia } from 'pinia'
import { beforeEach } from 'vitest'

beforeEach(() => {
  setActivePinia(createPinia()) // useCartStore() now works — and starts empty
})

it('adds to an existing line', () => {
  const cart = useCartStore()
  cart.add(mug)
  cart.add(mug)
  expect(cart.items).toEqual([{ ...mug, qty: 2 }])
  expect(cart.totalItems).toBe(2) // getters read like properties
})`,
      lang: 'js',
      title: 'unit-testing a store',
      static: true,
    },
    `
#### Components that use a store: createTestingPinia

In a *component* test you usually don't want the real actions (they may call APIs). \`@pinia/testing\` provides a Pinia whose actions are replaced with spies:
`,
    {
      code: `import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { vi } from 'vitest'

const wrapper = mount(CartBadge, {
  global: {
    plugins: [
      createTestingPinia({
        createSpy: vi.fn, // needed unless Vitest globals are enabled
        initialState: { cart: { items: [{ id: 2, name: 'Ceramic mug', priceCents: 1850, qty: 2 }] } },
      }),
    ],
  },
})

const cart = useCartStore()           // the same testing store the component uses
expect(wrapper.text()).toContain('2 item(s)')
await wrapper.get('button.clear').trigger('click')
expect(cart.clear).toHaveBeenCalledTimes(1) // stubbed: state did not change
// createTestingPinia({ stubActions: false }) runs the real actions instead`,
      lang: 'js',
      title: 'createTestingPinia',
      static: true,
    },
    {
      callout: 'note',
      title: 'On this platform',
      text: 'The checks in the playground and exercises run in this platform\'s in-browser **teaching harness**, not Vitest. Its `withSetup(() => useX())` returns the composable\'s result directly (the real helper above returns `[result, app]`), `requireModule(\'cartStore.js\')` stands in for an `import`, and calling `useCartStore()` works because the playground\'s `main.js` already installed Pinia — the job `setActivePinia(createPinia())` does in Vitest.',
    },
  ],

  walkthrough: {
    title: 'cartStore.test.js',
    lang: 'js',
    code: storeTest,
    intro: 'A real Vitest file for the playground\'s store. Both tests fail against the playground as it is — the experiments fix that.',
    steps: [
      { lines: [1, 4], text: 'Imports: the test API, Vue\'s `nextTick`, Pinia\'s activation helpers and the store itself. No Vue Test Utils — nothing is rendered.' },
      { lines: [8, 12], text: '`beforeEach` runs before every test. Clearing storage and activating a **new** Pinia means each test gets an empty, independent store. Without it, items added in one test would still be there in the next.' },
      { lines: [14, 20], text: 'A getter test: call actions, read the getter like a property. Adding the same mug twice must merge into one line with quantity 3 — and `totalItems` should count quantities. The playground\'s getter counts lines, so this fails today.' },
      { lines: [22, 27], text: 'A watcher test is `async`. The persistence watcher is queued, not run immediately, so `await nextTick()` before reading storage. (The playground\'s watcher also isn\'t `deep`, so a push never triggers it at all — experiment 2.)' },
    ],
  },

  playground: {
    title: 'A shop with a tested store',
    objective: 'Fix a getter, a watcher and a composable — each bug is caught by a logic test that never renders the UI.',
    files: { 'main.js': mainJs, 'App.vue': shopApp, 'cartStore.js': cartStoreJs, 'useQuantity.js': useQuantityJs },
    expected: 'A tiny shop. Pick a quantity, add products, and watch the cart header. Add **2 × Coffee beans**: the header says "1 item(s)" — the first bug. Type **9** into the quantity box and press Enter: it accepts 9 even though the maximum is 5 — another bug.',
    experiments: [
      {
        id: 'getter-quantities',
        task: '`totalItems` counts **lines**, but the badge should count **items**: 2 bags of beans and 1 mug is 3 items. Fix the getter in **cartStore.js**.',
        hint: 'Sum `line.qty` over all lines with `reduce`, starting from 0.',
        tests: [
          {
            name: 'totalItems sums the quantities',
            code: `const cart = requireModule('cartStore.js').useCartStore()
cart.items = []
cart.add({ id: 1, name: 'Coffee beans', priceCents: 1299 }, 2)
cart.add({ id: 2, name: 'Ceramic mug', priceCents: 1850 })
cart.add({ id: 1, name: 'Coffee beans', priceCents: 1299 })
expect(cart.items).toHaveLength(2)
expect(cart.totalItems).toBe(4)`,
          },
        ],
        explain: 'A getter is a computed: call actions to set up the state, then read it. No rendering, no clicking — and the failure message points straight at `totalItems`.',
      },
      {
        id: 'watcher-deep',
        task: 'The persistence watcher only saves when `items.value` is **replaced** (Remove works), not when it is **mutated** (adding pushes into the array, or bumps a `qty`). Make it save after every change.',
        hint: 'Watching a ref is shallow by default. Pass `{ deep: true }` as the third argument to `watch`.',
        tests: [
          {
            name: 'adding (push) and merging (qty++) are both saved',
            code: `const cart = requireModule('cartStore.js').useCartStore()
cart.items = []
await nextTick()
localStorage.clear()
cart.add({ id: 2, name: 'Ceramic mug', priceCents: 1850 })
await nextTick()
const saved = JSON.parse(localStorage.getItem('cart') || '[]')
expect(saved.map((l) => l.name)).toContain('Ceramic mug')
cart.add({ id: 2, name: 'Ceramic mug', priceCents: 1850 })
await nextTick()
expect(JSON.parse(localStorage.getItem('cart'))[0].qty).toBe(2)`,
          },
        ],
        explain: '`watch(items, cb)` on a ref fires when `.value` is reassigned. `{ deep: true }` makes it track nested changes too. Notice the `await nextTick()` after each change: the callback runs a moment later, so asserting immediately would read stale storage even with the fix.',
      },
      {
        id: 'composable-clamp',
        task: '`set(n)` in **useQuantity.js** accepts anything — 9 when the max is 5, even `NaN` from an empty input. Make `set` clamp to `min`/`max` and **ignore** values that aren\'t numbers.',
        hint: 'Reuse `clamp(n)`, and return early when `Number.isNaN(n)`.',
        tests: [
          {
            name: 'set() clamps and ignores NaN',
            code: `const { useQuantity } = requireModule('useQuantity.js')
const q = withSetup(() => useQuantity(1, { min: 1, max: 5 }))
q.set(10)
expect(q.count.value).toBe(5)
q.set(-3)
expect(q.count.value).toBe(1)
q.set(3)
expect(q.count.value).toBe(3)
q.set(NaN)
expect(q.count.value).toBe(3)`,
          },
        ],
        explain: '`useQuantity` only uses `ref`, so in Vitest you could call it directly — `withSetup` is harmless here and becomes necessary once a composable uses `onMounted` or `inject`. Testing the composable lets you try `NaN`, which the UI makes awkward to reproduce.',
      },
      {
        id: 'sync-flush',
        task: 'Look at the persistence test again. Change the watcher\'s options to `{ deep: true, flush: \'sync\' }` and think: would the test still need `await nextTick()`? Why does Vue **not** make sync the default?',
        hint: 'A sync watcher runs inside the assignment itself. What happens when an action changes the cart five times in a row?',
        explain: 'With `flush: \'sync\'` the callback runs immediately on every change, so the test could assert without waiting — but `localStorage` would now be written once per mutation instead of once per tick. The default (`\'pre\'`) batches changes, which is better for performance; tests simply `await nextTick()`. Don\'t change production code just to make tests synchronous.',
      },
    ],
  },

  animation: {
    type: 'event-loop',
    props: { preset: 'nexttick' },
    title: 'Why a watcher assertion needs a tick',
    caption: 'Changing state queues the watcher; the queue flushes after the current synchronous code. `await nextTick()` waits for exactly that flush.',
    alt: 'An event loop stepper: synchronous code changes reactive state, which queues a watcher job; the job runs only after the call stack is empty, as part of the next flush; awaiting nextTick resumes the test after that flush.',
  },

  internals: {
    beginner: `
A computed is a value that recalculates when you read it after its inputs changed — so tests just read it. A watcher is a function Vue *schedules* to run soon after a change, which is why tests have to wait for it. A store is created the first time you call \`useCartStore()\` for a given Pinia; give each test a fresh Pinia and each test gets a fresh store.
`,
    technical: [
      `
**Computed is pull, watch is push.** A \`computed\` marks itself dirty when a dependency changes and recomputes lazily on the next \`.value\` read — synchronous from the test's point of view. A \`watch\` callback is pushed into Vue's scheduler queue. With the default \`flush: 'pre'\`, the queue is flushed in a microtask, before component re-renders. Several changes in the same tick produce **one** callback with the latest value. \`nextTick()\` returns a promise that resolves after that flush.

**Composables outside components.** \`ref\`, \`computed\` and \`watch\` work anywhere. Lifecycle hooks (\`onMounted\`, \`onUnmounted\`) and \`inject()\` look up the *current component instance*; called outside \`setup()\`, Vue warns and the hook never runs (\`inject\` returns \`undefined\`). That's why such composables need a host component. Effects created outside any component are never cleaned up automatically — wrap them in \`effectScope()\` and call \`scope.stop()\` if a test creates many.

**Stores are singletons per Pinia.** \`defineStore('cart', …)\` returns a function; the first call for an active Pinia runs the setup function and caches the store on that Pinia. \`setActivePinia(createPinia())\` replaces the active instance, so the next \`useCartStore()\` builds a brand-new store. Inside components, the Pinia installed with \`app.use(pinia)\` is used instead.
`,
      {
        code: `// Why destructuring a store breaks a test (and a template)
const cart = useCartStore()
const { totalItems } = cart       // copies the number once: 0
cart.add(mug)
totalItems                        // still 0

const { totalItems: total } = storeToRefs(cart) // keeps a ref
cart.add(mug)
total.value                       // 2`,
        lang: 'js',
        title: 'reactivity survives only through refs',
        static: true,
      },
      `
**Controlling time.** Debounced watchers and polling use \`setTimeout\`. \`vi.useFakeTimers()\` swaps in fake timers; \`vi.advanceTimersByTime(300)\` fires everything due in the next 300 ms instantly. Combine with \`await nextTick()\` (so the watcher has scheduled its timer) and, when promises are involved, VTU's \`flushPromises()\`. Always restore with \`vi.useRealTimers()\`.
`,
      {
        code: `import { vi } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.useFakeTimers()
const [{ query, results }] = withSetup(() => useSearch(fakeApi)) // debounced by 300 ms
query.value = 'ada'
await nextTick()            // the watcher runs and starts its timer
vi.advanceTimersByTime(299)
expect(fakeApi.search).not.toHaveBeenCalled()
vi.advanceTimersByTime(1)
await flushPromises()       // let the fake API promise resolve
expect(results.value).toEqual([{ id: 3, name: 'Ada Lovelace' }])
vi.useRealTimers()`,
        lang: 'js',
        title: 'a debounced watcher with fake timers',
        static: true,
      },
    ],
    production: `
- **Functional core, reactive shell.** Put rules in pure functions (\`calculateTotal(lines)\`), wrap them in composables or store getters for reactivity, and keep components for wiring. Each layer gets the cheapest test that fits.
- **Make dependencies injectable.** A composable that takes \`api\` as a parameter (or reads it via \`inject\`) can be handed a fake in tests without module mocking. Module mocking with \`vi.mock('./api.js')\` works too — see [Testing async code, APIs & routing](lesson:testing-async-routing).
- **Reset everything shared** in \`beforeEach\`/\`afterEach\`: a new Pinia, \`localStorage.clear()\`, \`vi.restoreAllMocks()\`, \`vi.useRealTimers()\`.
- **Test stores at two levels:** unit tests for actions/getters with a real Pinia and a mocked API; component tests with \`createTestingPinia\` to check the wiring. Don't re-test the store logic through every component.
- **Avoid \`flush: 'sync'\` just for tests** — it changes production performance characteristics. Await the tick instead.
- **Prefer \`storeToRefs\`** when destructuring state and getters, in components and tests alike.
`,
  },

  mistakes: [
    {
      title: 'Asserting on a watcher without waiting',
      wrong: { code: `cart.add(mug)\nexpect(localStorage.getItem('cart')).toContain('Ceramic mug') // runs before the watcher`, lang: 'js' },
      right: { code: `cart.add(mug)\nawait nextTick()\nexpect(localStorage.getItem('cart')).toContain('Ceramic mug')`, lang: 'js' },
      explanation: 'Watcher callbacks are queued and flushed after the current synchronous code. Make the test `async` and `await nextTick()` before checking side effects.',
    },
    {
      title: 'Sharing one Pinia across all tests',
      wrong: { code: `setActivePinia(createPinia()) // once, at the top of the file\n\nit('adds a mug', () => { useCartStore().add(mug) })\nit('starts empty', () => {\n  expect(useCartStore().items).toEqual([]) // fails: the mug is still there\n})`, lang: 'js' },
      right: { code: `beforeEach(() => {\n  setActivePinia(createPinia())\n})`, lang: 'js' },
      explanation: 'A store is cached per Pinia instance. Create a new Pinia before each test so state never leaks between tests (and test order never matters).',
    },
    {
      title: 'Destructuring a store and expecting updates',
      wrong: { code: `const { totalItems } = useCartStore()\ncart.add(mug)\nexpect(totalItems).toBe(1) // still 0 — a copied number`, lang: 'js' },
      right: { code: `const cart = useCartStore()\ncart.add(mug)\nexpect(cart.totalItems).toBe(1)\n// or: const { totalItems } = storeToRefs(cart); totalItems.value`, lang: 'js' },
      explanation: 'A store is a reactive object; destructuring copies the current values out. Read through the store, or use `storeToRefs()` to get refs that stay connected.',
    },
    {
      title: 'Calling a lifecycle-hook composable directly',
      wrong: { code: `const { width } = useWindowWidth() // uses onMounted/onUnmounted\n// [Vue warn]: onMounted is called when there is no active component instance…\n// the listener is never added`, lang: 'js' },
      right: { code: `const [{ width }, app] = withSetup(() => useWindowWidth())\n// … assertions …\napp.unmount() // runs onUnmounted: the listener is removed`, lang: 'js' },
      explanation: 'Lifecycle hooks and `inject` attach to the current component instance. Give them one with a host component, and unmount it to test cleanup.',
    },
    {
      title: 'Forgetting to restore fake timers',
      wrong: { code: `it('debounces', () => {\n  vi.useFakeTimers()\n  // … test …\n}) // the next test file section still has fake timers`, lang: 'js' },
      right: { code: `beforeEach(() => vi.useFakeTimers())\nafterEach(() => vi.useRealTimers())`, lang: 'js' },
      explanation: 'Fake timers are global to the test file. A test that leaves them on makes later tests hang or behave strangely — a classic source of order-dependent failures.',
    },
  ],

  debugging: [
    {
      symptom: '`getActivePinia()` was called but there was no active Pinia.',
      cause: 'The store was used outside a component and no Pinia was activated in the test.',
      fix: 'Call `setActivePinia(createPinia())` in `beforeEach` (unit tests), or mount with `global.plugins: [createTestingPinia()]` (component tests).',
    },
    {
      symptom: 'A watcher test fails, but the feature works in the browser.',
      cause: 'The assertion runs before the queued watcher callback — or the watcher isn\'t `deep` and the test mutates nested data.',
      fix: 'Add `await nextTick()` after the change; check whether the watcher needs `{ deep: true }` (or a getter like `() => items.value.length`).',
    },
    {
      symptom: '`[Vue warn]: onMounted is called when there is no active component instance`.',
      cause: 'A composable with lifecycle hooks was called directly in a test.',
      fix: 'Run it inside a host component (`withSetup`), and unmount it to trigger cleanup hooks.',
    },
    {
      symptom: 'In a component test, clicking a button never changes the store\'s state.',
      cause: '`createTestingPinia` stubs actions by default — they are spies that don\'t run.',
      fix: 'Assert that the action was called (`expect(store.clear).toHaveBeenCalled()`), or use `createTestingPinia({ stubActions: false })` if you really want the real action.',
    },
    {
      symptom: 'A debounced test times out or waits for real seconds.',
      cause: 'Real timers are still in use, or fake timers were enabled after the timer was created.',
      fix: 'Call `vi.useFakeTimers()` before the code under test schedules its timer, advance with `vi.advanceTimersByTime(ms)`, then restore with `vi.useRealTimers()`.',
    },
  ],

  bestPractices: [
    'Test logic directly — computed, composables, stores — and keep component tests for wiring and rendering.',
    'Create a fresh Pinia in `beforeEach`; reset storage, mocks and timers between tests.',
    '`await nextTick()` after changes that watchers react to; `flushPromises()` when promises are involved.',
    'Call simple composables directly; use a host component for lifecycle hooks and `inject`, and unmount it to test cleanup.',
    'Use `createTestingPinia` in component tests and assert on action calls rather than re-testing store logic.',
    'Read store values through the store or `storeToRefs`, never through plain destructuring.',
    'Use fake timers for debounce/polling logic instead of real waits.',
  ],

  useCases: [
    'Cart, pricing and inventory getters in a Pinia store.',
    'Persistence watchers that save drafts or settings to storage.',
    'Reusable composables: pagination, form fields, quantity pickers, debounced search.',
    'Store actions that call an API: success, failure and double-submit paths.',
    'Components that read from a store, tested with `createTestingPinia` and `initialState`.',
  ],

  whenToUse: {
    use: [
      'Logic with rules or edge cases that lives in getters, actions, composables or watchers.',
      'Code reused by several components (one test covers every user).',
      'Timing-sensitive logic (debounce, polling) where fake timers make tests instant.',
    ],
    avoid: [
      'Re-testing Vue itself (that a `computed` recomputes, that `ref` is reactive).',
      'Testing a store\'s logic again through every component that uses it.',
      'Switching watchers to `flush: \'sync\'` only so tests don\'t need to await.',
    ],
  },

  comparison: {
    title: 'Testing each kind of logic',
    headers: ['', 'Setup', 'Act', 'When is it done?', 'Common gotcha'],
    rows: [
      ['`computed`', 'create the source refs', 'change a source', 'immediately on `.value` read', 'reading a stale copy instead of `.value`'],
      ['`watch`', 'create source + watcher', 'change a source', 'after `await nextTick()`', 'shallow watch misses nested changes'],
      ['composable (refs only)', 'call it', 'call its functions', 'immediately (watchers: next tick)', 'none — the easy case'],
      ['composable (hooks / inject)', 'host component (`withSetup`)', 'call its functions', 'as above; unmount for cleanup', 'warning + hook never runs if called directly'],
      ['Pinia store', '`setActivePinia(createPinia())`', 'call actions', 'sync actions: immediately; async: `await` them', 'state leaking between tests'],
      ['component using a store', '`createTestingPinia()`', 'trigger UI events', 'after `await trigger()`', 'actions are stubbed spies'],
    ],
    note: 'Async actions and API mocking get their own lesson: [Testing async code, APIs & routing](lesson:testing-async-routing).',
  },

  quiz: [
    {
      id: 'testing-logic-q1',
      type: 'mcq',
      prompt: 'How do you test that `total` (a `computed`) updates when the cart changes?',
      options: [
        { text: 'Change the source ref, then read `total.value` — no waiting needed.' },
        { text: 'Change the source, `await nextTick()`, then read `total.value` — computeds update on the next tick.', why: 'Computeds are lazy and synchronous: reading `.value` after the change recomputes on the spot. The tick is for watchers and DOM updates.' },
        { text: 'Mount a component that displays it and read the DOM.', why: 'That works but is slower and less precise; the computed can be tested on its own.' },
        { text: 'Spy on the getter function and check it was called.', why: 'That tests implementation details, not the value.' },
      ],
      answer: 0,
      explanation: 'A computed is marked dirty when a dependency changes and recalculated when you read it. Reading `.value` right after the change gives the new value.',
    },
    {
      id: 'testing-logic-q2',
      type: 'output',
      prompt: 'What is logged, in order?',
      code: {
        lang: 'js',
        code: `const count = ref(0)
watch(count, (v) => console.log('watch', v))

count.value = 1
count.value = 2
console.log('sync done')
await nextTick()
console.log('after tick')`,
      },
      options: [
        '`watch 1`, `watch 2`, `sync done`, `after tick`',
        '`sync done`, `watch 2`, `after tick`',
        '`sync done`, `watch 1`, `watch 2`, `after tick`',
        '`sync done`, `after tick` — the watcher never runs outside a component',
      ],
      answer: 1,
      explanation: 'The watcher is queued, not run synchronously, and both changes happen in the same tick — so it runs once, with the latest value (2), during the flush that `nextTick()` waits for. Watchers work fine outside components.',
    },
    {
      id: 'testing-logic-q3',
      type: 'bug',
      prompt: 'This store test fails with "expected 0 to be 2". Click the line that causes it.',
      code: {
        lang: 'js',
        code: `beforeEach(() => {
  setActivePinia(createPinia())
})

it('counts quantities', () => {
  const cart = useCartStore()
  const { totalItems } = cart
  cart.add(mug, 2)
  expect(totalItems).toBe(2)
})`,
      },
      answerLine: 7,
      explanation: 'Destructuring copies the getter\'s current value (0) into a plain variable. Read `cart.totalItems` after the action, or use `storeToRefs(cart)` and `.value`.',
    },
    {
      id: 'testing-logic-q4',
      type: 'fill',
      prompt: 'Complete the setup: a fresh store per test, then wait for a watcher.',
      code: {
        lang: 'js',
        code: `beforeEach(() => {
  setActivePinia(___())
})

it('persists', async () => {
  useCartStore().add(mug)
  await ___()
  expect(localStorage.getItem('cart')).toContain('mug')
})`,
      },
      answer: [['createPinia'], ['nextTick']],
      explanation: '`createPinia()` makes a new Pinia for `setActivePinia`; `nextTick()` waits for the queued watcher to run.',
    },
    {
      id: 'testing-logic-q5',
      type: 'mcq',
      prompt: 'A component is mounted with `createTestingPinia({ createSpy: vi.fn })`. Clicking its **Clear** button calls `cart.clear()`. What happens to `cart.items`?',
      options: [
        { text: 'It becomes empty, because `clear()` ran.', why: 'By default `createTestingPinia` replaces actions with spies that don\'t execute the original code.' },
        { text: 'It stays the same; `cart.clear` is a spy you can assert was called.' },
        { text: 'The test throws because actions are disabled.', why: 'Calling a stubbed action is fine — it just records the call.' },
        { text: 'It depends on whether the store is a setup store.', why: 'Both setup and option stores have their actions stubbed.' },
      ],
      answer: 1,
      explanation: 'Actions are stubbed by default so component tests check wiring, not store logic. Pass `stubActions: false` to run the real actions.',
    },
    {
      id: 'testing-logic-q6',
      type: 'mcq',
      prompt: 'Select **all** composables you can test by simply calling them in a test, without a host component.',
      options: [
        { text: '`useQuantity()` — only `ref` and plain functions' },
        { text: '`useWindowWidth()` — adds a listener in `onMounted`, removes it in `onUnmounted`', why: 'Lifecycle hooks need an active component instance; called directly they warn and never run.' },
        { text: '`useFormField()` — `ref` + `computed`' },
        { text: '`useTheme()` — reads a value with `inject(\'theme\')`', why: '`inject` only works during a component\'s setup (or with an app context); otherwise it warns and returns undefined.' },
      ],
      answer: [0, 2],
      explanation: 'Reactivity APIs work anywhere. Lifecycle hooks and `inject` need a component — use a host component such as `withSetup`, and `app.provide()` for injected values.',
    },
    {
      id: 'testing-logic-q7',
      type: 'short',
      prompt: 'Why does moving logic out of components (into pure functions, composables or stores) make an app easier to test?',
      answer: 'Logic in a component can only be reached by rendering it and simulating user events, which is slow and makes edge cases hard to reach. Extracted logic can be called directly with any input — including weird ones like NaN or a failing server — and a failing test points at one function. The component is left with simple wiring that needs only a few component tests.',
    },
  ],

  exercises: [
    {
      id: 'use-pagination',
      title: 'A tested usePagination composable',
      difficulty: 'intermediate',
      prompt: `
Finish \`usePagination(total, perPage = 10)\` in **usePagination.js**. \`total\` is a ref (or computed) holding the number of items. Return:

- \`page\` — a ref starting at **1**;
- \`pageCount\` — a computed: \`Math.ceil(total / perPage)\`, but **at least 1** (an empty list still has page 1);
- \`next()\` / \`prev()\` — move one page, never below 1 or above \`pageCount\`;
- \`hasNext\` / \`hasPrev\` — computed booleans;
- when \`total\` shrinks so that \`page\` is past the last page, \`page\` must move to the last page (use a \`watch\`).

Tests call it through \`withSetup\` with a \`ref\` for \`total\`. The app shows \`.page-info\` ("Page 1 of 3") with \`.prev\`/\`.next\` buttons.
`,
      files: {
        'App.vue': paginationApp,
        'usePagination.js': `// usePagination.js
import { ref, computed } from 'vue'

export function usePagination(total, perPage = 10) {
  const page = ref(1)
  const pageCount = computed(() => Math.ceil(total.value / perPage))

  function next() {
    page.value++
  }

  function prev() {
    page.value--
  }

  // TODO: clamp next/prev, add hasNext/hasPrev, keep page valid when total shrinks
  return { page, pageCount, next, prev }
}`,
      },
      hints: [
        'Wrap the page count: `Math.max(1, Math.ceil(total.value / perPage))`. (`toValue(total)` from Vue 3.3+ would also accept a plain number or getter.)',
        'Guard the moves: `if (page.value < pageCount.value) page.value++`, and the mirror for `prev`. `hasNext` is `computed(() => page.value < pageCount.value)`.',
        '`watch(pageCount, (count) => { if (page.value > count) page.value = count })` — and remember tests must `await nextTick()` to see it.',
      ],
      solution: {
        explanation: 'Derived values are computeds, so they are always consistent with `total` and `page`. The only side effect — pulling `page` back when the list shrinks — is a watcher, which is why the test awaits a tick after changing `total`. Because the composable takes `total` as an argument, the test controls it with a plain `ref` instead of a real product list.',
        files: {
          'App.vue': paginationApp,
          'usePagination.js': `// usePagination.js
import { ref, computed, watch, toValue } from 'vue'

export function usePagination(total, perPage = 10) {
  const page = ref(1)
  const pageCount = computed(() => Math.max(1, Math.ceil(toValue(total) / perPage)))
  const hasNext = computed(() => page.value < pageCount.value)
  const hasPrev = computed(() => page.value > 1)

  function next() {
    if (hasNext.value) page.value++
  }

  function prev() {
    if (hasPrev.value) page.value--
  }

  // the list shrank (e.g. a filter): stay on a page that exists
  watch(pageCount, (count) => {
    if (page.value > count) page.value = count
  })

  return { page, pageCount, next, prev, hasNext, hasPrev }
}`,
        },
      },
      tests: [
        {
          name: 'starts on page 1 and computes the page count',
          code: `const { ref } = requireModule('vue')
const { usePagination } = requireModule('usePagination.js')
const p = withSetup(() => usePagination(ref(45), 10))
expect(p.page.value).toBe(1)
expect(p.pageCount.value).toBe(5)
const empty = withSetup(() => usePagination(ref(0), 10))
expect(empty.pageCount.value).toBe(1)`,
        },
        {
          name: 'next/prev stay within 1..pageCount and hasNext/hasPrev follow',
          code: `const { ref } = requireModule('vue')
const { usePagination } = requireModule('usePagination.js')
const p = withSetup(() => usePagination(ref(45), 10))
p.prev()
expect(p.page.value).toBe(1)
expect(p.hasPrev.value).toBe(false)
for (let i = 0; i < 10; i++) p.next()
expect(p.page.value).toBe(5)
expect(p.hasNext.value).toBe(false)
expect(p.hasPrev.value).toBe(true)`,
        },
        {
          name: 'page moves back when total shrinks',
          code: `const { ref } = requireModule('vue')
const { usePagination } = requireModule('usePagination.js')
const total = ref(45)
const p = withSetup(() => usePagination(total, 10))
p.next(); p.next(); p.next(); p.next()
expect(p.page.value).toBe(5)
total.value = 15
await nextTick()
expect(p.pageCount.value).toBe(2)
expect(p.page.value).toBe(2)`,
        },
        {
          name: 'the app pages through 23 products',
          code: `expect(text('.page-info')).toBe('Page 1 of 3')
await click('.next')
await click('.next')
await click('.next')
expect(text('.page-info')).toBe('Page 3 of 3')
expect(findAll('.product')).toHaveLength(3)`,
        },
      ],
    },
    {
      id: 'store-checkout',
      title: 'A checkout action that survives failure',
      difficulty: 'advanced',
      prompt: `
The cart store's \`checkout()\` action empties the cart *before* the payment succeeds, never catches errors and can be fired twice. Fix it in **cartStore.js**:

- If \`status\` is already \`'submitting'\` (or the cart is empty), return without doing anything — **one** order per checkout.
- Set \`status\` to \`'submitting'\` and clear \`error\` before calling \`placeOrder(items.value)\`.
- On success: empty \`items\`, store the returned \`id\` in \`orderId\`, set \`status\` to \`'done'\`.
- On failure: **keep the items**, put the error's \`message\` in \`error\`, set \`status\` to \`'error'\`. \`checkout()\` must **not** throw.

The tests call the store directly (and make the fake server fail with \`server.failNext = true\` from **api.js**). The app shows \`li.line\` items, a \`.checkout\` button and a \`.error\` paragraph.
`,
      files: {
        'main.js': mainJs,
        'App.vue': checkoutApp,
        'api.js': checkoutApi,
        'cartStore.js': `${checkoutStoreHead}
  async function checkout() {
    status.value = 'submitting'
    const toOrder = items.value
    items.value = [] // empty the cart straight away
    const order = await placeOrder(toOrder)
    orderId.value = order.id
    status.value = 'done'
  }

  return { items, status, error, orderId, add, checkout }
})`,
      },
      hints: [
        'Run the tests: which one throws? An `await` that rejects inside an action without `try/catch` rejects the whole action.',
        'Move `items.value = []` to *after* the successful `await`, inside a `try` block; set `error` and `status` in the `catch`.',
        'The very first line of `checkout()` can be the guard: `if (status.value === \'submitting\' || items.value.length === 0) return`.',
      ],
      solution: {
        explanation: 'State only changes to "done" after the server confirms, so a failed payment leaves the cart intact and the error visible. The guard makes the action idempotent while a request is in flight — the UI disables the button too, but the store enforces it. Each path (success, failure, double click) is a separate, fast store test with no rendering.',
        files: {
          'main.js': mainJs,
          'App.vue': checkoutApp,
          'api.js': checkoutApi,
          'cartStore.js': `${checkoutStoreHead}
  async function checkout() {
    if (status.value === 'submitting' || items.value.length === 0) return
    status.value = 'submitting'
    error.value = ''
    try {
      const order = await placeOrder(items.value)
      items.value = []
      orderId.value = order.id
      status.value = 'done'
    } catch (e) {
      error.value = e.message
      status.value = 'error'
    }
  }

  return { items, status, error, orderId, add, checkout }
})`,
        },
      },
      tests: [
        {
          name: 'success: empties the cart, stores the order id, status done',
          code: `const cart = requireModule('cartStore.js').useCartStore()
cart.add({ id: 2, name: 'Ceramic mug', priceCents: 1850 })
const pending = cart.checkout()
expect(cart.status).toBe('submitting')
await pending
expect(cart.items).toHaveLength(0)
expect(cart.orderId).toBe('ord_1')
expect(cart.status).toBe('done')`,
        },
        {
          name: 'failure: keeps the items, sets error, does not throw',
          code: `const cart = requireModule('cartStore.js').useCartStore()
const { server } = requireModule('api.js')
cart.add({ id: 2, name: 'Ceramic mug', priceCents: 1850 })
server.failNext = true
let threw = false
try {
  await cart.checkout()
} catch (e) {
  threw = true
}
expect(threw).toBe(false)
expect(cart.status).toBe('error')
expect(cart.error).toBe('Payment declined')
expect(cart.items).toHaveLength(1)`,
        },
        {
          name: 'double checkout places only one order',
          code: `const cart = requireModule('cartStore.js').useCartStore()
const { server } = requireModule('api.js')
cart.add({ id: 2, name: 'Ceramic mug', priceCents: 1850 })
await Promise.all([cart.checkout(), cart.checkout()])
expect(server.orders).toBe(1)`,
        },
        {
          name: 'the app shows the error and keeps the line',
          code: `const { server } = requireModule('api.js')
server.failNext = true
await click('.add')
await click('.checkout')
await wait(300)
expect(exists('.error')).toBe(true)
expect(findAll('.line')).toHaveLength(1)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'testing-logic-composable-hooks',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How would you test a composable? Does it matter whether it uses `onMounted` or `inject()`?',
      answer: 'If it only uses reactivity APIs (`ref`, `computed`, `watch`), call it directly in the test and assert on the returned refs and functions. If it uses lifecycle hooks or `inject`, it needs a component instance: run it inside a throwaway host component (the `withSetup` helper from the Vue docs), use `app.provide()` for injected values, and `app.unmount()` to test cleanup in `onUnmounted`.',
      explanation: 'Hooks and inject look up the current component instance; without one they warn and do nothing.',
      whyAsked: 'Composables are the main reuse mechanism in Vue 3; testing them well is a core skill.',
      mistakes: ['Saying composables can only be tested through components that use them.', 'Calling a hook-based composable directly and ignoring the warning.', 'Forgetting to test cleanup (unmount).'],
      followUps: ['How do you test that a listener is removed on unmount?', 'How would you provide a value for `inject` in that test?', 'When would you use `effectScope` in tests?'],
      modelAnswer: 'It depends on what the composable touches. If it only uses reactivity — refs, computeds, watchers — I call it directly and assert on what it returns, awaiting `nextTick` for watchers. If it uses lifecycle hooks or `inject`, those need an active component instance, so I run it inside a minimal host component, like the `withSetup` helper from the Vue testing guide. That helper returns the app, so I can `provide` values before mounting and call `unmount` to check cleanup such as removed event listeners.',
    },
    {
      id: 'testing-logic-watcher-tick',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This test fails, but the feature works in the app. Explain why and fix it.',
      code: {
        lang: 'js',
        code: `it('saves the draft', () => {
  const { text } = useDraft() // watch(text, (v) => localStorage.setItem('draft', v))
  text.value = 'Hello'
  expect(localStorage.getItem('draft')).toBe('Hello')
})`,
      },
      answer: 'Watcher callbacks are queued and run after the current synchronous code, so the assertion reads storage before the callback ran. Make the test async and `await nextTick()` after setting `text.value`.',
      explanation: 'With the default `flush: \'pre\'`, the watcher runs in the scheduler flush, which happens in a microtask.',
      whyAsked: 'A very common real-world testing failure that reveals whether you understand Vue\'s scheduler.',
      mistakes: ['Adding `setTimeout`/`wait(100)` instead of `nextTick`.', 'Switching the watcher to `flush: \'sync\'` to make the test pass.', 'Blaming jsdom\'s localStorage.'],
      followUps: ['What does `nextTick` actually wait for?', 'When would you need `flushPromises` instead?', 'How would the answer change for a debounced watcher?'],
      modelAnswer: 'The watcher isn\'t run at the moment of the assignment — Vue queues it and flushes the queue in a microtask, batching all changes from the same tick. The assertion runs synchronously, before that flush, so storage is still empty. The fix is to make the test async and `await nextTick()` after the change. I wouldn\'t change the watcher to sync flush just for a test; that alters production behaviour. If the watcher debounced, I\'d add fake timers and advance them.',
    },
    {
      id: 'testing-logic-pinia-unit',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you unit-test a Pinia store whose actions call an API?',
      answer: 'Activate a fresh Pinia in `beforeEach` with `setActivePinia(createPinia())`, so each test gets a new store. Mock the API module (`vi.mock(\'./api.js\')` with `mockResolvedValue`/`mockRejectedValue`) or inject a fake. Call the action (awaiting it if async) and assert on state and getters — including the error path and in-flight status.',
      explanation: 'Stores are plain JavaScript; the only setup is an active Pinia and control over their dependencies.',
      code: {
        lang: 'js',
        code: `import { vi, beforeEach, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { placeOrder } from './api.js'
import { useCartStore } from './cartStore.js'

vi.mock('./api.js', () => ({ placeOrder: vi.fn() }))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(placeOrder).mockReset()
})

it('keeps the items when payment fails', async () => {
  vi.mocked(placeOrder).mockRejectedValue(new Error('Payment declined'))
  const cart = useCartStore()
  cart.add(mug)
  await cart.checkout()
  expect(cart.error).toBe('Payment declined')
  expect(cart.items).toHaveLength(1)
})`,
      },
      whyAsked: 'Stores hold critical business logic; knowing how to test them in isolation is expected for mid-level roles.',
      mistakes: ['Mounting a component just to test a store.', 'Sharing one Pinia across tests.', 'Letting tests hit a real API.', 'Only testing the happy path.'],
      followUps: ['How is this different from testing a component that uses the store?', 'How do you test an option store\'s getters?', 'How would you test a store that uses another store?'],
      modelAnswer: 'I treat the store as plain JavaScript. In `beforeEach` I call `setActivePinia(createPinia())` so every test starts with a fresh store, and I mock the API module with `vi.mock` so I control success and failure. Then each test calls an action — awaiting it if it\'s async — and asserts on the state and getters: the happy path, the error path that should keep data and set an error, and edge cases like double submission. Components that use the store get separate tests with `createTestingPinia`.',
    },
    {
      id: 'testing-logic-testing-pinia-output',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'What does this component test print?',
      code: {
        lang: 'js',
        code: `const wrapper = mount(CartBadge, {
  global: {
    plugins: [createTestingPinia({
      createSpy: vi.fn,
      initialState: { cart: { items: [{ id: 1, qty: 2 }] } },
    })],
  },
})
const cart = useCartStore()
await wrapper.get('button.clear').trigger('click') // calls cart.clear()
console.log(cart.items.length, cart.clear.mock.calls.length)`,
      },
      options: ['`0 1`', '`1 1`', '`1 0`', 'It throws: clear is not a function'],
      correctOption: 1,
      answer: '`1 1`. `createTestingPinia` seeds the state from `initialState` and replaces actions with spies, so clicking records one call to `clear` but doesn\'t run it — the item stays.',
      explanation: 'Stubbed actions let a component test check wiring ("the button calls clear") without re-testing the store.',
      whyAsked: 'Distinguishes people who have actually used @pinia/testing from those who guess.',
      mistakes: ['Expecting the real action to run.', 'Forgetting `createSpy` when Vitest globals are off.', 'Not knowing about `stubActions: false`.'],
      followUps: ['How would you make `clear()` really run?', 'How can you force a getter\'s value in a test?', 'Why is stubbing the default?'],
      modelAnswer: 'It prints 1 and 1. The testing Pinia starts from the `initialState` I gave it, and by default every action is replaced with a spy created by `createSpy`, here `vi.fn`. So the click is recorded as one call to `clear`, but the real action never runs and the item is still there. That\'s intentional: the component test checks the wiring, and the store\'s own unit tests check what `clear` does. If I need the real behaviour I pass `stubActions: false`.',
    },
    {
      id: 'testing-logic-debounce-timers',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A `useSearch()` composable watches a query ref and calls the API 300 ms after the user stops typing. How do you test the debounce without making the test slow or flaky?',
      answer: 'Use fake timers: `vi.useFakeTimers()` before running the composable, inject or mock the API, change the query, `await nextTick()` so the watcher schedules its timer, then `vi.advanceTimersByTime(299)` and assert no call; advance 1 ms more and assert exactly one call with the latest query; `await flushPromises()` before checking results. Restore real timers in `afterEach`.',
      explanation: 'Fake timers make time explicit, so the test is instant and deterministic, and you can assert the exact boundary.',
      whyAsked: 'Timing logic is where tests become slow and flaky; this checks you know the tools.',
      mistakes: ['Waiting with real `setTimeout(…, 350)` in the test.', 'Advancing timers before the watcher has scheduled its timer.', 'Forgetting to restore real timers.', 'Not testing that rapid typing produces a single call.'],
      followUps: ['Why is `await nextTick()` needed before advancing?', 'How would you test cancellation of an in-flight request?', 'What does `vi.advanceTimersByTimeAsync` add?'],
      modelAnswer: 'I\'d make time explicit with fake timers. I enable `vi.useFakeTimers()`, run the composable with a mocked API, set the query a few times quickly, and await `nextTick` so the watcher has scheduled its debounce timer. Then I advance 299 milliseconds and assert the API hasn\'t been called, advance one more and assert a single call with the last query, and flush promises before checking results. In `afterEach` I restore real timers. The test runs instantly and checks the exact boundary.',
    },
    {
      id: 'testing-logic-form-field',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `useFormField(initial, validate)` in **useFormField.js**. `validate(value)` returns `\'\'` when valid or an error message. Return `value` (ref), `touched` (ref, starts `false`), `error` (computed: the message, but only once touched), `isValid` (computed, regardless of touched), `blur()` (marks touched) and `reset()` (back to the initial value, untouched).',
      starter: {
        files: {
          'App.vue': formFieldApp,
          'useFormField.js': `// useFormField.js
import { ref } from 'vue'

export function useFormField(initial, validate) {
  const value = ref(initial)
  const touched = ref(false)
  const error = ref(validate(initial)) // calculated once — never updates

  function blur() {
    touched.value = true
  }

  return { value, touched, error, blur }
}`,
        },
      },
      tests: [
        { name: 'no error before the field is touched', code: `const { useFormField } = requireModule('useFormField.js')\nconst required = (v) => (v.trim() ? '' : 'Required')\nconst f = withSetup(() => useFormField('', required))\nexpect(f.error.value).toBe('')\nexpect(f.isValid.value).toBe(false)` },
        { name: 'after blur, error follows the value', code: `const { useFormField } = requireModule('useFormField.js')\nconst required = (v) => (v.trim() ? '' : 'Required')\nconst f = withSetup(() => useFormField('', required))\nf.blur()\nexpect(f.error.value).toBe('Required')\nf.value.value = 'Ada'\nexpect(f.error.value).toBe('')\nexpect(f.isValid.value).toBe(true)` },
        { name: 'reset() restores the initial, untouched state', code: `const { useFormField } = requireModule('useFormField.js')\nconst required = (v) => (v.trim() ? '' : 'Required')\nconst f = withSetup(() => useFormField('', required))\nf.value.value = 'x'\nf.blur()\nf.reset()\nexpect(f.value.value).toBe('')\nexpect(f.touched.value).toBe(false)\nexpect(f.error.value).toBe('')` },
        { name: 'the email field shows its error after blur', code: `expect(exists('.field-error')).toBe(false)\nawait type('.email', 'ada')\nawait trigger('.email', 'blur')\nexpect(text('.field-error')).toBe('Enter a valid email')\nawait type('.email', 'ada@example.com')\nexpect(exists('.field-error')).toBe(false)` },
      ],
      hints: ['`error` and `isValid` depend on other state — make them `computed`, not refs.', '`error`: `computed(() => (touched.value ? validate(value.value) : \'\'))`.', '`reset()` sets `value.value = initial` and `touched.value = false`.'],
      answer: 'Keep `value` and `touched` as the only state; derive `error` and `isValid` with computeds; `blur` and `reset` just change the two refs.',
      solution: {
        files: {
          'App.vue': formFieldApp,
          'useFormField.js': `// useFormField.js
import { ref, computed } from 'vue'

export function useFormField(initial, validate) {
  const value = ref(initial)
  const touched = ref(false)
  const isValid = computed(() => validate(value.value) === '')
  const error = computed(() => (touched.value ? validate(value.value) : ''))

  function blur() {
    touched.value = true
  }

  function reset() {
    value.value = initial
    touched.value = false
  }

  return { value, touched, error, isValid, blur, reset }
}`,
        },
      },
      explanation: 'Two pieces of real state, everything else derived: the error can never drift out of sync with the value. Because `validate` is passed in, tests can use a one-line rule and the composable stays reusable for any field.',
      whyAsked: 'Shows whether you separate state from derived values and design composables that are easy to test.',
      mistakes: ['Storing `error` in a ref and forgetting to update it.', 'Showing errors before the user has touched the field.', 'Hard-coding the validation rule inside the composable.'],
      followUps: ['How would you add async validation (e.g. "username taken")?', 'How would you compose several fields into a form?', 'Do you need `withSetup` to test this composable?'],
      modelAnswer: 'I keep only two refs as real state — the value and whether the field was touched. The error is a computed that returns the validator\'s message only once touched, and `isValid` is a computed that ignores touched, so a submit button can use it. `blur` marks the field touched and `reset` restores both refs. Since the composable uses only reactivity APIs, I can test it by calling it directly; the validator is injected, so tests pass a tiny rule like "required".',
    },
    {
      id: 'testing-logic-functional-core',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Your team\'s component tests are slow and brittle because each one mounts a big page to test a pricing rule. How would you restructure the code and the tests?',
      answer: 'Separate layers: pure functions for business rules (no Vue imports), composables or store getters that wrap them reactively, and components that only wire state to the template. Then test each layer at its cheapest level: many fast unit tests for the pure rules, a few tests for composables/stores (reactivity, watchers, async actions with mocked APIs), and a small number of component tests for rendering and events with `createTestingPinia` or stubs.',
      explanation: 'Often called "functional core, imperative (or reactive) shell": most logic becomes trivial to test, and only thin wiring needs rendering.',
      whyAsked: 'Senior-level: connects code design with test strategy and maintenance cost.',
      mistakes: ['Answering only "use shallowMount" (faster but doesn\'t fix the design).', 'Moving all logic into Pinia regardless of whether it is shared.', 'Deleting component tests entirely.'],
      followUps: ['Where would validation rules live?', 'How do you stop logic creeping back into components?', 'How would you migrate incrementally?'],
      modelAnswer: 'The tests are slow because the logic is trapped in components. I\'d pull business rules into pure functions with no Vue in them, so a pricing rule is tested in a millisecond with a table of cases. Composables and store getters become thin reactive wrappers over those functions, tested for reactivity, watchers and async behaviour with mocked APIs. Components shrink to wiring, so a few component tests that check rendering and emitted events are enough. I\'d migrate incrementally: each time someone touches a rule, it moves out with tests.',
    },
  ],

  takeaways: [
    'Test logic directly: computed (change source, read `.value`), watchers (change, `await nextTick()`), composables (call them), stores (call actions, read state).',
    'Watcher callbacks are queued and batched — await `nextTick()` before asserting their side effects; don\'t switch to `flush: \'sync\'` for tests.',
    'Composables with lifecycle hooks or `inject` need a host component (`withSetup`); unmount it to test cleanup.',
    'Give every test a fresh store with `setActivePinia(createPinia())` in `beforeEach`; mock the APIs actions call.',
    '`createTestingPinia` stubs actions with spies for component tests; `stubActions: false` runs them for real.',
    'Read store values through the store or `storeToRefs` — plain destructuring copies values.',
    'Use fake timers for debounce/polling logic; restore real timers afterwards.',
  ],
}
