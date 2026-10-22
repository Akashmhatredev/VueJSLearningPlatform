// Lesson: Designing & testing composables.

const productsFile = `export const products = [
  { id: 1, name: 'Trail backpack', category: 'outdoor', price: 89 },
  { id: 2, name: 'Camping lantern', category: 'outdoor', price: 25 },
  { id: 3, name: 'Water bottle', category: 'outdoor', price: 15 },
  { id: 4, name: 'Mechanical keyboard', category: 'desk', price: 120 },
  { id: 5, name: 'Desk lamp', category: 'desk', price: 40 },
  { id: 6, name: 'Monitor stand', category: 'desk', price: 55 },
  { id: 7, name: 'Notebook', category: 'stationery', price: 6 },
  { id: 8, name: 'Gel pens (pack)', category: 'stationery', price: 9 },
  { id: 9, name: 'Sketchbook', category: 'stationery', price: 12 },
  { id: 10, name: 'Running shoes', category: 'sport', price: 95 },
  { id: 11, name: 'Yoga mat', category: 'sport', price: 30 },
  { id: 12, name: 'Jump rope', category: 'sport', price: 8 },
  { id: 13, name: 'Coffee grinder', category: 'kitchen', price: 60 },
  { id: 14, name: 'French press', category: 'kitchen', price: 32 },
]`

const useSearchFile = `import { computed, toValue } from 'vue'

// items and query may each be a plain value, a ref or a getter
export function useSearch(items, query, options = {}) {
  const { keys = ['name'] } = options

  const results = computed(() => {
    const q = String(toValue(query) ?? '').trim().toLowerCase()
    const list = toValue(items)
    if (!q) return list
    return list.filter((item) =>
      keys.some((key) => String(item[key]).toLowerCase().includes(q))
    )
  })

  return { results }
}`

const usePaginationFile = `import { ref, computed, watch, readonly, toValue } from 'vue'

export function usePagination(items, options = {}) {
  const { pageSize = 10, initialPage = 1 } = options

  const page = ref(initialPage)

  const size = computed(() => Math.max(1, Number(toValue(pageSize)) || 1))
  const pageCount = computed(() => Math.max(1, Math.ceil(toValue(items).length / size.value)))
  const pageItems = computed(() => {
    const start = (page.value - 1) * size.value
    return toValue(items).slice(start, start + size.value)
  })
  const hasPrev = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < pageCount.value)

  function goTo(n) {
    page.value = Math.min(Math.max(1, n), pageCount.value)
  }
  const next = () => goTo(page.value + 1)
  const prev = () => goTo(page.value - 1)

  // keep the page valid when the list shrinks (e.g. after filtering)
  watch(pageCount, (count) => {
    if (page.value > count) page.value = count
  })

  return {
    page: readonly(page), // callers can read it; only goTo/next/prev change it
    pageCount,
    pageItems,
    hasPrev,
    hasNext,
    goTo,
    next,
    prev,
  }
}`

const appFile = `<script setup>
import { ref } from 'vue'
import { products } from './products.js'
import { useSearch } from './useSearch.js'
import { usePagination } from './usePagination.js'

const query = ref('')

// Two small composables, composed through refs
const { results } = useSearch(products, query, { keys: ['name', 'category'] })
const { page, pageCount, pageItems, hasPrev, hasNext, next, prev, goTo } =
  usePagination(results, { pageSize: 5 })
</script>

<template>
  <h2>Product catalogue</h2>
  <input class="search" v-model="query" placeholder="Filter by name or category…" />
  <p class="summary">
    {{ results.length }} products · page <span class="page">{{ page }}</span>
    of <span class="pages">{{ pageCount }}</span>
  </p>
  <ul>
    <li v-for="p in pageItems" :key="p.id" class="row">
      {{ p.name }} <small>({{ p.category }})</small> — \${{ p.price }}
    </li>
  </ul>
  <button class="prev" :disabled="!hasPrev" @click="prev">‹ Prev</button>
  <button class="next" :disabled="!hasNext" @click="next">Next ›</button>
</template>`

const mixinCode = `// searchMixin.js (Options API, Vue 2 style)
export default {
  data() {
    return { query: '', page: 1 }
  },
  computed: {
    filtered() {
      // silently expects the component to have this.items!
      return this.items.filter((i) => i.name.includes(this.query))
    },
  },
  watch: {
    query() { this.page = 1 }
  },
}

// ProductList.vue
export default {
  mixins: [searchMixin, paginationMixin], // both define page?
  data() { return { items: [] } },
  // where do query, page, filtered come from?
}`

const composableCode = `// useSearch.js
export function useSearch(items, query) {
  const results = computed(() =>
    toValue(items).filter((i) =>
      i.name.includes(toValue(query))))
  return { results }
}

// ProductList.vue
const items = ref([])
const query = ref('')
const { results } = useSearch(items, query)
const { page, next } = usePagination(results)
// every name is visible, explicit and renameable`

export default {
  id: 'composable-design',
  title: 'Designing & testing composables',
  summary: 'Give composables small, flexible, honest APIs — reactive inputs, readonly outputs, one job each — and test them in isolation.',
  difficulty: 'advanced',
  minutes: 40,
  prerequisites: ['composables-intro', 'composable-recipes', 'reactivity-utilities'],
  related: ['options-api', 'provide-inject', 'why-state-management', 'testing-logic', 'effect-scope', 'design-patterns'],
  tags: ['composables', 'api design', 'toValue', 'MaybeRefOrGetter', 'readonly', 'mixins', 'testing', 'withSetup', 'effectScope', 'vitest'],
  apis: [
    { name: 'toValue()', summary: 'Reads a plain value, a ref or a getter (Vue 3.3+). The standard way to accept flexible composable inputs.' },
    { name: 'MaybeRefOrGetter<T>', summary: 'TypeScript type for "a T, a Ref<T> or a () => T" (Vue 3.3+).' },
    { name: 'readonly()', summary: 'Returns a readonly proxy of a ref or object, so callers can read state but not change it.' },
    { name: 'effectScope()', summary: 'Creates a scope that collects effects so they can be stopped together — useful for testing composables without a component.' },
  ],
  docs: [
    { label: 'Vue Guide — Composables (conventions & best practices)', url: 'https://vuejs.org/guide/reusability/composables.html#conventions-and-best-practices' },
    { label: 'Vue Guide — Composables vs. other techniques', url: 'https://vuejs.org/guide/reusability/composables.html#comparisons-with-other-techniques' },
    { label: 'Vue Guide — Testing composables', url: 'https://vuejs.org/guide/scaling-up/testing.html#testing-composables' },
    { label: 'API — toValue()', url: 'https://vuejs.org/api/reactivity-utilities.html#tovalue' },
  ],

  intro: `
Writing a composable that works is the easy part. Writing one that teammates can *use correctly without reading its source* — and that you can change next year without breaking ten screens — is design.

This lesson is about the **shape** of composables: what they accept, what they return, how big they should be, how they compare with the mixins they replaced, and how to **test** them on their own.
`,

  why: `
A composable is an API. Every component that calls it depends on its inputs and outputs. Bad API decisions spread:

- accept a plain value where a ref was needed → the composable silently stops reacting when a prop changes;
- return every internal ref writable → any caller can bypass your rules (\`page.value = 999\`);
- let one composable do five jobs → nobody can reuse a part of it, and every change risks the other four.

Good design avoids all three. And because composables are plain functions with no template, they are the **easiest part of a Vue app to test** — if you know how to give them the component context some of them need.
`,

  eli15: `
Think of a composable as a vending machine you build for your classmates.

- **The coin slot (inputs):** a good machine takes coins *or* a card *or* a phone. A good composable takes a value, a ref or a getter.
- **The glass window (outputs):** everyone can *see* the snacks, but they can't reach in and rearrange them. A good composable lets callers read state, but changes only happen through its buttons (functions).
- **One machine, one job:** a drinks machine and a snack machine side by side beat one giant machine that also makes toast.
- **Testing:** before putting it in the hallway, you test the machine in the workshop — press every button, check what comes out. Some machines need to be plugged in first (that's the "fake component" some composables need in tests).
`,

  analogy: {
    title: 'Designing a vending machine',
    body: `
A vending machine has a tiny, clear interface: a slot, a keypad, a tray. Its insides can change completely — new motors, new software — and customers never notice, because the interface stayed the same.

Composables should be built the same way. Keep the inputs flexible, the outputs small and safe, the inside private. Then test it on the workbench before it goes into the building.
`,
    mapping: [
      ['accepting coins, card or phone', 'accepting a value, ref or getter via `toValue()`'],
      ['the settings panel inside', 'an options object with defaults'],
      ['the glass window', 'returning `readonly()` state'],
      ['the buttons', 'returned functions (`next()`, `goTo()`)'],
      ['one machine per product type', 'one responsibility per composable'],
      ['the workbench test', 'unit-testing the composable with `withSetup` or `effectScope`'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'Mixins vs composables',
    props: {
      left: { label: 'Mixins (Options API)', lang: 'js', code: mixinCode },
      right: { label: 'Composables', lang: 'js', code: composableCode },
      points: [
        'Source of properties: with mixins, `this.page` could come from any mixin; with composables every name is destructured from a visible call.',
        'Name collisions: two mixins defining `page` are merged by Vue\'s merge rules (for `data`, the component\'s own value wins); composables let you rename on destructure (`const { page: resultsPage } = …`).',
        'Implicit contracts: the mixin silently requires `this.items`; the composable takes `items` as an explicit argument.',
        'Composables can call other composables and receive reactive arguments, so logic composes like ordinary functions.',
      ],
    },
    caption: 'The three mixin problems listed in the Vue docs — unclear source, namespace collisions, implicit cross-mixin communication — disappear when logic is passed in and returned out explicitly.',
    alt: 'Side-by-side code. Left: a search mixin with data, computed and watch that relies on this.items, and a component using two mixins with unclear property origins. Right: a useSearch composable taking items and query as arguments and a component destructuring results and page explicitly.',
  },

  syntax: [
    `
#### 1. Inputs: accept values, refs *and* getters

Callers have data in different forms: a constant, a ref, a prop. Accept all three and read them with **\`toValue()\`** (Vue 3.3+) *inside* a reactive context (\`computed\`, \`watch\`, \`watchEffect\`) — that is what makes the composable re-run when the input changes.
`,
    {
      code: `export function useProduct(id) {          // id: 42 | ref(42) | () => props.id
  const product = ref(null)
  watch(() => toValue(id), async (value) => {
    product.value = await api.getProduct(value)
  }, { immediate: true })
  return { product }
}

useProduct(42)                  // fixed
useProduct(selectedId)          // a ref
useProduct(() => props.id)      // a getter: stays reactive to the prop`,
      lang: 'js',
      title: 'flexible, reactive inputs',
    },
    {
      code: `import type { MaybeRefOrGetter, Ref } from 'vue'

export function useProduct(id: MaybeRefOrGetter<number>): { product: Ref<Product | null> }`,
      lang: 'ts',
      title: 'the same signature in TypeScript (3.3+)',
      static: true,
    },
    `
> **Careful:** \`useProduct(props.id)\` passes a *snapshot* — the number at that moment. When the prop changes, the composable never knows. Pass \`() => props.id\` (or \`toRef(props, 'id')\`) instead.

#### 2. Options: one object with defaults

Required inputs are positional; everything optional goes into an options object. It reads well at the call site and lets you add options later without breaking callers.
`,
    {
      code: `usePagination(results, { pageSize: 5 })            // clear
usePagination(results, 5, 1, true, false)           // what do these mean?`,
      lang: 'js',
      title: 'options object vs positional soup',
    },
    `
#### 3. Outputs: a plain object of refs, readonly where it matters

Return a plain object (destructuring stays reactive). Wrap state that **only the composable may change** in \`readonly()\` and expose functions for changes — the composable keeps its rules (like "page stays within range") no matter who calls it.

#### 4. One job each — then compose

\`useSearch\` filters, \`usePagination\` paginates, and the component connects them through a ref. Small composables are easier to name, test and reuse. If a composable needs a paragraph to describe, it is probably two.

#### 5. Calling rules (the contract you document)

- Call synchronously at the top of \`<script setup>\` / \`setup()\`, or inside another composable.
- In \`<script setup>\` you may call composables *after* a top-level \`await\` — the compiler restores the component context for you. That does **not** apply inside your own \`async\` functions or a hand-written \`async setup()\`.
- No side effects at import time: don't add listeners or start timers at module level; do it when the composable is called, and clean up.
`,
    {
      callout: 'version',
      text: '`toValue()` and the `MaybeRefOrGetter` type were added in Vue 3.3. On older versions, `unref()` handles values and refs but not getters.',
    },
  ],

  walkthrough: {
    title: 'usePagination.js',
    lang: 'js',
    code: usePaginationFile,
    intro: 'A composable designed to be hard to misuse. Every line reflects an API decision.',
    steps: [
      { lines: [3, 4], text: 'One required input (`items`) and an options object with defaults. `items` can be an array, a ref or a getter — even another composable\'s computed.' },
      { lines: [6], text: 'The real state is a private, writable ref. Nothing outside this function can reach this exact variable.' },
      { lines: [8], text: '`pageSize` goes through `toValue()` inside a computed, so callers may pass a number *or* a ref (e.g. bound to a `<select>`). `Number(…) || 1` defends against strings and zero.' },
      { lines: [9, 15], text: 'Derived state is `computed`, so it is cached and always consistent with `items`, `page` and `size`. `toValue(items)` inside the computed makes the composable react to a changing list.' },
      { lines: [17, 21], text: 'All changes go through `goTo()`, which clamps the page into the valid range. `next`/`prev` reuse it, so there is exactly one place where the rule lives.' },
      { lines: [23, 26], text: 'An invariant the composable maintains by itself: if the list shrinks (say the user filters), the page moves back into range. Callers don\'t have to remember.' },
      { lines: [28, 29], text: '`readonly(page)` lets callers display the page but not assign it. Writing `page.value = 99` logs a warning and changes nothing.' },
      { lines: [30, 37], text: 'The rest of the public API: derived values and actions. Destructuring this plain object keeps every ref reactive.' },
    ],
  },

  playground: {
    title: 'Product catalogue',
    objective: 'Two small composables composed through refs. Extend the API from the outside — and notice how little the composables need to change.',
    files: {
      'App.vue': appFile,
      'useSearch.js': useSearchFile,
      'usePagination.js': usePaginationFile,
      'products.js': productsFile,
    },
    expected: 'A filter box and **14 products · page 1 of 3**, five rows per page with Prev/Next. Typing **desk** shows 3 products on 1 page. Go to page 3, then type **sport**: the page jumps back into range automatically.',
    experiments: [
      {
        id: 'page-size',
        task: 'Let users choose **5 or 10** rows per page. In `App.vue`, create `const size = ref(5)`, add `<select class="size" v-model.number="size">` with options 5 and 10, and pass `{ pageSize: size }` to `usePagination`.',
        hint: 'Because `usePagination` reads `toValue(pageSize)` inside a computed, passing a ref is enough — the composable does not change at all.',
        tests: [
          {
            name: 'choosing 10 shows ten rows',
            code: `expect(exists('.size')).toBe(true)
await select('.size', '10')
expect(findAll('.row')).toHaveLength(10)
expect(text('.pages')).toBe('2')`,
          },
        ],
        explain: 'This is the payoff of accepting refs or getters: callers turn a static setting into a live one with no change to the composable. If `pageSize` had been read once as a plain number, the select would have had no effect.',
      },
      {
        id: 'reset-on-search',
        task: 'When the search text changes, the user should land on **page 1**. Add a `watch` in `App.vue` that calls `goTo(1)` whenever `query` changes.',
        hint: 'Import `watch` from `\'vue\'` and add `watch(query, () => goTo(1))`.',
        tests: [
          {
            name: 'typing a new search returns to page 1',
            code: `await click('.next')
expect(text('.page')).toBe('2')
await type('.search', 'a')
expect(Number(text('.pages'))).toBeGreaterThan(1)
expect(text('.page')).toBe('1')`,
          },
        ],
        explain: 'The composable only enforces what is *always* true (the page is in range). "Reset on a new search" is a product decision, so it lives in the caller. Keeping policy out of generic composables is what keeps them reusable. (If many screens wanted it, an option such as `resetOn: query` would be a reasonable API addition.)',
      },
      {
        id: 'first-last',
        task: 'Add **First** and **Last** buttons with `class="first"` and `class="last"`, using the `goTo()` action and `pageCount`.',
        hint: '`<button class="first" @click="goTo(1)">« First</button>` and `<button class="last" @click="goTo(pageCount)">Last »</button>`.',
        tests: [
          {
            name: 'Last jumps to the final page, First back to 1',
            code: `const last = find('.last')
expect(last).toBeTruthy()
await click(last)
expect(text('.page')).toBe(text('.pages'))
await click('.first')
expect(text('.page')).toBe('1')`,
          },
        ],
        explain: 'A small, general action (`goTo`) lets callers build features the composable author never imagined. Prefer a few composable building blocks over many special-purpose functions.',
      },
      {
        id: 'readonly-guard',
        task: 'Try to cheat: add `<button @click="page = 99">Hack</button>` to the template, click it, and look at the console.',
        hint: '`page` is the `readonly()` ref returned by `usePagination`.',
        explain: 'Vue warns "Set operation on key \\"value\\" failed: target is readonly" and the page does not change. Exposing state as readonly forces every change through `goTo()`, so the range rule can never be bypassed — a cheap, effective API guarantee.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'Anatomy of a well-designed composable',
    props: {
      nodes: [
        { id: 'caller', label: 'Caller', note: 'usePagination(results, { pageSize })', tone: 'paper', x: 110, y: 160 },
        { id: 'inputs', label: 'Inputs', note: 'value · ref · getter', tone: 'acid', x: 290, y: 70 },
        { id: 'tovalue', label: 'toValue()', note: 'inside computed / watch', tone: 'kraft', x: 470, y: 70 },
        { id: 'state', label: 'Private state', note: 'const page = ref(1)', tone: 'cobalt', x: 470, y: 250 },
        { id: 'outputs', label: 'Public API', note: 'readonly(page) · computeds · actions', tone: 'ink', x: 660, y: 160 },
      ],
      edges: [
        { from: 'caller', to: 'inputs', label: 'passes' },
        { from: 'inputs', to: 'tovalue', label: 'normalised' },
        { from: 'tovalue', to: 'outputs', label: 'derived (computed)' },
        { from: 'state', to: 'outputs', label: 'readonly()' },
        { from: 'outputs', to: 'caller', label: 'destructured', dashed: true },
      ],
      steps: [
        { focus: ['caller'], text: 'The caller hands over what it has: an array, a ref, or a getter like `() => props.items`. It should not have to adapt its data to the composable.' },
        { focus: ['inputs', 'tovalue'], edges: ['caller->inputs', 'inputs->tovalue'], text: 'Inputs are read with `toValue()` **inside** `computed`/`watch`. Reading them there (not once at the top) is what makes the composable react when they change.' },
        { focus: ['state'], text: 'Internal state is created inside the function, so every caller gets its own. It is private: no one outside can assign it directly.' },
        { focus: ['outputs'], edges: ['tovalue->outputs', 'state->outputs'], text: 'The public API is a plain object: derived `computed`s, `readonly()` state and actions (`goTo`, `next`). The actions are the only doors that change state, so the rules always hold.' },
        { focus: ['caller', 'outputs'], edges: ['outputs->caller'], text: 'The caller destructures what it needs and can rename freely. Everything is explicit — the opposite of a mixin injecting properties into `this`.' },
      ],
    },
    caption: 'Flexible in, safe out, private in between.',
    alt: 'A diagram: the Caller passes inputs (value, ref or getter) which are normalised with toValue inside computed or watch; private state (a page ref) and the derived values flow into a Public API box (readonly page, computeds, actions), which is destructured back by the caller.',
  },

  internals: {
    beginner: `
Two ideas carry this whole lesson. First, a composable only "sees" changes to things it reads *inside* a computed or watcher — so it must receive refs or getters, not frozen values. Second, whatever you return is a promise to every caller; keep it small and protect the state that has rules.
`,
    technical: [
      `
**Why \`toValue\` must run inside a reactive context.** Dependency tracking records which reactive sources are read *while an effect runs*. \`toValue(source)\` at the top of the composable reads once, during setup, outside any effect — nothing is tracked. Inside \`computed(() => toValue(source))\`, the read happens while the computed's effect runs, so the ref (or whatever the getter touches, e.g. \`props.id\`) becomes a dependency. A getter like \`() => props.id\` works because calling it reads the reactive \`props\` object inside that effect.

**What \`readonly()\` does to a ref.** \`readonly(ref)\` returns a proxy whose \`value\` getter passes through (so templates still unwrap it and effects still track it) but whose setter refuses the write and warns in development. The original ref stays writable inside the composable's closure.

**Testing: why some composables need a host component.** A composable that uses only reactivity (\`ref\`, \`computed\`, \`watch\`) can be called directly in a test, ideally inside an \`effectScope()\` you stop afterwards so its watchers don't leak between tests. A composable that uses lifecycle hooks (\`onMounted\`) or \`inject()\` needs a *current component instance* — so tests mount a tiny host component and call the composable in its \`setup\`. The Vue docs call this helper \`withSetup\`:
`,
      {
        code: `// test-utils.js
import { createApp } from 'vue'

export function withSetup(composable) {
  let result
  const app = createApp({
    setup() {
      result = composable()
      return () => {}          // render nothing
    },
  })
  app.mount(document.createElement('div'))
  return [result, app]         // app.unmount() triggers onUnmounted cleanup
}`,
        lang: 'js',
        title: 'the withSetup helper (from the Vue testing guide)',
        static: true,
      },
      {
        code: `// usePagination.test.js (Vitest)
import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { withSetup } from './test-utils'
import { usePagination } from '../composables/usePagination'

describe('usePagination', () => {
  it('clamps the page when the list shrinks', async () => {
    const items = ref(Array.from({ length: 30 }, (_, i) => i))
    const [pager, app] = withSetup(() => usePagination(items, { pageSize: 10 }))

    pager.goTo(3)
    expect(pager.page.value).toBe(3)

    items.value = items.value.slice(0, 12)   // now only 2 pages
    await nextTick()                           // let the watcher run
    expect(pager.page.value).toBe(2)

    app.unmount()
  })
})`,
        lang: 'js',
        title: 'a composable unit test',
        static: true,
      },
      `
For time-based composables (debounce, polling), Vitest's fake timers (\`vi.useFakeTimers()\` then \`vi.advanceTimersByTime(ms)\`) avoid real waiting. Remember that \`watch\` callbacks are flushed asynchronously, so \`await nextTick()\` after changing a source *before* advancing timers. For composables that \`inject()\` something, call \`app.provide(key, value)\` on the host app before mounting. More in [Testing computed, watchers, composables & stores](lesson:testing-logic).
`,
    ],
    production: `
- **Design for the call site.** Write the usage first (\`const { page, next } = usePagination(results, { pageSize })\`), then implement. If the call reads awkwardly, the API is wrong.
- **Stable public API, private internals.** Return only what callers need; everything else stays in the closure so you can refactor freely.
- **Know when a composable is the wrong tool.** No reactive state → a plain function. Mostly markup → a component. State shared across distant parts of the app, with devtools, SSR safety and plugins → a [Pinia store](lesson:why-state-management). Dependency supplied by an ancestor → [provide/inject](lesson:provide-inject), often wrapped in a \`useX()\` accessor.
- **Avoid the "god composable".** A 500-line \`useDashboard()\` that fetches, filters, paginates, polls and formats is a component in disguise. Split it into focused composables and let a thin orchestrating composable (or the component) wire them together.
- **Migrating from mixins:** convert one mixin at a time into a composable with explicit inputs; in Options API components you can call it from a \`setup()\` option during the transition ([Options API lesson](lesson:options-api)).
- **Test the contract, not the implementation.** Assert on returned refs and the effects of actions, not on internal variables, so tests survive refactors.
`,
  },

  mistakes: [
    {
      title: 'Passing a prop value instead of a getter',
      wrong: { code: `const props = defineProps({ userId: Number })
const { user } = useUser(props.userId)   // snapshot: 1 forever`, lang: 'js' },
      right: { code: `const props = defineProps({ userId: Number })
const { user } = useUser(() => props.userId)   // re-runs when the prop changes`, lang: 'js' },
      explanation: '`props.userId` is evaluated once and the composable receives a plain number. A getter (or `toRef(props, \'userId\')`) gives it something it can track. Design composables to accept getters so this works.',
    },
    {
      title: 'Reading inputs with toValue() only once',
      wrong: { code: `export function useSearch(items, query) {
  const q = toValue(query)            // read once, at setup
  const results = computed(() => toValue(items).filter((i) => i.name.includes(q)))
  return { results }
}`, lang: 'js' },
      right: { code: `export function useSearch(items, query) {
  const results = computed(() => {
    const q = toValue(query)          // read inside the computed → tracked
    return toValue(items).filter((i) => i.name.includes(q))
  })
  return { results }
}`, lang: 'js' },
      explanation: 'Accepting a ref is pointless if you unwrap it outside a reactive effect. Call `toValue()` inside `computed`/`watch` so the dependency is recorded.',
    },
    {
      title: 'Returning writable internal state that has rules',
      wrong: { code: `return { page, next, prev }   // caller can do page.value = -5`, lang: 'js' },
      right: { code: `return { page: readonly(page), next, prev, goTo }`, lang: 'js' },
      explanation: 'If state has invariants (in range, non-negative, valid status), expose it read-only and offer actions that enforce the rules.',
    },
    {
      title: 'One composable doing everything',
      wrong: { code: `export function useProductPage() {
  // fetches, filters, sorts, paginates, polls, tracks analytics,
  // formats prices and manages the cart drawer… 400 lines
}`, lang: 'js' },
      right: { code: `const { data: products } = useFetch(url)
const { results } = useSearch(products, query)
const { pageItems, next } = usePagination(results, { pageSize: 20 })`, lang: 'js' },
      explanation: 'Small composables with one job are reusable and testable on their own. The component (or a thin orchestrator) composes them through refs.',
    },
  ],

  debugging: [
    {
      symptom: 'A composable ignores changes to a prop or ref you passed in.',
      cause: 'A snapshot was passed (`props.id`), or the composable reads `toValue(input)` once outside any computed/watch.',
      fix: 'Pass a getter (`() => props.id`) or ref, and make the composable call `toValue()` inside its reactive effects.',
    },
    {
      symptom: 'In a test: `onMounted is called when there is no active component instance`.',
      cause: 'The composable uses lifecycle hooks but was called directly in the test.',
      fix: 'Run it inside a host component with a `withSetup` helper, and call `app.unmount()` to exercise cleanup.',
    },
    {
      symptom: 'Tests pass alone but fail together — state leaks from one test to the next.',
      cause: 'Module-level shared state in the composable persists across tests in the same file, or watchers from a previous test are still running.',
      fix: 'Expose a reset function or create the state per app (store/provide); unmount the host app or stop the `effectScope` after each test.',
    },
    {
      symptom: 'An async composable test sees old values.',
      cause: 'Watchers and DOM updates are flushed asynchronously; the assertion ran before they did.',
      fix: '`await nextTick()` after changing a source; with fake timers, advance timers *after* the watcher has run.',
    },
    {
      symptom: '`[Vue warn] Set operation on key "value" failed: target is readonly`.',
      cause: 'A caller tried to assign to state the composable exposes through `readonly()`.',
      fix: 'Use the composable\'s action (`goTo`, `set`) instead — or, if the caller legitimately needs to write, reconsider the API.',
    },
  ],

  bestPractices: [
    'Accept values, refs and getters; read them with `toValue()` (3.3+) inside `computed`/`watch`.',
    'Use positional parameters for required inputs and one options object with defaults for the rest.',
    'Return a plain object of refs; wrap rule-bound state in `readonly()` and expose actions to change it.',
    'Give each composable one responsibility and compose them through refs.',
    'Keep side effects out of module scope; start them when called and clean them up.',
    'Document the calling contract: synchronous in setup (or after top-level `await` in `<script setup>`).',
    'Unit-test composables directly: `effectScope` for pure reactivity, a `withSetup` host component for hooks and `inject`.',
    'Prefer a Pinia store for app-wide shared state and plain functions for stateless logic.',
  ],

  useCases: [
    'Turning a group of related mixins in a legacy codebase into explicit, typed composables.',
    'Building a team library of composables (`usePagination`, `useSearch`, `useForm`) with a consistent API style.',
    'Splitting a giant component into focused composables that can be tested separately.',
    'Wrapping a third-party library (a chart, a map, a socket client) behind a small composable API so the rest of the app doesn\'t depend on it directly.',
  ],

  whenToUse: {
    use: [
      'Logic is reused, or a component mixes several concerns that deserve names of their own.',
      'You want to unit-test logic without rendering UI.',
      'You are migrating Options API mixins to the Composition API.',
    ],
    avoid: [
      'The logic is used once and is short — extracting it only adds a file to jump to.',
      'You need app-wide shared state with devtools/SSR support — use Pinia.',
      'The reusable thing is markup or layout — use a component or slots.',
    ],
  },

  comparison: {
    title: 'Ways to reuse logic in Vue',
    headers: ['', 'Composable', 'Mixin (Options API)', 'Renderless component', 'Pinia store'],
    rows: [
      ['Where values come from', 'explicit: destructured from a call', 'implicit: merged into `this`', 'explicit: slot props', 'explicit: `useStore()`'],
      ['Name collisions', 'rename on destructure', 'resolved by merge rules', 'rename in slot destructure', 'store id must be unique'],
      ['Reactive parameters', 'yes — arguments (refs/getters)', 'no — reads `this` by convention', 'via props', 'via action arguments'],
      ['Extra component instance', 'no', 'no', 'yes', 'no'],
      ['State scope', 'per call (or module-level shared)', 'per component', 'per instance', 'one per app'],
      ['Status in Vue 3', 'recommended', 'supported, not recommended', 'fine when you also need to render', 'official state library'],
    ],
    note: 'The Vue docs recommend composables over mixins for logic reuse in Vue 3, and renderless components only when you need to reuse both logic *and* visual layout.',
  },

  quiz: [
    {
      id: 'composable-design-q1',
      type: 'mcq',
      prompt: 'Select **all** the mixin problems that composables solve.',
      options: [
        { text: 'It is unclear which mixin a property on `this` came from.' },
        { text: 'Two mixins can define the same property name and collide.' },
        { text: 'Mixins communicate implicitly through shared `this` properties.' },
        { text: 'Mixins cannot use lifecycle hooks.', why: 'They can — `created`, `mounted` etc. in a mixin are merged and all run.' },
        { text: 'Composables are always faster at runtime.', why: 'There is no general speed claim; the benefits are clarity, flexibility and composition.' },
      ],
      answer: [0, 1, 2],
      explanation: 'These are exactly the three drawbacks the Vue docs list: unclear source of properties, namespace collisions and implicit cross-mixin communication.',
    },
    {
      id: 'composable-design-q2',
      type: 'output',
      prompt: '`useUser` watches `toValue(id)` and fetches the user. The parent changes the `userId` prop from **1** to **2**. Which user does this component end up showing?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { useUser } from './useUser.js'
const props = defineProps({ userId: Number })
const { user } = useUser(props.userId)
</script>

<template>{{ user?.name }}</template>`,
      },
      options: [
        { text: 'User 2', why: 'The composable received the number 1, not something reactive, so it has nothing to watch.' },
        { text: 'User 1 — the composable never sees the change' },
        { text: 'Nothing — it throws because props are readonly', why: 'Reading a prop is fine; the problem is that only its current value was passed.' },
      ],
      answer: 1,
      explanation: '`props.userId` is evaluated once during setup. Pass `() => props.userId` so `toValue()` inside the watcher reads the prop reactively.',
    },
    {
      id: 'composable-design-q3',
      type: 'bug',
      prompt: 'Selecting a user works the first time but behaves strangely afterwards (warnings, stale data, nothing cleaned up). Click the line with the design mistake.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
import { useFetch } from './useFetch.js'

const selectedId = ref(null)
let user = null

function select(id) {
  selectedId.value = id
  user = useFetch('/api/users/' + id)
}
</script>`,
      },
      answerLine: 10,
      explanation: 'The composable is called inside an event handler, after setup — its watchers and hooks are not bound to the component, and each click creates another instance. Call it once at the top level with a reactive input: `const { data: user } = useFetch(() => selectedId.value && \'/api/users/\' + selectedId.value)`.',
    },
    {
      id: 'composable-design-q4',
      type: 'fill',
      prompt: 'Complete `useTitle` so it accepts `\'Home\'`, `ref(\'Home\')` or `() => route.name`, and expose the counter state so callers cannot write it.',
      code: {
        lang: 'js',
        code: `export function useTitle(title) {
  watchEffect(() => {
    document.title = ___(title)
  })
}

export function useClicks() {
  const count = ref(0)
  const click = () => count.value++
  return { count: ___(count), click }
}`,
      },
      answer: [['toValue'], ['readonly']],
      explanation: '`toValue()` (3.3+) normalises value/ref/getter and, inside `watchEffect`, tracks it. `readonly()` exposes the ref for reading only.',
    },
    {
      id: 'composable-design-q5',
      type: 'mcq',
      prompt: 'You need to unit-test a composable that registers `onMounted` and `onUnmounted` hooks. What is the right approach?',
      options: [
        { text: 'Call it inside a tiny host component (a `withSetup` helper), assert on the result, then `app.unmount()` to check cleanup.' },
        { text: 'Call it directly in the test file.', why: 'Without a component instance the hooks never register (Vue warns), so mount/unmount behaviour is untested.' },
        { text: 'Run it inside `effectScope()` and stop the scope.', why: '`effectScope` collects effects and runs `onScopeDispose`, but it is not a component — `onMounted`/`onUnmounted` still need an instance.' },
        { text: 'Only test it through the full page component with end-to-end tests.', why: 'That works but is slow and makes failures hard to locate; a focused unit test is cheaper.' },
      ],
      answer: 0,
      explanation: 'Lifecycle hooks need a component instance. The `withSetup` pattern from the Vue testing guide provides one and gives you the app to unmount.',
    },
    {
      id: 'composable-design-q6',
      type: 'mcq',
      prompt: 'A `useCart()` composable keeps the cart in module-level refs. The app now needs devtools inspection, SSR and persistence plugins. What is the most sensible move?',
      options: [
        { text: 'Move the state into a Pinia store and keep `useCart()` as a thin wrapper or replace it with the store.' },
        { text: 'Keep module-level refs and add `window.cart = cart` for debugging.', why: 'Globals don\'t solve SSR request isolation and leak implementation details.' },
        { text: 'Convert it to a mixin so every component gets the cart.', why: 'Mixins are the pattern composables replaced; they add implicit coupling.' },
        { text: 'Create the refs inside the function so each component has its own cart.', why: 'Then components no longer share one cart — the opposite of what a cart needs.' },
      ],
      answer: 0,
      explanation: 'App-wide shared state with devtools, SSR safety and plugins is exactly what Pinia is for.',
    },
    {
      id: 'composable-design-q7',
      type: 'short',
      prompt: 'In a few sentences: how would you split a 400-line `useDashboard()` composable?',
      answer: 'List its responsibilities (fetching, filtering, pagination, polling, formatting) and extract each into a focused composable or plain function with explicit inputs and outputs. Connect them through refs — the output of `useFetch` feeds `useSearch`, which feeds `usePagination`. Keep a thin orchestrating composable or let the component wire them, test each piece in isolation, and move any app-wide shared state into a store.',
    },
  ],

  exercises: [
    {
      id: 'design-use-undo-redo',
      title: 'Design useUndoRedo() with a safe API',
      difficulty: 'advanced',
      prompt: `
Implement \`useUndoRedo(initial, options)\` in \`useUndoRedo.js\`. It tracks a value with history.

**API to return:**

- \`state\` — the current value, exposed with \`readonly()\` (callers must not assign it),
- \`set(value)\` — makes \`value\` current; the previous value goes onto the undo history and the redo history is cleared,
- \`undo()\` / \`redo()\` — move back/forward; do nothing when there is nothing to undo/redo,
- \`canUndo\`, \`canRedo\` — computed booleans,
- \`options.capacity\` (default \`10\`) — the maximum number of undo steps kept; when exceeded, drop the **oldest**.

\`App.vue\` is a colour picker using it: buttons \`.red\`, \`.blue\`, \`.green\` call \`set\`, \`.undo\` / \`.redo\` buttons, and the current colour in \`.current\`.
`,
      files: {
        'useUndoRedo.js': `import { ref, computed, readonly } from 'vue'

export function useUndoRedo(initial, options = {}) {
  const { capacity = 10 } = options
  const state = ref(initial)

  // TODO: past/future history, set, undo, redo, canUndo, canRedo
  function set(value) {
    state.value = value
  }
  function undo() {}
  function redo() {}

  return { state, set, undo, redo, canUndo: computed(() => false), canRedo: computed(() => false) }
}`,
        'App.vue': `<script setup>
import { useUndoRedo } from './useUndoRedo.js'

const { state: color, set, undo, redo, canUndo, canRedo } = useUndoRedo('white')
</script>

<template>
  <p class="current">{{ color }}</p>
  <button class="red" @click="set('red')">Red</button>
  <button class="blue" @click="set('blue')">Blue</button>
  <button class="green" @click="set('green')">Green</button>
  <button class="undo" :disabled="!canUndo" @click="undo">Undo</button>
  <button class="redo" :disabled="!canRedo" @click="redo">Redo</button>
</template>`,
      },
      hints: [
        'Keep two private refs (or plain arrays inside refs): `past` and `future`. `canUndo` is `computed(() => past.value.length > 0)`.',
        '`set(v)`: push the current value onto `past`, trim `past` to `capacity` with `shift()` if it is too long, assign `state.value = v`, and reset `future.value = []`. `undo()`: if `past` is empty return; otherwise push the current value onto `future` and pop `past` into `state`.',
        'Return `state: readonly(state)`, and make `redo()` mirror `undo()` with the arrays swapped.',
      ],
      solution: {
        explanation: 'History lives in private refs; only `set`, `undo` and `redo` can change anything, and `state` is exposed read-only, so the "redo is cleared after a new change" and "capacity" rules can never be bypassed. Options with defaults keep the call site short (`useUndoRedo(\'white\')`) while allowing `{ capacity: 50 }`.',
        files: {
          'useUndoRedo.js': `import { ref, computed, readonly } from 'vue'

export function useUndoRedo(initial, options = {}) {
  const { capacity = 10 } = options
  const state = ref(initial)
  const past = ref([])
  const future = ref([])

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function set(value) {
    past.value.push(state.value)
    if (past.value.length > capacity) past.value.shift()
    state.value = value
    future.value = []
  }

  function undo() {
    if (!canUndo.value) return
    future.value.push(state.value)
    state.value = past.value.pop()
  }

  function redo() {
    if (!canRedo.value) return
    past.value.push(state.value)
    state.value = future.value.pop()
  }

  return { state: readonly(state), set, undo, redo, canUndo, canRedo }
}`,
          'App.vue': `<script setup>
import { useUndoRedo } from './useUndoRedo.js'

const { state: color, set, undo, redo, canUndo, canRedo } = useUndoRedo('white')
</script>

<template>
  <p class="current">{{ color }}</p>
  <button class="red" @click="set('red')">Red</button>
  <button class="blue" @click="set('blue')">Blue</button>
  <button class="green" @click="set('green')">Green</button>
  <button class="undo" :disabled="!canUndo" @click="undo">Undo</button>
  <button class="redo" :disabled="!canRedo" @click="redo">Redo</button>
</template>`,
        },
      },
      tests: [
        {
          name: 'starts with the initial value and nothing to undo/redo',
          code: `const { useUndoRedo } = requireModule('useUndoRedo.js')
const h = withSetup(() => useUndoRedo('a'))
expect(h.state.value).toBe('a')
expect(h.canUndo.value).toBe(false)
expect(h.canRedo.value).toBe(false)`,
        },
        {
          name: 'set, undo and redo move through history',
          code: `const { useUndoRedo } = requireModule('useUndoRedo.js')
const h = withSetup(() => useUndoRedo('a'))
h.set('b')
h.set('c')
expect(h.canUndo.value).toBe(true)
h.undo()
expect(h.state.value).toBe('b')
expect(h.canRedo.value).toBe(true)
h.undo()
expect(h.state.value).toBe('a')
h.undo()
expect(h.state.value).toBe('a')
h.redo()
expect(h.state.value).toBe('b')`,
        },
        {
          name: 'a new set() clears the redo history',
          code: `const { useUndoRedo } = requireModule('useUndoRedo.js')
const h = withSetup(() => useUndoRedo(1))
h.set(2)
h.undo()
expect(h.canRedo.value).toBe(true)
h.set(3)
expect(h.canRedo.value).toBe(false)
h.redo()
expect(h.state.value).toBe(3)`,
        },
        {
          name: 'capacity drops the oldest entries',
          code: `const { useUndoRedo } = requireModule('useUndoRedo.js')
const h = withSetup(() => useUndoRedo('x', { capacity: 2 }))
h.set('a')
h.set('b')
h.set('c')
h.undo()
h.undo()
expect(h.state.value).toBe('a')
expect(h.canUndo.value).toBe(false)`,
        },
        {
          name: 'state is exposed readonly',
          code: `const { isReadonly } = requireModule('vue')
const { useUndoRedo } = requireModule('useUndoRedo.js')
const h = withSetup(() => useUndoRedo('a'))
expect(isReadonly(h.state)).toBe(true)`,
        },
        {
          name: 'the colour picker undoes and redoes',
          code: `await click('.red')
await click('.blue')
expect(text('.current')).toBe('blue')
await click('.undo')
expect(text('.current')).toBe('red')
await click('.redo')
expect(text('.current')).toBe('blue')`,
        },
      ],
    },
    {
      id: 'mixin-to-composable',
      title: 'Migrate a mixin to a composable',
      difficulty: 'advanced',
      prompt: `
\`App.vue\` uses an old Options API mixin (\`searchMixin.js\`) that filters \`this.items\` by \`this.query\`. It has the classic mixin problems: it silently depends on \`this.items\`, it only searches names, and readers can't tell where \`filtered\` comes from.

1. Implement \`useFilter(items, query, options)\` in \`useFilter.js\`:
   - \`items\` and \`query\` may each be a **plain value, a ref or a getter** — read them with \`toValue()\` inside a computed;
   - \`options.keys\` (default \`['name']\`) lists the fields to search;
   - matching is **case-insensitive** and ignores surrounding spaces; an empty query returns all items;
   - return \`{ filtered, count }\` — \`filtered\` is a computed array, \`count\` a computed number.
2. Rewrite \`App.vue\` with \`<script setup>\` using \`useFilter\`, searching **both \`name\` and \`team\`**. Keep the markup: input \`.query\`, items \`li.item\`, total in \`.count\`. Remove the mixin.
`,
      files: {
        'searchMixin.js': `// Legacy Options API mixin
export default {
  data() {
    return { query: '' }
  },
  computed: {
    filtered() {
      // implicit contract: the component must define this.items
      return this.items.filter((item) => item.name.includes(this.query))
    },
  },
}`,
        'useFilter.js': `import { computed, toValue } from 'vue'

// TODO: implement useFilter(items, query, options)
export function useFilter(items, query, options = {}) {
  return {}
}`,
        'people.js': `export const people = [
  { id: 1, name: 'Ada', team: 'Platform' },
  { id: 2, name: 'Grace', team: 'Compilers' },
  { id: 3, name: 'Linus', team: 'Kernel' },
  { id: 4, name: 'Margaret', team: 'Apollo' },
  { id: 5, name: 'Alan', team: 'Platform' },
]`,
        'App.vue': `<script>
import searchMixin from './searchMixin.js'
import { people } from './people.js'

export default {
  mixins: [searchMixin],
  data() {
    return { items: people }
  },
}
</script>

<template>
  <input class="query" v-model="query" placeholder="Search name or team…" />
  <p class="count">{{ filtered.length }} people</p>
  <ul>
    <li v-for="p in filtered" :key="p.id" class="item">{{ p.name }} — {{ p.team }}</li>
  </ul>
</template>`,
      },
      hints: [
        'Start with `const filtered = computed(() => { const q = String(toValue(query) ?? \'\').trim().toLowerCase(); … })` and `const count = computed(() => filtered.value.length)`.',
        'Filter with `keys.some((key) => String(item[key]).toLowerCase().includes(q))`, returning the full list when `q` is empty.',
        'In `App.vue`: `<script setup>` with `const query = ref(\'\')` and `const { filtered, count } = useFilter(people, query, { keys: [\'name\', \'team\'] })`. Use `{{ count }}` in the template.',
      ],
      solution: {
        explanation: 'Every dependency the mixin took implicitly from `this` is now an explicit argument, so the composable works with any list — a constant, a ref or a prop getter — and the component shows exactly where `filtered` and `count` come from. Reading inputs with `toValue()` inside the computed keeps it reactive to all three input forms.',
        files: {
          'searchMixin.js': `// Legacy Options API mixin (no longer used)
export default {
  data() {
    return { query: '' }
  },
  computed: {
    filtered() {
      return this.items.filter((item) => item.name.includes(this.query))
    },
  },
}`,
          'useFilter.js': `import { computed, toValue } from 'vue'

export function useFilter(items, query, options = {}) {
  const { keys = ['name'] } = options

  const filtered = computed(() => {
    const q = String(toValue(query) ?? '').trim().toLowerCase()
    const list = toValue(items)
    if (!q) return list
    return list.filter((item) =>
      keys.some((key) => String(item[key]).toLowerCase().includes(q))
    )
  })

  const count = computed(() => filtered.value.length)

  return { filtered, count }
}`,
          'people.js': `export const people = [
  { id: 1, name: 'Ada', team: 'Platform' },
  { id: 2, name: 'Grace', team: 'Compilers' },
  { id: 3, name: 'Linus', team: 'Kernel' },
  { id: 4, name: 'Margaret', team: 'Apollo' },
  { id: 5, name: 'Alan', team: 'Platform' },
]`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { people } from './people.js'
import { useFilter } from './useFilter.js'

const query = ref('')
const { filtered, count } = useFilter(people, query, { keys: ['name', 'team'] })
</script>

<template>
  <input class="query" v-model="query" placeholder="Search name or team…" />
  <p class="count">{{ count }} people</p>
  <ul>
    <li v-for="p in filtered" :key="p.id" class="item">{{ p.name }} — {{ p.team }}</li>
  </ul>
</template>`,
        },
      },
      tests: [
        {
          name: 'useFilter works with plain values',
          code: `const { useFilter } = requireModule('useFilter.js')
const r = withSetup(() => useFilter([{ name: 'Ada' }, { name: 'Bob' }], 'ad'))
expect(r.filtered.value).toHaveLength(1)
expect(r.count.value).toBe(1)`,
        },
        {
          name: 'reacts to a query ref, case-insensitively and trimmed',
          code: `const { ref } = requireModule('vue')
const { useFilter } = requireModule('useFilter.js')
const q = ref('')
const r = withSetup(() => useFilter([{ name: 'Ada' }, { name: 'Alan' }, { name: 'Bob' }], q))
expect(r.count.value).toBe(3)
q.value = '  AL '
expect(r.count.value).toBe(1)
expect(r.filtered.value[0].name).toBe('Alan')`,
        },
        {
          name: 'accepts a getter for items and searches the given keys',
          code: `const { ref } = requireModule('vue')
const { useFilter } = requireModule('useFilter.js')
const list = ref([{ name: 'Ada', team: 'Core' }])
const r = withSetup(() => useFilter(() => list.value, 'core', { keys: ['name', 'team'] }))
expect(r.count.value).toBe(1)
list.value = [...list.value, { name: 'Eve', team: 'Core' }]
expect(r.count.value).toBe(2)`,
        },
        {
          name: 'the app searches by team too',
          code: `await type('.query', 'platform')
expect(findAll('.item')).toHaveLength(2)
expect(text('.count')).toContain('2')`,
        },
        {
          name: 'the app search is case-insensitive',
          code: `await type('.query', 'GRACE')
expect(findAll('.item')).toHaveLength(1)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'composable-design-vs-mixins',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare composables and mixins. Why does Vue 3 recommend composables for logic reuse?',
      answer: 'Mixins merge options into the component, so properties appear on `this` from unknown sources, different mixins can collide on names, and mixins often depend on each other implicitly through shared `this` properties. Composables are plain functions: inputs are explicit arguments (which can be reactive), outputs are destructured — and renameable — at the call site, and composables can call each other like normal functions.',
      explanation: 'The Vue docs list three mixin drawbacks: unclear source of properties, namespace collisions, and implicit cross-mixin communication. Composables address all three by making data flow explicit.',
      code: {
        lang: 'js',
        code: `// mixin: where does page come from? what if two mixins define it?
export default { mixins: [searchMixin, paginationMixin] }

// composables: explicit, renameable, composable
const { results } = useSearch(items, query)
const { page: resultsPage, next } = usePagination(results)`,
      },
      whyAsked: 'A classic question for Vue 3 roles and especially for teams migrating Vue 2 codebases.',
      mistakes: ['Saying mixins are removed in Vue 3 (they are still supported in the Options API).', 'Claiming composables are faster without evidence.', 'Not naming concrete problems like collisions or implicit dependencies.'],
      followUps: ['How would you migrate a mixin used by 30 components?', 'Can an Options API component use a composable?', 'When would a renderless component still make sense?'],
      modelAnswer: 'Mixins work by merging options into the component, which causes three problems the Vue docs call out: you can\'t tell which mixin a `this` property came from, two mixins can define the same name and collide, and mixins end up communicating implicitly through shared properties. Composables are just functions — inputs are explicit arguments that can be refs or getters, outputs are destructured and can be renamed, and composables compose by calling each other. Mixins are still supported in Vue 3\'s Options API, but for new code composables are the recommended way to reuse logic. When migrating, I convert one mixin at a time and can call the composable from a `setup()` option in Options API components.',
    },
    {
      id: 'composable-design-testing',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'How do you unit-test a composable? Does it matter what the composable uses internally?',
      answer: 'Yes. If it only uses reactivity APIs (`ref`, `computed`, `watch`), call it directly — preferably inside an `effectScope()` you stop after the test — and assert on returned refs. If it uses lifecycle hooks or `inject()`, it needs a component instance: mount a tiny host component (a `withSetup` helper), call the composable in its `setup`, provide any injected values on the app, and unmount to verify cleanup. Await `nextTick()` for watcher effects and use fake timers for time-based logic.',
      explanation: 'The key question is "does it need a current component instance?" Hooks and inject do; pure reactivity doesn\'t.',
      whyAsked: 'Testing composables is a daily task in Vue 3 codebases; the answer reveals whether you understand the component-instance requirement.',
      mistakes: ['Always testing composables through full page components.', 'Calling hook-based composables directly and ignoring the warning.', 'Forgetting to unmount/stop, leaking watchers between tests.'],
      followUps: ['How do you test a composable that calls `inject()`?', 'How do you test a debounced composable without waiting real time?', 'What would you assert for a fetch composable?'],
      modelAnswer: 'I first check what the composable relies on. Pure reactivity composables I call directly inside an `effectScope`, assert on the returned refs, and stop the scope afterwards. If it uses `onMounted`, `onUnmounted` or `inject`, it needs a component instance, so I use the `withSetup` pattern from the Vue testing guide: create an app whose `setup` calls the composable, mount it on a detached element, return the result and the app. I provide injected dependencies with `app.provide` and call `app.unmount()` to test cleanup. For async behaviour I await `nextTick` or flush promises, and for timers I use Vitest fake timers.',
    },
    {
      id: 'composable-design-with-setup-coding',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Implement the `withSetup(composable)` test helper in `testUtils.js`. It must run the composable inside a real component so lifecycle hooks work, and return `[result, app]`, where `app.unmount()` triggers the composable\'s cleanup. `useTicker.js` (uses `onMounted`/`onUnmounted`) is provided for the tests.',
      starter: {
        files: {
          'testUtils.js': `import { createApp } from 'vue'

export function withSetup(composable) {
  // TODO: run the composable inside a real component's setup()
  const result = composable()
  return [result, { unmount() {} }]
}`,
          'useTicker.js': `import { ref, onMounted, onUnmounted } from 'vue'

export function useTicker(ms = 1000) {
  const ticks = ref(0)
  const mounted = ref(false)
  let id = null
  onMounted(() => {
    mounted.value = true
    id = setInterval(() => ticks.value++, ms)
  })
  onUnmounted(() => clearInterval(id))
  return { ticks, mounted }
}`,
          'App.vue': `<script setup>
import { useTicker } from './useTicker.js'
const { ticks } = useTicker(1000)
</script>

<template>
  <p>Ticks: {{ ticks }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'returns the composable result', code: `const { withSetup } = requireModule('testUtils.js'); const [r] = withSetup(() => 42); expect(r).toBe(42)` },
        { name: 'lifecycle hooks run (onMounted)', code: `const { withSetup } = requireModule('testUtils.js'); const { useTicker } = requireModule('useTicker.js'); const [t, app] = withSetup(() => useTicker(20)); expect(t.mounted.value).toBe(true); await wait(90); expect(t.ticks.value).toBeGreaterThan(1); app.unmount()` },
        { name: 'app.unmount() triggers cleanup', code: `const { withSetup } = requireModule('testUtils.js'); const { useTicker } = requireModule('useTicker.js'); const [t, app] = withSetup(() => useTicker(20)); await wait(50); app.unmount(); const n = t.ticks.value; await wait(80); expect(t.ticks.value).toBe(n)` },
      ],
      hints: ['Create an app from a component object whose `setup()` calls the composable and stores the result in an outer variable.', '`setup` must return a render function (e.g. `() => null`) because the host renders nothing.', 'Mount it on `document.createElement(\'div\')` — it never needs to be in the page — then `return [result, app]`.'],
      answer: 'Create an app with a `setup()` that calls the composable and stores the result, return a no-op render function, mount it on a detached element, and return the result together with the app.',
      solution: {
        files: {
          'testUtils.js': `import { createApp } from 'vue'

export function withSetup(composable) {
  let result
  const app = createApp({
    setup() {
      result = composable()
      return () => null // render nothing
    },
  })
  app.mount(document.createElement('div'))
  return [result, app]
}`,
          'useTicker.js': `import { ref, onMounted, onUnmounted } from 'vue'

export function useTicker(ms = 1000) {
  const ticks = ref(0)
  const mounted = ref(false)
  let id = null
  onMounted(() => {
    mounted.value = true
    id = setInterval(() => ticks.value++, ms)
  })
  onUnmounted(() => clearInterval(id))
  return { ticks, mounted }
}`,
          'App.vue': `<script setup>
import { useTicker } from './useTicker.js'
const { ticks } = useTicker(1000)
</script>

<template>
  <p>Ticks: {{ ticks }}</p>
</template>`,
        },
      },
      explanation: 'Lifecycle hooks register on the component whose `setup` is running. A host app gives the composable that component; mounting runs `onMounted`, and `app.unmount()` runs `onUnmounted`. Returning the app lets each test clean up after itself.',
      whyAsked: 'Shows you understand *why* hook-based composables need a component instance — and can build test tooling, not just use it.',
      mistakes: ['Calling the composable directly (hooks never run).', 'Forgetting to return a render function from `setup`.', 'Not exposing the app, so tests can\'t unmount and leak timers.'],
      followUps: ['How would you extend it to support `inject()`?', 'When can you skip the host component and use `effectScope` instead?'],
      modelAnswer: 'Hooks like `onMounted` attach to the current component instance, so the helper creates one: an app whose `setup` calls the composable and stores its return value in a closure variable, and returns a render function that renders nothing. I mount it on a detached `div` so it never touches the page, and return both the result and the app. Tests then assert on the result and call `app.unmount()` to exercise cleanup. To support `inject`, I\'d accept a `provide` map and call `app.provide` before mounting.',
    },
    {
      id: 'composable-design-snapshot',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A profile component calls `useUser(props.userId)`. When the parent switches to another user, the profile keeps showing the old one. The composable uses `watch(() => toValue(id), load, { immediate: true })`. What is wrong?',
      options: [
        'The composable received a plain number, so its watcher has nothing reactive to track.',
        '`toValue()` does not work with props.',
        '`immediate: true` stops later updates.',
        'Props cannot be used in composables.',
      ],
      correctOption: 0,
      answer: '`props.userId` was evaluated once in setup, passing a plain number. The composable is designed correctly; the call site isn\'t. Pass `() => props.userId` or `toRef(props, \'userId\')` so `toValue()` inside the watcher reads the prop reactively.',
      explanation: 'Reactivity flows through refs, reactive objects and getters that read them — never through copied primitive values.',
      whyAsked: 'This bug is extremely common in real code; recognising it quickly signals solid reactivity understanding.',
      mistakes: ['Rewriting the composable instead of fixing the call site.', 'Adding a manual `watch` on the prop in the component that re-calls the composable.'],
      followUps: ['With Vue 3.5 reactive props destructure, would `const { userId } = defineProps()` followed by `useUser(userId)` work?', 'How do you document this in the composable\'s API?'],
      modelAnswer: 'The composable is fine — it watches `toValue(id)`. The problem is the call: `props.userId` reads the prop once during setup and passes a plain number, so the watcher\'s getter always returns that same number. Passing `() => props.userId` gives the composable a getter that reads the reactive props object inside the watcher, so it re-runs when the prop changes. `toRef(props, \'userId\')` works too. That\'s exactly why composables should accept refs and getters and read them with `toValue` inside their effects.',
    },
    {
      id: 'composable-design-god-composable',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'You inherit a 600-line `useOrdersPage()` composable that fetches orders, filters, sorts, paginates, polls every 30 s, formats currency, and manages a selection for bulk actions. Every change breaks something. How would you restructure it?',
      answer: 'Identify responsibilities and extract each into a focused unit with explicit inputs/outputs: `useFetch`/`useOrders` (data + polling), `useSearch`/`useSort` (derived lists), `usePagination`, `useSelection`, and plain functions for formatting. Compose them through refs in a thin orchestrator or the page component. Move truly shared server state into a store or data-fetching layer. Add unit tests per piece before and during the refactor.',
      explanation: 'Cohesion and explicit data flow make each part understandable and testable; the orchestrator documents how they connect.',
      whyAsked: 'Assesses architectural judgement and refactoring strategy, not just syntax.',
      mistakes: ['Splitting by file length rather than by responsibility.', 'Creating composables that secretly depend on each other through module-level state.', 'Refactoring without tests.'],
      followUps: ['Which pieces would you make plain functions instead of composables?', 'How would you test the polling part?', 'Where would you put the bulk-action API calls?'],
      modelAnswer: 'I\'d list the responsibilities first: fetching and polling, filtering and sorting, pagination, selection, formatting. Each becomes its own unit with explicit inputs and outputs — `useOrders` for data and polling, `useSearch` and `useSort` as derived computeds, `usePagination`, `useSelection`, and plain functions for currency formatting since they have no state. They connect through refs: the orders feed search, search feeds sort, sort feeds pagination. A thin `useOrdersPage` or the component wires them together. I\'d write characterisation tests first, extract one piece at a time, and if order data is shared across pages I\'d move it to a store or data-fetching library.',
    },
    {
      id: 'composable-design-store-or-composable',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'When would you keep logic in a composable, and when would you move it into a Pinia store?',
      answer: 'Composables are ideal for logic whose state is per component or per feature instance (form fields, pagination, a dropdown), or for wrapping browser APIs. A Pinia store fits state that must be shared across distant parts of the app with a single source of truth — and when you want devtools inspection, plugins (e.g. persistence) and SSR-safe per-request instances. They combine well: stores can use composables internally, and components can access a store through a `useX()` composable.',
      explanation: 'The deciding questions: who owns the state, how widely is it shared, and do you need store tooling and SSR safety?',
      whyAsked: 'Distinguishes engineers who choose tools by need from those who put everything in a store (or nothing).',
      mistakes: ['Putting every piece of state into Pinia.', 'Using module-level composable state as an app-wide store in an SSR app.', 'Thinking the two are mutually exclusive.'],
      followUps: ['How does a setup store relate to a composable?', 'Is provide/inject an alternative for "shared within one subtree"?'],
      modelAnswer: 'I keep logic in a composable when its state belongs to one component or feature instance — pagination, a form, a toggle — or when it wraps a browser API. Once state must be shared by distant parts of the app as one source of truth, I move it to a Pinia store: it gives devtools, plugins like persistence, and per-request instances for SSR, which module-level composable state doesn\'t. They work together: a setup store is essentially a composable managed by Pinia, and stores can use composables inside. For state shared only within one subtree, provide/inject is often the lighter option.',
    },
    {
      id: 'composable-design-readonly-state',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A `useStepper(max)` composable returns `{ step, next, prev }` where `next` stops at `max`. QA reports the wizard sometimes shows "Step 7 of 5". Several components call `step.value = …` directly. How do you prevent this class of bug through API design?',
      answer: 'Expose the state with `readonly(step)` and provide actions that enforce the rules (`next`, `prev`, `goTo(n)` with clamping). Then direct writes fail with a dev warning and every change passes through validation. Optionally add an internal watcher that clamps the step if `max` (as a ref/getter) shrinks.',
      explanation: 'Make invalid states unrepresentable from the outside: callers read freely but change only through functions the composable controls.',
      whyAsked: 'Probes encapsulation thinking in a reactive world where any ref can be mutated by default.',
      mistakes: ['Adding validation in every component.', 'Using a watcher to "fix" invalid values after the fact as the only defence.', 'Returning a getter function instead of a ref, which loses template unwrapping ergonomics for no reason.'],
      followUps: ['How does `readonly()` behave in production builds?', 'Would you also accept `max` as a getter? Why?'],
      modelAnswer: 'The composable leaks writable state, so its rule — never past `max` — can be bypassed by any caller. I\'d return `step: readonly(step)` and expose actions: `next`, `prev` and a `goTo(n)` that clamps into range. Callers can still read and render the step, but writes are refused (with a warning in development) and all changes go through the clamping logic. If `max` can change, I\'d accept it as a ref or getter and keep a watcher that pulls the step back into range, so the invariant always holds.',
    },
  ],

  takeaways: [
    'Design composables from the call site: required inputs positional, optional ones in an options object with defaults.',
    'Accept values, refs or getters and read them with `toValue()` (3.3+) inside `computed`/`watch` — snapshots like `props.id` break reactivity.',
    'Return a plain object of refs; expose rule-bound state with `readonly()` and change it only through actions.',
    'Keep each composable to one job and compose them through refs; avoid god composables and module-level side effects.',
    'Composables beat mixins on clarity: explicit inputs and outputs, no hidden `this` properties, no name collisions.',
    'Test pure-reactivity composables directly (in an `effectScope`) and hook/inject-based ones inside a `withSetup` host component.',
  ],
}
