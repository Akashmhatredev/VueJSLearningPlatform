// Lesson: computed() — derived state with caching.
// See CONTENT_GUIDE.md for every field.

const cartApp = `<script setup>
import { ref, computed } from 'vue'

const items = ref([
  { id: 1, name: 'Notebook', price: 4, qty: 2 },
  { id: 2, name: 'Pen pack', price: 3, qty: 1 },
  { id: 3, name: 'Backpack', price: 35, qty: 1 },
])
const note = ref('')

const itemCount = computed(() =>
  items.value.reduce((count, item) => count + item.qty, 0)
)

const subtotal = computed(() => {
  console.log('computing subtotal')
  return items.value.reduce((sum, item) => sum + item.price * item.qty, 0)
})

function add(item) {
  item.qty++
}

function remove(item) {
  if (item.qty > 0) item.qty--
}
</script>

<template>
  <h2>Your cart</h2>
  <ul>
    <li v-for="item in items" :key="item.id" class="item">
      {{ item.name }} — \${{ item.price }} × {{ item.qty }}
      <button class="dec" @click="remove(item)">−</button>
      <button class="inc" @click="add(item)">+</button>
    </li>
  </ul>
  <p class="count">Items: {{ itemCount }}</p>
  <p class="subtotal">Subtotal: \${{ subtotal }}</p>
  <input v-model="note" class="note" placeholder="Gift note (does not change the price)" />
  <p class="preview">Note: {{ note || '—' }}</p>
</template>`

export default {
  id: 'computed',
  title: 'computed(): derived state with caching',
  summary: 'Describe a value as a formula over other state; Vue keeps it up to date and only recalculates it when its inputs change.',
  difficulty: 'beginner',
  minutes: 30,
  prerequisites: ['ref', 'reactive'],
  related: ['watch', 'watch-effect', 'reactivity-utilities', 'how-reactivity-works'],
  tags: ['reactivity', 'computed', 'derived state', 'caching', 'writable computed', 'getter', 'setter', 'computed vs methods', 'computed vs watch'],
  apis: [
    { name: 'computed(getter)', summary: 'Creates a read-only computed ref whose `.value` is the cached result of the getter.' },
    { name: 'computed({ get, set })', summary: 'Creates a writable computed ref: reading runs `get`, assigning runs `set`.' },
    { name: 'computed((previous) => …)', summary: 'Vue 3.4+: the getter receives the previously returned value as its first argument.' },
  ],
  docs: [
    { label: 'Vue Guide — Computed Properties', url: 'https://vuejs.org/guide/essentials/computed.html' },
    { label: 'API — computed()', url: 'https://vuejs.org/api/reactivity-core.html#computed' },
    { label: 'Vue Guide — Reactivity in Depth: computed stability', url: 'https://vuejs.org/guide/extras/reactivity-in-depth.html' },
  ],

  intro: `
\`computed()\` lets you describe a value as a **formula** over other reactive state: "the cart total is the sum of price × quantity". You write the formula once; Vue keeps the result up to date forever.

It is also **lazy and cached**. Vue remembers the last result and only runs your formula again when one of the values it used actually changes. Ask for the total a hundred times in a row and the formula runs once.

Values like this are called **derived state** — state you can work out from other state, so you never store it separately.
`,

  why: `
Imagine a cart where the total lives in its own ref:

\`\`\`js
const items = ref([...])
const total = ref(0)

function add(item) {
  item.qty++
  total.value = recalcTotal()   // remember to do this…
}
function remove(item) {
  item.qty--
  total.value = recalcTotal()   // …and this…
}
// …and in applyCoupon(), clearCart(), loadSavedCart(), …
\`\`\`

Every function that touches the cart must remember to refresh \`total\`. Forget once and the page shows a wrong price — a bug that only appears on one rare path.

You could compute it in the template instead (\`{{ items.reduce(...) }}\`), but then the logic is buried in HTML and re-runs on *every* re-render, even when only an unrelated text box changed.

\`computed()\` fixes both problems. The total is **defined** once from the items, so it can never be out of date, and it is **cached**, so it only recalculates when the items change.
`,

  eli15: `
Think of a spreadsheet. Cell C1 holds the formula \`=A1 + B1\`. You never type the answer into C1 — you type numbers into A1 and B1, and C1 updates itself.

\`computed()\` is a formula cell for your Vue app:

\`\`\`js
const total = computed(() => price.value * quantity.value)
\`\`\`

Change \`price\` or \`quantity\` and \`total\` is right again, automatically.

And like a smart spreadsheet, Vue doesn't redo the maths every time you *look* at the cell. It remembers the answer and only recalculates when A1 or B1 changes. Looking is free; only changes cost work.
`,

  analogy: {
    title: 'The till that keeps a running total',
    body: `
At a supermarket checkout there are two ways to know what you owe.

**The slow cashier** adds up every item in your basket from scratch *every time anyone asks* — when you ask, when the screen refreshes, when the manager walks past. Same basket, same sum, recalculated again and again. That is a **method** called from the template.

**The smart till** keeps a running total. It only recalculates when something is scanned or removed. Ask it for the total a thousand times and it just reads the number off its display. That is a **computed**.

The till never invents prices and never changes your basket — it only *reports* a number derived from what is in it. If you want to change the total, you change the basket, not the display.
`,
    mapping: [
      ['the items in the basket', 'the reactive source state (`items`)'],
      ['the till\'s total display', 'the computed value (`subtotal.value`)'],
      ['scanning or removing an item', 'a dependency changing → the computed is marked stale'],
      ['reading the display again without changes', 'a cache hit — the getter does not run'],
      ['the slow cashier re-adding everything', 'a method called in the template, re-run on every render'],
      ['you can\'t change the total by scribbling on the display', 'computed is read-only by default; change the source instead'],
    ],
  },

  visual: {
    type: 'dependency-tracker',
    props: { preset: 'cart' },
    title: 'Which computeds re-run?',
    caption: 'Edit the cart state and watch which computed values and effects re-run. A computed only recalculates when something it actually read changed — everything else is served from cache.',
    alt: 'A live mini reactivity engine for a shopping cart. Reactive state (item prices and quantities) feeds computed values such as the subtotal and item count, which feed render effects. Editing a piece of state highlights only the computeds and effects that depend on it and shows a re-run counter for each.',
  },

  syntax: [
    `
**Read-only computed.** Pass a *getter* — a function that returns the derived value:
`,
    {
      code: `import { ref, computed } from 'vue'

const items = ref([{ name: 'Pen', price: 3, qty: 2 }])

const subtotal = computed(() =>
  items.value.reduce((sum, item) => sum + item.price * item.qty, 0)
)

console.log(subtotal.value) // 6 — computed refs are read with .value in JS`,
      lang: 'js',
      title: 'a read-only computed',
    },
    `
**The rules:**

1. A computed is a **ref**: read it with \`.value\` in JavaScript, and just \`{{ subtotal }}\` in the template (top-level refs are unwrapped).
2. Its dependencies are **discovered automatically**: whatever reactive state the getter reads while it runs. No dependency list to maintain.
3. The getter should be a **pure calculation**: no API calls, no changing other state, no DOM changes.
4. It is **read-only** by default. Assigning \`subtotal.value = 10\` does nothing except print a warning in development.
5. Only **reactive** sources are tracked. \`Date.now()\`, \`Math.random()\`, \`localStorage\` or a plain \`let\` variable are invisible to Vue.

**Writable computed.** When it makes sense to "write through" a derived value, pass an object with \`get\` and \`set\`. The setter receives the new value and updates the *source* state:
`,
    {
      code: `const firstName = ref('Ada')
const lastName = ref('Lovelace')

const fullName = computed({
  get() {
    return firstName.value + ' ' + lastName.value
  },
  set(newValue) {
    const [first = '', ...rest] = newValue.split(' ')
    firstName.value = first
    lastName.value = rest.join(' ')
  },
})

fullName.value = 'Grace Hopper' // runs set() → firstName = 'Grace', lastName = 'Hopper'`,
      lang: 'js',
      title: 'a writable computed',
    },
    {
      callout: 'version',
      title: 'Previous value (Vue 3.4+)',
      text: 'Since Vue 3.4 the getter receives the value it returned last time: `computed((previous) => …)` (for a writable computed: `get(previous)`). Also since 3.4, a computed only notifies its dependents when its new value is actually different from the old one.',
    },
    {
      code: `const count = ref(2)

// Keep the last value that was ≤ 3 (example from the Vue docs, simplified)
const capped = computed((previous) => {
  if (count.value <= 3) return count.value
  return previous
})`,
      lang: 'js',
      title: 'using the previous value (3.4+)',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: cartApp,
    intro: 'A small cart with two computed values. Step through it — notice that nothing ever *assigns* the subtotal.',
    steps: [
      { lines: [2], text: 'Import `computed` next to `ref`. Both come from `\'vue\'`.' },
      { lines: [4, 8], text: 'The **source of truth**: a ref holding an array of items. Everything else on the screen is derived from it.' },
      { lines: [9], text: 'An unrelated piece of state — a gift note. Typing in it re-renders the component, which lets us prove the caching.' },
      { lines: [11, 13], text: '`itemCount` is a computed: a formula, not a stored number. Its getter reads `items.value` and every `item.qty`, so those become its dependencies.' },
      { lines: [15, 18], text: '`subtotal` multiplies price by quantity. The `console.log` is only there for teaching — it shows you exactly when the getter runs. (Real getters should have no side effects, logging included.)' },
      { lines: [20, 26], text: 'The only functions that change state touch `item.qty`. Neither of them mentions the subtotal or the count — they update automatically.' },
      { lines: [32, 36], text: 'Each `+`/`−` button changes one item\'s quantity. That marks both computeds as stale; they recalculate the next time the template reads them.' },
      { lines: [38, 39], text: 'Computed refs are unwrapped in the template, so it is `{{ subtotal }}`, not `{{ subtotal.value }}`. (The `$` right before `{{` is just a dollar sign in the text.)' },
      { lines: [40, 41], text: 'Typing a note re-renders the component, but `subtotal` reads none of the note — so Vue reuses its cached value and the console stays quiet.' },
    ],
  },

  playground: {
    title: 'Cart with a cached subtotal',
    objective: 'Prove the caching with the console, then add more derived values — without ever storing a total by hand.',
    files: { 'App.vue': cartApp },
    expected: 'A cart with three items, **Items: 4** and **Subtotal: $46**. The console logs `computing subtotal` once on start and once after each `+`/`−` click — but **not** while you type a gift note.',
    experiments: [
      {
        id: 'observe-cache',
        task: 'Open the **Console**. Click **+** on the backpack, then type a few letters in the gift note. Count the `computing subtotal` lines.',
        hint: 'One line per quantity change. Zero lines for typing.',
        explain: 'Typing changes `note`, which re-renders the component — but the subtotal getter never read `note`, so its cached value is still valid. A computed only re-runs when one of *its own* dependencies changes.',
      },
      {
        id: 'shipping',
        task: 'Add two computed values: `shipping` is **5** dollars, but **free (0)** when the subtotal is **50 or more**; `total` is subtotal + shipping. Show it as `<p class="total">Total: ${{ total }}</p>`.',
        hint: '`const shipping = computed(() => (subtotal.value >= 50 ? 0 : 5))` — computeds can read other computeds, with `.value`.',
        tests: [
          {
            name: 'total is 51 at the start (46 + 5 shipping)',
            code: `expect(exists('.total')).toBe(true)
expect(text('.total')).toContain('51')`,
          },
          {
            name: 'reaching 50 makes shipping free',
            code: `await click(findAll('.inc')[0]) // one more notebook: subtotal 50
expect(text('.total')).toContain('50')
expect(text('.total')).not.toContain('55')`,
          },
        ],
        explain: 'A computed can depend on another computed: `total` → `shipping` → `subtotal` → `items`. Vue tracks the whole chain, so one quantity change ripples through exactly the values that depend on it.',
      },
      {
        id: 'empty-state',
        task: 'When every quantity is 0, show `<p class="empty">Your cart is empty</p>` (and hide it otherwise). Drive it from a computed called `isEmpty`.',
        hint: '`const isEmpty = computed(() => itemCount.value === 0)` and `<p v-if="isEmpty" class="empty">…</p>`.',
        tests: [
          {
            name: 'the empty message appears only when nothing is left',
            code: `expect(exists('.empty')).toBe(false)
for (const btn of findAll('.dec')) {
  for (let i = 0; i < 3; i++) await click(btn)
}
expect(exists('.empty')).toBe(true)
expect(text('.empty')).toMatch(/empty/i)`,
          },
        ],
        explain: 'Naming the condition (`isEmpty`) keeps the template readable and the logic testable. Boolean computeds like `isEmpty`, `canSubmit` or `isOverBudget` are some of the most common in real apps.',
      },
      {
        id: 'method-instead',
        task: 'Now break the cache on purpose: turn `subtotal` into a plain **function** (`function subtotal() { … }`) and call it in the template as `{{ subtotal() }}`. Type in the gift note and watch the console. (Undo it afterwards!)',
        hint: 'Keep the `console.log` inside. Remove `computed(() => …)` and use a normal function body; remember to update anything else that read `subtotal.value`.',
        tests: [
          {
            name: 'typing a note now re-runs the subtotal calculation',
            code: `const runs = () => logs.filter((l) => l.includes('computing subtotal')).length
const before = runs()
await type('.note', 'Happy birthday!')
expect(runs()).toBeGreaterThan(before)`,
          },
        ],
        explain: 'A method has no cache: the template calls it again on **every** re-render, even when the cart did not change. For a three-item cart that is harmless; for an expensive calculation over thousands of rows it is wasted work on every keystroke. That is the core difference between computed and methods.',
      },
    ],
  },

  animation: {
    type: 'reactivity',
    props: { preset: 'computed' },
    title: 'Inside a computed',
    caption: 'Step through it: the getter runs and records its dependencies, the result is cached, a dependency changes, the computed is marked stale and notifies its readers, and it recalculates only when read again.',
    alt: 'A step-by-step diagram of a computed value. Reactive state feeds a computed; during the first read the getter runs and Vue records which state it read. The value is cached. When the state changes, the computed is flagged as dirty and the render effect that reads it is triggered. When the render reads the computed again, the getter re-runs, the new value is cached, and the DOM text is patched.',
  },

  internals: {
    beginner: `
A computed is a ref with a memory and a "stale" flag.

The first time someone reads it, Vue runs your getter and writes down every reactive value the getter touched — those are its **dependencies**. It stores the answer.

When one of those dependencies changes, Vue doesn't recalculate right away. It just flips the flag to "stale" and tells everyone who reads the computed (like the component's template) "I may have changed". The next time somebody reads \`.value\`, Vue sees the flag, re-runs the getter once, and stores the new answer.

Nobody reads it? It never runs. That is what **lazy** means.
`,
    technical: [
      `
A computed ref plays **two roles** in the reactivity graph at once:

- it is a **subscriber**: while its getter runs, every reactive read (\`items.value\`, \`item.qty\`) registers the computed as a dependent of that state;
- it is a **dependency**: any effect that reads \`computed.value\` (a render, a watcher, another computed) subscribes to the computed itself.

When a source changes, the computed is marked **dirty** and its own subscribers are notified. It does not re-run its getter until it is read again. Here is the classic design, simplified:
`,
      {
        code: `// A simplified model — not Vue's real source
function computed(getter) {
  let cached
  let dirty = true
  const readers = new Set()

  const runner = createEffect(getter, {
    lazy: true,                 // don't run until someone reads .value
    scheduler() {               // called when a dependency changes
      if (!dirty) {
        dirty = true
        readers.forEach(queue)  // "I may have changed" → re-run my readers
      }
    },
  })

  return {
    get value() {
      if (activeEffect) readers.add(activeEffect) // track who reads me
      if (dirty) {
        cached = runner()       // re-run getter, re-collect dependencies
        dirty = false
      }
      return cached
    },
  }
}`,
        lang: 'js',
        title: 'mental model of a computed',
      },
      `
Two refinements matter in practice:

- **Value stability (Vue 3.4+).** After recomputing, if the new value is the same as the old one (\`Object.is\`), effects that depend on the computed are not re-run. Example: \`const isEven = computed(() => count.value % 2 === 0)\` — going from 2 to 4 leaves \`isEven\` at \`true\`, so nothing that reads \`isEven\` re-renders. A getter that builds a **new object or array every time** never compares equal, so it always counts as "changed".
- **Dynamic dependencies.** Dependencies are re-collected on every run. In \`computed(() => showTax.value ? subtotal.value * 1.2 : subtotal.value)\`, the branch that did not run is not tracked.

> **Note:** The data structures behind this (dirty flags, version counters, linked dependency lists) are implementation details. Vue 3.4 and 3.5 both reworked them for speed and memory without changing the public API. Rely on the documented behaviour — lazy, cached, auto-tracked, read-only by default — not on internal names.
`,
    ],
    production: `
- **Derive, don't sync.** If a value can be calculated from other state, make it a computed. Storing a copy in a second ref and updating it by hand (or with a watcher) is the most common source of "the numbers disagree" bugs.
- **Keep getters pure and cheap to reason about.** No fetching, no mutation, no \`console.log\` left behind. Side effects belong in [watch()](lesson:watch) or event handlers.
- **Never mutate the source inside a getter.** \`items.value.sort()\` sorts the original array in place and can trigger an infinite update loop. Use \`[...items.value].sort()\` or \`items.value.toSorted()\` (ES2023).
- **Treat the result as read-only.** A computed array is a snapshot; pushing into it edits whatever object the getter happened to return and is overwritten on the next recompute.
- **Stability matters for big trees.** A boolean or number computed that rarely changes value shields everything below it from re-running (3.4+). A computed returning a fresh object each time cannot do that — return primitives where you can, or use the previous value (3.4+) to return the old object when nothing meaningful changed.
- **Chains are fine.** \`filtered → sorted → paginated\` as three computeds is idiomatic: each step only recalculates when its own input changes.
- If you use Pinia, store **getters** behave like computeds; that is a Pinia feature built on Vue's \`computed\`, covered in [Pinia basics](lesson:pinia-basics).
`,
  },

  mistakes: [
    {
      title: 'Side effects inside the getter',
      wrong: {
        code: `const results = computed(() => {
  fetch('/api/search?q=' + query.value) // ❌ a request on every recompute
  analytics.track('search')               // ❌ side effect
  return cache.value[query.value] ?? []
})`,
        lang: 'js',
      },
      right: {
        code: `const results = ref([])

watch(query, async (q) => {
  results.value = await searchApi(q)       // ✅ side effects live in a watcher
})`,
        lang: 'js',
      },
      explanation: 'A getter may run at any time Vue decides — or not at all if nobody reads it. Side effects inside it are unpredictable. Computed is for **calculating**; [watch()](lesson:watch) is for **doing**.',
    },
    {
      title: 'Mutating the source while computing',
      wrong: { code: `const sorted = computed(() => items.value.sort((a, b) => a.price - b.price))`, lang: 'js' },
      right: { code: `const sorted = computed(() => [...items.value].sort((a, b) => a.price - b.price))`, lang: 'js' },
      explanation: '`Array.prototype.sort()` sorts **in place**, so the getter changes `items` — the very thing it depends on. That can trigger itself again and also reorders the original list for every other user of `items`. Copy first, or use `toSorted()`.',
    },
    {
      title: 'Assigning to a read-only computed',
      wrong: { code: `const total = computed(() => price.value * qty.value)\n\ntotal.value = 0 // ⚠ warning: computed value is readonly — nothing changes`, lang: 'js' },
      right: { code: `// change the inputs instead\nqty.value = 0\n\n// or, if writing through really makes sense, use { get, set }`, lang: 'js' },
      explanation: 'A computed is a *result*. To change the result, change what it is computed from. Only reach for a writable computed when "setting" the derived value has an obvious meaning (like splitting a full name).',
    },
    {
      title: 'Depending on something Vue cannot see',
      wrong: { code: `const now = computed(() => Date.now())          // never updates\nconst token = computed(() => localStorage.token) // never updates`, lang: 'js' },
      right: { code: `const now = ref(Date.now())\nsetInterval(() => (now.value = Date.now()), 1000)\n\nconst greeting = computed(() => 'Time: ' + new Date(now.value).toLocaleTimeString())`, lang: 'js' },
      explanation: 'Caching only works because Vue knows when inputs change. `Date.now()` and `localStorage` are not reactive, so Vue computes once and never sees a reason to recompute. Put the changing value in a ref and update the ref.',
    },
    {
      title: 'Returning a Promise from a computed',
      wrong: { code: `const user = computed(async () => {\n  return await fetchUser(id.value) // the template gets a Promise, not a user\n})`, lang: 'js' },
      right: { code: `const user = ref(null)\nwatch(id, async (newId) => {\n  user.value = await fetchUser(newId)\n}, { immediate: true })`, lang: 'js' },
      explanation: 'Computed getters must return the value synchronously. An `async` getter returns a Promise object. Load data with a watcher (or a composable) and store the result in a ref.',
    },
  ],

  debugging: [
    {
      symptom: 'A computed never updates even though the data it "uses" clearly changes.',
      cause: 'The getter reads something non-reactive: a plain variable, `Date.now()`, `localStorage`, a property of an object that was never made reactive, or a value captured before the getter ran.',
      fix: 'Make the source reactive (`ref`/`reactive`) and read it **inside** the getter. Use Vue Devtools to inspect which dependencies the computed has.',
    },
    {
      symptom: 'Warning: "Write operation failed: computed value is readonly".',
      cause: 'Code (often a `v-model`) assigns to a computed that only has a getter.',
      fix: 'Change the source state instead, or give the computed a `set` function if writing through is meaningful.',
    },
    {
      symptom: 'A list shown from a computed changes order unexpectedly elsewhere in the app.',
      cause: 'The getter sorted or reversed the **source** array in place.',
      fix: 'Copy before sorting: `[...list.value].sort(...)` or `list.value.toSorted(...)`.',
    },
    {
      symptom: '"Maximum recursive updates exceeded" after adding a computed.',
      cause: 'The getter (or something it calls) writes to reactive state it also reads, so every run triggers another run.',
      fix: 'Remove all writes from the getter. Move the write into an event handler or a watcher.',
    },
  ],

  bestPractices: [
    'If a value can be derived from existing state, make it a computed instead of a second ref you keep in sync.',
    'Keep getters pure: same inputs → same output, no requests, no mutations, no DOM work.',
    'Name computeds after what they mean (`isEmpty`, `visibleTodos`, `formattedPrice`) so templates read like sentences.',
    'Move non-trivial template expressions into computeds — logic in templates is hard to test and re-runs on every render.',
    'Copy before sorting/reversing inside a getter; never mutate the source.',
    'Prefer returning primitives or reused objects from computeds that many things depend on, so value stability (3.4+) can skip work.',
    'Use a writable computed only when "setting the derived value" has a single obvious meaning.',
  ],

  useCases: [
    'Cart subtotal, tax, shipping and grand total derived from the items.',
    'A filtered and sorted list from a search box, filter buttons and a sort dropdown.',
    'Form state flags: `isValid`, `canSubmit`, `hasChanges`.',
    'Formatting for display: `formattedDate`, `initials`, `priceWithCurrency`.',
    'A writable computed that proxies a prop for `v-model` in a child component (get from the prop, set by emitting an event) — see [component v-model](lesson:component-v-model).',
    'Counting things: unread messages, remaining todos, selected rows.',
  ],

  whenToUse: {
    use: [
      'The value is fully determined by other reactive state.',
      'The template would otherwise contain a long or repeated expression.',
      'The calculation is used in several places, or is costly enough that caching helps.',
      'You want a single name for a condition (`isOverBudget`) that several parts of the UI react to.',
    ],
    avoid: [
      'You need to **do** something when data changes (fetch, save, log, focus) — use [watch()](lesson:watch).',
      'The value depends on time, randomness or non-reactive storage — put the changing value in a ref first.',
      'The calculation must be asynchronous — load into a ref with a watcher instead.',
      'It is a value nobody derives — just state the user edits. That is a `ref`, not a computed.',
    ],
  },

  comparison: {
    title: 'computed vs method vs watch vs a stored ref',
    headers: ['', '`computed()`', 'method in template', '`watch()`', 'extra `ref` you update by hand'],
    rows: [
      ['Purpose', 'derive a value', 'derive a value (or handle an event)', 'run a side effect when data changes', 'store a copy of derived data'],
      ['Cached?', '**yes**, until a dependency changes', 'no — runs on every re-render', 'n/a (callback, not a value)', 'yes, but only as fresh as your last manual update'],
      ['Dependencies', 'automatic', 'automatic (through the render)', 'explicit source you pass in', 'whatever you remember to update'],
      ['Returns a value?', 'yes (`.value`)', 'yes', 'no', 'yes'],
      ['Can be async?', 'no', 'not usefully in a template', 'yes', 'yes'],
      ['Arguments?', 'no (return a function if you must)', 'yes', 'gets new/old values', 'n/a'],
      ['Typical example', '`total`, `visibleTodos`', '`formatDate(date)` in a `v-for`', 'save to storage, fetch on id change', '(usually a bug waiting to happen)'],
    ],
    note: 'Rule of thumb: values → `computed`; actions → `watch` or an event handler; per-item formatting that needs an argument → a method. Next: [watch()](lesson:watch).',
  },

  quiz: [
    {
      id: 'computed-q1',
      type: 'mcq',
      prompt: 'What is `computed()` mainly for?',
      options: [
        { text: 'Deriving a value from other reactive state, cached until that state changes.' },
        { text: 'Running code (like an API call) whenever a value changes.', why: 'That is a side effect — the job of `watch()` / `watchEffect()`. Computed getters should not have side effects.' },
        { text: 'Creating a reactive copy of an object that you can edit freely.', why: 'That is closer to `reactive()` or `ref()`. Computed values are read-only by default.' },
        { text: 'Making a function run faster by compiling it.', why: 'Computed does not compile anything; it caches the *result* of a function and re-runs it only when its reactive inputs change.' },
      ],
      answer: 0,
      explanation: 'A computed describes derived state: a value that can be worked out from other state. Vue tracks the getter\'s dependencies and caches the result until one of them changes.',
    },
    {
      id: 'computed-q2',
      type: 'output',
      prompt: 'The component renders, then the user types **3 characters** into the input. How many times is `"computing"` logged **in total**?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, computed } from 'vue'
const price = ref(10)
const search = ref('')
const withTax = computed(() => {
  console.log('computing')
  return price.value * 1.2
})
</script>

<template>
  <input v-model="search" />
  <p>{{ withTax }} — searching "{{ search }}"</p>
</template>`,
      },
      options: [
        { text: '1' },
        { text: '4', why: 'That would be true for a method: one call on mount plus one per re-render. A computed is cached because `search` is not one of its dependencies.' },
        { text: '0', why: 'The template reads `withTax` during the first render, so the getter runs once.' },
        { text: '3', why: 'Typing changes `search`, which the getter never read, so the cache stays valid.' },
      ],
      answer: 0,
      explanation: 'The getter runs once during the first render. Typing re-renders the component, but `withTax` depends only on `price`, so Vue returns the cached value.',
    },
    {
      id: 'computed-q3',
      type: 'bug',
      prompt: 'After this component renders, the **original** `products` list is suddenly sorted everywhere in the app. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `import { ref, computed } from 'vue'

const products = ref([
  { name: 'Lamp', price: 30 },
  { name: 'Mug', price: 8 },
])

const cheapestFirst = computed(() => {
  return products.value.sort((a, b) => a.price - b.price)
})

const count = computed(() => products.value.length)`,
      },
      answerLine: 9,
      explanation: '`sort()` sorts the array **in place**, so the getter mutates its own source. Copy it first: `[...products.value].sort(...)` or `products.value.toSorted(...)`.',
    },
    {
      id: 'computed-q4',
      type: 'fill',
      prompt: 'Fill in the blanks to make a **writable** computed that keeps `celsius` as the source of truth.',
      code: {
        lang: 'js',
        code: `const celsius = ref(20)

const fahrenheit = computed({
  ___() {
    return celsius.value * 9 / 5 + 32
  },
  ___(newValue) {
    celsius.value = (newValue - 32) * 5 / 9
  },
})`,
      },
      answer: [['get'], ['set']],
      explanation: 'A writable computed takes an object with `get` (how to read the derived value) and `set` (how to update the source when someone assigns to it).',
    },
    {
      id: 'computed-q5',
      type: 'mcq',
      prompt: 'Which of these computeds will **never** update after the first render? (Select all that apply.)',
      options: [
        { text: '`computed(() => Date.now())`' },
        { text: '`computed(() => items.value.length)`', why: '`items` is a ref, so reading `items.value.length` is tracked; pushing or removing items updates it.' },
        { text: '`computed(() => localStorage.getItem(\'theme\'))`' },
        { text: '`computed(() => user.name.toUpperCase())` where `user = reactive({ name: \'Ada\' })`', why: '`user` is reactive, so `user.name` is tracked.' },
      ],
      answer: [0, 2],
      explanation: '`Date.now()` and `localStorage` are not reactive, so Vue never learns that they changed. Computeds only re-run when **reactive** dependencies change.',
    },
    {
      id: 'computed-q6',
      type: 'output',
      prompt: 'With Vue 3.4+, `count` goes from **2** to **4**. Does the paragraph re-render?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, computed } from 'vue'
const count = ref(2)
const isEven = computed(() => count.value % 2 === 0)
</script>

<template>
  <p>{{ isEven ? 'even' : 'odd' }}</p>
</template>`,
      },
      options: [
        { text: 'No — `isEven` recomputes to `true` again, which equals its old value, so nothing that depends on it re-runs.' },
        { text: 'Yes — every change to `count` re-renders the component.', why: 'The template reads only `isEven`, not `count`. Since 3.4 a computed only triggers dependents when its value actually changes.' },
        { text: 'No — `isEven` does not recompute at all.', why: 'It does recompute (to find out whether its value changed); it just does not notify its readers because the result is the same.' },
        { text: 'It throws: a computed cannot read another ref.', why: 'Computeds can read any reactive state.' },
      ],
      answer: 0,
      explanation: 'Since Vue 3.4, after recomputing, a computed compares the new value with the old one. `true` → `true` is no change, so the render effect is not re-run.',
    },
    {
      id: 'computed-q7',
      type: 'short',
      prompt: 'In two or three sentences: why is a computed better than a method for a cart total shown in the template?',
      answer: 'A computed is cached: it only recalculates when the cart items it read change, while a method runs again on every re-render, even when an unrelated piece of state (like a text box) changed. It also gives the total a single declarative definition, so it can never be out of sync with the items.',
    },
  ],

  exercises: [
    {
      id: 'todo-filter',
      title: 'Filter buttons for a todo list',
      difficulty: 'beginner',
      prompt: `
The todo list below shows every todo and a hard-coded counter. Make it smart with **computed values**:

- Clicking \`.show-all\`, \`.show-active\` or \`.show-done\` sets \`filter\` (already wired up).
- The list (\`<li class="todo">\`) must show only the todos that match \`filter\`: all, not done, or done.
- \`<p class="remaining">\` shows how many todos are **not** done, as \`"2 left"\`.
- Ticking a checkbox must update both the list and the counter immediately.

Do not store the filtered list or the count in their own refs — derive them.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed } from 'vue'

const todos = ref([
  { id: 1, text: 'Buy milk', done: true },
  { id: 2, text: 'Write essay', done: false },
  { id: 3, text: 'Call grandma', done: false },
  { id: 4, text: 'Fix bike', done: true },
])
const filter = ref('all') // 'all' | 'active' | 'done'

// TODO: visibleTodos and remaining, as computed values
</script>

<template>
  <nav>
    <button class="show-all" @click="filter = 'all'">All</button>
    <button class="show-active" @click="filter = 'active'">Active</button>
    <button class="show-done" @click="filter = 'done'">Done</button>
  </nav>
  <ul>
    <li v-for="todo in todos" :key="todo.id" class="todo">
      <label><input type="checkbox" v-model="todo.done" /> {{ todo.text }}</label>
    </li>
  </ul>
  <p class="remaining">? left</p>
</template>`,
      },
      hints: [
        'You need two computeds: `visibleTodos` (an array) and `remaining` (a number). Loop over `visibleTodos` in the `v-for`.',
        'Inside `visibleTodos`, check `filter.value` and return `todos.value`, `todos.value.filter((t) => !t.done)` or `todos.value.filter((t) => t.done)`.',
        '`const remaining = computed(() => todos.value.filter((t) => !t.done).length)` and show `{{ remaining }} left`.',
      ],
      solution: {
        explanation: 'Both computeds read `todos` (and every `done` flag inside it), and `visibleTodos` also reads `filter`. Clicking a filter button or ticking a checkbox changes one of those dependencies, so exactly the right computeds recalculate. `filter` never changes `remaining`, because `remaining` never read it. `filter()` returns a **new** array, so the original list is never modified.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const todos = ref([
  { id: 1, text: 'Buy milk', done: true },
  { id: 2, text: 'Write essay', done: false },
  { id: 3, text: 'Call grandma', done: false },
  { id: 4, text: 'Fix bike', done: true },
])
const filter = ref('all') // 'all' | 'active' | 'done'

const visibleTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter((t) => !t.done)
  if (filter.value === 'done') return todos.value.filter((t) => t.done)
  return todos.value
})

const remaining = computed(() => todos.value.filter((t) => !t.done).length)
</script>

<template>
  <nav>
    <button class="show-all" @click="filter = 'all'">All</button>
    <button class="show-active" @click="filter = 'active'">Active</button>
    <button class="show-done" @click="filter = 'done'">Done</button>
  </nav>
  <ul>
    <li v-for="todo in visibleTodos" :key="todo.id" class="todo">
      <label><input type="checkbox" v-model="todo.done" /> {{ todo.text }}</label>
    </li>
  </ul>
  <p class="remaining">{{ remaining }} left</p>
</template>`,
        },
      },
      tests: [
        { name: 'shows all 4 todos at first', code: `expect(findAll('.todo')).toHaveLength(4)` },
        {
          name: 'Active shows only unfinished todos',
          code: `await click('.show-active')
expect(findAll('.todo')).toHaveLength(2)
expect(text('ul')).toContain('Write essay')
expect(text('ul')).not.toContain('Buy milk')`,
        },
        {
          name: 'Done shows only finished todos',
          code: `await click('.show-done')
expect(findAll('.todo')).toHaveLength(2)
expect(text('ul')).toContain('Fix bike')
expect(text('ul')).not.toContain('Call grandma')`,
        },
        { name: 'remaining shows "2 left"', code: `expect(text('.remaining')).toBe('2 left')` },
        {
          name: 'ticking a todo updates the list and the counter',
          code: `await click('.show-active')
await check('.todo input', true)
expect(findAll('.todo')).toHaveLength(1)
expect(text('.remaining')).toBe('1 left')`,
        },
      ],
    },
    {
      id: 'full-name',
      title: 'A full-name box that writes back',
      difficulty: 'intermediate',
      prompt: `
The input \`class="full"\` is bound with \`v-model\` to \`fullName\`, but \`fullName\` is a read-only computed, so typing does nothing (check the console for the warning).

Turn \`fullName\` into a **writable computed**:

- Reading it returns \`firstName + ' ' + lastName\` (keep it exactly like that).
- Writing it splits the text on spaces: the first word goes to \`firstName\`, **everything after it** (joined with single spaces) goes to \`lastName\`.
- Typing \`Grace Hopper\` must show \`Grace\` in \`.first\` and \`Hopper\` in \`.last\`.
- Typing a single word like \`Cher\` sets \`firstName\` to \`Cher\` and \`lastName\` to an empty string.
- \`firstName\` and \`lastName\` stay the source of truth: changing them still updates the box.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed } from 'vue'

const firstName = ref('Ada')
const lastName = ref('Lovelace')

// Read-only: typing in the box cannot change anything yet.
const fullName = computed(() => firstName.value + ' ' + lastName.value)
</script>

<template>
  <label>Full name <input v-model="fullName" class="full" /></label>
  <p>First: <span class="first">{{ firstName }}</span></p>
  <p>Last: <span class="last">{{ lastName }}</span></p>
</template>`,
      },
      hints: [
        'Pass an object instead of a function: `computed({ get() { … }, set(newValue) { … } })`.',
        'In `set`, split the text into words: `newValue.trim().split(\' \').filter(Boolean)` removes empty pieces caused by double spaces.',
        'Take the first word with destructuring: `const [first = \'\', ...rest] = words`, then assign `firstName.value = first` and `lastName.value = rest.join(\' \')`.',
      ],
      solution: {
        explanation: '`v-model` on a computed assigns to `fullName.value`, which now runs `set()`. The setter never stores the full name — it updates the two source refs, and the getter derives the box\'s text from them again. Keeping the getter as plain concatenation matters while typing: after "Grace " the getter returns "Grace " (with the space), so the box is not rewritten under the user\'s cursor.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const firstName = ref('Ada')
const lastName = ref('Lovelace')

const fullName = computed({
  get() {
    return firstName.value + ' ' + lastName.value
  },
  set(newValue) {
    const [first = '', ...rest] = newValue.trim().split(' ').filter(Boolean)
    firstName.value = first
    lastName.value = rest.join(' ')
  },
})
</script>

<template>
  <label>Full name <input v-model="fullName" class="full" /></label>
  <p>First: <span class="first">{{ firstName }}</span></p>
  <p>Last: <span class="last">{{ lastName }}</span></p>
</template>`,
        },
      },
      tests: [
        { name: 'the box starts as "Ada Lovelace"', code: `expect(find('.full').value).toBe('Ada Lovelace')` },
        {
          name: 'typing "Grace Hopper" updates first and last name',
          code: `await type('.full', 'Grace Hopper')
expect(text('.first')).toBe('Grace')
expect(text('.last')).toBe('Hopper')`,
        },
        {
          name: 'everything after the first word becomes the last name',
          code: `await type('.full', 'Mary Ann Evans')
expect(text('.first')).toBe('Mary')
expect(text('.last')).toBe('Ann Evans')`,
        },
        {
          name: 'a single word clears the last name',
          code: `await type('.full', 'Cher')
expect(text('.first')).toBe('Cher')
expect(text('.last')).toBe('')`,
        },
        {
          name: 'changing the source refs still updates the box',
          code: `state.firstName = 'Alan'
await nextTick()
expect(find('.full').value).toBe('Alan Lovelace')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'computed-vs-watch-vs-methods',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'What is the difference between a computed property, a method and a watcher in Vue? When do you use each?',
      answer: 'A **computed** derives a value from reactive state and caches it until a dependency changes. A **method** is a plain function: called from the template it re-runs on every re-render, and it can take arguments. A **watcher** does not produce a value — it runs a callback (a side effect such as fetching, saving or logging) when a source changes. Values → computed; actions → watch or event handlers; per-call logic with arguments → method.',
      explanation: 'Ask "am I calculating something, or doing something?" Calculating with no arguments → computed. Calculating with an argument (e.g. formatting each row) → method. Doing something because data changed → watcher.',
      code: {
        lang: 'js',
        code: `const items = ref([])
const query = ref('')

// computed: derived value, cached
const total = computed(() => items.value.reduce((s, i) => s + i.price, 0))

// method: needs an argument, fine to run per call
function formatPrice(n) { return '$' + n.toFixed(2) }

// watch: side effect when something changes
watch(query, async (q) => { items.value = await searchApi(q) })`,
      },
      whyAsked: 'The most common Vue interview question about reactivity. It reveals whether you understand caching, side effects and where logic belongs.',
      mistakes: [
        'Saying computed and methods are "the same but computed is faster" without explaining dependency-based caching.',
        'Using a watcher to keep a second ref in sync with derived data (that is what computed is for).',
        'Putting API calls inside a computed getter.',
        'Forgetting that methods can take arguments and computeds cannot.',
      ],
      followUps: [
        'What happens if a computed reads `Date.now()`?',
        'Can a computed be written to?',
        'How would you pass an argument to a computed-like value?',
        'What is the difference between `watch` and `watchEffect`?',
      ],
      modelAnswer: 'All three run code in response to state, but they have different jobs. A computed is derived state: Vue tracks what the getter reads and caches the result, so it only recalculates when those dependencies change — perfect for totals, filtered lists or flags like `isValid`. A method is just a function; if I call it in the template it runs on every render, which is fine for cheap per-item work that needs an argument, like formatting a price in a `v-for`. A watcher is for side effects: when a source changes I want to *do* something — fetch data, save to storage, focus an input. A common anti-pattern is using a watcher to update a second ref that could simply be a computed.',
      challenge: 'Take a component that uses `watch` to keep a `filteredList` ref in sync with a search query and rewrite it with a computed. What code disappears?',
    },
    {
      id: 'computed-caching-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'This template reads `total` three times and calls `totalFn()` three times. After the first render, how many times has each logged?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, computed } from 'vue'
const items = ref([{ price: 5 }, { price: 7 }])
const total = computed(() => {
  console.log('computed ran')
  return items.value.reduce((s, i) => s + i.price, 0)
})
function totalFn() {
  console.log('method ran')
  return items.value.reduce((s, i) => s + i.price, 0)
}
</script>

<template>
  <p>{{ total }} {{ total }} {{ total }}</p>
  <p>{{ totalFn() }} {{ totalFn() }} {{ totalFn() }}</p>
</template>`,
      },
      options: ['computed 3, method 3', 'computed 1, method 3', 'computed 1, method 1', 'computed 3, method 1'],
      correctOption: 1,
      answer: '**computed ran** once, **method ran** three times. The first read of `total` runs the getter and caches the result; the next two reads hit the cache. Each `totalFn()` call is an ordinary function call.',
      explanation: 'Caching is per computed, not per render: until `items` changes, every read returns the stored value.',
      whyAsked: 'Quickly checks that the candidate actually understands what "cached" means instead of repeating it as a slogan.',
      mistakes: ['Answering "1 and 1" because "Vue optimises the template".', 'Thinking computed runs once per mention in the template.'],
      followUps: ['What changes if `items.value.push({ price: 1 })` runs?', 'When would the method be the better choice?'],
      modelAnswer: 'The computed logs once and the method logs three times. Reading `total` the first time runs the getter and caches the result along with its dependencies; the other two reads return the cached value. A method has no cache, so each call in the template runs the function. If `items` changes, the computed runs once more on the next read, and the method runs three more times on the re-render.',
    },
    {
      id: 'computed-clock-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A dashboard shows "Last updated: N seconds ago" with the code below. It shows 0 forever. Why, and how do you fix it?',
      code: {
        lang: 'js',
        code: `const lastUpdated = ref(Date.now())

const secondsAgo = computed(() =>
  Math.round((Date.now() - lastUpdated.value) / 1000)
)`,
      },
      answer: '`Date.now()` is not reactive, so the only dependency is `lastUpdated`. Time passing changes nothing Vue can see, so the cached value is reused forever. Fix: keep the current time in a ref that a timer updates (`now.value = Date.now()` every second) and compute from `now.value`. Clear the timer in `onUnmounted`.',
      explanation: 'A computed recalculates only when a *reactive* dependency changes. "The clock moved" is not a reactive change unless you put the clock into a ref.',
      whyAsked: 'Tests whether you understand that caching is driven by tracked dependencies, not by time or by re-rendering.',
      mistakes: [
        'Suggesting to call `secondsAgo` as a method — it would update only when something else causes a re-render.',
        'Suggesting `watch(Date.now, …)`.',
        'Forgetting to clear the interval on unmount.',
      ],
      followUps: ['Would turning it into a method fix it?', 'How would you avoid starting one interval per component instance?'],
      modelAnswer: 'The computed only tracks reactive reads, and `Date.now()` isn\'t one — so its only dependency is `lastUpdated`. Until that changes, Vue happily returns the cached 0. The fix is to model time as state: `const now = ref(Date.now())`, update it with `setInterval` every second, and compute from `now.value`. I\'d clear the interval in `onUnmounted`, or put it in a shared `useNow()` composable so many components share one timer.',
    },
    {
      id: 'computed-sort-mutation',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'After adding a "sorted by price" view, users report that the **unsorted** list in another panel is suddenly sorted too, and Vue occasionally warns about recursive updates. What is the likely cause?',
      code: {
        lang: 'js',
        code: `const byPrice = computed(() =>
  products.value.sort((a, b) => a.price - b.price)
)`,
      },
      answer: '`sort()` sorts in place, so the computed mutates `products`, its own dependency. Every component reading `products` sees the new order, and the mutation can re-trigger effects that depend on the array. Copy first: `[...products.value].sort(...)` or `products.value.toSorted(...)`.',
      explanation: 'Computed getters must not modify state — including sneaky in-place array methods: `sort`, `reverse`, `splice`.',
      whyAsked: 'A real production bug that checks knowledge of both JavaScript (mutating vs non-mutating methods) and Vue (pure getters).',
      mistakes: ['Blaming the other panel.', 'Fixing it with a watcher that re-sorts a copy instead of copying in the getter.'],
      followUps: ['Which other array methods mutate in place?', 'What do `toSorted()` and `toReversed()` return?'],
      modelAnswer: 'The getter calls `sort()` directly on `products.value`, and `sort` mutates in place. So the computed changes its own source, which reorders the list for everyone and can re-trigger dependents — that explains both symptoms. Getters must be pure. I\'d copy first, `[...products.value].sort(...)`, or use ES2023 `toSorted()`, which returns a new array.',
    },
    {
      id: 'computed-writable-vmodel',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A child component receives `modelValue` as a prop and wants to use `v-model` on an internal `<input>`. You cannot mutate props. How can a writable computed solve this?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { computed } from 'vue'
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <input v-model="value" />
</template>`,
      },
      answer: 'Make a writable computed whose getter returns the prop and whose setter emits `update:modelValue`. `v-model="value"` on the input then reads from the parent and writes back by emitting, so the parent stays the owner of the data. In Vue 3.4+, `defineModel()` generates this pattern for you.',
      explanation: 'The writable computed is an adapter: it looks like a normal ref to the template, but writes are redirected to whoever really owns the data.',
      whyAsked: 'Shows whether you know writable computeds have a real use beyond the textbook full-name example, and whether you respect one-way data flow.',
      mistakes: ['Mutating the prop directly.', 'Copying the prop into a local ref and forgetting to keep it in sync when the parent changes it.'],
      followUps: ['What does `defineModel()` (3.4+) do differently?', 'What goes wrong if the child copies the prop into a ref once?'],
      modelAnswer: 'Props are read-only in the child, so I\'d wrap the prop in a writable computed: the getter returns `props.modelValue` and the setter emits `update:modelValue` with the new value. Binding `v-model` to that computed gives the input a normal two-way binding, while the parent still owns the state — one-way data flow is preserved. Since Vue 3.4, `defineModel()` does this for me, but it\'s the same idea underneath.',
    },
    {
      id: 'computed-stability',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Since Vue 3.4, computed values only trigger their dependents when the value actually changes. Why can a getter that returns a new object every time defeat this, and what can you do about it?',
      code: {
        lang: 'js',
        code: `// Always "changed": a new object on every run
const summary = computed(() => ({ isEven: count.value % 2 === 0 }))

// Stable alternative 1: return a primitive
const isEven = computed(() => count.value % 2 === 0)

// Stable alternative 2 (3.4+): reuse the previous object when nothing changed
const summary2 = computed((previous) => {
  const next = { isEven: count.value % 2 === 0 }
  return previous && previous.isEven === next.isEven ? previous : next
})`,
      },
      answer: 'The comparison is `Object.is(old, new)`. A freshly created object is never identical to the previous one, so every recompute counts as a change and all dependents re-run. Return primitives where possible, split the computed into smaller ones, or (3.4+) use the `previous` argument to return the old object when the meaningful content is the same.',
      explanation: 'Stability lets a cheap computed act as a firewall: lots of upstream changes, few downstream re-renders — but only if "same result" is detectable by identity.',
      whyAsked: 'Senior-level question about performance and how the reactivity graph propagates changes.',
      mistakes: ['Claiming Vue deep-compares computed results.', 'Not knowing that the comparison happens after recomputation (the getter still runs).'],
      followUps: ['Does the getter still run when the result is unchanged?', 'How would you find which component re-renders too often?'],
      modelAnswer: 'When a dependency changes, the computed re-runs its getter and, since 3.4, compares the new result with the old using `Object.is`. Only if they differ does it notify its dependents. That makes a computed like `isEven` a great firewall. But if the getter builds a new object or array each time, identity always differs, so everything downstream re-runs anyway. I\'d return primitives, split it into smaller computeds, or use the `previous` argument to return the old object when nothing meaningful changed.',
    },
    {
      id: 'computed-coding-search',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 7,
      question: 'Implement a product search: typing in `.search` filters the `.product` items by name, **case-insensitively** and ignoring leading/trailing spaces. `.summary` shows `"N results"`. When nothing matches, show `<p class="empty">No products match</p>`.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const query = ref('')
const products = ref([
  { id: 1, name: 'Red T-shirt' },
  { id: 2, name: 'Blue jeans' },
  { id: 3, name: 'Red sneakers' },
  { id: 4, name: 'Green cap' },
])
</script>

<template>
  <input v-model="query" class="search" placeholder="Search products" />
  <ul>
    <li v-for="p in products" :key="p.id" class="product">{{ p.name }}</li>
  </ul>
  <p class="summary">4 results</p>
</template>`,
        },
      },
      tests: [
        { name: 'shows all 4 products at first', code: `expect(findAll('.product')).toHaveLength(4)` },
        {
          name: 'typing "red" shows 2 products',
          code: `await type('.search', 'red')
expect(findAll('.product')).toHaveLength(2)
expect(text('.summary')).toBe('2 results')`,
        },
        {
          name: 'search is case-insensitive and trimmed',
          code: `await type('.search', '  BLUE ')
expect(findAll('.product')).toHaveLength(1)
expect(text('.product')).toBe('Blue jeans')`,
        },
        {
          name: 'no match shows the empty message',
          code: `await type('.search', 'zzz')
expect(findAll('.product')).toHaveLength(0)
expect(exists('.empty')).toBe(true)
expect(text('.summary')).toBe('0 results')`,
        },
      ],
      hints: [
        'Add `computed` to the import and create `const results = computed(() => …)`.',
        'Normalise once: `const q = query.value.trim().toLowerCase()`, then `products.value.filter((p) => p.name.toLowerCase().includes(q))`.',
        'Loop over `results` in the `v-for`, show `{{ results.length }} results`, and add `<p v-if="results.length === 0" class="empty">`.',
      ],
      answer: 'One computed `results` filters `products` by the normalised query; the list, the summary and the empty message are all derived from it.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const query = ref('')
const products = ref([
  { id: 1, name: 'Red T-shirt' },
  { id: 2, name: 'Blue jeans' },
  { id: 3, name: 'Red sneakers' },
  { id: 4, name: 'Green cap' },
])

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return products.value.filter((p) => p.name.toLowerCase().includes(q))
})
</script>

<template>
  <input v-model="query" class="search" placeholder="Search products" />
  <ul>
    <li v-for="p in results" :key="p.id" class="product">{{ p.name }}</li>
  </ul>
  <p class="summary">{{ results.length }} results</p>
  <p v-if="results.length === 0" class="empty">No products match</p>
</template>`,
        },
      },
      explanation: 'A single derived value feeds three pieces of UI, so they can never disagree. An empty query matches everything because every string includes `\'\'`.',
      whyAsked: 'A classic warm-up: do you reach for a computed (derived state) rather than a watcher that rewrites a second array on every keystroke?',
      mistakes: ['Using `watch(query, …)` to fill a `filtered` ref.', 'Filtering inside the template with a long inline expression.', 'Mutating `products` with `splice` while filtering.'],
      followUps: ['How would you add sorting by name?', 'The list has 50,000 items and typing feels slow — what would you do?'],
      modelAnswer: 'I\'d keep `query` and `products` as the only state and derive `results` with a computed that trims and lowercases the query once and filters by `includes`. The `v-for`, the count and the empty state all read `results`, so they stay consistent. For huge lists I\'d debounce the query input or virtualise the list — the computed itself stays the same.',
    },
  ],

  takeaways: [
    '`computed(() => …)` defines derived state: a value calculated from other reactive state, read with `.value` in JS and unwrapped in templates.',
    'It is lazy and cached: the getter runs on first read and again only after a reactive dependency changes.',
    'Methods in templates re-run on every render; computeds don\'t. Watchers are for side effects, not values.',
    'Getters must be pure: no requests, no mutations (copy before `sort`), no async.',
    'Computeds are read-only unless you pass `{ get, set }`; a setter should update the source state.',
    'Vue 3.4+: getters receive the previous value, and a computed only notifies dependents when its value really changed.',
  ],
}
